const ACTIVITY_KEY = 'teamx_activity_logs';
const NOTIFICATION_KEY = 'teamx_notifications';

const readJson = (key) => {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
};

const writeJson = (key, value) => {
    localStorage.setItem(key, JSON.stringify(value));
};

const emit = (name) => window.dispatchEvent(new Event(name));

/**
 * @param {{ message: string, projectId?: number | string | null, type?: string, meta?: Record<string, unknown> }} params
 */
export const recordActivity = ({ message, projectId = undefined, type = 'activity', meta = {} }) => {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const entry = {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        message,
        projectId,
        type,
        meta,
        actor: user?.email || 'Unknown user',
        createdAt: new Date().toISOString(),
    };

    const current = readJson(ACTIVITY_KEY);
    writeJson(ACTIVITY_KEY, [entry, ...current].slice(0, 100));
    emit('teamx-activity-updated');
    return entry;
};

/**
 * @param {number} [limit]
 * @param {number | string | null} [projectId]
 */
export const getActivityLogs = (limit = 10, projectId = undefined) => {
    const logs = readJson(ACTIVITY_KEY);
    const filtered = projectId == null ? logs : logs.filter((log) => String(log.projectId) === String(projectId));
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

    const current = readJson(NOTIFICATION_KEY);
    writeJson(NOTIFICATION_KEY, [entry, ...current].slice(0, 50));
    emit('teamx-notification-updated');
    return entry;
};

export const getNotifications = () => readJson(NOTIFICATION_KEY);

export const markNotificationsRead = () => {
    const current = readJson(NOTIFICATION_KEY).map((item) => ({ ...item, unread: false }));
    writeJson(NOTIFICATION_KEY, current);
    emit('teamx-notification-updated');
};
