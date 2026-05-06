package com.company.pms.unit;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record UnitUpsertRequest(
    @NotNull Long propertyId,
    @NotNull Long buildingId,
    @NotNull Long floorId,
    @NotBlank String unitCode,
    @NotBlank String unitNumber,
    @NotBlank String unitType,
    BigDecimal areaValue,
    @NotBlank String areaUnit,
    BigDecimal baseRent,
    BigDecimal securityDepositAmount,
    @NotBlank String unitStatus,
    LocalDate availabilityDate,
    List<UnitAttachmentRequest> photoAttachments,
    List<UnitAttachmentRequest> documentAttachments
) {
}
