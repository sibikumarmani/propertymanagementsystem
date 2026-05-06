package com.company.pms.company;

import com.company.pms.common.api.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/companies")
@PreAuthorize("@menuAccessGuard.hasAccess('companies')")
public class CompanyController {

    private final CompanyService companyService;

    public CompanyController(CompanyService companyService) {
        this.companyService = companyService;
    }

    @GetMapping
    public ApiResponse<List<CompanyDto>> getCompanies() {
        return ApiResponse.ok(companyService.getCompanies());
    }

    @GetMapping("/{id}")
    public ApiResponse<CompanyDto> getCompany(@PathVariable Long id) {
        return ApiResponse.ok(companyService.getCompany(id));
    }

    @PostMapping
    public ApiResponse<CompanyDto> createCompany(@Valid @RequestBody CompanyUpsertRequest request) {
        return ApiResponse.ok(companyService.createCompany(request));
    }

    @PutMapping("/{id}")
    public ApiResponse<CompanyDto> updateCompany(@PathVariable Long id, @Valid @RequestBody CompanyUpsertRequest request) {
        return ApiResponse.ok(companyService.updateCompany(id, request));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<String> deleteCompany(@PathVariable Long id) {
        companyService.deleteCompany(id);
        return ApiResponse.ok("Company deleted successfully.");
    }
}
