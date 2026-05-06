package com.company.pms.maintenance;

import java.time.LocalDate;

public record PreventiveMaintenanceDto(
    Long id,
    Long companyId,
    String scheduleNumber,
    Long propertyId,
    String propertyName,
    Long unitId,
    String unitNumber,
    String assetName,
    String maintenanceType,
    String recurrenceFrequency,
    LocalDate nextDueDate,
    Long responsibleUserId,
    String responsibleUserName,
    Long vendorId,
    String vendorName,
    Integer notifyBeforeDays,
    String completionStatus,
    LocalDate lastCompletedDate,
    String completionRemarks,
    String status
) {
}
