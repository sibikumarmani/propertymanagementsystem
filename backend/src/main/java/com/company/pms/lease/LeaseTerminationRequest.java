package com.company.pms.lease;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public record LeaseTerminationRequest(
    @NotNull LocalDate terminationDate,
    @NotBlank String terminationReason,
    @DecimalMin("0.00") BigDecimal finalSettlementAmount,
    @DecimalMin("0.00") BigDecimal securityDepositRefundAmount,
    LeaseAttachmentRequest terminationDocument
) {
}
