export const ROLES = {
    ADMIN: 'ADMIN',
    MANAGER: 'MANAGER',
    USER: 'USER',
} as const;

export const PERMISSIONS = {
    VIEW_PROJECTS: 'view_projects',
    CREATE_PROJECT: 'create_project',
    EDIT_PROJECT: 'edit_project',
    DELETE_PROJECT: 'delete_project',
    CREATE_TASK: 'create_task',
    EDIT_TASK: 'edit_task',
    DELETE_TASK: 'delete_task',
    ASSIGN_TASK: 'assign_task',
    MANAGE_USERS: 'manage_users',
    INVITE_USER: 'invite_user',
    UPDATE_USER_ROLE: 'update_user_role',
    DELETE_USER: 'delete_user',
    TENANT_SETTINGS: 'tenant_settings',
} as const;

export const ROLE_PERMISSIONS = {
    ADMIN: [
        PERMISSIONS.VIEW_PROJECTS,
        PERMISSIONS.CREATE_PROJECT,
        PERMISSIONS.EDIT_PROJECT,
        PERMISSIONS.DELETE_PROJECT,
        PERMISSIONS.CREATE_TASK,
        PERMISSIONS.EDIT_TASK,
        PERMISSIONS.DELETE_TASK,
        PERMISSIONS.ASSIGN_TASK,
        PERMISSIONS.MANAGE_USERS,
        PERMISSIONS.INVITE_USER,
        PERMISSIONS.UPDATE_USER_ROLE,
        PERMISSIONS.DELETE_USER,
        PERMISSIONS.TENANT_SETTINGS,
    ],
    MANAGER: [
        PERMISSIONS.VIEW_PROJECTS,
        PERMISSIONS.CREATE_PROJECT,
        PERMISSIONS.EDIT_PROJECT,
        PERMISSIONS.CREATE_TASK,
        PERMISSIONS.EDIT_TASK,
        PERMISSIONS.DELETE_TASK,
        PERMISSIONS.ASSIGN_TASK,
    ],
    USER: [
        PERMISSIONS.VIEW_PROJECTS,
        PERMISSIONS.CREATE_TASK,
    ],
} as const;

const PERMISSION_TO_AUTHORITY: Record<string, string> = {
    [PERMISSIONS.VIEW_PROJECTS]: 'PROJECT_READ',
    [PERMISSIONS.CREATE_PROJECT]: 'PROJECT_WRITE',
    [PERMISSIONS.EDIT_PROJECT]: 'PROJECT_WRITE',
    [PERMISSIONS.DELETE_PROJECT]: 'PROJECT_WRITE',
    [PERMISSIONS.CREATE_TASK]: 'TASK_WRITE',
    [PERMISSIONS.EDIT_TASK]: 'TASK_WRITE',
    [PERMISSIONS.DELETE_TASK]: 'TASK_WRITE',
    [PERMISSIONS.ASSIGN_TASK]: 'TASK_ASSIGN',
    [PERMISSIONS.MANAGE_USERS]: 'USER_MANAGE',
    [PERMISSIONS.INVITE_USER]: 'USER_MANAGE',
    [PERMISSIONS.UPDATE_USER_ROLE]: 'USER_MANAGE',
    [PERMISSIONS.DELETE_USER]: 'USER_MANAGE',
    [PERMISSIONS.TENANT_SETTINGS]: 'TENANT_SETTINGS',
};

export const ROLE_LABELS: Record<string, string> = {
    ORG_ADMIN: 'ADMIN',
    ADMIN: 'ADMIN',
    MANAGER: 'MANAGER',
    USER: 'USER',
};

export const normalizePermission = (permission: string) => PERMISSION_TO_AUTHORITY[permission] ?? permission;

export const normalizeRole = (role?: string | null) => {
    if (!role) {
        return '';
    }

    return ROLE_LABELS[role] ?? role;
};

export const toBackendRole = (role: string) => {
    const normalized = normalizeRole(role);
    if (normalized === ROLES.ADMIN) {
        return 'ORG_ADMIN';
    }
    return normalized;
};

export const toUiRole = (role: string) => normalizeRole(role) || role;

export default PERMISSIONS;
