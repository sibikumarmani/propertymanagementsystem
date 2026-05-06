package com.company.pms.company;

import jakarta.validation.constraints.NotBlank;

public record CompanyUpsertRequest(
    @NotBlank String companyName,
    String companyCode,
    String email,
    String phone,
    String address,
    String city,
    String state,
    String country,
    String postalCode,
    String gstNumber,
    String taxNumber,
    boolean defaultCompany,
    @NotBlank String status
) {
}
