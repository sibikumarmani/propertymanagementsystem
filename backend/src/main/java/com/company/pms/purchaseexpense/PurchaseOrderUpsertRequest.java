package com.company.pms.purchaseexpense;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public record PurchaseOrderUpsertRequest(@NotBlank String purchaseOrderNumber, Long purchaseRequestId, @NotNull Long vendorId, @NotNull Long propertyId, Long unitId, @NotNull LocalDate orderDate, LocalDate expectedDeliveryDate, BigDecimal totalAmount, @NotBlank String status, @NotBlank String approvalStatus, String remarks) {
}
