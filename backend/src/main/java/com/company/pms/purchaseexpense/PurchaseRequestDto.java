package com.company.pms.purchaseexpense;

import java.math.BigDecimal;

public record PurchaseRequestDto(Long id, Long companyId, String requestNumber, Long propertyId, String propertyName, Long unitId, String unitNumber, String expenseType, String description, BigDecimal estimatedAmount, String status, String approvalStatus) {
}
