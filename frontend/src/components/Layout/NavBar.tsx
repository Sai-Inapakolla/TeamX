import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import NotificationBell from '../notifications/NotificationBell';

const NavBar: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="layout-navbar">
            <div className="layout-navbar__brand">TeamX</div>
            <div className="layout-navbar__actions">
                <NotificationBell />
                <span>{user?.email}</span>
                <button onClick={handleLogout}>Logout</button>
            </div>
        </div>
    );
};

export default NavBar;
