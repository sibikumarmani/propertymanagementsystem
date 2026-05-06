package com.company.pms.inspection;

import java.math.BigDecimal;

public record InspectionChecklistItemDto(
    String itemName,
    String conditionStatus,
    Boolean damaged,
    String damageDescription,
    BigDecimal estimatedRepairCost,
    String remarks
) {
}
