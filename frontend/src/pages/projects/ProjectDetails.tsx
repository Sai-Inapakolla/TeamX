import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { projectService, Project } from '../../services/projectService';
import { Task, taskService } from '../../services/taskService';
import { usePermissions } from '../../hooks/usePermissions';
import KanbanBoard from '../../components/task/KanbanBoard';
import TaskModal from '../../components/task/TaskModal';
import Loader from '../../components/ui/Loader';
import ErrorMessage from '../../components/ui/ErrorMessage';
import EmptyState from '../../components/ui/EmptyState';
import ActivityLog from '../../components/activity/ActivityLog';
import { getUsers } from '../../api/userApi';
import { recordActivity, recordNotification } from '../../utils/activityStore';

type UserOption = {
    id: number;
    name: string;
    email: string;
    role: string;
    status: string;
};

const ProjectDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [project, setProject] = useState<Project | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [tasksLoading, setTasksLoading] = useState(false);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [members, setMembers] = useState<UserOption[]>([]);
    const [taskStatusFilter, setTaskStatusFilter] = useState('ALL');
    const [taskAssigneeFilter, setTaskAssigneeFilter] = useState('ALL');
    const { can } = usePermissions();

    const canCreateTask = can('create_task');

    const projectId = id ? Number(id) : null;

    useEffect(() => {
        const load = async () => {
            setError('');
            setLoading(true);
            try {
                if (projectId) {
                    const proj = await projectService.getById(projectId);
                    setProject(proj);
                    const users = await getUsers();
                    setMembers(users);
                    await loadTasks();
                }
            } catch (err: any) {
                setError(err?.response?.data?.message || 'Failed to load project');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [projectId]);

    const loadTasks = async () => {
        if (!projectId) return;
        setTasksLoading(true);
        try {
            const data = await taskService.getByProject(projectId);
            setTasks(data);
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Failed to load tasks');
        } finally {
            setTasksLoading(false);
        }
    };

    const handleTaskClick = (task: Task) => {
        setSelectedTask(task);
        setShowModal(true);
    };

    const handleCreateClick = () => {
        setSelectedTask(null);
        setShowModal(true);
    };

    const handleTaskSaved = (task: Task) => {
        // Update or add to list
        const idx = tasks.findIndex(t => t.id === task.id);
        const previous = idx >= 0 ? tasks[idx] : null;
        if (idx >= 0) {
            const updated = [...tasks];
            updated[idx] = task;
            setTasks(updated);
        } else {
            setTasks(prev => [task, ...prev]);
        }

        const action = previous ? 'Updated' : 'Created';
        recordActivity({ message: `${action} task "${task.title}"`, projectId: projectId || undefined, type: previous ? 'task_updated' : 'task_created' });
        recordNotification({ message: previous ? `Task updated: ${task.title}` : `Task created: ${task.title}`, projectId: projectId || undefined });
        if (!previous && task.assignedTo) {
            const assignee = members.find((member) => member.id === task.assignedTo);
            recordNotification({ message: `Task assigned to ${assignee?.name || 'a member'}: ${task.title}`, projectId: projectId || undefined });
        }
    };

    const filteredTasks = tasks.filter((task) => {
        const statusMatch = taskStatusFilter === 'ALL' || task.status === taskStatusFilter;
        const assigneeMatch = taskAssigneeFilter === 'ALL'
            || (taskAssigneeFilter === 'UNASSIGNED' && !task.assignedTo)
            || String(task.assignedTo || '') === taskAssigneeFilter;
        return statusMatch && assigneeMatch;
    });

    if (loading) return <Loader label="Loading project..." />;
    if (error) return <div className="page-shell"><ErrorMessage message={error} /></div>;
    if (!project) return <div className="page-shell"><EmptyState title="Project not found" description="The requested project could not be loaded." /></div>;

    return (
        <div className="page-shell project-details-page">
            <div className="page-header page-header--stacked">
                <div>
                    <h1>{project.name}</h1>
                    <p className="page-muted">{project.description}</p>
                </div>
                {canCreateTask && (
                    <button onClick={handleCreateClick} className="button-primary button-primary--compact">
                        + Add Task
                    </button>
                )}
            </div>

            <div className="project-filters">
                <label className="sr-only" htmlFor="task-status-filter">Filter tasks by status</label>
                <select id="task-status-filter" value={taskStatusFilter} onChange={(e) => setTaskStatusFilter(e.target.value)} className="select-field">
                    <option value="ALL">All statuses</option>
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="IN_REVIEW">In Review</option>
                    <option value="DONE">Done</option>
                </select>
                <label className="sr-only" htmlFor="task-assignee-filter">Filter tasks by assignee</label>
                <select id="task-assignee-filter" value={taskAssigneeFilter} onChange={(e) => setTaskAssigneeFilter(e.target.value)} className="select-field">
                    <option value="ALL">All assignees</option>
                    <option value="UNASSIGNED">Unassigned</option>
                    {members.map((member) => (
                        <option key={member.id} value={member.id}>{member.name}</option>
                    ))}
                </select>
            </div>

            {tasksLoading ? (
                <Loader label="Loading tasks..." />
            ) : filteredTasks.length === 0 ? (
                <EmptyState title="No tasks in this column" description="Create a task to get started or adjust your filters." />
            ) : (
                <KanbanBoard tasks={filteredTasks} onTaskClick={handleTaskClick} />
            )}

            {showModal && (
                <TaskModal
                    projectId={projectId!}
                    task={selectedTask}
                    onClose={() => { setShowModal(false); setSelectedTask(null); }}
                    onSaved={handleTaskSaved}
                    users={members}
                />
            )}

            <div className="project-activity">
                <ActivityLog projectId={projectId} title="Project Activity" />
            </div>
        </div>
    );
};

export default ProjectDetails;
