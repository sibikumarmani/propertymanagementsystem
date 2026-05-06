package com.company.pms.branch;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record BranchUpsertRequest(
    @NotNull Long companyId,
    @NotBlank String branchName,
    String branchCode,
    String address,
    String city,
    String state,
    String country,
    String postalCode,
    @NotBlank String status
) {
}
