package com.company.pms.utility;

import jakarta.validation.constraints.NotBlank;

import java.math.BigDecimal;

public record UtilityTypeUpsertRequest(
    @NotBlank String typeCode,
    @NotBlank String typeName,
    @NotBlank String category,
    @NotBlank String billingMethod,
    String unitOfMeasure,
    BigDecimal defaultRate,
    BigDecimal fixedCharge,
    Boolean commonArea,
    @NotBlank String status,
    String description
) {
}
