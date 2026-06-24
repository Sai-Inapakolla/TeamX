import React, { useEffect, useState } from 'react';
import { getActivityLogs } from '../../utils/activityStore';

/**
 * @param {{ projectId?: number | string | null, limit?: number, title?: string }} props
 */
const ActivityLog = ({ projectId = null, limit = 8, title = 'Activity Log' }) => {
    const [items, setItems] = useState([]);

    useEffect(() => {
        const refresh = () => setItems(getActivityLogs(limit, projectId));
        refresh();
        window.addEventListener('teamx-activity-updated', refresh);
        return () => window.removeEventListener('teamx-activity-updated', refresh);
    }, [limit, projectId]);

    return (
        <section style={panelStyle}>
            <h3 style={headingStyle}>{title}</h3>
            {items.length === 0 ? (
                <p style={emptyStyle}>No activity yet.</p>
            ) : (
                <div style={{ display: 'grid', gap: 10 }}>
                    {items.map((item) => (
                        <div key={item.id} style={itemStyle}>
                            <div style={{ fontWeight: 600 }}>{item.message}</div>
                            <div style={{ fontSize: 12, color: '#6b7280' }}>
                                {item.actor} - {new Date(item.createdAt).toLocaleString()}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
};

const panelStyle = {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 12,
    padding: 16,
    boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
};

const headingStyle = {
    margin: '0 0 12px',
    fontSize: 16,
};

const itemStyle = {
    border: '1px solid #eef2f7',
    borderRadius: 10,
    padding: 12,
    background: '#f8fafc',
};

const emptyStyle = {
    color: '#6b7280',
    margin: 0,
};

export default ActivityLog;
