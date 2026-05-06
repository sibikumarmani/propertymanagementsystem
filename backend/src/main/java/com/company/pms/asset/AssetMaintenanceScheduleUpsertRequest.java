package com.company.pms.asset;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public record AssetMaintenanceScheduleUpsertRequest(
    @NotBlank String scheduleNumber,
    @NotNull Long assetId,
    @NotBlank String maintenanceType,
    @NotBlank String frequency,
    @NotNull LocalDate plannedDate,
    Long assignedVendorId,
    BigDecimal estimatedCost,
    @NotBlank String priority,
    @NotBlank String status,
    String remarks
) {
}
