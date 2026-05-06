package com.company.pms.rentbilling;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public record SecurityDepositActionRequest(
    @NotNull @DecimalMin("0.01") BigDecimal amount,
    LocalDate transactionDate,
    Long invoiceId,
    Long receiptId,
    String referenceNumber,
    String remarks
) {
}
