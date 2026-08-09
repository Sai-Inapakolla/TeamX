package com.saas.platform.security;

import com.saas.platform.entity.UserTenant;

import java.util.List;

public final class RolePermissionMapper {

    private RolePermissionMapper() {
    }

    public static List<String> permissionsFor(UserTenant.Role role) {
        return switch (role) {
            case OWNER, ORG_ADMIN -> List.of(
                    "PROJECT_READ",
                    "PROJECT_WRITE",
                    "TASK_READ",
                    "TASK_WRITE",
                    "TASK_ASSIGN",
                "TICKET_READ",
                "TICKET_WRITE",
                "TICKET_ASSIGN",
                "TICKET_ATTACHMENT_READ",
                "TICKET_ATTACHMENT_UPLOAD",
                    "USER_MANAGE",
                    "TENANT_SETTINGS");
            case MANAGER -> List.of(
                    "PROJECT_READ",
                    "PROJECT_WRITE",
                    "TASK_READ",
                    "TASK_WRITE",
                "TASK_ASSIGN",
                "TICKET_READ",
                "TICKET_WRITE",
                "TICKET_ASSIGN",
                "TICKET_ATTACHMENT_READ",
                "TICKET_ATTACHMENT_UPLOAD");
            case USER -> List.of(
                    "PROJECT_READ",
                    "TASK_READ",
                "TASK_WRITE",
                "TICKET_READ",
                "TICKET_WRITE",
                "TICKET_ATTACHMENT_READ",
                "TICKET_ATTACHMENT_UPLOAD");
        };
    }
}
