package com.company.pms.role;

public record RoleDto(
    Long id,
    String roleName,
    String description,
    Boolean defaultRole,
    String status,
    java.util.List<String> menuAccessKeys
) {
}
