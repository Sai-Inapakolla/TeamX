import React, { useEffect, useMemo, useState } from 'react';
import { getNotifications, markNotificationsRead } from '../../utils/activityStore';

const NotificationBell = () => {
    const [open, setOpen] = useState(false);
    const [items, setItems] = useState([]);

    useEffect(() => {
        const refresh = () => setItems(getNotifications());
        refresh();
        window.addEventListener('teamx-notification-updated', refresh);
        return () => window.removeEventListener('teamx-notification-updated', refresh);
    }, []);

    const unreadCount = useMemo(() => items.filter((item) => item.unread).length, [items]);

    const toggle = () => {
        const nextOpen = !open;
        setOpen(nextOpen);
        if (nextOpen) {
            markNotificationsRead();
        }
    };

    return (
        <div style={{ position: 'relative' }}>
            <button onClick={toggle} style={bellButtonStyle}>
                Notifications
                {unreadCount > 0 && <span style={badgeStyle}>{unreadCount}</span>}
            </button>
            {open && (
                <div style={dropdownStyle}>
                    <h4 style={{ margin: '0 0 10px' }}>Recent updates</h4>
                    {items.length === 0 ? (
                        <p style={{ margin: 0, color: '#6b7280' }}>No notifications yet.</p>
                    ) : (
                        <div style={{ display: 'grid', gap: 8 }}>
                            {items.slice(0, 5).map((item) => (
                                <div key={item.id} style={notificationStyle}>
                                    <div style={{ fontWeight: 600 }}>{item.message}</div>
                                    <div style={{ fontSize: 12, color: '#6b7280' }}>
                                        {new Date(item.createdAt).toLocaleString()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const bellButtonStyle = {
    border: '1px solid #d1d5db',
    background: '#fff',
    borderRadius: 999,
    padding: '8px 14px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    cursor: 'pointer',
};

const badgeStyle = {
    minWidth: 20,
    height: 20,
    borderRadius: 999,
    background: '#2563eb',
    color: '#fff',
    fontSize: 12,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 6px',
};

const dropdownStyle = {
    position: 'absolute',
    right: 0,
    top: 'calc(100% + 8px)',
    width: 320,
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 12,
    padding: 14,
    boxShadow: '0 16px 40px rgba(15, 23, 42, 0.12)',
    zIndex: 40,
};

const notificationStyle = {
    border: '1px solid #eef2f7',
    background: '#f8fafc',
    borderRadius: 10,
    padding: 10,
};

export default NotificationBell;