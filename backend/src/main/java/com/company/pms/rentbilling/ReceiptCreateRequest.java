package com.company.pms.rentbilling;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public record ReceiptCreateRequest(
    @NotBlank String receiptNumber,
    Long invoiceId,
    @NotNull Long tenantId,
    @NotNull LocalDate receiptDate,
    @NotBlank String paymentMode,
    @NotNull @DecimalMin("0.01") BigDecimal amount,
    String referenceNumber,
    String remarks,
    String pdfDocument
) {
}
