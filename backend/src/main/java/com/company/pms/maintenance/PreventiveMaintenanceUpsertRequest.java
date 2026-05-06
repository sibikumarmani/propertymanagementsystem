package com.company.pms.maintenance;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record PreventiveMaintenanceUpsertRequest(
    @NotBlank String scheduleNumber,
    @NotNull Long propertyId,
    Long unitId,
    @NotBlank String assetName,
    @NotBlank String maintenanceType,
    @NotBlank String recurrenceFrequency,
    @NotNull LocalDate nextDueDate,
    Long responsibleUserId,
    Long vendorId,
    Integer notifyBeforeDays,
    @NotBlank String completionStatus,
    LocalDate lastCompletedDate,
    String completionRemarks,
    @NotBlank String status
) {
}
