package com.company.pms.vendor;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

import java.math.BigDecimal;

public record VendorUpsertRequest(
    @NotBlank String vendorCode,
    @NotBlank String vendorName,
    String contactPerson,
    @NotBlank String phone,
    @Email String email,
    String address,
    String serviceCategory,
    String taxNumber,
    String bankDetails,
    @NotBlank String contractStatus,
    String insuranceDetails,
    BigDecimal rating,
    @NotBlank String vendorStatus,
    @NotBlank String assignmentStage
) {
}
