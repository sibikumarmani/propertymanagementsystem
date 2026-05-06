package com.company.pms.approval;

import com.company.pms.common.api.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/approvals")
@PreAuthorize("@menuAccessGuard.hasAccess('approvals')")
public class ApprovalController {
    private final ApprovalService approvalService;
    public ApprovalController(ApprovalService approvalService) { this.approvalService = approvalService; }

    @GetMapping("/options") public ApiResponse<ApprovalOptionsDto> options() { return ApiResponse.ok(approvalService.getOptions()); }
    @GetMapping("/configs") public ApiResponse<List<ApprovalWorkflowConfigDto>> configs() { return ApiResponse.ok(approvalService.getConfigs()); }
    @PostMapping("/configs") public ApiResponse<ApprovalWorkflowConfigDto> createConfig(@Valid @RequestBody ApprovalConfigUpsertRequest request) { return ApiResponse.ok(approvalService.createConfig(request)); }
    @PutMapping("/configs/{id}") public ApiResponse<ApprovalWorkflowConfigDto> updateConfig(@PathVariable Long id, @Valid @RequestBody ApprovalConfigUpsertRequest request) { return ApiResponse.ok(approvalService.updateConfig(id, request)); }
    @DeleteMapping("/configs/{id}") public ApiResponse<String> deleteConfig(@PathVariable Long id) { approvalService.deleteConfig(id); return ApiResponse.ok("Approval config deleted successfully."); }
    @GetMapping("/requests") public ApiResponse<List<ApprovalRequestDto>> requests() { return ApiResponse.ok(approvalService.getRequests()); }
    @PostMapping("/requests") public ApiResponse<ApprovalRequestDto> submit(@Valid @RequestBody ApprovalSubmitRequest request) { return ApiResponse.ok(approvalService.submit(request)); }
    @PostMapping("/requests/{id}/approve") public ApiResponse<ApprovalRequestDto> approve(@PathVariable Long id, @RequestBody(required = false) ApprovalDecisionRequest request) { return ApiResponse.ok(approvalService.approve(id, request)); }
    @PostMapping("/requests/{id}/reject") public ApiResponse<ApprovalRequestDto> reject(@PathVariable Long id, @RequestBody(required = false) ApprovalDecisionRequest request) { return ApiResponse.ok(approvalService.reject(id, request)); }
    @PostMapping("/requests/{id}/resubmit") public ApiResponse<ApprovalRequestDto> resubmit(@PathVariable Long id, @RequestBody(required = false) ApprovalDecisionRequest request) { return ApiResponse.ok(approvalService.resubmit(id, request)); }
}
