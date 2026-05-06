package com.company.pms.inspection;

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
@RequestMapping("/api/inspections")
@PreAuthorize("@menuAccessGuard.hasAccess('inspections')")
public class InspectionController {
    private final InspectionService inspectionService;

    public InspectionController(InspectionService inspectionService) {
        this.inspectionService = inspectionService;
    }

    @GetMapping("/options")
    public ApiResponse<InspectionOptionsDto> getOptions() {
        return ApiResponse.ok(inspectionService.getOptions());
    }

    @GetMapping
    public ApiResponse<List<InspectionDto>> getInspections() {
        return ApiResponse.ok(inspectionService.getInspections());
    }

    @PostMapping
    public ApiResponse<InspectionDto> createInspection(@Valid @RequestBody InspectionUpsertRequest request) {
        return ApiResponse.ok(inspectionService.createInspection(request));
    }

    @PutMapping("/{id}")
    public ApiResponse<InspectionDto> updateInspection(@PathVariable Long id, @Valid @RequestBody InspectionUpsertRequest request) {
        return ApiResponse.ok(inspectionService.updateInspection(id, request));
    }

    @PostMapping("/{id}/submit")
    public ApiResponse<InspectionDto> submitInspection(@PathVariable Long id) {
        return ApiResponse.ok(inspectionService.updateStatus(id, "SUBMITTED"));
    }

    @PostMapping("/{id}/complete")
    public ApiResponse<InspectionDto> completeInspection(@PathVariable Long id) {
        return ApiResponse.ok(inspectionService.updateStatus(id, "COMPLETED"));
    }

    @PostMapping("/{id}/acknowledge")
    public ApiResponse<InspectionDto> acknowledgeInspection(@PathVariable Long id) {
        return ApiResponse.ok(inspectionService.acknowledge(id));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<String> deleteInspection(@PathVariable Long id) {
        inspectionService.deleteInspection(id);
        return ApiResponse.ok("Inspection deleted successfully.");
    }
}
