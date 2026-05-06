package com.company.pms.branch;

import com.company.pms.company.CompanyEntity;
import com.company.pms.company.CompanyRepository;
import com.company.pms.security.SecurityContextService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class BranchService {

    private final BranchRepository branchRepository;
    private final CompanyRepository companyRepository;
    private final SecurityContextService securityContextService;

    public BranchService(
        BranchRepository branchRepository,
        CompanyRepository companyRepository,
        SecurityContextService securityContextService
    ) {
        this.branchRepository = branchRepository;
        this.companyRepository = companyRepository;
        this.securityContextService = securityContextService;
    }

    @Transactional(readOnly = true)
    public List<BranchDto> getBranches() {
        Long companyId = securityContextService.getCurrentCompanyId();
        CompanyEntity company = requireCompany(companyId);
        return branchRepository.findAllByCompanyIdOrderByBranchNameAscIdAsc(companyId).stream()
            .map(branch -> toDto(branch, company))
            .toList();
    }

    @Transactional(readOnly = true)
    public BranchDto getBranch(Long id) {
        Long companyId = securityContextService.getCurrentCompanyId();
        CompanyEntity company = requireCompany(companyId);
        BranchEntity branch = branchRepository.findByIdAndCompanyId(id, companyId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Branch not found"));
        return toDto(branch, company);
    }

    @Transactional
    public BranchDto createBranch(BranchUpsertRequest request) {
        Long companyId = securityContextService.getCurrentCompanyId();
        CompanyEntity company = requireActiveCompany(companyId);
        String branchCode = normalizeCode(request.branchCode());
        validateBranchCodeUniqueness(companyId, branchCode, null);
        BranchEntity saved = branchRepository.save(apply(new BranchEntity(), request, companyId, branchCode));
        return toDto(saved, company);
    }

    @Transactional
    public BranchDto updateBranch(Long id, BranchUpsertRequest request) {
        Long companyId = securityContextService.getCurrentCompanyId();
        BranchEntity branch = branchRepository.findByIdAndCompanyId(id, companyId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Branch not found"));
        CompanyEntity company = requireActiveCompany(companyId);
        String branchCode = normalizeCode(request.branchCode());
        validateBranchCodeUniqueness(companyId, branchCode, id);
        BranchEntity saved = branchRepository.save(apply(branch, request, companyId, branchCode));
        return toDto(saved, company);
    }

    @Transactional
    public void deleteBranch(Long id) {
        Long companyId = securityContextService.getCurrentCompanyId();
        BranchEntity branch = branchRepository.findByIdAndCompanyId(id, companyId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Branch not found"));
        branchRepository.delete(branch);
    }

    private void validateBranchCodeUniqueness(Long companyId, String branchCode, Long existingId) {
        if (branchCode == null) {
            return;
        }
        boolean exists = existingId == null
            ? branchRepository.existsByCompanyIdAndBranchCodeIgnoreCase(companyId, branchCode)
            : branchRepository.existsByCompanyIdAndBranchCodeIgnoreCaseAndIdNot(companyId, branchCode, existingId);
        if (exists) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Branch code already exists for this company");
        }
    }

    private BranchEntity apply(BranchEntity branch, BranchUpsertRequest request, Long companyId, String branchCode) {
        branch.setCompanyId(companyId);
        branch.setBranchName(request.branchName().trim());
        branch.setBranchCode(branchCode);
        branch.setAddress(normalizeText(request.address()));
        branch.setCity(normalizeText(request.city()));
        branch.setState(normalizeText(request.state()));
        branch.setCountry(normalizeText(request.country()));
        branch.setPostalCode(normalizeText(request.postalCode()));
        branch.setStatus(normalizeStatus(request.status()));
        return branch;
    }

    private BranchDto toDto(BranchEntity branch, CompanyEntity company) {
        return new BranchDto(
            branch.getId(),
            branch.getCompanyId(),
            company == null ? null : company.getCompanyName(),
            company == null ? null : company.getCompanyCode(),
            branch.getBranchName(),
            branch.getBranchCode(),
            branch.getAddress(),
            branch.getCity(),
            branch.getState(),
            branch.getCountry(),
            branch.getPostalCode(),
            branch.getStatus()
        );
    }

    private CompanyEntity requireCompany(Long companyId) {
        return companyRepository.findById(companyId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Company not found"));
    }

    private CompanyEntity requireActiveCompany(Long companyId) {
        CompanyEntity company = requireCompany(companyId);
        if (!company.isActive()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Inactive company cannot be assigned to a branch");
        }
        return company;
    }

    private String normalizeCode(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim().toUpperCase();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String normalizeStatus(String status) {
        String normalized = status == null ? "" : status.trim().toUpperCase();
        if (!normalized.equals("ACTIVE") && !normalized.equals("INACTIVE")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Status must be ACTIVE or INACTIVE");
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
