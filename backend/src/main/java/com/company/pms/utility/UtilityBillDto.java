package com.company.pms.utility;

import java.math.BigDecimal;
import java.time.LocalDate;

public record UtilityBillDto(
    Long id,
    Long companyId,
    String billNumber,
    Long utilityTypeId,
    String utilityTypeName,
    String utilityCategory,
    Long meterReadingId,
    String readingNumber,
    Long tenantId,
    String tenantDisplayName,
    Long propertyId,
    String propertyName,
    Long unitId,
    String unitNumber,
    LocalDate billDate,
    LocalDate dueDate,
    LocalDate billingPeriodStart,
    LocalDate billingPeriodEnd,
    String billingMethod,
    BigDecimal consumption,
    BigDecimal rate,
    BigDecimal fixedCharge,
    BigDecimal usageAmount,
    BigDecimal commonAreaAmount,
    BigDecimal taxAmount,
    BigDecimal totalAmount,
    BigDecimal paidAmount,
    BigDecimal dueAmount,
    String status,
    String remarks
) {
}
