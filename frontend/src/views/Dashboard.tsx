import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    Activity,
    AlertTriangle,
    ArrowUpRight,
    BarChart3,
    Bell,
    Bot,
    CalendarDays,
    CheckCircle2,
    CircleDot,
    Clock3,
    Cpu,
    FolderKanban,
    Gauge,
    Layers,
    LogOut,
    MessageSquare,
    Plus,
    Search,
    ShieldCheck,
    Sparkles,
    Sun,
    TrendingUp,
    Users,
    Building2,
    Zap,
    X,
} from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { projectService, Project } from '../services/projectService';
import { taskService, Task } from '../services/taskService';
import { getUsers } from '../api/userApi';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { toUiRole } from '../utils/permissions';
import { getNotifications, markNotificationsRead } from '../utils/activityStore';
import Loader from '../components/ui/Loader';
import ErrorMessage from '../components/ui/ErrorMessage';
import EmptyState from '../components/ui/EmptyState';
import ActivityLog from '../components/activity/ActivityLog';
import TaskDetailModal from '../components/task/TaskDetailModal';
import NavBar from '../components/Layout/NavBar';
import Sidebar from '../components/Layout/Sidebar';
import '../styles/Dashboard.css';

type Metric = {
    label: string;
    value: string;
    helper: string;
    icon: React.ElementType;
    tone: string;
};

type BoardTask = {
    title: string;
    meta: string;
    priority: 'High' | 'Medium' | 'Low';
    assignee: string;
};

type DashboardNotification = {
    id: string;
    message: string;
    projectId?: number | string | null;
    createdAt: string;
    unread?: boolean;
};

const assistantItems = [
    'Two active projects have no review owner assigned.',
    'Velocity is trending up, but review work is collecting in one lane.',
    'Customer Portal Refresh needs a sharper launch checklist before Friday.',
];

const quickNav = [
    { label: 'Dashboard', icon: Gauge, to: 'dashboard' },
    { label: 'Projects', icon: FolderKanban, to: '/projects' },
    { label: 'Tasks', icon: CheckCircle2, to: '/tasks' },
    { label: 'Analytics', icon: BarChart3, to: '/analytics', reqPerm: 'PROJECT_READ' },
    { label: 'Team & Users', icon: Users, to: '/users', reqPerm: 'manage_users' },
    { label: 'Organization', icon: Building2, to: '/organization', reqPerm: 'tenant_settings' },
];

