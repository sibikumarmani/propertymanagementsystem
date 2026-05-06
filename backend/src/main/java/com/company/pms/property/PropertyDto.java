package com.company.pms.property;

import java.util.List;

public record PropertyDto(
    Long id,
    Long companyId,
    String companyName,
    String companyCode,
    Long branchId,
    String branchName,
    String branchCode,
    String propertyCode,
    String propertyName,
    String propertyType,
    String ownershipType,
    String ownerReference,
    String ownershipDetails,
    String address,
    String city,
    String state,
    String country,
    String pincode,
    Integer totalFloors,
    Integer totalUnits,
    Long propertyManagerUserId,
    String propertyManagerName,
    String amenitiesSummary,
    List<PropertyAttachmentDto> documentAttachments,
    String status
) {
}
