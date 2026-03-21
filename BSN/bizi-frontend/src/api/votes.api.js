import client from './client';

export const castVote = (billId, data) =>
    client.post(`/bills/${billId}/vote`, data);

export const getResults = (billId, params) =>
    client.get(`/bills/${billId}/vote/results`, { params });

export const getReport = (billId) =>
    client.get(`/bills/${billId}/vote/report`);

export const getHistory = (billId, params) =>
    client.get(`/bills/${billId}/vote/history`, { params });

export const getMyVotes = () =>
    client.get('/users/me/votes');