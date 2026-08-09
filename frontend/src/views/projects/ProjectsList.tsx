import React, { useEffect, useState } from 'react';
import { projectService, Project } from '../../services/projectService';
import ProjectCard from '../../components/project/ProjectCard';
import CreateProjectModal from '../../components/project/CreateProjectModal';
import { usePermissions } from '../../hooks/usePermissions';
import Loader from '../../components/ui/Loader';
import ErrorMessage from '../../components/ui/ErrorMessage';
import EmptyState from '../../components/ui/EmptyState';
import NavBar from '../../components/Layout/NavBar';
import Sidebar from '../../components/Layout/Sidebar';
import { recordActivity, recordNotification } from '../../utils/activityStore';
import { Plus, Search, FolderKanban, Filter } from 'lucide-react';

const ProjectsList: React.FC = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showCreate, setShowCreate] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'PLANNING' | 'COMPLETED'>('ALL');
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
        setProjects(prev => [project, ...prev]);
        recordActivity({ message: `Created project "${project.name}"`, projectId: project.id, type: 'project_created' });
        recordNotification({ message: `Project "${project.name}" created`, projectId: project.id });
    };

    const filteredProjects = projects.filter((project) => {
        const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (project.description || '').toLowerCase().includes(searchTerm.toLowerCase());
        
        if (statusFilter === 'ALL') return matchesSearch;
        return matchesSearch && (project.status === statusFilter);
    });

    return (
        <div className="route-shell">
            <NavBar />
            <div style={{ display: 'flex' }}>
                <Sidebar />
                <main className="page-shell">
                    <div className="page-header">
                        <div>
                            <h1 className="page-title">Projects</h1>
                            <p className="page-subtitle">Manage organization projects, track status, and view sprint goals</p>
                        </div>
                        {canCreate && (
                            <button className="btn-primary" onClick={() => setShowCreate(true)}>
                                <Plus size={18} />
                                <span>Create Project</span>
                            </button>
                        )}
                    </div>

                    {/* Filter & Search Bar */}
                    <div style={{ display: 'flex', gap: 16, marginBottom: 28, flexWrap: 'wrap', alignItems: 'center' }}>
                        <div style={{ flex: 1, minWidth: 280, position: 'relative' }}>
                            <input
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search projects by name or description..."
                                className="search-input"
                                style={{ paddingLeft: 42, marginBottom: 0 }}
                            />
                            <Search size={18} style={{ position: 'absolute', left: 14, top: 14, color: '#94a3b8' }} />
                        </div>

                        <div style={{ display: 'flex', gap: 8, background: '#ffffff', padding: 4, borderRadius: 12, border: '1px solid #cbd5e1' }}>
                            {(['ALL', 'ACTIVE', 'PLANNING', 'COMPLETED'] as const).map((st) => (
                                <button
                                    key={st}
                                    onClick={() => setStatusFilter(st)}
                                    style={{
                                        border: 'none',
                                        padding: '8px 14px',
                                        borderRadius: 8,
                                        fontSize: 13,
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        background: statusFilter === st ? '#6366f1' : 'transparent',
                                        color: statusFilter === st ? '#ffffff' : '#64748b',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    {st.charAt(0) + st.slice(1).toLowerCase()}
                                </button>
                            ))}
                        </div>
                    </div>

                    {loading ? <Loader label="Loading projects catalog..." /> : null}
                    {error && <ErrorMessage message={error} />}

                    {!loading && !error && filteredProjects.length === 0 ? (
                        <EmptyState
                            title={searchTerm ? 'No matching projects found' : 'No projects created yet'}
                            description={searchTerm ? 'Try adjusting your search criteria or filters.' : 'Click "Create Project" to get started.'}
                        />
                    ) : null}

                    <div className="project-grid-dashboard">
                        {filteredProjects.map(p => (
                            <ProjectCard key={p.id} project={p} />
                        ))}
                    </div>

                    {showCreate && <CreateProjectModal onClose={() => setShowCreate(false)} onCreated={handleCreated} />}
                </main>
            </div>
        </div>
    );
};

export default ProjectsList;
