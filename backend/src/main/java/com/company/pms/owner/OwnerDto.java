package com.company.pms.owner;

import java.math.BigDecimal;
import java.util.List;

public record OwnerDto(
    Long id,
    Long companyId,
    String companyName,
    String companyCode,
    String ownerCode,
    String ownerName,
    String phone,
    String email,
    String address,
    String taxDetails,
    String bankAccountDetails,
    List<Long> propertyIds,
    String propertiesOwnedSummary,
    BigDecimal ownershipPercentage,
    String payoutFrequency,
    String statementPreference,
    String ownerStatus,
    String statementStage
) {
}
