package com.company.pms.security;

import org.springframework.stereotype.Component;

@Component("menuAccessGuard")
public class MenuAccessGuard {

    private final SecurityContextService securityContextService;
    private final MenuAccessService menuAccessService;

    public MenuAccessGuard(SecurityContextService securityContextService, MenuAccessService menuAccessService) {
        this.securityContextService = securityContextService;
        this.menuAccessService = menuAccessService;
    }

    public boolean hasAccess(String menuKey) {
        return menuAccessService.hasMenuAccess(securityContextService.getCurrentAuthenticatedUser().userId(), menuKey);
    }
}
