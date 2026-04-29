import api from './api';

export interface Project {
    id: number;
    name: string;
    description: string;
    ownerId: number;
    status: string;
    createdAt: string;
    updatedAt: string;
}

export const projectService = {
    getAll: async (): Promise<Project[]> => {
        const response = await api.get<Project[]>('/projects');
        return response.data;
    },

    getById: async (id: number): Promise<Project> => {
        const response = await api.get<Project>(`/projects/${id}`);
        return response.data;
    },

    create: async (data: Partial<Project>): Promise<Project> => {
        const response = await api.post<Project>('/projects', data);
        return response.data;
    },
};
