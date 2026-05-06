package com.company.pms.auth;

import com.company.pms.company.CompanyEntity;
import com.company.pms.company.CompanyRepository;
import com.company.pms.security.MenuAccessService;
import com.company.pms.security.AuthenticatedUser;
import com.company.pms.security.SecurityContextService;
import com.company.pms.role.RoleEntity;
import com.company.pms.role.RoleRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Comparator;
import java.util.List;

@Service
public class AccountService {

    private final UserRepository userRepository;
    private final UserRoleRepository userRoleRepository;
    private final UserCompanyRepository userCompanyRepository;
    private final RoleRepository roleRepository;
    private final CompanyRepository companyRepository;
    private final SecurityContextService securityContextService;
    private final MenuAccessService menuAccessService;
    private final PasswordEncoder passwordEncoder;

    public AccountService(
        UserRepository userRepository,
        UserRoleRepository userRoleRepository,
        UserCompanyRepository userCompanyRepository,
        RoleRepository roleRepository,
        CompanyRepository companyRepository,
        SecurityContextService securityContextService,
        MenuAccessService menuAccessService,
        PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.userRoleRepository = userRoleRepository;
        this.userCompanyRepository = userCompanyRepository;
        this.roleRepository = roleRepository;
        this.companyRepository = companyRepository;
        this.securityContextService = securityContextService;
        this.menuAccessService = menuAccessService;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public AccountProfileDto getCurrentProfile() {
        return toProfileDto(getCurrentUser(), securityContextService.getCurrentAuthenticatedUser());
    }

    @Transactional
    public AccountProfileDto updateCurrentProfile(UpdateProfileRequest request) {
        UserEntity user = getCurrentUser();
        user.setFullName(request.fullName().trim());
        user.setAvatarImage(normalizeAvatarImage(request.avatarImage()));
        return toProfileDto(userRepository.save(user), securityContextService.getCurrentAuthenticatedUser());
    }

    @Transactional
    public void changePassword(ChangePasswordRequest request) {
        UserEntity user = getCurrentUser();

        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Current password is incorrect");
        }

        if (passwordEncoder.matches(request.newPassword(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "New password must be different from the current password");
        }

        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
    }

    private UserEntity getCurrentUser() {
        AuthenticatedUser authenticatedUser = securityContextService.getCurrentAuthenticatedUser();
        return userRepository.findByEmailIgnoreCase(authenticatedUser.email())
            .filter(UserEntity::isActive)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
    }

    private AccountProfileDto toProfileDto(UserEntity user, AuthenticatedUser authenticatedUser) {
        List<Long> roleIds = userRoleRepository.findAllByUserId(user.getId()).stream()
            .map(UserRoleEntity::getRoleId)
            .toList();
        List<String> roles = roleRepository.findAllById(roleIds).stream()
            .sorted(Comparator.comparing(RoleEntity::getRoleName))
            .map(RoleEntity::getRoleName)
            .toList();
        CompanyEntity company = companyRepository.findById(authenticatedUser.companyId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Active company not found"));

        return new AccountProfileDto(
            user.getId(),
            user.getUserCode(),
            user.getFullName(),
            user.getEmail(),
            user.getPhone(),
            roles,
            menuAccessService.getEffectiveMenuAccessKeys(user.getId(), roleIds),
            new AuthResponse.CompanySelection(company.getId(), company.getCompanyName(), company.getCompanyCode()),
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
}
