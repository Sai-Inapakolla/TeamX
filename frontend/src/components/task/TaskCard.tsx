import React from 'react';
import { Task } from '../../services/taskService';

interface Props {
    task: Task;
    onClick: () => void;
}

const priorityColors: { [key: string]: string } = {
    'LOW': '#4CAF50',
    'MEDIUM': '#FF9800',
    'HIGH': '#f44336',
    'URGENT': '#9C27B0',
};

const statusColors: { [key: string]: { background: string; color: string } } = {
    'TODO': { background: '#fef3c7', color: '#92400e' },
    'IN_PROGRESS': { background: '#dbeafe', color: '#1d4ed8' },
    'DONE': { background: '#dcfce7', color: '#166534' },
};

const TaskCard: React.FC<Props> = ({ task, onClick }) => {
    return (
        <div
            onClick={onClick}
            style={{
                background: 'white',
                border: '1px solid #ddd',
                borderRadius: 4,
                padding: 10,
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}
        >
            <div style={{ fontWeight: 500, marginBottom: 4 }}>{task.title}</div>
            <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>{task.description?.substring(0, 60)}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <div style={{ fontSize: 11, color: priorityColors[task.priority] || '#999', fontWeight: 500 }}>
                    {task.priority}
                </div>
                {statusColors[task.status] && (
                    <span style={{ ...statusStyle, ...statusColors[task.status] }}>{task.status}</span>
                )}
                {task.dueDate && <div style={{ fontSize: 11, color: '#999' }}>{new Date(task.dueDate).toLocaleDateString()}</div>}
            </div>
        </div>
    );
};

const statusStyle: React.CSSProperties = {
    borderRadius: 999,
    fontSize: 10,
    fontWeight: 700,
    padding: '3px 7px',
};

export default TaskCard;
