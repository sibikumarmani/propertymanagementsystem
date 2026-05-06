package com.company.pms.utility;

import java.util.List;

public record UtilityOptionsDto(
    List<String> categories,
    List<String> billingMethods,
    List<String> utilityTypeStatuses,
    List<String> readingStatuses,
    List<String> billStatuses,
    List<String> unitsOfMeasure
) {
}
