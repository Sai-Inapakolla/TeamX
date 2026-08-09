import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import NotificationBell from '../notifications/NotificationBell';
import { ShieldCheck, LogOut, Building, Search } from 'lucide-react';
import { toUiRole } from '../../utils/permissions';

const NavBar: React.FC = () => {
    const { user, activeTenant, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const userInitial = user?.email ? user.email.charAt(0).toUpperCase() : 'U';

    return (
        <header className="layout-navbar">
            <div className="layout-navbar__brand" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <img
                    src="/Logo-TeamX.png"
                    alt="TeamX Logo"
                    style={{ height: '36px', width: '36px', objectFit: 'cover', borderRadius: '8px', boxShadow: '0 2px 10px rgba(6, 182, 212, 0.25)' }}
                />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', lineHeight: 1.1 }}>TeamX</span>
                    <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#64748b' }}>Command</span>
                </div>
            </div>

            <div className="layout-navbar__search">
                <Search size={16} className="text-slate-400" />
                <input
                    type="text"
                    placeholder="Search projects, people, alerts..."
                    className="layout-navbar__search-input"
                />
            </div>

            <div className="layout-navbar__actions">
                {activeTenant && (
                    <div className="user-badge" title={`Active Organization: ${activeTenant.name}`}>
                        <Building size={14} className="text-indigo-500" />
                        <span>{activeTenant.name}</span>
                        <span className="badge-pill badge-pill--indigo" style={{ padding: '2px 8px', fontSize: '11px' }}>
                            {toUiRole(activeTenant.role || 'Member')}
                        </span>
                    </div>
                )}

                <NotificationBell />

                <div className="user-badge">
                    <div className="user-avatar">{userInitial}</div>
                    <span>{user?.email}</span>
                </div>

                <button onClick={handleLogout} className="logout-button" title="Log Out">
                    <LogOut size={15} />
                    <span>Logout</span>
                </button>
            </div>
        </header>
    );
};

export default NavBar;

