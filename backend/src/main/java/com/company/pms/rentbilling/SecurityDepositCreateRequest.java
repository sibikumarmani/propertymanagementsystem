package com.company.pms.rentbilling;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record SecurityDepositCreateRequest(
    @NotNull Long leaseId,
    @NotBlank String depositNumber,
    String remarks
) {
}
