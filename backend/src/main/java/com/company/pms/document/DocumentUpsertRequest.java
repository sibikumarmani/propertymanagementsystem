package com.company.pms.document;

import jakarta.validation.constraints.NotBlank;

import java.time.LocalDate;

public record DocumentUpsertRequest(
    @NotBlank String documentNumber,
    @NotBlank String documentTitle,
    @NotBlank String documentType,
    @NotBlank String fileName,
    @NotBlank String contentType,
    Long fileSize,
    @NotBlank String dataUrl,
    Long propertyId,
    Long unitId,
    Long tenantId,
    Long leaseId,
    Long vendorId,
    Long invoiceId,
    LocalDate expiryDate,
    Long previousDocumentId,
    String status,
    String accessLevel,
    String remarks
) {
}
