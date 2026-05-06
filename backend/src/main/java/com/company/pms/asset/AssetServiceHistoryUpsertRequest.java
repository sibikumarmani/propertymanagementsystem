package com.company.pms.asset;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public record AssetServiceHistoryUpsertRequest(
    @NotBlank String serviceNumber,
    @NotNull Long assetId,
    Long maintenanceScheduleId,
    @NotNull LocalDate serviceDate,
    @NotBlank String serviceType,
    Long vendorId,
    String technicianName,
    String conditionBefore,
    @NotBlank String conditionAfter,
    @NotBlank String workPerformed,
    String partsReplaced,
    BigDecimal serviceCost,
    LocalDate nextServiceDate,
    @NotBlank String status,
    String remarks
) {
}
