import React, { useState } from 'react';
import { inviteUser } from '../../api/userApi';
import { toBackendRole } from '../../utils/permissions';
import { UserPlus, X, CheckCircle2, Copy, ExternalLink } from 'lucide-react';

const ROLE_OPTIONS = ['ADMIN', 'MANAGER', 'EMPLOYEE'];

const InviteUserModal = ({ onClose, onInvited }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('EMPLOYEE');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(null);
    const [copied, setCopied] = useState(false);

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

    const handleCopy = () => {
        if (success?.inviteUrl) {
            navigator.clipboard.writeText(success.inviteUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', display: 'grid', placeItems: 'center' }}>
                            <UserPlus size={20} />
                        </div>
                        <h2 style={{ margin: 0 }}>Invite Team Member</h2>
                    </div>
                    <button type="button" onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8' }}>
                        <X size={20} />
                    </button>
                </div>

                {error && <div className="form-error">{error}</div>}

                {success ? (
                    <div style={{ display: 'grid', gap: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#059669', fontWeight: 600 }}>
                            <CheckCircle2 size={20} />
                            <span>User invited successfully!</span>
                        </div>

                        {success.inviteUrl && (
                            <div style={{ padding: 16, background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 12 }}>
                                <div style={{ color: '#64748b', fontSize: 12, marginBottom: 6, fontWeight: 600 }}>INVITATION LINK</div>
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                    <input
                                        readOnly
                                        value={success.inviteUrl}
                                        className="form-input"
                                        style={{ fontSize: 12, background: '#ffffff', color: '#0f172a' }}
                                    />
                                    <button
                                        type="button"
                                        onClick={handleCopy}
                                        className="btn-secondary"
                                        style={{ padding: '10px 14px', whiteSpace: 'nowrap', fontSize: 12 }}
                                    >
                                        <Copy size={14} />
                                        <span>{copied ? 'Copied!' : 'Copy'}</span>
                                    </button>
                                </div>
                            </div>
                        )}

                        {success.temporaryPassword && (
                            <div style={{ padding: 16, background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 12, fontSize: 14 }}>
                                <div style={{ color: '#64748b', fontSize: 12, marginBottom: 4, fontWeight: 600 }}>TEMPORARY PASSWORD</div>
                                <code style={{ fontSize: 16, fontWeight: 700, color: '#4f46e5' }}>{success.temporaryPassword}</code>
                            </div>
                        )}

                        <div className="modal-actions">
                            {success.inviteUrl && (
                                <a
                                    href={success.inviteUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="btn-secondary"
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                                >
                                    <span>Open Link</span>
                                    <ExternalLink size={14} />
                                </a>
                            )}
                            <button type="button" onClick={onClose} className="btn-primary">Close</button>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <div className="form-row">
                            <label htmlFor="invite-name">Full Name</label>
                            <input
                                id="invite-name"
                                required
                                className="form-input"
                                placeholder="e.g. Sai"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                        <div className="form-row">
                            <label htmlFor="invite-email">Work Email</label>
                            <input
                                id="invite-email"
                                required
                                type="email"
                                className="form-input"
                                placeholder="inapakolla.sai1@gmail.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div className="form-row">
                            <label htmlFor="invite-role">Role</label>
                            <select id="invite-role" className="form-input" value={role} onChange={(e) => setRole(e.target.value)}>
                                {ROLE_OPTIONS.map((option) => (
                                    <option key={option} value={option}>{option}</option>
                                ))}
                            </select>
                        </div>
                        <div className="modal-actions">
                            <button type="button" onClick={onClose}>Cancel</button>
                            <button type="submit" disabled={loading}>{loading ? 'Inviting...' : 'Send Invite'}</button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default InviteUserModal;