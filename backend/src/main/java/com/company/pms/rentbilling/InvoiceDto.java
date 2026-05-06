package com.company.pms.rentbilling;

import java.math.BigDecimal;
import java.time.LocalDate;

public record InvoiceDto(
    Long id,
    Long companyId,
    String invoiceNumber,
    String invoiceType,
    Long leaseId,
    String leaseNumber,
    Long rentScheduleId,
    Long tenantId,
    String tenantDisplayName,
    Long propertyId,
    String propertyName,
    Long unitId,
    String unitNumber,
    LocalDate invoiceDate,
    LocalDate dueDate,
    BigDecimal subtotalAmount,
    BigDecimal taxAmount,
    BigDecimal discountAmount,
    BigDecimal lateFeeAmount,
    BigDecimal totalAmount,
    BigDecimal paidAmount,
    BigDecimal dueAmount,
    String status,
    String description,
    String pdfDocument
) {
}
