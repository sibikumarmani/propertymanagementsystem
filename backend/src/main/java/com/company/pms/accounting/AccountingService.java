package com.company.pms.accounting;

import com.company.pms.owner.*;
import com.company.pms.property.*;
import com.company.pms.purchaseexpense.*;
import com.company.pms.rentbilling.*;
import com.company.pms.security.SecurityContextService;
import com.company.pms.tenant.*;
import com.company.pms.unit.*;
import com.company.pms.vendor.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class AccountingService {
    private static final BigDecimal ZERO = BigDecimal.ZERO;
    private final AccountingRepository accountingRepository;
    private final InvoiceRepository invoiceRepository;
    private final ReceiptRepository receiptRepository;
    private final SecurityDepositRepository securityDepositRepository;
    private final VendorInvoiceRepository vendorInvoiceRepository;
    private final PropertyExpenseRepository expenseRepository;
    private final TenantRepository tenantRepository;
    private final OwnerRepository ownerRepository;
    private final OwnerPropertyRepository ownerPropertyRepository;
    private final VendorRepository vendorRepository;
    private final PropertyRepository propertyRepository;
    private final UnitRepository unitRepository;
    private final SecurityContextService securityContextService;

    public AccountingService(AccountingRepository accountingRepository, InvoiceRepository invoiceRepository, ReceiptRepository receiptRepository, SecurityDepositRepository securityDepositRepository, VendorInvoiceRepository vendorInvoiceRepository, PropertyExpenseRepository expenseRepository, TenantRepository tenantRepository, OwnerRepository ownerRepository, OwnerPropertyRepository ownerPropertyRepository, VendorRepository vendorRepository, PropertyRepository propertyRepository, UnitRepository unitRepository, SecurityContextService securityContextService) {
        this.accountingRepository = accountingRepository;
        this.invoiceRepository = invoiceRepository;
        this.receiptRepository = receiptRepository;
        this.securityDepositRepository = securityDepositRepository;
        this.vendorInvoiceRepository = vendorInvoiceRepository;
        this.expenseRepository = expenseRepository;
        this.tenantRepository = tenantRepository;
        this.ownerRepository = ownerRepository;
        this.ownerPropertyRepository = ownerPropertyRepository;
        this.vendorRepository = vendorRepository;
        this.propertyRepository = propertyRepository;
        this.unitRepository = unitRepository;
        this.securityContextService = securityContextService;
    }

    @Transactional
    public AccountingPostResponse postAccounting() {
        Long companyId = securityContextService.getCurrentCompanyId();
        accountingRepository.deleteAllByCompanyId(companyId);
        List<AccountingEntryEntity> entries = new ArrayList<>();
        invoiceRepository.findAllByCompanyIdOrderByInvoiceDateDescIdDesc(companyId).stream()
            .filter(invoice -> !"CANCELLED".equals(invoice.getStatus()))
            .forEach(invoice -> postInvoice(entries, invoice));
        receiptRepository.findAllByCompanyIdOrderByReceiptDateDescIdDesc(companyId).stream()
            .filter(receipt -> "POSTED".equals(receipt.getStatus()))
            .forEach(receipt -> postReceipt(entries, receipt));
        securityDepositRepository.findAllByCompanyIdOrderByUpdatedAtDescIdDesc(companyId).stream()
            .filter(deposit -> deposit.getCollectedAmount().compareTo(ZERO) > 0)
            .forEach(deposit -> add(entries, companyId, LocalDate.now(), "SECURITY_DEPOSIT_LIABILITY", "TENANT", deposit.getTenantId(), deposit.getPropertyId(), deposit.getUnitId(), "SECURITY_DEPOSIT", deposit.getId(), deposit.getDepositNumber(), "Security deposit liability", ZERO, deposit.getCollectedAmount()));
        vendorInvoiceRepository.findAllByCompanyIdOrderByIdDesc(companyId).stream()
            .filter(invoice -> !"CANCELLED".equals(invoice.getStatus()))
            .forEach(invoice -> {
                add(entries, companyId, invoice.getInvoiceDate(), "VENDOR_LEDGER", "VENDOR", invoice.getVendorId(), invoice.getPropertyId(), invoice.getUnitId(), "VENDOR_BILL", invoice.getId(), invoice.getInvoiceNumber(), "Vendor bill payable", ZERO, invoice.getInvoiceAmount());
                if (invoice.getPaidAmount().compareTo(ZERO) > 0) add(entries, companyId, invoice.getInvoiceDate(), "CASH_BANK", "VENDOR", invoice.getVendorId(), invoice.getPropertyId(), invoice.getUnitId(), "VENDOR_PAYMENT", invoice.getId(), invoice.getInvoiceNumber(), "Vendor payment", invoice.getPaidAmount(), ZERO);
            });
        expenseRepository.findAllByCompanyIdOrderByExpenseDateDescIdDesc(companyId).stream()
            .filter(expense -> !"CANCELLED".equals(expense.getStatus()))
            .forEach(expense -> add(entries, companyId, expense.getExpenseDate(), "EXPENSE", expense.getVendorId() == null ? null : "VENDOR", expense.getVendorId(), expense.getPropertyId(), expense.getUnitId(), "EXPENSE", expense.getId(), expense.getExpenseNumber(), expense.getDescription(), expense.getAmount(), ZERO));
        accountingRepository.saveAll(entries);
        return new AccountingPostResponse(entries.size());
    }

    @Transactional(readOnly = true)
    public List<AccountingEntryDto> entries(String accountType, String partyType, Long partyId) {
        Long companyId = securityContextService.getCurrentCompanyId();
        List<AccountingEntryEntity> rows = partyType != null && partyId != null
            ? accountingRepository.findAllByCompanyIdAndPartyTypeAndPartyIdOrderByEntryDateAscIdAsc(companyId, partyType.toUpperCase(), partyId)
            : accountType != null
                ? accountingRepository.findAllByCompanyIdAndAccountTypeOrderByEntryDateDescIdDesc(companyId, accountType.toUpperCase())
                : accountingRepository.findAllByCompanyIdOrderByEntryDateDescIdDesc(companyId);
        return toDtos(rows);
    }

    @Transactional(readOnly = true)
    public AccountingSummaryDto summary() {
        List<AccountingEntryDto> rows = entries(null, null, null);
        BigDecimal rentReceivable = balance(rows, "RENT_RECEIVABLE");
        BigDecimal advance = rows.stream().filter(row -> "ADVANCE_RECEIVED".equals(row.accountType())).map(row -> row.creditAmount().subtract(row.debitAmount())).reduce(ZERO, BigDecimal::add);
        BigDecimal deposit = rows.stream().filter(row -> "SECURITY_DEPOSIT_LIABILITY".equals(row.accountType())).map(row -> row.creditAmount().subtract(row.debitAmount())).reduce(ZERO, BigDecimal::add);
        BigDecimal income = rows.stream().filter(row -> "RENT_INCOME".equals(row.accountType())).map(row -> row.creditAmount()).reduce(ZERO, BigDecimal::add);
        BigDecimal expenses = rows.stream().filter(row -> "EXPENSE".equals(row.accountType())).map(row -> row.debitAmount()).reduce(ZERO, BigDecimal::add);
        BigDecimal tax = rows.stream().filter(row -> "TAX_PAYABLE".equals(row.accountType())).map(row -> row.creditAmount().subtract(row.debitAmount())).reduce(ZERO, BigDecimal::add);
        return new AccountingSummaryDto(rentReceivable, advance, deposit, income, expenses, tax, income.subtract(expenses), groupByProperty(rows));
    }

    @Transactional(readOnly = true)
    public List<AccountingReportRowDto> report(String type) {
        List<AccountingEntryDto> rows = entries(null, null, null);
        return switch ((type == null ? "" : type).toUpperCase()) {
            case "RENT_RECEIVABLE", "OUTSTANDING" -> group(rows.stream().filter(row -> "RENT_RECEIVABLE".equals(row.accountType())).toList(), row -> row.partyId() == null ? "NONE" : String.valueOf(row.partyId()), row -> row.partyName() == null ? "Tenant" : row.partyName());
            case "COLLECTION" -> group(rows.stream().filter(row -> "CASH_BANK".equals(row.accountType())).toList(), row -> row.sourceReference(), AccountingEntryDto::sourceReference);
            case "EXPENSE" -> group(rows.stream().filter(row -> "EXPENSE".equals(row.accountType())).toList(), row -> row.propertyId() == null ? "NONE" : String.valueOf(row.propertyId()), row -> row.propertyName() == null ? "Property" : row.propertyName());
            case "PROPERTY_PNL" -> groupByProperty(rows);
            case "TENANT_LEDGER" -> group(rows.stream().filter(row -> "TENANT".equals(row.partyType())).toList(), row -> String.valueOf(row.partyId()), row -> row.partyName() == null ? "Tenant" : row.partyName());
            case "OWNER_STATEMENT" -> group(rows.stream().filter(row -> "OWNER".equals(row.partyType())).toList(), row -> String.valueOf(row.partyId()), row -> row.partyName() == null ? "Owner" : row.partyName());
            case "VENDOR_OUTSTANDING" -> group(rows.stream().filter(row -> "VENDOR".equals(row.partyType())).toList(), row -> String.valueOf(row.partyId()), row -> row.partyName() == null ? "Vendor" : row.partyName());
            default -> group(rows, AccountingEntryDto::accountType, row -> row.accountType());
        };
    }

    private void postInvoice(List<AccountingEntryEntity> entries, InvoiceEntity invoice) {
        add(entries, invoice.getCompanyId(), invoice.getInvoiceDate(), "RENT_RECEIVABLE", "TENANT", invoice.getTenantId(), invoice.getPropertyId(), invoice.getUnitId(), "INVOICE", invoice.getId(), invoice.getInvoiceNumber(), invoice.getDescription(), invoice.getTotalAmount(), ZERO);
        add(entries, invoice.getCompanyId(), invoice.getInvoiceDate(), "RENT_INCOME", null, null, invoice.getPropertyId(), invoice.getUnitId(), "INVOICE", invoice.getId(), invoice.getInvoiceNumber(), "Rent income", ZERO, invoice.getSubtotalAmount().add(invoice.getLateFeeAmount()));
        if (invoice.getTaxAmount().compareTo(ZERO) > 0) add(entries, invoice.getCompanyId(), invoice.getInvoiceDate(), "TAX_PAYABLE", null, null, invoice.getPropertyId(), invoice.getUnitId(), "INVOICE", invoice.getId(), invoice.getInvoiceNumber(), "Tax posting", ZERO, invoice.getTaxAmount());
        if (invoice.getDiscountAmount().compareTo(ZERO) > 0) add(entries, invoice.getCompanyId(), invoice.getInvoiceDate(), "RENT_DISCOUNT", "TENANT", invoice.getTenantId(), invoice.getPropertyId(), invoice.getUnitId(), "INVOICE", invoice.getId(), invoice.getInvoiceNumber(), "Rent discount", invoice.getDiscountAmount(), ZERO);
        postOwnerShare(entries, invoice.getCompanyId(), invoice.getInvoiceDate(), invoice.getPropertyId(), invoice.getUnitId(), invoice.getId(), invoice.getInvoiceNumber(), invoice.getSubtotalAmount());
    }

    private void postReceipt(List<AccountingEntryEntity> entries, ReceiptEntity receipt) {
        add(entries, receipt.getCompanyId(), receipt.getReceiptDate(), "CASH_BANK", "TENANT", receipt.getTenantId(), null, null, "RECEIPT", receipt.getId(), receipt.getReceiptNumber(), receipt.getRemarks(), receipt.getAmount(), ZERO);
        BigDecimal applied = receipt.getAmount().subtract(receipt.getAdvanceAmount());
        if (applied.compareTo(ZERO) > 0) add(entries, receipt.getCompanyId(), receipt.getReceiptDate(), "RENT_RECEIVABLE", "TENANT", receipt.getTenantId(), null, null, "RECEIPT", receipt.getId(), receipt.getReceiptNumber(), "Receipt applied", ZERO, applied);
        if (receipt.getAdvanceAmount().compareTo(ZERO) > 0) add(entries, receipt.getCompanyId(), receipt.getReceiptDate(), "ADVANCE_RECEIVED", "TENANT", receipt.getTenantId(), null, null, "RECEIPT", receipt.getId(), receipt.getReceiptNumber(), "Advance received", ZERO, receipt.getAdvanceAmount());
    }

    private void postOwnerShare(List<AccountingEntryEntity> entries, Long companyId, LocalDate date, Long propertyId, Long unitId, Long sourceId, String reference, BigDecimal income) {
        List<OwnerPropertyEntity> links = ownerPropertyRepository.findAllByPropertyIdIn(List.of(propertyId));
        Map<Long, OwnerEntity> owners = ownerRepository.findAllById(links.stream().map(OwnerPropertyEntity::getOwnerId).distinct().toList()).stream().collect(Collectors.toMap(OwnerEntity::getId, Function.identity()));
        for (OwnerPropertyEntity link : links) {
            OwnerEntity owner = owners.get(link.getOwnerId());
            if (owner == null) continue;
            BigDecimal pct = owner.getOwnershipPercentage() == null ? new BigDecimal("100") : owner.getOwnershipPercentage();
            add(entries, companyId, date, "OWNER_LEDGER", "OWNER", owner.getId(), propertyId, unitId, "OWNER_SHARE", sourceId, reference, "Owner income share", ZERO, income.multiply(pct).divide(new BigDecimal("100")));
        }
    }

    private void add(List<AccountingEntryEntity> entries, Long companyId, LocalDate date, String account, String partyType, Long partyId, Long propertyId, Long unitId, String sourceType, Long sourceId, String reference, String description, BigDecimal debit, BigDecimal credit) {
        AccountingEntryEntity entry = new AccountingEntryEntity();
        entry.setCompanyId(companyId); entry.setEntryDate(date); entry.setAccountType(account); entry.setPartyType(partyType); entry.setPartyId(partyId); entry.setPropertyId(propertyId); entry.setUnitId(unitId); entry.setSourceType(sourceType); entry.setSourceId(sourceId); entry.setSourceReference(reference); entry.setDescription(description); entry.setDebitAmount(debit == null ? ZERO : debit); entry.setCreditAmount(credit == null ? ZERO : credit); entry.setReconciled(false);
        entries.add(entry);
    }

    private List<AccountingEntryDto> toDtos(List<AccountingEntryEntity> rows) {
        Map<Long, TenantEntity> tenants = tenantRepository.findAllById(ids(rows, "TENANT")).stream().collect(Collectors.toMap(TenantEntity::getId, Function.identity()));
        Map<Long, OwnerEntity> owners = ownerRepository.findAllById(ids(rows, "OWNER")).stream().collect(Collectors.toMap(OwnerEntity::getId, Function.identity()));
        Map<Long, VendorEntity> vendors = vendorRepository.findAllById(ids(rows, "VENDOR")).stream().collect(Collectors.toMap(VendorEntity::getId, Function.identity()));
        Map<Long, PropertyEntity> properties = propertyRepository.findAllById(rows.stream().map(AccountingEntryEntity::getPropertyId).filter(Objects::nonNull).distinct().toList()).stream().collect(Collectors.toMap(PropertyEntity::getId, Function.identity()));
        Map<Long, UnitEntity> units = unitRepository.findAllById(rows.stream().map(AccountingEntryEntity::getUnitId).filter(Objects::nonNull).distinct().toList()).stream().collect(Collectors.toMap(UnitEntity::getId, Function.identity()));
        return rows.stream().map(row -> {
            String partyName = partyName(row, tenants, owners, vendors);
            PropertyEntity property = properties.get(row.getPropertyId());
            UnitEntity unit = units.get(row.getUnitId());
            return new AccountingEntryDto(row.getId(), row.getCompanyId(), row.getEntryDate(), row.getAccountType(), row.getPartyType(), row.getPartyId(), partyName, row.getPropertyId(), property == null ? null : property.getPropertyName(), row.getUnitId(), unit == null ? null : unit.getUnitNumber(), row.getSourceType(), row.getSourceId(), row.getSourceReference(), row.getDescription(), row.getDebitAmount(), row.getCreditAmount(), row.getDebitAmount().subtract(row.getCreditAmount()), row.getReconciled());
        }).toList();
    }

    private List<Long> ids(List<AccountingEntryEntity> rows, String partyType) { return rows.stream().filter(row -> partyType.equals(row.getPartyType())).map(AccountingEntryEntity::getPartyId).filter(Objects::nonNull).distinct().toList(); }
    private String partyName(AccountingEntryEntity row, Map<Long, TenantEntity> tenants, Map<Long, OwnerEntity> owners, Map<Long, VendorEntity> vendors) {
        if ("TENANT".equals(row.getPartyType()) && tenants.containsKey(row.getPartyId())) { TenantEntity t = tenants.get(row.getPartyId()); return t.getCompanyName() != null ? t.getCompanyName() : List.of(t.getFirstName(), t.getLastName()).stream().filter(Objects::nonNull).collect(Collectors.joining(" ")); }
        if ("OWNER".equals(row.getPartyType()) && owners.containsKey(row.getPartyId())) return owners.get(row.getPartyId()).getOwnerName();
        if ("VENDOR".equals(row.getPartyType()) && vendors.containsKey(row.getPartyId())) return vendors.get(row.getPartyId()).getVendorName();
        return null;
    }
    private BigDecimal balance(List<AccountingEntryDto> rows, String account) { return rows.stream().filter(row -> account.equals(row.accountType())).map(row -> row.debitAmount().subtract(row.creditAmount())).reduce(ZERO, BigDecimal::add); }
    private List<AccountingReportRowDto> groupByProperty(List<AccountingEntryDto> rows) { return group(rows.stream().filter(row -> List.of("RENT_INCOME", "EXPENSE").contains(row.accountType())).toList(), row -> row.propertyId() == null ? "NONE" : String.valueOf(row.propertyId()), row -> row.propertyName() == null ? "Property" : row.propertyName()); }
    private List<AccountingReportRowDto> group(List<AccountingEntryDto> rows, Function<AccountingEntryDto, String> keyFn, Function<AccountingEntryDto, String> labelFn) {
        return rows.stream().collect(Collectors.groupingBy(keyFn, LinkedHashMap::new, Collectors.toList())).entrySet().stream().map(e -> {
            BigDecimal debit = e.getValue().stream().map(AccountingEntryDto::debitAmount).reduce(ZERO, BigDecimal::add);
            BigDecimal credit = e.getValue().stream().map(AccountingEntryDto::creditAmount).reduce(ZERO, BigDecimal::add);
            return new AccountingReportRowDto(e.getKey(), labelFn.apply(e.getValue().get(0)), debit, credit, credit.subtract(debit));
        }).toList();
    }
}
