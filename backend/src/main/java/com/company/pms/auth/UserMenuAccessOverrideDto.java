package com.company.pms.auth;

public record UserMenuAccessOverrideDto(
    String menuKey,
    boolean allowed
) {
}
