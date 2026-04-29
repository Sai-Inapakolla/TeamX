import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { TenantInfo } from '../services/authService';
import '../styles/Login.css';

const Login: React.FC = () => {
    const [step, setStep] = useState<'credentials' | 'company'>('credentials');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [availableTenants, setAvailableTenants] = useState<TenantInfo[]>([]);
    const [selectedTenantId, setSelectedTenantId] = useState<number | null>(null);
    const [error, setError] = useState('');
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

        try {
            const response = await login({ email, password });

            if (response.requiresTenantSelection) {
                const activeTenants = response.tenants.filter((tenant) => tenant.status === 'ACTIVE');
                setAvailableTenants(activeTenants);
                if (activeTenants.length === 0) {
                    setError('No active company access found for this user.');
                    return;
                }

                if (companyIdFromRoute) {
                    const matchedTenant = activeTenants.find((tenant) => tenant.id === companyIdFromRoute);
                    if (!matchedTenant) {
                        setError('You do not have access to this company.');
                        return;
                    }
                    setSelectedTenantId(matchedTenant.id);
                } else {
                    setSelectedTenantId(activeTenants[0].id);
                }
                setStep('company');
                return;
            }

            if (response.activeTenant?.id) {
                navigate(`/company/${response.activeTenant.id}/dashboard`);
            } else {
                navigate('/dashboard');
            }
        } catch (err: any) {
            setError(getErrorMessage(err, 'Login failed'));
        }
    };

    const handleCompanySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!selectedTenantId) {
            setError('Please select a company to continue.');
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
            <div className="login-box">
                <h1>SaaS Platform</h1>
                <h2>{step === 'credentials' ? 'Login' : 'Select Company'}</h2>

                {error && <div className="error-message">{error}</div>}

                {step === 'credentials' ? (
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="email">Email</label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">Password</label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <button type="submit" className="btn-primary">
                            Continue
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleCompanySubmit}>
                        <div className="form-group">
                            <label htmlFor="company">Company</label>
                            <select
                                id="company"
                                value={selectedTenantId ?? ''}
                                onChange={(e) => setSelectedTenantId(Number(e.target.value))}
                                required
                            >
                                {availableTenants.map((tenant) => (
                                    <option key={tenant.id} value={tenant.id}>
                                        {tenant.name} ({tenant.role})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <button type="submit" className="btn-primary">
                            Enter Dashboard
                        </button>
                        <button type="button" className="btn-primary" onClick={resetToCredentials}>
                            Back
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default Login;
