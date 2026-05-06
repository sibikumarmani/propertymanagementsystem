package com.company.pms.inspection;

import com.company.pms.lease.LeaseEntity;
import com.company.pms.lease.LeaseRepository;
import com.company.pms.property.PropertyEntity;
import com.company.pms.property.PropertyRepository;
import com.company.pms.security.SecurityContextService;
import com.company.pms.tenant.TenantEntity;
import com.company.pms.tenant.TenantRepository;
import com.company.pms.unit.UnitEntity;
import com.company.pms.unit.UnitRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
public class InspectionService {
    private static final BigDecimal ZERO = BigDecimal.ZERO;
    private static final int MAX_CHECKLIST_COUNT = 80;
    private static final int MAX_PHOTO_COUNT = 20;
    private static final TypeReference<List<InspectionChecklistItemDto>> CHECKLIST_TYPE = new TypeReference<>() {};
    private static final TypeReference<List<InspectionAttachmentDto>> ATTACHMENT_LIST_TYPE = new TypeReference<>() {};
    private static final List<String> INSPECTION_TYPES = List.of("MOVE_IN", "MOVE_OUT", "PERIODIC", "SPECIAL");
    private static final List<String> CONDITION_STATUSES = List.of("EXCELLENT", "GOOD", "FAIR", "POOR", "DAMAGED", "NOT_APPLICABLE");
    private static final List<String> DAMAGE_STATUSES = List.of("NONE", "MINOR", "MODERATE", "MAJOR", "CRITICAL");
    private static final List<String> ACK_STATUSES = List.of("NOT_REQUIRED", "PENDING", "ACKNOWLEDGED", "DISPUTED");
    private static final List<String> INSPECTION_STATUSES = List.of("DRAFT", "SCHEDULED", "SUBMITTED", "COMPLETED", "CANCELLED");

    private final InspectionRepository inspectionRepository;
    private final PropertyRepository propertyRepository;
    private final UnitRepository unitRepository;
    private final LeaseRepository leaseRepository;
    private final TenantRepository tenantRepository;
    private final SecurityContextService securityContextService;
    private final ObjectMapper objectMapper;

