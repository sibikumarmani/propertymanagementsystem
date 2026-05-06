package com.company.pms.maintenance;

import com.company.pms.auth.UserEntity;
import com.company.pms.auth.UserRepository;
import com.company.pms.notification.NotificationService;
import com.company.pms.property.PropertyEntity;
import com.company.pms.property.PropertyRepository;
import com.company.pms.security.SecurityContextService;
import com.company.pms.tenant.TenantEntity;
import com.company.pms.tenant.TenantRepository;
import com.company.pms.unit.UnitEntity;
import com.company.pms.unit.UnitRepository;
import com.company.pms.vendor.VendorEntity;
import com.company.pms.vendor.VendorRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
public class MaintenanceService {

    private static final BigDecimal HIGH_COST_THRESHOLD = new BigDecimal("5000.00");
    private static final int MAX_ATTACHMENT_COUNT = 8;
    private static final TypeReference<List<MaintenanceAttachmentDto>> ATTACHMENT_LIST_TYPE = new TypeReference<>() {
    };

    private static final List<String> REQUEST_STATUSES = List.of("OPEN", "ASSIGNED", "IN_PROGRESS", "ON_HOLD", "COMPLETED", "CLOSED", "CANCELLED");
    private static final List<String> PRIORITIES = List.of("LOW", "MEDIUM", "HIGH", "EMERGENCY");
    private static final List<String> APPROVAL_STATUSES = List.of("NOT_REQUIRED", "PENDING_APPROVAL", "APPROVED", "REJECTED");
    private static final List<String> WORK_ORDER_STATUSES = List.of("DRAFT", "ISSUED", "IN_PROGRESS", "COMPLETED", "CANCELLED");
    private static final List<String> PREVENTIVE_FREQUENCIES = List.of("WEEKLY", "MONTHLY", "QUARTERLY", "HALF_YEARLY", "YEARLY");
    private static final List<String> PREVENTIVE_COMPLETION_STATUSES = List.of("SCHEDULED", "DUE", "COMPLETED", "OVERDUE", "SKIPPED");
    private static final List<String> PREVENTIVE_STATUSES = List.of("ACTIVE", "INACTIVE");

    private final MaintenanceRequestRepository requestRepository;
    private final MaintenanceWorkOrderRepository workOrderRepository;
    private final PreventiveMaintenanceRepository preventiveRepository;
    private final TenantRepository tenantRepository;
    private final PropertyRepository propertyRepository;
    private final UnitRepository unitRepository;
    private final VendorRepository vendorRepository;
    private final UserRepository userRepository;
    private final SecurityContextService securityContextService;
    private final NotificationService notificationService;
    private final ObjectMapper objectMapper;

