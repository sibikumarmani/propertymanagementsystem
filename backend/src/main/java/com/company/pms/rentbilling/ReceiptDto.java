package com.company.pms.rentbilling;

import java.math.BigDecimal;
import java.time.LocalDate;

public record ReceiptDto(
    Long id,
    Long companyId,
    String receiptNumber,
    Long invoiceId,
    String invoiceNumber,
    Long tenantId,
    String tenantDisplayName,
    LocalDate receiptDate,
    String paymentMode,
    BigDecimal amount,
    BigDecimal advanceAmount,
    String referenceNumber,
    String remarks,
    String pdfDocument,
    String status
) {
}
