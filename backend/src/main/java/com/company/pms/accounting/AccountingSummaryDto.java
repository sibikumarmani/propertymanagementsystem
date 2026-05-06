package com.company.pms.accounting;

import java.math.BigDecimal;
import java.util.List;

public record AccountingSummaryDto(BigDecimal rentReceivable, BigDecimal advanceReceived, BigDecimal securityDepositLiability, BigDecimal income, BigDecimal expenses, BigDecimal taxPayable, BigDecimal netProfit, List<AccountingReportRowDto> propertyProfitAndLoss) {}
