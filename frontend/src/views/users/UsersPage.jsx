import React, { useEffect, useState } from 'react';
import { deleteUser, getUsers } from '../../api/userApi';
import InviteUserModal from '../../components/user/InviteUserModal';
import UserTable from '../../components/user/UserTable';
import { usePermissions } from '../../hooks/usePermissions';
import Loader from '../../components/ui/Loader';
import ErrorMessage from '../../components/ui/ErrorMessage';
import EmptyState from '../../components/ui/EmptyState';
import NavBar from '../../components/Layout/NavBar';
import Sidebar from '../../components/Layout/Sidebar';
import { recordActivity, recordNotification } from '../../utils/activityStore';
import { UserPlus, Users, Search } from 'lucide-react';

const UsersPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showInvite, setShowInvite] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const { can } = usePermissions();

    const loadUsers = async () => {
        setLoading(true);
        setError('');
        try {
            const data = await getUsers();
            setUsers(data);
        } catch (err) {
            setError(err?.response?.data?.message || 'Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, []);

    const handleDeleted = async (userId) => {
        const user = users.find((item) => item.id === userId);
        try {
            await deleteUser(userId);
            recordActivity({ message: `Removed user "${user?.email || userId}"`, type: 'user_removed' });
            recordNotification({ message: `User removed: ${user?.email || userId}` });
            await loadUsers();
        } catch (err) {
            setError(err?.response?.data?.message || 'Failed to delete user');
        }
    };

    const filteredUsers = users.filter((u) => 
        (u.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.role || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="route-shell">
            <NavBar />
            <div style={{ display: 'flex' }}>
                <Sidebar />
                <main className="page-shell">
                    <div className="page-header">
                        <div>
                            <h1 className="page-title">Team Members & Permissions</h1>
                            <p className="page-subtitle">Manage organization users, role assignments, and member access status.</p>
                        </div>
                        {can('invite_user') && (
                            <button className="btn-primary" onClick={() => setShowInvite(true)}>
                                <UserPlus size={18} />
                                <span>Invite Member</span>
                            </button>
                        )}
                    </div>

                    <div style={{ position: 'relative', marginBottom: 24 }}>
                        <input
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search members by name, email, or role..."
                            className="search-input"
                            style={{ paddingLeft: 42, marginBottom: 0 }}
                        />
                        <Search size={18} style={{ position: 'absolute', left: 14, top: 14, color: '#94a3b8' }} />
                    </div>

                    {loading && <Loader label="Loading workspace members..." />}
                    {error && <div style={{ marginBottom: 16 }}><ErrorMessage message={error} /></div>}

                    {!loading && !error && (
                        filteredUsers.length === 0 ? (
                            <EmptyState
                                title={searchTerm ? 'No members match search' : 'No users in workspace'}
                                description={searchTerm ? 'Try adjusting your search criteria.' : 'Invite team members to collaborate on projects.'}
                            />
                        ) : (
                            <div className="surface-card" style={{ padding: 24 }}>
                                <UserTable users={filteredUsers} onUserUpdated={loadUsers} onUserDeleted={handleDeleted} />
                            </div>
                        )
                    )}

                    {showInvite && (
                        <InviteUserModal
                            onClose={() => setShowInvite(false)}
                            onInvited={async () => {
                                recordActivity({ message: 'Invited a user', type: 'user_invited' });
                                recordNotification({ message: 'A new user was invited' });
                                await loadUsers();
                            }}
                        />
                    )}
                </main>
            </div>
        </div>
    );
};

export default UsersPage;