    public InspectionService(
        InspectionRepository inspectionRepository,
        PropertyRepository propertyRepository,
        UnitRepository unitRepository,
        LeaseRepository leaseRepository,
        TenantRepository tenantRepository,
        SecurityContextService securityContextService,
        ObjectMapper objectMapper
    ) {
        this.inspectionRepository = inspectionRepository;
        this.propertyRepository = propertyRepository;
        this.unitRepository = unitRepository;
        this.leaseRepository = leaseRepository;
        this.tenantRepository = tenantRepository;
        this.securityContextService = securityContextService;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public InspectionOptionsDto getOptions() {
        return new InspectionOptionsDto(INSPECTION_TYPES, CONDITION_STATUSES, DAMAGE_STATUSES, ACK_STATUSES, INSPECTION_STATUSES);
    }

    @Transactional(readOnly = true)
    public List<InspectionDto> getInspections() {
        Long companyId = securityContextService.getCurrentCompanyId();
        return inspectionRepository.findAllByCompanyIdOrderByInspectionDateDescIdDesc(companyId).stream().map(this::toDto).toList();
    }

    @Transactional
    public InspectionDto createInspection(InspectionUpsertRequest request) {
        Long companyId = securityContextService.getCurrentCompanyId();
        String inspectionNumber = normalizeCode(request.inspectionNumber(), "Inspection number");
        if (inspectionRepository.existsByCompanyIdAndInspectionNumberIgnoreCase(companyId, inspectionNumber)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Inspection number already exists");
        }
        InspectionEntity entity = new InspectionEntity();
        apply(entity, request, companyId, inspectionNumber);
        return toDto(inspectionRepository.save(entity));
    }

    @Transactional
    public InspectionDto updateInspection(Long id, InspectionUpsertRequest request) {
        Long companyId = securityContextService.getCurrentCompanyId();
        InspectionEntity entity = requireInspection(id, companyId);
        String inspectionNumber = normalizeCode(request.inspectionNumber(), "Inspection number");
        if (inspectionRepository.existsByCompanyIdAndInspectionNumberIgnoreCaseAndIdNot(companyId, inspectionNumber, id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Inspection number already exists");
        }
        apply(entity, request, companyId, inspectionNumber);
        return toDto(inspectionRepository.save(entity));
    }

    @Transactional
    public InspectionDto updateStatus(Long id, String status) {
        InspectionEntity entity = requireInspection(id, securityContextService.getCurrentCompanyId());
        entity.setStatus(status);
        return toDto(inspectionRepository.save(entity));
    }

    @Transactional
    public InspectionDto acknowledge(Long id) {
        InspectionEntity entity = requireInspection(id, securityContextService.getCurrentCompanyId());
        entity.setTenantAcknowledgementStatus("ACKNOWLEDGED");
        if (entity.getTenantAcknowledgedAt() == null) {
            entity.setTenantAcknowledgedAt(Instant.now());
        }
        return toDto(inspectionRepository.save(entity));
    }

    @Transactional
    public void deleteInspection(Long id) {
        inspectionRepository.delete(requireInspection(id, securityContextService.getCurrentCompanyId()));
    }

    private void apply(InspectionEntity entity, InspectionUpsertRequest request, Long companyId, String inspectionNumber) {
        PropertyEntity property = requireProperty(request.propertyId(), companyId);
        UnitEntity unit = request.unitId() == null ? null : requireUnit(request.unitId(), companyId);
        LeaseEntity lease = request.leaseId() == null ? null : requireLease(request.leaseId(), companyId);
        TenantEntity tenant = request.tenantId() == null ? null : requireTenant(request.tenantId(), companyId);
        if (unit != null && !unit.getPropertyId().equals(property.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unit must belong to selected property");
        }
        if (lease != null) {
            if (!lease.getPropertyId().equals(property.getId())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Lease must belong to selected property");
            }
            if (unit != null && !lease.getUnitId().equals(unit.getId())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Lease must belong to selected unit");
            }
            if (tenant != null && !lease.getTenantId().equals(tenant.getId())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tenant must match selected lease");
            }
        }
        BigDecimal repairCost = nonNegativeOrZero(request.estimatedRepairCost(), "Estimated repair cost");
        List<InspectionChecklistItemDto> checklist = normalizeChecklist(request.checklist());
        BigDecimal checklistDamageCost = checklist.stream()
            .map(InspectionChecklistItemDto::estimatedRepairCost)
            .filter(Objects::nonNull)
            .reduce(ZERO, BigDecimal::add);
        if (checklistDamageCost.compareTo(repairCost) > 0) {
            repairCost = checklistDamageCost;
        }
        entity.setCompanyId(companyId);
        entity.setInspectionNumber(inspectionNumber);
        entity.setInspectionType(normalizeOption(request.inspectionType(), INSPECTION_TYPES, "Inspection type"));
        entity.setPropertyId(property.getId());
        entity.setUnitId(unit == null ? null : unit.getId());
        entity.setLeaseId(lease == null ? null : lease.getId());
        entity.setTenantId(tenant == null ? null : tenant.getId());
        entity.setScheduledDate(request.scheduledDate());
        entity.setInspectionDate(request.inspectionDate());
        entity.setInspectorName(normalizeNullable(request.inspectorName()));
        entity.setOverallCondition(normalizeOption(request.overallCondition(), CONDITION_STATUSES, "Overall condition"));
        entity.setDamageStatus(normalizeOption(request.damageStatus(), DAMAGE_STATUSES, "Damage status"));
        entity.setEstimatedRepairCost(repairCost);
        entity.setChecklistJson(serializeChecklist(checklist));
        entity.setPhotoAttachmentsJson(serializeAttachments(request.photoAttachments()));
        entity.setDamageNotes(normalizeNullable(request.damageNotes()));
        entity.setTenantAcknowledgementStatus(normalizeOption(request.tenantAcknowledgementStatus(), ACK_STATUSES, "Tenant acknowledgement status"));
        entity.setTenantAcknowledgedBy(normalizeNullable(request.tenantAcknowledgedBy()));
        entity.setTenantAcknowledgedAt("ACKNOWLEDGED".equals(entity.getTenantAcknowledgementStatus()) ? Instant.now() : null);
        entity.setStatus(normalizeOption(request.status(), INSPECTION_STATUSES, "Inspection status"));
        entity.setRemarks(normalizeNullable(request.remarks()));
    }

    private InspectionEntity requireInspection(Long id, Long companyId) {
        return inspectionRepository.findByIdAndCompanyId(id, companyId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Inspection not found"));
    }

    private PropertyEntity requireProperty(Long id, Long companyId) {
        return propertyRepository.findByIdAndCompanyId(id, companyId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Property not found"));
    }

    private UnitEntity requireUnit(Long id, Long companyId) {
        return unitRepository.findByIdAndCompanyId(id, companyId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Unit not found"));
    }

    private LeaseEntity requireLease(Long id, Long companyId) {
        return leaseRepository.findByIdAndCompanyId(id, companyId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lease not found"));
    }

    private TenantEntity requireTenant(Long id, Long companyId) {
        return tenantRepository.findByIdAndCompanyId(id, companyId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tenant not found"));
    }

    private InspectionDto toDto(InspectionEntity entity) {
        PropertyEntity property = propertyRepository.findById(entity.getPropertyId()).orElse(null);
        UnitEntity unit = entity.getUnitId() == null ? null : unitRepository.findById(entity.getUnitId()).orElse(null);
        LeaseEntity lease = entity.getLeaseId() == null ? null : leaseRepository.findById(entity.getLeaseId()).orElse(null);
        TenantEntity tenant = entity.getTenantId() == null ? null : tenantRepository.findById(entity.getTenantId()).orElse(null);
        return new InspectionDto(entity.getId(), entity.getCompanyId(), entity.getInspectionNumber(), entity.getInspectionType(), entity.getPropertyId(), property == null ? null : property.getPropertyName(), entity.getUnitId(), unit == null ? null : unit.getUnitNumber(), entity.getLeaseId(), lease == null ? null : lease.getLeaseNumber(), entity.getTenantId(), tenantName(tenant), entity.getScheduledDate(), entity.getInspectionDate(), entity.getInspectorName(), entity.getOverallCondition(), entity.getDamageStatus(), entity.getEstimatedRepairCost(), deserializeChecklist(entity.getChecklistJson()), deserializeAttachments(entity.getPhotoAttachmentsJson()), entity.getDamageNotes(), entity.getTenantAcknowledgementStatus(), entity.getTenantAcknowledgedBy(), entity.getTenantAcknowledgedAt(), entity.getStatus(), entity.getRemarks());
    }

    private List<InspectionChecklistItemDto> normalizeChecklist(List<InspectionChecklistItemDto> checklist) {
        return (checklist == null ? List.<InspectionChecklistItemDto>of() : checklist).stream()
            .filter(Objects::nonNull)
            .limit(MAX_CHECKLIST_COUNT)
            .map(item -> new InspectionChecklistItemDto(normalizeCode(item.itemName(), "Checklist item"), normalizeOption(item.conditionStatus(), CONDITION_STATUSES, "Checklist condition"), Boolean.TRUE.equals(item.damaged()), normalizeNullable(item.damageDescription()), nonNegativeOrZero(item.estimatedRepairCost(), "Checklist repair cost"), normalizeNullable(item.remarks())))
            .toList();
    }

    private String serializeChecklist(List<InspectionChecklistItemDto> checklist) {
        try {
            return objectMapper.writeValueAsString(checklist == null ? List.of() : checklist);
        } catch (JsonProcessingException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Checklist could not be saved");
        }
    }

    private List<InspectionChecklistItemDto> deserializeChecklist(String json) {
        if (json == null || json.isBlank()) {
            return List.of();
        }
        try {
            return objectMapper.readValue(json, CHECKLIST_TYPE);
        } catch (JsonProcessingException exception) {
            return List.of();
        }
    }

    private String serializeAttachments(List<InspectionAttachmentDto> attachments) {
        List<InspectionAttachmentDto> normalized = attachments == null ? List.of() : attachments.stream().filter(Objects::nonNull).limit(MAX_PHOTO_COUNT).toList();
        try {
            return objectMapper.writeValueAsString(normalized);
        } catch (JsonProcessingException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Photos could not be saved");
        }
    }

    private List<InspectionAttachmentDto> deserializeAttachments(String json) {
        if (json == null || json.isBlank()) {
            return List.of();
        }
        try {
            return objectMapper.readValue(json, ATTACHMENT_LIST_TYPE);
        } catch (JsonProcessingException exception) {
            return List.of();
        }
    }

    private String tenantName(TenantEntity tenant) {
        if (tenant == null) {
            return null;
        }
        if (tenant.getCompanyName() != null && !tenant.getCompanyName().isBlank()) {
            return tenant.getCompanyName();
        }
        return Stream.of(tenant.getFirstName(), tenant.getLastName()).filter(Objects::nonNull).filter(part -> !part.isBlank()).collect(Collectors.joining(" "));
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
