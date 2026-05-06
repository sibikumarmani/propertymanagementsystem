package com.company.pms.auth;

public record UserManagementDto(
    Long id,
    String userCode,
    String fullName,
    String email,
    String phone,
    java.util.List<RoleAssignmentDto> roles,
    java.util.List<CompanyAssignmentDto> companies,
    Long defaultCompanyId,
    java.util.List<UserMenuAccessOverrideDto> menuAccessOverrides,
    java.util.List<String> effectiveMenuAccessKeys,
    String status,
    Boolean emailVerified,
    String avatarImage
) {
}
