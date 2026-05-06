package com.company.pms.utility;

import java.math.BigDecimal;
import java.time.LocalDate;

public record MeterReadingDto(
    Long id,
    Long companyId,
    String readingNumber,
    Long utilityTypeId,
    String utilityTypeName,
    String utilityCategory,
    Long propertyId,
    String propertyName,
    Long unitId,
    String unitNumber,
    Long tenantId,
    String tenantDisplayName,
    String meterNumber,
    LocalDate readingDate,
    BigDecimal previousReading,
    BigDecimal currentReading,
    BigDecimal consumption,
    Boolean commonArea,
    String status,
    String remarks
) {
}
