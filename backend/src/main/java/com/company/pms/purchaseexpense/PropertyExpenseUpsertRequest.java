package com.company.pms.purchaseexpense;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public record PropertyExpenseUpsertRequest(@NotBlank String expenseNumber, Long vendorInvoiceId, Long vendorId, @NotNull Long propertyId, Long unitId, @NotNull LocalDate expenseDate, @NotBlank String expenseType, BigDecimal amount, String description, @NotBlank String approvalStatus, @NotBlank String paymentStatus, @NotBlank String status) {
}
