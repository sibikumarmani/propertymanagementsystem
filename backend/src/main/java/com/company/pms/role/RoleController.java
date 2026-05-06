package com.company.pms.role;

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
@RequestMapping("/api/roles")
@PreAuthorize("@menuAccessGuard.hasAccess('roles')")
public class RoleController {

    private final RoleService roleService;

    public RoleController(RoleService roleService) {
        this.roleService = roleService;
    }

    @GetMapping
    public ApiResponse<List<RoleDto>> getRoles() {
        return ApiResponse.ok(roleService.getRoles());
    }

    @GetMapping("/{id}")
    public ApiResponse<RoleDto> getRole(@PathVariable Long id) {
        return ApiResponse.ok(roleService.getRole(id));
    }

    @PostMapping
    public ApiResponse<RoleDto> createRole(@Valid @RequestBody RoleUpsertRequest request) {
        return ApiResponse.ok(roleService.createRole(request));
    }

    @PutMapping("/{id}")
    public ApiResponse<RoleDto> updateRole(@PathVariable Long id, @Valid @RequestBody RoleUpsertRequest request) {
        return ApiResponse.ok(roleService.updateRole(id, request));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<String> deleteRole(@PathVariable Long id) {
        roleService.deleteRole(id);
        return ApiResponse.ok("Role deleted successfully.");
    }
}
