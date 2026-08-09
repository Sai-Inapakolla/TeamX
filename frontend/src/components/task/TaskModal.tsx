import React, { useState, useEffect } from 'react';
import { Task, taskService } from '../../services/taskService';
import { getUsers } from '../../api/userApi';
import { recordActivity, recordNotification } from '../../utils/activityStore';
import Loader from '../ui/Loader';
import { CheckSquare, X, ShieldAlert } from 'lucide-react';
import usePermissions from '../../hooks/usePermissions';

interface Props {
    projectId: number;
    task?: Task | null;
    onClose: () => void;
    onSaved: (task: Task) => void;
    users?: Array<{ id: number; name: string; email: string; role: string; status: string }>;
}

const TaskModal: React.FC<Props> = ({ projectId, task, onClose, onSaved, users: initialUsers = [] }) => {
    const { role: userRole } = usePermissions();
    const isEmployee = userRole === 'EMPLOYEE' || userRole === 'USER';
    const isManager = userRole === 'MANAGER';

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [department, setDepartment] = useState('Frontend');
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
            setDepartment(task.department || 'Frontend');
            setStatus(task.status);
            setPriority(task.priority);
            setDueDate(task.dueDate || '');
            setAssignedTo(task.assignedTo ? String(task.assignedTo) : '');
        }
    }, [task]);

    // Filter assignable users based on role and selected department
    const assignableUsers = users.filter((member) => {
        if (isManager) {
            const memberRole = (member.role || '').toUpperCase();
            return memberRole === 'EMPLOYEE' || memberRole === 'USER';
        }
        return true;
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const data = { title, description, department, status, priority, dueDate, assignedTo: assignedTo ? Number(assignedTo) : undefined };
            let result: Task;
            if (task?.id) {
                result = await taskService.update(projectId, task.id, data);
                recordActivity({
                    message: `Updated task "${result.title}" in ${result.department || department} (${result.priority} priority, status: ${result.status})`,
                    projectId,
                    taskId: result.id,
                    type: 'task_updated',
                    meta: { department, priority, status }
                });
                recordNotification({
                    message: `Task #${result.id} "${result.title}" was updated`,
                    projectId
                });
            } else {
                if (isEmployee) {
                    setError('Employees cannot create new tasks. Contact your manager or admin.');
                    setLoading(false);
                    return;
                }
                result = await taskService.create(projectId, data);
                recordActivity({
                    message: `Created task "${result.title}" in ${result.department || department} (${result.priority} priority)`,
                    projectId,
                    taskId: result.id,
                    type: 'task_created',
                    meta: { department, priority, status }
                });
                recordNotification({
                    message: `New task created: "${result.title}"`,
                    projectId
                });
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', display: 'grid', placeItems: 'center' }}>
                            <CheckSquare size={20} />
                        </div>
                        <h2 style={{ margin: 0 }}>{task?.id ? 'Edit Task' : 'Create New Task'}</h2>
                    </div>
                    <button type="button" onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8' }}>
                        <X size={20} />
                    </button>
                </div>

                {isEmployee && (
                    <div style={{ padding: '10px 14px', borderRadius: 10, background: '#fef3c7', border: '1px solid #fcd34d', color: '#92400e', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                        <ShieldAlert size={16} />
                        <span>Employee Role: You can update the completion status only.</span>
                    </div>
                )}

                {isManager && (
                    <div style={{ padding: '10px 14px', borderRadius: 10, background: '#e0e7ff', border: '1px solid #c7d2fe', color: '#3730a3', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                        <CheckSquare size={16} />
                        <span>Manager Role: Tasks can be assigned to Employees only.</span>
                    </div>
                )}

                {error && <div className="form-error">{error}</div>}
                {loadingUsers ? <Loader label="Loading members..." /> : null}

                <form onSubmit={handleSubmit}>
                    <div className="form-row">
                        <label htmlFor="task-title">Task Title</label>
                        <input
                            id="task-title"
                            required
                            disabled={isEmployee}
                            className="form-input"
                            placeholder="e.g. Build AI Summary Panel"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>
                    <div className="form-row">
                        <label htmlFor="task-description">Description</label>
                        <textarea
                            id="task-description"
                            disabled={isEmployee}
                            className="form-input form-textarea"
                            placeholder="Task implementation details..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>
                    <div className="form-row form-row--split">
                        <div className="form-column">
                            <label htmlFor="task-department">Department / Team</label>
                            <select id="task-department" disabled={isEmployee} className="form-input" value={department} onChange={(e) => setDepartment(e.target.value)}>
                                <option value="Frontend">Frontend</option>
                                <option value="Backend">Backend</option>
                                <option value="QA">QA</option>
                                <option value="DevOps">DevOps</option>
                                <option value="Management">Management</option>
                                <option value="Admin">Admins</option>
                                <option value="Worker">Workers</option>
                            </select>
                        </div>
                        <div className="form-column">
                            <label htmlFor="task-status">Status (Completion)</label>
                            <select id="task-status" className="form-input" value={status} onChange={(e) => setStatus(e.target.value)}>
                                <option value="TODO">To Do</option>
                                <option value="IN_PROGRESS">In Progress</option>
                                <option value="IN_REVIEW">In Review</option>
                                <option value="DONE">Done</option>
                            </select>
                        </div>
                    </div>
                    <div className="form-row form-row--split">
                        <div className="form-column">
                            <label htmlFor="task-priority">Priority</label>
                            <select id="task-priority" disabled={isEmployee} className="form-input" value={priority} onChange={(e) => setPriority(e.target.value)}>
                                <option value="LOW">Low</option>
                                <option value="MEDIUM">Medium</option>
                                <option value="HIGH">High</option>
                                <option value="URGENT">Urgent</option>
                            </select>
                        </div>
                        <div className="form-column">
                            <label htmlFor="task-due-date">Due Date</label>
                            <input id="task-due-date" disabled={isEmployee} type="date" className="form-input" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                        </div>
                    </div>
                    <div className="form-row">
                        <label htmlFor="task-assigned-to">Assigned To</label>
                        <select id="task-assigned-to" disabled={isEmployee} className="form-input" value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)}>
                            <option value="">Unassigned</option>
                            {assignableUsers.map((member) => (
                                <option key={member.id} value={member.id}>{member.name} ({member.email})</option>
                            ))}
                        </select>
                    </div>
                    <div className="modal-actions">
                        <button type="button" onClick={onClose}>Cancel</button>
                        <button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Task'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TaskModal;
