package com.company.pms.floor;

import com.company.pms.building.BuildingEntity;
import com.company.pms.building.BuildingRepository;
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
public class FloorService {

    private static final List<String> ALLOWED_STATUSES = List.of("ACTIVE", "INACTIVE");

    private final FloorRepository floorRepository;
    private final BuildingRepository buildingRepository;
    private final PropertyRepository propertyRepository;
    private final SecurityContextService securityContextService;

    public FloorService(
        FloorRepository floorRepository,
        BuildingRepository buildingRepository,
        PropertyRepository propertyRepository,
        SecurityContextService securityContextService
    ) {
        this.floorRepository = floorRepository;
        this.buildingRepository = buildingRepository;
        this.propertyRepository = propertyRepository;
        this.securityContextService = securityContextService;
    }

    @Transactional(readOnly = true)
    public List<FloorDto> getFloors() {
        Long companyId = securityContextService.getCurrentCompanyId();
        List<FloorEntity> floors = floorRepository.findAllByCompanyIdOrderByFloorNameAscIdAsc(companyId);
        Map<Long, BuildingEntity> buildingsById = loadBuildings(floors);
        Map<Long, PropertyEntity> propertiesById = loadProperties(floors);
        return floors.stream()
            .map(floor -> toDto(floor, propertiesById.get(floor.getPropertyId()), buildingsById.get(floor.getBuildingId())))
            .toList();
    }

    @Transactional(readOnly = true)
    public FloorDto getFloor(Long id) {
        Long companyId = securityContextService.getCurrentCompanyId();
        FloorEntity floor = floorRepository.findByIdAndCompanyId(id, companyId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Floor not found"));
        BuildingEntity building = requireBuilding(floor.getBuildingId(), companyId);
        PropertyEntity property = requireProperty(floor.getPropertyId(), companyId);
        return toDto(floor, property, building);
    }

    @Transactional
    public FloorDto createFloor(FloorUpsertRequest request) {
        Long companyId = securityContextService.getCurrentCompanyId();
        BuildingEntity building = requireBuilding(request.buildingId(), companyId);
        PropertyEntity property = requireProperty(building.getPropertyId(), companyId);
        String floorCode = normalizeCode(request.floorCode(), "Floor code");
        validateUniqueness(building.getId(), floorCode, request.floorNumber(), null);
        FloorEntity saved = floorRepository.save(apply(new FloorEntity(), request, companyId, property.getId(), building.getId(), floorCode));
        return toDto(saved, property, building);
    }

    @Transactional
    public FloorDto updateFloor(Long id, FloorUpsertRequest request) {
        Long companyId = securityContextService.getCurrentCompanyId();
        FloorEntity floor = floorRepository.findByIdAndCompanyId(id, companyId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Floor not found"));
        BuildingEntity building = requireBuilding(request.buildingId(), companyId);
        PropertyEntity property = requireProperty(building.getPropertyId(), companyId);
        String floorCode = normalizeCode(request.floorCode(), "Floor code");
        validateUniqueness(building.getId(), floorCode, request.floorNumber(), id);
        FloorEntity saved = floorRepository.save(apply(floor, request, companyId, property.getId(), building.getId(), floorCode));
        return toDto(saved, property, building);
    }

    @Transactional
    public void deleteFloor(Long id) {
        Long companyId = securityContextService.getCurrentCompanyId();
        FloorEntity floor = floorRepository.findByIdAndCompanyId(id, companyId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Floor not found"));
        floorRepository.delete(floor);
    }

    private void validateUniqueness(Long buildingId, String floorCode, Integer floorNumber, Long existingId) {
        boolean floorCodeExists = existingId == null
            ? floorRepository.existsByBuildingIdAndFloorCodeIgnoreCase(buildingId, floorCode)
            : floorRepository.existsByBuildingIdAndFloorCodeIgnoreCaseAndIdNot(buildingId, floorCode, existingId);
        if (floorCodeExists) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Floor code already exists for this building");
        }

        boolean floorNumberExists = existingId == null
            ? floorRepository.existsByBuildingIdAndFloorNumber(buildingId, floorNumber)
            : floorRepository.existsByBuildingIdAndFloorNumberAndIdNot(buildingId, floorNumber, existingId);
        if (floorNumberExists) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Floor number already exists for this building");
        }
    }

    private FloorEntity apply(
        FloorEntity floor,
        FloorUpsertRequest request,
        Long companyId,
        Long propertyId,
        Long buildingId,
        String floorCode
    ) {
        floor.setCompanyId(companyId);
        floor.setPropertyId(propertyId);
        floor.setBuildingId(buildingId);
        floor.setFloorCode(floorCode);
        floor.setFloorName(normalizeRequiredText(request.floorName(), "Floor name"));
        floor.setFloorNumber(request.floorNumber());
        floor.setStatus(normalizeStatus(request.status()));
        return floor;
    }

    private FloorDto toDto(FloorEntity floor, PropertyEntity property, BuildingEntity building) {
        return new FloorDto(
            floor.getId(),
            floor.getCompanyId(),
            floor.getPropertyId(),
            property == null ? null : property.getPropertyCode(),
            property == null ? null : property.getPropertyName(),
            floor.getBuildingId(),
            building == null ? null : building.getBuildingCode(),
            building == null ? null : building.getBuildingName(),
            floor.getFloorCode(),
            floor.getFloorName(),
            floor.getFloorNumber(),
            floor.getStatus()
        );
    }

    private Map<Long, BuildingEntity> loadBuildings(List<FloorEntity> floors) {
        return buildingRepository.findAllById(floors.stream().map(FloorEntity::getBuildingId).distinct().toList()).stream()
            .collect(Collectors.toMap(BuildingEntity::getId, Function.identity()));
    }

    private Map<Long, PropertyEntity> loadProperties(List<FloorEntity> floors) {
        return propertyRepository.findAllById(floors.stream().map(FloorEntity::getPropertyId).distinct().toList()).stream()
            .collect(Collectors.toMap(PropertyEntity::getId, Function.identity()));
    }

    private BuildingEntity requireBuilding(Long buildingId, Long companyId) {
        return buildingRepository.findByIdAndCompanyId(buildingId, companyId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selected building was not found in the active company"));
    }

    private PropertyEntity requireProperty(Long propertyId, Long companyId) {
        return propertyRepository.findByIdAndCompanyId(propertyId, companyId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selected property was not found in the active company"));
    }

    private String normalizeCode(String value, String label) {
        return normalizeRequiredText(value, label).toUpperCase();
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

    private String normalizeText(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
