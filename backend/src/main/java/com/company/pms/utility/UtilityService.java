package com.company.pms.utility;

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
import java.math.RoundingMode;
import java.util.List;
import java.util.Locale;

@Service
public class UtilityService {
    private static final BigDecimal ZERO = BigDecimal.ZERO;
    private static final List<String> CATEGORIES = List.of("ELECTRICITY", "WATER", "GAS", "INTERNET", "PARKING", "WASTE_MANAGEMENT", "OTHER");
    private static final List<String> BILLING_METHODS = List.of("FIXED", "USAGE_BASED", "FIXED_PLUS_USAGE");
    private static final List<String> TYPE_STATUSES = List.of("ACTIVE", "INACTIVE");
    private static final List<String> READING_STATUSES = List.of("RECORDED", "VERIFIED", "DISPUTED", "CANCELLED");
    private static final List<String> BILL_STATUSES = List.of("DRAFT", "APPROVED", "POSTED", "PARTIALLY_PAID", "PAID", "OVERDUE", "CANCELLED");
    private static final List<String> UNITS_OF_MEASURE = List.of("KWH", "KL", "LITRE", "CUBIC_METER", "MBPS", "MONTH", "SLOT", "TRIP", "UNIT");

    private final UtilityTypeRepository utilityTypeRepository;
    private final MeterReadingRepository meterReadingRepository;
    private final UtilityBillRepository utilityBillRepository;
    private final PropertyRepository propertyRepository;
    private final UnitRepository unitRepository;
    private final TenantRepository tenantRepository;
    private final SecurityContextService securityContextService;

    public UtilityService(
        UtilityTypeRepository utilityTypeRepository,
        MeterReadingRepository meterReadingRepository,
        UtilityBillRepository utilityBillRepository,
        PropertyRepository propertyRepository,
        UnitRepository unitRepository,
        TenantRepository tenantRepository,
        SecurityContextService securityContextService
    ) {
        this.utilityTypeRepository = utilityTypeRepository;
        this.meterReadingRepository = meterReadingRepository;
        this.utilityBillRepository = utilityBillRepository;
        this.propertyRepository = propertyRepository;
        this.unitRepository = unitRepository;
        this.tenantRepository = tenantRepository;
        this.securityContextService = securityContextService;
    }

    @Transactional(readOnly = true)
    public UtilityOptionsDto getOptions() {
        return new UtilityOptionsDto(CATEGORIES, BILLING_METHODS, TYPE_STATUSES, READING_STATUSES, BILL_STATUSES, UNITS_OF_MEASURE);
    }

    @Transactional(readOnly = true)
    public List<UtilityTypeDto> getTypes() {
        Long companyId = securityContextService.getCurrentCompanyId();
        return utilityTypeRepository.findAllByCompanyIdOrderByTypeNameAscIdAsc(companyId).stream().map(this::toTypeDto).toList();
    }

    @Transactional
    public UtilityTypeDto createType(UtilityTypeUpsertRequest request) {
        Long companyId = securityContextService.getCurrentCompanyId();
        String typeCode = normalizeCode(request.typeCode(), "Utility type code");
        if (utilityTypeRepository.existsByCompanyIdAndTypeCodeIgnoreCase(companyId, typeCode)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Utility type code already exists");
        }
        UtilityTypeEntity entity = new UtilityTypeEntity();
        applyType(entity, request, companyId, typeCode);
        return toTypeDto(utilityTypeRepository.save(entity));
    }

