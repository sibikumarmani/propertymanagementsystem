package com.company.pms.document;

import java.util.List;

public record DocumentOptionsDto(
    List<String> documentTypes,
    List<String> statuses,
    List<String> accessLevels
) {
}
