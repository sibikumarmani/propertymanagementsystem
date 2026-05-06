package com.company.pms.utility;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public record UtilityBillUpsertRequest(
    @NotBlank String billNumber,
    @NotNull Long utilityTypeId,
    Long meterReadingId,
    Long tenantId,
    @NotNull Long propertyId,
    Long unitId,
    @NotNull LocalDate billDate,
    @NotNull LocalDate dueDate,
    @NotNull LocalDate billingPeriodStart,
    @NotNull LocalDate billingPeriodEnd,
    @NotBlank String billingMethod,
    BigDecimal consumption,
    BigDecimal rate,
    BigDecimal fixedCharge,
    BigDecimal commonAreaAmount,
    BigDecimal taxAmount,
    BigDecimal paidAmount,
    @NotBlank String status,
    String remarks
) {
}
