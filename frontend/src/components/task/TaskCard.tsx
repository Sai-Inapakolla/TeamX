import React from 'react';
import { Task } from '../../services/taskService';
import { Calendar, User } from 'lucide-react';

interface Props {
    task: Task;
    onClick: () => void;
}

const priorityBadges: { [key: string]: { label: string; pill: string } } = {
    'LOW': { label: 'Low', pill: 'badge-pill--emerald' },
    'MEDIUM': { label: 'Medium', pill: 'badge-pill--amber' },
    'HIGH': { label: 'High', pill: 'badge-pill--rose' },
    'URGENT': { label: 'Urgent', pill: 'badge-pill--rose' },
};

const TaskCard: React.FC<Props> = ({ task, onClick }) => {
    const priority = priorityBadges[task.priority] || { label: task.priority, pill: 'badge-pill--indigo' };

    return (
        <div
            onClick={onClick}
            style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '14px',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(15, 23, 42, 0.04)',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#6366f1';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(99, 102, 241, 0.12)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e2e8f0';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 6px rgba(15, 23, 42, 0.04)';
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: 0, lineHeight: 1.3 }}>{task.title}</h4>
                <span className={`badge-pill ${priority.pill}`} style={{ padding: '2px 8px', fontSize: '10px' }}>
                    {priority.label}
                </span>
            </div>

            {task.description && (
                <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 12px 0', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {task.description}
                </p>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTop: '1px solid #f1f5f9', fontSize: 11, color: '#94a3b8' }}>
                {task.dueDate ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Calendar size={12} />
                        <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                    </div>
                ) : (
                    <span>No due date</span>
                )}

                {task.assignedTo ? (
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#6366f1', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 10 }}>
                        U{task.assignedTo}
                    </div>
                ) : (
                    <div style={{ color: '#cbd5e1' }} title="Unassigned">
                        <User size={14} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default TaskCard;
