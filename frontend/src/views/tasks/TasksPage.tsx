import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, FolderKanban, Plus, SlidersHorizontal, Users } from 'lucide-react';
import { projectService, Project } from '../../services/projectService';
import { Task, taskService } from '../../services/taskService';
import TaskModal from '../../components/task/TaskModal';
import KanbanBoard from '../../components/task/KanbanBoard';
import Loader from '../../components/ui/Loader';
import ErrorMessage from '../../components/ui/ErrorMessage';
import EmptyState from '../../components/ui/EmptyState';
import ActivityLog from '../../components/activity/ActivityLog';
import NavBar from '../../components/Layout/NavBar';
import Sidebar from '../../components/Layout/Sidebar';
import { getUsers } from '../../api/userApi';
import { recordActivity, recordNotification } from '../../utils/activityStore';

interface Member {
    id: number;
    name: string;
    email: string;
    role: string;
    status: string;
}

const TasksPage: React.FC = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [members, setMembers] = useState<Member[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [tasksLoading, setTasksLoading] = useState(false);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [assigneeFilter, setAssigneeFilter] = useState('ALL');
    const [search, setSearch] = useState('');

    const loadWorkspace = async () => {
        setLoading(true);
        setError('');
        try {
            const [projectData, userData] = await Promise.all([projectService.getAll(), getUsers()]);
            setProjects(projectData);
            setMembers(userData);
            if (!selectedProjectId && projectData.length > 0) {
                setSelectedProjectId(projectData[0].id);
            }
        } catch (err: any) {
            setError(err?.response?.data?.message || err?.message || 'Failed to load projects and members');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadWorkspace();
    }, []);

    useEffect(() => {
        const loadTasks = async () => {
            if (!selectedProjectId) {
                setTasks([]);
                return;
            }

            setTasksLoading(true);
            setError('');
            try {
                const data = await taskService.getByProject(selectedProjectId);
                setTasks(data);
            } catch (err: any) {
                setError(err?.response?.data?.message || err?.message || 'Failed to load tasks');
            } finally {
                setTasksLoading(false);
            }
        };

        loadTasks();
    }, [selectedProjectId]);

    const selectedProject = useMemo(() => projects.find((project) => project.id === selectedProjectId) || null, [projects, selectedProjectId]);

    const visibleTasks = useMemo(() => {
        const normalizedSearch = search.trim().toLowerCase();
        return tasks.filter((task) => {
            const matchesSearch =
                normalizedSearch.length === 0 ||
                task.title.toLowerCase().includes(normalizedSearch) ||
                (task.description || '').toLowerCase().includes(normalizedSearch);
            const matchesStatus = statusFilter === 'ALL' || task.status === statusFilter;
            const matchesAssignee =
                assigneeFilter === 'ALL' ||
                (assigneeFilter === 'UNASSIGNED' && !task.assignedTo) ||
                String(task.assignedTo || '') === assigneeFilter;
            return matchesSearch && matchesStatus && matchesAssignee;
        });
    }, [assigneeFilter, search, statusFilter, tasks]);

    const stats = useMemo(() => {
        const todo = tasks.filter((task) => task.status === 'TODO').length;
        const inProgress = tasks.filter((task) => task.status === 'IN_PROGRESS').length;
        const review = tasks.filter((task) => task.status === 'IN_REVIEW').length;
        const done = tasks.filter((task) => task.status === 'DONE').length;
        return [
            { label: 'To Do', value: todo },
            { label: 'In Progress', value: inProgress },
            { label: 'In Review', value: review },
            { label: 'Done', value: done },
        ];
    }, [tasks]);

    const handleTaskClick = (task: Task) => {
        setSelectedTask(task);
        setShowModal(true);
    };

    const handleCreateClick = () => {
        setSelectedTask(null);
        setShowModal(true);
    };

    const handleTaskSaved = (task: Task) => {
        const index = tasks.findIndex((item) => item.id === task.id);
        const previous = index >= 0 ? tasks[index] : null;
        if (index >= 0) {
            const updated = [...tasks];
            updated[index] = task;
            setTasks(updated);
        } else {
            setTasks((current) => [task, ...current]);
        }

        recordActivity({
            message: `${previous ? 'Updated' : 'Created'} task "${task.title}"`,
            projectId: selectedProjectId || undefined,
            type: previous ? 'task_updated' : 'task_created',
        });
        recordNotification({ message: previous ? `Task updated: ${task.title}` : `Task created: ${task.title}`, projectId: selectedProjectId || undefined });
        if (!previous && task.assignedTo) {
            const assignee = members.find((member) => member.id === task.assignedTo);
            recordNotification({ message: `Task assigned to ${assignee?.name || 'a teammate'}: ${task.title}`, projectId: selectedProjectId || undefined });
        }
    };

    const openProjectLink = selectedProjectId ? `/projects/${selectedProjectId}` : '/projects';

    return (
        <div className="route-shell">
            <NavBar />
            <div style={{ display: 'flex' }}>
                <Sidebar />
                <main className="page-shell min-h-screen">
            <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-lime-50 px-3 py-1 text-sm font-semibold text-lime-700">
                            <CheckCircle2 size={16} />
                            Task hub
                        </div>

                        <h1 className="text-3xl font-bold text-slate-950">Tasks</h1>
                        <p className="page-muted max-w-3xl">Browse a project board, create tasks, and inspect the work queue without jumping back into a single project view.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Link to={openProjectLink} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                            <FolderKanban size={16} />
                            Open project
                        </Link>
                        <button onClick={handleCreateClick} className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800">
                            <Plus size={16} />
                            New task
                        </button>
                    </div>
                </div>
            </div>

            {loading ? (
                <Loader label="Loading task workspace..." />
            ) : error && projects.length === 0 ? (
                <ErrorMessage message={error} />
            ) : projects.length === 0 ? (
                <EmptyState title="No projects found" description="Create a project first to start organizing tasks." />
            ) : (
                <>
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        {stats.map((stat) => (
                            <div key={stat.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="grid h-11 w-11 place-items-center rounded-2xl bg-cyan-50 text-cyan-700">
                                        <SlidersHorizontal size={18} />
                                    </div>
                                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Board</span>
                                </div>
                                <div className="mt-4 text-3xl font-bold text-slate-950">{stat.value}</div>
                                <div className="mt-1 text-sm font-semibold text-slate-700">{stat.label}</div>
                                <div className="mt-1 text-sm text-slate-500">Tasks in the current project</div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
                        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-950">Project board</h2>
                                    <p className="text-sm text-slate-500">Select a project, filter the backlog, and open any card to edit it.</p>
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, width: '100%', marginTop: 12 }}>
                                    <select title="Select project" className="select-field" style={{ flex: '1 1 160px', minWidth: 150 }} value={selectedProjectId || ''} onChange={(event) => setSelectedProjectId(Number(event.target.value))}>
                                        {projects.map((project) => (
                                            <option key={project.id} value={project.id}>{project.name}</option>
                                        ))}
                                    </select>
                                    <input className="search-input" style={{ flex: '1.5 1 180px', minWidth: 170, marginBottom: 0 }} placeholder="Search tasks..." value={search} onChange={(event) => setSearch(event.target.value)} />
                                    <select title="Filter tasks by status" className="select-field" style={{ flex: '1 1 140px', minWidth: 130 }} value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                                        <option value="ALL">All statuses</option>
                                        <option value="TODO">To Do</option>
                                        <option value="IN_PROGRESS">In Progress</option>
                                        <option value="IN_REVIEW">In Review</option>
                                        <option value="DONE">Done</option>
                                    </select>
                                    <select title="Filter tasks by assignee" className="select-field" style={{ flex: '1 1 140px', minWidth: 130 }} value={assigneeFilter} onChange={(event) => setAssigneeFilter(event.target.value)}>
                                        <option value="ALL">All assignees</option>
                                        <option value="UNASSIGNED">Unassigned</option>
                                        {members.map((member) => (
                                            <option key={member.id} value={member.id}>{member.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {tasksLoading ? (
                                <Loader label="Loading tasks..." />
                            ) : visibleTasks.length === 0 ? (
                                <EmptyState title="No tasks match the current filters" description="Try a different project or clear the filters." />
                            ) : (
                                <KanbanBoard tasks={visibleTasks} onTaskClick={handleTaskClick} />
                            )}
                        </section>

                        <aside className="grid gap-6">
                            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                                <div className="mb-4 flex items-center gap-3">
                                    <div className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-950 text-white">
                                        <Users size={18} />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-slate-950">Project context</h2>
                                        <p className="text-sm text-slate-500">The current project and its people</p>
                                    </div>
                                </div>
                                <div className="grid gap-3">
                                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                        <div className="text-sm font-semibold text-slate-900">{selectedProject?.name || 'Select a project'}</div>
                                        <div className="mt-1 text-sm text-slate-500">{selectedProject?.description || 'Project details appear here once a project is selected.'}</div>
                                    </div>
                                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                        <div className="text-sm font-semibold text-slate-900">{members.length} members loaded</div>
                                        <div className="mt-1 text-sm text-slate-500">Tasks can be assigned to any member in the selected workspace.</div>
                                    </div>
                                </div>
                            </section>

                            <ActivityLog title="Task activity" projectId={selectedProjectId} />
                        </aside>
                    </div>
                </>
            )}

            {showModal && selectedProjectId != null && (
                <TaskModal
                    projectId={selectedProjectId}
                    task={selectedTask}
                    onClose={() => {
                        setShowModal(false);
                        setSelectedTask(null);
                    }}
                    onSaved={handleTaskSaved}
                    users={members}
                />
            )}
                </main>
            </div>
        </div>
    );
};

export default TasksPage;
