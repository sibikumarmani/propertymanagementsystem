package com.company.pms.rentbilling;

import java.math.BigDecimal;
import java.time.LocalDate;

public record RentScheduleDto(
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
    String scheduleNumber,
    LocalDate billingPeriodStart,
    LocalDate billingPeriodEnd,
    LocalDate dueDate,
    BigDecimal rentAmount,
    BigDecimal lateFeeAmount,
    BigDecimal paidAmount,
    BigDecimal dueAmount,
    Long invoiceId,
    String status
) {
}
