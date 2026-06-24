import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { usePermissions } from '../../hooks/usePermissions';

const Sidebar: React.FC = () => {
    const { companyId } = useParams<{ companyId: string }>();
    const { can } = usePermissions();

    return (
        <div className="layout-sidebar">
            <nav className="layout-sidebar__nav">
                <Link to={companyId ? `/company/${companyId}/dashboard` : '/dashboard'}>Dashboard</Link>
                <Link to="/projects">Projects</Link>
                {can('manage_users') && <Link to="/users">Users</Link>}
                {can('manage_users') && <Link to="/organization">Organization</Link>}
                <a href="#">Board</a>
                <a href="#">Reports</a>
            </nav>
        </div>
    );
};

export default Sidebar;
