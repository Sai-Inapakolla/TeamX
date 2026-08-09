import React, { useEffect, useState } from 'react';
import { deleteUser, getUsers } from '../../api/userApi';
import { getCurrentTenant } from '../../api/tenantApi';
import InviteUserModal from '../../components/user/InviteUserModal';
import RoleDropdown from '../../components/user/RoleDropdown';
import Loader from '../../components/ui/Loader';
import ErrorMessage from '../../components/ui/ErrorMessage';
import EmptyState from '../../components/ui/EmptyState';
import NavBar from '../../components/Layout/NavBar';
import Sidebar from '../../components/Layout/Sidebar';
import { usePermissions } from '../../hooks/usePermissions';
import { recordActivity, recordNotification } from '../../utils/activityStore';
import { toUiRole } from '../../utils/permissions';
import { Building2, Users, UserPlus, Shield, Calendar, Activity, CheckCircle2 } from 'lucide-react';

const OrganizationSettings = () => {
    const [tenant, setTenant] = useState(null);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showInvite, setShowInvite] = useState(false);
    const { can, role } = usePermissions();

    const isAdmin = role === 'ADMIN';

    const loadOrganization = async () => {
        setLoading(true);
        setError('');
        try {
            const [tenantData, usersData] = await Promise.all([getCurrentTenant(), getUsers()]);
            setTenant(tenantData);
            setMembers(usersData);
        } catch (err) {
            setError(err?.response?.data?.message || 'Failed to load organization settings');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isAdmin) {
            loadOrganization();
        } else {
            setLoading(false);
        }
    }, [isAdmin]);

    const handleInvited = async (user) => {
        recordActivity({ message: `Invited user "${user.email}"`, type: 'user_invited' });
        recordNotification({ message: `User invited: ${user.email}` });
        await loadOrganization();
    };

    const handleRemove = async (member) => {
        setError('');
        try {
            await deleteUser(member.id);
            recordActivity({ message: `Removed user "${member.email}"`, type: 'user_removed' });
            recordNotification({ message: `User removed: ${member.email}` });
            await loadOrganization();
        } catch (err) {
            setError(err?.response?.data?.message || 'Failed to remove user');
        }
    };

    if (!isAdmin) {
        return (
            <div className="route-shell">
                <NavBar />
                <div style={{ display: 'flex' }}>
                    <Sidebar />
                    <main className="page-shell">
                        <ErrorMessage message="Only Admin users can access organization settings." />
                    </main>
                </div>
            </div>
        );
    }

    if (loading) return <Loader label="Loading organization settings..." />;

    return (
        <div className="route-shell">
            <NavBar />
            <div style={{ display: 'flex' }}>
                <Sidebar />
                <main className="page-shell">
                    <div className="page-header">
                        <div>
                            <h1 className="page-title">Organization Settings</h1>
                            <p className="page-subtitle">Manage tenant details, organizational members, and administrative privileges.</p>
                        </div>
                        {can('invite_user') && (
                            <button type="button" onClick={() => setShowInvite(true)} className="btn-primary">
                                <UserPlus size={18} />
                                <span>Invite Member</span>
                            </button>
                        )}
                    </div>

                    {error && <div style={{ marginBottom: 20 }}><ErrorMessage message={error} /></div>}

                    {/* Tenant Info Card */}
                    <div className="surface-card" style={{ padding: 28, marginBottom: 28 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                            <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', display: 'grid', placeItems: 'center' }}>
                                <Building2 size={22} />
                            </div>
                            <div>
                                <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a' }}>Organization Workspace</h2>
                                <p style={{ fontSize: 13, color: '#64748b' }}>Primary SaaS tenant configuration</p>
                            </div>
                        </div>

                        {tenant ? (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
                                <div style={{ background: '#f8fafc', padding: 16, borderRadius: 12, border: '1px solid #e2e8f0' }}>
                                    <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Company Name</div>
                                    <div style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginTop: 4 }}>{tenant.name}</div>
                                </div>
                                <div style={{ background: '#f8fafc', padding: 16, borderRadius: 12, border: '1px solid #e2e8f0' }}>
                                    <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Created Date</div>
                                    <div style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginTop: 4 }}>{formatDate(tenant.createdAt)}</div>
                                </div>
                                <div style={{ background: '#f8fafc', padding: 16, borderRadius: 12, border: '1px solid #e2e8f0' }}>
                                    <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Subscription Status</div>
                                    <div style={{ marginTop: 4 }}>
                                        <span className="badge-pill badge-pill--emerald">
                                            <CheckCircle2 size={13} />
                                            {tenant.status || 'Active'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <EmptyState title="Organization details unavailable" description="Tenant info could not be fetched." />
                        )}
                    </div>

                    {/* Members List Section */}
                    <div className="surface-card" style={{ padding: 28 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <div>
                                <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a' }}>Organization Roster</h2>
                                <p style={{ fontSize: 13, color: '#64748b' }}>{members.length} members with access to this tenant</p>
                            </div>
                        </div>

                        {members.length === 0 ? (
                            <EmptyState title="No members found" description="Invite team members to collaborate." />
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '2px solid #e2e8f0', textTransform: 'uppercase', fontSize: 12, color: '#64748b' }}>
                                            <th style={{ textAlign: 'left', padding: '12px 14px' }}>User</th>
                                            <th style={{ textAlign: 'left', padding: '12px 14px' }}>Email</th>
                                            <th style={{ textAlign: 'left', padding: '12px 14px' }}>Role</th>
                                            <th style={{ textAlign: 'left', padding: '12px 14px' }}>Status</th>
                                            <th style={{ textAlign: 'right', padding: '12px 14px' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {members.map((member) => (
                                            <tr key={member.id} style={{ borderBottom: '1px solid #f1f5f9', fontSize: 14 }}>
                                                <td style={{ padding: '14px', fontWeight: 600, color: '#0f172a' }}>{member.name}</td>
                                                <td style={{ padding: '14px', color: '#64748b' }}>{member.email}</td>
                                                <td style={{ padding: '14px' }}>
                                                    {can('update_user_role') ? (
                                                        <RoleDropdown user={member} onUpdated={loadOrganization} />
                                                    ) : (
                                                        <span className="badge-pill badge-pill--indigo">{toUiRole(member.role)}</span>
                                                    )}
                                                </td>
                                                <td style={{ padding: '14px' }}>
                                                    <span className="badge-pill badge-pill--emerald">{member.status || 'Active'}</span>
                                                </td>
                                                <td style={{ padding: '14px', textAlign: 'right' }}>
                                                    {can('delete_user') ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemove(member)}
                                                            style={{
                                                                background: 'rgba(244, 63, 94, 0.1)',
                                                                color: '#e11d48',
                                                                border: 'none',
                                                                padding: '6px 12px',
                                                                borderRadius: 8,
                                                                fontWeight: 600,
                                                                fontSize: 13,
                                                                cursor: 'pointer'
                                                            }}
                                                        >
                                                            Remove
                                                        </button>
                                                    ) : (
                                                        <span style={{ fontSize: 12, color: '#94a3b8' }}>No actions</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {showInvite && (
                        <InviteUserModal
                            onClose={() => setShowInvite(false)}
                            onInvited={handleInvited}
                        />
                    )}
                </main>
            </div>
        </div>
    );
};

const formatDate = (value) => {
    if (!value) return 'Not available';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
};

export default OrganizationSettings;
