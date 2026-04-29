import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import './styles/App.css';

const DashboardEntryRoute: React.FC = () => {
    const token = localStorage.getItem('accessToken');
    const { activeTenant } = useAuth();

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    if (activeTenant?.id) {
        return <Navigate to={`/company/${activeTenant.id}/dashboard`} replace />;
    }

    return <Navigate to="/login" replace />;
};

const CompanyPrivateRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
    const token = localStorage.getItem('accessToken');
    const { companyId } = useParams<{ companyId: string }>();
    const { activeTenant } = useAuth();

    if (!token) {
        return <Navigate to="/login" />;
    }

    if (!companyId || !activeTenant || String(activeTenant.id) !== companyId) {
        return <Navigate to="/login" />;
    }

    return children;
};

const App: React.FC = () => {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/company/:companyId/login" element={<Login />} />
                    <Route path="/dashboard" element={<DashboardEntryRoute />} />
                    <Route
                        path="/company/:companyId/dashboard"
                        element={
                            <CompanyPrivateRoute>
                                <Dashboard />
                            </CompanyPrivateRoute>
                        }
                    />
                    <Route path="/" element={<DashboardEntryRoute />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
};

export default App;
