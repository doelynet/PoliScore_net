import client from './client';

export const getPosts = (params) =>
    client.get('/posts', { params });

export const getPost = (id) =>
    client.get(`/posts/${id}`);

export const createPost = (data) =>
    client.post('/posts', data);

export const updatePost = (id, data) =>
    client.put(`/posts/${id}`, data);

export const deletePost = (id) =>
    client.delete(`/posts/${id}`);

export const getComments = (postId, params) =>
    client.get(`/posts/${postId}/comments`, { params });

export const addComment = (postId, data) =>
    client.post(`/posts/${postId}/comments`, data);

export const deleteComment = (id) =>
    client.delete(`/comments/${id}`);

export const toggleLike = (postId) =>
    client.post(`/posts/${postId}/like`);