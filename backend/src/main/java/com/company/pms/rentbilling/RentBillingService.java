package com.company.pms.rentbilling;

import com.company.pms.lease.LeaseEntity;
import com.company.pms.lease.LeaseRepository;
import com.company.pms.notification.NotificationService;
import com.company.pms.audit.AuditLogService;
import com.company.pms.property.PropertyEntity;
import com.company.pms.property.PropertyRepository;
import com.company.pms.security.SecurityContextService;
import com.company.pms.tenant.TenantEntity;
import com.company.pms.tenant.TenantRepository;
import com.company.pms.unit.UnitEntity;
import com.company.pms.unit.UnitRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class RentBillingService {
    private static final BigDecimal ZERO = BigDecimal.ZERO;
    private static final List<String> SCHEDULE_STATUSES = List.of("PENDING", "INVOICED", "PARTIALLY_PAID", "PAID", "OVERDUE", "CANCELLED");
    private static final List<String> INVOICE_STATUSES = List.of("DRAFT", "APPROVED", "SENT", "PARTIALLY_PAID", "PAID", "OVERDUE", "CANCELLED");
    private static final List<String> INVOICE_TYPES = List.of("RENT", "MAINTENANCE", "UTILITY", "DEPOSIT", "PENALTY", "OTHER");
    private static final List<String> PAYMENT_MODES = List.of("CASH", "BANK_TRANSFER", "CHEQUE", "UPI", "CARD", "ONLINE_PAYMENT_GATEWAY");

    private final RentScheduleRepository rentScheduleRepository;
    private final InvoiceRepository invoiceRepository;
    private final ReceiptRepository receiptRepository;
    private final SecurityDepositRepository securityDepositRepository;
    private final SecurityDepositTransactionRepository securityDepositTransactionRepository;
    private final LeaseRepository leaseRepository;
    private final TenantRepository tenantRepository;
    private final PropertyRepository propertyRepository;
    private final UnitRepository unitRepository;
    private final SecurityContextService securityContextService;
    private final NotificationService notificationService;
    private final AuditLogService auditLogService;

    public RentBillingService(
        RentScheduleRepository rentScheduleRepository,
        InvoiceRepository invoiceRepository,
        ReceiptRepository receiptRepository,
        SecurityDepositRepository securityDepositRepository,
        SecurityDepositTransactionRepository securityDepositTransactionRepository,
        LeaseRepository leaseRepository,
        TenantRepository tenantRepository,
        PropertyRepository propertyRepository,
        UnitRepository unitRepository,
        SecurityContextService securityContextService,
        NotificationService notificationService,
        AuditLogService auditLogService
    ) {
        this.rentScheduleRepository = rentScheduleRepository;
        this.invoiceRepository = invoiceRepository;
        this.receiptRepository = receiptRepository;
        this.securityDepositRepository = securityDepositRepository;
        this.securityDepositTransactionRepository = securityDepositTransactionRepository;
        this.leaseRepository = leaseRepository;
        this.tenantRepository = tenantRepository;
        this.propertyRepository = propertyRepository;
        this.unitRepository = unitRepository;
        this.securityContextService = securityContextService;
        this.notificationService = notificationService;
        this.auditLogService = auditLogService;
    }

    @Transactional(readOnly = true)
    public RentBillingOptionsDto getOptions() {
        return new RentBillingOptionsDto(SCHEDULE_STATUSES, INVOICE_STATUSES, INVOICE_TYPES, PAYMENT_MODES);
    }

    @Transactional(readOnly = true)
    public List<RentScheduleDto> getSchedules() {
        Long companyId = securityContextService.getCurrentCompanyId();
        List<RentScheduleEntity> schedules = rentScheduleRepository.findAllByCompanyIdOrderByDueDateDescIdDesc(companyId);
        return schedules.stream().map(this::toScheduleDto).toList();
    }

    @Transactional(readOnly = true)
    public List<InvoiceDto> getInvoices() {
        Long companyId = securityContextService.getCurrentCompanyId();
        return invoiceRepository.findAllByCompanyIdOrderByInvoiceDateDescIdDesc(companyId).stream().map(this::toInvoiceDto).toList();
    }

    @Transactional(readOnly = true)
    public List<ReceiptDto> getReceipts() {
        Long companyId = securityContextService.getCurrentCompanyId();
        return receiptRepository.findAllByCompanyIdOrderByReceiptDateDescIdDesc(companyId).stream().map(this::toReceiptDto).toList();
    }

    @Transactional(readOnly = true)
    public List<SecurityDepositDto> getSecurityDeposits() {
        Long companyId = securityContextService.getCurrentCompanyId();
        return securityDepositRepository.findAllByCompanyIdOrderByUpdatedAtDescIdDesc(companyId).stream().map(this::toSecurityDepositDto).toList();
    }

    @Transactional(readOnly = true)
    public List<SecurityDepositTransactionDto> getSecurityDepositHistory(Long depositId) {
        Long companyId = securityContextService.getCurrentCompanyId();
        requireSecurityDeposit(depositId, companyId);
        return securityDepositTransactionRepository.findAllByCompanyIdAndSecurityDepositIdOrderByTransactionDateDescIdDesc(companyId, depositId).stream()
            .map(this::toSecurityDepositTransactionDto)
            .toList();
    }

    @Transactional
    public SecurityDepositDto createSecurityDeposit(SecurityDepositCreateRequest request) {
        Long companyId = securityContextService.getCurrentCompanyId();
        LeaseEntity lease = requireLease(request.leaseId(), companyId);
        if (securityDepositRepository.findByLeaseIdAndCompanyId(lease.getId(), companyId).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Security deposit already exists for this lease");
        }
        String depositNumber = normalizeCode(request.depositNumber(), "Deposit number");
        if (securityDepositRepository.existsByCompanyIdAndDepositNumberIgnoreCase(companyId, depositNumber)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Deposit number already exists");
        }
        SecurityDepositEntity deposit = new SecurityDepositEntity();
        deposit.setCompanyId(companyId);
        deposit.setLeaseId(lease.getId());
        deposit.setTenantId(lease.getTenantId());
        deposit.setPropertyId(lease.getPropertyId());
        deposit.setUnitId(lease.getUnitId());
        deposit.setDepositNumber(depositNumber);
        deposit.setDepositAmount(lease.getSecurityDepositAmount());
        deposit.setCollectedAmount(ZERO);
        deposit.setAdjustedAmount(ZERO);
        deposit.setRefundedAmount(ZERO);
        deposit.setRefundableAmount(ZERO);
        deposit.setStatus("PENDING");
        deposit.setRemarks(normalizeText(request.remarks()));
        SecurityDepositEntity saved = securityDepositRepository.save(deposit);
        recordDepositTransaction(saved, "CREATED", lease.getSecurityDepositAmount(), null, null, null, "Deposit captured from lease");
        return toSecurityDepositDto(saved);
    }

    @Transactional
    public InvoiceDto generateDepositInvoice(Long depositId) {
        Long companyId = securityContextService.getCurrentCompanyId();
        SecurityDepositEntity deposit = requireSecurityDeposit(depositId, companyId);
        if (deposit.getDepositInvoiceId() != null) {
            return toInvoiceDto(requireInvoice(deposit.getDepositInvoiceId(), companyId));
        }
        InvoiceEntity invoice = new InvoiceEntity();
        invoice.setCompanyId(companyId);
        invoice.setInvoiceNumber(deposit.getDepositNumber() + "-INV");
        invoice.setInvoiceType("DEPOSIT");
        invoice.setLeaseId(deposit.getLeaseId());
        invoice.setTenantId(deposit.getTenantId());
        invoice.setPropertyId(deposit.getPropertyId());
        invoice.setUnitId(deposit.getUnitId());
        invoice.setInvoiceDate(LocalDate.now());
        invoice.setDueDate(LocalDate.now());
        invoice.setSubtotalAmount(deposit.getDepositAmount());
        invoice.setTaxAmount(ZERO);
        invoice.setDiscountAmount(ZERO);
        invoice.setLateFeeAmount(ZERO);
        invoice.setDescription("Security deposit invoice");
        recalculateInvoice(invoice);
        invoice.setStatus("DRAFT");
        InvoiceEntity saved = invoiceRepository.save(invoice);
        deposit.setDepositInvoiceId(saved.getId());
        securityDepositRepository.save(deposit);
        recordDepositTransaction(deposit, "INVOICED", deposit.getDepositAmount(), saved.getId(), null, null, "Deposit invoice generated");
        return toInvoiceDto(saved);
    }

    @Transactional
    public SecurityDepositDto collectSecurityDeposit(Long depositId, SecurityDepositActionRequest request) {
        Long companyId = securityContextService.getCurrentCompanyId();
        SecurityDepositEntity deposit = requireSecurityDeposit(depositId, companyId);
        BigDecimal amount = nonNegative(request.amount(), "Collection amount");
        deposit.setCollectedAmount(deposit.getCollectedAmount().add(amount));
        recalculateDeposit(deposit);
        if (request.receiptId() != null) {
            deposit.setDepositReceiptId(request.receiptId());
        }
        SecurityDepositEntity saved = securityDepositRepository.save(deposit);
        recordDepositTransaction(saved, "COLLECTED", amount, request.invoiceId(), request.receiptId(), request.referenceNumber(), request.remarks());
        return toSecurityDepositDto(saved);
    }

    @Transactional
    public SecurityDepositDto adjustSecurityDeposit(Long depositId, SecurityDepositActionRequest request) {
        Long companyId = securityContextService.getCurrentCompanyId();
        SecurityDepositEntity deposit = requireSecurityDeposit(depositId, companyId);
        BigDecimal amount = nonNegative(request.amount(), "Adjustment amount");
        if (amount.compareTo(deposit.getRefundableAmount()) > 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Adjustment cannot exceed refundable amount");
        }
        deposit.setAdjustedAmount(deposit.getAdjustedAmount().add(amount));
        recalculateDeposit(deposit);
        SecurityDepositEntity saved = securityDepositRepository.save(deposit);
        recordDepositTransaction(saved, "ADJUSTED", amount, request.invoiceId(), request.receiptId(), request.referenceNumber(), request.remarks());
        return toSecurityDepositDto(saved);
    }

    @Transactional
    public SecurityDepositDto refundSecurityDeposit(Long depositId, SecurityDepositActionRequest request) {
        Long companyId = securityContextService.getCurrentCompanyId();
        SecurityDepositEntity deposit = requireSecurityDeposit(depositId, companyId);
        BigDecimal amount = nonNegative(request.amount(), "Refund amount");
        if (amount.compareTo(deposit.getRefundableAmount()) > 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Refund cannot exceed refundable amount");
        }
        deposit.setRefundedAmount(deposit.getRefundedAmount().add(amount));
        recalculateDeposit(deposit);
        SecurityDepositEntity saved = securityDepositRepository.save(deposit);
        recordDepositTransaction(saved, "REFUNDED", amount, request.invoiceId(), request.receiptId(), request.referenceNumber(), request.remarks());
        return toSecurityDepositDto(saved);
    }

    @Transactional
    public List<RentScheduleDto> generateSchedules(GenerateRentScheduleRequest request) {
        Long companyId = securityContextService.getCurrentCompanyId();
        LeaseEntity lease = requireLease(request.leaseId(), companyId);
        if (!List.of("ACTIVE", "APPROVED").contains(lease.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only active or approved leases can generate rent schedules");
        }
        LocalDate cursor = maxDate(request.fromDate() == null ? lease.getLeaseStartDate() : request.fromDate(), lease.getLeaseStartDate());
        LocalDate finalDate = minDate(request.toDate() == null ? lease.getLeaseEndDate() : request.toDate(), lease.getLeaseEndDate());
        if (finalDate.isBefore(cursor)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Schedule end date must be after start date");
        }
        int months = billingMonths(lease.getBillingCycle());
        int sequence = 1;
        while (!cursor.isAfter(finalDate)) {
            LocalDate periodEnd = cursor.plusMonths(months).minusDays(1);
            if (periodEnd.isAfter(finalDate)) {
                periodEnd = finalDate;
            }
            if (!rentScheduleRepository.existsByLeaseIdAndBillingPeriodStartAndBillingPeriodEnd(lease.getId(), cursor, periodEnd)) {
                RentScheduleEntity schedule = new RentScheduleEntity();
                schedule.setCompanyId(companyId);
                schedule.setLeaseId(lease.getId());
                schedule.setTenantId(lease.getTenantId());
                schedule.setPropertyId(lease.getPropertyId());
                schedule.setUnitId(lease.getUnitId());
                schedule.setScheduleNumber(lease.getLeaseNumber() + "-RS-" + String.format("%03d", sequence));
                schedule.setBillingPeriodStart(cursor);
                schedule.setBillingPeriodEnd(periodEnd);
                schedule.setDueDate(dueDate(cursor, lease.getDueDay()));
                schedule.setRentAmount(lease.getRentAmount());
                schedule.setLateFeeAmount(nonNegativeOrZero(request.lateFeeAmount()));
                schedule.setPaidAmount(ZERO);
                schedule.setDueAmount(lease.getRentAmount().add(schedule.getLateFeeAmount()));
                schedule.setStatus(schedule.getDueDate().isBefore(LocalDate.now()) ? "OVERDUE" : "PENDING");
                rentScheduleRepository.save(schedule);
            }
            cursor = periodEnd.plusDays(1);
            sequence++;
        }
        return getSchedules();
    }

    @Transactional
    public InvoiceDto createInvoiceFromSchedule(Long scheduleId) {
        Long companyId = securityContextService.getCurrentCompanyId();
        RentScheduleEntity schedule = requireSchedule(scheduleId, companyId);
        if (schedule.getInvoiceId() != null) {
            return toInvoiceDto(requireInvoice(schedule.getInvoiceId(), companyId));
        }
        InvoiceEntity invoice = new InvoiceEntity();
        invoice.setCompanyId(companyId);
        invoice.setInvoiceNumber(schedule.getScheduleNumber().replace("-RS-", "-INV-"));
        invoice.setInvoiceType("RENT");
        invoice.setLeaseId(schedule.getLeaseId());
        invoice.setRentScheduleId(schedule.getId());
        invoice.setTenantId(schedule.getTenantId());
        invoice.setPropertyId(schedule.getPropertyId());
        invoice.setUnitId(schedule.getUnitId());
        invoice.setInvoiceDate(LocalDate.now());
        invoice.setDueDate(schedule.getDueDate());
        invoice.setSubtotalAmount(schedule.getRentAmount());
        invoice.setTaxAmount(ZERO);
        invoice.setDiscountAmount(ZERO);
        invoice.setLateFeeAmount(schedule.getLateFeeAmount());
        invoice.setDescription("Rent invoice for " + schedule.getBillingPeriodStart() + " to " + schedule.getBillingPeriodEnd());
        recalculateInvoice(invoice);
        invoice.setStatus(invoice.getDueDate().isBefore(LocalDate.now()) ? "OVERDUE" : "DRAFT");
        InvoiceEntity saved = invoiceRepository.save(invoice);
        schedule.setInvoiceId(saved.getId());
        schedule.setStatus("INVOICED");
        rentScheduleRepository.save(schedule);
        return toInvoiceDto(saved);
    }

    @Transactional
    public InvoiceDto createInvoice(InvoiceUpsertRequest request) {
        Long companyId = securityContextService.getCurrentCompanyId();
        String invoiceNumber = normalizeCode(request.invoiceNumber(), "Invoice number");
        if (invoiceRepository.existsByCompanyIdAndInvoiceNumberIgnoreCase(companyId, invoiceNumber)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Invoice number already exists");
        }
        TenantEntity tenant = requireTenant(request.tenantId(), companyId);
        InvoiceEntity invoice = new InvoiceEntity();
        applyInvoice(invoice, request, companyId, invoiceNumber, tenant.getId());
        return toInvoiceDto(invoiceRepository.save(invoice));
    }

    @Transactional
    public InvoiceDto approveInvoice(Long id) {
        InvoiceDto invoice = updateInvoiceStatus(id, "APPROVED");
        notificationService.sendWorkflowNotification(invoice.companyId(), "APPROVAL_NOTIFICATION", "Invoice approved", "Invoice %s has been approved.".formatted(invoice.invoiceNumber()), "INVOICE", invoice.id(), "NORMAL");
        return invoice;
    }

    @Transactional
    public InvoiceDto sendInvoice(Long id) {
        return updateInvoiceStatus(id, "SENT");
    }

    @Transactional
    public InvoiceDto cancelInvoice(Long id) {
        return updateInvoiceStatus(id, "CANCELLED");
    }

    @Transactional
    public ReceiptDto createReceipt(ReceiptCreateRequest request) {
        Long companyId = securityContextService.getCurrentCompanyId();
        String receiptNumber = normalizeCode(request.receiptNumber(), "Receipt number");
        if (receiptRepository.existsByCompanyIdAndReceiptNumberIgnoreCase(companyId, receiptNumber)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Receipt number already exists");
        }
        TenantEntity tenant = requireTenant(request.tenantId(), companyId);
        InvoiceEntity invoice = request.invoiceId() == null ? null : requireInvoice(request.invoiceId(), companyId);
        if (invoice != null && !invoice.getTenantId().equals(tenant.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Receipt tenant must match invoice tenant");
        }
        BigDecimal amount = nonNegative(request.amount(), "Receipt amount");
        BigDecimal applied = invoice == null ? ZERO : amount.min(invoice.getDueAmount());
        BigDecimal advance = invoice == null ? amount : amount.subtract(applied);
        if (invoice != null) {
            invoice.setPaidAmount(invoice.getPaidAmount().add(applied));
            invoice.setDueAmount(invoice.getTotalAmount().subtract(invoice.getPaidAmount()).max(ZERO));
            invoice.setStatus(invoice.getDueAmount().compareTo(ZERO) == 0 ? "PAID" : "PARTIALLY_PAID");
            invoiceRepository.save(invoice);
            syncSchedulePayment(invoice);
        }
        ReceiptEntity receipt = new ReceiptEntity();
        receipt.setCompanyId(companyId);
        receipt.setReceiptNumber(receiptNumber);
        receipt.setInvoiceId(invoice == null ? null : invoice.getId());
        receipt.setTenantId(tenant.getId());
        receipt.setReceiptDate(request.receiptDate());
        receipt.setPaymentMode(normalizeChoice(request.paymentMode(), PAYMENT_MODES, "Payment mode"));
        receipt.setAmount(amount);
        receipt.setAdvanceAmount(advance);
        receipt.setReferenceNumber(normalizeText(request.referenceNumber()));
        receipt.setRemarks(normalizeText(request.remarks()));
        receipt.setPdfDocument(request.pdfDocument());
        receipt.setStatus("POSTED");
        ReceiptDto saved = toReceiptDto(receiptRepository.save(receipt));
        auditLogService.log("Payment received", "Rent & Billing", "RECEIPT", saved.id(), null, saved);
        notificationService.sendWorkflowNotification(companyId, "PAYMENT_CONFIRMATION", "Payment received", "Receipt %s was posted for amount %s.".formatted(saved.receiptNumber(), saved.amount()), "RECEIPT", saved.id(), "NORMAL");
        return saved;
    }

    private InvoiceDto updateInvoiceStatus(Long id, String status) {
        Long companyId = securityContextService.getCurrentCompanyId();
        InvoiceEntity invoice = requireInvoice(id, companyId);
        if ("CANCELLED".equals(invoice.getStatus()) || "PAID".equals(invoice.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Paid or cancelled invoices cannot be changed");
        }
        String oldStatus = invoice.getStatus();
        invoice.setStatus(status);
        InvoiceDto saved = toInvoiceDto(invoiceRepository.save(invoice));
        if ("CANCELLED".equals(status)) {
            auditLogService.log("Invoice cancelled", "Rent & Billing", "INVOICE", saved.id(), "status=" + oldStatus, saved);
        }
        return saved;
    }

    private void applyInvoice(InvoiceEntity invoice, InvoiceUpsertRequest request, Long companyId, String invoiceNumber, Long tenantId) {
        invoice.setCompanyId(companyId);
        invoice.setInvoiceNumber(invoiceNumber);
        invoice.setInvoiceType(normalizeChoice(request.invoiceType(), INVOICE_TYPES, "Invoice type"));
        invoice.setLeaseId(validateOptionalLease(request.leaseId(), companyId));
        invoice.setRentScheduleId(request.rentScheduleId());
        invoice.setTenantId(tenantId);
        invoice.setPropertyId(request.propertyId());
        invoice.setUnitId(request.unitId());
        invoice.setInvoiceDate(request.invoiceDate());
        invoice.setDueDate(request.dueDate());
        invoice.setSubtotalAmount(nonNegative(request.subtotalAmount(), "Subtotal amount"));
        invoice.setTaxAmount(nonNegativeOrZero(request.taxAmount()));
        invoice.setDiscountAmount(nonNegativeOrZero(request.discountAmount()));
        invoice.setLateFeeAmount(nonNegativeOrZero(request.lateFeeAmount()));
        invoice.setStatus(normalizeChoice(request.status(), INVOICE_STATUSES, "Invoice status"));
        invoice.setDescription(normalizeText(request.description()));
        invoice.setPdfDocument(request.pdfDocument());
        recalculateInvoice(invoice);
    }

    private void recalculateInvoice(InvoiceEntity invoice) {
        BigDecimal total = invoice.getSubtotalAmount().add(invoice.getTaxAmount()).add(invoice.getLateFeeAmount()).subtract(invoice.getDiscountAmount());
        if (total.compareTo(ZERO) < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invoice total cannot be negative");
        }
        invoice.setTotalAmount(total);
        invoice.setPaidAmount(invoice.getPaidAmount() == null ? ZERO : invoice.getPaidAmount());
        invoice.setDueAmount(total.subtract(invoice.getPaidAmount()).max(ZERO));
    }

    private void syncSchedulePayment(InvoiceEntity invoice) {
        if (invoice.getRentScheduleId() == null) {
            return;
        }
        rentScheduleRepository.findById(invoice.getRentScheduleId()).ifPresent(schedule -> {
            schedule.setPaidAmount(invoice.getPaidAmount());
            schedule.setDueAmount(invoice.getDueAmount());
            schedule.setStatus(invoice.getDueAmount().compareTo(ZERO) == 0 ? "PAID" : "PARTIALLY_PAID");
            rentScheduleRepository.save(schedule);
        });
    }

    private RentScheduleDto toScheduleDto(RentScheduleEntity schedule) {
        LeaseEntity lease = leaseRepository.findById(schedule.getLeaseId()).orElse(null);
        TenantEntity tenant = tenantRepository.findById(schedule.getTenantId()).orElse(null);
        PropertyEntity property = propertyRepository.findById(schedule.getPropertyId()).orElse(null);
        UnitEntity unit = unitRepository.findById(schedule.getUnitId()).orElse(null);
        return new RentScheduleDto(schedule.getId(), schedule.getCompanyId(), schedule.getLeaseId(), lease == null ? null : lease.getLeaseNumber(), schedule.getTenantId(), displayTenant(tenant), schedule.getPropertyId(), property == null ? null : property.getPropertyName(), schedule.getUnitId(), unit == null ? null : unit.getUnitNumber(), schedule.getScheduleNumber(), schedule.getBillingPeriodStart(), schedule.getBillingPeriodEnd(), schedule.getDueDate(), schedule.getRentAmount(), schedule.getLateFeeAmount(), schedule.getPaidAmount(), schedule.getDueAmount(), schedule.getInvoiceId(), schedule.getStatus());
    }

    private InvoiceDto toInvoiceDto(InvoiceEntity invoice) {
        LeaseEntity lease = invoice.getLeaseId() == null ? null : leaseRepository.findById(invoice.getLeaseId()).orElse(null);
        TenantEntity tenant = tenantRepository.findById(invoice.getTenantId()).orElse(null);
        PropertyEntity property = invoice.getPropertyId() == null ? null : propertyRepository.findById(invoice.getPropertyId()).orElse(null);
        UnitEntity unit = invoice.getUnitId() == null ? null : unitRepository.findById(invoice.getUnitId()).orElse(null);
        return new InvoiceDto(invoice.getId(), invoice.getCompanyId(), invoice.getInvoiceNumber(), invoice.getInvoiceType(), invoice.getLeaseId(), lease == null ? null : lease.getLeaseNumber(), invoice.getRentScheduleId(), invoice.getTenantId(), displayTenant(tenant), invoice.getPropertyId(), property == null ? null : property.getPropertyName(), invoice.getUnitId(), unit == null ? null : unit.getUnitNumber(), invoice.getInvoiceDate(), invoice.getDueDate(), invoice.getSubtotalAmount(), invoice.getTaxAmount(), invoice.getDiscountAmount(), invoice.getLateFeeAmount(), invoice.getTotalAmount(), invoice.getPaidAmount(), invoice.getDueAmount(), invoice.getStatus(), invoice.getDescription(), invoice.getPdfDocument());
    }

    private ReceiptDto toReceiptDto(ReceiptEntity receipt) {
        InvoiceEntity invoice = receipt.getInvoiceId() == null ? null : invoiceRepository.findById(receipt.getInvoiceId()).orElse(null);
        TenantEntity tenant = tenantRepository.findById(receipt.getTenantId()).orElse(null);
        return new ReceiptDto(receipt.getId(), receipt.getCompanyId(), receipt.getReceiptNumber(), receipt.getInvoiceId(), invoice == null ? null : invoice.getInvoiceNumber(), receipt.getTenantId(), displayTenant(tenant), receipt.getReceiptDate(), receipt.getPaymentMode(), receipt.getAmount(), receipt.getAdvanceAmount(), receipt.getReferenceNumber(), receipt.getRemarks(), receipt.getPdfDocument(), receipt.getStatus());
    }

    private SecurityDepositDto toSecurityDepositDto(SecurityDepositEntity deposit) {
        LeaseEntity lease = leaseRepository.findById(deposit.getLeaseId()).orElse(null);
        TenantEntity tenant = tenantRepository.findById(deposit.getTenantId()).orElse(null);
        PropertyEntity property = propertyRepository.findById(deposit.getPropertyId()).orElse(null);
        UnitEntity unit = unitRepository.findById(deposit.getUnitId()).orElse(null);
        return new SecurityDepositDto(deposit.getId(), deposit.getCompanyId(), deposit.getLeaseId(), lease == null ? null : lease.getLeaseNumber(), deposit.getTenantId(), displayTenant(tenant), deposit.getPropertyId(), property == null ? null : property.getPropertyName(), deposit.getUnitId(), unit == null ? null : unit.getUnitNumber(), deposit.getDepositNumber(), deposit.getDepositAmount(), deposit.getCollectedAmount(), deposit.getAdjustedAmount(), deposit.getRefundedAmount(), deposit.getRefundableAmount(), deposit.getDepositInvoiceId(), deposit.getDepositReceiptId(), deposit.getStatus(), deposit.getRemarks());
    }

    private SecurityDepositTransactionDto toSecurityDepositTransactionDto(SecurityDepositTransactionEntity tx) {
        return new SecurityDepositTransactionDto(tx.getId(), tx.getCompanyId(), tx.getSecurityDepositId(), tx.getTransactionType(), tx.getTransactionDate(), tx.getAmount(), tx.getInvoiceId(), tx.getReceiptId(), tx.getReferenceNumber(), tx.getRemarks());
    }

    private SecurityDepositEntity requireSecurityDeposit(Long id, Long companyId) {
        return securityDepositRepository.findByIdAndCompanyId(id, companyId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Security deposit not found"));
    }

    private void recalculateDeposit(SecurityDepositEntity deposit) {
        BigDecimal refundable = deposit.getCollectedAmount().subtract(deposit.getAdjustedAmount()).subtract(deposit.getRefundedAmount());
        deposit.setRefundableAmount(refundable.max(ZERO));
        if (deposit.getRefundableAmount().compareTo(ZERO) == 0 && deposit.getCollectedAmount().compareTo(ZERO) > 0) {
            deposit.setStatus("CLOSED");
        } else if (deposit.getCollectedAmount().compareTo(deposit.getDepositAmount()) >= 0) {
            deposit.setStatus("COLLECTED");
        } else if (deposit.getCollectedAmount().compareTo(ZERO) > 0) {
            deposit.setStatus("PARTIALLY_COLLECTED");
        } else {
            deposit.setStatus("PENDING");
        }
    }

    private void recordDepositTransaction(SecurityDepositEntity deposit, String type, BigDecimal amount, Long invoiceId, Long receiptId, String referenceNumber, String remarks) {
        SecurityDepositTransactionEntity tx = new SecurityDepositTransactionEntity();
        tx.setCompanyId(deposit.getCompanyId());
        tx.setSecurityDepositId(deposit.getId());
        tx.setTransactionType(type);
        tx.setTransactionDate(LocalDate.now());
        tx.setAmount(amount);
        tx.setInvoiceId(invoiceId);
        tx.setReceiptId(receiptId);
        tx.setReferenceNumber(normalizeText(referenceNumber));
        tx.setRemarks(normalizeText(remarks));
        securityDepositTransactionRepository.save(tx);
    }

    private LeaseEntity requireLease(Long leaseId, Long companyId) {
        return leaseRepository.findByIdAndCompanyId(leaseId, companyId).orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selected lease was not found in the active company"));
    }

    private RentScheduleEntity requireSchedule(Long id, Long companyId) {
        return rentScheduleRepository.findByIdAndCompanyId(id, companyId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Rent schedule not found"));
    }

    private InvoiceEntity requireInvoice(Long id, Long companyId) {
        return invoiceRepository.findByIdAndCompanyId(id, companyId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Invoice not found"));
    }

    private TenantEntity requireTenant(Long tenantId, Long companyId) {
        return tenantRepository.findByIdAndCompanyId(tenantId, companyId).orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selected tenant was not found in the active company"));
    }

    private Long validateOptionalLease(Long leaseId, Long companyId) {
        return leaseId == null ? null : requireLease(leaseId, companyId).getId();
    }

    private int billingMonths(String cycle) {
        return switch (cycle) {
            case "QUARTERLY" -> 3;
            case "HALF_YEARLY" -> 6;
            case "YEARLY" -> 12;
            default -> 1;
        };
    }

    private LocalDate dueDate(LocalDate periodStart, int dueDay) {
        int day = Math.min(Math.max(dueDay, 1), periodStart.lengthOfMonth());
        return periodStart.withDayOfMonth(day);
    }

    private LocalDate minDate(LocalDate a, LocalDate b) {
        return a.isBefore(b) ? a : b;
    }

    private LocalDate maxDate(LocalDate a, LocalDate b) {
        return a.isAfter(b) ? a : b;
    }

    private String normalizeCode(String value, String label) {
        return normalizeRequiredText(value, label).toUpperCase(Locale.ENGLISH);
    }

    private String normalizeRequiredText(String value, String label) {
        String normalized = normalizeText(value);
        if (normalized == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, label + " is required");
        }
        return normalized;
    }

    private String normalizeText(String value) {
        return value == null || value.trim().isEmpty() ? null : value.trim();
    }

    private String normalizeChoice(String value, List<String> allowed, String label) {
        String normalized = normalizeRequiredText(value, label).toUpperCase(Locale.ENGLISH);
        if (!allowed.contains(normalized)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, label + " is invalid");
        }
        return normalized;
    }

    private BigDecimal nonNegative(BigDecimal value, String label) {
        if (value == null || value.compareTo(ZERO) < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, label + " cannot be negative");
        }
        return value;
    }

    private BigDecimal nonNegativeOrZero(BigDecimal value) {
        return value == null ? ZERO : nonNegative(value, "Amount");
    }

    private String displayTenant(TenantEntity tenant) {
        if (tenant == null) {
            return null;
        }
        if (tenant.getCompanyName() != null && !tenant.getCompanyName().isBlank()) {
            return tenant.getCompanyName();
        }
        return List.of(tenant.getFirstName(), tenant.getLastName()).stream().filter(Objects::nonNull).filter(part -> !part.isBlank()).collect(Collectors.joining(" "));
    }
}
