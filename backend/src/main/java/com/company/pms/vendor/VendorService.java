package com.company.pms.vendor;

import com.company.pms.company.CompanyEntity;
import com.company.pms.company.CompanyRepository;
import com.company.pms.security.SecurityContextService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;

@Service
public class VendorService {

    private static final List<String> ALLOWED_CONTRACT_STATUSES = List.of(
        "DRAFT",
        "APPROVED",
        "ACTIVE",
        "EXPIRED",
        "SUSPENDED",
        "TERMINATED"
    );

    private static final List<String> ALLOWED_VENDOR_STATUSES = List.of(
        "ACTIVE",
        "INACTIVE"
    );

    private static final List<String> ALLOWED_ASSIGNMENT_STAGES = List.of(
        "WORK_ORDER_REQUIRES_VENDOR",
        "APPROVED_VENDOR_SELECTED",
        "WORK_ORDER_SENT",
        "VENDOR_ACCEPTED",
        "WORK_COMPLETED",
        "INVOICE_SUBMITTED",
        "MANAGER_VERIFIED",
        "PAYMENT_PROCESSED"
    );

    private final VendorRepository vendorRepository;
    private final CompanyRepository companyRepository;
    private final SecurityContextService securityContextService;

    public VendorService(
        VendorRepository vendorRepository,
        CompanyRepository companyRepository,
        SecurityContextService securityContextService
    ) {
        this.vendorRepository = vendorRepository;
        this.companyRepository = companyRepository;
        this.securityContextService = securityContextService;
    }

    @Transactional(readOnly = true)
    public List<VendorDto> getVendors() {
        Long companyId = securityContextService.getCurrentCompanyId();
        CompanyEntity company = requireCompany(companyId);
        return vendorRepository.findAllByCompanyIdOrderByVendorNameAscIdAsc(companyId).stream()
            .map(vendor -> toDto(vendor, company))
            .toList();
    }

