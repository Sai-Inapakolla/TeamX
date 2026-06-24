import api from '../services/api';

export const getUsers = async () => {
    const response = await api.get('/users');
    return response.data;
};

export const inviteUser = async (data) => {
    const response = await api.post('/users/invite', data);
    return response.data;
};

export const updateUserRole = async (userId, role) => {
    const response = await api.put(`/users/${userId}/role`, { role });
    return response.data;
};

export const deleteUser = async (userId) => {
    await api.delete(`/users/${userId}`);
};