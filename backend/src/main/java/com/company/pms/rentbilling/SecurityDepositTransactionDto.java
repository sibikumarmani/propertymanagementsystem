package com.company.pms.rentbilling;

import java.math.BigDecimal;
import java.time.LocalDate;

public record SecurityDepositTransactionDto(
    Long id,
    Long companyId,
    Long securityDepositId,
    String transactionType,
    LocalDate transactionDate,
    BigDecimal amount,
    Long invoiceId,
    Long receiptId,
    String referenceNumber,
    String remarks
) {
}
