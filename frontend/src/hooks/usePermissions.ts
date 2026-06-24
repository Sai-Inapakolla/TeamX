import { useAuth } from '../contexts/AuthContext';
import { normalizeRole } from '../utils/permissions';

export const usePermissions = () => {
    const { permissions, hasPermission, activeTenant } = useAuth();

    const can = (perm: string) => hasPermission(perm);
    const role = normalizeRole(activeTenant?.role);

    return { permissions, can, role };
};

export default usePermissions;
