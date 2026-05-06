package com.company.pms.auth;

public record AccountProfileDto(
    Long id,
    String userCode,
    String fullName,
    String email,
    String phone,
    java.util.List<String> roles,
    java.util.List<String> menuAccessKeys,
    AuthResponse.CompanySelection activeCompany,
    String avatarImage
) {
}
