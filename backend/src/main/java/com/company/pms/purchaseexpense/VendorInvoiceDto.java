package com.company.pms.purchaseexpense;

import java.math.BigDecimal;
import java.time.LocalDate;

public record VendorInvoiceDto(Long id, Long companyId, String invoiceNumber, Long purchaseOrderId, String purchaseOrderNumber, Long vendorId, String vendorName, Long propertyId, String propertyName, Long unitId, String unitNumber, LocalDate invoiceDate, LocalDate dueDate, BigDecimal invoiceAmount, BigDecimal paidAmount, BigDecimal balanceAmount, String paymentStatus, String approvalStatus, String status, String remarks) {
}
