import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Canvas } from '@react-three/fiber';
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
    FolderKanban,
    Gauge,
    LogOut,
    MessageSquare,
    Plus,
    Search,
    Settings,
    ShieldCheck,
    Sparkles,
    Sun,
    Users,
} from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { Group, Mesh } from 'three';
import { projectService, Project } from '../services/projectService';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { getNotifications, markNotificationsRead } from '../utils/activityStore';
import Loader from '../components/ui/Loader';
import ErrorMessage from '../components/ui/ErrorMessage';
import EmptyState from '../components/ui/EmptyState';
import ActivityLog from '../components/activity/ActivityLog';
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

const fallbackProjects: Project[] = [
    {
        id: 101,
        name: 'AI Sprint Planner',
        description: 'Model-assisted planning, risk summaries, and owner suggestions.',
        ownerId: 1,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        id: 102,
        name: 'Customer Portal Refresh',
        description: 'Navigation, onboarding checklist, and polished project views.',
        ownerId: 2,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        id: 103,
        name: 'Analytics Workspace',
        description: 'Velocity, blockers, tenant health, and exportable reports.',
        ownerId: 3,
        status: 'PLANNING',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
];

const boardColumns: Record<string, BoardTask[]> = {
    Backlog: [
        { title: 'Map tenant onboarding events', meta: 'Data model', priority: 'Medium', assignee: 'AK' },
        { title: 'Design command palette flows', meta: 'UX pass', priority: 'Low', assignee: 'VN' },
    ],
    'In Progress': [
        { title: 'Build AI summary panel', meta: 'Frontend', priority: 'High', assignee: 'RS' },
        { title: 'Connect project risk score', meta: 'Backend API', priority: 'Medium', assignee: 'MJ' },
    ],
    Review: [
        { title: 'Audit RBAC protected pages', meta: 'Security', priority: 'High', assignee: 'SP' },
    ],
    Done: [
        { title: 'Ship activity timeline', meta: 'Dashboard', priority: 'Low', assignee: 'DX' },
    ],
};

const teamMembers = [
    { name: 'Riya Shah', role: 'Product', state: 'Planning sprint goals', load: '72%' },
    { name: 'Aman Kapoor', role: 'Engineering', state: 'Reviewing API contracts', load: '81%' },
    { name: 'Maya Jain', role: 'Design', state: 'Polishing dashboard states', load: '64%' },
];

const assistantItems = [
    'Two active projects have no review owner assigned.',
    'Velocity is trending up, but review work is collecting in one lane.',
    'Customer Portal Refresh needs a sharper launch checklist before Friday.',
];

const quickNav = [
    { label: 'Overview', icon: Gauge, to: 'dashboard' },
    { label: 'Projects', icon: FolderKanban, to: '/projects' },
    { label: 'Tasks', icon: CheckCircle2, to: '/tasks' },
    { label: 'AI Assistant', icon: Bot, to: '#assistant' },
    { label: 'Teams', icon: Users, to: '/teams' },
    { label: 'Analytics', icon: BarChart3, to: '/analytics' },
    { label: 'Settings', icon: Settings, to: '/organization' },
];

const FloatingNode: React.FC<{ position: [number, number, number]; color: string; speed: number; scale?: number }> = ({
    position,
    color,
    speed,
    scale = 1,
}) => {
    const ref = useRef<Mesh>(null);

    useFrame(({ clock }) => {
        if (!ref.current) {
            return;
        }
        const t = clock.getElapsedTime() * speed;
        ref.current.position.y = position[1] + Math.sin(t) * 0.18;
        ref.current.rotation.x += 0.006 * speed;
        ref.current.rotation.y += 0.008 * speed;
    });

    return (
        <mesh ref={ref} position={position} scale={scale}>
            <icosahedronGeometry args={[0.36, 1]} />
            <meshStandardMaterial color={color} roughness={0.38} metalness={0.35} />
        </mesh>
    );
};

const CommandCenterScene: React.FC = () => {
    const groupRef = useRef<Group>(null);

    useFrame(({ clock }) => {
        if (!groupRef.current) {
            return;
        }
        groupRef.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.22) * 0.18;
    });

    return (
        <>
            <ambientLight intensity={0.72} />
            <directionalLight position={[2.5, 4, 3]} intensity={1.8} />
            <pointLight position={[-3, -2, 3]} color="#22c55e" intensity={1.6} />
            <group ref={groupRef}>
                <mesh rotation={[0.86, 0.12, 0.2]}>
                    <torusGeometry args={[1.52, 0.012, 16, 96]} />
                    <meshStandardMaterial color="#38bdf8" emissive="#075985" emissiveIntensity={0.28} />
                </mesh>
                <mesh rotation={[1.18, 0.75, 0.44]}>
                    <torusGeometry args={[1.05, 0.01, 16, 96]} />
                    <meshStandardMaterial color="#a3e635" emissive="#365314" emissiveIntensity={0.26} />
                </mesh>
                <FloatingNode position={[-1.1, 0.18, 0]} color="#06b6d4" speed={1.1} />
                <FloatingNode position={[0.86, -0.48, 0.3]} color="#84cc16" speed={1.35} scale={0.82} />
                <FloatingNode position={[0.18, 0.72, -0.44]} color="#f97316" speed={0.92} scale={0.66} />
                <FloatingNode position={[1.48, 0.42, -0.2]} color="#eab308" speed={1.22} scale={0.52} />
                <mesh>
                    <sphereGeometry args={[0.18, 32, 32]} />
                    <meshStandardMaterial color="#f8fafc" emissive="#38bdf8" emissiveIntensity={0.4} />
                </mesh>
            </group>
        </>
    );
};

