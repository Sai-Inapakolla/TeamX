import React, { useState } from 'react';
import { updateUserRole } from '../../api/userApi';
import { normalizeRole, toBackendRole } from '../../utils/permissions';

const ROLE_OPTIONS = ['ADMIN', 'MANAGER', 'USER'];

const RoleDropdown = ({ user, onUpdated }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const value = normalizeRole(user.role) || 'USER';

    const handleChange = async (event) => {
        const nextRole = event.target.value;
        setLoading(true);
        setError('');
        try {
            const updated = await updateUserRole(user.id, toBackendRole(nextRole));
            onUpdated(updated);
        } catch (err) {
            setError(err?.response?.data?.message || 'Failed to update role');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <select value={value} onChange={handleChange} disabled={loading} style={{ padding: 6 }}>
                {ROLE_OPTIONS.map((role) => (
                    <option key={role} value={role}>{role}</option>
                ))}
            </select>
            {error && <small style={{ color: 'crimson' }}>{error}</small>}
        </div>
    );
};

export default RoleDropdown;