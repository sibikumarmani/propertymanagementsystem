package com.company.pms.maintenance;

import java.math.BigDecimal;
import java.util.List;

public record MaintenanceRequestDto(
    Long id,
    Long companyId,
    String requestNumber,
    Long tenantId,
    String tenantDisplayName,
    Long propertyId,
    String propertyName,
    Long unitId,
    String unitNumber,
    String category,
    String priority,
    String description,
    Long assignedVendorId,
    String assignedVendorName,
    Long assignedUserId,
    String assignedUserName,
    BigDecimal estimatedCost,
    BigDecimal actualCost,
    String status,
    String approvalStatus,
    List<MaintenanceAttachmentDto> attachments,
    String completionRemarks
) {
}
