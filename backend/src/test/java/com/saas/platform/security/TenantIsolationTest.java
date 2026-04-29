package com.saas.platform.security;

import com.saas.platform.entity.Tenant;
import com.saas.platform.entity.User;
import com.saas.platform.entity.UserTenant;
import com.saas.platform.repository.TenantRepository;
import com.saas.platform.repository.UserRepository;
import com.saas.platform.repository.UserTenantRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
@ActiveProfiles("test")
class TenantIsolationTest {

    @Autowired
    private TenantRepository tenantRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserTenantRepository userTenantRepository;

    private Tenant tenant1;
    private Tenant tenant2;
    private User user1;
    private User user2;

    @BeforeEach
    void setup() {
        // Create two tenants
        tenant1 = tenantRepository.save(Tenant.builder()
                .name("Tenant 1")
                .subdomain("tenant1")
                .status(Tenant.TenantStatus.ACTIVE)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build());

        tenant2 = tenantRepository.save(Tenant.builder()
                .name("Tenant 2")
                .subdomain("tenant2")
                .status(Tenant.TenantStatus.ACTIVE)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build());

        // Create two users
        user1 = userRepository.save(User.builder()
                .email("user1@tenant1.com")
                .passwordHash("hashedpass")
                .firstName("User")
                .lastName("One")
                .status(User.UserStatus.ACTIVE)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build());

        user2 = userRepository.save(User.builder()
                .email("user2@tenant2.com")
                .passwordHash("hashedpass")
                .firstName("User")
                .lastName("Two")
                .status(User.UserStatus.ACTIVE)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build());
    }

    @Test
    void testUserCanBelongToMultipleTenants() {
        // User 1 belongs to Tenant 1
        userTenantRepository.save(UserTenant.builder()
                .userId(user1.getId())
                .tenantId(tenant1.getId())
                .role(UserTenant.Role.ORG_ADMIN)
                .status(UserTenant.Status.ACTIVE)
                .joinedAt(Instant.now())
                .build());

        // User 1 also belongs to Tenant 2
        userTenantRepository.save(UserTenant.builder()
                .userId(user1.getId())
                .tenantId(tenant2.getId())
                .role(UserTenant.Role.USER)
                .status(UserTenant.Status.ACTIVE)
                .joinedAt(Instant.now())
                .build());

        List<UserTenant> user1Tenants = userTenantRepository.findByUserId(user1.getId());
        assertEquals(2, user1Tenants.size());
    }

    @Test
    void testUserTenantCannotBeCreatedTwice() {
        UserTenant first = userTenantRepository.save(UserTenant.builder()
                .userId(user1.getId())
                .tenantId(tenant1.getId())
                .role(UserTenant.Role.ORG_ADMIN)
                .status(UserTenant.Status.ACTIVE)
                .joinedAt(Instant.now())
                .build());

        assertThrows(Exception.class, () -> {
            userTenantRepository.saveAndFlush(UserTenant.builder()
                    .userId(user1.getId())
                    .tenantId(tenant1.getId())
                    .role(UserTenant.Role.MANAGER)
                    .status(UserTenant.Status.ACTIVE)
                    .joinedAt(Instant.now())
                    .build());
        });
    }

    @Test
    void testUserTenantBelongsToCheck() {
        userTenantRepository.save(UserTenant.builder()
                .userId(user1.getId())
                .tenantId(tenant1.getId())
                .role(UserTenant.Role.ORG_ADMIN)
                .status(UserTenant.Status.ACTIVE)
                .joinedAt(Instant.now())
                .build());

        boolean belongsToTenant1 = userTenantRepository.userBelongsToTenant(user1.getId(), tenant1.getId());
        assertTrue(belongsToTenant1);

        boolean belongsToTenant2 = userTenantRepository.userBelongsToTenant(user1.getId(), tenant2.getId());
        assertFalse(belongsToTenant2);
    }

    @Test
    void testUserTenantRoleAssignment() {
        UserTenant admin = userTenantRepository.save(UserTenant.builder()
                .userId(user1.getId())
                .tenantId(tenant1.getId())
                .role(UserTenant.Role.ORG_ADMIN)
                .status(UserTenant.Status.ACTIVE)
                .joinedAt(Instant.now())
                .build());

        Optional<UserTenant> retrieved = userTenantRepository.findByUserIdAndTenantId(user1.getId(), tenant1.getId());
        assertTrue(retrieved.isPresent());
        assertEquals(UserTenant.Role.ORG_ADMIN, retrieved.get().getRole());
    }
}
