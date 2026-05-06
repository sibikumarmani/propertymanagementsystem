package com.company.pms.floor;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record FloorUpsertRequest(
    @NotNull Long buildingId,
    @NotBlank String floorCode,
    @NotBlank String floorName,
    @NotNull Integer floorNumber,
    @NotBlank String status
) {
}
