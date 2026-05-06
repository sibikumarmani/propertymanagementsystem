package com.company.pms.tenant;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.company.pms.company.CompanyEntity;
import com.company.pms.company.CompanyRepository;
import com.company.pms.audit.AuditLogService;
import com.company.pms.security.SecurityContextService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
public class TenantService {

    private static final List<String> INDIVIDUAL_TENANT_TYPES = List.of(
        "INDIVIDUAL",
        "FAMILY",
        "CO_LIVING",
        "STUDENT"
    );

    private static final List<String> ORGANIZATION_TENANT_TYPES = List.of(
        "COMPANY",
        "RETAIL",
        "OFFICE",
        "WAREHOUSE"
    );

    private static final List<String> ALLOWED_TENANT_TYPES = List.of(
        "INDIVIDUAL",
        "FAMILY",
        "COMPANY",
        "RETAIL",
        "OFFICE",
        "WAREHOUSE",
        "CO_LIVING",
        "STUDENT"
    );

    private static final List<String> ALLOWED_KYC_STATUSES = List.of(
        "NOT_STARTED",
        "DOCUMENTS_PENDING",
        "UNDER_REVIEW",
        "VERIFIED",
        "REJECTED"
    );

    private static final List<String> ALLOWED_BLACKLIST_STATUSES = List.of(
        "CLEAR",
        "UNDER_REVIEW",
        "BLACKLISTED"
    );

    private static final List<String> ALLOWED_TENANT_STATUSES = List.of(
        "DRAFT",
        "PENDING_KYC",
        "APPROVED",
        "ACTIVE",
        "INACTIVE",
        "BLACKLISTED"
    );

    private static final List<String> ALLOWED_KYC_STAGES = List.of(
        "CREATED",
        "ID_PROOF_UPLOADED",
        "ADDRESS_PROOF_UPLOADED",
        "FINANCIAL_DOCUMENTS_UPLOADED",
        "KYC_VERIFIED",
        "APPROVED"
    );
    private static final List<String> ALLOWED_ID_PROOF_TYPES = List.of(
        "AADHAAR",
        "PASSPORT",
        "DRIVING_LICENSE",
        "VOTER_ID",
        "PAN",
        "TRADE_LICENSE",
        "GST_CERTIFICATE",
        "COMPANY_INCORPORATION_CERTIFICATE",
        "OTHER"
    );
    private static final int MAX_ATTACHMENT_COUNT = 10;
    private static final TypeReference<List<TenantAttachmentDto>> TENANT_ATTACHMENT_LIST_TYPE = new TypeReference<>() {
    };

    private final TenantRepository tenantRepository;
    private final CompanyRepository companyRepository;
    private final SecurityContextService securityContextService;
    private final AuditLogService auditLogService;
    private final ObjectMapper objectMapper;

