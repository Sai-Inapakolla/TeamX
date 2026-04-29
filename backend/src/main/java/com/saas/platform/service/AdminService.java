package com.saas.platform.service;

import com.saas.platform.dto.UserTenantAssignmentRequest;
import com.saas.platform.dto.UserTenantAssignmentResponse;
import com.saas.platform.entity.User;
import com.saas.platform.entity.UserTenant;
import com.saas.platform.repository.UserRepository;
import com.saas.platform.repository.UserTenantRepository;
import com.saas.platform.security.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final UserTenantRepository userTenantRepository;

    @Transactional
    public UserTenantAssignmentResponse assignUserToTenant(UserTenantAssignmentRequest request) {
        Long tenantId = TenantContext.getCurrentTenantId();

        if (!request.getTenantId().equals(tenantId)) {
            throw new IllegalStateException("Cannot assign users to other tenants");
        }

        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        UserTenant.Role role = UserTenant.Role.valueOf(request.getRole());

        UserTenant userTenant = userTenantRepository.findByUserIdAndTenantId(request.getUserId(), tenantId)
                .orElse(UserTenant.builder()
                        .userId(request.getUserId())
                        .tenantId(tenantId)
                        .role(role)
                        .status(UserTenant.Status.ACTIVE)
                        .joinedAt(Instant.now())
                        .build());

        if (!userTenant.getRole().equals(role)) {
            userTenant.setRole(role);
        }

        userTenant = userTenantRepository.save(userTenant);

        return UserTenantAssignmentResponse.builder()
                .userId(userTenant.getUserId())
                .tenantId(userTenant.getTenantId())
                .role(userTenant.getRole().name())
                .status(userTenant.getStatus().name())
                .build();
    }

    @Transactional(readOnly = true)
    public List<UserTenantAssignmentResponse> listTenantUsers() {
        Long tenantId = TenantContext.getCurrentTenantId();
        return userTenantRepository.findByTenantId(tenantId)
                .stream()
                .map(ut -> UserTenantAssignmentResponse.builder()
                        .userId(ut.getUserId())
                        .tenantId(ut.getTenantId())
                        .role(ut.getRole().name())
                        .status(ut.getStatus().name())
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional
    public void removeUserFromTenant(Long userId) {
        Long tenantId = TenantContext.getCurrentTenantId();
        UserTenant userTenant = userTenantRepository.findByUserIdAndTenantId(userId, tenantId)
                .orElseThrow(() -> new RuntimeException("User tenant membership not found"));

        userTenantRepository.delete(userTenant);
    }
}
