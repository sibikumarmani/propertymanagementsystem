package com.company.pms.company;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class CompanyService {

    private final CompanyRepository companyRepository;

    public CompanyService(CompanyRepository companyRepository) {
        this.companyRepository = companyRepository;
    }

    @Transactional(readOnly = true)
    public List<CompanyDto> getCompanies() {
        return companyRepository.findAllByOrderByCompanyNameAsc().stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public CompanyDto getCompany(Long id) {
        return companyRepository.findById(id).map(this::toDto)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Company not found"));
    }

    @Transactional
    public CompanyDto createCompany(CompanyUpsertRequest request) {
        String companyCode = normalizeCode(request.companyCode());
        if (companyCode != null && companyRepository.existsByCompanyCodeIgnoreCase(companyCode)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Company code already exists");
        }
        CompanyEntity saved = companyRepository.save(apply(new CompanyEntity(), request, companyCode));
        return toDto(saved);
    }

    @Transactional
    public CompanyDto updateCompany(Long id, CompanyUpsertRequest request) {
        CompanyEntity company = companyRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Company not found"));
        String companyCode = normalizeCode(request.companyCode());
        if (companyCode != null && companyRepository.existsByCompanyCodeIgnoreCaseAndIdNot(companyCode, id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Company code already exists");
        }
        return toDto(companyRepository.save(apply(company, request, companyCode)));
    }

    @Transactional
    public void deleteCompany(Long id) {
        if (!companyRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Company not found");
        }
        companyRepository.deleteById(id);
    }

    private CompanyEntity apply(CompanyEntity company, CompanyUpsertRequest request, String companyCode) {
        boolean isDefaultCompany = request.defaultCompany();
        String normalizedStatus = normalizeStatus(request.status());
        validateDefaultCompanySelection(isDefaultCompany, normalizedStatus);

        company.setCompanyName(request.companyName().trim());
        company.setCompanyCode(companyCode);
        company.setEmail(normalizeText(request.email()));
        company.setPhone(normalizeText(request.phone()));
        company.setAddress(normalizeText(request.address()));
        company.setCity(normalizeText(request.city()));
        company.setState(normalizeText(request.state()));
        company.setCountry(normalizeText(request.country()));
        company.setPostalCode(normalizeText(request.postalCode()));
        company.setGstNumber(normalizeText(request.gstNumber()));
        company.setTaxNumber(normalizeText(request.taxNumber()));
        company.setDefaultCompany(isDefaultCompany);
        company.setStatus(normalizedStatus);

        if (isDefaultCompany) {
            companyRepository.clearDefaultCompanyForOthers(company.getId() == null ? -1L : company.getId());
        }
        return company;
    }

    private CompanyDto toDto(CompanyEntity company) {
        return new CompanyDto(
            company.getId(),
            company.getCompanyName(),
            company.getCompanyCode(),
            company.getEmail(),
            company.getPhone(),
            company.getAddress(),
            company.getCity(),
            company.getState(),
            company.getCountry(),
            company.getPostalCode(),
            company.getGstNumber(),
            company.getTaxNumber(),
            company.getDefaultCompany(),
            company.getStatus()
        );
    }

    private void validateDefaultCompanySelection(boolean isDefaultCompany, String normalizedStatus) {
        if (isDefaultCompany && !"ACTIVE".equals(normalizedStatus)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Default company must be ACTIVE");
        }
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
