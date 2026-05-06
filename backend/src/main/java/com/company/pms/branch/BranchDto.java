package com.company.pms.branch;

public record BranchDto(
    Long id,
    Long companyId,
    String companyName,
    String companyCode,
    String branchName,
    String branchCode,
    String address,
    String city,
    String state,
    String country,
    String postalCode,
    String status
) {
}
