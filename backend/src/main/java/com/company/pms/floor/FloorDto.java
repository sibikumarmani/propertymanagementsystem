package com.company.pms.floor;

public record FloorDto(
    Long id,
    Long companyId,
    Long propertyId,
    String propertyCode,
    String propertyName,
    Long buildingId,
    String buildingCode,
    String buildingName,
    String floorCode,
    String floorName,
    Integer floorNumber,
    String status
) {
}
