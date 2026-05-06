package com.company.pms.maintenance;

import java.util.List;

public record MaintenanceOptionsDto(
    List<String> requestStatuses,
    List<String> priorities,
    List<String> approvalStatuses,
    List<String> workOrderStatuses,
    List<String> preventiveFrequencies,
    List<String> preventiveCompletionStatuses,
    List<String> preventiveStatuses
) {
}
