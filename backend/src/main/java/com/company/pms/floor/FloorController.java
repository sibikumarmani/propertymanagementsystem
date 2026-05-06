package com.company.pms.floor;

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
@RequestMapping("/api/floors")
@PreAuthorize("@menuAccessGuard.hasAccess('floors')")
public class FloorController {

    private final FloorService floorService;

    public FloorController(FloorService floorService) {
        this.floorService = floorService;
    }

    @GetMapping
    public ApiResponse<List<FloorDto>> getFloors() {
        return ApiResponse.ok(floorService.getFloors());
    }

    @GetMapping("/{id}")
    public ApiResponse<FloorDto> getFloor(@PathVariable Long id) {
        return ApiResponse.ok(floorService.getFloor(id));
    }

    @PostMapping
    public ApiResponse<FloorDto> createFloor(@Valid @RequestBody FloorUpsertRequest request) {
        return ApiResponse.ok(floorService.createFloor(request));
    }

    @PutMapping("/{id}")
    public ApiResponse<FloorDto> updateFloor(@PathVariable Long id, @Valid @RequestBody FloorUpsertRequest request) {
        return ApiResponse.ok(floorService.updateFloor(id, request));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<String> deleteFloor(@PathVariable Long id) {
        floorService.deleteFloor(id);
        return ApiResponse.ok("Floor deleted successfully.");
    }
}
