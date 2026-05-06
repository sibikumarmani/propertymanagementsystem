package com.company.pms.utility;

import java.math.BigDecimal;

public record UtilityTypeDto(
    Long id,
    Long companyId,
    String typeCode,
    String typeName,
    String category,
    String billingMethod,
    String unitOfMeasure,
    BigDecimal defaultRate,
    BigDecimal fixedCharge,
    Boolean commonArea,
    String status,
    String description
) {
}