    @Transactional(readOnly = true)
    public VendorDto getVendor(Long id) {
        Long companyId = securityContextService.getCurrentCompanyId();
        CompanyEntity company = requireCompany(companyId);
        VendorEntity vendor = vendorRepository.findByIdAndCompanyId(id, companyId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Vendor not found"));
        return toDto(vendor, company);
    }

    @Transactional
    public VendorDto createVendor(VendorUpsertRequest request) {
        Long companyId = securityContextService.getCurrentCompanyId();
        String vendorCode = normalizeCode(request.vendorCode());
        if (vendorRepository.existsByCompanyIdAndVendorCodeIgnoreCase(companyId, vendorCode)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Vendor code already exists for the active company");
        }

        CompanyEntity company = requireCompany(companyId);
        VendorEntity saved = vendorRepository.save(apply(new VendorEntity(), request, companyId, vendorCode));
        return toDto(saved, company);
    }

    @Transactional
    public VendorDto updateVendor(Long id, VendorUpsertRequest request) {
        Long companyId = securityContextService.getCurrentCompanyId();
        VendorEntity vendor = vendorRepository.findByIdAndCompanyId(id, companyId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Vendor not found"));

        String vendorCode = normalizeCode(request.vendorCode());
        if (vendorRepository.existsByCompanyIdAndVendorCodeIgnoreCaseAndIdNot(companyId, vendorCode, id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Vendor code already exists for the active company");
        }

        CompanyEntity company = requireCompany(companyId);
        VendorEntity saved = vendorRepository.save(apply(vendor, request, companyId, vendorCode));
        return toDto(saved, company);
    }

    @Transactional
    public void deleteVendor(Long id) {
        Long companyId = securityContextService.getCurrentCompanyId();
        VendorEntity vendor = vendorRepository.findByIdAndCompanyId(id, companyId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Vendor not found"));
        vendorRepository.delete(vendor);
    }

    private VendorEntity apply(VendorEntity vendor, VendorUpsertRequest request, Long companyId, String vendorCode) {
        String contractStatus = normalizeChoice(request.contractStatus(), ALLOWED_CONTRACT_STATUSES, "Contract status");
        String vendorStatus = normalizeChoice(request.vendorStatus(), ALLOWED_VENDOR_STATUSES, "Vendor status");
        String assignmentStage = normalizeChoice(request.assignmentStage(), ALLOWED_ASSIGNMENT_STAGES, "Assignment stage");
        BigDecimal rating = normalizeRating(request.rating());
        String bankDetails = normalizeText(request.bankDetails());

        validateFlow(contractStatus, vendorStatus, assignmentStage, bankDetails);

        vendor.setCompanyId(companyId);
        vendor.setVendorCode(vendorCode);
        vendor.setVendorName(normalizeRequiredText(request.vendorName(), "Vendor name"));
        vendor.setContactPerson(normalizeText(request.contactPerson()));
        vendor.setPhone(normalizeRequiredText(request.phone(), "Phone"));
        vendor.setEmail(normalizeText(request.email()));
        vendor.setAddress(normalizeText(request.address()));
        vendor.setServiceCategory(normalizeText(request.serviceCategory()));
        vendor.setTaxNumber(normalizeText(request.taxNumber()));
        vendor.setBankDetails(bankDetails);
        vendor.setContractStatus(contractStatus);
        vendor.setInsuranceDetails(normalizeText(request.insuranceDetails()));
        vendor.setRating(rating);
        vendor.setVendorStatus(vendorStatus);
        vendor.setAssignmentStage(assignmentStage);
        return vendor;
    }

    private VendorDto toDto(VendorEntity vendor, CompanyEntity company) {
        return new VendorDto(
            vendor.getId(),
            vendor.getCompanyId(),
            company.getCompanyName(),
            company.getCompanyCode(),
            vendor.getVendorCode(),
            vendor.getVendorName(),
            vendor.getContactPerson(),
            vendor.getPhone(),
            vendor.getEmail(),
            vendor.getAddress(),
            vendor.getServiceCategory(),
            vendor.getTaxNumber(),
            vendor.getBankDetails(),
            vendor.getContractStatus(),
            vendor.getInsuranceDetails(),
            vendor.getRating(),
            vendor.getVendorStatus(),
            vendor.getAssignmentStage()
        );
    }

    private void validateFlow(String contractStatus, String vendorStatus, String assignmentStage, String bankDetails) {
        if (List.of(
            "APPROVED_VENDOR_SELECTED",
            "WORK_ORDER_SENT",
            "VENDOR_ACCEPTED",
            "WORK_COMPLETED",
            "INVOICE_SUBMITTED",
            "MANAGER_VERIFIED",
            "PAYMENT_PROCESSED"
        ).contains(assignmentStage) && !List.of("APPROVED", "ACTIVE").contains(contractStatus)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only approved vendors can move beyond vendor requirement stage");
        }
        if (!"ACTIVE".equals(vendorStatus) && !List.of("WORK_ORDER_REQUIRES_VENDOR", "APPROVED_VENDOR_SELECTED").contains(assignmentStage)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Inactive vendors cannot progress through active work-order stages");
        }
        if ("PAYMENT_PROCESSED".equals(assignmentStage) && bankDetails == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Bank details are required before finance can process payment");
        }
    }

    private CompanyEntity requireCompany(Long companyId) {
        return companyRepository.findById(companyId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Active company was not found"));
    }

    private BigDecimal normalizeRating(BigDecimal value) {
        if (value == null) {
            return null;
        }
        if (value.compareTo(BigDecimal.ONE) < 0 || value.compareTo(new BigDecimal("5.0")) > 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Rating must be between 1 and 5");
        }
        return value.stripTrailingZeros();
    }

    private String normalizeCode(String value) {
        String normalized = normalizeText(value);
        if (normalized == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vendor code is required");
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
