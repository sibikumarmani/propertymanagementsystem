package com.company.pms.lease;

import java.util.List;

public record LeaseOptionsDto(
    List<String> leaseStatuses,
    List<String> billingCycles
) {
}
