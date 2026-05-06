package com.company.pms.security;

import com.company.pms.auth.UserMenuAccessEntity;
import com.company.pms.auth.UserMenuAccessRepository;
import com.company.pms.auth.UserRoleEntity;
import com.company.pms.auth.UserRoleRepository;
import com.company.pms.role.RoleEntity;
import com.company.pms.role.RoleMenuAccessEntity;
import com.company.pms.role.RoleMenuAccessRepository;
import com.company.pms.role.RoleRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@Service
public class MenuAccessService {

    private final RoleRepository roleRepository;
    private final RoleMenuAccessRepository roleMenuAccessRepository;
    private final UserMenuAccessRepository userMenuAccessRepository;
    private final UserRoleRepository userRoleRepository;

    public MenuAccessService(
        RoleRepository roleRepository,
        RoleMenuAccessRepository roleMenuAccessRepository,
        UserMenuAccessRepository userMenuAccessRepository,
        UserRoleRepository userRoleRepository
    ) {
        this.roleRepository = roleRepository;
        this.roleMenuAccessRepository = roleMenuAccessRepository;
        this.userMenuAccessRepository = userMenuAccessRepository;
        this.userRoleRepository = userRoleRepository;
    }

    public List<String> normalizeMenuKeys(Collection<String> menuKeys) {
        if (menuKeys == null) {
            return List.of();
        }

        LinkedHashSet<String> normalizedKeys = new LinkedHashSet<>();
        for (String menuKey : menuKeys) {
            String normalized = normalizeMenuKey(menuKey);
            if (!MenuPermission.isValid(normalized)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid menu key: " + menuKey);
            }
            normalizedKeys.add(normalized);
        }
        return List.copyOf(normalizedKeys);
    }

    public String normalizeMenuKey(String menuKey) {
        return menuKey == null ? "" : menuKey.trim().toLowerCase(Locale.ENGLISH);
    }

    public List<String> getRoleMenuAccessKeys(Long roleId, String roleName) {
        if (AdminAccess.ADMIN_ROLE.equalsIgnoreCase(roleName)) {
            return MenuPermission.allMenuKeys();
        }

        return roleMenuAccessRepository.findAllByRoleId(roleId).stream()
            .map(RoleMenuAccessEntity::getMenuKey)
            .map(this::normalizeMenuKey)
            .filter(MenuPermission::isValid)
            .distinct()
            .toList();
    }

    public List<String> getEffectiveMenuAccessKeys(Long userId, List<Long> roleIds) {
        List<RoleEntity> roles = roleRepository.findAllById(roleIds);
        return getEffectiveMenuAccessKeysForRoles(userId, roles);
    }

    public List<String> getEffectiveMenuAccessKeysForRoles(Long userId, List<RoleEntity> roles) {
        LinkedHashSet<String> grantedMenuKeys = new LinkedHashSet<>();

        boolean hasAdminRole = roles.stream().anyMatch(role -> AdminAccess.ADMIN_ROLE.equalsIgnoreCase(role.getRoleName()));
        if (hasAdminRole) {
            grantedMenuKeys.addAll(MenuPermission.allMenuKeys());
        } else {
            List<Long> activeRoleIds = roles.stream()
                .filter(RoleEntity::isActive)
                .map(RoleEntity::getId)
                .toList();
            grantedMenuKeys.addAll(roleMenuAccessRepository.findAllByRoleIdIn(activeRoleIds).stream()
                .map(RoleMenuAccessEntity::getMenuKey)
                .map(this::normalizeMenuKey)
                .filter(MenuPermission::isValid)
                .toList());
        }

        Map<String, Boolean> overridesByMenuKey = new LinkedHashMap<>();
        for (UserMenuAccessEntity override : userMenuAccessRepository.findAllByUserId(userId)) {
            String normalizedMenuKey = normalizeMenuKey(override.getMenuKey());
            if (MenuPermission.isValid(normalizedMenuKey)) {
                overridesByMenuKey.put(normalizedMenuKey, Boolean.TRUE.equals(override.getAllowed()));
            }
        }

        for (Map.Entry<String, Boolean> entry : overridesByMenuKey.entrySet()) {
            if (entry.getValue()) {
                grantedMenuKeys.add(entry.getKey());
            } else {
                grantedMenuKeys.remove(entry.getKey());
            }
        }

        return MenuPermission.allMenuKeys().stream()
            .filter(grantedMenuKeys::contains)
            .toList();
    }

    public boolean hasMenuAccess(Long userId, String menuKey) {
        String normalized = normalizeMenuKey(menuKey);
        List<Long> roleIds = userRoleRepository.findAllByUserId(userId).stream()
            .map(UserRoleEntity::getRoleId)
            .toList();
        return getEffectiveMenuAccessKeys(userId, roleIds).contains(normalized);
    }
}
