import React from 'react';
import { usePermissions } from '../../hooks/usePermissions';

const PermissionGuard = ({ permission, fallback, children }) => {
    const { can } = usePermissions();

    if (!can(permission)) {
        return fallback || null;
    }

    return children;
};

export default PermissionGuard;
