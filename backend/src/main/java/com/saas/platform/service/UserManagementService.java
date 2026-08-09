package com.saas.platform.service;

import com.saas.platform.dto.InviteUserRequest;
import com.saas.platform.dto.UpdateUserRoleRequest;
import com.saas.platform.dto.UserManagementDTO;
import com.saas.platform.entity.User;
import com.saas.platform.entity.UserTenant;
import com.saas.platform.entity.InvitationToken;
import com.saas.platform.entity.Tenant;
import com.saas.platform.repository.UserRepository;
import com.saas.platform.repository.UserTenantRepository;
import com.saas.platform.repository.InvitationTokenRepository;
import com.saas.platform.repository.TenantRepository;

import com.saas.platform.security.SecurityUtils;
import com.saas.platform.security.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.security.SecureRandom;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.stream.Collectors;
import java.time.temporal.ChronoUnit;

@Service
@RequiredArgsConstructor
public class UserManagementService {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final char[] TEMP_PASSWORD_CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%*?_+-".toCharArray();
    private static final int TEMP_PASSWORD_LENGTH = 20;

    private final UserRepository userRepository;
    private final UserTenantRepository userTenantRepository;
    private final InvitationTokenRepository invitationTokenRepository;
    private final EmailService emailService;
    private final TenantRepository tenantRepository;

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
        
        if (user != null && userTenantRepository.findByUserIdAndTenantId(user.getId(), tenantId).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "User already exists in this company");
        }

        if (user == null) {
            String[] nameParts = splitName(request.getName(), normalizedEmail);
            user = userRepository.save(User.builder()
                    .email(normalizedEmail)
                    .passwordHash("") // No password initially
                    .passwordResetRequired(false) // Will set via invite
                    .firstName(nameParts[0])
                    .lastName(nameParts[1])
                    .status(User.UserStatus.PENDING)
                    .build());
        }

        UserTenant membership = userTenantRepository.findByUserIdAndTenantId(user.getId(), tenantId).orElse(null);
        if (membership == null) {
            membership = UserTenant.builder()
                    .userId(user.getId())
                    .tenantId(tenantId)
                    .role(request.getRole())
                    .status(UserTenant.Status.PENDING)
                    .joinedAt(Instant.now())
                    .build();
            userTenantRepository.save(membership);
        }

        String token = UUID.randomUUID().toString();
        InvitationToken invitation = InvitationToken.builder()
                .token(token)
                .email(normalizedEmail)
                .tenantId(tenantId)
                .role(request.getRole())
                .expiresAt(Instant.now().plus(7, ChronoUnit.DAYS))
                .build();
        invitationTokenRepository.save(invitation);

        Tenant tenant = tenantRepository.findById(tenantId).orElse(null);
        String tenantName = tenant != null ? tenant.getName() : "Organization";
        
        Long currentUserId = SecurityUtils.getCurrentUserId();
        User currentUser = currentUserId != null ? userRepository.findById(currentUserId).orElse(null) : null;
        String inviterName = currentUser != null ? joinName(currentUser.getFirstName(), currentUser.getLastName()) : null;

        emailService.sendInvitationEmail(normalizedEmail, token, tenantName, inviterName);

        UserManagementDTO dto = toDto(user, membership);
        dto.setInviteUrl("http://localhost:3000/accept-invite?token=" + token);
        
        return dto;
    }

    @Transactional
    public UserManagementDTO updateUserRole(Long userId, UpdateUserRoleRequest request) {
        Long tenantId = TenantContext.getCurrentTenantId();
        UserTenant membership = userTenantRepository.findByUserIdAndTenantId(userId, tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found in this company"));

        UserTenant.Role newRole = request.getRole();

        // Prevent modifying the role of an OWNER
        if (membership.getRole() == UserTenant.Role.OWNER && newRole != UserTenant.Role.OWNER) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cannot change the role of the Owner");
        }
        
        // Prevent assigning the OWNER role manually
        if (newRole == UserTenant.Role.OWNER && membership.getRole() != UserTenant.Role.OWNER) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cannot manually assign the Owner role to other users");
        }

        // Prevent demoting the last ORG_ADMIN (or OWNER if they share semantics, but OWNER is handled above)
        if (membership.getRole() == UserTenant.Role.ORG_ADMIN && newRole != UserTenant.Role.ORG_ADMIN) {
            long adminCount = userTenantRepository.findByTenantId(tenantId).stream()
                    .filter(ut -> ut.getRole() == UserTenant.Role.ORG_ADMIN && ut.getStatus() == UserTenant.Status.ACTIVE)
                    .count();
            if (adminCount <= 1) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot demote the last admin. Promote another user to admin first.");
            }
        }

        membership.setRole(newRole);
        membership = userTenantRepository.save(membership);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        return toDto(user, membership);
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

        // Prevent deleting the OWNER
        if (membership.getRole() == UserTenant.Role.OWNER) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cannot delete the Owner of the company");
        }

        // Prevent deleting the last active ORG_ADMIN
        if (membership.getRole() == UserTenant.Role.ORG_ADMIN && membership.getStatus() == UserTenant.Status.ACTIVE) {
            long activeAdminCount = userTenantRepository.findByTenantId(tenantId).stream()
                    .filter(ut -> ut.getRole() == UserTenant.Role.ORG_ADMIN && ut.getStatus() == UserTenant.Status.ACTIVE)
                    .count();
            if (activeAdminCount <= 1) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot remove the last active admin from the organization.");
            }
        }

        userRepository.findById(userId).ifPresent(user -> {
            invitationTokenRepository.deleteByEmailAndTenantId(user.getEmail(), tenantId);
        });

        userTenantRepository.delete(membership);

        if (userTenantRepository.findByUserId(userId).isEmpty()) {
            userRepository.findById(userId).ifPresent(userRepository::delete);
        }
    }

    private UserManagementDTO toDto(UserTenant membership) {
        User user = userRepository.findById(membership.getUserId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        return toDto(user, membership);
    }

    private UserManagementDTO toDto(User user, UserTenant membership) {
        return UserManagementDTO.builder()
                .id(user.getId())
                .name(joinName(user.getFirstName(), user.getLastName()))
                .email(user.getEmail())
                .role(toUiRole(membership.getRole()))
                .status(membership.getStatus().name())
                .joinedAt(membership.getJoinedAt() != null ? membership.getJoinedAt().toString() : null)
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


    private String[] splitName(String name, String email) {
        String fallback = email.contains("@") ? email.substring(0, email.indexOf('@')) : email;
        String effectiveName = (name == null || name.isBlank()) ? fallback : name.trim();
        String[] parts = effectiveName.split("\\s+", 2);
        String firstName = parts[0];
        String lastName = parts.length > 1 ? parts[1] : "";
        return new String[] { firstName, lastName };
    }

    private String toUiRole(UserTenant.Role role) {
        return switch (role) {
            case OWNER -> "OWNER";
            case ORG_ADMIN -> "ADMIN";
            case MANAGER -> "MANAGER";
            case USER -> "USER";
        };
    }
}