import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectService, Project } from '../../services/projectService';
import { Task, taskService } from '../../services/taskService';
import { usePermissions } from '../../hooks/usePermissions';
import KanbanBoard from '../../components/task/KanbanBoard';
import TaskModal from '../../components/task/TaskModal';
import Loader from '../../components/ui/Loader';
import ErrorMessage from '../../components/ui/ErrorMessage';
import EmptyState from '../../components/ui/EmptyState';
import ActivityLog from '../../components/activity/ActivityLog';
import NavBar from '../../components/Layout/NavBar';
import Sidebar from '../../components/Layout/Sidebar';
import { getUsers } from '../../api/userApi';
import { recordActivity, recordNotification } from '../../utils/activityStore';
import { ArrowLeft, Plus, FolderKanban, Filter, Calendar } from 'lucide-react';

type UserOption = {
    id: number;
    name: string;
    email: string;
    role: string;
    status: string;
};

const ProjectDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
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

    return (
        <div className="route-shell">
            <NavBar />
            <div style={{ display: 'flex' }}>
                <Sidebar />
                <main className="page-shell">
                    <button
                        onClick={() => navigate('/projects')}
                        className="btn-secondary"
                        style={{ marginBottom: 20, padding: '6px 14px', fontSize: 13 }}
                    >
                        <ArrowLeft size={16} />
                        <span>Back to Projects</span>
                    </button>

                    {loading ? (
                        <Loader label="Loading project details..." />
                    ) : error ? (
                        <ErrorMessage message={error} />
                    ) : !project ? (
                        <EmptyState title="Project not found" description="The requested project could not be loaded." />
                    ) : (
                        <>
                            <div className="page-header" style={{ marginBottom: 24 }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                                        <h1 className="page-title">{project.name}</h1>
                                        <span className="badge-pill badge-pill--indigo">{project.status || 'Active'}</span>
                                    </div>
                                    <p className="page-subtitle">{project.description || 'No description provided.'}</p>
                                </div>
                                {canCreateTask && (
                                    <button onClick={handleCreateClick} className="btn-primary">
                                        <Plus size={18} />
                                        <span>Add Task</span>
                                    </button>
                                )}
                            </div>

                            {/* Filters Bar */}
                            <div className="surface-card" style={{ padding: '16px 20px', marginBottom: 28, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: '#334155' }}>
                                    <Filter size={16} className="text-indigo-500" />
                                    <span>Filter Tasks:</span>
                                </div>

                                <div style={{ flex: 1, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                                    <select
                                        id="task-status-filter"
                                        value={taskStatusFilter}
                                        onChange={(e) => setTaskStatusFilter(e.target.value)}
                                        className="select-field"
                                        style={{ width: 'auto', minWidth: 160 }}
                                    >
                                        <option value="ALL">All Statuses</option>
                                        <option value="TODO">To Do</option>
                                        <option value="IN_PROGRESS">In Progress</option>
                                        <option value="IN_REVIEW">In Review</option>
                                        <option value="DONE">Done</option>
                                    </select>

                                    <select
                                        id="task-assignee-filter"
                                        value={taskAssigneeFilter}
                                        onChange={(e) => setTaskAssigneeFilter(e.target.value)}
                                        className="select-field"
                                        style={{ width: 'auto', minWidth: 160 }}
                                    >
                                        <option value="ALL">All Assignees</option>
                                        <option value="UNASSIGNED">Unassigned</option>
                                        {members.map((member) => (
                                            <option key={member.id} value={member.id}>{member.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Task Board Section */}
                            {tasksLoading ? (
                                <Loader label="Loading task board..." />
                            ) : filteredTasks.length === 0 ? (
                                <EmptyState title="No tasks match filter" description="Create a task or change active status/assignee filters." />
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

                            <div className="project-activity" style={{ marginTop: 40 }}>
                                <ActivityLog projectId={projectId} title="Project Activity & Audit Trail" />
                            </div>
                        </>
                    )}
                </main>
            </div>
        </div>
    );
};

export default ProjectDetails;
