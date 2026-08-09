package com.saas.platform.security;

import com.saas.platform.entity.UserTenant;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class RolePermissionMapperTest {

    @Test
    void testOrgAdminHasAllPermissions() {
        List<String> permissions = RolePermissionMapper.permissionsFor(UserTenant.Role.ORG_ADMIN);
        
        assertTrue(permissions.contains("PROJECT_READ"));
        assertTrue(permissions.contains("PROJECT_WRITE"));
        assertTrue(permissions.contains("TASK_READ"));
        assertTrue(permissions.contains("TASK_WRITE"));
        assertTrue(permissions.contains("TASK_ASSIGN"));
        assertTrue(permissions.contains("TICKET_READ"));
        assertTrue(permissions.contains("TICKET_WRITE"));
        assertTrue(permissions.contains("TICKET_ASSIGN"));
        assertTrue(permissions.contains("TICKET_ATTACHMENT_READ"));
        assertTrue(permissions.contains("TICKET_ATTACHMENT_UPLOAD"));
        assertTrue(permissions.contains("USER_MANAGE"));
        assertTrue(permissions.contains("TENANT_SETTINGS"));
        
        assertEquals(12, permissions.size());
    }

    @Test
    void testManagerHasLimitedPermissions() {
        List<String> permissions = RolePermissionMapper.permissionsFor(UserTenant.Role.MANAGER);
        
        assertTrue(permissions.contains("PROJECT_READ"));
        assertTrue(permissions.contains("PROJECT_WRITE"));
        assertTrue(permissions.contains("TASK_READ"));
        assertTrue(permissions.contains("TASK_WRITE"));
        assertTrue(permissions.contains("TASK_ASSIGN"));
        assertTrue(permissions.contains("TICKET_READ"));
        assertTrue(permissions.contains("TICKET_WRITE"));
        assertTrue(permissions.contains("TICKET_ASSIGN"));
        assertTrue(permissions.contains("TICKET_ATTACHMENT_READ"));
        assertTrue(permissions.contains("TICKET_ATTACHMENT_UPLOAD"));
        
        assertFalse(permissions.contains("USER_MANAGE"));
        assertFalse(permissions.contains("TENANT_SETTINGS"));
        
        assertEquals(10, permissions.size());
    }

    @Test
    void testUserHasMinimalPermissions() {
        List<String> permissions = RolePermissionMapper.permissionsFor(UserTenant.Role.USER);
        
        assertTrue(permissions.contains("PROJECT_READ"));
        assertTrue(permissions.contains("TASK_READ"));
        assertTrue(permissions.contains("TASK_WRITE"));
        assertTrue(permissions.contains("TICKET_READ"));
        assertTrue(permissions.contains("TICKET_WRITE"));
        assertTrue(permissions.contains("TICKET_ATTACHMENT_READ"));
        assertTrue(permissions.contains("TICKET_ATTACHMENT_UPLOAD"));
        
        assertFalse(permissions.contains("PROJECT_WRITE"));
        assertFalse(permissions.contains("TASK_ASSIGN"));
        assertFalse(permissions.contains("USER_MANAGE"));
        assertFalse(permissions.contains("TENANT_SETTINGS"));
        
        assertEquals(7, permissions.size());
    }

    @Test
    void testAllRolesAreCovered() {
        for (UserTenant.Role role : UserTenant.Role.values()) {
            List<String> permissions = RolePermissionMapper.permissionsFor(role);
            assertFalse(permissions.isEmpty(), "Role " + role + " should have at least one permission");
        }
    }
}
