package com.company.pms.lease;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public record LeaseUpsertRequest(
    @NotBlank String leaseNumber,
    @NotNull Long tenantId,
    @NotNull Long unitId,
    @NotNull LocalDate leaseStartDate,
    @NotNull LocalDate leaseEndDate,
    @NotNull @DecimalMin("0.00") BigDecimal rentAmount,
    @NotNull @DecimalMin("0.00") BigDecimal securityDepositAmount,
    @NotBlank String billingCycle,
    @NotNull @Min(1) @Max(31) Integer dueDay,
    @Min(0) Integer gracePeriodDays,
    String lateFeeRule,
    LeaseAttachmentRequest agreementDocument,
    @NotBlank String status
) {
}
