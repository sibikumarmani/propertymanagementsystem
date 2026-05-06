package com.company.pms.accounting;

import java.math.BigDecimal;
import java.time.LocalDate;

public record AccountingEntryDto(Long id, Long companyId, LocalDate entryDate, String accountType, String partyType, Long partyId, String partyName, Long propertyId, String propertyName, Long unitId, String unitNumber, String sourceType, Long sourceId, String sourceReference, String description, BigDecimal debitAmount, BigDecimal creditAmount, BigDecimal balanceAmount, Boolean reconciled) {}
