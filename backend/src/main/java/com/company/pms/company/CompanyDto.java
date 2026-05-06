package com.company.pms.company;

public record CompanyDto(
    Long id,
    String companyName,
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
    Boolean defaultCompany,
    String status
) {
}
