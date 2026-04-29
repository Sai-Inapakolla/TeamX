import api from './api';

export interface LoginRequest {
    email: string;
    password: string;
    selectedTenantId?: number;
}

export interface TenantInfo {
    id: number;
    name: string;
    role: string;
    status?: string;
    subdomain?: string | null;
}

export interface LoginResponse {
    accessToken: string | null;
    refreshToken: string | null;
    user: {
        id: number;
        email: string;
        firstName: string;
        lastName: string;
    };
    tenants: TenantInfo[];
    requiresTenantSelection: boolean;
    activeTenant: TenantInfo | null;
    permissions?: string[];
}

export const authService = {
    login: async (data: LoginRequest): Promise<LoginResponse> => {
        const response = await api.post<LoginResponse>('/auth/login', data);
        return response.data;
    },
};
