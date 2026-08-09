import React from 'react';
import { Task } from '../../services/taskService';
import TaskCard from './TaskCard';

interface Props {
    status: string;
    tasks: Task[];
    onTaskClick: (task: Task) => void;
}

const taskStatusLabels: { [key: string]: string } = {
    'TODO': 'To Do',
    'IN_PROGRESS': 'In Progress',
    'IN_REVIEW': 'In Review',
    'DONE': 'Done',
};

const taskStatusPills: { [key: string]: string } = {
    'TODO': 'badge-pill--amber',
    'IN_PROGRESS': 'badge-pill--indigo',
    'IN_REVIEW': 'badge-pill--cyan',
    'DONE': 'badge-pill--emerald',
};

const TaskColumn: React.FC<Props> = ({ status, tasks, onTaskClick }) => {
    const filtered = tasks.filter(t => t.status === status);
    const pillClass = taskStatusPills[status] || 'badge-pill--indigo';

    return (
        <div
            style={{
                flex: 1,
                minWidth: 0,
                background: 'rgba(248, 250, 252, 0.95)',
                border: '1px solid rgba(226, 232, 240, 0.8)',
                borderRadius: '16px',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column'
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid #e2e8f0' }}>
                <span style={{ fontWeight: 700, fontSize: 13, color: '#1e293b' }}>{taskStatusLabels[status]}</span>
                <span className={`badge-pill ${pillClass}`} style={{ padding: '2px 8px', fontSize: '11px' }}>{filtered.length}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minHeight: 180, maxHeight: 600, overflowY: 'auto' }}>
                {filtered.length === 0 ? (
                    <div style={emptyStyle}>No tasks in this column</div>
                ) : (
                    filtered.map(task => (
                        <TaskCard key={task.id} task={task} onClick={() => onTaskClick(task)} />
                    ))
                )}
            </div>
        </div>
    );
};

const emptyStyle: React.CSSProperties = {
    border: '1px dashed #cbd5e1',
    borderRadius: '12px',
    color: '#94a3b8',
    padding: '24px 12px',
    textAlign: 'center',
    fontSize: '12px',
    fontWeight: 500,
    background: '#ffffff'
};

export default TaskColumn;
