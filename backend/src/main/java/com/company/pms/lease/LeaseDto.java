package com.company.pms.lease;

import java.math.BigDecimal;
import java.time.LocalDate;

public record LeaseDto(
    Long id,
    Long companyId,
    String leaseNumber,
    Long tenantId,
    String tenantCode,
    String tenantDisplayName,
    Long propertyId,
    String propertyCode,
    String propertyName,
    Long unitId,
    String unitCode,
    String unitNumber,
    LocalDate leaseStartDate,
    LocalDate leaseEndDate,
    BigDecimal rentAmount,
    BigDecimal securityDepositAmount,
    String billingCycle,
    Integer dueDay,
    Integer gracePeriodDays,
    String lateFeeRule,
    LeaseAttachmentDto agreementDocument,
    String status,
    LocalDate activationDate,
    LocalDate terminationDate,
    String terminationReason,
    BigDecimal finalSettlementAmount,
    BigDecimal securityDepositRefundAmount,
    LeaseAttachmentDto terminationDocument,
    Long renewedFromLeaseId
) {
}
