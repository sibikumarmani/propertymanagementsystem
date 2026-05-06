package com.company.pms.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public record UserUpsertRequest(
    @NotBlank String fullName,
    @NotBlank @Email String email,
    String phone,
    @Size(min = 8, message = "Password must be at least 8 characters") String password,
    @NotBlank String status,
    @NotNull Boolean emailVerified,
    String avatarImage,
    @NotEmpty List<Long> roleIds,
    @NotEmpty List<Long> companyIds,
    @NotNull Long defaultCompanyId,
    List<UserMenuAccessOverrideRequest> menuAccessOverrides
) {
}
