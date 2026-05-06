package com.company.pms.asset;

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
@RequestMapping("/api/assets")
@PreAuthorize("@menuAccessGuard.hasAccess('assets')")
public class AssetController {
    private final AssetService assetService;

    public AssetController(AssetService assetService) {
        this.assetService = assetService;
    }

    @GetMapping("/options")
    public ApiResponse<AssetOptionsDto> getOptions() {
        return ApiResponse.ok(assetService.getOptions());
    }

    @GetMapping
    public ApiResponse<List<AssetDto>> getAssets() {
        return ApiResponse.ok(assetService.getAssets());
    }

    @PostMapping
    public ApiResponse<AssetDto> createAsset(@Valid @RequestBody AssetUpsertRequest request) {
        return ApiResponse.ok(assetService.createAsset(request));
    }

    @PutMapping("/{id}")
    public ApiResponse<AssetDto> updateAsset(@PathVariable Long id, @Valid @RequestBody AssetUpsertRequest request) {
        return ApiResponse.ok(assetService.updateAsset(id, request));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<String> deleteAsset(@PathVariable Long id) {
        assetService.deleteAsset(id);
        return ApiResponse.ok("Asset deleted successfully.");
    }

    @GetMapping("/maintenance-schedules")
    public ApiResponse<List<AssetMaintenanceScheduleDto>> getSchedules() {
        return ApiResponse.ok(assetService.getSchedules());
    }

    @PostMapping("/maintenance-schedules")
    public ApiResponse<AssetMaintenanceScheduleDto> createSchedule(@Valid @RequestBody AssetMaintenanceScheduleUpsertRequest request) {
        return ApiResponse.ok(assetService.createSchedule(request));
    }

    @PutMapping("/maintenance-schedules/{id}")
    public ApiResponse<AssetMaintenanceScheduleDto> updateSchedule(@PathVariable Long id, @Valid @RequestBody AssetMaintenanceScheduleUpsertRequest request) {
        return ApiResponse.ok(assetService.updateSchedule(id, request));
    }

    @PostMapping("/maintenance-schedules/{id}/complete")
    public ApiResponse<AssetMaintenanceScheduleDto> completeSchedule(@PathVariable Long id) {
        return ApiResponse.ok(assetService.updateScheduleStatus(id, "COMPLETED"));
    }

    @PostMapping("/maintenance-schedules/{id}/cancel")
    public ApiResponse<AssetMaintenanceScheduleDto> cancelSchedule(@PathVariable Long id) {
        return ApiResponse.ok(assetService.updateScheduleStatus(id, "CANCELLED"));
    }

    @DeleteMapping("/maintenance-schedules/{id}")
    public ApiResponse<String> deleteSchedule(@PathVariable Long id) {
        assetService.deleteSchedule(id);
        return ApiResponse.ok("Asset maintenance schedule deleted successfully.");
    }

    @GetMapping("/service-history")
    public ApiResponse<List<AssetServiceHistoryDto>> getServiceHistory() {
        return ApiResponse.ok(assetService.getServiceHistory());
    }

    @PostMapping("/service-history")
    public ApiResponse<AssetServiceHistoryDto> createServiceHistory(@Valid @RequestBody AssetServiceHistoryUpsertRequest request) {
        return ApiResponse.ok(assetService.createServiceHistory(request));
    }

    @PutMapping("/service-history/{id}")
    public ApiResponse<AssetServiceHistoryDto> updateServiceHistory(@PathVariable Long id, @Valid @RequestBody AssetServiceHistoryUpsertRequest request) {
        return ApiResponse.ok(assetService.updateServiceHistory(id, request));
    }

    @DeleteMapping("/service-history/{id}")
    public ApiResponse<String> deleteServiceHistory(@PathVariable Long id) {
        assetService.deleteServiceHistory(id);
        return ApiResponse.ok("Asset service history deleted successfully.");
    }
}
