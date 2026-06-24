import React, { useState } from 'react';
import { inviteUser } from '../../api/userApi';
import { toBackendRole } from '../../utils/permissions';

const ROLE_OPTIONS = ['ADMIN', 'MANAGER', 'USER'];

const InviteUserModal = ({ onClose, onInvited }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('USER');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(null);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        setError('');
        try {
            const response = await inviteUser({ name, email, role: toBackendRole(role) });
            setSuccess(response);
            onInvited(response);
        } catch (err) {
            setError(err?.response?.data?.message || 'Failed to invite user');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={overlayStyle}>
            <div style={modalStyle}>
                <h2 style={{ marginTop: 0 }}>Invite User</h2>
                {error && <div style={{ color: 'crimson', marginBottom: 12 }}>{error}</div>}
                {success ? (
                    <div style={{ display: 'grid', gap: 12 }}>
                        <div>User invited successfully.</div>
                        {success.temporaryPassword && (
                            <div style={{ padding: 12, background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 6 }}>
                                Temporary password: <strong>{success.temporaryPassword}</strong>
                            </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button type="button" onClick={onClose}>Close</button>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <div style={fieldStyle}>
                            <label>Name</label>
                            <input required value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
                        </div>
                        <div style={fieldStyle}>
                            <label>Email</label>
                            <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
                        </div>
                        <div style={fieldStyle}>
                            <label>Role</label>
                            <select value={role} onChange={(e) => setRole(e.target.value)} style={inputStyle}>
                                {ROLE_OPTIONS.map((option) => (
                                    <option key={option} value={option}>{option}</option>
                                ))}
                            </select>
                        </div>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
                            <button type="button" onClick={onClose}>Cancel</button>
                            <button type="submit" disabled={loading}>{loading ? 'Inviting...' : 'Invite'}</button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

const overlayStyle = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0, 0, 0, 0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
};

const modalStyle = {
    background: '#fff',
    borderRadius: 12,
    width: 520,
    maxWidth: 'calc(100vw - 32px)',
    padding: 24,
    boxShadow: '0 20px 50px rgba(0, 0, 0, 0.18)',
};

const fieldStyle = {
    display: 'grid',
    gap: 6,
    marginBottom: 12,
};

const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: 6,
};

export default InviteUserModal;