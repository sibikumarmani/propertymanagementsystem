package com.company.pms.approval;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;

public record ApprovalConfigUpsertRequest(@NotBlank String transactionType, @NotNull @Min(1) Integer levelNo, @NotNull Long approverRoleId, BigDecimal minAmount, BigDecimal maxAmount, Boolean active) {}
