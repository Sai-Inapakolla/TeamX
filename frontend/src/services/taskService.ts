import api from './api';

export interface Task {
    id: number;
    projectId: number;
    title: string;
    description?: string;
    assignedTo?: number;
    status: string;
    priority: string;
    dueDate?: string;
    createdAt?: string;
    updatedAt?: string;
}

export const taskService = {
    getByProject: async (projectId: number): Promise<Task[]> => {
        const response = await api.get<Task[]>(`/projects/${projectId}/tasks`);
        return response.data;
    },

    create: async (projectId: number, data: Partial<Task>): Promise<Task> => {
        const response = await api.post<Task>(`/projects/${projectId}/tasks`, data);
        return response.data;
    },

    update: async (projectId: number, taskId: number, data: Partial<Task>): Promise<Task> => {
        const response = await api.put<Task>(`/projects/${projectId}/tasks/${taskId}`, data);
        return response.data;
    },
};
