package com.company.pms.building;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record BuildingUpsertRequest(
    @NotNull Long propertyId,
    @NotBlank String buildingCode,
    @NotBlank String buildingName,
    Integer numberOfFloors,
    String amenitiesSummary,
    String description,
    @NotBlank String status
) {
}
