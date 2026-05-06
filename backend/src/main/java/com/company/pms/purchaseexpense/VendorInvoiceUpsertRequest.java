package com.company.pms.purchaseexpense;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public record VendorInvoiceUpsertRequest(@NotBlank String invoiceNumber, Long purchaseOrderId, @NotNull Long vendorId, @NotNull Long propertyId, Long unitId, @NotNull LocalDate invoiceDate, LocalDate dueDate, BigDecimal invoiceAmount, BigDecimal paidAmount, @NotBlank String paymentStatus, @NotBlank String approvalStatus, @NotBlank String status, String remarks) {
}
