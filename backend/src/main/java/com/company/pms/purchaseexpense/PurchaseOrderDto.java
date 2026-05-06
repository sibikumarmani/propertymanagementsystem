package com.company.pms.purchaseexpense;

import java.math.BigDecimal;
import java.time.LocalDate;

public record PurchaseOrderDto(Long id, Long companyId, String purchaseOrderNumber, Long purchaseRequestId, String requestNumber, Long vendorId, String vendorName, Long propertyId, String propertyName, Long unitId, String unitNumber, LocalDate orderDate, LocalDate expectedDeliveryDate, BigDecimal totalAmount, String status, String approvalStatus, String remarks) {
}
