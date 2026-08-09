import React, { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { TenantInfo } from '../services/authService';
import { Layers, ShieldCheck, Zap, Users, ArrowRight, Lock, Mail, Building } from 'lucide-react';
import '../styles/Login.css';

const Login: React.FC = () => {
    const [step, setStep] = useState<'credentials' | 'company'>('credentials');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [availableTenants, setAvailableTenants] = useState<TenantInfo[]>([]);
    const [selectedTenantId, setSelectedTenantId] = useState<number | null>(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();
    const { companyId } = useParams<{ companyId: string }>();
    const companyIdFromRoute = companyId ? Number(companyId) : null;

    const getErrorMessage = (err: any, fallback: string) => {
        return err?.response?.data?.message
            || err?.response?.data?.detail
            || err?.response?.data?.error
            || fallback;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await login({ email, password });

            if (response.requiresTenantSelection) {
                const activeTenants = response.tenants.filter((tenant) => tenant.status === 'ACTIVE');
                setAvailableTenants(activeTenants);
                if (activeTenants.length === 0) {
                    setError('No active company access found for this user.');
                    setLoading(false);
                    return;
                }

                if (companyIdFromRoute) {
                    const matchedTenant = activeTenants.find((tenant) => tenant.id === companyIdFromRoute);
                    if (!matchedTenant) {
                        setError('You do not have access to this company.');
                        setLoading(false);
                        return;
                    }
                    setSelectedTenantId(matchedTenant.id);
                } else {
                    setSelectedTenantId(activeTenants[0].id);
                }
                setStep('company');
                setLoading(false);
                return;
            }

            if (response.activeTenant?.id) {
                navigate(`/company/${response.activeTenant.id}/dashboard`);
            } else {
                navigate('/dashboard');
            }
        } catch (err: any) {
            setError(getErrorMessage(err, 'Login failed'));
        } finally {
            setLoading(false);
        }
    };

    const handleCompanySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (!selectedTenantId) {
            setError('Please select a company to continue.');
            setLoading(false);
            return;
        }

        try {
            const response = await login({ email, password, selectedTenantId });
            if (response.accessToken && response.activeTenant) {
                navigate(`/company/${response.activeTenant.id}/dashboard`);
                return;
            }
            setError('Unable to start a company session. Please try again.');
        } catch (err: any) {
            setError(getErrorMessage(err, 'Company selection failed'));
        } finally {
            setLoading(false);
        }
    };

    const resetToCredentials = () => {
        setStep('credentials');
        setAvailableTenants([]);
        setSelectedTenantId(null);
        setError('');
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
                        Enterprise Team Workspace & Multi-Tenant Engine
                    </h1>
                    <p className="login-hero__description">
                        Streamline project execution, manage organizational teams, and drive sprint velocity with granular RBAC permissions.
                    </p>

                    <div className="login-hero__features">
                        <div className="feature-pill">
                            <Zap size={18} className="text-cyan-400" />
                            <span>Real-Time Kanban</span>
                        </div>
                        <div className="feature-pill">
                            <ShieldCheck size={18} className="text-emerald-400" />
                            <span>RBAC & Security</span>
                        </div>
                        <div className="feature-pill">
                            <Users size={18} className="text-indigo-400" />
                            <span>Team Collaboration</span>
                        </div>
                        <div className="feature-pill">
                            <Building size={18} className="text-amber-400" />
                            <span>Multi-Tenant SaaS</span>
                        </div>
                    </div>
                </div>

                <div style={{ fontSize: 13, color: '#64748b' }}>
                    © 2026 TeamX Technologies Inc. All rights reserved.
                </div>
            </div>

            {/* Login Card Form Column */}
            <div className="login-card-wrapper">
                <div className="login-box">
                    <h1>{step === 'credentials' ? 'Welcome back' : 'Select Workspace'}</h1>
                    <h2>
                        {step === 'credentials'
                            ? 'Enter your credentials to access your SaaS dashboard'
                            : 'Choose an active organization workspace to enter'}
                    </h2>

                    {error && <div className="error-message">{error}</div>}

                    {step === 'credentials' ? (
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label htmlFor="email">Work Email</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="name@company.com"
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
                                <label htmlFor="password">Password</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        id="password"
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
                                {loading ? 'Authenticating...' : 'Sign In'}
                                <ArrowRight size={16} />
                            </button>

                            <div style={{ marginTop: 24, textAlign: 'center', fontSize: 14, color: '#64748b' }}>
                                Don't have an account?{' '}
                                <Link to="/register" style={{ color: '#4f46e5', fontWeight: 700 }}>
                                    Create organization
                                </Link>
                            </div>
                        </form>
                    ) : (
                        <form onSubmit={handleCompanySubmit}>
                            <div className="form-group">
                                <label htmlFor="company">Organization Workspace</label>
                                <div style={{ position: 'relative' }}>
                                    <select
                                        id="company"
                                        value={selectedTenantId ?? ''}
                                        onChange={(e) => setSelectedTenantId(Number(e.target.value))}
                                        required
                                        style={{ paddingLeft: 40 }}
                                    >
                                        {availableTenants.map((tenant) => (
                                            <option key={tenant.id} value={tenant.id}>
                                                {tenant.name} ({tenant.role})
                                            </option>
                                        ))}
                                    </select>
                                    <Building
                                        size={18}
                                        style={{ position: 'absolute', left: 14, top: 14, color: '#94a3b8' }}
                                    />
                                </div>
                            </div>

                            <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: 8 }} disabled={loading}>
                                {loading ? 'Loading Workspace...' : 'Enter Dashboard'}
                                <ArrowRight size={16} />
                            </button>
                            <button
                                type="button"
                                className="btn-secondary"
                                onClick={resetToCredentials}
                                style={{ width: '100%', marginTop: 12 }}
                            >
                                Back to Login
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Login;
