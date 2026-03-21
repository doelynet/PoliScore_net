import { io } from 'socket.io-client';
import { useNotificationStore } from '../store/notificationStore';

let socket = null;
let queryClientRef = null;

// Call in main.jsx or MainLayout = react query client 
export const initSocket = (token, queryClient) => {
    if (socket?.connected || !token) return;

    queryClientRef = queryClient;

    socket = io(import.meta.env.VITE_SOCKET_URL, {
    auth: { token },
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
    });

    socket.on('connect', () => {
    console.log('Socket connected:', socket.id);
    });

    socket.on('connect_error', (err) => {
    console.warn('Socket connection error:', err.message);
    });

  // New message — invalidate conversation cache
    socket.on('new_message', (data) => {
    queryClientRef?.invalidateQueries({ queryKey: ['messages', data.conversationId] });
    queryClientRef?.invalidateQueries({ queryKey: ['conversations'] });
    useNotificationStore.getState().incrementUnread();
    });

  // Bill status changed — invalidate bill cache
    socket.on('bill_update', (data) => {
    queryClientRef?.invalidateQueries({ queryKey: ['bill', data.billId] });
    queryClientRef?.invalidateQueries({ queryKey: ['bills'] });
    });

  // Any notification — bump the badge count
    socket.on('notification', () => {
    useNotificationStore.getState().incrementUnread();
    queryClientRef?.invalidateQueries({ queryKey: ['notifications'] });
    });

    socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
    });
};

export const disconnectSocket = () => {
    socket?.disconnect();
    socket = null;
    queryClientRef = null;
};

// Join a conversation room when chat is open
export const joinConversation = (conversationId) => {
    socket?.emit('join_conversation', conversationId);
};

export const leaveConversation = (conversationId) => {
    socket?.emit('leave_conversation', conversationId);
};

export const emitTyping = (conversationId) => {
    socket?.emit('typing', { conversationId });
};

export const emitStopTyping = (conversationId) => {
    socket?.emit('stop_typing', { conversationId });
};

export const getSocket = () => socket;