import React, { useState } from 'react';
import { projectService, Project } from '../../services/projectService';
import { FolderPlus, X } from 'lucide-react';

interface Props {
    onClose: () => void;
    onCreated: (project: Project) => void;
}

const CreateProjectModal: React.FC<Props> = ({ onClose, onCreated }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const created = await projectService.create({ name, description });
            onCreated(created);
            onClose();
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Failed to create project');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', display: 'grid', placeItems: 'center' }}>
                            <FolderPlus size={20} />
                        </div>
                        <h2 style={{ margin: 0 }}>Create New Project</h2>
                    </div>
                    <button type="button" onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8' }}>
                        <X size={20} />
                    </button>
                </div>

                {error && <div className="form-error">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-row">
                        <label htmlFor="project-name">Project Name</label>
                        <input
                            id="project-name"
                            required
                            className="form-input"
                            placeholder="e.g. AI Sprint Planner"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>
                    <div className="form-row">
                        <label htmlFor="project-desc">Description</label>
                        <textarea
                            id="project-desc"
                            className="form-input form-textarea"
                            placeholder="Summarize sprint goals and scope..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>
                    <div className="modal-actions">
                        <button type="button" onClick={onClose}>Cancel</button>
                        <button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create Project'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateProjectModal;
