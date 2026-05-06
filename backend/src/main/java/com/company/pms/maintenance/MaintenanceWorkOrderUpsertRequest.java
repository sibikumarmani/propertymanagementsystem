package com.company.pms.maintenance;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record MaintenanceWorkOrderUpsertRequest(
    @NotBlank String workOrderNumber,
    @NotNull Long maintenanceRequestId,
    Long vendorId,
    Long technicianUserId,
    String materialsUsed,
    BigDecimal laborCharges,
    MaintenanceAttachmentDto vendorInvoiceDocument,
    String completionRemarks,
    String approvalStatus,
    @NotBlank String status
) {
}
