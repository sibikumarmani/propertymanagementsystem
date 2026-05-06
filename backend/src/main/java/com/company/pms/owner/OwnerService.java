package com.company.pms.owner;

import com.company.pms.company.CompanyEntity;
import com.company.pms.company.CompanyRepository;
import com.company.pms.property.PropertyEntity;
import com.company.pms.property.PropertyRepository;
import com.company.pms.security.SecurityContextService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.Collection;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class OwnerService {

    private static final List<String> ALLOWED_PAYOUT_FREQUENCIES = List.of(
        "MONTHLY",
        "QUARTERLY",
        "HALF_YEARLY",
        "YEARLY",
        "ON_DEMAND"
    );

    private static final List<String> ALLOWED_STATEMENT_PREFERENCES = List.of(
        "EMAIL",
        "PORTAL",
        "EMAIL_AND_PORTAL",
        "PRINTED"
    );

    private static final List<String> ALLOWED_OWNER_STATUSES = List.of(
        "ACTIVE",
        "INACTIVE"
    );

    private static final List<String> ALLOWED_STATEMENT_STAGES = List.of(
        "RENT_COLLECTED",
        "MANAGEMENT_FEE_DEDUCTED",
        "MAINTENANCE_EXPENSES_DEDUCTED",
        "TAXES_AND_OTHER_CHARGES_DEDUCTED",
        "OWNER_PAYABLE_CALCULATED",
        "OWNER_STATEMENT_GENERATED",
        "STATEMENT_APPROVED",
        "OWNER_PAYMENT_PROCESSED"
    );

    private final OwnerRepository ownerRepository;
    private final OwnerPropertyRepository ownerPropertyRepository;
    private final PropertyRepository propertyRepository;
    private final CompanyRepository companyRepository;
    private final SecurityContextService securityContextService;

    public OwnerService(
        OwnerRepository ownerRepository,
        OwnerPropertyRepository ownerPropertyRepository,
        PropertyRepository propertyRepository,
        CompanyRepository companyRepository,
        SecurityContextService securityContextService
    ) {
        this.ownerRepository = ownerRepository;
        this.ownerPropertyRepository = ownerPropertyRepository;
        this.propertyRepository = propertyRepository;
        this.companyRepository = companyRepository;
        this.securityContextService = securityContextService;
    }

    @Transactional(readOnly = true)
    public List<OwnerDto> getOwners() {
        Long companyId = securityContextService.getCurrentCompanyId();
        CompanyEntity company = requireCompany(companyId);
        List<OwnerEntity> owners = ownerRepository.findAllByCompanyIdOrderByOwnerNameAscIdAsc(companyId);
        Map<Long, List<OwnerPropertyEntity>> ownerProperties = ownerPropertyRepository.findAllByOwnerIdIn(
            owners.stream().map(OwnerEntity::getId).toList()
        ).stream().collect(Collectors.groupingBy(OwnerPropertyEntity::getOwnerId));
        Map<Long, PropertyEntity> propertiesById = loadPropertiesById(ownerProperties.values().stream().flatMap(Collection::stream).map(OwnerPropertyEntity::getPropertyId).toList());
        return owners.stream()
            .map(owner -> toDto(owner, company, ownerProperties.getOrDefault(owner.getId(), List.of()), propertiesById))
            .toList();
    }

    @Transactional(readOnly = true)
    public OwnerDto getOwner(Long id) {
        Long companyId = securityContextService.getCurrentCompanyId();
        CompanyEntity company = requireCompany(companyId);
        OwnerEntity owner = ownerRepository.findByIdAndCompanyId(id, companyId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Owner not found"));
        List<OwnerPropertyEntity> ownerProperties = ownerPropertyRepository.findAllByOwnerId(owner.getId());
        Map<Long, PropertyEntity> propertiesById = loadPropertiesById(ownerProperties.stream().map(OwnerPropertyEntity::getPropertyId).toList());
        return toDto(owner, company, ownerProperties, propertiesById);
    }

    @Transactional
    public OwnerDto createOwner(OwnerUpsertRequest request) {
        Long companyId = securityContextService.getCurrentCompanyId();
        String ownerCode = normalizeCode(request.ownerCode());
        if (ownerRepository.existsByCompanyIdAndOwnerCodeIgnoreCase(companyId, ownerCode)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Owner code already exists for the active company");
        }

        List<PropertyEntity> properties = validateProperties(companyId, request.propertyIds());
        CompanyEntity company = requireCompany(companyId);
        OwnerEntity saved = ownerRepository.save(apply(new OwnerEntity(), request, companyId, ownerCode));
        replaceOwnerProperties(saved.getId(), properties);
        return toDto(saved, company, ownerPropertyRepository.findAllByOwnerId(saved.getId()), toPropertyMap(properties));
    }

    @Transactional
    public OwnerDto updateOwner(Long id, OwnerUpsertRequest request) {
        Long companyId = securityContextService.getCurrentCompanyId();
        OwnerEntity owner = ownerRepository.findByIdAndCompanyId(id, companyId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Owner not found"));

        String ownerCode = normalizeCode(request.ownerCode());
        if (ownerRepository.existsByCompanyIdAndOwnerCodeIgnoreCaseAndIdNot(companyId, ownerCode, id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Owner code already exists for the active company");
        }

        List<PropertyEntity> properties = validateProperties(companyId, request.propertyIds());
        CompanyEntity company = requireCompany(companyId);
        OwnerEntity saved = ownerRepository.save(apply(owner, request, companyId, ownerCode));
        replaceOwnerProperties(saved.getId(), properties);
        return toDto(saved, company, ownerPropertyRepository.findAllByOwnerId(saved.getId()), toPropertyMap(properties));
    }

    @Transactional
    public void deleteOwner(Long id) {
        Long companyId = securityContextService.getCurrentCompanyId();
        OwnerEntity owner = ownerRepository.findByIdAndCompanyId(id, companyId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Owner not found"));
        ownerPropertyRepository.deleteAllByOwnerId(owner.getId());
        ownerRepository.delete(owner);
    }

    private OwnerEntity apply(OwnerEntity owner, OwnerUpsertRequest request, Long companyId, String ownerCode) {
        String payoutFrequency = normalizeChoice(request.payoutFrequency(), ALLOWED_PAYOUT_FREQUENCIES, "Payout frequency");
        String statementPreference = normalizeChoice(request.statementPreference(), ALLOWED_STATEMENT_PREFERENCES, "Statement preference");
        String ownerStatus = normalizeChoice(request.ownerStatus(), ALLOWED_OWNER_STATUSES, "Owner status");
        String statementStage = normalizeChoice(request.statementStage(), ALLOWED_STATEMENT_STAGES, "Statement stage");
        BigDecimal ownershipPercentage = normalizeOwnershipPercentage(request.ownershipPercentage());
        String bankAccountDetails = normalizeText(request.bankAccountDetails());

        validateStatementFlow(ownerStatus, statementStage, bankAccountDetails);

        owner.setCompanyId(companyId);
        owner.setOwnerCode(ownerCode);
        owner.setOwnerName(normalizeRequiredText(request.ownerName(), "Owner name"));
        owner.setPhone(normalizeRequiredText(request.phone(), "Phone"));
        owner.setEmail(normalizeText(request.email()));
        owner.setAddress(normalizeText(request.address()));
        owner.setTaxDetails(normalizeText(request.taxDetails()));
        owner.setBankAccountDetails(bankAccountDetails);
        owner.setOwnershipPercentage(ownershipPercentage);
        owner.setPayoutFrequency(payoutFrequency);
        owner.setStatementPreference(statementPreference);
        owner.setOwnerStatus(ownerStatus);
        owner.setStatementStage(statementStage);
        return owner;
    }

    private OwnerDto toDto(
        OwnerEntity owner,
        CompanyEntity company,
        List<OwnerPropertyEntity> ownerProperties,
        Map<Long, PropertyEntity> propertiesById
    ) {
        List<Long> propertyIds = ownerProperties.stream()
            .map(OwnerPropertyEntity::getPropertyId)
            .distinct()
            .toList();
        String summary = propertyIds.stream()
            .map(propertiesById::get)
            .filter(java.util.Objects::nonNull)
            .sorted(Comparator.comparing(PropertyEntity::getPropertyName))
            .map(property -> property.getPropertyCode() + " - " + property.getPropertyName())
            .collect(Collectors.joining(", "));

        return new OwnerDto(
            owner.getId(),
            owner.getCompanyId(),
            company.getCompanyName(),
            company.getCompanyCode(),
            owner.getOwnerCode(),
            owner.getOwnerName(),
            owner.getPhone(),
            owner.getEmail(),
            owner.getAddress(),
            owner.getTaxDetails(),
            owner.getBankAccountDetails(),
            propertyIds,
            summary,
            owner.getOwnershipPercentage(),
            owner.getPayoutFrequency(),
            owner.getStatementPreference(),
            owner.getOwnerStatus(),
            owner.getStatementStage()
        );
    }

    private void validateStatementFlow(String ownerStatus, String statementStage, String bankAccountDetails) {
        if (!"ACTIVE".equals(ownerStatus) && !List.of("RENT_COLLECTED", "MANAGEMENT_FEE_DEDUCTED").contains(statementStage)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Inactive owners cannot progress through advanced statement stages");
        }
        if ("OWNER_PAYMENT_PROCESSED".equals(statementStage) && bankAccountDetails == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Bank account details are required before processing owner payment");
        }
    }

    private List<PropertyEntity> validateProperties(Long companyId, List<Long> propertyIds) {
        List<Long> distinctPropertyIds = propertyIds == null ? List.of() : propertyIds.stream().distinct().toList();
        if (distinctPropertyIds.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "At least one property must be linked to the owner");
        }
        List<PropertyEntity> properties = propertyRepository.findAllById(distinctPropertyIds);
        if (properties.size() != distinctPropertyIds.size()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "One or more selected properties were not found");
        }
        boolean invalidProperty = properties.stream().anyMatch(property -> !companyId.equals(property.getCompanyId()));
        if (invalidProperty) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selected properties must belong to the active company");
        }
        return properties;
    }

    private void replaceOwnerProperties(Long ownerId, List<PropertyEntity> properties) {
        ownerPropertyRepository.deleteAllByOwnerId(ownerId);
        ownerPropertyRepository.saveAll(properties.stream()
            .map(property -> OwnerPropertyEntity.builder()
                .ownerId(ownerId)
                .propertyId(property.getId())
                .build())
            .toList());
    }

    private Map<Long, PropertyEntity> loadPropertiesById(List<Long> propertyIds) {
        return propertyRepository.findAllById(propertyIds).stream()
            .collect(Collectors.toMap(PropertyEntity::getId, property -> property, (left, right) -> left, LinkedHashMap::new));
    }

    private Map<Long, PropertyEntity> toPropertyMap(List<PropertyEntity> properties) {
        return properties.stream().collect(Collectors.toMap(PropertyEntity::getId, property -> property, (left, right) -> left, LinkedHashMap::new));
    }

    private CompanyEntity requireCompany(Long companyId) {
        return companyRepository.findById(companyId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Active company was not found"));
    }

    private BigDecimal normalizeOwnershipPercentage(BigDecimal value) {
        if (value == null) {
            return null;
        }
        if (value.compareTo(BigDecimal.ZERO) < 0 || value.compareTo(new BigDecimal("100.00")) > 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ownership percentage must be between 0 and 100");
        }
        return value.stripTrailingZeros();
    }

    private String normalizeCode(String value) {
        String normalized = normalizeText(value);
        if (normalized == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Owner code is required");
        }
        return normalized.toUpperCase();
    }

    private String normalizeChoice(String value, List<String> allowedValues, String label) {
        String normalized = normalizeText(value);
        if (normalized == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, label + " is required");
        }
        String candidate = normalized.toUpperCase();
        if (!allowedValues.contains(candidate)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, label + " is invalid");
        }
        return candidate;
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
}
