package com.company.pms.vendor;

import java.math.BigDecimal;

public record VendorDto(
    Long id,
    Long companyId,
    String companyName,
    String companyCode,
    String vendorCode,
    String vendorName,
    String contactPerson,
    String phone,
    String email,
    String address,
    String serviceCategory,
    String taxNumber,
    String bankDetails,
    String contractStatus,
    String insuranceDetails,
    BigDecimal rating,
    String vendorStatus,
    String assignmentStage
) {
}
