package com.saas.platform.service;

import com.saas.platform.dto.LoginRequest;
import com.saas.platform.dto.LoginResponse;
import com.saas.platform.dto.ResetPasswordRequest;
import com.saas.platform.dto.TenantSwitchRequest;
import com.saas.platform.dto.TenantSwitchResponse;
import com.saas.platform.dto.AcceptInviteRequest;
import com.saas.platform.entity.Tenant;
import com.saas.platform.entity.User;
import java.util.Locale;
import com.saas.platform.entity.UserTenant;
import com.saas.platform.entity.InvitationToken;
import com.saas.platform.repository.RolePermissionRepository;
import com.saas.platform.repository.TenantRepository;
import com.saas.platform.repository.UserRepository;
import com.saas.platform.repository.UserTenantRepository;
import com.saas.platform.repository.InvitationTokenRepository;
import com.saas.platform.security.JwtTokenProvider;
import com.saas.platform.security.RolePermissionMapper;
import com.saas.platform.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.Map;
import java.util.List;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final UserTenantRepository userTenantRepository;
        private final TenantRepository tenantRepository;
        private final RolePermissionRepository rolePermissionRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final InvitationTokenRepository invitationTokenRepository;

    @Transactional
    public LoginResponse acceptInvite(AcceptInviteRequest request) {
        InvitationToken invitation = invitationTokenRepository.findByToken(request.getToken())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid or expired invitation token"));

        if (invitation.isExpired()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invitation token has expired");
        }

        User user = userRepository.findByEmail(invitation.getEmail())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if (user.getStatus() == User.UserStatus.PENDING) {
            if (request.getPassword() == null || request.getPassword().isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password is required for new users");
            }
            if (request.getName() != null && !request.getName().isBlank()) {
                String[] nameParts = request.getName().split("\\s+", 2);
                user.setFirstName(nameParts[0]);
                user.setLastName(nameParts.length > 1 ? nameParts[1] : "");
            }
            user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
            user.setStatus(User.UserStatus.ACTIVE);
            userRepository.save(user);
        }

        UserTenant userTenant = userTenantRepository.findByUserIdAndTenantId(user.getId(), invitation.getTenantId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Membership not found"));

        userTenant.setStatus(UserTenant.Status.ACTIVE);
        userTenantRepository.save(userTenant);

        invitationTokenRepository.delete(invitation);

        Tenant tenant = tenantRepository.findById(userTenant.getTenantId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Company not found"));

        List<String> permissions = rolePermissionRepository.findPermissionsByRole(userTenant.getRole());
        if (permissions.isEmpty()) {
            permissions = RolePermissionMapper.permissionsFor(userTenant.getRole());
        }

        String accessToken = jwtTokenProvider.generateAccessToken(
                user.getId(),
                user.getEmail(),
                userTenant.getTenantId(),
                tenant.getName(),
                userTenant.getRole().name(),
                permissions);

        String refreshToken = jwtTokenProvider.generateRefreshToken(user.getId());

        LoginResponse.TenantInfo activeTenant = toTenantInfo(userTenant, tenant);
        
        // Return login response so the user is logged in immediately after accepting
        return LoginResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .user(LoginResponse.UserInfo.builder()
                        .id(user.getId())
                        .email(user.getEmail())
                        .firstName(user.getFirstName())
                        .lastName(user.getLastName())
                        .build())
                .tenants(List.of(activeTenant))
                .requiresTenantSelection(false)
                .activeTenant(activeTenant)
                .build();
    }

    public LoginResponse login(LoginRequest request) {
                String normalizedEmail = normalizeEmail(request.getEmail());
                User user = userRepository.findByEmail(normalizedEmail)
                                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
                        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }

        if (user.isPasswordResetRequired()) {
                List<UserTenant> userTenants = userTenantRepository.findByUserId(user.getId());

                return LoginResponse.builder()
                        .user(LoginResponse.UserInfo.builder()
                                .id(user.getId())
                                .email(user.getEmail())
                                .firstName(user.getFirstName())
                                .lastName(user.getLastName())
                                .build())
                        .tenants(userTenants.stream()
                                .map(ut -> toTenantInfo(ut, tenantRepository.findById(ut.getTenantId()).orElse(null)))
                                .collect(Collectors.toList()))
                        .requiresTenantSelection(false)
                        .passwordResetRequired(true)
                        .build();
        }

        // Update last login
        user.setLastLogin(Instant.now());
        userRepository.save(user);

        // Get user's tenants
        List<UserTenant> userTenants = userTenantRepository.findByUserId(user.getId());

        Map<Long, Tenant> tenantMap = tenantRepository.findAllById(
                        userTenants.stream().map(UserTenant::getTenantId).collect(Collectors.toSet()))
                .stream()
                .collect(Collectors.toMap(Tenant::getId, Function.identity()));

        List<LoginResponse.TenantInfo> tenants = userTenants.stream()
                .map(ut -> toTenantInfo(ut, tenantMap.get(ut.getTenantId())))
                .collect(Collectors.toList());

        // Only issue token when tenant is unambiguous or explicitly selected.
        String accessToken = null;
        String refreshToken = null;
        LoginResponse.TenantInfo activeTenant = null;

        UserTenant selectedUserTenant = resolveTenantForLogin(userTenants, request.getSelectedTenantId());

        if (selectedUserTenant != null) {
            Tenant selectedTenant = tenantMap.get(selectedUserTenant.getTenantId());
            if (selectedTenant == null) {
                                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selected company not found");
            }
            List<String> permissions = rolePermissionRepository.findPermissionsByRole(selectedUserTenant.getRole());
            if (permissions.isEmpty()) {
                permissions = RolePermissionMapper.permissionsFor(selectedUserTenant.getRole());
            }
            accessToken = jwtTokenProvider.generateAccessToken(
                    user.getId(),
                    user.getEmail(),
                    selectedUserTenant.getTenantId(),
                    selectedTenant.getName(),
                    selectedUserTenant.getRole().name(),
                    permissions);
            refreshToken = jwtTokenProvider.generateRefreshToken(user.getId());
            activeTenant = toTenantInfo(selectedUserTenant, selectedTenant);
        }

        return LoginResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .user(LoginResponse.UserInfo.builder()
                        .id(user.getId())
                        .email(user.getEmail())
                        .firstName(user.getFirstName())
                        .lastName(user.getLastName())
                        .build())
                .tenants(tenants)
                .requiresTenantSelection(needsTenantSelection(userTenants, request.getSelectedTenantId(), selectedUserTenant))
                .activeTenant(activeTenant)
                .build();
    }

        public void resetPassword(ResetPasswordRequest request) {
                String normalizedEmail = normalizeEmail(request.getEmail());
                User user = userRepository.findByEmail(normalizedEmail)
                                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));

                if (!user.isPasswordResetRequired()) {
                        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password reset is not required for this account");
                }

                if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
                        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
                }

                user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
                user.setPasswordResetRequired(false);
                userRepository.save(user);
        }

    @Transactional
    public LoginResponse register(com.saas.platform.dto.RegisterRequest request) {
        String normalizedEmail = normalizeEmail(request.getEmail());

        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "User with this email already exists");
        }

        String orgName = normalizeField(request.getOrgName());
        String firstName = normalizeField(request.getFirstName());
        String lastName = normalizeField(request.getLastName());

        String subdomain = generateUniqueSubdomain(orgName, normalizedEmail);

        Tenant tenant = Tenant.builder()
                .name(orgName != null ? orgName : normalizedEmail.split("@")[0] + "'s Organization")
                .subdomain(subdomain)
                .status(Tenant.TenantStatus.ACTIVE)
                .build();
        tenant = tenantRepository.save(tenant);

        User user = User.builder()
                .email(normalizedEmail)
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .firstName(firstName != null ? firstName : normalizedEmail.split("@")[0])
                .lastName(lastName != null ? lastName : "")
                .status(User.UserStatus.ACTIVE)
                .build();
        user = userRepository.save(user);

        UserTenant userTenant = UserTenant.builder()
                .userId(user.getId())
                .tenantId(tenant.getId())
                .role(UserTenant.Role.OWNER)
                .status(UserTenant.Status.ACTIVE)
                .build();
        userTenantRepository.save(userTenant);

        // Prepare response tokens
        List<String> permissions = rolePermissionRepository.findPermissionsByRole(userTenant.getRole());
        if (permissions.isEmpty()) {
            permissions = com.saas.platform.security.RolePermissionMapper.permissionsFor(userTenant.getRole());
        }

        String accessToken = jwtTokenProvider.generateAccessToken(
                user.getId(),
                user.getEmail(),
                userTenant.getTenantId(),
                tenant.getName(),
                userTenant.getRole().name(),
                permissions
        );

        String refreshToken = jwtTokenProvider.generateRefreshToken(user.getId());

        LoginResponse.TenantInfo tenantInfo = toTenantInfo(userTenant, tenant);

        return LoginResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .user(LoginResponse.UserInfo.builder()
                        .id(user.getId())
                        .email(user.getEmail())
                        .firstName(user.getFirstName())
                        .lastName(user.getLastName())
                        .build())
                .tenants(List.of(tenantInfo))
                .requiresTenantSelection(false)
                .activeTenant(tenantInfo)
                .build();
    }

    public TenantSwitchResponse switchTenant(TenantSwitchRequest request) {
        Long userId = SecurityUtils.getCurrentUserId();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));

        UserTenant userTenant = userTenantRepository.findByUserIdAndTenantId(userId, request.getTenantId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "User does not belong to this company"));

        if (userTenant.getStatus() != UserTenant.Status.ACTIVE) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Company membership is not active");
        }

        List<String> permissions = rolePermissionRepository.findPermissionsByRole(userTenant.getRole());
        if (permissions.isEmpty()) {
            permissions = RolePermissionMapper.permissionsFor(userTenant.getRole());
        }

        Tenant tenant = tenantRepository.findById(userTenant.getTenantId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Company not found"));

        String accessToken = jwtTokenProvider.generateAccessToken(
                userId,
                user.getEmail(),
                userTenant.getTenantId(),
                tenant.getName(),
                userTenant.getRole().name(),
                permissions);

        String refreshToken = jwtTokenProvider.generateRefreshToken(userId);

        return TenantSwitchResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tenantId(userTenant.getTenantId())
                                .tenantName(tenant.getName())
                .role(userTenant.getRole().name())
                .build();
    }

    public LoginResponse refreshAccessToken(String refreshTokenValue, Long tenantId) {
        if (!jwtTokenProvider.validateToken(refreshTokenValue)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid or expired refresh token");
        }

        Long userId = jwtTokenProvider.getUserIdFromToken(refreshTokenValue);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));

        // Find the user's active tenant membership
        List<UserTenant> userTenants = userTenantRepository.findByUserId(userId);
        UserTenant userTenant = null;

        if (tenantId != null) {
            userTenant = userTenants.stream()
                    .filter(ut -> ut.getTenantId().equals(tenantId) && ut.getStatus() == UserTenant.Status.ACTIVE)
                    .findFirst().orElse(null);
        }

        if (userTenant == null) {
            userTenant = userTenants.stream()
                    .filter(ut -> ut.getStatus() == UserTenant.Status.ACTIVE)
                    .findFirst()
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "No active company membership"));
        }

        Tenant tenant = tenantRepository.findById(userTenant.getTenantId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Company not found"));

        List<String> permissions = rolePermissionRepository.findPermissionsByRole(userTenant.getRole());
        if (permissions.isEmpty()) {
            permissions = RolePermissionMapper.permissionsFor(userTenant.getRole());
        }

        String newAccessToken = jwtTokenProvider.generateAccessToken(
                userId, user.getEmail(), userTenant.getTenantId(),
                tenant.getName(), userTenant.getRole().name(), permissions);
        String newRefreshToken = jwtTokenProvider.generateRefreshToken(userId);

        LoginResponse.TenantInfo activeTenantInfo = toTenantInfo(userTenant, tenant);

        return LoginResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken)
                .user(LoginResponse.UserInfo.builder()
                        .id(user.getId())
                        .email(user.getEmail())
                        .firstName(user.getFirstName())
                        .lastName(user.getLastName())
                        .build())
                .tenants(userTenants.stream()
                        .map(ut -> toTenantInfo(ut, tenantRepository.findById(ut.getTenantId()).orElse(null)))
                        .collect(Collectors.toList()))
                .requiresTenantSelection(false)
                .activeTenant(activeTenantInfo)
                .build();
    }

        private LoginResponse.TenantInfo toTenantInfo(UserTenant userTenant, Tenant tenant) {
                if (tenant == null) {
                        return LoginResponse.TenantInfo.builder()
                                        .id(userTenant.getTenantId())
                                        .name("Tenant " + userTenant.getTenantId())
                                        .role(userTenant.getRole().name())
                                        .status(userTenant.getStatus().name())
                                        .build();
                }

                return LoginResponse.TenantInfo.builder()
                                .id(userTenant.getTenantId())
                                .name(tenant.getName())
                                .role(userTenant.getRole().name())
                                .status(userTenant.getStatus().name())
                                .subdomain(tenant.getSubdomain())
                                .build();
        }

        private UserTenant resolveTenantForLogin(List<UserTenant> userTenants, Long selectedTenantId) {
                List<UserTenant> activeTenants = userTenants.stream()
                                .filter(ut -> ut.getStatus() == UserTenant.Status.ACTIVE)
                                .collect(Collectors.toList());

                if (activeTenants.isEmpty()) {
                        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No active company access found for this user");
                }

                if (selectedTenantId != null) {
                        return activeTenants.stream()
                                        .filter(ut -> Objects.equals(ut.getTenantId(), selectedTenantId))
                                        .findFirst()
                                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Selected company is not available for this user"));
                }

                if (activeTenants.size() == 1) {
                        return activeTenants.get(0);
                }

                return null;
        }

        private boolean needsTenantSelection(List<UserTenant> userTenants, Long selectedTenantId, UserTenant selectedUserTenant) {
                if (selectedTenantId != null && selectedUserTenant != null) {
                        return false;
                }

                long activeCount = userTenants.stream()
                                .filter(ut -> ut.getStatus() == UserTenant.Status.ACTIVE)
                                .count();

                return activeCount > 1 && selectedUserTenant == null;
        }

        private String normalizeEmail(String email) {
                if (email == null) {
                        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email is required");
                }

                String normalized = email.trim().toLowerCase(Locale.ROOT);
                if (normalized.isEmpty()) {
                        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email is required");
                }

                return normalized;
        }

        private String normalizeField(String value) {
                if (value == null) {
                        return null;
                }
                String trimmed = value.trim();
                return trimmed.isEmpty() ? null : trimmed;
        }

        private String generateUniqueSubdomain(String orgName, String email) {
                String base = (orgName != null ? orgName : email.split("@")[0])
                                .toLowerCase(Locale.ROOT)
                                .replaceAll("[^a-z0-9]", "-")
                                .replaceAll("-+", "-")
                                .replaceAll("^-|-$", "");
                if (base.isEmpty()) {
                        base = "org";
                }

                String candidate = base;
                int counter = 1;
                while (tenantRepository.existsBySubdomain(candidate)) {
                        candidate = base + "-" + counter;
                        counter++;
                }
                return candidate;
        }
}
