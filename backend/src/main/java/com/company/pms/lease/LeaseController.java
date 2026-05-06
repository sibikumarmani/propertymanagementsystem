package com.company.pms.lease;

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
@RequestMapping("/api/leases")
@PreAuthorize("@menuAccessGuard.hasAccess('leases')")
public class LeaseController {

    private final LeaseService leaseService;

    public LeaseController(LeaseService leaseService) {
        this.leaseService = leaseService;
    }

    @GetMapping
    public ApiResponse<List<LeaseDto>> getLeases() {
        return ApiResponse.ok(leaseService.getLeases());
    }

    @GetMapping("/options")
    public ApiResponse<LeaseOptionsDto> getOptions() {
        return ApiResponse.ok(leaseService.getOptions());
    }

    @GetMapping("/{id}/renewals")
    public ApiResponse<List<LeaseRenewalDto>> getRenewals(@PathVariable Long id) {
        return ApiResponse.ok(leaseService.getRenewals(id));
    }

    @PostMapping
    public ApiResponse<LeaseDto> createLease(@Valid @RequestBody LeaseUpsertRequest request) {
        return ApiResponse.ok(leaseService.createLease(request));
    }

    @PutMapping("/{id}")
    public ApiResponse<LeaseDto> updateLease(@PathVariable Long id, @Valid @RequestBody LeaseUpsertRequest request) {
        return ApiResponse.ok(leaseService.updateLease(id, request));
    }

    @PostMapping("/{id}/submit")
    public ApiResponse<LeaseDto> submitLease(@PathVariable Long id) {
        return ApiResponse.ok(leaseService.submitLease(id));
    }

    @PostMapping("/{id}/approve")
    public ApiResponse<LeaseDto> approveLease(@PathVariable Long id) {
        return ApiResponse.ok(leaseService.approveLease(id));
    }

    @PostMapping("/{id}/activate")
    public ApiResponse<LeaseDto> activateLease(@PathVariable Long id) {
        return ApiResponse.ok(leaseService.activateLease(id));
    }

    @PostMapping("/{id}/renew")
    public ApiResponse<LeaseDto> renewLease(@PathVariable Long id, @Valid @RequestBody LeaseRenewalRequest request) {
        return ApiResponse.ok(leaseService.renewLease(id, request));
    }

    @PostMapping("/{id}/terminate")
    public ApiResponse<LeaseDto> terminateLease(@PathVariable Long id, @Valid @RequestBody LeaseTerminationRequest request) {
        return ApiResponse.ok(leaseService.terminateLease(id, request));
    }

    @PostMapping("/{id}/cancel")
    public ApiResponse<LeaseDto> cancelLease(@PathVariable Long id) {
        return ApiResponse.ok(leaseService.cancelLease(id));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<String> deleteLease(@PathVariable Long id) {
        leaseService.deleteLease(id);
        return ApiResponse.ok("Lease deleted successfully.");
    }
}
