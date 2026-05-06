package com.company.pms.purchaseexpense;

import java.util.List;

public record PurchaseExpenseOptionsDto(List<String> expenseTypes, List<String> requestStatuses, List<String> orderStatuses, List<String> invoiceStatuses, List<String> expenseStatuses, List<String> approvalStatuses, List<String> paymentStatuses) {
}
