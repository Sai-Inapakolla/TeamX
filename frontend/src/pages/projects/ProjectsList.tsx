import React, { useEffect, useState } from 'react';
import { projectService, Project } from '../../services/projectService';
import ProjectCard from '../../components/project/ProjectCard';
import CreateProjectModal from '../../components/project/CreateProjectModal';
import { usePermissions } from '../../hooks/usePermissions';
import Loader from '../../components/ui/Loader';
import ErrorMessage from '../../components/ui/ErrorMessage';
import EmptyState from '../../components/ui/EmptyState';
import { recordActivity, recordNotification } from '../../utils/activityStore';

const ProjectsList: React.FC = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showCreate, setShowCreate] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const { can } = usePermissions();

    const canCreate = can('create_project');

    const load = async () => {
        setError('');
        setLoading(true);
        try {
            const data = await projectService.getAll();
            setProjects(data);
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Failed to load projects');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const handleCreated = (project: Project) => {
        // refresh list (prepend)
        setProjects(prev => [project, ...prev]);
        recordActivity({ message: `Created project "${project.name}"`, projectId: project.id, type: 'project_created' });
        recordNotification({ message: `Project "${project.name}" created`, projectId: project.id });
    };

    const filteredProjects = projects.filter((project) =>
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (project.description || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="page-shell projects-page">
            <div className="page-header">
                <h1>Projects</h1>
                {canCreate && <button onClick={() => setShowCreate(true)}>+ Create Project</button>}
            </div>

            <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search projects by name"
                className="search-input"
            />

            {loading ? <Loader label="Loading projects..." /> : null}
            {error && <ErrorMessage message={error} />}

            {!loading && !error && filteredProjects.length === 0 ? (
                <EmptyState
                    title={searchTerm ? 'No projects match your search' : 'No projects yet - create one'}
                    description={searchTerm ? 'Try a different project name or description.' : 'Start by creating your first project.'}
                />
            ) : null}

            <div className="card-grid">
                {filteredProjects.map(p => (
                    <ProjectCard key={p.id} project={p} />
                ))}
            </div>

            {showCreate && <CreateProjectModal onClose={() => setShowCreate(false)} onCreated={handleCreated} />}
        </div>
    );
};

export default ProjectsList;
