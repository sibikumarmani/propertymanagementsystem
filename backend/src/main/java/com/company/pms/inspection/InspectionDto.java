package com.company.pms.inspection;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public record InspectionDto(
    Long id,
    Long companyId,
    String inspectionNumber,
    String inspectionType,
    Long propertyId,
    String propertyName,
    Long unitId,
    String unitNumber,
    Long leaseId,
    String leaseNumber,
    Long tenantId,
    String tenantDisplayName,
    LocalDate scheduledDate,
    LocalDate inspectionDate,
    String inspectorName,
    String overallCondition,
    String damageStatus,
    BigDecimal estimatedRepairCost,
    List<InspectionChecklistItemDto> checklist,
    List<InspectionAttachmentDto> photoAttachments,
    String damageNotes,
    String tenantAcknowledgementStatus,
    String tenantAcknowledgedBy,
    Instant tenantAcknowledgedAt,
    String status,
    String remarks
) {
}
