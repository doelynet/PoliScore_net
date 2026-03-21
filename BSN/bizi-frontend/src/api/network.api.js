import client from './client';

export const searchUsers = (params) =>
    client.get('/users/search', { params });

export const getUserProfile = (username) =>
    client.get(`/users/${username}`);

export const updateProfile = (data) =>
    client.put('/users/profile', data);

export const deleteAccount = () =>
    client.delete('/users/me');

export const getConnections = (params) =>
    client.get('/connections', { params });

export const getPendingRequests = () =>
    client.get('/connections/pending');

export const sendConnectionRequest = (userId) =>
    client.post(`/connections/${userId}`);

export const acceptConnection = (connectionId) =>
    client.put(`/connections/${connectionId}/accept`);

export const rejectConnection = (connectionId) =>
    client.put(`/connections/${connectionId}/reject`);

export const blockUser = (userId) =>
    client.post(`/connections/${userId}/block`);

export const toggleFollow = (userId) =>
    client.post(`/users/${userId}/follow`);

export const getFollowers = (userId, params) =>
    client.get(`/users/${userId}/followers`, { params });

export const getFollowing = (userId, params) =>
    client.get(`/users/${userId}/following`, { params });