import client from './client';

export const getBills = (params) =>
    client.get('/bills', { params });

export const getBill = (id) =>
    client.get(`/bills/${id}`);

export const getBillStages = (id) =>
    client.get(`/bills/${id}/stages`);

export const toggleFollow = (id) =>
    client.post(`/bills/${id}/follow`);

// Admin only
export const createBill = (data) =>
    client.post('/admin/bills', data);

export const updateBill = (id, data) =>
    client.put(`/admin/bills/${id}`, data);

export const deleteBill = (id) =>
    client.delete(`/admin/bills/${id}`);