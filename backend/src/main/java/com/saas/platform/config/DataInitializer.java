package com.saas.platform.config;

import com.saas.platform.entity.Tenant;
import com.saas.platform.entity.User;
import com.saas.platform.entity.UserTenant;
import com.saas.platform.repository.TenantRepository;
import com.saas.platform.repository.UserRepository;
import com.saas.platform.repository.UserTenantRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Objects;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final TenantRepository tenantRepository;
    private final UserTenantRepository userTenantRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @SuppressWarnings("null")
    public void run(String... args) {
        if (userRepository.count() == 0) {
            log.info("No users found. Seeding development data...");

            // Create test tenant
            final Tenant tenant = Objects.requireNonNull(tenantRepository.save(
                    Tenant.builder()
                            .name("Test Organization")
                            .status(Tenant.TenantStatus.ACTIVE)
                            .subdomain("test")
                            .createdAt(Instant.now())
                            .updatedAt(Instant.now())
                            .build()));
            log.info("Created tenant: {} (ID: {})", tenant.getName(), tenant.getId());

            // Create test user with properly encoded password
            final User user = Objects.requireNonNull(userRepository.save(
                    User.builder()
                            .email("admin@test.com")
                            .passwordHash(passwordEncoder.encode("password123"))
                            .firstName("Admin")
                            .lastName("User")
                            .status(User.UserStatus.ACTIVE)
                            .createdAt(Instant.now())
                            .updatedAt(Instant.now())
                            .build()));
            log.info("Created user: {} (ID: {})", user.getEmail(), user.getId());

            // Link user to tenant
            userTenantRepository.save(
                    UserTenant.builder()
                            .userId(user.getId())
                            .tenantId(tenant.getId())
                        .role(UserTenant.Role.ORG_ADMIN)
                            .status(UserTenant.Status.ACTIVE)
                            .joinedAt(Instant.now())
                            .build());
            log.info("Linked user to tenant with ACTIVE status");

            log.info("=== Development seed data created ===");
            log.info("Login: admin@test.com / password123");
        }
    }
}