const Dashboard: React.FC = () => {
    const { hasPermission, logout, user, activeTenant } = useAuth();
    const { can } = usePermissions();
    const { companyId } = useParams<{ companyId: string }>();
    const navigate = useNavigate();
    const boardSectionRef = useRef<HTMLDivElement>(null);
    const assistantSectionRef = useRef<HTMLDivElement>(null);
    const canReadProjects = hasPermission('PROJECT_READ');
    const [projects, setProjects] = useState<Project[]>([]);
    const [liveTasks, setLiveTasks] = useState<Task[]>([]);
    const [teamMembers, setTeamMembers] = useState<any[]>([]);
    const [apiLatency, setApiLatency] = useState<number>(14);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [themeMode, setThemeMode] = useState(() => localStorage.getItem('teamx_theme') === 'dark' ? 'dark' : 'light');
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [notifications, setNotifications] = useState<DashboardNotification[]>(() => getNotifications());
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);

    useEffect(() => {
        document.documentElement.dataset.theme = themeMode;
        localStorage.setItem('teamx_theme', themeMode);
    }, [themeMode]);

    useEffect(() => {
        const refreshNotifications = () => setNotifications(getNotifications());
        refreshNotifications();
        window.addEventListener('teamx-notification-updated', refreshNotifications);
        return () => window.removeEventListener('teamx-notification-updated', refreshNotifications);
    }, []);

    useEffect(() => {
        if (canReadProjects) {
            loadProjects();
        } else {
            setLoading(false);
        }
    }, [canReadProjects]);

    const loadProjects = async () => {
        setError('');
        const t0 = performance.now();
        try {
            const data = await projectService.getAll();
            const t1 = performance.now();
            setApiLatency(Math.max(5, Math.round(t1 - t0)));
            setProjects(data || []);

            if (data && data.length > 0) {
                const taskPromises = data.map((p) => taskService.getByProject(p.id).catch(() => []));
                const taskResults = await Promise.all(taskPromises);
                setLiveTasks(taskResults.flat());
            } else {
                setLiveTasks([]);
            }

            try {
                const usersData = await getUsers();
                setTeamMembers(usersData || []);
            } catch {
                setTeamMembers([]);
            }
        } catch (error) {
            setError('Failed to load live projects.');
        } finally {
            setLoading(false);
        }
    };

    const activeProjectsCount = useMemo(() => projects.filter((p) => p.status === 'ACTIVE').length, [projects]);

    const dynamicBoardColumns = useMemo(() => {
        const backlog = liveTasks.filter((t) => t.status === 'BACKLOG' || t.status === 'TODO' || t.status === 'PLANNING' || !t.status);
        const inProgress = liveTasks.filter((t) => t.status === 'IN_PROGRESS');
        const review = liveTasks.filter((t) => t.status === 'REVIEW' || t.status === 'IN_REVIEW');
        const done = liveTasks.filter((t) => t.status === 'DONE' || t.status === 'COMPLETED');

        return {
            Backlog: backlog,
            'In Progress': inProgress,
            Review: review,
            Done: done,
        };
    }, [liveTasks]);

    const liveCompletedCount = useMemo(() => {
        return liveTasks.filter((t) => t.status === 'DONE' || t.status === 'COMPLETED').length;
    }, [liveTasks]);

    const liveReviewCount = useMemo(() => {
        return liveTasks.filter((t) => t.status === 'IN_PROGRESS' || t.status === 'REVIEW').length;
    }, [liveTasks]);

    const liveOpenCount = useMemo(() => {
        return liveTasks.filter((t) => t.status !== 'DONE' && t.status !== 'COMPLETED').length;
    }, [liveTasks]);

    const riskAlertsCount = useMemo(() => {
        return liveTasks.filter((t) => t.priority === 'HIGH' || t.priority === 'High' || t.priority === 'CRITICAL').length;
    }, [liveTasks]);

    const velocityRate = useMemo(() => {
        if (liveTasks.length === 0) return 0;
        return Math.round((liveCompletedCount / liveTasks.length) * 100);
    }, [liveCompletedCount, liveTasks.length]);

    const metrics: Metric[] = useMemo(
        () => [
            {
                label: 'Active Projects',
                value: String(activeProjectsCount),
                helper: `${projects.length} total tracked`,
                icon: FolderKanban,
                tone: 'bg-cyan-500/10 text-cyan-500 border border-cyan-500/20',
            },
            {
                label: 'Open Tasks',
                value: String(liveOpenCount),
                helper: `${liveTasks.length} total tasks`,
                icon: CheckCircle2,
                tone: 'bg-lime-500/10 text-lime-500 border border-lime-500/20',
            },
            {
                label: 'Team Velocity',
                value: `${velocityRate}%`,
                helper: `${liveCompletedCount} tasks completed`,
                icon: Activity,
                tone: 'bg-amber-500/10 text-amber-500 border border-amber-500/20',
            },
            {
                label: 'Risk Alerts',
                value: String(riskAlertsCount),
                helper: `${riskAlertsCount} high priority`,
                icon: AlertTriangle,
                tone: 'bg-rose-500/10 text-rose-500 border border-rose-500/20',
            },
        ],
        [activeProjectsCount, projects.length, liveOpenCount, liveTasks.length, velocityRate, liveCompletedCount, riskAlertsCount]
    );

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleThemeToggle = () => {
        setThemeMode((current) => (current === 'dark' ? 'light' : 'dark'));
    };

    const handleNotificationsToggle = () => {
        setNotificationsOpen((current) => {
            const nextOpen = !current;
            if (nextOpen) {
                markNotificationsRead();
            }
            return nextOpen;
        });
    };

    const handleNewTask = () => {
        navigate('/projects');
    };

    const handleAskAi = () => {
        setAiOpen(true);
    };

    const handleNotificationClick = (projectId?: DashboardNotification['projectId']) => {
        setNotificationsOpen(false);
        if (projectId != null) {
            navigate(`/projects/${projectId}`);
        }
    };

    const dashboardPath = companyId ? `/company/${companyId}/dashboard` : '/dashboard';

    return (
        <div className="route-shell">
            <NavBar />
            <div style={{ display: 'flex' }}>
                <Sidebar />
                <main className="page-shell" style={{ flex: 1, minWidth: 0, padding: 0 }}>
                    <div className="px-4 py-6 xl:px-8">
                        {/* Main Grid: Overview & Executive Control */}
                        <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
                            {/* Command Center Banner */}
                            <div className={themeMode === 'dark' ? 'rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-soft' : 'rounded-2xl border border-slate-200 bg-white p-6 shadow-soft'}>
                                <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                                    <div>
                                        <div className={themeMode === 'dark' ? 'mb-3 inline-flex items-center gap-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 px-3 py-1.5 text-xs font-bold text-cyan-400' : 'mb-3 inline-flex items-center gap-2 rounded-xl bg-cyan-50 border border-cyan-100 px-3 py-1.5 text-xs font-bold text-cyan-700'}>
                                            <Sparkles size={15} />
                                            {activeTenant?.role ? `${toUiRole(activeTenant.role)} Workspace` : 'Team Workspace'}
                                        </div>
                                        <h1 className={themeMode === 'dark' ? 'text-3xl font-extrabold tracking-tight text-slate-100 md:text-4xl' : 'text-3xl font-extrabold tracking-tight text-slate-950 md:text-4xl'}>
                                            {activeTenant?.name ? `${activeTenant.name} Command Center` : 'Team Command Center'}
                                        </h1>
                                        <p className={themeMode === 'dark' ? 'mt-3 max-w-2xl text-sm leading-6 text-slate-400' : 'mt-3 max-w-2xl text-sm leading-6 text-slate-600'}>
                                            Live project health, task movement, team availability, and key next actions in one focused workspace.
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap gap-2.5">
                                        <button onClick={handleNewTask} className={themeMode === 'dark' ? 'inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-bold text-slate-950 shadow-md shadow-cyan-500/20 transition hover:bg-cyan-400' : 'inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-slate-800'}>
                                            <Plus size={17} />
                                            New Task
                                        </button>
                                    </div>
                                </div>

                                {/* Metrics Cards */}
                                <div className="mt-6 grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
                                    {metrics.map((metric) => {
                                        const Icon = metric.icon;
                                        return (
                                            <div key={metric.label} className={themeMode === 'dark' ? 'rounded-xl border border-slate-800 bg-slate-950/60 p-4 transition hover:border-slate-700' : 'rounded-xl border border-slate-200/80 bg-slate-50/80 p-4 transition hover:border-slate-300 hover:bg-white'}>
                                                <div className="flex items-center justify-between gap-3">
                                                    <div className={`grid h-10 w-10 place-items-center rounded-xl ${metric.tone}`}>
                                                        <Icon size={18} />
                                                    </div>
                                                    <ArrowUpRight size={17} className="text-slate-400" />
                                                </div>
                                                <div className={themeMode === 'dark' ? 'mt-4 text-3xl font-extrabold text-slate-100' : 'mt-4 text-3xl font-extrabold text-slate-950'}>{metric.value}</div>
                                                <div className={themeMode === 'dark' ? 'mt-1 text-xs font-bold text-slate-300' : 'mt-1 text-xs font-bold text-slate-700'}>{metric.label}</div>
                                                <div className={themeMode === 'dark' ? 'mt-0.5 text-xs text-slate-400' : 'mt-0.5 text-xs text-slate-500'}>{metric.helper}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Executive Operations & System Health Widget (Replaces 3D System Map) */}
                            <div className={themeMode === 'dark' ? 'relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-soft' : 'relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-soft'}>
                                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-emerald-500/10 opacity-70 pointer-events-none" />
                                <div className="relative z-10 flex items-center justify-between">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <Cpu size={16} className="text-cyan-500" />
                                            <p className={themeMode === 'dark' ? 'text-xs font-bold uppercase tracking-wider text-cyan-400' : 'text-xs font-bold uppercase tracking-wider text-cyan-700'}>Executive Control</p>
                                        </div>
                                        <h2 className={themeMode === 'dark' ? 'mt-1 text-lg font-bold text-slate-100' : 'mt-1 text-lg font-bold text-slate-900'}>System & Operations</h2>
                                    </div>
                                    <div className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-500">
                                        <span className="relative flex h-2 w-2">
                                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                                            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                                        </span>
                                        Operational
                                    </div>
                                </div>

                                <div className="relative z-10 mt-4 grid gap-3.5">
                                    {/* Velocity Progress Bar */}
                                    <div className={themeMode === 'dark' ? 'rounded-xl border border-slate-800 bg-slate-950/60 p-3.5' : 'rounded-xl border border-slate-200/80 bg-slate-50 p-3.5'}>
                                        <div className="flex items-center justify-between text-xs font-bold">
                                            <span className={themeMode === 'dark' ? 'text-slate-300' : 'text-slate-700'}>Sprint Velocity & Completion</span>
                                            <span className="text-cyan-500 font-extrabold">{velocityRate}% Target</span>
                                        </div>
                                        <div className="mt-2.5 h-2.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                                            <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-500 transition-all duration-500" style={{ width: `${velocityRate}%` }} />
                                        </div>
                                        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                                            <span>Completed: {liveCompletedCount} tasks</span>
                                            <span>In Review: {liveReviewCount} tasks</span>
                                        </div>
                                    </div>

                                    {/* Live Specs */}
                                    <div className="grid grid-cols-2 gap-2.5">
                                        <div className={themeMode === 'dark' ? 'rounded-xl border border-slate-800 bg-slate-950/60 p-3' : 'rounded-xl border border-slate-200/80 bg-slate-50 p-3'}>
                                            <div className="flex items-center gap-1.5">
                                                <Zap size={14} className="text-amber-500" />
                                                <span className={themeMode === 'dark' ? 'text-xs text-slate-400' : 'text-xs text-slate-500'}>API Gateway</span>
                                            </div>
                                            <div className={themeMode === 'dark' ? 'mt-1 text-sm font-bold text-slate-100' : 'mt-1 text-sm font-bold text-slate-900'}>{apiLatency}ms <span className="text-[11px] font-semibold text-emerald-500">99.9%</span></div>
                                        </div>

                                        <div className={themeMode === 'dark' ? 'rounded-xl border border-slate-800 bg-slate-950/60 p-3' : 'rounded-xl border border-slate-200/80 bg-slate-50 p-3'}>
                                            <div className="flex items-center gap-1.5">
                                                <ShieldCheck size={14} className="text-cyan-500" />
                                                <span className={themeMode === 'dark' ? 'text-xs text-slate-400' : 'text-xs text-slate-500'}>Security</span>
                                            </div>
                                            <div className={themeMode === 'dark' ? 'mt-1 text-sm font-bold text-slate-100' : 'mt-1 text-sm font-bold text-slate-900'}>RBAC Passed</div>
                                        </div>
                                    </div>

                                    {/* Allocation */}
                                    <div className={themeMode === 'dark' ? 'rounded-xl border border-slate-800 bg-slate-950/60 p-3' : 'rounded-xl border border-slate-200/80 bg-slate-50 p-3'}>
                                        <div className="flex items-center justify-between text-xs mb-2">
                                            <span className={themeMode === 'dark' ? 'font-bold text-slate-300' : 'font-bold text-slate-700'}>Sprint Resource Load</span>
                                            <span className="text-slate-400 text-[11px]">3 Epics Active</span>
                                        </div>
                                        <div className="flex gap-1.5">
                                            <div className="h-2 rounded-full bg-cyan-500" style={{ width: '45%' }} title="Frontend 45%" />
                                            <div className="h-2 rounded-full bg-indigo-500" style={{ width: '35%' }} title="Backend 35%" />
                                            <div className="h-2 rounded-full bg-emerald-500" style={{ width: '20%' }} title="QA & Design 20%" />
                                        </div>
                                        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                                            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-cyan-500" /> Frontend (45%)</span>
                                            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-indigo-500" /> Backend (35%)</span>
                                            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" /> QA (20%)</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Sprint Board & AI Side Panel */}
                        <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
                            {/* Kanban Board */}
                            <div ref={boardSectionRef} id="tasks" className={themeMode === 'dark' ? 'rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-soft' : 'rounded-2xl border border-slate-200 bg-white p-6 shadow-soft'}>
                                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                        <h2 className={themeMode === 'dark' ? 'text-xl font-bold text-slate-100' : 'text-xl font-bold text-slate-950'}>Project Board</h2>
                                        <p className={themeMode === 'dark' ? 'mt-1 text-xs text-slate-400' : 'mt-1 text-xs text-slate-500'}>Current sprint movement across planning, build, review, and release.</p>
                                    </div>
                                    <button onClick={handleNewTask} className={themeMode === 'dark' ? 'inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-bold text-slate-100 transition hover:bg-slate-700' : 'inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50 shadow-xs'}>
                                        <CalendarDays size={15} />
                                        This week
                                    </button>
                                </div>

                                {!canReadProjects ? (
                                    <EmptyState title="Project access is limited" description="Your role does not include project read permissions." />
                                ) : loading ? (
                                    <Loader label="Loading command center..." />
                                ) : (
                                    <>
                                        {error && <ErrorMessage message={error} />}
                                        <div className="grid gap-3.5 lg:grid-cols-4">
                                            {Object.entries(dynamicBoardColumns).map(([column, tasks]) => (
                                                <div key={column} className={themeMode === 'dark' ? 'rounded-xl border border-slate-800/80 bg-slate-950/50 p-3.5' : 'rounded-xl border border-slate-200/80 bg-slate-50/80 p-3.5'}>
                                                    <div className="mb-3 flex items-center justify-between">
                                                        <h3 className={themeMode === 'dark' ? 'text-xs font-bold text-slate-200 uppercase tracking-wider' : 'text-xs font-bold text-slate-800 uppercase tracking-wider'}>{column}</h3>
                                                        <span className={themeMode === 'dark' ? 'rounded-md bg-slate-800 px-2 py-0.5 text-xs font-bold text-slate-300' : 'rounded-md bg-white px-2 py-0.5 text-xs font-bold text-slate-600 border border-slate-200'}>{tasks.length}</span>
                                                    </div>
                                                    <div className="grid gap-2.5">
                                                        {tasks.length === 0 ? (
                                                            <div className={themeMode === 'dark' ? 'rounded-xl border border-dashed border-slate-800/80 p-4 text-center text-xs text-slate-500' : 'rounded-xl border border-dashed border-slate-200/80 p-4 text-center text-xs text-slate-400'}>
                                                                No tasks in {column.toLowerCase()}
                                                            </div>
                                                        ) : (
                                                            tasks.map((task: any) => (
                                                                <article key={task.id || task.title} onClick={() => setSelectedTask(task)} className={themeMode === 'dark' ? 'cursor-pointer rounded-xl border border-slate-800 bg-slate-900 p-3.5 shadow-sm transition hover:border-cyan-500/50 hover:shadow-cyan-500/10' : 'cursor-pointer rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-sm transition hover:border-cyan-500/50 hover:shadow-cyan-500/10'}>
                                                                    <div className="flex items-start justify-between gap-2">
                                                                        <div className={themeMode === 'dark' ? 'text-sm font-bold leading-snug text-slate-100' : 'text-sm font-bold leading-snug text-slate-900'}>{task.title}</div>
                                                                        {task.department && (
                                                                            <span className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide ${
                                                                                task.department.toLowerCase() === 'frontend' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' :
                                                                                task.department.toLowerCase() === 'backend' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30' :
                                                                                task.department.toLowerCase() === 'qa' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' :
                                                                                task.department.toLowerCase() === 'devops' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30' :
                                                                                task.department.toLowerCase() === 'management' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                                                                                'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                                                                            }`}>
                                                                                {task.department}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <div className="mt-2.5 flex items-center justify-between gap-2 text-xs">
                                                                        <span className={themeMode === 'dark' ? 'text-slate-400' : 'text-slate-500'}>{task.description || 'Task item'}</span>
                                                                        <span
                                                                            className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${
                                                                                task.priority === 'HIGH' || task.priority === 'High'
                                                                                    ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                                                                                    : task.priority === 'MEDIUM' || task.priority === 'Medium'
                                                                                      ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                                                                                      : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                                                                            }`}
                                                                        >
                                                                            {task.priority || 'Normal'}
                                                                        </span>
                                                                    </div>
                                                                    <div className="mt-3 flex items-center gap-2">
                                                                        <div className="grid h-6 w-6 place-items-center rounded-full bg-slate-950 text-[10px] font-bold text-white border border-slate-700">
                                                                            {task.assignedTo ? `#${task.assignedTo}` : 'U'}
                                                                        </div>
                                                                        <span className={themeMode === 'dark' ? 'text-xs font-semibold text-slate-400' : 'text-xs font-semibold text-slate-500'}>{task.assignedTo ? 'Owner assigned' : 'Unassigned'}</span>
                                                                    </div>
                                                                </article>
                                                            ))
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Sidebar Widgets */}
                            <aside className="grid gap-5">
                                {/* Recent Activity */}
                                <ActivityLog title="Recent activity" initialLimit={3} />

                                {/* Team availability */}
                                <section id="team" className={themeMode === 'dark' ? 'rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-soft' : 'rounded-2xl border border-slate-200 bg-white p-5 shadow-soft'}>
                                    <h2 className={themeMode === 'dark' ? 'text-base font-bold text-slate-100' : 'text-base font-bold text-slate-950'}>Team Availability</h2>
                                    <div className="mt-4 grid gap-2.5">
                                        {teamMembers.length === 0 ? (
                                            <div className={themeMode === 'dark' ? 'rounded-xl border border-dashed border-slate-800 p-4 text-center text-xs text-slate-500' : 'rounded-xl border border-dashed border-slate-200 p-4 text-center text-xs text-slate-400'}>
                                                No team members loaded
                                            </div>
                                        ) : (
                                            teamMembers.map((member: any) => (
                                                <div key={member.id || member.email || member.name} className={themeMode === 'dark' ? 'rounded-xl border border-slate-800 bg-slate-950/60 p-3' : 'rounded-xl border border-slate-200/80 bg-slate-50 p-3'}>
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div>
                                                            <div className={themeMode === 'dark' ? 'text-xs font-bold text-slate-100' : 'text-xs font-bold text-slate-900'}>{member.name || member.email || 'Team Member'}</div>
                                                            <div className={themeMode === 'dark' ? 'text-[11px] text-slate-400' : 'text-[11px] text-slate-500'}>{member.role || member.email || 'Member'}</div>
                                                        </div>
                                                        <div className="rounded-md bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[11px] font-bold text-emerald-500">Active</div>
                                                    </div>
                                                    <div className={themeMode === 'dark' ? 'mt-2.5 flex items-center gap-2 text-xs text-slate-400' : 'mt-2.5 flex items-center gap-2 text-xs text-slate-600'}>
                                                        <Clock3 size={14} className="text-slate-400" />
                                                        <span>{member.status || 'Active in workspace'}</span>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </section>
                            </aside>
                        </section>

                        {/* Recent Projects */}
                        <section id="analytics" className="mt-5">
                            <div className={themeMode === 'dark' ? 'rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-soft' : 'rounded-2xl border border-slate-200 bg-white p-6 shadow-soft'}>
                                <div className="mb-4 flex items-center justify-between gap-3">
                                    <div>
                                        <h2 className={themeMode === 'dark' ? 'text-xl font-bold text-slate-100' : 'text-xl font-bold text-slate-950'}>Recent Projects</h2>
                                        <p className={themeMode === 'dark' ? 'mt-1 text-xs text-slate-400' : 'mt-1 text-xs text-slate-500'}>Live database projects for your active organization.</p>
                                    </div>
                                </div>
                                <div className="grid gap-3.5 md:grid-cols-3">
                                    {projects.length === 0 ? (
                                        <div className={themeMode === 'dark' ? 'col-span-3 rounded-xl border border-dashed border-slate-800 p-6 text-center text-xs text-slate-500' : 'col-span-3 rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-400'}>
                                            No projects found in this organization. Click "+ New Task" or create a project to start tracking.
                                        </div>
                                    ) : (
                                        projects.slice(0, 3).map((project) => (
                                            <article key={project.id} className={themeMode === 'dark' ? 'rounded-xl border border-slate-800 bg-slate-950/60 p-4 transition hover:border-slate-700' : 'rounded-xl border border-slate-200/80 bg-slate-50/80 p-4 transition hover:border-slate-300'}>
                                                <div className="mb-3 flex items-center justify-between gap-3">
                                                    <h3 className={themeMode === 'dark' ? 'text-sm font-bold text-slate-100' : 'text-sm font-bold text-slate-950'}>{project.name}</h3>
                                                    <span className={themeMode === 'dark' ? 'rounded-md bg-slate-800 px-2 py-0.5 text-[11px] font-bold text-slate-300' : 'rounded-md bg-white px-2 py-0.5 text-[11px] font-bold text-slate-600 border border-slate-200'}>{project.status}</span>
                                                </div>
                                                <p className={themeMode === 'dark' ? 'line-clamp-3 text-xs leading-relaxed text-slate-400' : 'line-clamp-3 text-xs leading-relaxed text-slate-600'}>{project.description || 'No description provided.'}</p>
                                            </article>
                                        ))
                                    )}
                                </div>
                            </div>
                        </section>
                    </div>
                </main>
            </div>

            {/* Task Detail Activity & Specs Popup Modal */}
            {selectedTask && (
                <TaskDetailModal
                    task={selectedTask}
                    projectId={selectedTask.projectId || (projects[0]?.id || 1)}
                    onClose={() => setSelectedTask(null)}
                    onUpdated={loadProjects}
                />
            )}
        </div>
    );
};

export default Dashboard;

