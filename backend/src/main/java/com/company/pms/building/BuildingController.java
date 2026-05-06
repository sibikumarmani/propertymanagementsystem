package com.company.pms.building;

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
@RequestMapping("/api/buildings")
@PreAuthorize("@menuAccessGuard.hasAccess('buildings')")
public class BuildingController {

    private final BuildingService buildingService;

    public BuildingController(BuildingService buildingService) {
        this.buildingService = buildingService;
    }

    @GetMapping
    public ApiResponse<List<BuildingDto>> getBuildings() {
        return ApiResponse.ok(buildingService.getBuildings());
    }

    @GetMapping("/{id}")
    public ApiResponse<BuildingDto> getBuilding(@PathVariable Long id) {
        return ApiResponse.ok(buildingService.getBuilding(id));
    }

    @PostMapping
    public ApiResponse<BuildingDto> createBuilding(@Valid @RequestBody BuildingUpsertRequest request) {
        return ApiResponse.ok(buildingService.createBuilding(request));
    }

    @PutMapping("/{id}")
    public ApiResponse<BuildingDto> updateBuilding(@PathVariable Long id, @Valid @RequestBody BuildingUpsertRequest request) {
        return ApiResponse.ok(buildingService.updateBuilding(id, request));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<String> deleteBuilding(@PathVariable Long id) {
        buildingService.deleteBuilding(id);
        return ApiResponse.ok("Building deleted successfully.");
    }
}
