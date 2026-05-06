package com.company.pms.unit;

import java.util.List;

public record UnitOptionsDto(
    List<String> unitTypes,
    List<String> unitStatuses,
    List<String> areaUnits
) {
}
