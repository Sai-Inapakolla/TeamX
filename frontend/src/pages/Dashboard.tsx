import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectService, Project } from '../services/projectService';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Dashboard.css';

const Dashboard: React.FC = () => {
    const { hasPermission, logout, user, activeTenant } = useAuth();
    const navigate = useNavigate();
    const canReadProjects = hasPermission('PROJECT_READ');
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (canReadProjects) {
            loadProjects();
        } else {
            setLoading(false);
        }
    }, [canReadProjects]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const loadProjects = async () => {
        try {
            const data = await projectService.getAll();
            setProjects(data);
        } catch (error) {
            console.error('Failed to load projects:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <div>
                    <h1>{activeTenant?.name ? `${activeTenant.name} Dashboard` : 'Dashboard'}</h1>
                    {activeTenant?.role && <p className="user-label">Role: {activeTenant.role}</p>}
                </div>
                <div className="dashboard-actions">
                    <span className="user-label">{user?.email}</span>
                    <button className="logout-button" onClick={handleLogout}>
                        Logout
                    </button>
                </div>
            </div>

            <div className="dashboard-content">
                <div className="stats-grid">
                    <div className="stat-card">
                        <h3>Total Projects</h3>
                        <p className="stat-value">{projects.length}</p>
                    </div>

                    <div className="stat-card">
                        <h3>Active Projects</h3>
                        <p className="stat-value">
                            {projects.filter(p => p.status === 'ACTIVE').length}
                        </p>
                    </div>
                </div>

                <div className="recent-projects">
                    <h2>Recent Projects</h2>

                    {!canReadProjects ? (
                        <p>You do not have permission to view projects.</p>
                    ) : loading ? (
                        <p>Loading...</p>
                    ) : (
                        <div className="project-list">
                            {projects.map(project => (
                                <div key={project.id} className="project-card">
                                    <h3>{project.name}</h3>
                                    <p>{project.description}</p>
                                    <span className="status">{project.status}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
