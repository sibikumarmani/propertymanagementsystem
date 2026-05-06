package com.company.pms.building;

public record BuildingDto(
    Long id,
    Long companyId,
    Long propertyId,
    String propertyCode,
    String propertyName,
    String buildingCode,
    String buildingName,
    Integer numberOfFloors,
    String amenitiesSummary,
    String description,
    String status
) {
}
