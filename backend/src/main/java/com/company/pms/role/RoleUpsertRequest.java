package com.company.pms.role;

import jakarta.validation.constraints.NotBlank;

import java.util.List;

public record RoleUpsertRequest(
    @NotBlank String roleName,
    String description,
    boolean defaultRole,
    @NotBlank String status,
    List<String> menuAccessKeys
) {
}
