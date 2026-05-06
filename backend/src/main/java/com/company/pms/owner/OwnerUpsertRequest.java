package com.company.pms.owner;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.List;

public record OwnerUpsertRequest(
    @NotBlank String ownerCode,
    @NotBlank String ownerName,
    @NotBlank String phone,
    @Email String email,
    String address,
    String taxDetails,
    String bankAccountDetails,
    @NotNull List<Long> propertyIds,
    BigDecimal ownershipPercentage,
    @NotBlank String payoutFrequency,
    @NotBlank String statementPreference,
    @NotBlank String ownerStatus,
    @NotBlank String statementStage
) {
}
