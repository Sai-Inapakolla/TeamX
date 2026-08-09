import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/authService';
import { useAuth } from '../contexts/AuthContext';
import { CheckCircle2, UserCheck, ShieldCheck, ArrowRight } from 'lucide-react';
import '../styles/Login.css';

const AcceptInvite: React.FC = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token') || '';
    const navigate = useNavigate();
    const { setSession } = useAuth();

    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password && password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);
        try {
            const response = await authService.acceptInvite({
                token,
                name: name ? name.trim() : undefined,
                password: password || undefined,
            });

            setSuccess(true);
            if (response.accessToken && response.activeTenant) {
                setSession(response);
                setTimeout(() => {
                    navigate(`/company/${response.activeTenant?.id}/dashboard`);
                }, 1200);
            }
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Failed to accept invitation. The link may have expired.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-hero">
                <div className="login-hero__brand">
                    <div className="login-hero__brand-icon">
                        <UserCheck size={26} color="#ffffff" />
                    </div>
                    <span>TeamX</span>
                </div>

                <div className="login-hero__content">
                    <h1 className="login-hero__title">You've been invited!</h1>
                    <p className="login-hero__description">
                        Complete your profile setup below to access your organization workspace and start collaborating with your team.
                    </p>

                    <div className="login-hero__features">
                        <div className="feature-pill">
                            <ShieldCheck size={20} style={{ color: '#818cf8' }} />
                            <span>Enterprise Security</span>
                        </div>
                        <div className="feature-pill">
                            <CheckCircle2 size={20} style={{ color: '#34d399' }} />
                            <span>Instant Access</span>
                        </div>
                    </div>
                </div>

                <div style={{ fontSize: 13, color: '#64748b' }}>
                    TeamX SaaS Platform &copy; 2026
                </div>
            </div>

            <div className="login-card-wrapper">
                <div className="login-box">
                    {!token ? (
                        <div style={{ textAlign: 'center', padding: '12px 0' }}>
                            <h1 style={{ color: '#e11d48', fontSize: 22 }}>Invalid Invitation Link</h1>
                            <h2>No invitation token was provided in the URL. Please ask your administrator for a new link.</h2>
                            <Link to="/login" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-flex', justifyContent: 'center', width: '100%', padding: '12px' }}>
                                Back to Login
                            </Link>
                        </div>
                    ) : success ? (
                        <div style={{ textAlign: 'center', padding: '16px 0' }}>
                            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(16, 185, 129, 0.12)', color: '#059669', display: 'grid', placeItems: 'center', margin: '0 auto 16px' }}>
                                <CheckCircle2 size={32} />
                            </div>
                            <h1>Invitation Accepted!</h1>
                            <h2>Redirecting to your workspace dashboard...</h2>
                        </div>
                    ) : (
                        <>
                            <h1>Accept Invitation</h1>
                            <h2>Set up your account credentials to continue</h2>

                            {error && <div className="error-message">{error}</div>}

                            <form onSubmit={handleSubmit}>
                                <div className="form-group" style={{ marginBottom: 18 }}>
                                    <label htmlFor="invite-fullname">Full Name (Optional)</label>
                                    <input
                                        id="invite-fullname"
                                        className="input-field"
                                        placeholder="e.g. Sai Inapakolla"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                    />
                                </div>

                                <div className="form-group" style={{ marginBottom: 18 }}>
                                    <label htmlFor="invite-password">Create Password</label>
                                    <input
                                        id="invite-password"
                                        type="password"
                                        required
                                        className="input-field"
                                        placeholder="At least 6 characters"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>

                                <div className="form-group" style={{ marginBottom: 24 }}>
                                    <label htmlFor="invite-confirm-password">Confirm Password</label>
                                    <input
                                        id="invite-confirm-password"
                                        type="password"
                                        required
                                        className="input-field"
                                        placeholder="Re-enter password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="btn-primary"
                                    style={{ width: '100%', padding: '14px', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                                >
                                    <span>{loading ? 'Joining workspace...' : 'Join Workspace'}</span>
                                    <ArrowRight size={18} />
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AcceptInvite;
