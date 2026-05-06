package com.company.pms.auth;

public record CompanyAssignmentDto(
    Long id,
    String companyName,
    String companyCode,
    boolean defaultCompany,
    String status
) {
}
