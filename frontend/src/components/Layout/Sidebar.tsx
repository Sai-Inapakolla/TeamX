import React from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { usePermissions } from '../../hooks/usePermissions';
import {
    Gauge,
    FolderKanban,
    CheckSquare,
    Users,
    PieChart,
    Building2,
    ShieldCheck
} from 'lucide-react';

const Sidebar: React.FC = () => {
    const { companyId } = useParams<{ companyId: string }>();
    const { can } = usePermissions();
    const location = useLocation();

    const dashboardPath = companyId ? `/company/${companyId}/dashboard` : '/dashboard';

    const isActive = (path: string) => {
        if (path === '/dashboard' && (location.pathname === '/dashboard' || location.pathname.includes('/dashboard'))) {
            return true;
        }
        return location.pathname === path || (path !== '/dashboard' && location.pathname.startsWith(path));
    };

    return (
        <aside className="layout-sidebar">
            <nav className="layout-sidebar__nav">
                <Link
                    to={dashboardPath}
                    className={`nav-item ${isActive('/dashboard') ? 'active' : ''}`}
                >
                    <Gauge size={18} />
                    <span>Dashboard</span>
                </Link>

                <Link
                    to="/projects"
                    className={`nav-item ${isActive('/projects') ? 'active' : ''}`}
                >
                    <FolderKanban size={18} />
                    <span>Projects</span>
                </Link>

                <Link
                    to="/tasks"
                    className={`nav-item ${isActive('/tasks') ? 'active' : ''}`}
                >
                    <CheckSquare size={18} />
                    <span>Tasks</span>
                </Link>

                {can('PROJECT_READ') && (
                    <Link
                        to="/analytics"
                        className={`nav-item ${isActive('/analytics') ? 'active' : ''}`}
                    >
                        <PieChart size={18} />
                        <span>Analytics</span>
                    </Link>
                )}

                {can('manage_users') && (
                    <Link
                        to="/users"
                        className={`nav-item ${isActive('/users') ? 'active' : ''}`}
                    >
                        <Users size={18} />
                        <span>Team & Users</span>
                    </Link>
                )}

                {can('tenant_settings') && (
                    <Link
                        to="/organization"
                        className={`nav-item ${isActive('/organization') ? 'active' : ''}`}
                    >
                        <Building2 size={18} />
                        <span>Organization</span>
                    </Link>
                )}
            </nav>

            <div style={{ padding: '16px 12px', borderTop: '1px solid #e2e8f0', marginTop: 'auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#64748b', fontWeight: 600 }}>
                    <ShieldCheck size={16} className="text-emerald-500" />
                    <span>TeamX Enterprise v2.0</span>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;

