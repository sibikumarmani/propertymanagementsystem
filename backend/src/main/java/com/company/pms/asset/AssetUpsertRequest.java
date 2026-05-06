package com.company.pms.asset;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public record AssetUpsertRequest(
    @NotBlank String assetCode,
    @NotBlank String assetName,
    @NotBlank String assetCategory,
    @NotNull Long propertyId,
    Long buildingId,
    Long unitId,
    String serialNumber,
    String manufacturer,
    String modelNumber,
    LocalDate purchaseDate,
    BigDecimal purchaseCost,
    LocalDate installationDate,
    @NotBlank String conditionStatus,
    String warrantyProvider,
    LocalDate warrantyStartDate,
    LocalDate warrantyEndDate,
    String warrantyTerms,
    String maintenanceFrequency,
    LocalDate nextMaintenanceDate,
    @NotBlank String status,
    String remarks
) {
}
