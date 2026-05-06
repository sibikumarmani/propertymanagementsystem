package com.company.pms.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record SelectCompanyRequest(
    @NotBlank String selectionToken,
    @NotNull Long companyId
) {
}
