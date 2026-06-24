import React, { useEffect, useState } from 'react';
import { deleteUser, getUsers } from '../../api/userApi';
import { getCurrentTenant } from '../../api/tenantApi';
import InviteUserModal from '../../components/user/InviteUserModal';
import RoleDropdown from '../../components/user/RoleDropdown';
import Loader from '../../components/ui/Loader';
import ErrorMessage from '../../components/ui/ErrorMessage';
import EmptyState from '../../components/ui/EmptyState';
import { usePermissions } from '../../hooks/usePermissions';
import { recordActivity, recordNotification } from '../../utils/activityStore';
import { toUiRole } from '../../utils/permissions';

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
            <div style={pageStyle}>
                <ErrorMessage message="Only Admin users can access organization settings." />
            </div>
        );
    }

    if (loading) return <Loader label="Loading organization settings..." />;

    return (
        <div style={pageStyle}>
            <div style={headerStyle}>
                <div>
                    <h1 style={{ margin: 0 }}>Organization Settings</h1>
                    <p style={subtleText}>Manage tenant details, members, and admin actions.</p>
                </div>
                {can('invite_user') && (
                    <button type="button" onClick={() => setShowInvite(true)} style={primaryButtonStyle}>
                        Invite user
                    </button>
                )}
            </div>

            {error && <div style={{ marginBottom: 16 }}><ErrorMessage message={error} /></div>}

            <section style={sectionStyle}>
                <h2 style={sectionTitleStyle}>Organization Info</h2>
                {tenant ? (
                    <div style={infoGridStyle}>
                        <div>
                            <div style={labelStyle}>Name</div>
                            <div style={valueStyle}>{tenant.name}</div>
                        </div>
                        <div>
                            <div style={labelStyle}>Created date</div>
                            <div style={valueStyle}>{formatDate(tenant.createdAt)}</div>
                        </div>
                        <div>
                            <div style={labelStyle}>Status</div>
                            <div style={valueStyle}>{tenant.status}</div>
                        </div>
                    </div>
                ) : (
                    <EmptyState title="Organization not found" description="Tenant details are unavailable right now." />
                )}
            </section>

            <section style={sectionStyle}>
                <div style={membersHeaderStyle}>
                    <div>
                        <h2 style={sectionTitleStyle}>Members</h2>
                        <p style={subtleText}>{members.length} users in this organization</p>
                    </div>
                </div>

                {members.length === 0 ? (
                    <EmptyState title="No members yet" description="Invite users to start collaborating." />
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={tableStyle}>
                            <thead>
                                <tr>
                                    <th style={thStyle}>User</th>
                                    <th style={thStyle}>Email</th>
                                    <th style={thStyle}>Role</th>
                                    <th style={thStyle}>Status</th>
                                    <th style={thStyle}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {members.map((member) => (
                                    <tr key={member.id} style={trStyle}>
                                        <td style={tdStyle}>{member.name}</td>
                                        <td style={tdStyle}>{member.email}</td>
                                        <td style={tdStyle}>
                                            {can('update_user_role') ? (
                                                <RoleDropdown user={member} onUpdated={loadOrganization} />
                                            ) : (
                                                toUiRole(member.role)
                                            )}
                                        </td>
                                        <td style={tdStyle}>
                                            <span style={statusStyle}>{member.status}</span>
                                        </td>
                                        <td style={tdStyle}>
                                            {can('delete_user') ? (
                                                <button type="button" onClick={() => handleRemove(member)} style={dangerButtonStyle}>
                                                    Remove
                                                </button>
                                            ) : (
                                                <span style={subtleText}>No actions</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            <section style={sectionStyle}>
                <h2 style={sectionTitleStyle}>Actions</h2>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {can('invite_user') && (
                        <button type="button" onClick={() => setShowInvite(true)} style={primaryButtonStyle}>
                            Invite user
                        </button>
                    )}
                    <span style={subtleText}>Use member row actions to remove users or change roles.</span>
                </div>
            </section>

            {showInvite && (
                <InviteUserModal
                    onClose={() => setShowInvite(false)}
                    onInvited={handleInvited}
                />
            )}
        </div>
    );
};

const formatDate = (value) => {
    if (!value) return 'Not available';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
};

const pageStyle = { padding: 16, maxWidth: 1120, margin: '0 auto' };
const headerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: 16 };
const sectionStyle = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 16, marginBottom: 16 };
const sectionTitleStyle = { margin: '0 0 12px', fontSize: 18 };
const infoGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 };
const labelStyle = { color: '#6b7280', fontSize: 13, marginBottom: 4 };
const valueStyle = { fontWeight: 700 };
const subtleText = { margin: '6px 0 0', color: '#6b7280' };
const membersHeaderStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 };
const tableStyle = { width: '100%', borderCollapse: 'collapse' };
const thStyle = { textAlign: 'left', padding: '12px 10px', color: '#374151', background: '#f9fafb', fontSize: 14 };
const tdStyle = { padding: '12px 10px', verticalAlign: 'middle' };
const trStyle = { borderTop: '1px solid #eef2f7' };
const primaryButtonStyle = { padding: '10px 14px', border: '1px solid #2563eb', background: '#2563eb', color: '#fff', borderRadius: 6, cursor: 'pointer' };
const dangerButtonStyle = { padding: '8px 12px', background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca', borderRadius: 6, cursor: 'pointer' };
const statusStyle = { display: 'inline-flex', padding: '4px 8px', background: '#f3f4f6', color: '#374151', borderRadius: 999, fontSize: 12, fontWeight: 700 };

export default OrganizationSettings;
