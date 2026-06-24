import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Login.css';

const Register: React.FC = () => {
    const [orgName, setOrgName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            await authService.register({ orgName, email, password, firstName, lastName });
            // reuse login flow to initialize context and tokens
            const resp = await login({ email, password });
            if (resp.activeTenant?.id) {
                navigate(`/company/${resp.activeTenant.id}/dashboard`);
            } else {
                navigate('/dashboard');
            }
        } catch (err: any) {
            setError(err?.response?.data?.message || err?.response?.data?.error || 'Registration failed');
        }
    };

    return (
        <div className="login-container">
            <div className="login-box">
                <h1>Register</h1>
                {error && <div className="error-message">{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Organization name</label>
                        <input value={orgName} onChange={(e) => setOrgName(e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label>First name</label>
                        <input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label>Last name</label>
                        <input value={lastName} onChange={(e) => setLastName(e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label>Email</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    </div>
                    <button type="submit" className="btn-primary">Create account</button>
                </form>
            </div>
        </div>
    );
};

export default Register;
