import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import PermissionGuard from './components/permissions/PermissionGuard';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ProjectsList from './pages/projects/ProjectsList';
import ProjectDetails from './pages/projects/ProjectDetails';
import TeamsPage from './pages/teams/TeamsPage';
import AnalyticsPage from './pages/analytics/AnalyticsPage';
import TasksPage from './pages/tasks/TasksPage';
import UsersPage from './pages/users/UsersPage';
import OrganizationSettings from './pages/tenant/OrganizationSettings';
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
                    <Route path="/register" element={<Register />} />
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
                    <Route path="/projects" element={<ProjectsList />} />
                    <Route path="/projects/:id" element={<ProjectDetails />} />
                    <Route
                        path="/tasks"
                        element={
                            <PermissionGuard permission="TASK_READ" fallback={<Navigate to="/dashboard" replace />}>
                                <TasksPage />
                            </PermissionGuard>
                        }
                    />
                    <Route
                        path="/teams"
                        element={
                            <PermissionGuard permission="manage_users" fallback={<Navigate to="/dashboard" replace />}>
                                <TeamsPage />
                            </PermissionGuard>
                        }
                    />
                    <Route
                        path="/analytics"
                        element={
                            <PermissionGuard permission="PROJECT_READ" fallback={<Navigate to="/dashboard" replace />}>
                                <AnalyticsPage />
                            </PermissionGuard>
                        }
                    />
                    <Route
                        path="/users"
                        element={
                            <PermissionGuard permission="manage_users" fallback={<Navigate to="/dashboard" replace />}>
                                <UsersPage />
                            </PermissionGuard>
                        }
                    />
                    <Route
                        path="/organization"
                        element={
                            <PermissionGuard permission="tenant_settings" fallback={<Navigate to="/dashboard" replace />}>
                                <OrganizationSettings />
                            </PermissionGuard>
                        }
                    />
                    <Route path="/" element={<DashboardEntryRoute />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
};

export default App;
