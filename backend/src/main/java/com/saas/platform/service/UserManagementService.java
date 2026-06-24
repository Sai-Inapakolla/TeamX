package com.saas.platform.service;

import com.saas.platform.dto.InviteUserRequest;
import com.saas.platform.dto.UpdateUserRoleRequest;
import com.saas.platform.dto.UserManagementDTO;
import com.saas.platform.entity.User;
import com.saas.platform.entity.UserTenant;
import com.saas.platform.repository.UserRepository;
import com.saas.platform.repository.UserTenantRepository;
import com.saas.platform.security.SecurityUtils;
import com.saas.platform.security.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserManagementService {

    private final UserRepository userRepository;
    private final UserTenantRepository userTenantRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public List<UserManagementDTO> listUsers() {
        Long tenantId = TenantContext.getCurrentTenantId();
        return userTenantRepository.findByTenantId(tenantId)
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public UserManagementDTO inviteUser(InviteUserRequest request) {
        Long tenantId = TenantContext.getCurrentTenantId();
        String normalizedEmail = normalizeEmail(request.getEmail());
        User user = userRepository.findByEmail(normalizedEmail).orElse(null);
        String temporaryPassword = null;

        if (user == null) {
            temporaryPassword = generateTemporaryPassword();
            String[] nameParts = splitName(request.getName(), normalizedEmail);
            user = userRepository.save(User.builder()
                    .email(normalizedEmail)
                    .passwordHash(passwordEncoder.encode(temporaryPassword))
                    .firstName(nameParts[0])
                    .lastName(nameParts[1])
                    .status(User.UserStatus.ACTIVE)
                    .build());
        }

        if (userTenantRepository.findByUserIdAndTenantId(user.getId(), tenantId).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "User already exists in this company");
        }

        UserTenant membership = UserTenant.builder()
                .userId(user.getId())
                .tenantId(tenantId)
                .role(toRole(request.getRole()))
                .status(UserTenant.Status.ACTIVE)
                .joinedAt(Instant.now())
                .build();
        userTenantRepository.save(membership);

        return toDto(user, membership, temporaryPassword);
    }

    @Transactional
    public UserManagementDTO updateUserRole(Long userId, UpdateUserRoleRequest request) {
        Long tenantId = TenantContext.getCurrentTenantId();
        UserTenant membership = userTenantRepository.findByUserIdAndTenantId(userId, tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found in this company"));

        membership.setRole(toRole(request.getRole()));
        membership = userTenantRepository.save(membership);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        return toDto(user, membership, null);
    }

    @Transactional
    public void deleteUser(Long userId) {
        Long tenantId = TenantContext.getCurrentTenantId();
        Long currentUserId = SecurityUtils.getCurrentUserId();

        if (userId.equals(currentUserId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You cannot delete your own account from the current company");
        }

        UserTenant membership = userTenantRepository.findByUserIdAndTenantId(userId, tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found in this company"));

        userTenantRepository.delete(membership);

        if (userTenantRepository.findByUserId(userId).isEmpty()) {
            userRepository.findById(userId).ifPresent(userRepository::delete);
        }
    }

    private UserManagementDTO toDto(UserTenant membership) {
        User user = userRepository.findById(membership.getUserId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        return toDto(user, membership, null);
    }

    private UserManagementDTO toDto(User user, UserTenant membership, String temporaryPassword) {
        return UserManagementDTO.builder()
                .id(user.getId())
                .name(joinName(user.getFirstName(), user.getLastName()))
                .email(user.getEmail())
                .role(toUiRole(membership.getRole()))
                .status(membership.getStatus().name())
                .joinedAt(membership.getJoinedAt() != null ? membership.getJoinedAt().toString() : null)
                .temporaryPassword(temporaryPassword)
                .build();
    }

    private String joinName(String firstName, String lastName) {
        if (lastName == null || lastName.isBlank()) {
            return firstName;
        }
        return firstName + " " + lastName;
    }

    private String normalizeEmail(String email) {
        if (email == null || email.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email is required");
        }
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private String generateTemporaryPassword() {
        return "Tmp-" + UUID.randomUUID().toString().substring(0, 8);
    }

    private String[] splitName(String name, String email) {
        String fallback = email.contains("@") ? email.substring(0, email.indexOf('@')) : email;
        String effectiveName = (name == null || name.isBlank()) ? fallback : name.trim();
        String[] parts = effectiveName.split("\\s+", 2);
        String firstName = parts[0];
        String lastName = parts.length > 1 ? parts[1] : "";
        return new String[] { firstName, lastName };
    }

    private UserTenant.Role toRole(String role) {
        if (role == null || role.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Role is required");
        }

        return switch (role.trim().toUpperCase(Locale.ROOT)) {
            case "ADMIN", "ORG_ADMIN" -> UserTenant.Role.ORG_ADMIN;
            case "MANAGER" -> UserTenant.Role.MANAGER;
            case "USER" -> UserTenant.Role.USER;
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid role: " + role);
        };
    }

    private String toUiRole(UserTenant.Role role) {
        return switch (role) {
            case ORG_ADMIN -> "ADMIN";
            case MANAGER -> "MANAGER";
            case USER -> "USER";
        };
    }
}