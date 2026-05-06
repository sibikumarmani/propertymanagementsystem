package com.company.pms.rentbilling;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public record GenerateRentScheduleRequest(
    @NotNull Long leaseId,
    LocalDate fromDate,
    LocalDate toDate,
    @DecimalMin("0.00") BigDecimal lateFeeAmount
) {
}
