package com.company.pms.vendor;

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
@RequestMapping("/api/vendors")
@PreAuthorize("@menuAccessGuard.hasAccess('vendors')")
public class VendorController {

    private final VendorService vendorService;

    public VendorController(VendorService vendorService) {
        this.vendorService = vendorService;
    }

    @GetMapping
    public ApiResponse<List<VendorDto>> getVendors() {
        return ApiResponse.ok(vendorService.getVendors());
    }

    @GetMapping("/{id}")
    public ApiResponse<VendorDto> getVendor(@PathVariable Long id) {
        return ApiResponse.ok(vendorService.getVendor(id));
    }

    @PostMapping
    public ApiResponse<VendorDto> createVendor(@Valid @RequestBody VendorUpsertRequest request) {
        return ApiResponse.ok(vendorService.createVendor(request));
    }

    @PutMapping("/{id}")
    public ApiResponse<VendorDto> updateVendor(@PathVariable Long id, @Valid @RequestBody VendorUpsertRequest request) {
        return ApiResponse.ok(vendorService.updateVendor(id, request));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<String> deleteVendor(@PathVariable Long id) {
        vendorService.deleteVendor(id);
        return ApiResponse.ok("Vendor deleted successfully.");
    }
}