    public MaintenanceService(
        MaintenanceRequestRepository requestRepository,
        MaintenanceWorkOrderRepository workOrderRepository,
        PreventiveMaintenanceRepository preventiveRepository,
        TenantRepository tenantRepository,
        PropertyRepository propertyRepository,
        UnitRepository unitRepository,
        VendorRepository vendorRepository,
        UserRepository userRepository,
        SecurityContextService securityContextService,
        NotificationService notificationService,
        ObjectMapper objectMapper
    ) {
        this.requestRepository = requestRepository;
        this.workOrderRepository = workOrderRepository;
        this.preventiveRepository = preventiveRepository;
        this.tenantRepository = tenantRepository;
        this.propertyRepository = propertyRepository;
        this.unitRepository = unitRepository;
        this.vendorRepository = vendorRepository;
        this.userRepository = userRepository;
        this.securityContextService = securityContextService;
        this.notificationService = notificationService;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public MaintenanceOptionsDto getOptions() {
        return new MaintenanceOptionsDto(REQUEST_STATUSES, PRIORITIES, APPROVAL_STATUSES, WORK_ORDER_STATUSES, PREVENTIVE_FREQUENCIES, PREVENTIVE_COMPLETION_STATUSES, PREVENTIVE_STATUSES);
    }

    @Transactional(readOnly = true)
    public List<MaintenanceRequestDto> getRequests() {
        Long companyId = securityContextService.getCurrentCompanyId();
        List<MaintenanceRequestEntity> requests = requestRepository.findAllByCompanyIdOrderByIdDesc(companyId);
        LookupData lookup = loadLookupData(requests.stream(), Stream.empty(), Stream.empty());
        return requests.stream().map(request -> toDto(request, lookup)).toList();
    }

    @Transactional
    public MaintenanceRequestDto createRequest(MaintenanceRequestUpsertRequest request) {
        Long companyId = securityContextService.getCurrentCompanyId();
        String requestNumber = normalizeCode(request.requestNumber(), "Request number");
        validateRequestNumber(companyId, requestNumber, null);
        TenantEntity tenant = requireTenant(request.tenantId(), companyId);
        PropertyEntity property = requireProperty(request.propertyId(), companyId);
        UnitEntity unit = requireUnit(request.unitId(), companyId);
        validateUnitBelongsToProperty(unit, property);
        VendorEntity vendor = request.assignedVendorId() == null ? null : requireVendor(request.assignedVendorId(), companyId);
        UserEntity assignedUser = request.assignedUserId() == null ? null : requireUser(request.assignedUserId());
        MaintenanceRequestEntity saved = requestRepository.save(apply(new MaintenanceRequestEntity(), request, companyId, requestNumber));
        return toDto(saved, tenant, property, unit, vendor, assignedUser);
    }

    @Transactional
    public MaintenanceRequestDto updateRequest(Long id, MaintenanceRequestUpsertRequest request) {
        Long companyId = securityContextService.getCurrentCompanyId();
        MaintenanceRequestEntity entity = requestRepository.findByIdAndCompanyId(id, companyId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Maintenance request not found"));
        String requestNumber = normalizeCode(request.requestNumber(), "Request number");
        validateRequestNumber(companyId, requestNumber, id);
        TenantEntity tenant = requireTenant(request.tenantId(), companyId);
        PropertyEntity property = requireProperty(request.propertyId(), companyId);
        UnitEntity unit = requireUnit(request.unitId(), companyId);
        validateUnitBelongsToProperty(unit, property);
        VendorEntity vendor = request.assignedVendorId() == null ? null : requireVendor(request.assignedVendorId(), companyId);
        UserEntity assignedUser = request.assignedUserId() == null ? null : requireUser(request.assignedUserId());
        MaintenanceRequestEntity saved = requestRepository.save(apply(entity, request, companyId, requestNumber));
        notificationService.sendWorkflowNotification(companyId, "MAINTENANCE_STATUS_UPDATE", "Maintenance request updated", "Maintenance request %s is now %s.".formatted(saved.getRequestNumber(), saved.getStatus()), "MAINTENANCE_REQUEST", saved.getId(), "NORMAL");
        return toDto(saved, tenant, property, unit, vendor, assignedUser);
    }

    @Transactional
    public void deleteRequest(Long id) {
        Long companyId = securityContextService.getCurrentCompanyId();
        MaintenanceRequestEntity request = requestRepository.findByIdAndCompanyId(id, companyId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Maintenance request not found"));
        requestRepository.delete(request);
    }

    @Transactional(readOnly = true)
    public List<MaintenanceWorkOrderDto> getWorkOrders() {
        Long companyId = securityContextService.getCurrentCompanyId();
        List<MaintenanceWorkOrderEntity> workOrders = workOrderRepository.findAllByCompanyIdOrderByIdDesc(companyId);
        LookupData lookup = loadLookupData(Stream.empty(), workOrders.stream(), Stream.empty());
        return workOrders.stream().map(workOrder -> toDto(workOrder, lookup)).toList();
    }

    @Transactional
    public MaintenanceWorkOrderDto createWorkOrder(MaintenanceWorkOrderUpsertRequest request) {
        Long companyId = securityContextService.getCurrentCompanyId();
        String number = normalizeCode(request.workOrderNumber(), "Work order number");
        validateWorkOrderNumber(companyId, number, null);
        MaintenanceRequestEntity maintenanceRequest = requireMaintenanceRequest(request.maintenanceRequestId(), companyId);
        VendorEntity vendor = request.vendorId() == null ? null : requireVendor(request.vendorId(), companyId);
        UserEntity user = request.technicianUserId() == null ? null : requireUser(request.technicianUserId());
        MaintenanceWorkOrderEntity saved = workOrderRepository.save(apply(new MaintenanceWorkOrderEntity(), request, companyId, number));
        return toDto(saved, maintenanceRequest, vendor, user);
    }

    @Transactional
    public MaintenanceWorkOrderDto updateWorkOrder(Long id, MaintenanceWorkOrderUpsertRequest request) {
        Long companyId = securityContextService.getCurrentCompanyId();
        MaintenanceWorkOrderEntity entity = workOrderRepository.findByIdAndCompanyId(id, companyId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Work order not found"));
        String number = normalizeCode(request.workOrderNumber(), "Work order number");
        validateWorkOrderNumber(companyId, number, id);
        MaintenanceRequestEntity maintenanceRequest = requireMaintenanceRequest(request.maintenanceRequestId(), companyId);
        VendorEntity vendor = request.vendorId() == null ? null : requireVendor(request.vendorId(), companyId);
        UserEntity user = request.technicianUserId() == null ? null : requireUser(request.technicianUserId());
        MaintenanceWorkOrderEntity saved = workOrderRepository.save(apply(entity, request, companyId, number));
        notificationService.sendWorkflowNotification(companyId, "MAINTENANCE_STATUS_UPDATE", "Work order updated", "Work order %s is now %s.".formatted(saved.getWorkOrderNumber(), saved.getStatus()), "MAINTENANCE_WORK_ORDER", saved.getId(), "NORMAL");
        return toDto(saved, maintenanceRequest, vendor, user);
    }

    @Transactional
    public void deleteWorkOrder(Long id) {
        Long companyId = securityContextService.getCurrentCompanyId();
        MaintenanceWorkOrderEntity workOrder = workOrderRepository.findByIdAndCompanyId(id, companyId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Work order not found"));
        workOrderRepository.delete(workOrder);
    }

    @Transactional(readOnly = true)
    public List<PreventiveMaintenanceDto> getPreventiveSchedules() {
        Long companyId = securityContextService.getCurrentCompanyId();
        List<PreventiveMaintenanceEntity> schedules = preventiveRepository.findAllByCompanyIdOrderByNextDueDateAscIdAsc(companyId);
        LookupData lookup = loadLookupData(Stream.empty(), Stream.empty(), schedules.stream());
        return schedules.stream().map(schedule -> toDto(schedule, lookup)).toList();
    }

    @Transactional
    public PreventiveMaintenanceDto createPreventiveSchedule(PreventiveMaintenanceUpsertRequest request) {
        Long companyId = securityContextService.getCurrentCompanyId();
        String number = normalizeCode(request.scheduleNumber(), "Schedule number");
        validateScheduleNumber(companyId, number, null);
        PropertyEntity property = requireProperty(request.propertyId(), companyId);
        UnitEntity unit = request.unitId() == null ? null : requireUnit(request.unitId(), companyId);
        if (unit != null) {
            validateUnitBelongsToProperty(unit, property);
        }
        UserEntity user = request.responsibleUserId() == null ? null : requireUser(request.responsibleUserId());
        VendorEntity vendor = request.vendorId() == null ? null : requireVendor(request.vendorId(), companyId);
        PreventiveMaintenanceEntity saved = preventiveRepository.save(apply(new PreventiveMaintenanceEntity(), request, companyId, number));
        return toDto(saved, property, unit, user, vendor);
    }

    @Transactional
    public PreventiveMaintenanceDto updatePreventiveSchedule(Long id, PreventiveMaintenanceUpsertRequest request) {
        Long companyId = securityContextService.getCurrentCompanyId();
        PreventiveMaintenanceEntity entity = preventiveRepository.findByIdAndCompanyId(id, companyId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Preventive maintenance schedule not found"));
        String number = normalizeCode(request.scheduleNumber(), "Schedule number");
        validateScheduleNumber(companyId, number, id);
        PropertyEntity property = requireProperty(request.propertyId(), companyId);
        UnitEntity unit = request.unitId() == null ? null : requireUnit(request.unitId(), companyId);
        if (unit != null) {
            validateUnitBelongsToProperty(unit, property);
        }
        UserEntity user = request.responsibleUserId() == null ? null : requireUser(request.responsibleUserId());
        VendorEntity vendor = request.vendorId() == null ? null : requireVendor(request.vendorId(), companyId);
        PreventiveMaintenanceEntity saved = preventiveRepository.save(apply(entity, request, companyId, number));
        return toDto(saved, property, unit, user, vendor);
    }

    @Transactional
    public void deletePreventiveSchedule(Long id) {
        Long companyId = securityContextService.getCurrentCompanyId();
        PreventiveMaintenanceEntity schedule = preventiveRepository.findByIdAndCompanyId(id, companyId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Preventive maintenance schedule not found"));
        preventiveRepository.delete(schedule);
    }

    private MaintenanceRequestEntity apply(MaintenanceRequestEntity entity, MaintenanceRequestUpsertRequest request, Long companyId, String requestNumber) {
        entity.setCompanyId(companyId);
        entity.setRequestNumber(requestNumber);
        entity.setTenantId(request.tenantId());
        entity.setPropertyId(request.propertyId());
        entity.setUnitId(request.unitId());
        entity.setCategory(normalizeRequiredText(request.category(), "Category"));
        entity.setPriority(normalizeChoice(request.priority(), PRIORITIES, "Priority"));
        entity.setDescription(normalizeRequiredText(request.description(), "Description"));
        entity.setAssignedVendorId(request.assignedVendorId());
        entity.setAssignedUserId(request.assignedUserId());
        entity.setEstimatedCost(nonNegative(request.estimatedCost(), "Estimated cost"));
        entity.setActualCost(nonNegative(request.actualCost(), "Actual cost"));
        entity.setStatus(normalizeChoice(request.status(), REQUEST_STATUSES, "Request status"));
        entity.setApprovalStatus(resolveApprovalStatus(entity.getEstimatedCost(), request.approvalStatus()));
        entity.setAttachmentsJson(serializeAttachmentList(request.attachments()));
        entity.setCompletionRemarks(normalizeText(request.completionRemarks()));
        return entity;
    }

    private MaintenanceWorkOrderEntity apply(MaintenanceWorkOrderEntity entity, MaintenanceWorkOrderUpsertRequest request, Long companyId, String workOrderNumber) {
        entity.setCompanyId(companyId);
        entity.setWorkOrderNumber(workOrderNumber);
        entity.setMaintenanceRequestId(request.maintenanceRequestId());
        entity.setVendorId(request.vendorId());
        entity.setTechnicianUserId(request.technicianUserId());
        entity.setMaterialsUsed(normalizeText(request.materialsUsed()));
        entity.setLaborCharges(nonNegative(request.laborCharges(), "Labor charges"));
        entity.setVendorInvoiceDocument(serializeAttachment(request.vendorInvoiceDocument()));
        entity.setCompletionRemarks(normalizeText(request.completionRemarks()));
        entity.setApprovalStatus(normalizeChoice(request.approvalStatus() == null ? "PENDING_APPROVAL" : request.approvalStatus(), APPROVAL_STATUSES, "Approval status"));
        entity.setStatus(normalizeChoice(request.status(), WORK_ORDER_STATUSES, "Work order status"));
        return entity;
    }

    private PreventiveMaintenanceEntity apply(PreventiveMaintenanceEntity entity, PreventiveMaintenanceUpsertRequest request, Long companyId, String scheduleNumber) {
        entity.setCompanyId(companyId);
        entity.setScheduleNumber(scheduleNumber);
        entity.setPropertyId(request.propertyId());
        entity.setUnitId(request.unitId());
        entity.setAssetName(normalizeRequiredText(request.assetName(), "Asset name"));
        entity.setMaintenanceType(normalizeRequiredText(request.maintenanceType(), "Maintenance type"));
        entity.setRecurrenceFrequency(normalizeChoice(request.recurrenceFrequency(), PREVENTIVE_FREQUENCIES, "Recurrence"));
        entity.setNextDueDate(request.nextDueDate());
        entity.setResponsibleUserId(request.responsibleUserId());
        entity.setVendorId(request.vendorId());
        entity.setNotifyBeforeDays(request.notifyBeforeDays() == null ? 3 : Math.max(0, request.notifyBeforeDays()));
        entity.setCompletionStatus(normalizeChoice(request.completionStatus(), PREVENTIVE_COMPLETION_STATUSES, "Completion status"));
        entity.setLastCompletedDate(request.lastCompletedDate());
        entity.setCompletionRemarks(normalizeText(request.completionRemarks()));
        entity.setStatus(normalizeChoice(request.status(), PREVENTIVE_STATUSES, "Schedule status"));
        return entity;
    }

    private MaintenanceRequestDto toDto(MaintenanceRequestEntity entity, LookupData lookup) {
        return toDto(entity, lookup.tenants().get(entity.getTenantId()), lookup.properties().get(entity.getPropertyId()), lookup.units().get(entity.getUnitId()), lookup.vendors().get(entity.getAssignedVendorId()), lookup.users().get(entity.getAssignedUserId()));
    }

    private MaintenanceRequestDto toDto(MaintenanceRequestEntity entity, TenantEntity tenant, PropertyEntity property, UnitEntity unit, VendorEntity vendor, UserEntity user) {
        return new MaintenanceRequestDto(entity.getId(), entity.getCompanyId(), entity.getRequestNumber(), entity.getTenantId(), tenantName(tenant), entity.getPropertyId(), property == null ? null : property.getPropertyName(), entity.getUnitId(), unit == null ? null : unit.getUnitNumber(), entity.getCategory(), entity.getPriority(), entity.getDescription(), entity.getAssignedVendorId(), vendor == null ? null : vendor.getVendorName(), entity.getAssignedUserId(), user == null ? null : user.getFullName(), entity.getEstimatedCost(), entity.getActualCost(), entity.getStatus(), entity.getApprovalStatus(), deserializeAttachmentList(entity.getAttachmentsJson()), entity.getCompletionRemarks());
    }

    private MaintenanceWorkOrderDto toDto(MaintenanceWorkOrderEntity entity, LookupData lookup) {
        return toDto(entity, lookup.requests().get(entity.getMaintenanceRequestId()), lookup.vendors().get(entity.getVendorId()), lookup.users().get(entity.getTechnicianUserId()));
    }

    private MaintenanceWorkOrderDto toDto(MaintenanceWorkOrderEntity entity, MaintenanceRequestEntity request, VendorEntity vendor, UserEntity user) {
        return new MaintenanceWorkOrderDto(entity.getId(), entity.getCompanyId(), entity.getWorkOrderNumber(), entity.getMaintenanceRequestId(), request == null ? null : request.getRequestNumber(), entity.getVendorId(), vendor == null ? null : vendor.getVendorName(), entity.getTechnicianUserId(), user == null ? null : user.getFullName(), entity.getMaterialsUsed(), entity.getLaborCharges(), deserializeAttachment(entity.getVendorInvoiceDocument()), entity.getCompletionRemarks(), entity.getApprovalStatus(), entity.getStatus());
    }

    private PreventiveMaintenanceDto toDto(PreventiveMaintenanceEntity entity, LookupData lookup) {
        return toDto(entity, lookup.properties().get(entity.getPropertyId()), lookup.units().get(entity.getUnitId()), lookup.users().get(entity.getResponsibleUserId()), lookup.vendors().get(entity.getVendorId()));
    }

    private PreventiveMaintenanceDto toDto(PreventiveMaintenanceEntity entity, PropertyEntity property, UnitEntity unit, UserEntity user, VendorEntity vendor) {
        return new PreventiveMaintenanceDto(entity.getId(), entity.getCompanyId(), entity.getScheduleNumber(), entity.getPropertyId(), property == null ? null : property.getPropertyName(), entity.getUnitId(), unit == null ? null : unit.getUnitNumber(), entity.getAssetName(), entity.getMaintenanceType(), entity.getRecurrenceFrequency(), entity.getNextDueDate(), entity.getResponsibleUserId(), user == null ? null : user.getFullName(), entity.getVendorId(), vendor == null ? null : vendor.getVendorName(), entity.getNotifyBeforeDays(), entity.getCompletionStatus(), entity.getLastCompletedDate(), entity.getCompletionRemarks(), entity.getStatus());
    }

    private LookupData loadLookupData(Stream<MaintenanceRequestEntity> requestStream, Stream<MaintenanceWorkOrderEntity> workOrderStream, Stream<PreventiveMaintenanceEntity> scheduleStream) {
        List<MaintenanceRequestEntity> requests = requestStream.toList();
        List<MaintenanceWorkOrderEntity> workOrders = workOrderStream.toList();
        List<PreventiveMaintenanceEntity> schedules = scheduleStream.toList();
        List<Long> requestIds = workOrders.stream().map(MaintenanceWorkOrderEntity::getMaintenanceRequestId).filter(Objects::nonNull).distinct().toList();
        Map<Long, MaintenanceRequestEntity> requestMap = requestIds.isEmpty() ? Map.of() : requestRepository.findAllById(requestIds).stream().collect(Collectors.toMap(MaintenanceRequestEntity::getId, Function.identity()));
        List<Long> tenantIds = requests.stream().map(MaintenanceRequestEntity::getTenantId).filter(Objects::nonNull).distinct().toList();
        List<Long> propertyIds = Stream.concat(requests.stream().map(MaintenanceRequestEntity::getPropertyId), schedules.stream().map(PreventiveMaintenanceEntity::getPropertyId)).filter(Objects::nonNull).distinct().toList();
        List<Long> unitIds = Stream.concat(requests.stream().map(MaintenanceRequestEntity::getUnitId), schedules.stream().map(PreventiveMaintenanceEntity::getUnitId)).filter(Objects::nonNull).distinct().toList();
        List<Long> vendorIds = Stream.of(requests.stream().map(MaintenanceRequestEntity::getAssignedVendorId), workOrders.stream().map(MaintenanceWorkOrderEntity::getVendorId), schedules.stream().map(PreventiveMaintenanceEntity::getVendorId)).flatMap(Function.identity()).filter(Objects::nonNull).distinct().toList();
        List<Long> userIds = Stream.of(requests.stream().map(MaintenanceRequestEntity::getAssignedUserId), workOrders.stream().map(MaintenanceWorkOrderEntity::getTechnicianUserId), schedules.stream().map(PreventiveMaintenanceEntity::getResponsibleUserId)).flatMap(Function.identity()).filter(Objects::nonNull).distinct().toList();
        return new LookupData(toMap(tenantRepository.findAllById(tenantIds), TenantEntity::getId), toMap(propertyRepository.findAllById(propertyIds), PropertyEntity::getId), toMap(unitRepository.findAllById(unitIds), UnitEntity::getId), toMap(vendorRepository.findAllById(vendorIds), VendorEntity::getId), toMap(userRepository.findAllById(userIds), UserEntity::getId), requestMap);
    }

    private <T> Map<Long, T> toMap(Iterable<T> items, Function<T, Long> idGetter) {
        List<T> list = new ArrayList<>();
        items.forEach(list::add);
        return list.stream().collect(Collectors.toMap(idGetter, Function.identity()));
    }

    private TenantEntity requireTenant(Long id, Long companyId) {
        return tenantRepository.findByIdAndCompanyId(id, companyId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selected tenant was not found in the active company"));
    }

    private PropertyEntity requireProperty(Long id, Long companyId) {
        return propertyRepository.findByIdAndCompanyId(id, companyId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selected property was not found in the active company"));
    }

    private UnitEntity requireUnit(Long id, Long companyId) {
        return unitRepository.findByIdAndCompanyId(id, companyId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selected unit was not found in the active company"));
    }

    private VendorEntity requireVendor(Long id, Long companyId) {
        return vendorRepository.findByIdAndCompanyId(id, companyId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selected vendor was not found in the active company"));
    }

    private UserEntity requireUser(Long id) {
        return userRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selected user was not found"));
    }

    private MaintenanceRequestEntity requireMaintenanceRequest(Long id, Long companyId) {
        return requestRepository.findByIdAndCompanyId(id, companyId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selected maintenance request was not found in the active company"));
    }

    private void validateUnitBelongsToProperty(UnitEntity unit, PropertyEntity property) {
        if (!unit.getPropertyId().equals(property.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selected unit does not belong to the selected property");
        }
    }

    private void validateRequestNumber(Long companyId, String number, Long existingId) {
        boolean exists = existingId == null ? requestRepository.existsByCompanyIdAndRequestNumberIgnoreCase(companyId, number) : requestRepository.existsByCompanyIdAndRequestNumberIgnoreCaseAndIdNot(companyId, number, existingId);
        if (exists) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Maintenance request number already exists");
        }
    }

    private void validateWorkOrderNumber(Long companyId, String number, Long existingId) {
        boolean exists = existingId == null ? workOrderRepository.existsByCompanyIdAndWorkOrderNumberIgnoreCase(companyId, number) : workOrderRepository.existsByCompanyIdAndWorkOrderNumberIgnoreCaseAndIdNot(companyId, number, existingId);
        if (exists) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Work order number already exists");
        }
    }

    private void validateScheduleNumber(Long companyId, String number, Long existingId) {
        boolean exists = existingId == null ? preventiveRepository.existsByCompanyIdAndScheduleNumberIgnoreCase(companyId, number) : preventiveRepository.existsByCompanyIdAndScheduleNumberIgnoreCaseAndIdNot(companyId, number, existingId);
        if (exists) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Preventive maintenance schedule number already exists");
        }
    }

    private String resolveApprovalStatus(BigDecimal estimatedCost, String requestedStatus) {
        if (estimatedCost != null && estimatedCost.compareTo(HIGH_COST_THRESHOLD) > 0) {
            return normalizeChoice(requestedStatus == null ? "PENDING_APPROVAL" : requestedStatus, APPROVAL_STATUSES, "Approval status");
        }
        return normalizeChoice(requestedStatus == null ? "NOT_REQUIRED" : requestedStatus, APPROVAL_STATUSES, "Approval status");
    }

    private BigDecimal nonNegative(BigDecimal value, String label) {
        if (value != null && value.compareTo(BigDecimal.ZERO) < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, label + " cannot be negative");
        }
        return value;
    }

    private String normalizeChoice(String value, List<String> allowed, String label) {
        String normalized = normalizeRequiredText(value, label).toUpperCase(Locale.ENGLISH);
        if (!allowed.contains(normalized)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, label + " is invalid");
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
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
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

    private String serializeAttachmentList(List<MaintenanceAttachmentDto> attachments) {
        List<MaintenanceAttachmentDto> normalized = attachments == null ? List.of() : attachments.stream().filter(Objects::nonNull).limit(MAX_ATTACHMENT_COUNT).toList();
        try {
            return objectMapper.writeValueAsString(normalized);
        } catch (JsonProcessingException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Attachments could not be saved");
        }
    }

    private List<MaintenanceAttachmentDto> deserializeAttachmentList(String json) {
        if (json == null || json.isBlank()) {
            return List.of();
        }
        try {
            return objectMapper.readValue(json, ATTACHMENT_LIST_TYPE);
        } catch (JsonProcessingException exception) {
            return List.of();
        }
    }

    private String serializeAttachment(MaintenanceAttachmentDto attachment) {
        if (attachment == null) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(attachment);
        } catch (JsonProcessingException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Attachment could not be saved");
        }
    }

    private MaintenanceAttachmentDto deserializeAttachment(String json) {
        if (json == null || json.isBlank()) {
            return null;
        }
        try {
            return objectMapper.readValue(json, MaintenanceAttachmentDto.class);
        } catch (JsonProcessingException exception) {
            return null;
        }
    }

    private record LookupData(
        Map<Long, TenantEntity> tenants,
        Map<Long, PropertyEntity> properties,
        Map<Long, UnitEntity> units,
        Map<Long, VendorEntity> vendors,
        Map<Long, UserEntity> users,
        Map<Long, MaintenanceRequestEntity> requests
    ) {
    }
}
