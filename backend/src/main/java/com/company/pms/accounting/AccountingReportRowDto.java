package com.company.pms.accounting;

import java.math.BigDecimal;

public record AccountingReportRowDto(String key, String label, BigDecimal debitAmount, BigDecimal creditAmount, BigDecimal balanceAmount) {}
