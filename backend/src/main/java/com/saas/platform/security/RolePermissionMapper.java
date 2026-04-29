package com.saas.platform.security;

import com.saas.platform.entity.UserTenant;

import java.util.List;

public final class RolePermissionMapper {

    private RolePermissionMapper() {
    }

    public static List<String> permissionsFor(UserTenant.Role role) {
        return switch (role) {
            case ORG_ADMIN -> List.of(
                    "PROJECT_READ",
                    "PROJECT_WRITE",
                    "TASK_READ",
                    "TASK_WRITE",
                    "TASK_ASSIGN",
                    "USER_MANAGE",
                    "TENANT_SETTINGS");
            case MANAGER -> List.of(
                    "PROJECT_READ",
                    "PROJECT_WRITE",
                    "TASK_READ",
                    "TASK_WRITE",
                    "TASK_ASSIGN");
            case USER -> List.of(
                    "PROJECT_READ",
                    "TASK_READ",
                    "TASK_WRITE");
        };
    }
}
