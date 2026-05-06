package com.company.pms.unit;

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
@RequestMapping("/api/units")
@PreAuthorize("@menuAccessGuard.hasAccess('units')")
public class UnitController {

    private final UnitService unitService;

    public UnitController(UnitService unitService) {
        this.unitService = unitService;
    }

    @GetMapping
    public ApiResponse<List<UnitDto>> getUnits() {
        return ApiResponse.ok(unitService.getUnits());
    }

    @GetMapping("/options")
    public ApiResponse<UnitOptionsDto> getUnitOptions() {
        return ApiResponse.ok(unitService.getUnitOptions());
    }

    @GetMapping("/{id}")
    public ApiResponse<UnitDto> getUnit(@PathVariable Long id) {
        return ApiResponse.ok(unitService.getUnit(id));
    }

    @PostMapping
    public ApiResponse<UnitDto> createUnit(@Valid @RequestBody UnitUpsertRequest request) {
        return ApiResponse.ok(unitService.createUnit(request));
    }

    @PutMapping("/{id}")
    public ApiResponse<UnitDto> updateUnit(@PathVariable Long id, @Valid @RequestBody UnitUpsertRequest request) {
        return ApiResponse.ok(unitService.updateUnit(id, request));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<String> deleteUnit(@PathVariable Long id) {
        unitService.deleteUnit(id);
        return ApiResponse.ok("Unit deleted successfully.");
    }
}
