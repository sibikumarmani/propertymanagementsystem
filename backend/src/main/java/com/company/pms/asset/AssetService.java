package com.company.pms.asset;

import com.company.pms.building.BuildingEntity;
import com.company.pms.building.BuildingRepository;
import com.company.pms.property.PropertyEntity;
import com.company.pms.property.PropertyRepository;
import com.company.pms.security.SecurityContextService;
import com.company.pms.unit.UnitEntity;
import com.company.pms.unit.UnitRepository;
import com.company.pms.vendor.VendorEntity;
import com.company.pms.vendor.VendorRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.Locale;

@Service
public class AssetService {
    private static final BigDecimal ZERO = BigDecimal.ZERO;
    private static final List<String> ASSET_CATEGORIES = List.of("LIFT", "GENERATOR", "HVAC", "PUMP", "CCTV", "FIRE_EXTINGUISHER", "FURNITURE", "ELECTRICAL_PANEL", "OTHER");
    private static final List<String> CONDITION_STATUSES = List.of("NEW", "GOOD", "FAIR", "POOR", "UNDER_REPAIR", "OUT_OF_SERVICE", "RETIRED");
    private static final List<String> MAINTENANCE_FREQUENCIES = List.of("NONE", "WEEKLY", "MONTHLY", "QUARTERLY", "HALF_YEARLY", "YEARLY");
    private static final List<String> ASSET_STATUSES = List.of("ACTIVE", "INACTIVE", "UNDER_REPAIR", "RETIRED", "DISPOSED");
    private static final List<String> MAINTENANCE_TYPES = List.of("PREVENTIVE", "CORRECTIVE", "INSPECTION", "WARRANTY_SERVICE", "EMERGENCY_REPAIR");
    private static final List<String> PRIORITIES = List.of("LOW", "MEDIUM", "HIGH", "CRITICAL");
    private static final List<String> SCHEDULE_STATUSES = List.of("SCHEDULED", "DUE", "IN_PROGRESS", "COMPLETED", "OVERDUE", "CANCELLED");
    private static final List<String> SERVICE_STATUSES = List.of("COMPLETED", "PARTIALLY_COMPLETED", "FAILED", "CANCELLED");

    private final AssetRepository assetRepository;
    private final AssetMaintenanceScheduleRepository scheduleRepository;
    private final AssetServiceHistoryRepository historyRepository;
    private final PropertyRepository propertyRepository;
    private final BuildingRepository buildingRepository;
    private final UnitRepository unitRepository;
    private final VendorRepository vendorRepository;
    private final SecurityContextService securityContextService;

    public AssetService(
        AssetRepository assetRepository,
        AssetMaintenanceScheduleRepository scheduleRepository,
        AssetServiceHistoryRepository historyRepository,
        PropertyRepository propertyRepository,
        BuildingRepository buildingRepository,
        UnitRepository unitRepository,
        VendorRepository vendorRepository,
        SecurityContextService securityContextService
    ) {
        this.assetRepository = assetRepository;
        this.scheduleRepository = scheduleRepository;
        this.historyRepository = historyRepository;
        this.propertyRepository = propertyRepository;
        this.buildingRepository = buildingRepository;
        this.unitRepository = unitRepository;
        this.vendorRepository = vendorRepository;
        this.securityContextService = securityContextService;
    }

    @Transactional(readOnly = true)
    public AssetOptionsDto getOptions() {
        return new AssetOptionsDto(ASSET_CATEGORIES, CONDITION_STATUSES, MAINTENANCE_FREQUENCIES, ASSET_STATUSES, MAINTENANCE_TYPES, PRIORITIES, SCHEDULE_STATUSES, SERVICE_STATUSES);
    }

    @Transactional(readOnly = true)
    public List<AssetDto> getAssets() {
        Long companyId = securityContextService.getCurrentCompanyId();
        return assetRepository.findAllByCompanyIdOrderByAssetNameAscIdAsc(companyId).stream().map(this::toAssetDto).toList();
    }

