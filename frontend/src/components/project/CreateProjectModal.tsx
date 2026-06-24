import React, { useState } from 'react';
import { projectService, Project } from '../../services/projectService';

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
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: 'white', padding: 20, borderRadius: 8, width: 480 }}>
                <h2>Create Project</h2>
                {error && <div style={{ color: 'red' }}>{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: 8 }}>
                        <label>Project name</label>
                        <input required style={{ width: '100%', padding: 8 }} value={name} onChange={(e) => setName(e.target.value)} />
                    </div>
                    <div style={{ marginBottom: 8 }}>
                        <label>Description</label>
                        <textarea style={{ width: '100%', padding: 8 }} value={description} onChange={(e) => setDescription(e.target.value)} />
                    </div>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <button type="button" onClick={onClose}>Cancel</button>
                        <button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateProjectModal;
