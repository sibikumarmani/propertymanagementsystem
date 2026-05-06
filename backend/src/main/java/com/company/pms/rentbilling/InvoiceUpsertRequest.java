package com.company.pms.rentbilling;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public record InvoiceUpsertRequest(
    @NotBlank String invoiceNumber,
    @NotBlank String invoiceType,
    Long leaseId,
    Long rentScheduleId,
    @NotNull Long tenantId,
    Long propertyId,
    Long unitId,
    @NotNull LocalDate invoiceDate,
    @NotNull LocalDate dueDate,
    @NotNull @DecimalMin("0.00") BigDecimal subtotalAmount,
    @DecimalMin("0.00") BigDecimal taxAmount,
    @DecimalMin("0.00") BigDecimal discountAmount,
    @DecimalMin("0.00") BigDecimal lateFeeAmount,
    @NotBlank String status,
    String description,
    String pdfDocument
) {
}
