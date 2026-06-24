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

const taskStatusColors: { [key: string]: { background: string; color: string } } = {
    'TODO': { background: '#fef3c7', color: '#92400e' },
    'IN_PROGRESS': { background: '#dbeafe', color: '#1d4ed8' },
    'IN_REVIEW': { background: '#ede9fe', color: '#6d28d9' },
    'DONE': { background: '#dcfce7', color: '#166534' },
};

const TaskColumn: React.FC<Props> = ({ status, tasks, onTaskClick }) => {
    const filtered = tasks.filter(t => t.status === status);
    const colors = taskStatusColors[status] || { background: '#f3f4f6', color: '#374151' };

    return (
        <div style={{ flex: 1, minWidth: 280, background: '#f5f5f5', borderRadius: 8, padding: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{taskStatusLabels[status]}</span>
                <span style={{ ...badgeStyle, background: colors.background, color: colors.color }}>{filtered.length}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minHeight: 200, maxHeight: 600, overflowY: 'auto' }}>
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

const badgeStyle: React.CSSProperties = {
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
    minWidth: 28,
    padding: '4px 8px',
    textAlign: 'center',
};

const emptyStyle: React.CSSProperties = {
    border: '1px dashed #d1d5db',
    borderRadius: 8,
    color: '#6b7280',
    padding: 16,
    textAlign: 'center',
};

export default TaskColumn;
