import React, { useState, useEffect } from 'react';
import { Task, taskService } from '../../services/taskService';
import { getUsers } from '../../api/userApi';
import Loader from '../ui/Loader';

interface Props {
    projectId: number;
    task?: Task | null;
    onClose: () => void;
    onSaved: (task: Task) => void;
    users?: Array<{ id: number; name: string; email: string; role: string; status: string }>;
}

const TaskModal: React.FC<Props> = ({ projectId, task, onClose, onSaved, users: initialUsers = [] }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState('TODO');
    const [priority, setPriority] = useState('MEDIUM');
    const [dueDate, setDueDate] = useState('');
    const [assignedTo, setAssignedTo] = useState('');
    const [users, setUsers] = useState(initialUsers);
    const [loading, setLoading] = useState(false);
    const [loadingUsers, setLoadingUsers] = useState(initialUsers.length === 0);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadUsers = async () => {
            if (initialUsers.length > 0) {
                setUsers(initialUsers);
                setLoadingUsers(false);
                return;
            }

            setLoadingUsers(true);
            try {
                const data = await getUsers();
                setUsers(data);
            } catch {
                setUsers([]);
            } finally {
                setLoadingUsers(false);
            }
        };

        loadUsers();
    }, [initialUsers]);

    useEffect(() => {
        if (task) {
            setTitle(task.title);
            setDescription(task.description || '');
            setStatus(task.status);
            setPriority(task.priority);
            setDueDate(task.dueDate || '');
            setAssignedTo(task.assignedTo ? String(task.assignedTo) : '');
        }
    }, [task]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const data = { title, description, status, priority, dueDate, assignedTo: assignedTo ? Number(assignedTo) : undefined };
            let result: Task;
            if (task?.id) {
                result = await taskService.update(projectId, task.id, data);
            } else {
                result = await taskService.create(projectId, data);
            }
            onSaved(result);
            onClose();
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Failed to save task');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-card">
                <h2>{task?.id ? 'Edit Task' : 'Create Task'}</h2>
                {error && <div className="form-error">{error}</div>}
                {loadingUsers ? <Loader label="Loading members..." /> : null}
                <form onSubmit={handleSubmit}>
                    <div className="form-row">
                        <label htmlFor="task-title">Title</label>
                        <input id="task-title" required className="form-input" value={title} onChange={(e) => setTitle(e.target.value)} />
                    </div>
                    <div className="form-row">
                        <label htmlFor="task-description">Description</label>
                        <textarea id="task-description" className="form-input form-textarea" value={description} onChange={(e) => setDescription(e.target.value)} />
                    </div>
                    <div className="form-row form-row--split">
                        <div className="form-column">
                            <label htmlFor="task-status">Status</label>
                            <select id="task-status" className="form-input" value={status} onChange={(e) => setStatus(e.target.value)}>
                                <option value="TODO">To Do</option>
                                <option value="IN_PROGRESS">In Progress</option>
                                <option value="IN_REVIEW">In Review</option>
                                <option value="DONE">Done</option>
                            </select>
                        </div>
                        <div className="form-column">
                            <label htmlFor="task-priority">Priority</label>
                            <select id="task-priority" className="form-input" value={priority} onChange={(e) => setPriority(e.target.value)}>
                                <option value="LOW">Low</option>
                                <option value="MEDIUM">Medium</option>
                                <option value="HIGH">High</option>
                                <option value="URGENT">Urgent</option>
                            </select>
                        </div>
                    </div>
                    <div className="form-row">
                        <label htmlFor="task-due-date">Due Date</label>
                        <input id="task-due-date" type="date" className="form-input" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                    </div>
                    <div className="form-row">
                        <label htmlFor="task-assigned-to">Assigned To</label>
                        <select id="task-assigned-to" className="form-input" value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)}>
                            <option value="">Unassigned</option>
                            {users.map((member) => (
                                <option key={member.id} value={member.id}>{member.name} ({member.email})</option>
                            ))}
                        </select>
                    </div>
                    <div className="modal-actions">
                        <button type="button" onClick={onClose}>Cancel</button>
                        <button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TaskModal;
