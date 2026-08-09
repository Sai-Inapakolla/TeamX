import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/authService';
import { useAuth } from '../contexts/AuthContext';
import { Layers, ShieldCheck, Zap, Users, ArrowRight, Lock, Mail, Building, User } from 'lucide-react';
import '../styles/Login.css';

const Register: React.FC = () => {
    const [orgName, setOrgName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await authService.register({ orgName, email, password, firstName, lastName });
            const resp = await login({ email, password });
            if (resp.activeTenant?.id) {
                navigate(`/company/${resp.activeTenant.id}/dashboard`);
            } else {
                navigate('/dashboard');
            }
        } catch (err: any) {
            setError(err?.response?.data?.message || err?.response?.data?.error || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            {/* Hero Branding Column */}
            <div className="login-hero">
                <div className="login-hero__brand" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img
                        src="/Logo-TeamX.png"
                        alt="TeamX Logo"
                        style={{ height: '44px', width: '44px', objectFit: 'cover', borderRadius: '10px', boxShadow: '0 4px 16px rgba(6, 182, 212, 0.3)' }}
                    />
                    <span style={{ fontSize: '20px', fontWeight: 800, color: '#ffffff' }}>TeamX Platform</span>
                </div>

                <div className="login-hero__content">
                    <h1 className="login-hero__title">
                        Start your 14-day Enterprise Organization trial
                    </h1>
                    <p className="login-hero__description">
                        Set up your organization tenant, onboard your team members, and manage tasks with state-of-the-art SaaS tooling.
                    </p>

                    <div className="login-hero__features">
                        <div className="feature-pill">
                            <Building size={18} className="text-amber-400" />
                            <span>Instant Organization</span>
                        </div>
                        <div className="feature-pill">
                            <ShieldCheck size={18} className="text-emerald-400" />
                            <span>Role Permissioning</span>
                        </div>
                        <div className="feature-pill">
                            <Users size={18} className="text-indigo-400" />
                            <span>Unlimited Members</span>
                        </div>
                        <div className="feature-pill">
                            <Zap size={18} className="text-cyan-400" />
                            <span>Sprint Tracking</span>
                        </div>
                    </div>
                </div>

                <div style={{ fontSize: 13, color: '#64748b' }}>
                    © 2026 TeamX Technologies Inc. All rights reserved.
                </div>
            </div>

            {/* Registration Card Form Column */}
            <div className="login-card-wrapper">
                <div className="login-box" style={{ maxWidth: 480 }}>
                    <h1>Create Organization</h1>
                    <h2>Set up your company workspace and administrator account</h2>

                    {error && <div className="error-message">{error}</div>}

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Organization Name</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    value={orgName}
                                    onChange={(e) => setOrgName(e.target.value)}
                                    placeholder="Acme Corp"
                                    required
                                    style={{ paddingLeft: 40 }}
                                />
                                <Building
                                    size={18}
                                    style={{ position: 'absolute', left: 14, top: 14, color: '#94a3b8' }}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <div className="form-group">
                                <label>First Name</label>
                                <input
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    placeholder="Alex"
                                />
                            </div>
                            <div className="form-group">
                                <label>Last Name</label>
                                <input
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    placeholder="Smith"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Work Email</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="alex@acme.com"
                                    required
                                    style={{ paddingLeft: 40 }}
                                />
                                <Mail
                                    size={18}
                                    style={{ position: 'absolute', left: 14, top: 14, color: '#94a3b8' }}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Password</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••••••"
                                    required
                                    style={{ paddingLeft: 40 }}
                                />
                                <Lock
                                    size={18}
                                    style={{ position: 'absolute', left: 14, top: 14, color: '#94a3b8' }}
                                />
                            </div>
                        </div>

                        <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: 8 }} disabled={loading}>
                            {loading ? 'Creating Account...' : 'Get Started Free'}
                            <ArrowRight size={16} />
                        </button>

                        <div style={{ marginTop: 20, textAlign: 'center', fontSize: 14, color: '#64748b' }}>
                            Already have an account?{' '}
                            <Link to="/login" style={{ color: '#4f46e5', fontWeight: 700 }}>
                                Sign in
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Register;
