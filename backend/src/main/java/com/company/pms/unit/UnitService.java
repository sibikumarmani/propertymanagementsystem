package com.company.pms.unit;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.company.pms.building.BuildingEntity;
import com.company.pms.building.BuildingRepository;
import com.company.pms.floor.FloorEntity;
import com.company.pms.floor.FloorRepository;
import com.company.pms.property.PropertyEntity;
import com.company.pms.property.PropertyRepository;
import com.company.pms.security.SecurityContextService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Locale;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class UnitService {

    private static final List<String> ALLOWED_UNIT_TYPES = List.of(
        "STUDIO",
        "1_BHK",
        "2_BHK",
        "3_BHK",
        "OFFICE",
        "SHOP",
        "WAREHOUSE",
        "PARKING",
        "STORAGE"
    );
    private static final List<String> ALLOWED_UNIT_STATUSES = List.of(
        "AVAILABLE",
        "OCCUPIED",
        "RESERVED",
        "UNDER_MAINTENANCE",
        "BLOCKED",
        "INACTIVE"
    );
    private static final List<String> ALLOWED_AREA_UNITS = List.of("SQ_FT", "SQ_M");
    private static final int MAX_ATTACHMENT_COUNT = 10;
    private static final TypeReference<List<UnitAttachmentDto>> UNIT_ATTACHMENT_LIST_TYPE = new TypeReference<>() {
    };

    private final UnitRepository unitRepository;
    private final PropertyRepository propertyRepository;
    private final BuildingRepository buildingRepository;
    private final FloorRepository floorRepository;
    private final SecurityContextService securityContextService;
    private final ObjectMapper objectMapper;

    public UnitService(
        UnitRepository unitRepository,
        PropertyRepository propertyRepository,
        BuildingRepository buildingRepository,
        FloorRepository floorRepository,
        SecurityContextService securityContextService,
        ObjectMapper objectMapper
    ) {
        this.unitRepository = unitRepository;
        this.propertyRepository = propertyRepository;
        this.buildingRepository = buildingRepository;
        this.floorRepository = floorRepository;
        this.securityContextService = securityContextService;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public List<UnitDto> getUnits() {
        Long companyId = securityContextService.getCurrentCompanyId();
        List<UnitEntity> units = unitRepository.findAllByCompanyIdOrderByUnitCodeAscIdAsc(companyId);
        Map<Long, PropertyEntity> propertiesById = propertyRepository.findAllById(units.stream().map(UnitEntity::getPropertyId).distinct().toList()).stream()
            .collect(Collectors.toMap(PropertyEntity::getId, Function.identity()));
        Map<Long, BuildingEntity> buildingsById = buildingRepository.findAllById(units.stream().map(UnitEntity::getBuildingId).distinct().toList()).stream()
            .collect(Collectors.toMap(BuildingEntity::getId, Function.identity()));
        Map<Long, FloorEntity> floorsById = floorRepository.findAllById(units.stream().map(UnitEntity::getFloorId).distinct().toList()).stream()
            .collect(Collectors.toMap(FloorEntity::getId, Function.identity()));
        return units.stream().map(unit -> toDto(unit, propertiesById.get(unit.getPropertyId()), buildingsById.get(unit.getBuildingId()), floorsById.get(unit.getFloorId()))).toList();
    }

    @Transactional(readOnly = true)
    public UnitOptionsDto getUnitOptions() {
        return new UnitOptionsDto(
            ALLOWED_UNIT_TYPES,
            ALLOWED_UNIT_STATUSES,
            ALLOWED_AREA_UNITS
        );
    }

    @Transactional(readOnly = true)
    public UnitDto getUnit(Long id) {
        Long companyId = securityContextService.getCurrentCompanyId();
        UnitEntity unit = unitRepository.findByIdAndCompanyId(id, companyId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Unit not found"));
        PropertyEntity property = requireProperty(unit.getPropertyId(), companyId);
        BuildingEntity building = requireBuilding(unit.getBuildingId(), companyId);
        FloorEntity floor = requireFloor(unit.getFloorId(), companyId);
        return toDto(unit, property, building, floor);
    }

    @Transactional
    public UnitDto createUnit(UnitUpsertRequest request) {
        Long companyId = securityContextService.getCurrentCompanyId();
        PropertyEntity property = requireProperty(request.propertyId(), companyId);
        BuildingEntity building = requireBuilding(request.buildingId(), companyId);
        FloorEntity floor = requireFloor(request.floorId(), companyId);
        validateHierarchy(property, building, floor);
        String unitCode = normalizeCode(request.unitCode(), "Unit code");
        validateUnitCode(property.getId(), unitCode, null);
        UnitEntity saved = unitRepository.save(apply(new UnitEntity(), request, companyId, property.getId(), building.getId(), floor.getId(), unitCode));
        return toDto(saved, property, building, floor);
    }

    @Transactional
    public UnitDto updateUnit(Long id, UnitUpsertRequest request) {
        Long companyId = securityContextService.getCurrentCompanyId();
        UnitEntity unit = unitRepository.findByIdAndCompanyId(id, companyId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Unit not found"));
        PropertyEntity property = requireProperty(request.propertyId(), companyId);
        BuildingEntity building = requireBuilding(request.buildingId(), companyId);
        FloorEntity floor = requireFloor(request.floorId(), companyId);
        validateHierarchy(property, building, floor);
        String unitCode = normalizeCode(request.unitCode(), "Unit code");
        validateUnitCode(property.getId(), unitCode, id);
        UnitEntity saved = unitRepository.save(apply(unit, request, companyId, property.getId(), building.getId(), floor.getId(), unitCode));
        return toDto(saved, property, building, floor);
    }

    @Transactional
    public void deleteUnit(Long id) {
        Long companyId = securityContextService.getCurrentCompanyId();
        UnitEntity unit = unitRepository.findByIdAndCompanyId(id, companyId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Unit not found"));
        unitRepository.delete(unit);
    }

    private UnitEntity apply(UnitEntity unit, UnitUpsertRequest request, Long companyId, Long propertyId, Long buildingId, Long floorId, String unitCode) {
        unit.setCompanyId(companyId);
        unit.setPropertyId(propertyId);
        unit.setBuildingId(buildingId);
        unit.setFloorId(floorId);
        unit.setUnitCode(unitCode);
        unit.setUnitNumber(normalizeRequiredText(request.unitNumber(), "Unit number"));
        unit.setUnitType(normalizeUnitType(request.unitType()));
        unit.setAreaValue(nonNegativeDecimal(request.areaValue(), "Area"));
        unit.setAreaUnit(normalizeAreaUnit(request.areaUnit()));
        unit.setBaseRent(nonNegativeDecimal(request.baseRent(), "Base rent"));
        unit.setSecurityDepositAmount(nonNegativeDecimal(request.securityDepositAmount(), "Security deposit amount"));
        unit.setUnitStatus(normalizeStatus(request.unitStatus()));
        unit.setAvailabilityDate(request.availabilityDate());
        unit.setPhotoAttachmentsJson(serializeAttachments(normalizeAttachments(request.photoAttachments(), true)));
        unit.setDocumentAttachmentsJson(serializeAttachments(normalizeAttachments(request.documentAttachments(), false)));
        return unit;
    }

    private UnitDto toDto(UnitEntity unit, PropertyEntity property, BuildingEntity building, FloorEntity floor) {
        return new UnitDto(
            unit.getId(),
            unit.getCompanyId(),
            unit.getPropertyId(),
            property == null ? null : property.getPropertyCode(),
            property == null ? null : property.getPropertyName(),
            unit.getBuildingId(),
            building == null ? null : building.getBuildingCode(),
            building == null ? null : building.getBuildingName(),
            unit.getFloorId(),
            floor == null ? null : floor.getFloorCode(),
            floor == null ? null : floor.getFloorName(),
            unit.getUnitCode(),
            unit.getUnitNumber(),
            unit.getUnitType(),
            unit.getAreaValue(),
            unit.getAreaUnit(),
            unit.getBaseRent(),
            unit.getSecurityDepositAmount(),
            unit.getUnitStatus(),
            unit.getAvailabilityDate(),
            deserializeAttachments(unit.getPhotoAttachmentsJson()),
            deserializeAttachments(unit.getDocumentAttachmentsJson())
        );
    }

    private PropertyEntity requireProperty(Long propertyId, Long companyId) {
        return propertyRepository.findByIdAndCompanyId(propertyId, companyId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selected property was not found in the active company"));
    }

    private BuildingEntity requireBuilding(Long buildingId, Long companyId) {
        return buildingRepository.findByIdAndCompanyId(buildingId, companyId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selected building was not found in the active company"));
    }

    private FloorEntity requireFloor(Long floorId, Long companyId) {
        return floorRepository.findByIdAndCompanyId(floorId, companyId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selected floor was not found in the active company"));
    }

    private void validateHierarchy(PropertyEntity property, BuildingEntity building, FloorEntity floor) {
        if (!property.getId().equals(building.getPropertyId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selected building does not belong to the selected property");
        }
        if (!building.getId().equals(floor.getBuildingId()) || !property.getId().equals(floor.getPropertyId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selected floor does not belong to the selected building and property");
        }
    }

    private void validateUnitCode(Long propertyId, String unitCode, Long existingId) {
        boolean exists = existingId == null
            ? unitRepository.existsByPropertyIdAndUnitCodeIgnoreCase(propertyId, unitCode)
            : unitRepository.existsByPropertyIdAndUnitCodeIgnoreCaseAndIdNot(propertyId, unitCode, existingId);
        if (exists) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Unit code already exists for this property");
        }
    }

    private String normalizeCode(String value, String label) {
        String normalized = normalizeText(value);
        if (normalized == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, label + " is required");
        }
        return normalized.toUpperCase();
    }

    private String normalizeRequiredText(String value, String label) {
        String normalized = normalizeText(value);
        if (normalized == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, label + " is required");
        }
        return normalized;
    }

    private String normalizeUnitType(String value) {
        String normalized = normalizeRequiredText(value, "Unit type").toUpperCase(Locale.ENGLISH);
        if (!ALLOWED_UNIT_TYPES.contains(normalized)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unit type is invalid");
        }
        return normalized;
    }

    private String normalizeAreaUnit(String value) {
        String normalized = normalizeRequiredText(value, "Area unit").toUpperCase(Locale.ENGLISH);
        if (!ALLOWED_AREA_UNITS.contains(normalized)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Area unit is invalid");
        }
        return normalized;
    }

    private String normalizeStatus(String value) {
        String normalized = normalizeRequiredText(value, "Unit status").toUpperCase(Locale.ENGLISH);
        if (!ALLOWED_UNIT_STATUSES.contains(normalized)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unit status is invalid");
        }
        return normalized;
    }

    private BigDecimal nonNegativeDecimal(BigDecimal value, String label) {
        if (value != null && value.compareTo(BigDecimal.ZERO) < 0) {
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

    private List<UnitAttachmentDto> normalizeAttachments(List<UnitAttachmentRequest> attachments, boolean imageOnly) {
        if (attachments == null || attachments.isEmpty()) {
            return List.of();
        }
        if (attachments.size() > MAX_ATTACHMENT_COUNT) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A maximum of " + MAX_ATTACHMENT_COUNT + " attachments is allowed");
        }

        List<UnitAttachmentDto> normalized = new ArrayList<>();
        for (UnitAttachmentRequest attachment : attachments) {
            if (attachment == null) {
                continue;
            }

            String fileName = normalizeRequiredText(attachment.fileName(), "Attachment file name");
            String contentType = normalizeRequiredText(attachment.contentType(), "Attachment content type");
            String dataUrl = normalizeRequiredText(attachment.dataUrl(), "Attachment content");
            if (!dataUrl.startsWith("data:")) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Attachment content must be a valid data URL");
            }
            if (imageOnly && !dataUrl.startsWith("data:image/")) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Photo attachments must be image files");
            }
            if (attachment.fileSize() != null && attachment.fileSize() < 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Attachment size cannot be negative");
            }

            normalized.add(new UnitAttachmentDto(fileName, contentType, dataUrl, attachment.fileSize()));
        }
        return List.copyOf(normalized);
    }

    private String serializeAttachments(List<UnitAttachmentDto> attachments) {
        try {
            return objectMapper.writeValueAsString(attachments == null ? List.of() : attachments);
        } catch (JsonProcessingException exception) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Unable to store unit attachments", exception);
        }
    }

    private List<UnitAttachmentDto> deserializeAttachments(String value) {
        String normalized = normalizeText(value);
        if (normalized == null) {
            return List.of();
        }
        try {
            return objectMapper.readValue(normalized, UNIT_ATTACHMENT_LIST_TYPE);
        } catch (JsonProcessingException exception) {
            return List.of();
        }
    }

}
