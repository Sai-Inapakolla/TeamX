import React from 'react';
import { Task } from '../../services/taskService';
import TaskColumn from './TaskColumn';

interface Props {
    tasks: Task[];
    onTaskClick: (task: Task) => void;
}

const KanbanBoard: React.FC<Props> = ({ tasks, onTaskClick }) => {
    return (
        <div style={{ display: 'flex', gap: 16, padding: 12, overflowX: 'auto', minHeight: 400 }}>
            <TaskColumn status="TODO" tasks={tasks} onTaskClick={onTaskClick} />
            <TaskColumn status="IN_PROGRESS" tasks={tasks} onTaskClick={onTaskClick} />
            <TaskColumn status="IN_REVIEW" tasks={tasks} onTaskClick={onTaskClick} />
            <TaskColumn status="DONE" tasks={tasks} onTaskClick={onTaskClick} />
        </div>
    );
};

export default KanbanBoard;
