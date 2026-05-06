package com.company.pms.property;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.company.pms.auth.UserEntity;
import com.company.pms.auth.UserCompanyRepository;
import com.company.pms.auth.UserRepository;
import com.company.pms.branch.BranchEntity;
import com.company.pms.branch.BranchRepository;
import com.company.pms.company.CompanyEntity;
import com.company.pms.company.CompanyRepository;
import com.company.pms.security.SecurityContextService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class PropertyService {

    private static final List<String> ALLOWED_PROPERTY_TYPES = List.of(
        "APARTMENT",
        "VILLA",
        "COMMERCIAL_BUILDING",
        "OFFICE_SPACE",
        "RETAIL",
        "WAREHOUSE",
        "LAND",
        "MIXED_USE_PROPERTY"
    );

    private static final List<String> ALLOWED_OWNERSHIP_TYPES = List.of(
        "OWN",
        "MANAGED",
        "LEASED",
        "JOINT_VENTURE"
    );

    private static final List<String> ALLOWED_STATUSES = List.of(
        "ACTIVE",
        "INACTIVE",
        "UNDER_MAINTENANCE"
    );
    private static final int MAX_ATTACHMENT_COUNT = 10;
    private static final TypeReference<List<PropertyAttachmentDto>> PROPERTY_ATTACHMENT_LIST_TYPE = new TypeReference<>() {
    };

    private final PropertyRepository propertyRepository;
    private final CompanyRepository companyRepository;
    private final BranchRepository branchRepository;
    private final UserRepository userRepository;
    private final UserCompanyRepository userCompanyRepository;
    private final SecurityContextService securityContextService;
    private final ObjectMapper objectMapper;

    public PropertyService(
        PropertyRepository propertyRepository,
        CompanyRepository companyRepository,
        BranchRepository branchRepository,
        UserRepository userRepository,
        UserCompanyRepository userCompanyRepository,
        SecurityContextService securityContextService,
        ObjectMapper objectMapper
    ) {
        this.propertyRepository = propertyRepository;
        this.companyRepository = companyRepository;
        this.branchRepository = branchRepository;
        this.userRepository = userRepository;
        this.userCompanyRepository = userCompanyRepository;
        this.securityContextService = securityContextService;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public List<PropertyDto> getProperties() {
        Long companyId = securityContextService.getCurrentCompanyId();
        List<PropertyEntity> properties = propertyRepository.findAllByCompanyIdOrderByPropertyNameAscIdAsc(companyId);
        Map<Long, BranchEntity> branchesById = loadBranchesById(properties);
        return properties.stream()
            .map(property -> toDto(property, requireCompany(companyId), branchesById.get(property.getBranchId())))
            .toList();
    }

    @Transactional(readOnly = true)
    public PropertyDto getProperty(Long id) {
        Long companyId = securityContextService.getCurrentCompanyId();
        PropertyEntity property = propertyRepository.findByIdAndCompanyId(id, companyId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Property not found"));
        return toDto(property, requireCompany(companyId), resolveBranch(property.getBranchId()));
    }

    @Transactional
    public PropertyDto createProperty(PropertyUpsertRequest request) {
        Long companyId = securityContextService.getCurrentCompanyId();
        String propertyCode = normalizeCode(request.propertyCode());
        if (propertyRepository.existsByCompanyIdAndPropertyCodeIgnoreCase(companyId, propertyCode)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Property code already exists for the active company");
        }

        CompanyEntity company = requireCompany(companyId);
        BranchEntity branch = validateBranch(companyId, request.branchId());
        UserEntity propertyManager = resolveManager(request.propertyManagerUserId(), companyId, "property manager");
        PropertyEntity saved = propertyRepository.save(apply(new PropertyEntity(), request, companyId, propertyCode, branch, propertyManager));
        return toDto(saved, company, branch);
    }

    @Transactional
    public PropertyDto updateProperty(Long id, PropertyUpsertRequest request) {
        Long companyId = securityContextService.getCurrentCompanyId();
        PropertyEntity property = propertyRepository.findByIdAndCompanyId(id, companyId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Property not found"));

        String propertyCode = normalizeCode(request.propertyCode());
        if (propertyRepository.existsByCompanyIdAndPropertyCodeIgnoreCaseAndIdNot(companyId, propertyCode, id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Property code already exists for the active company");
        }

        CompanyEntity company = requireCompany(companyId);
        BranchEntity branch = validateBranch(companyId, request.branchId());
        UserEntity propertyManager = resolveManager(request.propertyManagerUserId(), companyId, "property manager");
        PropertyEntity saved = propertyRepository.save(apply(property, request, companyId, propertyCode, branch, propertyManager));
        return toDto(saved, company, branch);
    }

    @Transactional
    public void deleteProperty(Long id) {
        Long companyId = securityContextService.getCurrentCompanyId();
        PropertyEntity property = propertyRepository.findByIdAndCompanyId(id, companyId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Property not found"));
        propertyRepository.delete(property);
    }

    private PropertyEntity apply(
        PropertyEntity property,
        PropertyUpsertRequest request,
        Long companyId,
        String propertyCode,
        BranchEntity branch,
        UserEntity propertyManager
    ) {
        property.setCompanyId(companyId);
        property.setBranchId(branch == null ? null : branch.getId());
        property.setPropertyCode(propertyCode);
        property.setPropertyName(request.propertyName().trim());
        property.setPropertyType(normalizeChoice(request.propertyType(), ALLOWED_PROPERTY_TYPES, "Property type"));
        property.setOwnershipType(normalizeChoice(request.ownershipType(), ALLOWED_OWNERSHIP_TYPES, "Ownership type"));
        property.setOwnerReference(normalizeText(request.ownerReference()));
        property.setOwnershipDetails(normalizeText(request.ownershipDetails()));
        property.setAddress(normalizeText(request.address()));
        property.setCity(normalizeText(request.city()));
        property.setState(normalizeText(request.state()));
        property.setCountry(normalizeText(request.country()));
        property.setPincode(normalizeText(request.pincode()));
        property.setTotalFloors(nonNegativeInteger(request.totalFloors(), "Total floors"));
        property.setTotalUnits(nonNegativeInteger(request.totalUnits(), "Total units"));
        property.setPropertyManagerUserId(propertyManager == null ? null : propertyManager.getId());
        property.setPropertyManagerName(propertyManager == null ? null : propertyManager.getFullName());
        property.setAmenitiesSummary(normalizeText(request.amenitiesSummary()));
        property.setDocumentAttachmentsJson(serializeAttachments(normalizeAttachments(request.documentAttachments())));
        property.setStatus(normalizeChoice(request.status(), ALLOWED_STATUSES, "Status"));
        return property;
    }

    private PropertyDto toDto(PropertyEntity property, CompanyEntity company, BranchEntity branch) {
        return new PropertyDto(
            property.getId(),
            property.getCompanyId(),
            company == null ? null : company.getCompanyName(),
            company == null ? null : company.getCompanyCode(),
            property.getBranchId(),
            branch == null ? null : branch.getBranchName(),
            branch == null ? null : branch.getBranchCode(),
            property.getPropertyCode(),
            property.getPropertyName(),
            property.getPropertyType(),
            property.getOwnershipType(),
            property.getOwnerReference(),
            property.getOwnershipDetails(),
            property.getAddress(),
            property.getCity(),
            property.getState(),
            property.getCountry(),
            property.getPincode(),
            property.getTotalFloors(),
            property.getTotalUnits(),
            property.getPropertyManagerUserId(),
            property.getPropertyManagerName(),
            property.getAmenitiesSummary(),
            deserializeAttachments(property.getDocumentAttachmentsJson()),
            property.getStatus()
        );
    }

    private CompanyEntity requireCompany(Long companyId) {
        return companyRepository.findById(companyId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Active company was not found"));
    }

    private BranchEntity validateBranch(Long companyId, Long branchId) {
        if (branchId == null) {
            return null;
        }
        BranchEntity branch = branchRepository.findById(branchId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selected branch was not found"));
        if (!companyId.equals(branch.getCompanyId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selected branch does not belong to the active company");
        }
        if (!branch.isActive()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Inactive branch cannot be assigned to a property");
        }
        return branch;
    }

    private BranchEntity resolveBranch(Long branchId) {
        if (branchId == null) {
            return null;
        }
        return branchRepository.findById(branchId).orElse(null);
    }

    private UserEntity resolveManager(Long userId, Long companyId, String label) {
        if (userId == null) {
            return null;
        }
        UserEntity user = userRepository.findById(userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selected " + label + " was not found"));
        if (!user.isActive()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selected " + label + " is inactive");
        }
        boolean assignedToCompany = userCompanyRepository.findByUserIdAndCompanyIdAndStatusIgnoreCase(userId, companyId, "ACTIVE").isPresent();
        if (!assignedToCompany) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selected " + label + " is not assigned to the active company");
        }
        return user;
    }

    private Map<Long, BranchEntity> loadBranchesById(List<PropertyEntity> properties) {
        return branchRepository.findAllById(properties.stream()
                .map(PropertyEntity::getBranchId)
                .filter(java.util.Objects::nonNull)
                .distinct()
                .toList())
            .stream()
            .collect(Collectors.toMap(BranchEntity::getId, Function.identity()));
    }

    private String normalizeCode(String value) {
        String normalized = normalizeText(value);
        if (normalized == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Property code is required");
        }
        return normalized.toUpperCase();
    }

    private String normalizeChoice(String value, List<String> allowedValues, String label) {
        String normalized = normalizeText(value);
        if (normalized == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, label + " is required");
        }
        String candidate = normalized.toUpperCase(Locale.ENGLISH);
        if (!allowedValues.contains(candidate)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, label + " is invalid");
        }
        return candidate;
    }

    private List<PropertyAttachmentDto> normalizeAttachments(List<PropertyAttachmentRequest> attachments) {
        if (attachments == null || attachments.isEmpty()) {
            return List.of();
        }
        if (attachments.size() > MAX_ATTACHMENT_COUNT) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A maximum of " + MAX_ATTACHMENT_COUNT + " attachments is allowed");
        }

        List<PropertyAttachmentDto> normalized = new ArrayList<>();
        for (PropertyAttachmentRequest attachment : attachments) {
            if (attachment == null) {
                continue;
            }

            String fileName = normalizeRequiredText(attachment.fileName(), "Attachment file name");
            String contentType = normalizeRequiredText(attachment.contentType(), "Attachment content type");
            String dataUrl = normalizeRequiredText(attachment.dataUrl(), "Attachment content");
            if (!dataUrl.startsWith("data:")) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Attachment content must be a valid data URL");
            }
            if (attachment.fileSize() != null && attachment.fileSize() < 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Attachment size cannot be negative");
            }

            normalized.add(new PropertyAttachmentDto(fileName, contentType, dataUrl, attachment.fileSize()));
        }
        return List.copyOf(normalized);
    }

    private String serializeAttachments(List<PropertyAttachmentDto> attachments) {
        try {
            return objectMapper.writeValueAsString(attachments == null ? List.of() : attachments);
        } catch (JsonProcessingException exception) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Unable to store property attachments", exception);
        }
    }

    private List<PropertyAttachmentDto> deserializeAttachments(String value) {
        String normalized = normalizeText(value);
        if (normalized == null) {
            return List.of();
        }
        try {
            return objectMapper.readValue(normalized, PROPERTY_ATTACHMENT_LIST_TYPE);
        } catch (JsonProcessingException exception) {
            return List.of();
        }
    }

    private String normalizeRequiredText(String value, String label) {
        String normalized = normalizeText(value);
        if (normalized == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, label + " is required");
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
