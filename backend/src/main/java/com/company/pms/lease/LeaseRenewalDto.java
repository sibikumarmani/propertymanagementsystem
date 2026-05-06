package com.company.pms.lease;

import java.math.BigDecimal;
import java.time.LocalDate;

public record LeaseRenewalDto(
    Long id,
    Long companyId,
    Long leaseId,
    String renewalNumber,
    LocalDate previousStartDate,
    LocalDate previousEndDate,
    LocalDate newStartDate,
    LocalDate newEndDate,
    BigDecimal previousRentAmount,
    BigDecimal newRentAmount,
    BigDecimal securityDepositAmount,
    LeaseAttachmentDto agreementDocument,
    String approvalStatus,
    String renewalNotes
) {
}
