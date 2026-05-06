package com.company.pms.inspection;

import java.util.List;

public record InspectionOptionsDto(
    List<String> inspectionTypes,
    List<String> conditionStatuses,
    List<String> damageStatuses,
    List<String> acknowledgementStatuses,
    List<String> inspectionStatuses
) {
}
