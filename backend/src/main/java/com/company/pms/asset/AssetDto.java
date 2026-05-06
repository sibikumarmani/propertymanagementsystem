package com.company.pms.asset;

import java.math.BigDecimal;
import java.time.LocalDate;

public record AssetDto(
    Long id,
    Long companyId,
    String assetCode,
    String assetName,
    String assetCategory,
    Long propertyId,
    String propertyName,
    Long buildingId,
    String buildingName,
    Long unitId,
    String unitNumber,
    String serialNumber,
    String manufacturer,
    String modelNumber,
    LocalDate purchaseDate,
    BigDecimal purchaseCost,
    LocalDate installationDate,
    String conditionStatus,
    String warrantyProvider,
    LocalDate warrantyStartDate,
    LocalDate warrantyEndDate,
    String warrantyTerms,
    String maintenanceFrequency,
    LocalDate nextMaintenanceDate,
    String status,
    String remarks
) {
}
