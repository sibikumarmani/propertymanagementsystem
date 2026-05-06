package com.company.pms.maintenance;

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
@RequestMapping("/api/maintenance")
@PreAuthorize("@menuAccessGuard.hasAccess('maintenance')")
public class MaintenanceController {

    private final MaintenanceService maintenanceService;

    public MaintenanceController(MaintenanceService maintenanceService) {
        this.maintenanceService = maintenanceService;
    }

    @GetMapping("/options")
    public ApiResponse<MaintenanceOptionsDto> getOptions() {
        return ApiResponse.ok(maintenanceService.getOptions());
    }

    @GetMapping("/requests")
    public ApiResponse<List<MaintenanceRequestDto>> getRequests() {
        return ApiResponse.ok(maintenanceService.getRequests());
    }

    @PostMapping("/requests")
    public ApiResponse<MaintenanceRequestDto> createRequest(@Valid @RequestBody MaintenanceRequestUpsertRequest request) {
        return ApiResponse.ok(maintenanceService.createRequest(request));
    }

    @PutMapping("/requests/{id}")
    public ApiResponse<MaintenanceRequestDto> updateRequest(@PathVariable Long id, @Valid @RequestBody MaintenanceRequestUpsertRequest request) {
        return ApiResponse.ok(maintenanceService.updateRequest(id, request));
    }

    @DeleteMapping("/requests/{id}")
    public ApiResponse<String> deleteRequest(@PathVariable Long id) {
        maintenanceService.deleteRequest(id);
        return ApiResponse.ok("Maintenance request deleted successfully.");
    }

    @GetMapping("/work-orders")
    public ApiResponse<List<MaintenanceWorkOrderDto>> getWorkOrders() {
        return ApiResponse.ok(maintenanceService.getWorkOrders());
    }

    @PostMapping("/work-orders")
    public ApiResponse<MaintenanceWorkOrderDto> createWorkOrder(@Valid @RequestBody MaintenanceWorkOrderUpsertRequest request) {
        return ApiResponse.ok(maintenanceService.createWorkOrder(request));
    }

    @PutMapping("/work-orders/{id}")
    public ApiResponse<MaintenanceWorkOrderDto> updateWorkOrder(@PathVariable Long id, @Valid @RequestBody MaintenanceWorkOrderUpsertRequest request) {
        return ApiResponse.ok(maintenanceService.updateWorkOrder(id, request));
    }

    @DeleteMapping("/work-orders/{id}")
    public ApiResponse<String> deleteWorkOrder(@PathVariable Long id) {
        maintenanceService.deleteWorkOrder(id);
        return ApiResponse.ok("Work order deleted successfully.");
    }

    @GetMapping("/preventive")
    public ApiResponse<List<PreventiveMaintenanceDto>> getPreventiveSchedules() {
        return ApiResponse.ok(maintenanceService.getPreventiveSchedules());
    }

    @PostMapping("/preventive")
    public ApiResponse<PreventiveMaintenanceDto> createPreventiveSchedule(@Valid @RequestBody PreventiveMaintenanceUpsertRequest request) {
        return ApiResponse.ok(maintenanceService.createPreventiveSchedule(request));
    }

    @PutMapping("/preventive/{id}")
    public ApiResponse<PreventiveMaintenanceDto> updatePreventiveSchedule(@PathVariable Long id, @Valid @RequestBody PreventiveMaintenanceUpsertRequest request) {
        return ApiResponse.ok(maintenanceService.updatePreventiveSchedule(id, request));
    }

    @DeleteMapping("/preventive/{id}")
    public ApiResponse<String> deletePreventiveSchedule(@PathVariable Long id) {
        maintenanceService.deletePreventiveSchedule(id);
        return ApiResponse.ok("Preventive maintenance schedule deleted successfully.");
    }
}
