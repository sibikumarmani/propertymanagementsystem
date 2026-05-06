package com.company.pms.security;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class SecurityContextService {

    public AuthenticatedUser getCurrentAuthenticatedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof AuthenticatedUser authenticatedUser)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User is not authenticated");
        }
        return authenticatedUser;
    }

    public Long getCurrentCompanyId() {
        return getCurrentAuthenticatedUser().companyId();
    }

    public boolean isAdmin() {
        return getCurrentAuthenticatedUser().roles().stream()
            .anyMatch(role -> AdminAccess.ADMIN_ROLE.equalsIgnoreCase(role));
    }
}
