package com.saas.platform.config;

import com.saas.platform.entity.Tenant;
import com.saas.platform.entity.Project;
import com.saas.platform.entity.User;
import com.saas.platform.entity.UserTenant;
import com.saas.platform.repository.TenantRepository;
import com.saas.platform.repository.ProjectRepository;
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
    private final ProjectRepository projectRepository;
    private final UserTenantRepository userTenantRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @SuppressWarnings("null")
    public void run(String... args) {
        Tenant tenant = tenantRepository.findAll().stream().findFirst().orElse(null);
        User user = userRepository.findAll().stream().findFirst().orElse(null);

        if (tenant == null) {
            log.info("No users found. Seeding development data...");

            tenant = Objects.requireNonNull(tenantRepository.save(
                    Tenant.builder()
                            .name("Test Organization")
                            .status(Tenant.TenantStatus.ACTIVE)
                            .subdomain("test")
                            .createdAt(Instant.now())
                            .updatedAt(Instant.now())
                            .build()));
            log.info("Created tenant: {} (ID: {})", tenant.getName(), tenant.getId());
        }

        if (user == null) {
            // Create test user with properly encoded password
            user = Objects.requireNonNull(userRepository.save(
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
        }

        if (userTenantRepository.findByUserIdAndTenantId(user.getId(), tenant.getId()).isEmpty()) {
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
        }

        if (projectRepository.countByTenantId(tenant.getId()) == 0) {
                Project project1 = Project.builder()
                    .name("AI Sprint Planner")
                    .description("Model-assisted planning, risk summaries, and owner suggestions.")
                    .ownerId(user.getId())
                    .status(Project.ProjectStatus.ACTIVE)
                    .createdBy(user.getId())
                    .build();
                project1.setTenantId(tenant.getId());
                project1.setCreatedAt(Instant.now());
                project1.setUpdatedAt(Instant.now());
                projectRepository.save(project1);

                Project project2 = Project.builder()
                    .name("Customer Portal Refresh")
                    .description("Navigation, onboarding checklist, and polished project views.")
                    .ownerId(user.getId())
                    .status(Project.ProjectStatus.ON_HOLD)
                    .createdBy(user.getId())
                    .build();
                project2.setTenantId(tenant.getId());
                project2.setCreatedAt(Instant.now());
                project2.setUpdatedAt(Instant.now());
                projectRepository.save(project2);

            log.info("Seeded demo projects for tenant {}", tenant.getId());
        }

        log.info("=== Development seed data ready ===");
        log.info("Default admin credentials have been seeded. Use the registered admin email to login.");
    }
}
