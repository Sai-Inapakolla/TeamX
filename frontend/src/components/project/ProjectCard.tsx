import React from 'react';
import { Project } from '../../services/projectService';
import { useNavigate } from 'react-router-dom';
import { FolderKanban, Calendar, ArrowUpRight } from 'lucide-react';

const ProjectCard: React.FC<{ project: Project }> = ({ project }) => {
    const navigate = useNavigate();

    const isDone = project.status === 'COMPLETED' || project.status === 'DONE';
    const isPlanning = project.status === 'PLANNING';

    const getStatusBadge = () => {
        if (isDone) {
            return <span className="badge-pill badge-pill--emerald">Completed</span>;
        }
        if (isPlanning) {
            return <span className="badge-pill badge-pill--amber">Planning</span>;
        }
        return <span className="badge-pill badge-pill--indigo">Active</span>;
    };

    return (
        <div
            className="surface-card"
            style={{
                padding: '24px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative'
            }}
            onClick={() => navigate(`/projects/${project.id}`)}
        >
            <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div
                        style={{
                            width: 40,
                            height: 40,
                            borderRadius: 12,
                            background: 'rgba(99, 102, 241, 0.1)',
                            color: '#6366f1',
                            display: 'grid',
                            placeItems: 'center'
                        }}
                    >
                        <FolderKanban size={20} />
                    </div>
                    {getStatusBadge()}
                </div>

                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>{project.name}</span>
                    <ArrowUpRight size={18} className="text-slate-400" />
                </h3>

                <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.5, marginBottom: 20, minHeight: 42 }}>
                    {project.description || 'No description provided for this project.'}
                </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 16, borderTop: '1px solid #f1f5f9', fontSize: 12, color: '#94a3b8' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Calendar size={14} />
                    <span>{project.createdAt ? new Date(project.createdAt).toLocaleDateString() : 'Recent'}</span>
                </div>
                <div style={{ fontWeight: 600, color: '#6366f1' }}>View Details &rarr;</div>
            </div>
        </div>
    );
};

export default ProjectCard;
