package com.company.pms.lease;

import com.company.pms.property.PropertyEntity;
import com.company.pms.property.PropertyRepository;
import com.company.pms.notification.NotificationService;
import com.company.pms.audit.AuditLogService;
import com.company.pms.security.SecurityContextService;
import com.company.pms.tenant.TenantEntity;
import com.company.pms.tenant.TenantRepository;
import com.company.pms.unit.UnitEntity;
import com.company.pms.unit.UnitRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class LeaseService {

    private static final List<String> LEASE_STATUSES = List.of("DRAFT", "PENDING_APPROVAL", "APPROVED", "ACTIVE", "EXPIRED", "TERMINATED", "RENEWED", "CANCELLED");
    private static final List<String> EDITABLE_STATUSES = List.of("DRAFT", "PENDING_APPROVAL", "APPROVED");
    private static final List<String> OCCUPANCY_BLOCKING_STATUSES = List.of("PENDING_APPROVAL", "APPROVED", "ACTIVE");
    private static final List<String> BILLING_CYCLES = List.of("MONTHLY", "QUARTERLY", "HALF_YEARLY", "YEARLY");

    private final LeaseRepository leaseRepository;
    private final LeaseRenewalRepository leaseRenewalRepository;
    private final TenantRepository tenantRepository;
    private final PropertyRepository propertyRepository;
    private final UnitRepository unitRepository;
    private final SecurityContextService securityContextService;
    private final NotificationService notificationService;
    private final AuditLogService auditLogService;
    private final ObjectMapper objectMapper;

    public LeaseService(
        LeaseRepository leaseRepository,
        LeaseRenewalRepository leaseRenewalRepository,
        TenantRepository tenantRepository,
        PropertyRepository propertyRepository,
        UnitRepository unitRepository,
        SecurityContextService securityContextService,
        NotificationService notificationService,
        AuditLogService auditLogService,
        ObjectMapper objectMapper
    ) {
        this.leaseRepository = leaseRepository;
        this.leaseRenewalRepository = leaseRenewalRepository;
        this.tenantRepository = tenantRepository;
        this.propertyRepository = propertyRepository;
        this.unitRepository = unitRepository;
        this.securityContextService = securityContextService;
        this.notificationService = notificationService;
        this.auditLogService = auditLogService;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public List<LeaseDto> getLeases() {
        Long companyId = securityContextService.getCurrentCompanyId();
        List<LeaseEntity> leases = leaseRepository.findAllByCompanyIdOrderByLeaseNumberAscIdAsc(companyId);
        Map<Long, TenantEntity> tenants = tenantRepository.findAllById(leases.stream().map(LeaseEntity::getTenantId).distinct().toList()).stream()
            .collect(Collectors.toMap(TenantEntity::getId, Function.identity()));
        Map<Long, PropertyEntity> properties = propertyRepository.findAllById(leases.stream().map(LeaseEntity::getPropertyId).distinct().toList()).stream()
            .collect(Collectors.toMap(PropertyEntity::getId, Function.identity()));
        Map<Long, UnitEntity> units = unitRepository.findAllById(leases.stream().map(LeaseEntity::getUnitId).distinct().toList()).stream()
            .collect(Collectors.toMap(UnitEntity::getId, Function.identity()));
        return leases.stream().map(lease -> toDto(lease, tenants.get(lease.getTenantId()), properties.get(lease.getPropertyId()), units.get(lease.getUnitId()))).toList();
    }

    @Transactional(readOnly = true)
    public LeaseOptionsDto getOptions() {
        return new LeaseOptionsDto(LEASE_STATUSES, BILLING_CYCLES);
    }

    @Transactional(readOnly = true)
    public List<LeaseRenewalDto> getRenewals(Long leaseId) {
        Long companyId = securityContextService.getCurrentCompanyId();
        requireLease(leaseId, companyId);
        return leaseRenewalRepository.findAllByCompanyIdAndLeaseIdOrderByCreatedAtDescIdDesc(companyId, leaseId).stream()
            .map(this::toRenewalDto)
            .toList();
    }

    @Transactional
    public LeaseDto createLease(LeaseUpsertRequest request) {
        Long companyId = securityContextService.getCurrentCompanyId();
        String leaseNumber = normalizeCode(request.leaseNumber(), "Lease number");
        if (leaseRepository.existsByCompanyIdAndLeaseNumberIgnoreCase(companyId, leaseNumber)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Lease number already exists for the active company");
        }
        TenantEntity tenant = requireTenant(request.tenantId(), companyId);
        UnitEntity unit = requireUnit(request.unitId(), companyId);
        PropertyEntity property = requireProperty(unit.getPropertyId(), companyId);
        validateUnitAvailable(companyId, unit.getId(), null);
        LeaseEntity saved = leaseRepository.save(apply(new LeaseEntity(), request, companyId, leaseNumber, property.getId(), normalizeDraftStatus(request.status())));
        LeaseDto dto = toDto(saved, tenant, property, unit);
        auditLogService.log("Lease created", "Leases", "LEASE", saved.getId(), null, dto);
        return dto;
    }

    @Transactional
    public LeaseDto updateLease(Long id, LeaseUpsertRequest request) {
        Long companyId = securityContextService.getCurrentCompanyId();
        LeaseEntity lease = requireLease(id, companyId);
        if (!EDITABLE_STATUSES.contains(lease.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only draft, pending approval, or approved leases can be edited");
        }
        String leaseNumber = normalizeCode(request.leaseNumber(), "Lease number");
        if (leaseRepository.existsByCompanyIdAndLeaseNumberIgnoreCaseAndIdNot(companyId, leaseNumber, id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Lease number already exists for the active company");
        }
        TenantEntity tenant = requireTenant(request.tenantId(), companyId);
        UnitEntity unit = requireUnit(request.unitId(), companyId);
        PropertyEntity property = requireProperty(unit.getPropertyId(), companyId);
        validateUnitAvailable(companyId, unit.getId(), id);
        LeaseEntity saved = leaseRepository.save(apply(lease, request, companyId, leaseNumber, property.getId(), normalizeDraftStatus(request.status())));
        return toDto(saved, tenant, property, unit);
    }

    @Transactional
    public LeaseDto submitLease(Long id) {
        return updateStatus(id, "PENDING_APPROVAL");
    }

    @Transactional
    public LeaseDto approveLease(Long id) {
        LeaseDto lease = updateStatus(id, "APPROVED");
        notificationService.sendWorkflowNotification(
            lease.companyId(),
            "APPROVAL_NOTIFICATION",
            "Lease approved",
            "Lease %s has been approved.".formatted(lease.leaseNumber()),
            "LEASE",
            lease.id(),
            "NORMAL"
        );
        return lease;
    }

    @Transactional
    public LeaseDto activateLease(Long id) {
        Long companyId = securityContextService.getCurrentCompanyId();
        LeaseEntity lease = requireLease(id, companyId);
        if (!"APPROVED".equals(lease.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only approved leases can be activated");
        }
        UnitEntity unit = requireUnit(lease.getUnitId(), companyId);
        unit.setUnitStatus("OCCUPIED");
        unitRepository.save(unit);
        lease.setStatus("ACTIVE");
        lease.setActivationDate(LocalDate.now());
        LeaseEntity saved = leaseRepository.save(lease);
        return toDto(saved, requireTenant(saved.getTenantId(), companyId), requireProperty(saved.getPropertyId(), companyId), unit);
    }

    @Transactional
    public LeaseDto cancelLease(Long id) {
        return updateStatus(id, "CANCELLED");
    }

    @Transactional
    public LeaseDto renewLease(Long id, LeaseRenewalRequest request) {
        Long companyId = securityContextService.getCurrentCompanyId();
        LeaseEntity lease = requireLease(id, companyId);
        if (!List.of("ACTIVE", "APPROVED").contains(lease.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only active or approved leases can be renewed");
        }
        validateDateRange(request.newStartDate(), request.newEndDate());
        String renewalNumber = normalizeCode(request.renewalNumber(), "Renewal number");
        if (leaseRenewalRepository.existsByCompanyIdAndRenewalNumberIgnoreCase(companyId, renewalNumber)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Renewal number already exists for the active company");
        }
        LeaseRenewalEntity renewal = new LeaseRenewalEntity();
        renewal.setCompanyId(companyId);
        renewal.setLeaseId(lease.getId());
        renewal.setRenewalNumber(renewalNumber);
        renewal.setPreviousStartDate(lease.getLeaseStartDate());
        renewal.setPreviousEndDate(lease.getLeaseEndDate());
        renewal.setNewStartDate(request.newStartDate());
        renewal.setNewEndDate(request.newEndDate());
        renewal.setPreviousRentAmount(lease.getRentAmount());
        renewal.setNewRentAmount(nonNegative(request.newRentAmount(), "New rent amount"));
        renewal.setSecurityDepositAmount(nonNegativeOrNull(request.securityDepositAmount(), "Security deposit amount"));
        renewal.setAgreementDocumentJson(serializeAttachment(normalizeAttachment(request.agreementDocument())));
        renewal.setApprovalStatus("PENDING_APPROVAL");
        renewal.setRenewalNotes(normalizeText(request.renewalNotes()));
        leaseRenewalRepository.save(renewal);

        lease.setLeaseStartDate(request.newStartDate());
        lease.setLeaseEndDate(request.newEndDate());
        lease.setRentAmount(nonNegative(request.newRentAmount(), "New rent amount"));
        if (request.securityDepositAmount() != null) {
            lease.setSecurityDepositAmount(nonNegative(request.securityDepositAmount(), "Security deposit amount"));
        }
        lease.setAgreementDocumentJson(serializeAttachment(normalizeAttachment(request.agreementDocument())));
        lease.setStatus("PENDING_APPROVAL");
        LeaseEntity saved = leaseRepository.save(lease);
        return toDto(saved, requireTenant(saved.getTenantId(), companyId), requireProperty(saved.getPropertyId(), companyId), requireUnit(saved.getUnitId(), companyId));
    }

    @Transactional
    public LeaseDto terminateLease(Long id, LeaseTerminationRequest request) {
        Long companyId = securityContextService.getCurrentCompanyId();
        LeaseEntity lease = requireLease(id, companyId);
        if (!List.of("ACTIVE", "APPROVED").contains(lease.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only active or approved leases can be terminated");
        }
        UnitEntity unit = requireUnit(lease.getUnitId(), companyId);
        unit.setUnitStatus("AVAILABLE");
        unitRepository.save(unit);
        lease.setStatus("TERMINATED");
        lease.setTerminationDate(request.terminationDate());
        lease.setTerminationReason(normalizeRequiredText(request.terminationReason(), "Termination reason"));
        lease.setFinalSettlementAmount(nonNegativeOrNull(request.finalSettlementAmount(), "Final settlement amount"));
        lease.setSecurityDepositRefundAmount(nonNegativeOrNull(request.securityDepositRefundAmount(), "Security deposit refund amount"));
        lease.setTerminationDocumentJson(serializeAttachment(normalizeAttachment(request.terminationDocument())));
        LeaseEntity saved = leaseRepository.save(lease);
        return toDto(saved, requireTenant(saved.getTenantId(), companyId), requireProperty(saved.getPropertyId(), companyId), unit);
    }

    @Transactional
    public void deleteLease(Long id) {
        Long companyId = securityContextService.getCurrentCompanyId();
        LeaseEntity lease = requireLease(id, companyId);
        if ("ACTIVE".equals(lease.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Active leases cannot be deleted. Terminate the lease instead.");
        }
        leaseRepository.delete(lease);
    }

    private LeaseDto updateStatus(Long id, String status) {
        Long companyId = securityContextService.getCurrentCompanyId();
        LeaseEntity lease = requireLease(id, companyId);
        if ("PENDING_APPROVAL".equals(status) && !"DRAFT".equals(lease.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only draft leases can be submitted");
        }
        if ("APPROVED".equals(status) && !"PENDING_APPROVAL".equals(lease.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only pending leases can be approved");
        }
        if ("CANCELLED".equals(status) && List.of("ACTIVE", "TERMINATED", "EXPIRED").contains(lease.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Active, terminated, or expired leases cannot be cancelled");
        }
        lease.setStatus(status);
        LeaseEntity saved = leaseRepository.save(lease);
        return toDto(saved, requireTenant(saved.getTenantId(), companyId), requireProperty(saved.getPropertyId(), companyId), requireUnit(saved.getUnitId(), companyId));
    }

    private LeaseEntity apply(LeaseEntity lease, LeaseUpsertRequest request, Long companyId, String leaseNumber, Long propertyId, String status) {
        validateDateRange(request.leaseStartDate(), request.leaseEndDate());
        lease.setCompanyId(companyId);
        lease.setLeaseNumber(leaseNumber);
        lease.setTenantId(request.tenantId());
        lease.setPropertyId(propertyId);
        lease.setUnitId(request.unitId());
        lease.setLeaseStartDate(request.leaseStartDate());
        lease.setLeaseEndDate(request.leaseEndDate());
        lease.setRentAmount(nonNegative(request.rentAmount(), "Rent amount"));
        lease.setSecurityDepositAmount(nonNegative(request.securityDepositAmount(), "Security deposit"));
        lease.setBillingCycle(normalizeChoice(request.billingCycle(), BILLING_CYCLES, "Billing cycle"));
        lease.setDueDay(request.dueDay());
        lease.setGracePeriodDays(request.gracePeriodDays() == null ? 0 : request.gracePeriodDays());
        lease.setLateFeeRule(normalizeText(request.lateFeeRule()));
        lease.setAgreementDocumentJson(serializeAttachment(normalizeAttachment(request.agreementDocument())));
        lease.setStatus(status);
        return lease;
    }

    private LeaseDto toDto(LeaseEntity lease, TenantEntity tenant, PropertyEntity property, UnitEntity unit) {
        return new LeaseDto(
            lease.getId(),
            lease.getCompanyId(),
            lease.getLeaseNumber(),
            lease.getTenantId(),
            tenant == null ? null : tenant.getTenantCode(),
            tenant == null ? null : tenantDisplayName(tenant),
            lease.getPropertyId(),
            property == null ? null : property.getPropertyCode(),
            property == null ? null : property.getPropertyName(),
            lease.getUnitId(),
            unit == null ? null : unit.getUnitCode(),
            unit == null ? null : unit.getUnitNumber(),
            lease.getLeaseStartDate(),
            lease.getLeaseEndDate(),
            lease.getRentAmount(),
            lease.getSecurityDepositAmount(),
            lease.getBillingCycle(),
            lease.getDueDay(),
            lease.getGracePeriodDays(),
            lease.getLateFeeRule(),
            deserializeAttachment(lease.getAgreementDocumentJson()),
            lease.getStatus(),
            lease.getActivationDate(),
            lease.getTerminationDate(),
            lease.getTerminationReason(),
            lease.getFinalSettlementAmount(),
            lease.getSecurityDepositRefundAmount(),
            deserializeAttachment(lease.getTerminationDocumentJson()),
            lease.getRenewedFromLeaseId()
        );
    }

    private LeaseRenewalDto toRenewalDto(LeaseRenewalEntity renewal) {
        return new LeaseRenewalDto(
            renewal.getId(),
            renewal.getCompanyId(),
            renewal.getLeaseId(),
            renewal.getRenewalNumber(),
            renewal.getPreviousStartDate(),
            renewal.getPreviousEndDate(),
            renewal.getNewStartDate(),
            renewal.getNewEndDate(),
            renewal.getPreviousRentAmount(),
            renewal.getNewRentAmount(),
            renewal.getSecurityDepositAmount(),
            deserializeAttachment(renewal.getAgreementDocumentJson()),
            renewal.getApprovalStatus(),
            renewal.getRenewalNotes()
        );
    }

    private LeaseEntity requireLease(Long leaseId, Long companyId) {
        return leaseRepository.findByIdAndCompanyId(leaseId, companyId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lease not found"));
    }

    private TenantEntity requireTenant(Long tenantId, Long companyId) {
        TenantEntity tenant = tenantRepository.findByIdAndCompanyId(tenantId, companyId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selected tenant was not found in the active company"));
        if ("BLACKLISTED".equals(tenant.getTenantStatus()) || "BLACKLISTED".equals(tenant.getBlacklistStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Blacklisted tenants cannot be leased");
        }
        return tenant;
    }

    private PropertyEntity requireProperty(Long propertyId, Long companyId) {
        return propertyRepository.findByIdAndCompanyId(propertyId, companyId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selected property was not found in the active company"));
    }

    private UnitEntity requireUnit(Long unitId, Long companyId) {
        return unitRepository.findByIdAndCompanyId(unitId, companyId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selected unit was not found in the active company"));
    }

    private void validateUnitAvailable(Long companyId, Long unitId, Long existingLeaseId) {
        boolean blocked = existingLeaseId == null
            ? leaseRepository.existsByCompanyIdAndUnitIdAndStatusIn(companyId, unitId, OCCUPANCY_BLOCKING_STATUSES)
            : leaseRepository.existsByCompanyIdAndUnitIdAndStatusInAndIdNot(companyId, unitId, OCCUPANCY_BLOCKING_STATUSES, existingLeaseId);
        if (blocked) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Selected unit already has a pending, approved, or active lease");
        }
    }

    private void validateDateRange(LocalDate start, LocalDate end) {
        if (start == null || end == null || end.isBefore(start)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Lease end date must be on or after start date");
        }
    }

    private String normalizeDraftStatus(String status) {
        String normalized = normalizeChoice(status, LEASE_STATUSES, "Lease status");
        if ("ACTIVE".equals(normalized)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Use approval and activation workflow to activate a lease");
        }
        return normalized;
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
        if (value == null || value.trim().isEmpty()) {
            return null;
        }
        return value.trim();
    }

    private String normalizeChoice(String value, List<String> allowed, String label) {
        String normalized = normalizeRequiredText(value, label).toUpperCase(Locale.ENGLISH);
        if (!allowed.contains(normalized)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, label + " is invalid");
        }
        return normalized;
    }

    private BigDecimal nonNegative(BigDecimal value, String label) {
        if (value == null || value.compareTo(BigDecimal.ZERO) < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, label + " cannot be negative");
        }
        return value;
    }

    private BigDecimal nonNegativeOrNull(BigDecimal value, String label) {
        return value == null ? null : nonNegative(value, label);
    }

    private LeaseAttachmentDto normalizeAttachment(LeaseAttachmentRequest attachment) {
        if (attachment == null || normalizeText(attachment.dataUrl()) == null) {
            return null;
        }
        return new LeaseAttachmentDto(
            normalizeRequiredText(attachment.fileName(), "Document file name"),
            normalizeText(attachment.contentType()) == null ? "application/octet-stream" : normalizeText(attachment.contentType()),
            normalizeRequiredText(attachment.dataUrl(), "Document data"),
            attachment.fileSize()
        );
    }

    private String serializeAttachment(LeaseAttachmentDto attachment) {
        if (attachment == null) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(attachment);
        } catch (JsonProcessingException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Document could not be saved", exception);
        }
    }

    private LeaseAttachmentDto deserializeAttachment(String json) {
        if (json == null || json.isBlank()) {
            return null;
        }
        try {
            return objectMapper.readValue(json, LeaseAttachmentDto.class);
        } catch (JsonProcessingException exception) {
            return null;
        }
    }

    private String tenantDisplayName(TenantEntity tenant) {
        if (tenant.getCompanyName() != null && !tenant.getCompanyName().isBlank()) {
            return tenant.getCompanyName();
        }
        return List.of(tenant.getFirstName(), tenant.getLastName()).stream()
            .filter(part -> part != null && !part.isBlank())
            .collect(Collectors.joining(" "));
    }
}
