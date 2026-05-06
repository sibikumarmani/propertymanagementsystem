package com.company.pms.maintenance;

import java.math.BigDecimal;

public record MaintenanceWorkOrderDto(
    Long id,
    Long companyId,
    String workOrderNumber,
    Long maintenanceRequestId,
    String requestNumber,
    Long vendorId,
    String vendorName,
    Long technicianUserId,
    String technicianName,
    String materialsUsed,
    BigDecimal laborCharges,
    MaintenanceAttachmentDto vendorInvoiceDocument,
    String completionRemarks,
    String approvalStatus,
    String status
) {
}
