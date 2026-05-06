package com.company.pms.property;

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
@RequestMapping("/api/properties")
@PreAuthorize("@menuAccessGuard.hasAccess('properties')")
public class PropertyController {

    private final PropertyService propertyService;

    public PropertyController(PropertyService propertyService) {
        this.propertyService = propertyService;
    }

    @GetMapping
    public ApiResponse<List<PropertyDto>> getProperties() {
        return ApiResponse.ok(propertyService.getProperties());
    }

    @GetMapping("/{id}")
    public ApiResponse<PropertyDto> getProperty(@PathVariable Long id) {
        return ApiResponse.ok(propertyService.getProperty(id));
    }

    @PostMapping
    public ApiResponse<PropertyDto> createProperty(@Valid @RequestBody PropertyUpsertRequest request) {
        return ApiResponse.ok(propertyService.createProperty(request));
    }

    @PutMapping("/{id}")
    public ApiResponse<PropertyDto> updateProperty(@PathVariable Long id, @Valid @RequestBody PropertyUpsertRequest request) {
        return ApiResponse.ok(propertyService.updateProperty(id, request));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<String> deleteProperty(@PathVariable Long id) {
        propertyService.deleteProperty(id);
        return ApiResponse.ok("Property deleted successfully.");
    }
}