    @Transactional
    public AssetDto createAsset(AssetUpsertRequest request) {
        Long companyId = securityContextService.getCurrentCompanyId();
        String assetCode = normalizeCode(request.assetCode(), "Asset code");
        if (assetRepository.existsByCompanyIdAndAssetCodeIgnoreCase(companyId, assetCode)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Asset code already exists");
        }
        AssetEntity entity = new AssetEntity();
        applyAsset(entity, request, companyId, assetCode);
        return toAssetDto(assetRepository.save(entity));
    }

    @Transactional
    public AssetDto updateAsset(Long id, AssetUpsertRequest request) {
        Long companyId = securityContextService.getCurrentCompanyId();
        AssetEntity entity = requireAsset(id, companyId);
        String assetCode = normalizeCode(request.assetCode(), "Asset code");
        if (assetRepository.existsByCompanyIdAndAssetCodeIgnoreCaseAndIdNot(companyId, assetCode, id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Asset code already exists");
        }
        applyAsset(entity, request, companyId, assetCode);
        return toAssetDto(assetRepository.save(entity));
    }

    @Transactional
    public void deleteAsset(Long id) {
        assetRepository.delete(requireAsset(id, securityContextService.getCurrentCompanyId()));
    }

    @Transactional(readOnly = true)
    public List<AssetMaintenanceScheduleDto> getSchedules() {
        Long companyId = securityContextService.getCurrentCompanyId();
        return scheduleRepository.findAllByCompanyIdOrderByPlannedDateAscIdDesc(companyId).stream().map(this::toScheduleDto).toList();
    }

    @Transactional
    public AssetMaintenanceScheduleDto createSchedule(AssetMaintenanceScheduleUpsertRequest request) {
        Long companyId = securityContextService.getCurrentCompanyId();
        String scheduleNumber = normalizeCode(request.scheduleNumber(), "Schedule number");
        if (scheduleRepository.existsByCompanyIdAndScheduleNumberIgnoreCase(companyId, scheduleNumber)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Schedule number already exists");
        }
        AssetMaintenanceScheduleEntity entity = new AssetMaintenanceScheduleEntity();
        applySchedule(entity, request, companyId, scheduleNumber);
        return toScheduleDto(scheduleRepository.save(entity));
    }

    @Transactional
    public AssetMaintenanceScheduleDto updateSchedule(Long id, AssetMaintenanceScheduleUpsertRequest request) {
        Long companyId = securityContextService.getCurrentCompanyId();
        AssetMaintenanceScheduleEntity entity = requireSchedule(id, companyId);
        String scheduleNumber = normalizeCode(request.scheduleNumber(), "Schedule number");
        if (scheduleRepository.existsByCompanyIdAndScheduleNumberIgnoreCaseAndIdNot(companyId, scheduleNumber, id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Schedule number already exists");
        }
        applySchedule(entity, request, companyId, scheduleNumber);
        return toScheduleDto(scheduleRepository.save(entity));
    }

    @Transactional
    public AssetMaintenanceScheduleDto updateScheduleStatus(Long id, String status) {
        AssetMaintenanceScheduleEntity entity = requireSchedule(id, securityContextService.getCurrentCompanyId());
        entity.setStatus(status);
        return toScheduleDto(scheduleRepository.save(entity));
    }

    @Transactional
    public void deleteSchedule(Long id) {
        scheduleRepository.delete(requireSchedule(id, securityContextService.getCurrentCompanyId()));
    }

    @Transactional(readOnly = true)
    public List<AssetServiceHistoryDto> getServiceHistory() {
        Long companyId = securityContextService.getCurrentCompanyId();
        return historyRepository.findAllByCompanyIdOrderByServiceDateDescIdDesc(companyId).stream().map(this::toHistoryDto).toList();
    }

    @Transactional
    public AssetServiceHistoryDto createServiceHistory(AssetServiceHistoryUpsertRequest request) {
        Long companyId = securityContextService.getCurrentCompanyId();
        String serviceNumber = normalizeCode(request.serviceNumber(), "Service number");
        if (historyRepository.existsByCompanyIdAndServiceNumberIgnoreCase(companyId, serviceNumber)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Service number already exists");
        }
        AssetServiceHistoryEntity entity = new AssetServiceHistoryEntity();
        applyHistory(entity, request, companyId, serviceNumber);
        return toHistoryDto(historyRepository.save(entity));
    }

    @Transactional
    public AssetServiceHistoryDto updateServiceHistory(Long id, AssetServiceHistoryUpsertRequest request) {
        Long companyId = securityContextService.getCurrentCompanyId();
        AssetServiceHistoryEntity entity = requireHistory(id, companyId);
        String serviceNumber = normalizeCode(request.serviceNumber(), "Service number");
        if (historyRepository.existsByCompanyIdAndServiceNumberIgnoreCaseAndIdNot(companyId, serviceNumber, id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Service number already exists");
        }
        applyHistory(entity, request, companyId, serviceNumber);
        return toHistoryDto(historyRepository.save(entity));
    }

    @Transactional
    public void deleteServiceHistory(Long id) {
        historyRepository.delete(requireHistory(id, securityContextService.getCurrentCompanyId()));
    }

    private void applyAsset(AssetEntity entity, AssetUpsertRequest request, Long companyId, String assetCode) {
        PropertyEntity property = requireProperty(request.propertyId(), companyId);
        BuildingEntity building = request.buildingId() == null ? null : requireBuilding(request.buildingId(), companyId);
        UnitEntity unit = request.unitId() == null ? null : requireUnit(request.unitId(), companyId);
        validateLocation(property, building, unit);
        if (request.warrantyStartDate() != null && request.warrantyEndDate() != null && request.warrantyEndDate().isBefore(request.warrantyStartDate())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Warranty end date cannot be before warranty start date");
        }
        entity.setCompanyId(companyId);
        entity.setAssetCode(assetCode);
        entity.setAssetName(normalizeCode(request.assetName(), "Asset name"));
        entity.setAssetCategory(normalizeOption(request.assetCategory(), ASSET_CATEGORIES, "Asset category"));
        entity.setPropertyId(property.getId());
        entity.setBuildingId(building == null ? null : building.getId());
        entity.setUnitId(unit == null ? null : unit.getId());
        entity.setSerialNumber(normalizeNullable(request.serialNumber()));
        entity.setManufacturer(normalizeNullable(request.manufacturer()));
        entity.setModelNumber(normalizeNullable(request.modelNumber()));
        entity.setPurchaseDate(request.purchaseDate());
        entity.setPurchaseCost(nonNegativeOrNull(request.purchaseCost(), "Purchase cost"));
        entity.setInstallationDate(request.installationDate());
        entity.setConditionStatus(normalizeOption(request.conditionStatus(), CONDITION_STATUSES, "Condition status"));
        entity.setWarrantyProvider(normalizeNullable(request.warrantyProvider()));
        entity.setWarrantyStartDate(request.warrantyStartDate());
        entity.setWarrantyEndDate(request.warrantyEndDate());
        entity.setWarrantyTerms(normalizeNullable(request.warrantyTerms()));
        entity.setMaintenanceFrequency(request.maintenanceFrequency() == null || request.maintenanceFrequency().isBlank() ? null : normalizeOption(request.maintenanceFrequency(), MAINTENANCE_FREQUENCIES, "Maintenance frequency"));
        entity.setNextMaintenanceDate(request.nextMaintenanceDate());
        entity.setStatus(normalizeOption(request.status(), ASSET_STATUSES, "Asset status"));
        entity.setRemarks(normalizeNullable(request.remarks()));
    }

    private void applySchedule(AssetMaintenanceScheduleEntity entity, AssetMaintenanceScheduleUpsertRequest request, Long companyId, String scheduleNumber) {
        AssetEntity asset = requireAsset(request.assetId(), companyId);
        VendorEntity vendor = request.assignedVendorId() == null ? null : requireVendor(request.assignedVendorId(), companyId);
        entity.setCompanyId(companyId);
        entity.setScheduleNumber(scheduleNumber);
        entity.setAssetId(asset.getId());
        entity.setMaintenanceType(normalizeOption(request.maintenanceType(), MAINTENANCE_TYPES, "Maintenance type"));
        entity.setFrequency(normalizeOption(request.frequency(), MAINTENANCE_FREQUENCIES, "Frequency"));
        entity.setPlannedDate(request.plannedDate());
        entity.setAssignedVendorId(vendor == null ? null : vendor.getId());
        entity.setEstimatedCost(nonNegativeOrZero(request.estimatedCost(), "Estimated cost"));
        entity.setPriority(normalizeOption(request.priority(), PRIORITIES, "Priority"));
        entity.setStatus(normalizeOption(request.status(), SCHEDULE_STATUSES, "Schedule status"));
        entity.setRemarks(normalizeNullable(request.remarks()));
    }

    private void applyHistory(AssetServiceHistoryEntity entity, AssetServiceHistoryUpsertRequest request, Long companyId, String serviceNumber) {
        AssetEntity asset = requireAsset(request.assetId(), companyId);
        AssetMaintenanceScheduleEntity schedule = request.maintenanceScheduleId() == null ? null : requireSchedule(request.maintenanceScheduleId(), companyId);
        VendorEntity vendor = request.vendorId() == null ? null : requireVendor(request.vendorId(), companyId);
        if (schedule != null && !schedule.getAssetId().equals(asset.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Service schedule must belong to selected asset");
        }
        entity.setCompanyId(companyId);
        entity.setServiceNumber(serviceNumber);
        entity.setAssetId(asset.getId());
        entity.setMaintenanceScheduleId(schedule == null ? null : schedule.getId());
        entity.setServiceDate(request.serviceDate());
        entity.setServiceType(normalizeOption(request.serviceType(), MAINTENANCE_TYPES, "Service type"));
        entity.setVendorId(vendor == null ? null : vendor.getId());
        entity.setTechnicianName(normalizeNullable(request.technicianName()));
        entity.setConditionBefore(request.conditionBefore() == null || request.conditionBefore().isBlank() ? null : normalizeOption(request.conditionBefore(), CONDITION_STATUSES, "Condition before"));
        entity.setConditionAfter(normalizeOption(request.conditionAfter(), CONDITION_STATUSES, "Condition after"));
        entity.setWorkPerformed(normalizeCode(request.workPerformed(), "Work performed"));
        entity.setPartsReplaced(normalizeNullable(request.partsReplaced()));
        entity.setServiceCost(nonNegativeOrZero(request.serviceCost(), "Service cost"));
        entity.setNextServiceDate(request.nextServiceDate());
        entity.setStatus(normalizeOption(request.status(), SERVICE_STATUSES, "Service status"));
        entity.setRemarks(normalizeNullable(request.remarks()));

        asset.setConditionStatus(entity.getConditionAfter());
        asset.setNextMaintenanceDate(entity.getNextServiceDate());
        assetRepository.save(asset);
        if (schedule != null && "COMPLETED".equals(entity.getStatus())) {
            schedule.setStatus("COMPLETED");
            scheduleRepository.save(schedule);
        }
    }

    private void validateLocation(PropertyEntity property, BuildingEntity building, UnitEntity unit) {
        if (building != null && !building.getPropertyId().equals(property.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Building must belong to selected property");
        }
        if (unit != null && !unit.getPropertyId().equals(property.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unit must belong to selected property");
        }
        if (building != null && unit != null && !unit.getBuildingId().equals(building.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unit must belong to selected building");
        }
    }

    private AssetEntity requireAsset(Long id, Long companyId) {
        return assetRepository.findByIdAndCompanyId(id, companyId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Asset not found"));
    }

    private AssetMaintenanceScheduleEntity requireSchedule(Long id, Long companyId) {
        return scheduleRepository.findByIdAndCompanyId(id, companyId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Asset maintenance schedule not found"));
    }

    private AssetServiceHistoryEntity requireHistory(Long id, Long companyId) {
        return historyRepository.findByIdAndCompanyId(id, companyId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Asset service history not found"));
    }

    private PropertyEntity requireProperty(Long id, Long companyId) {
        return propertyRepository.findByIdAndCompanyId(id, companyId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Property not found"));
    }

    private BuildingEntity requireBuilding(Long id, Long companyId) {
        return buildingRepository.findByIdAndCompanyId(id, companyId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Building not found"));
    }

    private UnitEntity requireUnit(Long id, Long companyId) {
        return unitRepository.findByIdAndCompanyId(id, companyId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Unit not found"));
    }

    private VendorEntity requireVendor(Long id, Long companyId) {
        return vendorRepository.findByIdAndCompanyId(id, companyId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Vendor not found"));
    }

    private AssetDto toAssetDto(AssetEntity entity) {
        PropertyEntity property = propertyRepository.findById(entity.getPropertyId()).orElse(null);
        BuildingEntity building = entity.getBuildingId() == null ? null : buildingRepository.findById(entity.getBuildingId()).orElse(null);
        UnitEntity unit = entity.getUnitId() == null ? null : unitRepository.findById(entity.getUnitId()).orElse(null);
        return new AssetDto(entity.getId(), entity.getCompanyId(), entity.getAssetCode(), entity.getAssetName(), entity.getAssetCategory(), entity.getPropertyId(), property == null ? null : property.getPropertyName(), entity.getBuildingId(), building == null ? null : building.getBuildingName(), entity.getUnitId(), unit == null ? null : unit.getUnitNumber(), entity.getSerialNumber(), entity.getManufacturer(), entity.getModelNumber(), entity.getPurchaseDate(), entity.getPurchaseCost(), entity.getInstallationDate(), entity.getConditionStatus(), entity.getWarrantyProvider(), entity.getWarrantyStartDate(), entity.getWarrantyEndDate(), entity.getWarrantyTerms(), entity.getMaintenanceFrequency(), entity.getNextMaintenanceDate(), entity.getStatus(), entity.getRemarks());
    }

    private AssetMaintenanceScheduleDto toScheduleDto(AssetMaintenanceScheduleEntity entity) {
        AssetEntity asset = assetRepository.findById(entity.getAssetId()).orElse(null);
        VendorEntity vendor = entity.getAssignedVendorId() == null ? null : vendorRepository.findById(entity.getAssignedVendorId()).orElse(null);
        return new AssetMaintenanceScheduleDto(entity.getId(), entity.getCompanyId(), entity.getScheduleNumber(), entity.getAssetId(), asset == null ? null : asset.getAssetCode(), asset == null ? null : asset.getAssetName(), entity.getMaintenanceType(), entity.getFrequency(), entity.getPlannedDate(), entity.getAssignedVendorId(), vendor == null ? null : vendor.getVendorName(), entity.getEstimatedCost(), entity.getPriority(), entity.getStatus(), entity.getRemarks());
    }

    private AssetServiceHistoryDto toHistoryDto(AssetServiceHistoryEntity entity) {
        AssetEntity asset = assetRepository.findById(entity.getAssetId()).orElse(null);
        AssetMaintenanceScheduleEntity schedule = entity.getMaintenanceScheduleId() == null ? null : scheduleRepository.findById(entity.getMaintenanceScheduleId()).orElse(null);
        VendorEntity vendor = entity.getVendorId() == null ? null : vendorRepository.findById(entity.getVendorId()).orElse(null);
        return new AssetServiceHistoryDto(entity.getId(), entity.getCompanyId(), entity.getServiceNumber(), entity.getAssetId(), asset == null ? null : asset.getAssetCode(), asset == null ? null : asset.getAssetName(), entity.getMaintenanceScheduleId(), schedule == null ? null : schedule.getScheduleNumber(), entity.getServiceDate(), entity.getServiceType(), entity.getVendorId(), vendor == null ? null : vendor.getVendorName(), entity.getTechnicianName(), entity.getConditionBefore(), entity.getConditionAfter(), entity.getWorkPerformed(), entity.getPartsReplaced(), entity.getServiceCost(), entity.getNextServiceDate(), entity.getStatus(), entity.getRemarks());
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

    private BigDecimal nonNegativeOrNull(BigDecimal value, String label) {
        if (value == null) {
            return null;
        }
        if (value.compareTo(ZERO) < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, label + " cannot be negative");
        }
        return value;
    }

    private BigDecimal nonNegativeOrZero(BigDecimal value, String label) {
        BigDecimal normalized = value == null ? ZERO : value;
        if (normalized.compareTo(ZERO) < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, label + " cannot be negative");
        }
        return normalized;
    }
}
