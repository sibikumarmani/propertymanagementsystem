package com.company.pms.asset;

import java.math.BigDecimal;
import java.time.LocalDate;

public record AssetServiceHistoryDto(
    Long id,
    Long companyId,
    String serviceNumber,
    Long assetId,
    String assetCode,
    String assetName,
    Long maintenanceScheduleId,
    String scheduleNumber,
    LocalDate serviceDate,
    String serviceType,
    Long vendorId,
    String vendorName,
    String technicianName,
    String conditionBefore,
    String conditionAfter,
    String workPerformed,
    String partsReplaced,
    BigDecimal serviceCost,
    LocalDate nextServiceDate,
    String status,
    String remarks
) {
}