    public TenantService(
        TenantRepository tenantRepository,
        CompanyRepository companyRepository,
        SecurityContextService securityContextService,
        AuditLogService auditLogService,
        ObjectMapper objectMapper
    ) {
        this.tenantRepository = tenantRepository;
        this.companyRepository = companyRepository;
        this.securityContextService = securityContextService;
        this.auditLogService = auditLogService;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public List<TenantDto> getTenants() {
        Long companyId = securityContextService.getCurrentCompanyId();
        CompanyEntity company = requireCompany(companyId);
        return tenantRepository.findAllByCompanyIdOrderByTenantCodeAscIdAsc(companyId).stream()
            .map(tenant -> toDto(tenant, company))
            .toList();
    }

    @Transactional(readOnly = true)
    public TenantOptionsDto getTenantOptions() {
        return new TenantOptionsDto(
            ALLOWED_TENANT_TYPES,
            ALLOWED_ID_PROOF_TYPES,
            ALLOWED_KYC_STATUSES,
            ALLOWED_BLACKLIST_STATUSES,
            ALLOWED_TENANT_STATUSES,
            ALLOWED_KYC_STAGES
        );
    }

    @Transactional(readOnly = true)
    public TenantDto getTenant(Long id) {
        Long companyId = securityContextService.getCurrentCompanyId();
        CompanyEntity company = requireCompany(companyId);
        TenantEntity tenant = tenantRepository.findByIdAndCompanyId(id, companyId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tenant not found"));
        return toDto(tenant, company);
    }

    @Transactional
    public TenantDto createTenant(TenantUpsertRequest request) {
        Long companyId = securityContextService.getCurrentCompanyId();
        String tenantCode = normalizeCode(request.tenantCode());
        if (tenantRepository.existsByCompanyIdAndTenantCodeIgnoreCase(companyId, tenantCode)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Tenant code already exists for the active company");
        }

        CompanyEntity company = requireCompany(companyId);
        TenantEntity saved = tenantRepository.save(apply(new TenantEntity(), request, companyId, tenantCode));
        return toDto(saved, company);
    }

    @Transactional
    public TenantDto updateTenant(Long id, TenantUpsertRequest request) {
        Long companyId = securityContextService.getCurrentCompanyId();
        TenantEntity tenant = tenantRepository.findByIdAndCompanyId(id, companyId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tenant not found"));

        String tenantCode = normalizeCode(request.tenantCode());
        if (tenantRepository.existsByCompanyIdAndTenantCodeIgnoreCaseAndIdNot(companyId, tenantCode, id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Tenant code already exists for the active company");
        }

        CompanyEntity company = requireCompany(companyId);
        TenantDto oldDto = toDto(tenant, company);
        TenantEntity saved = tenantRepository.save(apply(tenant, request, companyId, tenantCode));
        TenantDto newDto = toDto(saved, company);
        auditLogService.log("Tenant updated", "Tenants", "TENANT", saved.getId(), oldDto, newDto);
        return newDto;
    }

    @Transactional
    public void deleteTenant(Long id) {
        Long companyId = securityContextService.getCurrentCompanyId();
        TenantEntity tenant = tenantRepository.findByIdAndCompanyId(id, companyId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tenant not found"));
        tenantRepository.delete(tenant);
    }

    private TenantEntity apply(TenantEntity tenant, TenantUpsertRequest request, Long companyId, String tenantCode) {
        String tenantType = normalizeChoice(request.tenantType(), ALLOWED_TENANT_TYPES, "Tenant type");
        String kycStatus = normalizeChoice(request.kycStatus(), ALLOWED_KYC_STATUSES, "KYC status");
        String blacklistStatus = normalizeChoice(request.blacklistStatus(), ALLOWED_BLACKLIST_STATUSES, "Blacklist status");
        String tenantStatus = normalizeChoice(request.tenantStatus(), ALLOWED_TENANT_STATUSES, "Tenant status");
        String kycStage = normalizeChoice(request.kycStage(), ALLOWED_KYC_STAGES, "KYC stage");

        String firstName = normalizeText(request.firstName());
        String lastName = normalizeText(request.lastName());
        String companyName = normalizeText(request.companyName());
        List<TenantAttachmentDto> idProofAttachments = normalizeAttachments(request.idProofAttachments());
        List<TenantAttachmentDto> addressProofAttachments = normalizeAttachments(request.addressProofAttachments());
        List<TenantAttachmentDto> financialAttachments = normalizeAttachments(request.financialAttachments());

        validateTenantIdentity(tenantType, firstName, companyName);
        validateKycFlow(kycStage, kycStatus, tenantStatus, blacklistStatus, idProofAttachments, addressProofAttachments, financialAttachments);

        tenant.setCompanyId(companyId);
        tenant.setTenantCode(tenantCode);
        tenant.setTenantType(tenantType);
        tenant.setFirstName(firstName);
        tenant.setLastName(lastName);
        tenant.setCompanyName(companyName);
        tenant.setPhoneNumber(normalizeRequiredText(request.phoneNumber(), "Phone number"));
        tenant.setEmail(normalizeText(request.email()));
        tenant.setAlternatePhone(normalizeText(request.alternatePhone()));
        tenant.setDateOfBirthOrRegistration(request.dateOfBirthOrRegistration());
        tenant.setIdProofType(normalizeIdProofType(request.idProofType()));
        tenant.setIdProofNumber(normalizeText(request.idProofNumber()));
        tenant.setTaxNumber(normalizeText(request.taxNumber()));
        tenant.setGstNumber(normalizeText(request.gstNumber()));
        tenant.setEmergencyContact(normalizeText(request.emergencyContact()));
        tenant.setEmployerDetails(normalizeText(request.employerDetails()));
        tenant.setCurrentAddress(normalizeText(request.currentAddress()));
        tenant.setPermanentAddress(normalizeText(request.permanentAddress()));
        tenant.setKycStatus(kycStatus);
        tenant.setBlacklistStatus(blacklistStatus);
        tenant.setTenantStatus(tenantStatus);
        tenant.setKycStage(kycStage);
        tenant.setIdProofAttachmentsJson(serializeAttachments(idProofAttachments));
        tenant.setAddressProofAttachmentsJson(serializeAttachments(addressProofAttachments));
        tenant.setFinancialAttachmentsJson(serializeAttachments(financialAttachments));
        return tenant;
    }

    private TenantDto toDto(TenantEntity tenant, CompanyEntity company) {
        return new TenantDto(
            tenant.getId(),
            tenant.getCompanyId(),
            company.getCompanyName(),
            company.getCompanyCode(),
            tenant.getTenantCode(),
            tenant.getTenantType(),
            tenant.getFirstName(),
            tenant.getLastName(),
            tenant.getCompanyName(),
            resolveDisplayName(tenant),
            tenant.getPhoneNumber(),
            tenant.getEmail(),
            tenant.getAlternatePhone(),
            tenant.getDateOfBirthOrRegistration(),
            tenant.getIdProofType(),
            tenant.getIdProofNumber(),
            tenant.getTaxNumber(),
            tenant.getGstNumber(),
            tenant.getEmergencyContact(),
            tenant.getEmployerDetails(),
            tenant.getCurrentAddress(),
            tenant.getPermanentAddress(),
            tenant.getKycStatus(),
            tenant.getBlacklistStatus(),
            tenant.getTenantStatus(),
            tenant.getKycStage(),
            deserializeAttachments(tenant.getIdProofAttachmentsJson()),
            deserializeAttachments(tenant.getAddressProofAttachmentsJson()),
            deserializeAttachments(tenant.getFinancialAttachmentsJson())
        );
    }

    private void validateTenantIdentity(String tenantType, String firstName, String companyName) {
        if (INDIVIDUAL_TENANT_TYPES.contains(tenantType) && firstName == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "First name is required for the selected tenant type");
        }
        if (ORGANIZATION_TENANT_TYPES.contains(tenantType) && companyName == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Company name is required for the selected tenant type");
        }
    }

    private void validateKycFlow(
        String kycStage,
        String kycStatus,
        String tenantStatus,
        String blacklistStatus,
        List<TenantAttachmentDto> idProofAttachments,
        List<TenantAttachmentDto> addressProofAttachments,
        List<TenantAttachmentDto> financialAttachments
    ) {
        if (List.of("ID_PROOF_UPLOADED", "ADDRESS_PROOF_UPLOADED", "FINANCIAL_DOCUMENTS_UPLOADED", "KYC_VERIFIED", "APPROVED").contains(kycStage)
            && idProofAttachments.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ID proof upload reference is required for the selected KYC stage");
        }
        if (List.of("ADDRESS_PROOF_UPLOADED", "FINANCIAL_DOCUMENTS_UPLOADED", "KYC_VERIFIED", "APPROVED").contains(kycStage)
            && addressProofAttachments.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Address proof upload reference is required for the selected KYC stage");
        }
        if (List.of("FINANCIAL_DOCUMENTS_UPLOADED", "KYC_VERIFIED", "APPROVED").contains(kycStage)
            && financialAttachments.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Financial or employment document reference is required for the selected KYC stage");
        }
        if (List.of("KYC_VERIFIED", "APPROVED").contains(kycStage) && !"VERIFIED".equals(kycStatus)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "KYC status must be VERIFIED before verification or approval can be completed");
        }
        if (List.of("APPROVED", "ACTIVE").contains(tenantStatus) && !"VERIFIED".equals(kycStatus)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tenant cannot be approved or active before KYC is verified");
        }
        if ("BLACKLISTED".equals(blacklistStatus) && !"BLACKLISTED".equals(tenantStatus) && !"INACTIVE".equals(tenantStatus)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Blacklisted tenants must be marked as BLACKLISTED or INACTIVE");
        }
    }

    private String resolveDisplayName(TenantEntity tenant) {
        String companyName = normalizeText(tenant.getCompanyName());
        if (companyName != null) {
            return companyName;
        }
        String firstName = normalizeText(tenant.getFirstName());
        String lastName = normalizeText(tenant.getLastName());
        if (firstName == null && lastName == null) {
            return tenant.getTenantCode();
        }
        return firstName == null ? lastName : lastName == null ? firstName : firstName + " " + lastName;
    }

    private CompanyEntity requireCompany(Long companyId) {
        return companyRepository.findById(companyId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Active company was not found"));
    }

    private String normalizeCode(String value) {
        String normalized = normalizeText(value);
        if (normalized == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tenant code is required");
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

    private String normalizeIdProofType(String value) {
        String normalized = normalizeText(value);
        if (normalized == null) {
            return null;
        }
        String candidate = normalized.toUpperCase(Locale.ENGLISH);
        if (!ALLOWED_ID_PROOF_TYPES.contains(candidate)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ID proof type is invalid");
        }
        return candidate;
    }

    private List<TenantAttachmentDto> normalizeAttachments(List<TenantAttachmentRequest> attachments) {
        if (attachments == null || attachments.isEmpty()) {
            return List.of();
        }
        if (attachments.size() > MAX_ATTACHMENT_COUNT) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A maximum of " + MAX_ATTACHMENT_COUNT + " attachments is allowed");
        }

        List<TenantAttachmentDto> normalized = new ArrayList<>();
        for (TenantAttachmentRequest attachment : attachments) {
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
            normalized.add(new TenantAttachmentDto(fileName, contentType, dataUrl, attachment.fileSize()));
        }
        return List.copyOf(normalized);
    }

    private String serializeAttachments(List<TenantAttachmentDto> attachments) {
        try {
            return objectMapper.writeValueAsString(attachments == null ? List.of() : attachments);
        } catch (JsonProcessingException exception) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Unable to store tenant attachments", exception);
        }
    }

    private List<TenantAttachmentDto> deserializeAttachments(String value) {
        String normalized = normalizeText(value);
        if (normalized == null) {
            return List.of();
        }
        try {
            return objectMapper.readValue(normalized, TENANT_ATTACHMENT_LIST_TYPE);
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

    private String normalizeText(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
