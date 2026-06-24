import React from 'react';
import { Project } from '../../services/projectService';
import { useNavigate } from 'react-router-dom';

const ProjectCard: React.FC<{ project: Project }> = ({ project }) => {
    const navigate = useNavigate();

    return (
        <div style={{ border: '1px solid #e0e0e0', borderRadius: 8, padding: 12, width: 280, cursor: 'pointer' }} onClick={() => navigate(`/projects/${project.id}`)}>
            <h3 style={{ margin: '0 0 8px 0' }}>{project.name}</h3>
            <p style={{ margin: '0 0 8px 0', color: '#555' }}>{project.description}</p>
            <div style={{ fontSize: 12, color: '#888' }}>Created: {project.createdAt ? new Date(project.createdAt).toLocaleString() : '-'}</div>
        </div>
    );
};

export default ProjectCard;
