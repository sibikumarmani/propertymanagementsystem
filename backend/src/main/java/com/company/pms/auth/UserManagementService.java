package com.company.pms.auth;

import com.company.pms.company.CompanyEntity;
import com.company.pms.company.CompanyRepository;
import com.company.pms.role.RoleEntity;
import com.company.pms.role.RoleRepository;
import com.company.pms.security.AdminAccess;
import com.company.pms.security.MenuAccessService;
import com.company.pms.security.SecurityContextService;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class UserManagementService {
    private static final String ADMIN_ROLE_NAME = AdminAccess.ADMIN_ROLE;


    private final UserRepository userRepository;
    private final PasswordResetCodeRepository passwordResetCodeRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserRoleRepository userRoleRepository;
    private final UserCompanyRepository userCompanyRepository;
    private final RoleRepository roleRepository;
    private final CompanyRepository companyRepository;
    private final SecurityContextService securityContextService;
    private final UserMenuAccessRepository userMenuAccessRepository;
    private final MenuAccessService menuAccessService;

    public UserManagementService(
        UserRepository userRepository,
        PasswordResetCodeRepository passwordResetCodeRepository,
        PasswordEncoder passwordEncoder,
        UserRoleRepository userRoleRepository,
        UserCompanyRepository userCompanyRepository,
        RoleRepository roleRepository,
        CompanyRepository companyRepository,
        SecurityContextService securityContextService,
        UserMenuAccessRepository userMenuAccessRepository,
        MenuAccessService menuAccessService
    ) {
        this.userRepository = userRepository;
        this.passwordResetCodeRepository = passwordResetCodeRepository;
        this.passwordEncoder = passwordEncoder;
        this.userRoleRepository = userRoleRepository;
        this.userCompanyRepository = userCompanyRepository;
        this.roleRepository = roleRepository;
        this.companyRepository = companyRepository;
        this.securityContextService = securityContextService;
        this.userMenuAccessRepository = userMenuAccessRepository;
        this.menuAccessService = menuAccessService;
    }

    @Transactional(readOnly = true)
    public List<UserManagementDto> getUsers() {
        Set<Long> userIds;
        if (securityContextService.isAdmin()) {
            userIds = userRepository.findAll().stream()
                .map(UserEntity::getId)
                .collect(java.util.stream.Collectors.toCollection(LinkedHashSet::new));
        } else {
            Long activeCompanyId = securityContextService.getCurrentCompanyId();
            userIds = userCompanyRepository.findAllByCompanyIdAndStatusIgnoreCase(activeCompanyId, "ACTIVE").stream()
                .map(UserCompanyEntity::getUserId)
                .collect(java.util.stream.Collectors.toCollection(LinkedHashSet::new));
        }

        return userRepository.findAllById(userIds).stream()
            .sorted(Comparator.comparing(UserEntity::getFullName).thenComparing(UserEntity::getId))
            .map(this::toDto)
            .toList();
    }

    @Transactional
    public UserManagementDto createUser(UserUpsertRequest request) {
        String normalizedEmail = request.email().trim().toLowerCase();
        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email is already registered");
        }

        if (request.password() == null || request.password().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password is required for a new user");
        }

        validateAssignments(request.roleIds(), request.companyIds(), request.defaultCompanyId());
        validateMenuAccessOverrides(request.menuAccessOverrides());

        UserEntity user = userRepository.save(
            UserEntity.builder()
                .userCode("PENDING")
                .email(normalizedEmail)
                .phone(normalizePhone(request.phone()))
                .passwordHash(passwordEncoder.encode(request.password()))
                .fullName(request.fullName().trim())
                .status(normalizeStatus(request.status()))
                .emailVerified(request.emailVerified())
                .avatarImage(normalizeAvatarImage(request.avatarImage()))
                .build()
        );

        user.setUserCode("USR%06d".formatted(user.getId()));
        UserEntity savedUser = userRepository.save(user);
        replaceAssignments(savedUser.getId(), request.roleIds(), request.companyIds(), request.defaultCompanyId());
        replaceMenuAccessOverrides(savedUser.getId(), request.menuAccessOverrides());
        return toDto(savedUser);
    }

    @Transactional
    public UserManagementDto updateUser(Long id, UserUpsertRequest request) {
        UserEntity user = userRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        String normalizedEmail = request.email().trim().toLowerCase();
        userRepository.findByEmailIgnoreCase(normalizedEmail)
            .filter(existing -> !existing.getId().equals(id))
            .ifPresent(existing -> {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Email is already registered");
            });

        validateAssignments(request.roleIds(), request.companyIds(), request.defaultCompanyId());
        validateMenuAccessOverrides(request.menuAccessOverrides());
        validateAdminAccessRetention(user, request);

        user.setFullName(request.fullName().trim());
        user.setEmail(normalizedEmail);
        user.setPhone(normalizePhone(request.phone()));
        user.setStatus(normalizeStatus(request.status()));
        user.setEmailVerified(request.emailVerified());
        user.setAvatarImage(normalizeAvatarImage(request.avatarImage()));

        if (request.password() != null && !request.password().trim().isEmpty()) {
            user.setPasswordHash(passwordEncoder.encode(request.password()));
        }

        UserEntity savedUser = userRepository.save(user);
        replaceAssignments(savedUser.getId(), request.roleIds(), request.companyIds(), request.defaultCompanyId());
        replaceMenuAccessOverrides(savedUser.getId(), request.menuAccessOverrides());
        return toDto(savedUser);
    }

    @Transactional(readOnly = true)
    public UserResetCodeViewDto getLatestResetCode(Long id) {
        UserEntity user = userRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        return passwordResetCodeRepository.findTopByUserIdOrderByIdDesc(id)
            .map(resetCode -> new UserResetCodeViewDto(
                user.getId(),
                user.getUserCode(),
                user.getFullName(),
                user.getEmail(),
                resetCode.getResetCode(),
                resetCode.getExpiresAt(),
                resetCode.getConsumed(),
                true
            ))
            .orElseGet(() -> new UserResetCodeViewDto(
                user.getId(),
                user.getUserCode(),
                user.getFullName(),
                user.getEmail(),
                null,
                null,
                null,
                false
            ));
    }

    private void replaceAssignments(Long userId, List<Long> roleIds, List<Long> companyIds, Long defaultCompanyId) {
        List<Long> distinctRoleIds = roleIds.stream().distinct().toList();
        List<Long> distinctCompanyIds = companyIds.stream().distinct().toList();

        Map<Long, UserRoleEntity> existingRolesByRoleId = userRoleRepository.findAllByUserId(userId).stream()
            .collect(Collectors.toMap(UserRoleEntity::getRoleId, item -> item, (left, right) -> left));
        List<UserRoleEntity> rolesToSave = new ArrayList<>();
        for (Long roleId : distinctRoleIds) {
            UserRoleEntity assignment = existingRolesByRoleId.get(roleId);
            if (assignment == null) {
                assignment = userRoleRepository.findByUserIdAndRoleId(userId, roleId)
                    .orElseGet(() -> UserRoleEntity.builder()
                        .userId(userId)
                        .roleId(roleId)
                        .build());
            }
            rolesToSave.add(assignment);
        }
        List<UserRoleEntity> rolesToDelete = existingRolesByRoleId.entrySet().stream()
            .filter(entry -> !distinctRoleIds.contains(entry.getKey()))
            .map(Map.Entry::getValue)
            .toList();
        if (!rolesToDelete.isEmpty()) {
            userRoleRepository.deleteAll(rolesToDelete);
            userRoleRepository.flush();
        }
        userRoleRepository.saveAll(rolesToSave);

        Map<Long, UserCompanyEntity> existingCompaniesByCompanyId = userCompanyRepository.findAllByUserId(userId).stream()
            .collect(Collectors.toMap(UserCompanyEntity::getCompanyId, item -> item, (left, right) -> left));
        List<UserCompanyEntity> companiesToSave = new ArrayList<>();
        for (Long companyId : distinctCompanyIds) {
            UserCompanyEntity assignment = existingCompaniesByCompanyId.get(companyId);
            if (assignment == null) {
                assignment = userCompanyRepository.findByUserIdAndCompanyId(userId, companyId)
                    .orElseGet(() -> UserCompanyEntity.builder()
                        .userId(userId)
                        .companyId(companyId)
                        .build());
            }
            assignment.setDefaultCompany(companyId.equals(defaultCompanyId));
            assignment.setStatus("ACTIVE");
            companiesToSave.add(assignment);
        }
        List<UserCompanyEntity> companiesToDelete = existingCompaniesByCompanyId.entrySet().stream()
            .filter(entry -> !distinctCompanyIds.contains(entry.getKey()))
            .map(Map.Entry::getValue)
            .toList();
        if (!companiesToDelete.isEmpty()) {
            userCompanyRepository.deleteAll(companiesToDelete);
            userCompanyRepository.flush();
        }
        userCompanyRepository.saveAll(companiesToSave);
    }

    private void validateAssignments(List<Long> roleIds, List<Long> companyIds, Long defaultCompanyId) {
        if (roleIds == null || roleIds.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "At least one role is required");
        }
        if (companyIds == null || companyIds.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "At least one company is required");
        }
        if (!companyIds.contains(defaultCompanyId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Default company must be one of the selected companies");
        }

        List<RoleEntity> roles = roleRepository.findAllById(roleIds);
        if (roles.size() != roleIds.stream().distinct().count()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "One or more roles are invalid");
        }
        if (roles.stream().anyMatch(role -> !role.isActive())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Inactive roles cannot be assigned");
        }

        List<CompanyEntity> companies = companyRepository.findAllById(companyIds);
        if (companies.size() != companyIds.stream().distinct().count()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "One or more companies are invalid");
        }
        if (companies.stream().anyMatch(company -> !company.isActive())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Inactive companies cannot be assigned");
        }
    }

    private void validateMenuAccessOverrides(List<UserMenuAccessOverrideRequest> overrides) {
        if (overrides == null) {
            return;
        }
        menuAccessService.normalizeMenuKeys(overrides.stream().map(UserMenuAccessOverrideRequest::menuKey).toList());
    }

    private void replaceMenuAccessOverrides(Long userId, List<UserMenuAccessOverrideRequest> overrides) {
        userMenuAccessRepository.deleteAllByUserId(userId);
        if (overrides == null || overrides.isEmpty()) {
            return;
        }

        userMenuAccessRepository.saveAll(overrides.stream()
            .map(override -> UserMenuAccessEntity.builder()
                .userId(userId)
                .menuKey(menuAccessService.normalizeMenuKey(override.menuKey()))
                .allowed(Boolean.TRUE.equals(override.allowed()))
                .build())
            .toList());
    }

    private void validateAdminAccessRetention(UserEntity user, UserUpsertRequest request) {
        RoleEntity adminRole = roleRepository.findByRoleNameIgnoreCase(ADMIN_ROLE_NAME).orElse(null);
        if (adminRole == null) {
            return;
        }

        boolean currentlyAdmin = userRoleRepository.findAllByUserId(user.getId()).stream()
            .anyMatch(item -> item.getRoleId().equals(adminRole.getId()));
        if (!currentlyAdmin || !user.isActive()) {
            return;
        }

        boolean remainsAdmin = request.roleIds().stream().distinct().anyMatch(roleId -> roleId.equals(adminRole.getId()));
        boolean remainsActive = "ACTIVE".equalsIgnoreCase(request.status());
        if (remainsAdmin && remainsActive) {
            return;
        }

        long otherActiveAdminUsers = userRoleRepository.findAllByRoleId(adminRole.getId()).stream()
            .map(UserRoleEntity::getUserId)
            .distinct()
            .filter(userId -> !userId.equals(user.getId()))
            .map(userRepository::findById)
            .flatMap(java.util.Optional::stream)
            .filter(UserEntity::isActive)
            .count();

        if (otherActiveAdminUsers == 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "At least one ACTIVE user must remain assigned to the ADMIN role");
        }
    }

    private UserManagementDto toDto(UserEntity user) {
        List<UserRoleEntity> userRoles = userRoleRepository.findAllByUserId(user.getId());
        List<UserCompanyEntity> userCompanies = userCompanyRepository.findAllByUserId(user.getId());
        List<UserMenuAccessEntity> userMenuAccessOverrides = userMenuAccessRepository.findAllByUserId(user.getId());

        Map<Long, RoleEntity> rolesById = roleRepository.findAllById(userRoles.stream().map(UserRoleEntity::getRoleId).toList()).stream()
            .collect(java.util.stream.Collectors.toMap(RoleEntity::getId, role -> role));
        Map<Long, CompanyEntity> companiesById = companyRepository.findAllById(userCompanies.stream().map(UserCompanyEntity::getCompanyId).toList()).stream()
            .collect(java.util.stream.Collectors.toMap(CompanyEntity::getId, company -> company));

        List<RoleAssignmentDto> roles = userRoles.stream()
            .map(item -> rolesById.get(item.getRoleId()))
            .filter(java.util.Objects::nonNull)
            .sorted(Comparator.comparing(RoleEntity::getRoleName))
            .map(role -> new RoleAssignmentDto(role.getId(), role.getRoleName()))
            .toList();

        List<CompanyAssignmentDto> companies = userCompanies.stream()
            .map(item -> {
                CompanyEntity company = companiesById.get(item.getCompanyId());
                if (company == null) {
                    return null;
                }
                return new CompanyAssignmentDto(
                    company.getId(),
                    company.getCompanyName(),
                    company.getCompanyCode(),
                    Boolean.TRUE.equals(item.getDefaultCompany()),
                    item.getStatus()
                );
            })
            .filter(java.util.Objects::nonNull)
            .sorted(Comparator.comparing(CompanyAssignmentDto::companyName))
            .toList();

        Long defaultCompanyId = userCompanies.stream()
            .filter(item -> Boolean.TRUE.equals(item.getDefaultCompany()))
            .map(UserCompanyEntity::getCompanyId)
            .findFirst()
            .orElse(null);
        List<UserMenuAccessOverrideDto> menuAccessOverrides = userMenuAccessOverrides.stream()
            .map(item -> new UserMenuAccessOverrideDto(item.getMenuKey(), Boolean.TRUE.equals(item.getAllowed())))
            .sorted(Comparator.comparing(UserMenuAccessOverrideDto::menuKey))
            .toList();
        List<String> effectiveMenuAccessKeys = menuAccessService.getEffectiveMenuAccessKeys(
            user.getId(),
            userRoles.stream().map(UserRoleEntity::getRoleId).toList()
        );

        return new UserManagementDto(
            user.getId(),
            user.getUserCode(),
            user.getFullName(),
            user.getEmail(),
            user.getPhone(),
            roles,
            companies,
            defaultCompanyId,
            menuAccessOverrides,
            effectiveMenuAccessKeys,
            user.getStatus(),
            user.getEmailVerified(),
            user.getAvatarImage()
        );
    }

    private String normalizeAvatarImage(String avatarImage) {
        if (avatarImage == null) {
            return null;
        }

        String trimmed = avatarImage.trim();
        if (trimmed.isEmpty()) {
            return null;
        }

        if (!trimmed.startsWith("data:image/")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Profile image must be a valid image data URL");
        }

        if (trimmed.length() > 2_000_000) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Profile image is too large");
        }

        return trimmed;
    }

    private String normalizeStatus(String status) {
        String normalized = status == null ? "" : status.trim().toUpperCase();
        if (!normalized.equals("ACTIVE") && !normalized.equals("INACTIVE")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Status must be ACTIVE or INACTIVE");
        }
        return normalized;
    }

    private String normalizePhone(String phone) {
        if (phone == null) {
            return null;
        }
        String trimmed = phone.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
