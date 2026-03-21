import client from './client';

export const getConversations = (params) =>
    client.get('/messages/conversations', { params });

export const getOrCreateConversation = (userId) =>
    client.post(`/messages/conversations/with/${userId}`);

export const getMessages = (conversationId, params) =>
    client.get(`/messages/conversations/${conversationId}`, { params });

export const sendMessage = (conversationId, data) =>
    client.post(`/messages/conversations/${conversationId}/messages`, data);