import React from 'react';
import { Task } from '../../services/taskService';
import TaskColumn from './TaskColumn';

interface Props {
    tasks: Task[];
    onTaskClick: (task: Task) => void;
}

const KanbanBoard: React.FC<Props> = ({ tasks, onTaskClick }) => {
    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12, width: '100%' }}>
            <TaskColumn status="TODO" tasks={tasks} onTaskClick={onTaskClick} />
            <TaskColumn status="IN_PROGRESS" tasks={tasks} onTaskClick={onTaskClick} />
            <TaskColumn status="IN_REVIEW" tasks={tasks} onTaskClick={onTaskClick} />
            <TaskColumn status="DONE" tasks={tasks} onTaskClick={onTaskClick} />
        </div>
    );
};

export default KanbanBoard;
