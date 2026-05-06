package com.company.pms.building;

import com.company.pms.property.PropertyEntity;
import com.company.pms.property.PropertyRepository;
import com.company.pms.security.SecurityContextService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class BuildingService {

    private static final List<String> ALLOWED_STATUSES = List.of("ACTIVE", "INACTIVE");

    private final BuildingRepository buildingRepository;
    private final PropertyRepository propertyRepository;
    private final SecurityContextService securityContextService;

    public BuildingService(
        BuildingRepository buildingRepository,
        PropertyRepository propertyRepository,
        SecurityContextService securityContextService
    ) {
        this.buildingRepository = buildingRepository;
        this.propertyRepository = propertyRepository;
        this.securityContextService = securityContextService;
    }

    @Transactional(readOnly = true)
    public List<BuildingDto> getBuildings() {
        Long companyId = securityContextService.getCurrentCompanyId();
        List<BuildingEntity> buildings = buildingRepository.findAllByCompanyIdOrderByBuildingNameAscIdAsc(companyId);
        Map<Long, PropertyEntity> propertiesById = loadProperties(buildings);
        return buildings.stream().map(building -> toDto(building, propertiesById.get(building.getPropertyId()))).toList();
    }

    @Transactional(readOnly = true)
    public BuildingDto getBuilding(Long id) {
        Long companyId = securityContextService.getCurrentCompanyId();
        BuildingEntity building = buildingRepository.findByIdAndCompanyId(id, companyId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Building not found"));
        return toDto(building, requireProperty(building.getPropertyId(), companyId));
    }

    @Transactional
    public BuildingDto createBuilding(BuildingUpsertRequest request) {
        Long companyId = securityContextService.getCurrentCompanyId();
        PropertyEntity property = requireProperty(request.propertyId(), companyId);
        String buildingCode = normalizeCode(request.buildingCode(), "Building code");
        if (buildingRepository.existsByPropertyIdAndBuildingCodeIgnoreCase(property.getId(), buildingCode)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Building code already exists for this property");
        }
        BuildingEntity saved = buildingRepository.save(apply(new BuildingEntity(), request, companyId, property.getId(), buildingCode));
        return toDto(saved, property);
    }

    @Transactional
    public BuildingDto updateBuilding(Long id, BuildingUpsertRequest request) {
        Long companyId = securityContextService.getCurrentCompanyId();
        BuildingEntity building = buildingRepository.findByIdAndCompanyId(id, companyId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Building not found"));
        PropertyEntity property = requireProperty(request.propertyId(), companyId);
        String buildingCode = normalizeCode(request.buildingCode(), "Building code");
        if (buildingRepository.existsByPropertyIdAndBuildingCodeIgnoreCaseAndIdNot(property.getId(), buildingCode, id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Building code already exists for this property");
        }
        BuildingEntity saved = buildingRepository.save(apply(building, request, companyId, property.getId(), buildingCode));
        return toDto(saved, property);
    }

    @Transactional
    public void deleteBuilding(Long id) {
        Long companyId = securityContextService.getCurrentCompanyId();
        BuildingEntity building = buildingRepository.findByIdAndCompanyId(id, companyId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Building not found"));
        buildingRepository.delete(building);
    }

    private BuildingEntity apply(BuildingEntity building, BuildingUpsertRequest request, Long companyId, Long propertyId, String buildingCode) {
        building.setCompanyId(companyId);
        building.setPropertyId(propertyId);
        building.setBuildingCode(buildingCode);
        building.setBuildingName(normalizeRequiredText(request.buildingName(), "Building name"));
        building.setNumberOfFloors(nonNegativeInteger(request.numberOfFloors(), "Number of floors"));
        building.setAmenitiesSummary(normalizeText(request.amenitiesSummary()));
        building.setDescription(normalizeText(request.description()));
        building.setStatus(normalizeStatus(request.status()));
        return building;
    }

    private BuildingDto toDto(BuildingEntity building, PropertyEntity property) {
        return new BuildingDto(
            building.getId(),
            building.getCompanyId(),
            building.getPropertyId(),
            property == null ? null : property.getPropertyCode(),
            property == null ? null : property.getPropertyName(),
            building.getBuildingCode(),
            building.getBuildingName(),
            building.getNumberOfFloors(),
            building.getAmenitiesSummary(),
            building.getDescription(),
            building.getStatus()
        );
    }

    private Map<Long, PropertyEntity> loadProperties(List<BuildingEntity> buildings) {
        return propertyRepository.findAllById(buildings.stream().map(BuildingEntity::getPropertyId).distinct().toList()).stream()
            .collect(Collectors.toMap(PropertyEntity::getId, Function.identity()));
    }

    private PropertyEntity requireProperty(Long propertyId, Long companyId) {
        return propertyRepository.findByIdAndCompanyId(propertyId, companyId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selected property was not found in the active company"));
    }

    private String normalizeCode(String value, String label) {
        String normalized = normalizeRequiredText(value, label);
        return normalized.toUpperCase();
    }

    private String normalizeRequiredText(String value, String label) {
        String normalized = normalizeText(value);
        if (normalized == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, label + " is required");
        }
        return normalized;
    }

    private String normalizeStatus(String value) {
        String normalized = normalizeRequiredText(value, "Status").toUpperCase();
        if (!ALLOWED_STATUSES.contains(normalized)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Status is invalid");
        }
        return normalized;
    }

    private Integer nonNegativeInteger(Integer value, String label) {
        if (value != null && value < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, label + " cannot be negative");
        }
        return value;
    }

    private String normalizeText(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
