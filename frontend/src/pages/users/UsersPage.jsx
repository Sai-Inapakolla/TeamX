import React, { useEffect, useState } from 'react';
import { deleteUser, getUsers } from '../../api/userApi';
import InviteUserModal from '../../components/user/InviteUserModal';
import UserTable from '../../components/user/UserTable';
import { usePermissions } from '../../hooks/usePermissions';
import Loader from '../../components/ui/Loader';
import ErrorMessage from '../../components/ui/ErrorMessage';
import EmptyState from '../../components/ui/EmptyState';
import { recordActivity, recordNotification } from '../../utils/activityStore';

const UsersPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showInvite, setShowInvite] = useState(false);
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

    return (
        <div style={{ padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                    <h1 style={{ margin: 0 }}>Users</h1>
                    <p style={{ margin: '6px 0 0', color: '#6b7280' }}>Manage company members and roles.</p>
                </div>
                {can('invite_user') && (
                    <button onClick={() => setShowInvite(true)} style={{ padding: '10px 14px' }}>
                        + Invite User
                    </button>
                )}
            </div>

            {loading && <Loader label="Loading users..." />}
            {error && <div style={{ marginBottom: 12 }}><ErrorMessage message={error} /></div>}

            {!loading && !error && (
                users.length === 0 ? (
                    <EmptyState title="No users yet" description="Invite a teammate to join this organization." />
                ) : (
                    <UserTable users={users} onUserUpdated={loadUsers} onUserDeleted={handleDeleted} />
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
        </div>
    );
};

export default UsersPage;
