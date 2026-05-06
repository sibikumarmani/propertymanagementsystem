package com.company.pms.document;

import java.time.LocalDate;

public record DocumentDto(
    Long id,
    Long companyId,
    String documentNumber,
    String documentTitle,
    String documentType,
    String fileName,
    String contentType,
    Long fileSize,
    String dataUrl,
    Long propertyId,
    String propertyName,
    Long unitId,
    String unitNumber,
    Long tenantId,
    String tenantName,
    Long leaseId,
    String leaseNumber,
    Long vendorId,
    String vendorName,
    Long invoiceId,
    String invoiceNumber,
    LocalDate expiryDate,
    Integer versionNumber,
    Long previousDocumentId,
    String status,
    String accessLevel,
    String remarks,
    boolean expired,
    boolean expiringSoon
) {
}
