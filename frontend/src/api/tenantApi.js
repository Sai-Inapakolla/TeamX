import api from '../services/api';

export const getCurrentTenant = async () => {
    const response = await api.get('/tenant/current');
    return response.data;
};