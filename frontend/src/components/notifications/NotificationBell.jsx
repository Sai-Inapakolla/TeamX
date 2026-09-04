import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, ArrowRight } from 'lucide-react';
import { getNotifications, markNotificationsRead } from '../../utils/activityStore';

const NotificationBell = () => {
    const [open, setOpen] = useState(false);
    const [items, setItems] = useState([]);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        const refresh = () => setItems(getNotifications());
        refresh();
        window.addEventListener('teamx-notification-updated', refresh);
        return () => window.removeEventListener('teamx-notification-updated', refresh);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setOpen(false);
            }
        };
        if (open) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [open]);

    const unreadCount = useMemo(() => items.filter((item) => item.unread).length, [items]);

    const toggle = () => {
        const nextOpen = !open;
        setOpen(nextOpen);
        if (nextOpen) {
            markNotificationsRead();
        }
    };

    const handleItemClick = (item) => {
        setOpen(false);
        navigate('/tasks');
    };

    return (
        <div ref={dropdownRef} style={{ position: 'relative' }}>
            <button onClick={toggle} style={bellButtonStyle} title="Notifications">
                <Bell size={16} />
                <span>Notifications</span>
                {unreadCount > 0 && <span style={badgeStyle}>{unreadCount}</span>}
            </button>
            {open && (
                <div style={dropdownStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Recent updates</h4>
                        <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>{items.length} total</span>
                    </div>

                    {items.length === 0 ? (
                        <p style={{ margin: '16px 0', color: '#64748b', textAlign: 'center', fontSize: 13 }}>No notifications yet.</p>
                    ) : (
                        <div style={{ display: 'grid', gap: 8, maxHeight: 320, overflowY: 'auto' }}>
                            {items.slice(0, 6).map((item) => (
                                <div
                                    key={item.id}
                                    onClick={() => handleItemClick(item)}
                                    style={notificationItemStyle}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.borderColor = '#93c5fd';
                                        e.currentTarget.style.background = '#eff6ff';
                                        e.currentTarget.style.transform = 'translateY(-1px)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.borderColor = '#e2e8f0';
                                        e.currentTarget.style.background = '#f8fafc';
                                        e.currentTarget.style.transform = 'none';
                                    }}
                                >
                                    <div style={{ fontWeight: 600, fontSize: 13, color: '#0f172a', lineHeight: 1.4 }}>{item.message}</div>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                                        <span style={{ fontSize: 11, color: '#64748b' }}>
                                            {new Date(item.createdAt).toLocaleString()}
                                        </span>
                                        <span style={{ fontSize: 11, fontWeight: 600, color: '#0284c7', display: 'flex', alignItems: 'center', gap: 3 }}>
                                            Go to Tasks <ArrowRight size={12} />
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid #f1f5f9', textAlign: 'center' }}>
                        <button
                            onClick={() => {
                                setOpen(false);
                                navigate('/tasks');
                            }}
                            style={viewAllButtonStyle}
                        >
                            Open Tasks Kanban Board &rarr;
                        </button>
                    </div>
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
    fontSize: 13,
    fontWeight: 600,
    color: '#334155',
    transition: 'all 0.15s ease',
};

const badgeStyle = {
    minWidth: 18,
    height: 18,
    borderRadius: 999,
    background: '#0284c7',
    color: '#fff',
    fontSize: 11,
    fontWeight: 700,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 5px',
};

const dropdownStyle = {
    position: 'absolute',
    right: 0,
    top: 'calc(100% + 8px)',
    width: 340,
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: 16,
    padding: 16,
    boxShadow: '0 20px 45px rgba(15, 23, 42, 0.15)',
    zIndex: 100,
};

const notificationItemStyle = {
    border: '1px solid #e2e8f0',
    background: '#f8fafc',
    borderRadius: 12,
    padding: '10px 12px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    textAlign: 'left',
};

const viewAllButtonStyle = {
    background: 'none',
    border: 'none',
    color: '#0284c7',
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
    padding: '4px 8px',
};

export default NotificationBell;