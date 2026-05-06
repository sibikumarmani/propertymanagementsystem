package com.company.pms.owner;

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
@RequestMapping("/api/owners")
@PreAuthorize("@menuAccessGuard.hasAccess('owners')")
public class OwnerController {

    private final OwnerService ownerService;

    public OwnerController(OwnerService ownerService) {
        this.ownerService = ownerService;
    }

    @GetMapping
    public ApiResponse<List<OwnerDto>> getOwners() {
        return ApiResponse.ok(ownerService.getOwners());
    }

    @GetMapping("/{id}")
    public ApiResponse<OwnerDto> getOwner(@PathVariable Long id) {
        return ApiResponse.ok(ownerService.getOwner(id));
    }

    @PostMapping
    public ApiResponse<OwnerDto> createOwner(@Valid @RequestBody OwnerUpsertRequest request) {
        return ApiResponse.ok(ownerService.createOwner(request));
    }

    @PutMapping("/{id}")
    public ApiResponse<OwnerDto> updateOwner(@PathVariable Long id, @Valid @RequestBody OwnerUpsertRequest request) {
        return ApiResponse.ok(ownerService.updateOwner(id, request));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<String> deleteOwner(@PathVariable Long id) {
        ownerService.deleteOwner(id);
        return ApiResponse.ok("Owner deleted successfully.");
    }
}
