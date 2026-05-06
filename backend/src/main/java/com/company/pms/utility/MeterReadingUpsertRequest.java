package com.company.pms.utility;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public record MeterReadingUpsertRequest(
    @NotBlank String readingNumber,
    @NotNull Long utilityTypeId,
    @NotNull Long propertyId,
    Long unitId,
    Long tenantId,
    String meterNumber,
    @NotNull LocalDate readingDate,
    BigDecimal previousReading,
    @NotNull BigDecimal currentReading,
    Boolean commonArea,
    @NotBlank String status,
    String remarks
) {
}
