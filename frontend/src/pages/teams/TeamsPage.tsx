import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, UserPlus, ShieldCheck, BadgeCheck, TrendingUp, ArrowRight } from 'lucide-react';
import InviteUserModal from '../../components/user/InviteUserModal';
import UserTable from '../../components/user/UserTable';
import Loader from '../../components/ui/Loader';
import ErrorMessage from '../../components/ui/ErrorMessage';
import EmptyState from '../../components/ui/EmptyState';
import { usePermissions } from '../../hooks/usePermissions';
import { useAuth } from '../../contexts/AuthContext';
import { getUsers } from '../../api/userApi';
import { recordActivity, recordNotification, getActivityLogs } from '../../utils/activityStore';

interface TeamMember {
    id: number;
    name: string;
    email: string;
    role: string;
    status: string;
}

interface TeamActivity {
    id: string;
    message: string;
    actor: string;
    createdAt: string;
    type?: string;
}

const fallbackMembers: TeamMember[] = [
    { id: 101, name: 'Riya Shah', email: 'riya@teamx.local', role: 'ADMIN', status: 'ACTIVE' },
    { id: 102, name: 'Aman Kapoor', email: 'aman@teamx.local', role: 'MANAGER', status: 'ACTIVE' },
    { id: 103, name: 'Maya Jain', email: 'maya@teamx.local', role: 'USER', status: 'ACTIVE' },
];

const TeamsPage: React.FC = () => {
    const { can } = usePermissions();
    const { activeTenant } = useAuth();
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showInvite, setShowInvite] = useState(false);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('ALL');
    const [previewMode, setPreviewMode] = useState(false);

    const loadMembers = async () => {
        setLoading(true);
        setError('');
        try {
            const data = await getUsers();
            setMembers(data);
            setPreviewMode(false);
        } catch (err: any) {
            setMembers(fallbackMembers);
            setPreviewMode(true);
            setError('');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadMembers();
    }, []);

    const filteredMembers = useMemo(() => {
        const normalizedSearch = search.trim().toLowerCase();
        return members.filter((member) => {
            const matchesSearch =
                normalizedSearch.length === 0 ||
                member.name.toLowerCase().includes(normalizedSearch) ||
                member.email.toLowerCase().includes(normalizedSearch) ||
                member.role.toLowerCase().includes(normalizedSearch);
            const matchesRole = roleFilter === 'ALL' || member.role === roleFilter;
            return matchesSearch && matchesRole;
        });
    }, [members, roleFilter, search]);

    const stats = useMemo(() => {
        const admins = members.filter((member) => member.role === 'ADMIN').length;
        const managers = members.filter((member) => member.role === 'MANAGER').length;
        const active = members.filter((member) => member.status === 'ACTIVE').length;
        return [
            { label: 'Total members', value: String(members.length), helper: `${members.length} seats in use`, icon: Users },
            { label: 'Admins', value: String(admins), helper: 'Full workspace access', icon: ShieldCheck },
            { label: 'Managers', value: String(managers), helper: 'Project and task owners', icon: BadgeCheck },
            { label: 'Active users', value: String(active), helper: 'Ready to collaborate', icon: TrendingUp },
        ];
    }, [members]);

    const recentTeamActivity = (getActivityLogs(5) as TeamActivity[]).filter((entry) => entry.type?.startsWith('user_'));

    return (
        <div className="page-shell min-h-screen bg-slate-50">
            <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-cyan-50 px-3 py-1 text-sm font-semibold text-cyan-700">
                            <Users size={16} />
                            Team workspace
                        </div>
                        <h1 className="text-3xl font-bold text-slate-950">Teams</h1>
                        <p className="page-muted max-w-3xl">Manage members, invite teammates, and keep the org roster aligned with the work that is actually happening.</p>
                        <p className="mt-2 text-sm text-slate-500">
                            {activeTenant?.name ? `${activeTenant.name} team` : 'Current workspace team'}
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Link to="/organization" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                            Organization settings
                            <ArrowRight size={16} />
                        </Link>
                        {can('invite_user') && (
                            <button
                                onClick={() => setShowInvite(true)}
                                className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                            >
                                <UserPlus size={16} />
                                Invite member
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {previewMode && (
                <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    Live member data is unavailable right now, so this page is showing preview team data.
                </div>
            )}

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {stats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <div key={stat.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="flex items-center justify-between gap-3">
                                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-cyan-50 text-cyan-700">
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
                    <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-slate-950">Member directory</h2>
                            <p className="text-sm text-slate-500">Search the roster, filter by role, and manage access from one place.</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <input
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Search members"
                                className="search-input mb-0 min-w-[220px]"
                            />
                            <select title="Filter team members by role" value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)} className="select-field min-w-[180px]">
                                <option value="ALL">All roles</option>
                                <option value="ADMIN">ADMIN</option>
                                <option value="MANAGER">MANAGER</option>
                                <option value="USER">USER</option>
                            </select>
                        </div>
                    </div>

                    {loading ? (
                        <Loader label="Loading team members..." />
                    ) : error ? (
                        <ErrorMessage message={error} />
                    ) : filteredMembers.length === 0 ? (
                        <EmptyState title="No team members found" description="Invite a new teammate or adjust the filters to see the roster." />
                    ) : (
                        <UserTable
                            users={filteredMembers}
                            onUserUpdated={loadMembers}
                            onUserDeleted={async () => {
                                await loadMembers();
                            }}
                        />
                    )}
                </section>

                <aside className="grid gap-6">
                    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="mb-4 flex items-center gap-3">
                            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-950 text-white">
                                <ShieldCheck size={18} />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-950">Team activity</h2>
                                <p className="text-sm text-slate-500">Recent user management events</p>
                            </div>
                        </div>
                        <div className="grid gap-3">
                            {recentTeamActivity.length === 0 ? (
                                <EmptyState title="No team activity yet" description="Invite, update, or remove a user to populate this panel." />
                            ) : (
                                recentTeamActivity.map((entry) => (
                                    <div key={entry.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                        <div className="text-sm font-semibold text-slate-900">{entry.message}</div>
                                        <div className="mt-1 text-xs text-slate-500">
                                            {entry.actor} • {new Date(entry.createdAt).toLocaleString()}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </section>

                    <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-950 to-slate-800 p-5 text-white shadow-sm">
                        <div className="mb-4 flex items-center gap-3">
                            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-cyan-500 text-slate-950">
                                <UserPlus size={18} />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold">Team snapshot</h2>
                                <p className="text-sm text-slate-300">Access and growth at a glance</p>
                            </div>
                        </div>
                        <div className="grid gap-3 text-sm text-slate-200">
                            <div className="rounded-2xl bg-white/10 p-4">
                                {members.length} members across the current workspace.
                            </div>
                            <div className="rounded-2xl bg-white/10 p-4">
                                Roles are synchronized from the auth token and tenant membership.
                            </div>
                            <div className="rounded-2xl bg-white/10 p-4">
                                Use the directory to update roles, invite teammates, or remove stale access.
                            </div>
                        </div>
                    </section>
                </aside>
            </div>

            {showInvite && (
                <InviteUserModal
                    onClose={() => setShowInvite(false)}
                    onInvited={async () => {
                        recordActivity({ message: 'Invited a user', type: 'user_invited' });
                        recordNotification({ message: 'A new user was invited' });
                        await loadMembers();
                    }}
                />
            )}
        </div>
    );
};

export default TeamsPage;
