package com.saas.platform.service;

import com.saas.platform.dto.LoginRequest;
import com.saas.platform.dto.LoginResponse;
import com.saas.platform.dto.TenantSwitchRequest;
import com.saas.platform.dto.TenantSwitchResponse;
import com.saas.platform.entity.Tenant;
import com.saas.platform.entity.User;
import com.saas.platform.entity.UserTenant;
import com.saas.platform.repository.RolePermissionRepository;
import com.saas.platform.repository.TenantRepository;
import com.saas.platform.repository.UserRepository;
import com.saas.platform.repository.UserTenantRepository;
import com.saas.platform.security.JwtTokenProvider;
import com.saas.platform.security.RolePermissionMapper;
import com.saas.platform.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
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

    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
                        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
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
}