const Dashboard: React.FC = () => {
    const { hasPermission, logout, user, activeTenant } = useAuth();
    const { can } = usePermissions();
    const { companyId } = useParams<{ companyId: string }>();
    const navigate = useNavigate();
    const boardSectionRef = useRef<HTMLDivElement>(null);
    const assistantSectionRef = useRef<HTMLDivElement>(null);
    const canReadProjects = hasPermission('PROJECT_READ');
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [themeMode, setThemeMode] = useState(() => localStorage.getItem('teamx_theme') === 'dark' ? 'dark' : 'light');
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [notifications, setNotifications] = useState<DashboardNotification[]>(() => getNotifications());

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

    const visibleProjects = projects.length > 0 ? projects : fallbackProjects;
    const activeProjects = visibleProjects.filter((project) => project.status === 'ACTIVE').length;
    const completionRate = visibleProjects.length > 0 ? Math.round((activeProjects / visibleProjects.length) * 100) : 0;

    const metrics: Metric[] = useMemo(
        () => [
            {
                label: 'Active Projects',
                value: String(activeProjects),
                helper: `${visibleProjects.length} total tracked`,
                icon: FolderKanban,
                tone: 'bg-cyan-50 text-cyan-700',
            },
            {
                label: 'Open Tasks',
                value: '28',
                helper: '7 due this week',
                icon: CheckCircle2,
                tone: 'bg-lime-50 text-lime-700',
            },
            {
                label: 'Team Velocity',
                value: `${Math.max(68, completionRate)}%`,
                helper: '+11% from last sprint',
                icon: Activity,
                tone: 'bg-amber-50 text-amber-700',
            },
            {
                label: 'Risk Alerts',
                value: '3',
                helper: '2 need owners today',
                icon: AlertTriangle,
                tone: 'bg-rose-50 text-rose-700',
            },
        ],
        [activeProjects, completionRate, visibleProjects.length]
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
        assistantSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const handleNotificationClick = (projectId?: DashboardNotification['projectId']) => {
        setNotificationsOpen(false);
        if (projectId != null) {
            navigate(`/projects/${projectId}`);
        }
    };

    const loadProjects = async () => {
        setError('');
        try {
            const data = await projectService.getAll();
            setProjects(data);
        } catch (error) {
            setError('Failed to load live projects. Showing preview workspace data.');
        } finally {
            setLoading(false);
        }
    };

    const dashboardPath = companyId ? `/company/${companyId}/dashboard` : '/dashboard';

    return (
        <div className={themeMode === 'dark' ? 'min-h-screen bg-slate-950 text-slate-50' : 'min-h-screen bg-slate-100 text-slate-950'}>
            <div className="flex min-h-screen">
                <aside className={themeMode === 'dark' ? 'hidden w-64 shrink-0 border-r border-slate-800 bg-slate-900 px-4 py-5 lg:flex lg:flex-col' : 'hidden w-64 shrink-0 border-r border-slate-200 bg-white px-4 py-5 lg:flex lg:flex-col'}>
                    <Link to={dashboardPath} className="mb-8 flex items-center gap-3">
                        <div className={themeMode === 'dark' ? 'grid h-10 w-10 place-items-center rounded-lg bg-cyan-500 text-slate-950' : 'grid h-10 w-10 place-items-center rounded-lg bg-slate-950 text-white'}>
                            <ShieldCheck size={20} />
                        </div>
                        <div>
                            <div className={themeMode === 'dark' ? 'text-sm font-semibold uppercase tracking-[0.18em] text-slate-400' : 'text-sm font-semibold uppercase tracking-[0.18em] text-slate-500'}>TeamX</div>
                            <div className="text-lg font-bold">Command</div>
                        </div>
                    </Link>

                    <nav className="grid gap-1">
                        {quickNav.map((item) => {
                            const Icon = item.icon;
                            const target = item.to === 'dashboard' ? dashboardPath : item.to;
                            const locked = item.label === 'Settings' && !can('manage_users');
                            const className =
                                item.label === 'Overview'
                                    ? themeMode === 'dark'
                                        ? 'bg-cyan-500 text-slate-950'
                                        : 'bg-slate-950 text-white'
                                    : themeMode === 'dark'
                                        ? 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950';

                            if (locked) {
                                return null;
                            }

                            return (
                                <Link
                                    key={item.label}
                                    to={target}
                                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${className}`}
                                >
                                    <Icon size={18} />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>

                    <div className={themeMode === 'dark' ? 'mt-auto rounded-lg border border-slate-800 bg-slate-950 p-4' : 'mt-auto rounded-lg border border-slate-200 bg-slate-50 p-4'}>
                        <div className={themeMode === 'dark' ? 'mb-2 flex items-center gap-2 text-sm font-semibold text-slate-100' : 'mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800'}>
                            <CircleDot size={16} className="text-lime-600" />
                            Sprint live
                        </div>
                        <p className={themeMode === 'dark' ? 'text-sm leading-5 text-slate-300' : 'text-sm leading-5 text-slate-500'}>Review lane is the only hotspot. AI summary is ready.</p>
                    </div>
                </aside>

                <main className="min-w-0 flex-1">
                    <header className={themeMode === 'dark' ? 'sticky top-0 z-20 border-b border-slate-800 bg-slate-950/90 px-4 py-3 backdrop-blur xl:px-8' : 'sticky top-0 z-20 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur xl:px-8'}>
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className={themeMode === 'dark' ? 'flex min-w-0 flex-1 items-center gap-3 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-slate-300 md:max-w-xl' : 'flex min-w-0 flex-1 items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-500 md:max-w-xl'}>
                                <Search size={18} />
                                <span className="truncate text-sm">Search projects, people, alerts...</span>
                            </div>
                            <div className="relative flex items-center gap-2">
                                <button onClick={handleThemeToggle} className={themeMode === 'dark' ? 'grid h-10 w-10 place-items-center rounded-lg border border-slate-700 bg-slate-900 text-slate-100 transition hover:bg-slate-800' : 'grid h-10 w-10 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50'} title="Theme" aria-label="Toggle theme">
                                    <Sun size={18} />
                                </button>
                                <button onClick={handleNotificationsToggle} className={themeMode === 'dark' ? 'grid h-10 w-10 place-items-center rounded-lg border border-slate-700 bg-slate-900 text-slate-100 transition hover:bg-slate-800' : 'grid h-10 w-10 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50'} title="Notifications" aria-label="Open notifications">
                                    <Bell size={18} />
                                </button>
                                <button
                                    onClick={handleLogout}
                                    className={themeMode === 'dark' ? 'grid h-10 w-10 place-items-center rounded-lg bg-cyan-500 text-slate-950 transition hover:bg-cyan-400' : 'grid h-10 w-10 place-items-center rounded-lg bg-slate-950 text-white transition hover:bg-slate-800'}
                                    title="Logout"
                                >
                                    <LogOut size={18} />
                                </button>
                                {notificationsOpen && (
                                    <div className={themeMode === 'dark' ? 'absolute right-0 top-12 z-30 w-80 rounded-2xl border border-slate-700 bg-slate-900 p-4 shadow-2xl' : 'absolute right-0 top-12 z-30 w-80 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl'}>
                                        <div className="mb-3 flex items-center justify-between gap-3">
                                            <div>
                                                <div className={themeMode === 'dark' ? 'text-sm font-semibold text-slate-100' : 'text-sm font-semibold text-slate-900'}>Notifications</div>
                                                <div className={themeMode === 'dark' ? 'text-xs text-slate-400' : 'text-xs text-slate-500'}>{notifications.length} recent updates</div>
                                            </div>
                                            <button
                                                className={themeMode === 'dark' ? 'text-xs font-semibold text-cyan-400 hover:text-cyan-300' : 'text-xs font-semibold text-cyan-700 hover:text-cyan-600'}
                                                onClick={() => markNotificationsRead()}
                                            >
                                                Mark all read
                                            </button>
                                        </div>
                                        <div className="grid gap-2">
                                            {notifications.length === 0 ? (
                                                <p className={themeMode === 'dark' ? 'text-sm text-slate-400' : 'text-sm text-slate-500'}>No notifications yet.</p>
                                            ) : (
                                                notifications.slice(0, 5).map((item) => (
                                                    <button
                                                        key={item.id}
                                                        onClick={() => handleNotificationClick(item.projectId)}
                                                        className={themeMode === 'dark' ? 'rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-left transition hover:border-cyan-500/40 hover:bg-slate-800' : 'rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-left transition hover:border-cyan-200 hover:bg-cyan-50'}
                                                    >
                                                        <div className={themeMode === 'dark' ? 'text-sm font-medium text-slate-100' : 'text-sm font-medium text-slate-900'}>{item.message}</div>
                                                        <div className={themeMode === 'dark' ? 'text-xs text-slate-400' : 'text-xs text-slate-500'}>{new Date(item.createdAt).toLocaleString()}</div>
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </header>

                    <div className="px-4 py-6 xl:px-8">
                        <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
                            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
                                <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                                    <div>
                                        <div className="mb-3 inline-flex items-center gap-2 rounded-lg bg-cyan-50 px-3 py-1.5 text-sm font-semibold text-cyan-700">
                                            <Sparkles size={16} />
                                            {activeTenant?.role ? `${activeTenant.role} workspace` : 'AI workspace'}
                                        </div>
                                        <h1 className="text-3xl font-bold tracking-normal text-slate-950 md:text-4xl">
                                            {activeTenant?.name ? `${activeTenant.name} Command Center` : 'Team Command Center'}
                                        </h1>
                                        <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
                                            Live project health, task movement, team availability, and AI-guided next actions in one focused workspace.
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <button onClick={handleNewTask} className={themeMode === 'dark' ? 'inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400' : 'inline-flex items-center gap-2 rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800'}>
                                            <Plus size={17} />
                                            New Task
                                        </button>
                                        <button onClick={handleAskAi} className={themeMode === 'dark' ? 'inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-100 transition hover:bg-slate-800' : 'inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50'}>
                                            <Bot size={17} />
                                            Ask AI
                                        </button>
                                    </div>
                                </div>

                                <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                    {metrics.map((metric) => {
                                        const Icon = metric.icon;
                                        return (
                                            <div key={metric.label} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                                                <div className="flex items-center justify-between gap-3">
                                                    <div className={`grid h-10 w-10 place-items-center rounded-lg ${metric.tone}`}>
                                                        <Icon size={18} />
                                                    </div>
                                                    <ArrowUpRight size={17} className="text-slate-400" />
                                                </div>
                                                <div className="mt-4 text-3xl font-bold text-slate-950">{metric.value}</div>
                                                <div className="mt-1 text-sm font-semibold text-slate-700">{metric.label}</div>
                                                <div className="mt-1 text-sm text-slate-500">{metric.helper}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="relative overflow-hidden rounded-lg border border-slate-800 bg-slate-950 p-5 text-white shadow-soft">
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(34,211,238,0.24),transparent_30%),radial-gradient(circle_at_80%_70%,rgba(132,204,22,0.18),transparent_28%)]" />
                                <div className="relative z-10 flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-200">3D system map</p>
                                        <h2 className="mt-1 text-xl font-bold">Project orbit</h2>
                                    </div>
                                    <div className="rounded-lg bg-white/10 px-3 py-1 text-sm font-semibold text-cyan-100">Live</div>
                                </div>
                                <div className="relative z-10 mt-3 h-64">
                                    <Canvas camera={{ position: [0, 0, 4.3], fov: 45 }}>
                                        <Suspense fallback={null}>
                                            <CommandCenterScene />
                                        </Suspense>
                                    </Canvas>
                                </div>
                            </div>
                        </section>

                        <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
                            <div ref={boardSectionRef} id="tasks" className={themeMode === 'dark' ? 'rounded-lg border border-slate-800 bg-slate-900 p-5 shadow-soft' : 'rounded-lg border border-slate-200 bg-white p-5 shadow-soft'}>
                                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-950">Project board</h2>
                                        <p className="mt-1 text-sm text-slate-500">Current sprint movement across planning, build, review, and release.</p>
                                    </div>
                                    <button onClick={handleNewTask} className={themeMode === 'dark' ? 'inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold text-slate-100 transition hover:bg-slate-800' : 'inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50'}>
                                        <CalendarDays size={16} />
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
                                        <div className="grid gap-3 lg:grid-cols-4">
                                            {Object.entries(boardColumns).map(([column, tasks]) => (
                                                <div key={column} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                                                    <div className="mb-3 flex items-center justify-between">
                                                        <h3 className="text-sm font-bold text-slate-800">{column}</h3>
                                                        <span className="rounded-md bg-white px-2 py-1 text-xs font-bold text-slate-500">{tasks.length}</span>
                                                    </div>
                                                    <div className="grid gap-3">
                                                        {tasks.map((task) => (
                                                            <article key={task.title} className="rounded-lg border border-slate-200 bg-white p-3">
                                                                <div className="text-sm font-bold leading-5 text-slate-900">{task.title}</div>
                                                                <div className="mt-2 flex items-center justify-between gap-2 text-xs text-slate-500">
                                                                    <span>{task.meta}</span>
                                                                    <span
                                                                        className={`rounded-md px-2 py-1 font-bold ${
                                                                            task.priority === 'High'
                                                                                ? 'bg-rose-50 text-rose-700'
                                                                                : task.priority === 'Medium'
                                                                                  ? 'bg-amber-50 text-amber-700'
                                                                                  : 'bg-lime-50 text-lime-700'
                                                                        }`}
                                                                    >
                                                                        {task.priority}
                                                                    </span>
                                                                </div>
                                                                <div className="mt-3 flex items-center gap-2">
                                                                    <div className="grid h-7 w-7 place-items-center rounded-full bg-slate-900 text-xs font-bold text-white">
                                                                        {task.assignee}
                                                                    </div>
                                                                    <span className="text-xs font-semibold text-slate-500">Owner assigned</span>
                                                                </div>
                                                            </article>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>

                            <aside className="grid gap-5">
                                <section ref={assistantSectionRef} id="assistant" className={themeMode === 'dark' ? 'rounded-lg border border-slate-800 bg-slate-900 p-5 shadow-soft' : 'rounded-lg border border-slate-200 bg-white p-5 shadow-soft'}>
                                    <div className="mb-4 flex items-center gap-3">
                                        <div className="grid h-10 w-10 place-items-center rounded-lg bg-slate-950 text-white">
                                            <Bot size={18} />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-bold text-slate-950">AI Assistant</h2>
                                            <p className="text-sm text-slate-500">Suggested next actions</p>
                                        </div>
                                    </div>
                                    <div className="grid gap-3">
                                        {assistantItems.map((item) => (
                                            <div key={item} className="flex gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                                                <Sparkles size={16} className="mt-0.5 shrink-0 text-cyan-600" />
                                                <p className="text-sm leading-5 text-slate-600">{item}</p>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-4 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                                        <MessageSquare size={16} className="text-slate-400" />
                                        <span className="text-sm text-slate-500">Ask about sprint risk...</span>
                                    </div>
                                </section>

                                <section id="team" className={themeMode === 'dark' ? 'rounded-lg border border-slate-800 bg-slate-900 p-5 shadow-soft' : 'rounded-lg border border-slate-200 bg-white p-5 shadow-soft'}>
                                    <h2 className="text-lg font-bold text-slate-950">Team availability</h2>
                                    <div className="mt-4 grid gap-3">
                                        {teamMembers.map((member) => (
                                            <div key={member.name} className="rounded-lg border border-slate-200 p-3">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <div className="font-bold text-slate-900">{member.name}</div>
                                                        <div className="text-sm text-slate-500">{member.role}</div>
                                                    </div>
                                                    <div className="rounded-md bg-lime-50 px-2 py-1 text-xs font-bold text-lime-700">{member.load}</div>
                                                </div>
                                                <div className="mt-3 flex items-center gap-2 text-sm text-slate-600">
                                                    <Clock3 size={15} className="text-slate-400" />
                                                    {member.state}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            </aside>
                        </section>

                        <section id="analytics" className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
                            <div className={themeMode === 'dark' ? 'rounded-lg border border-slate-800 bg-slate-900 p-5 shadow-soft' : 'rounded-lg border border-slate-200 bg-white p-5 shadow-soft'}>
                                <div className="mb-4 flex items-center justify-between gap-3">
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-950">Recent projects</h2>
                                        <p className="mt-1 text-sm text-slate-500">Live data when available, preview data when the API is offline.</p>
                                    </div>
                                </div>
                                <div className="grid gap-3 md:grid-cols-3">
                                    {visibleProjects.slice(0, 3).map((project) => (
                                        <article key={project.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                                            <div className="mb-3 flex items-center justify-between gap-3">
                                                <h3 className="font-bold text-slate-950">{project.name}</h3>
                                                <span className="rounded-md bg-white px-2 py-1 text-xs font-bold text-slate-600">{project.status}</span>
                                            </div>
                                            <p className="line-clamp-3 text-sm leading-6 text-slate-600">{project.description}</p>
                                        </article>
                                    ))}
                                </div>
                            </div>
                            <ActivityLog title="Recent activity" />
                        </section>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Dashboard;
