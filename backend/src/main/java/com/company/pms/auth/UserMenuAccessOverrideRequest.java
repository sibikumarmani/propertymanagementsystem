package com.company.pms.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record UserMenuAccessOverrideRequest(
    @NotBlank String menuKey,
    @NotNull Boolean allowed
) {
}
