import React, { useEffect, useState } from 'react';
import { getActivityLogs } from '../../utils/activityStore';

/**
 * @param {{ projectId?: number | string | null, taskId?: number | string | null, limit?: number, initialLimit?: number, title?: string }} props
 */
const ActivityLog = ({ projectId = null, taskId = null, limit = 20, initialLimit = 3, title = 'Activity Log' }) => {
    const [items, setItems] = useState([]);
    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
        const refresh = () => setItems(getActivityLogs(limit, projectId, taskId));
        refresh();
        window.addEventListener('teamx-activity-updated', refresh);
        return () => window.removeEventListener('teamx-activity-updated', refresh);
    }, [limit, projectId, taskId]);

    const visibleItems = expanded ? items : items.slice(0, initialLimit);
    const hasMore = items.length > initialLimit;

    return (
        <section style={panelStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <h3 style={headingStyle}>{title}</h3>
                <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 600 }}>{items.length} events</span>
            </div>
            {items.length === 0 ? (
                <p style={emptyStyle}>No activity yet.</p>
            ) : (
                <>
                    <div style={{ display: 'grid', gap: 10 }}>
                        {visibleItems.map((item) => (
                            <div key={item.id} style={itemStyle}>
                                <div style={{ fontWeight: 600, fontSize: 13 }}>{item.message}</div>
                                <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>
                                    {item.actor} - {new Date(item.createdAt).toLocaleString()}
                                </div>
                            </div>
                        ))}
                    </div>
                    {hasMore && (
                        <button
                            onClick={() => setExpanded(!expanded)}
                            style={buttonStyle}
                        >
                            {expanded ? 'Show less' : `Show more (${items.length - initialLimit} more)`}
                        </button>
                    )}
                </>
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

const buttonStyle = {
    marginTop: 12,
    width: '100%',
    padding: '8px 12px',
    fontSize: 12,
    fontWeight: 600,
    color: '#0284c7',
    background: '#f0f9ff',
    border: '1px solid #bae6fd',
    borderRadius: 8,
    cursor: 'pointer',
    textAlign: 'center',
    transition: 'all 0.2s',
};

export default ActivityLog;