    @Transactional
    public UtilityTypeDto updateType(Long id, UtilityTypeUpsertRequest request) {
        Long companyId = securityContextService.getCurrentCompanyId();
        UtilityTypeEntity entity = requireType(id, companyId);
        String typeCode = normalizeCode(request.typeCode(), "Utility type code");
        if (utilityTypeRepository.existsByCompanyIdAndTypeCodeIgnoreCaseAndIdNot(companyId, typeCode, id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Utility type code already exists");
        }
        applyType(entity, request, companyId, typeCode);
        return toTypeDto(utilityTypeRepository.save(entity));
    }

    @Transactional
    public void deleteType(Long id) {
        utilityTypeRepository.delete(requireType(id, securityContextService.getCurrentCompanyId()));
    }

    @Transactional(readOnly = true)
    public List<MeterReadingDto> getReadings() {
        Long companyId = securityContextService.getCurrentCompanyId();
        return meterReadingRepository.findAllByCompanyIdOrderByReadingDateDescIdDesc(companyId).stream().map(this::toReadingDto).toList();
    }

    @Transactional
    public MeterReadingDto createReading(MeterReadingUpsertRequest request) {
        Long companyId = securityContextService.getCurrentCompanyId();
        String readingNumber = normalizeCode(request.readingNumber(), "Reading number");
        if (meterReadingRepository.existsByCompanyIdAndReadingNumberIgnoreCase(companyId, readingNumber)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Reading number already exists");
        }
        MeterReadingEntity entity = new MeterReadingEntity();
        applyReading(entity, request, companyId, readingNumber);
        return toReadingDto(meterReadingRepository.save(entity));
    }

    @Transactional
    public MeterReadingDto updateReading(Long id, MeterReadingUpsertRequest request) {
        Long companyId = securityContextService.getCurrentCompanyId();
        MeterReadingEntity entity = requireReading(id, companyId);
        String readingNumber = normalizeCode(request.readingNumber(), "Reading number");
        if (meterReadingRepository.existsByCompanyIdAndReadingNumberIgnoreCaseAndIdNot(companyId, readingNumber, id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Reading number already exists");
        }
        applyReading(entity, request, companyId, readingNumber);
        return toReadingDto(meterReadingRepository.save(entity));
    }

    @Transactional
    public void deleteReading(Long id) {
        meterReadingRepository.delete(requireReading(id, securityContextService.getCurrentCompanyId()));
    }

    @Transactional(readOnly = true)
    public List<UtilityBillDto> getBills() {
        Long companyId = securityContextService.getCurrentCompanyId();
        return utilityBillRepository.findAllByCompanyIdOrderByBillDateDescIdDesc(companyId).stream().map(this::toBillDto).toList();
    }

    @Transactional
    public UtilityBillDto createBill(UtilityBillUpsertRequest request) {
        Long companyId = securityContextService.getCurrentCompanyId();
        String billNumber = normalizeCode(request.billNumber(), "Bill number");
        if (utilityBillRepository.existsByCompanyIdAndBillNumberIgnoreCase(companyId, billNumber)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Bill number already exists");
        }
        UtilityBillEntity entity = new UtilityBillEntity();
        applyBill(entity, request, companyId, billNumber);
        return toBillDto(utilityBillRepository.save(entity));
    }

    @Transactional
    public UtilityBillDto updateBill(Long id, UtilityBillUpsertRequest request) {
        Long companyId = securityContextService.getCurrentCompanyId();
        UtilityBillEntity entity = requireBill(id, companyId);
        String billNumber = normalizeCode(request.billNumber(), "Bill number");
        if (utilityBillRepository.existsByCompanyIdAndBillNumberIgnoreCaseAndIdNot(companyId, billNumber, id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Bill number already exists");
        }
        applyBill(entity, request, companyId, billNumber);
        return toBillDto(utilityBillRepository.save(entity));
    }

    @Transactional
    public UtilityBillDto updateBillStatus(Long id, String status) {
        UtilityBillEntity bill = requireBill(id, securityContextService.getCurrentCompanyId());
        bill.setStatus(status);
        return toBillDto(utilityBillRepository.save(bill));
    }

    @Transactional
    public void deleteBill(Long id) {
        utilityBillRepository.delete(requireBill(id, securityContextService.getCurrentCompanyId()));
    }

    private void applyType(UtilityTypeEntity entity, UtilityTypeUpsertRequest request, Long companyId, String typeCode) {
        String category = normalizeOption(request.category(), CATEGORIES, "Utility category");
        String billingMethod = normalizeOption(request.billingMethod(), BILLING_METHODS, "Billing method");
        entity.setCompanyId(companyId);
        entity.setTypeCode(typeCode);
        entity.setTypeName(normalizeCode(request.typeName(), "Utility type name"));
        entity.setCategory(category);
        entity.setBillingMethod(billingMethod);
        entity.setUnitOfMeasure(normalizeNullable(request.unitOfMeasure()));
        entity.setDefaultRate(nonNegativeOrZero(request.defaultRate(), "Default rate"));
        entity.setFixedCharge(nonNegativeOrZero(request.fixedCharge(), "Fixed charge"));
        entity.setCommonArea(Boolean.TRUE.equals(request.commonArea()));
        entity.setStatus(normalizeOption(request.status(), TYPE_STATUSES, "Status"));
        entity.setDescription(normalizeNullable(request.description()));
    }

    private void applyReading(MeterReadingEntity entity, MeterReadingUpsertRequest request, Long companyId, String readingNumber) {
        requireType(request.utilityTypeId(), companyId);
        PropertyEntity property = requireProperty(request.propertyId(), companyId);
        UnitEntity unit = request.unitId() == null ? null : requireUnit(request.unitId(), companyId);
        TenantEntity tenant = request.tenantId() == null ? null : requireTenant(request.tenantId(), companyId);
        if (unit != null && !unit.getPropertyId().equals(property.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unit must belong to selected property");
        }
        BigDecimal previous = nonNegativeOrZero(request.previousReading(), "Previous reading");
        BigDecimal current = nonNegativeOrZero(request.currentReading(), "Current reading");
        if (current.compareTo(previous) < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Current reading cannot be less than previous reading");
        }
        entity.setCompanyId(companyId);
        entity.setReadingNumber(readingNumber);
        entity.setUtilityTypeId(request.utilityTypeId());
        entity.setPropertyId(property.getId());
        entity.setUnitId(unit == null ? null : unit.getId());
        entity.setTenantId(tenant == null ? null : tenant.getId());
        entity.setMeterNumber(normalizeNullable(request.meterNumber()));
        entity.setReadingDate(request.readingDate());
        entity.setPreviousReading(previous);
        entity.setCurrentReading(current);
        entity.setConsumption(current.subtract(previous));
        entity.setCommonArea(Boolean.TRUE.equals(request.commonArea()));
        entity.setStatus(normalizeOption(request.status(), READING_STATUSES, "Reading status"));
        entity.setRemarks(normalizeNullable(request.remarks()));
    }

    private void applyBill(UtilityBillEntity entity, UtilityBillUpsertRequest request, Long companyId, String billNumber) {
        UtilityTypeEntity type = requireType(request.utilityTypeId(), companyId);
        MeterReadingEntity reading = request.meterReadingId() == null ? null : requireReading(request.meterReadingId(), companyId);
        PropertyEntity property = requireProperty(request.propertyId(), companyId);
        UnitEntity unit = request.unitId() == null ? null : requireUnit(request.unitId(), companyId);
        TenantEntity tenant = request.tenantId() == null ? null : requireTenant(request.tenantId(), companyId);
        if (unit != null && !unit.getPropertyId().equals(property.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unit must belong to selected property");
        }
        if (reading != null && (!reading.getUtilityTypeId().equals(type.getId()) || !reading.getPropertyId().equals(property.getId()))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Meter reading must match the selected utility type and property");
        }
        if (request.billingPeriodEnd().isBefore(request.billingPeriodStart())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Billing period end must be after period start");
        }
        String billingMethod = normalizeOption(request.billingMethod(), BILLING_METHODS, "Billing method");
        BigDecimal consumption = request.consumption() == null && reading != null ? reading.getConsumption() : nonNegativeOrZero(request.consumption(), "Consumption");
        BigDecimal rate = request.rate() == null ? type.getDefaultRate() : nonNegativeOrZero(request.rate(), "Rate");
        BigDecimal fixedCharge = request.fixedCharge() == null ? type.getFixedCharge() : nonNegativeOrZero(request.fixedCharge(), "Fixed charge");
        BigDecimal usageAmount = billingMethod.equals("FIXED") ? ZERO : consumption.multiply(rate).setScale(2, RoundingMode.HALF_UP);
        if (billingMethod.equals("USAGE_BASED")) {
            fixedCharge = ZERO;
        }
        BigDecimal commonAreaAmount = nonNegativeOrZero(request.commonAreaAmount(), "Common area amount");
        BigDecimal taxAmount = nonNegativeOrZero(request.taxAmount(), "Tax amount");
        BigDecimal paidAmount = nonNegativeOrZero(request.paidAmount(), "Paid amount");
        BigDecimal totalAmount = fixedCharge.add(usageAmount).add(commonAreaAmount).add(taxAmount);
        if (paidAmount.compareTo(totalAmount) > 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Paid amount cannot exceed total amount");
        }
        entity.setCompanyId(companyId);
        entity.setBillNumber(billNumber);
        entity.setUtilityTypeId(type.getId());
        entity.setMeterReadingId(reading == null ? null : reading.getId());
        entity.setTenantId(tenant == null ? null : tenant.getId());
        entity.setPropertyId(property.getId());
        entity.setUnitId(unit == null ? null : unit.getId());
        entity.setBillDate(request.billDate());
        entity.setDueDate(request.dueDate());
        entity.setBillingPeriodStart(request.billingPeriodStart());
        entity.setBillingPeriodEnd(request.billingPeriodEnd());
        entity.setBillingMethod(billingMethod);
        entity.setConsumption(consumption);
        entity.setRate(rate);
        entity.setFixedCharge(fixedCharge);
        entity.setUsageAmount(usageAmount);
        entity.setCommonAreaAmount(commonAreaAmount);
        entity.setTaxAmount(taxAmount);
        entity.setTotalAmount(totalAmount);
        entity.setPaidAmount(paidAmount);
        entity.setDueAmount(totalAmount.subtract(paidAmount));
        entity.setStatus(normalizeOption(request.status(), BILL_STATUSES, "Bill status"));
        entity.setRemarks(normalizeNullable(request.remarks()));
    }

    private UtilityTypeEntity requireType(Long id, Long companyId) {
        return utilityTypeRepository.findByIdAndCompanyId(id, companyId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utility type not found"));
    }

    private MeterReadingEntity requireReading(Long id, Long companyId) {
        return meterReadingRepository.findByIdAndCompanyId(id, companyId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Meter reading not found"));
    }

    private UtilityBillEntity requireBill(Long id, Long companyId) {
        return utilityBillRepository.findByIdAndCompanyId(id, companyId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utility bill not found"));
    }

    private PropertyEntity requireProperty(Long id, Long companyId) {
        return propertyRepository.findByIdAndCompanyId(id, companyId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Property not found"));
    }

    private UnitEntity requireUnit(Long id, Long companyId) {
        return unitRepository.findByIdAndCompanyId(id, companyId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Unit not found"));
    }

    private TenantEntity requireTenant(Long id, Long companyId) {
        return tenantRepository.findByIdAndCompanyId(id, companyId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tenant not found"));
    }

    private UtilityTypeDto toTypeDto(UtilityTypeEntity entity) {
        return new UtilityTypeDto(entity.getId(), entity.getCompanyId(), entity.getTypeCode(), entity.getTypeName(), entity.getCategory(), entity.getBillingMethod(), entity.getUnitOfMeasure(), entity.getDefaultRate(), entity.getFixedCharge(), entity.getCommonArea(), entity.getStatus(), entity.getDescription());
    }

    private MeterReadingDto toReadingDto(MeterReadingEntity entity) {
        UtilityTypeEntity type = utilityTypeRepository.findById(entity.getUtilityTypeId()).orElse(null);
        PropertyEntity property = propertyRepository.findById(entity.getPropertyId()).orElse(null);
        UnitEntity unit = entity.getUnitId() == null ? null : unitRepository.findById(entity.getUnitId()).orElse(null);
        TenantEntity tenant = entity.getTenantId() == null ? null : tenantRepository.findById(entity.getTenantId()).orElse(null);
        return new MeterReadingDto(entity.getId(), entity.getCompanyId(), entity.getReadingNumber(), entity.getUtilityTypeId(), type == null ? null : type.getTypeName(), type == null ? null : type.getCategory(), entity.getPropertyId(), property == null ? null : property.getPropertyName(), entity.getUnitId(), unit == null ? null : unit.getUnitNumber(), entity.getTenantId(), displayTenant(tenant), entity.getMeterNumber(), entity.getReadingDate(), entity.getPreviousReading(), entity.getCurrentReading(), entity.getConsumption(), entity.getCommonArea(), entity.getStatus(), entity.getRemarks());
    }

    private UtilityBillDto toBillDto(UtilityBillEntity entity) {
        UtilityTypeEntity type = utilityTypeRepository.findById(entity.getUtilityTypeId()).orElse(null);
        MeterReadingEntity reading = entity.getMeterReadingId() == null ? null : meterReadingRepository.findById(entity.getMeterReadingId()).orElse(null);
        PropertyEntity property = propertyRepository.findById(entity.getPropertyId()).orElse(null);
        UnitEntity unit = entity.getUnitId() == null ? null : unitRepository.findById(entity.getUnitId()).orElse(null);
        TenantEntity tenant = entity.getTenantId() == null ? null : tenantRepository.findById(entity.getTenantId()).orElse(null);
        return new UtilityBillDto(entity.getId(), entity.getCompanyId(), entity.getBillNumber(), entity.getUtilityTypeId(), type == null ? null : type.getTypeName(), type == null ? null : type.getCategory(), entity.getMeterReadingId(), reading == null ? null : reading.getReadingNumber(), entity.getTenantId(), displayTenant(tenant), entity.getPropertyId(), property == null ? null : property.getPropertyName(), entity.getUnitId(), unit == null ? null : unit.getUnitNumber(), entity.getBillDate(), entity.getDueDate(), entity.getBillingPeriodStart(), entity.getBillingPeriodEnd(), entity.getBillingMethod(), entity.getConsumption(), entity.getRate(), entity.getFixedCharge(), entity.getUsageAmount(), entity.getCommonAreaAmount(), entity.getTaxAmount(), entity.getTotalAmount(), entity.getPaidAmount(), entity.getDueAmount(), entity.getStatus(), entity.getRemarks());
    }

    private String displayTenant(TenantEntity tenant) {
        if (tenant == null) {
            return null;
        }
        if (tenant.getCompanyName() != null && !tenant.getCompanyName().isBlank()) {
            return tenant.getCompanyName();
        }
        return (normalizeNullable(tenant.getFirstName()) + " " + normalizeNullable(tenant.getLastName())).trim();
    }

    private String normalizeCode(String value, String label) {
        String normalized = normalizeNullable(value);
        if (normalized == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, label + " is required");
        }
        return normalized;
    }

    private String normalizeNullable(String value) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }
        return value.trim();
    }

    private String normalizeOption(String value, List<String> allowed, String label) {
        String normalized = normalizeCode(value, label).toUpperCase(Locale.ENGLISH);
        if (!allowed.contains(normalized)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid " + label.toLowerCase(Locale.ENGLISH));
        }
        return normalized;
    }

    private BigDecimal nonNegativeOrZero(BigDecimal value, String label) {
        BigDecimal normalized = value == null ? ZERO : value;
        if (normalized.compareTo(ZERO) < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, label + " cannot be negative");
        }
        return normalized;
    }
}
