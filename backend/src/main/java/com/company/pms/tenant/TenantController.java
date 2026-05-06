package com.company.pms.tenant;

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
@RequestMapping("/api/tenants")
@PreAuthorize("@menuAccessGuard.hasAccess('tenants')")
public class TenantController {

    private final TenantService tenantService;

    public TenantController(TenantService tenantService) {
        this.tenantService = tenantService;
    }

    @GetMapping
    public ApiResponse<List<TenantDto>> getTenants() {
        return ApiResponse.ok(tenantService.getTenants());
    }

    @GetMapping("/options")
    public ApiResponse<TenantOptionsDto> getTenantOptions() {
        return ApiResponse.ok(tenantService.getTenantOptions());
    }

    @GetMapping("/{id}")
    public ApiResponse<TenantDto> getTenant(@PathVariable Long id) {
        return ApiResponse.ok(tenantService.getTenant(id));
    }

    @PostMapping
    public ApiResponse<TenantDto> createTenant(@Valid @RequestBody TenantUpsertRequest request) {
        return ApiResponse.ok(tenantService.createTenant(request));
    }

    @PutMapping("/{id}")
    public ApiResponse<TenantDto> updateTenant(@PathVariable Long id, @Valid @RequestBody TenantUpsertRequest request) {
        return ApiResponse.ok(tenantService.updateTenant(id, request));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<String> deleteTenant(@PathVariable Long id) {
        tenantService.deleteTenant(id);
        return ApiResponse.ok("Tenant deleted successfully.");
    }
}
