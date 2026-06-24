import React, { useEffect, useMemo, useState } from 'react';
import { BarChart3, CalendarDays, FolderKanban, Sparkles, TrendingUp, Users, ArrowRight, BellRing, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';
import { projectService, Project } from '../../services/projectService';
import { getUsers } from '../../api/userApi';
import { getActivityLogs, getNotifications } from '../../utils/activityStore';
import Loader from '../../components/ui/Loader';
import ErrorMessage from '../../components/ui/ErrorMessage';

interface AnalyticsStat {
    label: string;
    value: string;
    helper: string;
    icon: React.ElementType;
}

type WorkspaceNotification = {
    unread?: boolean;
};

type WorkspaceActivity = {
    id: string;
    message: string;
    createdAt: string;
};

const fallbackProjects: Project[] = [
    {
        id: 201,
        name: 'AI Sprint Planner',
        description: 'Model-assisted planning, risk summaries, and owner suggestions.',
        ownerId: 1,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        id: 202,
        name: 'Customer Portal Refresh',
        description: 'Navigation, onboarding checklist, and polished project views.',
        ownerId: 2,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        id: 203,
        name: 'Analytics Workspace',
        description: 'Velocity, blockers, tenant health, and exportable reports.',
        ownerId: 3,
        status: 'PLANNING',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
];

const fallbackMembers = [
    { id: 1, name: 'Admin User', email: 'admin@test.com', role: 'ADMIN', status: 'ACTIVE' },
    { id: 2, name: 'Project Lead', email: 'lead@teamx.local', role: 'MANAGER', status: 'ACTIVE' },
    { id: 3, name: 'Contributor', email: 'user@teamx.local', role: 'USER', status: 'ACTIVE' },
];

const AnalyticsPage: React.FC = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [members, setMembers] = useState<Array<{ id: number; name: string; email: string; role: string; status: string }>>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [previewMode, setPreviewMode] = useState(false);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            setError('');
            try {
                const [projectData, userData] = await Promise.all([projectService.getAll(), getUsers()]);
                setProjects(projectData);
                setMembers(userData);
                setPreviewMode(false);
            } catch (err: any) {
                setProjects(fallbackProjects);
                setMembers(fallbackMembers);
                setPreviewMode(true);
                setError('');
            } finally {
                setLoading(false);
            }
        };

        load();
    }, []);

    const stats = useMemo<AnalyticsStat[]>(() => {
        const activeProjects = projects.filter((project) => project.status === 'ACTIVE').length;
        const planningProjects = projects.filter((project) => project.status === 'PLANNING').length;
        const adminCount = members.filter((member) => member.role === 'ADMIN').length;
        const unreadNotifications = (getNotifications() as WorkspaceNotification[]).filter((notification) => notification.unread).length;

        return [
            { label: 'Projects tracked', value: String(projects.length), helper: `${activeProjects} active, ${planningProjects} planning`, icon: FolderKanban },
            { label: 'Team members', value: String(members.length), helper: `${adminCount} admins in the workspace`, icon: Users },
            { label: 'Recent activity', value: String(getActivityLogs(20).length), helper: 'Actions captured locally', icon: Activity },
            { label: 'Unread alerts', value: String(unreadNotifications), helper: 'Notifications waiting for review', icon: BellRing },
        ];
    }, [members, projects]);

    const getBarWidthClass = (count: number, total: number) => {
        if (count <= 0) {
            return 'w-0';
        }

        const ratio = (count / Math.max(total, 1)) * 100;
        if (ratio < 25) return 'w-1/4';
        if (ratio < 50) return 'w-1/2';
        if (ratio < 75) return 'w-3/4';
        return 'w-full';
    };

    const projectBreakdown = useMemo(() => {
        const total = Math.max(projects.length, 1);
        const active = projects.filter((project) => project.status === 'ACTIVE').length;
        const planning = projects.filter((project) => project.status === 'PLANNING').length;
        const archived = projects.filter((project) => project.status === 'ARCHIVED').length;
        return [
            { label: 'Active', count: active, color: 'bg-cyan-500' },
            { label: 'Planning', count: planning, color: 'bg-amber-500' },
            { label: 'Archived', count: archived, color: 'bg-slate-400' },
            { label: 'Other', count: Math.max(total - active - planning - archived, 0), color: 'bg-lime-500' },
        ];
    }, [projects]);

    const topMembers = useMemo(() => {
        const roleCounts = members.reduce<Record<string, number>>((accumulator, member) => {
            accumulator[member.role] = (accumulator[member.role] || 0) + 1;
            return accumulator;
        }, {});

        return Object.entries(roleCounts)
            .map(([role, count]) => ({ role, count }))
            .sort((a, b) => b.count - a.count);
    }, [members]);

    return (
        <div className="page-shell min-h-screen bg-slate-50">
            <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-700">
                            <BarChart3 size={16} />
                            Analytics workspace
                        </div>
                        <h1 className="text-3xl font-bold text-slate-950">Analytics</h1>
                        <p className="page-muted max-w-3xl">A live workspace view across projects, team size, and recent activity so you can see where the momentum is building.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Link to="/projects" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                            Open projects
                            <ArrowRight size={16} />
                        </Link>
                        <Link to="/tasks" className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800">
                            <Sparkles size={16} />
                            View tasks
                        </Link>
                    </div>
                </div>
            </div>

            {previewMode && (
                <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    Live analytics data is unavailable right now, so this page is showing preview workspace metrics.
                </div>
            )}

            {loading ? (
                <Loader label="Loading analytics..." />
            ) : error ? (
                <ErrorMessage message={error} />
            ) : (
                <>
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        {stats.map((stat) => {
                            const Icon = stat.icon;
                            return (
                                <div key={stat.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-950 text-white">
                                            <Icon size={18} />
                                        </div>
                                        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Live</span>
                                    </div>
                                    <div className="mt-4 text-3xl font-bold text-slate-950">{stat.value}</div>
                                    <div className="mt-1 text-sm font-semibold text-slate-700">{stat.label}</div>
                                    <div className="mt-1 text-sm text-slate-500">{stat.helper}</div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
                        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="mb-5 flex items-center justify-between gap-3">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-950">Project distribution</h2>
                                    <p className="text-sm text-slate-500">Where the current workspace effort is sitting right now.</p>
                                </div>
                                <div className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">
                                    {projects.length} total projects
                                </div>
                            </div>
                            <div className="grid gap-4">
                                {projectBreakdown.map((item) => (
                                    <div key={item.label} className="grid gap-2">
                                        <div className="flex items-center justify-between gap-3 text-sm font-semibold text-slate-700">
                                            <span>{item.label}</span>
                                            <span>{item.count}</span>
                                        </div>
                                        <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                                            <div className={`h-full rounded-full ${item.color} ${getBarWidthClass(item.count, projects.length)}`} />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
                                    <CalendarDays size={16} className="text-cyan-600" />
                                    Activity trend
                                </div>
                                <div className="grid gap-2">
                                    {(getActivityLogs(6) as WorkspaceActivity[]).map((entry, index) => (
                                        <div key={entry.id} className="grid grid-cols-[56px_minmax(0,1fr)_70px] items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
                                            <span className="font-semibold text-slate-500">#{index + 1}</span>
                                            <span className="truncate text-slate-900">{entry.message}</span>
                                            <span className="text-xs text-slate-500">{new Date(entry.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>

                        <aside className="grid gap-6">
                            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                                <div className="mb-4 flex items-center gap-3">
                                    <div className="grid h-11 w-11 place-items-center rounded-2xl bg-amber-50 text-amber-700">
                                        <TrendingUp size={18} />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-slate-950">Team composition</h2>
                                        <p className="text-sm text-slate-500">Who is on the workspace and how the roles break down.</p>
                                    </div>
                                </div>
                                <div className="grid gap-3">
                                    {topMembers.length === 0 ? (
                                        <p className="text-sm text-slate-500">No members loaded yet.</p>
                                    ) : (
                                        topMembers.map((item) => (
                                            <div key={item.role} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                                <span className="text-sm font-semibold text-slate-700">{item.role}</span>
                                                <span className="rounded-full bg-white px-3 py-1 text-sm font-bold text-slate-900">{item.count}</span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </section>

                            <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-950 to-slate-800 p-5 text-white shadow-sm">
                                <div className="mb-4 flex items-center gap-3">
                                    <div className="grid h-11 w-11 place-items-center rounded-2xl bg-cyan-500 text-slate-950">
                                        <Activity size={18} />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold">Insight snapshot</h2>
                                        <p className="text-sm text-slate-300">A quick read on the workspace.</p>
                                    </div>
                                </div>
                                <div className="grid gap-3 text-sm text-slate-200">
                                    <div className="rounded-2xl bg-white/10 p-4">{getActivityLogs(5).length} events were captured in local activity storage.</div>
                                    <div className="rounded-2xl bg-white/10 p-4">{(getNotifications() as WorkspaceNotification[]).filter((notification) => notification.unread).length} unread notifications are still waiting.</div>
                                    <div className="rounded-2xl bg-white/10 p-4">Analytics and task views are built from the same live workspace data, so the numbers stay aligned.</div>
                                </div>
                            </section>
                        </aside>
                    </div>
                </>
            )}
        </div>
    );
};

export default AnalyticsPage;
