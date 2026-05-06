package com.company.pms.auth;

import com.company.pms.company.CompanyEntity;
import com.company.pms.company.CompanyRepository;
import com.company.pms.notification.EmailSenderService;
import com.company.pms.role.RoleEntity;
import com.company.pms.role.RoleRepository;
import com.company.pms.security.AdminAccess;
import com.company.pms.security.JwtService;
import com.company.pms.security.MenuAccessService;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final EmailVerificationRepository emailVerificationRepository;
    private final PasswordResetCodeRepository passwordResetCodeRepository;
    private final UserRoleRepository userRoleRepository;
    private final UserCompanyRepository userCompanyRepository;
    private final RoleRepository roleRepository;
    private final CompanyRepository companyRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final MenuAccessService menuAccessService;
    private final EmailSenderService emailSenderService;
    private final long verificationCodeExpirationMinutes;
    private final boolean exposeVerificationCodeInResponse;

    public AuthService(
        UserRepository userRepository,
        RefreshTokenRepository refreshTokenRepository,
        EmailVerificationRepository emailVerificationRepository,
        PasswordResetCodeRepository passwordResetCodeRepository,
        UserRoleRepository userRoleRepository,
        UserCompanyRepository userCompanyRepository,
        RoleRepository roleRepository,
        CompanyRepository companyRepository,
        PasswordEncoder passwordEncoder,
        JwtService jwtService,
        MenuAccessService menuAccessService,
        EmailSenderService emailSenderService,
        @org.springframework.beans.factory.annotation.Value("${app.verification.code-expiration-minutes}") long verificationCodeExpirationMinutes,
        @org.springframework.beans.factory.annotation.Value("${app.verification.expose-code-in-response:false}") boolean exposeVerificationCodeInResponse
    ) {
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.emailVerificationRepository = emailVerificationRepository;
        this.passwordResetCodeRepository = passwordResetCodeRepository;
        this.userRoleRepository = userRoleRepository;
        this.userCompanyRepository = userCompanyRepository;
        this.roleRepository = roleRepository;
        this.companyRepository = companyRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.menuAccessService = menuAccessService;
        this.emailSenderService = emailSenderService;
        this.verificationCodeExpirationMinutes = verificationCodeExpirationMinutes;
        this.exposeVerificationCodeInResponse = exposeVerificationCodeInResponse;
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        UserEntity user = userRepository.findByEmailIgnoreCase(request.email().trim().toLowerCase())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));

        if (!Boolean.TRUE.equals(user.getEmailVerified())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Email is not verified");
        }

        if (!user.isActive()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User account is inactive");
        }

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }

        return buildLoginResponse(user);
    }

    @Transactional
    public RegistrationResponse register(RegisterRequest request) {
        String normalizedEmail = request.email().trim().toLowerCase();
        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email is already registered");
        }

        RoleEntity defaultRole = roleRepository.findByDefaultRoleTrueAndStatusIgnoreCase("ACTIVE")
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "No active default role is configured"));
        CompanyEntity defaultCompany = companyRepository.findByDefaultCompanyTrueAndStatusIgnoreCase("ACTIVE")
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "No active default company is configured"));

        UserEntity user = userRepository.save(
            UserEntity.builder()
                .userCode("PENDING")
                .email(normalizedEmail)
                .passwordHash(passwordEncoder.encode(request.password()))
                .fullName(request.fullName().trim())
                .status("INACTIVE")
                .emailVerified(false)
                .build()
        );

        user.setUserCode("USR%06d".formatted(user.getId()));
        user = userRepository.save(user);

        userRoleRepository.save(UserRoleEntity.builder()
            .userId(user.getId())
            .roleId(defaultRole.getId())
            .build());
        userCompanyRepository.save(UserCompanyEntity.builder()
            .userId(user.getId())
            .companyId(defaultCompany.getId())
            .defaultCompany(true)
            .status("ACTIVE")
            .build());

        VerificationDispatchResponse verificationDispatch = generateAndSendVerificationCode(user);

        return new RegistrationResponse(user.getId(), user.getUserCode(), user.getEmail(), verificationDispatch.message(), verificationDispatch.verificationCode());
    }

    @Transactional
    public AuthResponse verifyEmail(VerifyEmailRequest request) {
        String normalizedEmail = request.email().trim().toLowerCase();
        UserEntity user = userRepository.findByEmailIgnoreCase(normalizedEmail)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        EmailVerificationEntity verification = emailVerificationRepository
            .findTopByEmailAndVerificationCodeAndConsumedFalseOrderByIdDesc(normalizedEmail, request.code())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid verification code"));

        if (verification.getExpiresAt().isBefore(Instant.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Verification code expired");
        }

        verification.setConsumed(true);
        emailVerificationRepository.save(verification);

        user.setEmailVerified(true);
        if ("INACTIVE".equalsIgnoreCase(user.getStatus())) {
            user.setStatus("ACTIVE");
        }
        userRepository.save(user);

        return new AuthResponse(
            null,
            null,
            "Bearer",
            false,
            null,
            List.of(),
            toUserProfile(user, loadRoleNames(user.getId()), null)
        );
    }

    @Transactional
    public VerificationDispatchResponse resendVerificationCode(ResendVerificationCodeRequest request) {
        String normalizedEmail = request.email().trim().toLowerCase();
        UserEntity user = userRepository.findByEmailIgnoreCase(normalizedEmail)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if (Boolean.TRUE.equals(user.getEmailVerified())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email is already verified");
        }

        return generateAndSendVerificationCode(user);
    }

    @Transactional(readOnly = true)
    public VerificationStatusResponse verificationStatus(VerificationStatusRequest request) {
        String normalizedEmail = request.email().trim().toLowerCase();
        return userRepository.findByEmailIgnoreCase(normalizedEmail)
            .map(user -> new VerificationStatusResponse(
                user.getEmail(),
                true,
                Boolean.TRUE.equals(user.getEmailVerified()),
                user.isActive()
            ))
            .orElseGet(() -> new VerificationStatusResponse(normalizedEmail, false, false, false));
    }

    @Transactional
    public PasswordResetDispatchResponse forgotPassword(ForgotPasswordRequest request) {
        String normalizedEmail = request.email().trim().toLowerCase();
        UserEntity user = userRepository.findByEmailIgnoreCase(normalizedEmail)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        return generateAndSendPasswordResetCode(user);
    }

    @Transactional
    public PasswordResetDispatchResponse resetPassword(ResetPasswordRequest request) {
        String normalizedEmail = request.email().trim().toLowerCase();
        UserEntity user = userRepository.findByEmailIgnoreCase(normalizedEmail)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        PasswordResetCodeEntity resetCode = passwordResetCodeRepository
            .findTopByEmailAndResetCodeAndConsumedFalseOrderByIdDesc(normalizedEmail, request.code())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid reset code"));

        if (resetCode.getExpiresAt().isBefore(Instant.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Reset code expired");
        }

        resetCode.setConsumed(true);
        passwordResetCodeRepository.save(resetCode);

        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);

        return new PasswordResetDispatchResponse(user.getEmail(), "Password reset successful. You can now sign in with your new password.", null);
    }

    @Transactional
    public AuthResponse refresh(RefreshTokenRequest request) {
        RefreshTokenEntity refreshToken = refreshTokenRepository.findByTokenAndRevokedFalse(request.refreshToken())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid refresh token"));

        if (refreshToken.getExpiresAt().isBefore(Instant.now())) {
            refreshToken.setRevoked(true);
            refreshTokenRepository.save(refreshToken);
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Refresh token expired");
        }

        UserEntity user = userRepository.findById(refreshToken.getUserId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));

        refreshToken.setRevoked(true);
        refreshTokenRepository.save(refreshToken);

        List<String> roles = jwtService.extractRoles(request.refreshToken());
        Long companyId = jwtService.extractCompanyId(request.refreshToken());
        CompanyEntity company = companyRepository.findById(companyId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Company not found"));

        return issueTokens(user, roles, company);
    }

    @Transactional
    public AuthResponse selectCompany(SelectCompanyRequest request) {
        if (!jwtService.isTokenValid(request.selectionToken()) || !jwtService.isCompanySelectionToken(request.selectionToken())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Company selection token is invalid or expired");
        }

        Long userId = jwtService.extractUserId(request.selectionToken());
        UserEntity user = userRepository.findById(userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
        List<String> roles = loadRoleNames(userId);
        boolean isAdmin = roles.stream().anyMatch(role -> AdminAccess.ADMIN_ROLE.equalsIgnoreCase(role));

        if (!user.isActive()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User account is inactive");
        }

        List<Long> allowedCompanyIds = jwtService.extractAllowedCompanyIds(request.selectionToken());
        if (!allowedCompanyIds.contains(request.companyId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Selected company is not assigned to this user");
        }

        CompanyEntity company = companyRepository.findById(request.companyId())
            .filter(CompanyEntity::isActive)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Selected company is inactive or unavailable"));

        if (!isAdmin) {
            userCompanyRepository.findByUserIdAndCompanyIdAndStatusIgnoreCase(userId, request.companyId(), "ACTIVE")
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Selected company is inactive or unavailable"));
        }

        return issueTokens(user, roles, company);
    }

    private AuthResponse buildLoginResponse(UserEntity user) {
        List<String> roles = loadRoleNames(user.getId());
        boolean isAdmin = roles.stream().anyMatch(role -> AdminAccess.ADMIN_ROLE.equalsIgnoreCase(role));
        List<CompanyOptionDto> companyOptions = isAdmin
            ? companyRepository.findAllByOrderByCompanyNameAsc().stream()
                .filter(CompanyEntity::isActive)
                .map(company -> new CompanyOptionDto(
                    company.getId(),
                    company.getCompanyName(),
                    company.getCompanyCode(),
                    Boolean.TRUE.equals(company.getDefaultCompany())
                ))
                .toList()
            : buildAssignedCompanyOptions(user.getId());

        if (companyOptions.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, isAdmin
                ? "No active company is available"
                : "No active company assigned to this user");
        }

        if (companyOptions.size() == 1) {
            CompanyEntity company = companyRepository.findById(companyOptions.get(0).id())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Company not found"));
            return issueTokens(user, roles, company);
        }

        String selectionToken = jwtService.generateCompanySelectionToken(
            user.getId(),
            user.getEmail(),
            roles,
            companyOptions.stream().map(CompanyOptionDto::id).toList()
        );

        return new AuthResponse(
            null,
            null,
            "Bearer",
            true,
            selectionToken,
            companyOptions,
            toUserProfile(user, roles, null)
        );
    }

    private List<CompanyOptionDto> buildAssignedCompanyOptions(Long userId) {
        List<UserCompanyEntity> activeAssignments = userCompanyRepository.findAllByUserId(userId).stream()
            .filter(UserCompanyEntity::isActive)
            .toList();

        if (activeAssignments.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No company assigned to this user");
        }

        Map<Long, CompanyEntity> companiesById = companyRepository.findAllById(
            activeAssignments.stream().map(UserCompanyEntity::getCompanyId).toList()
        ).stream().collect(Collectors.toMap(CompanyEntity::getId, company -> company));

        return activeAssignments.stream()
            .map(assignment -> {
                CompanyEntity company = companiesById.get(assignment.getCompanyId());
                if (company == null || !company.isActive()) {
                    return null;
                }
                return new CompanyOptionDto(
                    company.getId(),
                    company.getCompanyName(),
                    company.getCompanyCode(),
                    Boolean.TRUE.equals(assignment.getDefaultCompany())
                );
            })
            .filter(java.util.Objects::nonNull)
            .sorted(Comparator.comparing(CompanyOptionDto::companyName))
            .toList();
    }

    private AuthResponse issueTokens(UserEntity user, List<String> roles, CompanyEntity company) {
        List<String> menuAccessKeys = loadEffectiveMenuAccessKeys(user.getId());
        String accessToken = jwtService.generateAccessToken(user.getId(), user.getEmail(), roles, menuAccessKeys, company.getId(), company.getCompanyName());
        String refreshTokenValue = jwtService.generateRefreshToken(user.getId(), user.getEmail(), roles, menuAccessKeys, company.getId(), company.getCompanyName());

        refreshTokenRepository.save(
            RefreshTokenEntity.builder()
                .userId(user.getId())
                .token(refreshTokenValue)
                .expiresAt(Instant.now().plusMillis(jwtService.getRefreshTokenExpirationMs()))
                .revoked(false)
                .build()
        );

        return new AuthResponse(
            accessToken,
            refreshTokenValue,
            "Bearer",
            false,
            null,
            List.of(),
            toUserProfile(
                user,
                roles,
                new AuthResponse.CompanySelection(company.getId(), company.getCompanyName(), company.getCompanyCode())
            )
        );
    }

    private AuthResponse.UserProfile toUserProfile(
        UserEntity user,
        List<String> roles,
        AuthResponse.CompanySelection activeCompany
    ) {
        return new AuthResponse.UserProfile(
            user.getId(),
            user.getUserCode(),
            user.getFullName(),
            user.getEmail(),
            user.getPhone(),
            roles,
            loadEffectiveMenuAccessKeys(user.getId()),
            activeCompany,
            user.getAvatarImage()
        );
    }

    private List<String> loadRoleNames(Long userId) {
        List<Long> roleIds = userRoleRepository.findAllByUserId(userId).stream()
            .map(UserRoleEntity::getRoleId)
            .toList();
        if (roleIds.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No role assigned to this user");
        }

        return roleRepository.findAllById(roleIds).stream()
            .filter(RoleEntity::isActive)
            .map(RoleEntity::getRoleName)
            .sorted()
            .toList();
    }

    private List<String> loadEffectiveMenuAccessKeys(Long userId) {
        List<Long> roleIds = userRoleRepository.findAllByUserId(userId).stream()
            .map(UserRoleEntity::getRoleId)
            .toList();
        return menuAccessService.getEffectiveMenuAccessKeys(userId, roleIds);
    }

    private VerificationDispatchResponse generateAndSendVerificationCode(UserEntity user) {
        for (EmailVerificationEntity existingVerification : emailVerificationRepository.findAllByEmailAndConsumedFalse(user.getEmail())) {
            existingVerification.setConsumed(true);
        }

        String verificationCode = "%06d".formatted(ThreadLocalRandom.current().nextInt(0, 1_000_000));
        emailVerificationRepository.save(
            EmailVerificationEntity.builder()
                .userId(user.getId())
                .email(user.getEmail())
                .verificationCode(verificationCode)
                .expiresAt(Instant.now().plusSeconds(verificationCodeExpirationMinutes * 60))
                .consumed(false)
                .build()
        );

        EmailSenderService.DeliveryResult deliveryResult =
            emailSenderService.sendVerificationCode(user.getEmail(), user.getFullName(), verificationCode);

        return new VerificationDispatchResponse(
            user.getEmail(),
            deliveryResult.message(),
            exposeVerificationCodeInResponse && !deliveryResult.delivered() ? deliveryResult.verificationCode() : null
        );
    }

    private PasswordResetDispatchResponse generateAndSendPasswordResetCode(UserEntity user) {
        for (PasswordResetCodeEntity existingResetCode : passwordResetCodeRepository.findAllByEmailAndConsumedFalse(user.getEmail())) {
            existingResetCode.setConsumed(true);
        }

        String resetCode = "%06d".formatted(ThreadLocalRandom.current().nextInt(0, 1_000_000));
        passwordResetCodeRepository.save(
            PasswordResetCodeEntity.builder()
                .userId(user.getId())
                .email(user.getEmail())
                .resetCode(resetCode)
                .expiresAt(Instant.now().plusSeconds(verificationCodeExpirationMinutes * 60))
                .consumed(false)
                .build()
        );

        EmailSenderService.DeliveryResult deliveryResult =
            emailSenderService.sendPasswordResetCode(user.getEmail(), user.getFullName(), resetCode);

        return new PasswordResetDispatchResponse(
            user.getEmail(),
            deliveryResult.message(),
            exposeVerificationCodeInResponse && !deliveryResult.delivered() ? deliveryResult.verificationCode() : null
        );
    }
}
