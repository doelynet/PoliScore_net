import client from './client';

export const register = (data) =>
    client.post('/auth/register', data);

export const login = (data) =>
    client.post('/auth/login', data);

export const getMe = () =>
    client.get('/auth/me');

export const requestPasswordReset = (email) =>
    client.post('/auth/request-password-reset', { email });

export const resetPassword = (data) =>
    client.post('/auth/reset-password', data);

export const requestEmailVerification = (email) =>
    client.post('/auth/request-email-verification', { email });

export const refreshToken = () =>
    client.post('/auth/refresh');