package com.company.pms.auth;

import java.util.List;

public record AuthResponse(
    String accessToken,
    String refreshToken,
    String tokenType,
    boolean companySelectionRequired,
    String companySelectionToken,
    List<CompanyOptionDto> availableCompanies,
    UserProfile user
) {
    public record UserProfile(
        Long id,
        String userCode,
        String fullName,
        String email,
        String phone,
        List<String> roles,
        List<String> menuAccessKeys,
        CompanySelection activeCompany,
        String avatarImage
    ) {
    }

    public record CompanySelection(Long id, String companyName, String companyCode) {
    }
}
