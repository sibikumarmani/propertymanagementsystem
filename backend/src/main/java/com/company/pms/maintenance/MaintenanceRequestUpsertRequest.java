package com.company.pms.maintenance;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.List;

public record MaintenanceRequestUpsertRequest(
    @NotBlank String requestNumber,
    @NotNull Long tenantId,
    @NotNull Long propertyId,
    @NotNull Long unitId,
    @NotBlank String category,
    @NotBlank String priority,
    @NotBlank String description,
    Long assignedVendorId,
    Long assignedUserId,
    BigDecimal estimatedCost,
    BigDecimal actualCost,
    @NotBlank String status,
    String approvalStatus,
    List<MaintenanceAttachmentDto> attachments,
    String completionRemarks
) {
}
