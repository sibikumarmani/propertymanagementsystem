package com.company.pms.branch;

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
@RequestMapping("/api/branches")
@PreAuthorize("@menuAccessGuard.hasAccess('branches')")
public class BranchController {

    private final BranchService branchService;

    public BranchController(BranchService branchService) {
        this.branchService = branchService;
    }

    @GetMapping
    public ApiResponse<List<BranchDto>> getBranches() {
        return ApiResponse.ok(branchService.getBranches());
    }

    @GetMapping("/{id}")
    public ApiResponse<BranchDto> getBranch(@PathVariable Long id) {
        return ApiResponse.ok(branchService.getBranch(id));
    }

    @PostMapping
    public ApiResponse<BranchDto> createBranch(@Valid @RequestBody BranchUpsertRequest request) {
        return ApiResponse.ok(branchService.createBranch(request));
    }

    @PutMapping("/{id}")
    public ApiResponse<BranchDto> updateBranch(@PathVariable Long id, @Valid @RequestBody BranchUpsertRequest request) {
        return ApiResponse.ok(branchService.updateBranch(id, request));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<String> deleteBranch(@PathVariable Long id) {
        branchService.deleteBranch(id);
        return ApiResponse.ok("Branch deleted successfully.");
    }
}
