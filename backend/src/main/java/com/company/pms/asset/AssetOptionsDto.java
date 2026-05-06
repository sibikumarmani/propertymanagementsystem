package com.company.pms.asset;

import java.util.List;

public record AssetOptionsDto(
    List<String> assetCategories,
    List<String> conditionStatuses,
    List<String> maintenanceFrequencies,
    List<String> assetStatuses,
    List<String> maintenanceTypes,
    List<String> priorities,
    List<String> scheduleStatuses,
    List<String> serviceStatuses
) {
}
