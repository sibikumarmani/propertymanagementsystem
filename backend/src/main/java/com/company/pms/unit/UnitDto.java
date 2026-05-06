package com.company.pms.unit;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record UnitDto(
    Long id,
    Long companyId,
    Long propertyId,
    String propertyCode,
    String propertyName,
    Long buildingId,
    String buildingCode,
    String buildingName,
    Long floorId,
    String floorCode,
    String floorName,
    String unitCode,
    String unitNumber,
    String unitType,
    BigDecimal areaValue,
    String areaUnit,
    BigDecimal baseRent,
    BigDecimal securityDepositAmount,
    String unitStatus,
    LocalDate availabilityDate,
    List<UnitAttachmentDto> photoAttachments,
    List<UnitAttachmentDto> documentAttachments
) {
}
