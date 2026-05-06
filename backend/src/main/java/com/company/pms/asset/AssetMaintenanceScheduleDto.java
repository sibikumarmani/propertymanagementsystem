package com.company.pms.asset;

import java.math.BigDecimal;
import java.time.LocalDate;

public record AssetMaintenanceScheduleDto(
    Long id,
    Long companyId,
    String scheduleNumber,
    Long assetId,
    String assetCode,
    String assetName,
    String maintenanceType,
    String frequency,
    LocalDate plannedDate,
    Long assignedVendorId,
    String assignedVendorName,
    BigDecimal estimatedCost,
    String priority,
    String status,
    String remarks
) {
}
