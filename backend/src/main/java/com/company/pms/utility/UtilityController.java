package com.company.pms.utility;

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
@RequestMapping("/api/utilities")
@PreAuthorize("@menuAccessGuard.hasAccess('utilities')")
public class UtilityController {
    private final UtilityService utilityService;

    public UtilityController(UtilityService utilityService) {
        this.utilityService = utilityService;
    }

    @GetMapping("/options")
    public ApiResponse<UtilityOptionsDto> getOptions() {
        return ApiResponse.ok(utilityService.getOptions());
    }

    @GetMapping("/types")
    public ApiResponse<List<UtilityTypeDto>> getTypes() {
        return ApiResponse.ok(utilityService.getTypes());
    }

    @PostMapping("/types")
    public ApiResponse<UtilityTypeDto> createType(@Valid @RequestBody UtilityTypeUpsertRequest request) {
        return ApiResponse.ok(utilityService.createType(request));
    }

    @PutMapping("/types/{id}")
    public ApiResponse<UtilityTypeDto> updateType(@PathVariable Long id, @Valid @RequestBody UtilityTypeUpsertRequest request) {
        return ApiResponse.ok(utilityService.updateType(id, request));
    }

    @DeleteMapping("/types/{id}")
    public ApiResponse<String> deleteType(@PathVariable Long id) {
        utilityService.deleteType(id);
        return ApiResponse.ok("Utility type deleted successfully.");
    }

    @GetMapping("/readings")
    public ApiResponse<List<MeterReadingDto>> getReadings() {
        return ApiResponse.ok(utilityService.getReadings());
    }

    @PostMapping("/readings")
    public ApiResponse<MeterReadingDto> createReading(@Valid @RequestBody MeterReadingUpsertRequest request) {
        return ApiResponse.ok(utilityService.createReading(request));
    }

    @PutMapping("/readings/{id}")
    public ApiResponse<MeterReadingDto> updateReading(@PathVariable Long id, @Valid @RequestBody MeterReadingUpsertRequest request) {
        return ApiResponse.ok(utilityService.updateReading(id, request));
    }

    @DeleteMapping("/readings/{id}")
    public ApiResponse<String> deleteReading(@PathVariable Long id) {
        utilityService.deleteReading(id);
        return ApiResponse.ok("Meter reading deleted successfully.");
    }

    @GetMapping("/bills")
    public ApiResponse<List<UtilityBillDto>> getBills() {
        return ApiResponse.ok(utilityService.getBills());
    }

    @PostMapping("/bills")
    public ApiResponse<UtilityBillDto> createBill(@Valid @RequestBody UtilityBillUpsertRequest request) {
        return ApiResponse.ok(utilityService.createBill(request));
    }

    @PutMapping("/bills/{id}")
    public ApiResponse<UtilityBillDto> updateBill(@PathVariable Long id, @Valid @RequestBody UtilityBillUpsertRequest request) {
        return ApiResponse.ok(utilityService.updateBill(id, request));
    }

    @PostMapping("/bills/{id}/approve")
    public ApiResponse<UtilityBillDto> approveBill(@PathVariable Long id) {
        return ApiResponse.ok(utilityService.updateBillStatus(id, "APPROVED"));
    }

    @PostMapping("/bills/{id}/post")
    public ApiResponse<UtilityBillDto> postBill(@PathVariable Long id) {
        return ApiResponse.ok(utilityService.updateBillStatus(id, "POSTED"));
    }

    @PostMapping("/bills/{id}/cancel")
    public ApiResponse<UtilityBillDto> cancelBill(@PathVariable Long id) {
        return ApiResponse.ok(utilityService.updateBillStatus(id, "CANCELLED"));
    }

    @DeleteMapping("/bills/{id}")
    public ApiResponse<String> deleteBill(@PathVariable Long id) {
        utilityService.deleteBill(id);
        return ApiResponse.ok("Utility bill deleted successfully.");
    }
}
