package com.company.pms.lease;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public record LeaseRenewalRequest(
    @NotBlank String renewalNumber,
    @NotNull LocalDate newStartDate,
    @NotNull LocalDate newEndDate,
    @NotNull @DecimalMin("0.00") BigDecimal newRentAmount,
    @DecimalMin("0.00") BigDecimal securityDepositAmount,
    LeaseAttachmentRequest agreementDocument,
    String renewalNotes
) {
}
