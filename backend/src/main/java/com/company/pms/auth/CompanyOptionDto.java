package com.company.pms.auth;

public record CompanyOptionDto(
    Long id,
    String companyName,
    String companyCode,
    boolean defaultCompany
) {
}
