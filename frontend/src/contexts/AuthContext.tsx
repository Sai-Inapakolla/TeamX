import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService, LoginRequest, LoginResponse } from '../services/authService';
import { normalizePermission } from '../utils/permissions';

interface AuthContextType {
    user: LoginResponse['user'] | null;
    tenants: LoginResponse['tenants'];
    activeTenant: LoginResponse['activeTenant'] | null;
    permissions: string[];
    login: (credentials: LoginRequest) => Promise<LoginResponse>;
    logout: () => void;
    setSession: (response: LoginResponse) => void;
    hasPermission: (permission: string) => boolean;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
            ? decoded.permissions.filter((permission: unknown) => typeof permission === 'string')
            : [];
    } catch {
        return [];
    }
};

const readStoredAuthState = () => {
    const token = localStorage.getItem('accessToken');
    const savedUser = localStorage.getItem('user');
    const savedActiveTenant = localStorage.getItem('activeTenant');

    return {
        user: savedUser ? JSON.parse(savedUser) : null,
        activeTenant: savedActiveTenant ? JSON.parse(savedActiveTenant) : null,
        permissions: token ? parsePermissionsFromToken(token) : [],
        isAuthenticated: Boolean(token && savedUser),
    };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const storedAuthState = readStoredAuthState();
    const [user, setUser] = useState<LoginResponse['user'] | null>(storedAuthState.user);
    const [tenants, setTenants] = useState<LoginResponse['tenants']>([]);
    const [activeTenant, setActiveTenant] = useState<LoginResponse['activeTenant'] | null>(storedAuthState.activeTenant);
    const [permissions, setPermissions] = useState<string[]>(storedAuthState.permissions);
    const [isAuthenticated, setIsAuthenticated] = useState(storedAuthState.isAuthenticated);

    useEffect(() => {
        const { user: storedUser, activeTenant: storedTenant, permissions: storedPermissions, isAuthenticated: storedIsAuthenticated } = readStoredAuthState();
        setUser(storedUser);
        setActiveTenant(storedTenant);
        setPermissions(storedPermissions);
        setIsAuthenticated(storedIsAuthenticated);
    }, []);

    const setSession = (response: LoginResponse) => {
        if (response.accessToken && response.refreshToken && response.activeTenant) {
            localStorage.setItem('accessToken', response.accessToken);
            localStorage.setItem('refreshToken', response.refreshToken);
            localStorage.setItem('user', JSON.stringify(response.user));
            localStorage.setItem('activeTenant', JSON.stringify(response.activeTenant));
            setUser(response.user);
            setActiveTenant(response.activeTenant);
            setPermissions(parsePermissionsFromToken(response.accessToken));
            setIsAuthenticated(true);
        }
    };

    const login = async (credentials: LoginRequest) => {
        const response = await authService.login(credentials);

        setTenants(response.tenants);
        setUser(response.user);

        if (response.accessToken && response.refreshToken && response.activeTenant) {
            setSession(response);
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

    const hasPermission = (permission: string): boolean => permissions.includes(normalizePermission(permission));

    return (
        <AuthContext.Provider value={{ user, tenants, activeTenant, permissions, login, logout, setSession, hasPermission, isAuthenticated }}>
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
