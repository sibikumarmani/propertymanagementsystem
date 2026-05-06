package com.company.pms.purchaseexpense;

import java.math.BigDecimal;
import java.time.LocalDate;

public record PropertyExpenseDto(Long id, Long companyId, String expenseNumber, Long vendorInvoiceId, String invoiceNumber, Long vendorId, String vendorName, Long propertyId, String propertyName, Long unitId, String unitNumber, LocalDate expenseDate, String expenseType, BigDecimal amount, String description, String approvalStatus, String paymentStatus, String status) {
}
