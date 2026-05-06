package com.company.pms.purchaseexpense;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record PurchaseRequestUpsertRequest(@NotBlank String requestNumber, @NotNull Long propertyId, Long unitId, @NotBlank String expenseType, @NotBlank String description, BigDecimal estimatedAmount, @NotBlank String status, @NotBlank String approvalStatus) {
}
