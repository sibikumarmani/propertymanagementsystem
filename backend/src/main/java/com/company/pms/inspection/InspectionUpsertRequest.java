package com.company.pms.inspection;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record InspectionUpsertRequest(
    @NotBlank String inspectionNumber,
    @NotBlank String inspectionType,
    @NotNull Long propertyId,
    Long unitId,
    Long leaseId,
    Long tenantId,
    LocalDate scheduledDate,
    @NotNull LocalDate inspectionDate,
    String inspectorName,
    @NotBlank String overallCondition,
    @NotBlank String damageStatus,
    BigDecimal estimatedRepairCost,
    List<InspectionChecklistItemDto> checklist,
    List<InspectionAttachmentDto> photoAttachments,
    String damageNotes,
    @NotBlank String tenantAcknowledgementStatus,
    String tenantAcknowledgedBy,
    @NotBlank String status,
    String remarks
) {
}
