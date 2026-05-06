package com.company.pms.tenant;

import java.util.List;

public record TenantOptionsDto(
    List<String> tenantTypes,
    List<String> idProofTypes,
    List<String> kycStatuses,
    List<String> blacklistStatuses,
    List<String> tenantStatuses,
    List<String> kycStages
) {
}
