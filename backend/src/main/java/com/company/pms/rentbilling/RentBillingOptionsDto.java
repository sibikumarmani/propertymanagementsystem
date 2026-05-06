package com.company.pms.rentbilling;

import java.util.List;

public record RentBillingOptionsDto(
    List<String> scheduleStatuses,
    List<String> invoiceStatuses,
    List<String> invoiceTypes,
    List<String> paymentModes
) {
}
