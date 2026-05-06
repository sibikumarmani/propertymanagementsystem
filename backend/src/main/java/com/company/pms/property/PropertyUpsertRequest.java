package com.company.pms.property;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record PropertyUpsertRequest(
    Long branchId,
    @NotBlank String propertyCode,
    @NotBlank String propertyName,
    @NotBlank String propertyType,
    @NotBlank String ownershipType,
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
    String amenitiesSummary,
    List<PropertyAttachmentRequest> documentAttachments,
    @NotBlank String status
) {
}
