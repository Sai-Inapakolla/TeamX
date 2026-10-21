const ACTIVITY_BASE_KEY = 'teamx_activity_logs';
const NOTIFICATION_BASE_KEY = 'teamx_notifications';

const getTenantKey = (baseKey) => {
    if (typeof window === 'undefined') return baseKey;
    try {
        const raw = localStorage.getItem('activeTenant');
        const activeTenant = raw ? JSON.parse(raw) : null;
        return activeTenant?.id ? `${baseKey}_tenant_${activeTenant.id}` : baseKey;
    } catch {
        return baseKey;
    }
};

const readJson = (key) => {
    try {
        const raw = localStorage.getItem(getTenantKey(key));
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
};

const writeJson = (key, value) => {
    try {
        localStorage.setItem(getTenantKey(key), JSON.stringify(value));
    } catch (e) {
        console.error('Failed to save to local storage', e);
    }
};

const emit = (name) => window.dispatchEvent(new Event(name));

/**
 * @param {{ message: string, projectId?: number | string | null, taskId?: number | string | null, type?: string, meta?: Record<string, unknown> }} params
 */
export const recordActivity = ({ message, projectId = undefined, taskId = undefined, type = 'activity', meta = {} }) => {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const entry = {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        message,
        projectId,
        taskId,
        type,
        meta,
        actor: user?.email || 'Unknown user',
        createdAt: new Date().toISOString(),
    };

    const current = readJson(ACTIVITY_BASE_KEY);
    writeJson(ACTIVITY_BASE_KEY, [entry, ...current].slice(0, 100));
    emit('teamx-activity-updated');
    return entry;
};

/**
 * @param {number} [limit]
 * @param {number | string | null} [projectId]
 * @param {number | string | null} [taskId]
 */
export const getActivityLogs = (limit = 10, projectId = undefined, taskId = undefined) => {
    const logs = readJson(ACTIVITY_BASE_KEY);
    const filtered = logs.filter((log) => {
        if (taskId != null && String(log.taskId) !== String(taskId)) return false;
        if (projectId != null && String(log.projectId) !== String(projectId)) return false;
        return true;
    });
    return filtered.slice(0, limit);
};

/**
 * @param {{ message: string, projectId?: number | string | null, unread?: boolean, meta?: Record<string, unknown> }} params
 */
export const recordNotification = ({ message, projectId = undefined, unread = true, meta = {} }) => {
    const entry = {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        message,
        projectId,
        unread,
        meta,
        createdAt: new Date().toISOString(),
    };

    const current = readJson(NOTIFICATION_BASE_KEY);
    writeJson(NOTIFICATION_BASE_KEY, [entry, ...current].slice(0, 50));
    emit('teamx-notification-updated');
    return entry;
};

export const getNotifications = () => readJson(NOTIFICATION_BASE_KEY);

export const markNotificationsRead = () => {
    const current = readJson(NOTIFICATION_BASE_KEY).map((item) => ({ ...item, unread: false }));
    writeJson(NOTIFICATION_BASE_KEY, current);
    emit('teamx-notification-updated');
};
