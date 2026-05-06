package com.company.pms.security;

import java.util.List;

public record AuthenticatedUser(
    Long userId,
    String email,
    List<String> roles,
    List<String> menuAccessKeys,
    Long companyId,
    String companyName
) {
}
