import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService, LoginRequest, LoginResponse } from '../services/authService';

interface AuthContextType {
    user: LoginResponse['user'] | null;
    tenants: LoginResponse['tenants'];
    activeTenant: LoginResponse['activeTenant'] | null;
    permissions: string[];
    login: (credentials: LoginRequest) => Promise<LoginResponse>;
    logout: () => void;
    hasPermission: (permission: string) => boolean;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<LoginResponse['user'] | null>(null);
    const [tenants, setTenants] = useState<LoginResponse['tenants']>([]);
    const [activeTenant, setActiveTenant] = useState<LoginResponse['activeTenant'] | null>(null);
    const [permissions, setPermissions] = useState<string[]>([]);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    const parsePermissionsFromToken = (token: string): string[] => {
        try {
            const payload = token.split('.')[1];
            if (!payload) {
                return [];
            }

            const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
            const padLength = (4 - (normalized.length % 4)) % 4;
            const padded = normalized + '='.repeat(padLength);
            const decoded = JSON.parse(atob(padded));
            return Array.isArray(decoded.permissions)
                ? decoded.permissions.filter((p: unknown) => typeof p === 'string')
                : [];
        } catch {
            return [];
        }
    };

    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        const savedUser = localStorage.getItem('user');
        const savedActiveTenant = localStorage.getItem('activeTenant');
        if (token && savedUser) {
            setUser(JSON.parse(savedUser));
            if (savedActiveTenant) {
                setActiveTenant(JSON.parse(savedActiveTenant));
            }
            setPermissions(parsePermissionsFromToken(token));
            setIsAuthenticated(true);
        }
    }, []);

    const login = async (credentials: LoginRequest) => {
        const response = await authService.login(credentials);

        setTenants(response.tenants);
        setUser(response.user);

        if (response.accessToken && response.refreshToken && response.activeTenant) {
            localStorage.setItem('accessToken', response.accessToken);
            localStorage.setItem('refreshToken', response.refreshToken);
            localStorage.setItem('user', JSON.stringify(response.user));
            localStorage.setItem('activeTenant', JSON.stringify(response.activeTenant));
            setActiveTenant(response.activeTenant);
            setPermissions(parsePermissionsFromToken(response.accessToken));
            setIsAuthenticated(true);
        } else {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('activeTenant');
            setActiveTenant(null);
            setPermissions([]);
            setIsAuthenticated(false);
        }

        return response;
    };

    const logout = () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        localStorage.removeItem('activeTenant');
        setUser(null);
        setTenants([]);
        setActiveTenant(null);
        setPermissions([]);
        setIsAuthenticated(false);
    };

    const hasPermission = (permission: string): boolean => permissions.includes(permission);

    return (
        <AuthContext.Provider value={{ user, tenants, activeTenant, permissions, login, logout, hasPermission, isAuthenticated }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};
