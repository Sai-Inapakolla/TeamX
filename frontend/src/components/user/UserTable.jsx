import React from 'react';
import RoleDropdown from './RoleDropdown';
import { usePermissions } from '../../hooks/usePermissions';

const UserTable = ({ users, onUserUpdated, onUserDeleted }) => {
    const { can } = usePermissions();

    return (
        <div style={{ overflowX: 'auto', border: '1px solid #e5e7eb', borderRadius: 8 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: '#f9fafb' }}>
                    <tr>
                        <th style={thStyle}>Name</th>
                        <th style={thStyle}>Email</th>
                        <th style={thStyle}>Role</th>
                        <th style={thStyle}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map((user) => (
                        <tr key={user.id} style={{ borderTop: '1px solid #eee' }}>
                            <td style={tdStyle}>{user.name}</td>
                            <td style={tdStyle}>{user.email}</td>
                            <td style={tdStyle}>
                                <RoleDropdown user={user} onUpdated={onUserUpdated} />
                            </td>
                            <td style={tdStyle}>
                                {can('delete_user') ? (
                                    <button
                                        onClick={() => onUserDeleted(user.id)}
                                        style={{ padding: '6px 10px', background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca' }}
                                    >
                                        Delete
                                    </button>
                                ) : (
                                    <span style={{ color: '#9ca3af' }}>No actions</span>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const thStyle = {
    textAlign: 'left',
    padding: '12px 16px',
    fontSize: 14,
    color: '#374151',
};

const tdStyle = {
    padding: '12px 16px',
    verticalAlign: 'middle',
};

export default UserTable;