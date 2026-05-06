package com.company.pms.role;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class RoleService {
    private static final String ADMIN_ROLE_NAME = "ADMIN";

    private final RoleRepository roleRepository;
    private final RoleMenuAccessRepository roleMenuAccessRepository;
    private final com.company.pms.security.MenuAccessService menuAccessService;

    public RoleService(
        RoleRepository roleRepository,
        RoleMenuAccessRepository roleMenuAccessRepository,
        com.company.pms.security.MenuAccessService menuAccessService
    ) {
        this.roleRepository = roleRepository;
        this.roleMenuAccessRepository = roleMenuAccessRepository;
        this.menuAccessService = menuAccessService;
    }

    @Transactional(readOnly = true)
    public List<RoleDto> getRoles() {
        return roleRepository.findAllByOrderByRoleNameAsc().stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public RoleDto getRole(Long id) {
        return roleRepository.findById(id).map(this::toDto)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Role not found"));
    }

    @Transactional
    public RoleDto createRole(RoleUpsertRequest request) {
        String roleName = normalizeRoleName(request.roleName());
        if (roleRepository.existsByRoleNameIgnoreCase(roleName)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Role name already exists");
        }

        String normalizedStatus = normalizeStatus(request.status());
        validateProtectedAdminRole(roleName, request.defaultRole(), normalizedStatus);
        validateDefaultRoleSelection(request.defaultRole(), normalizedStatus);
        if (request.defaultRole()) {
            roleRepository.clearDefaultRoleForOthers(-1L);
        }

        RoleEntity saved = roleRepository.save(RoleEntity.builder()
            .roleName(roleName)
            .description(normalizeText(request.description()))
            .defaultRole(request.defaultRole())
            .status(normalizedStatus)
            .build());
        replaceMenuAccess(saved, request.menuAccessKeys());
        return toDto(saved);
    }

    @Transactional
    public RoleDto updateRole(Long id, RoleUpsertRequest request) {
        RoleEntity role = roleRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Role not found"));
        String roleName = normalizeRoleName(request.roleName());
        if (roleRepository.existsByRoleNameIgnoreCaseAndIdNot(roleName, id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Role name already exists");
        }
        String normalizedStatus = normalizeStatus(request.status());
        validateProtectedAdminRoleUpdate(role, roleName, request.defaultRole(), normalizedStatus);
        validateDefaultRoleSelection(request.defaultRole(), normalizedStatus);
        if (request.defaultRole()) {
            roleRepository.clearDefaultRoleForOthers(id);
        }
        role.setRoleName(roleName);
        role.setDescription(normalizeText(request.description()));
        role.setDefaultRole(request.defaultRole());
        role.setStatus(normalizedStatus);
        RoleEntity saved = roleRepository.save(role);
        replaceMenuAccess(saved, request.menuAccessKeys());
        return toDto(saved);
    }

    @Transactional
    public void deleteRole(Long id) {
        RoleEntity role = roleRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Role not found"));
        if (ADMIN_ROLE_NAME.equalsIgnoreCase(role.getRoleName())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ADMIN role is protected and cannot be deleted");
        }
        roleRepository.deleteById(id);
    }

    private RoleDto toDto(RoleEntity role) {
        return new RoleDto(
            role.getId(),
            role.getRoleName(),
            role.getDescription(),
            role.getDefaultRole(),
            role.getStatus(),
            menuAccessService.getRoleMenuAccessKeys(role.getId(), role.getRoleName())
        );
    }

    private void replaceMenuAccess(RoleEntity role, List<String> requestedMenuAccessKeys) {
        List<String> normalizedMenuKeys = ADMIN_ROLE_NAME.equalsIgnoreCase(role.getRoleName())
            ? com.company.pms.security.MenuPermission.allMenuKeys()
            : menuAccessService.normalizeMenuKeys(requestedMenuAccessKeys);

        Set<String> requestedKeys = new LinkedHashSet<>(normalizedMenuKeys);
        List<RoleMenuAccessEntity> existingAccess = roleMenuAccessRepository.findAllByRoleId(role.getId());
        Set<String> existingKeys = existingAccess.stream()
            .map(RoleMenuAccessEntity::getMenuKey)
            .map(menuAccessService::normalizeMenuKey)
            .collect(Collectors.toCollection(LinkedHashSet::new));

        List<RoleMenuAccessEntity> accessToRemove = existingAccess.stream()
            .filter(access -> !requestedKeys.contains(menuAccessService.normalizeMenuKey(access.getMenuKey())))
            .toList();
        if (!accessToRemove.isEmpty()) {
            roleMenuAccessRepository.deleteAll(accessToRemove);
        }

        List<RoleMenuAccessEntity> accessToAdd = requestedKeys.stream()
            .filter(menuKey -> !existingKeys.contains(menuKey))
            .map(menuKey -> RoleMenuAccessEntity.builder()
                .roleId(role.getId())
                .menuKey(menuKey)
                .build())
            .toList();
        if (!accessToAdd.isEmpty()) {
            roleMenuAccessRepository.saveAll(accessToAdd);
        }
    }

    private String normalizeRoleName(String roleName) {
        String normalized = roleName == null ? "" : roleName.trim().toUpperCase();
        if (normalized.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Role name is required");
        }
        return normalized;
    }

    private String normalizeStatus(String status) {
        String normalized = status == null ? "" : status.trim().toUpperCase();
        if (!normalized.equals("ACTIVE") && !normalized.equals("INACTIVE")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Status must be ACTIVE or INACTIVE");
        }
        return normalized;
    }

    private String normalizeText(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private void validateDefaultRoleSelection(boolean isDefaultRole, String normalizedStatus) {
        if (isDefaultRole && !"ACTIVE".equals(normalizedStatus)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Default role must be ACTIVE");
        }
    }

    private void validateProtectedAdminRole(String roleName, boolean isDefaultRole, String normalizedStatus) {
        if (!ADMIN_ROLE_NAME.equals(roleName)) {
            return;
        }
        if (isDefaultRole) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ADMIN role cannot be the default self-registration role");
        }
        if (!"ACTIVE".equals(normalizedStatus)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ADMIN role must remain ACTIVE");
        }
    }

    private void validateProtectedAdminRoleUpdate(RoleEntity existingRole, String requestedRoleName, boolean isDefaultRole, String normalizedStatus) {
        if (!ADMIN_ROLE_NAME.equalsIgnoreCase(existingRole.getRoleName())) {
            validateProtectedAdminRole(requestedRoleName, isDefaultRole, normalizedStatus);
            return;
        }

        if (!ADMIN_ROLE_NAME.equals(requestedRoleName)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ADMIN role name cannot be changed");
        }
        if (isDefaultRole) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ADMIN role cannot be the default self-registration role");
        }
        if (!"ACTIVE".equals(normalizedStatus)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ADMIN role must remain ACTIVE");
        }
    }
}
