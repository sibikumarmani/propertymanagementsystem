package com.company.pms.rentbilling;

import java.math.BigDecimal;

public record SecurityDepositDto(
    Long id,
    Long companyId,
    Long leaseId,
    String leaseNumber,
    Long tenantId,
    String tenantDisplayName,
    Long propertyId,
    String propertyName,
    Long unitId,
    String unitNumber,
    String depositNumber,
    BigDecimal depositAmount,
    BigDecimal collectedAmount,
    BigDecimal adjustedAmount,
    BigDecimal refundedAmount,
    BigDecimal refundableAmount,
    Long depositInvoiceId,
    Long depositReceiptId,
    String status,
    String remarks
) {
}
