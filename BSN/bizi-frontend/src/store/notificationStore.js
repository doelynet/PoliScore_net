import { create } from 'zustand';

export const useNotificationStore = create((set, get) => ({
    unreadCount: 0,
  toasts: [],        // { id, message, type: 'success'|'error'|'info' }

    setUnreadCount: (count) => set({ unreadCount: count }),

    incrementUnread: () => set(s => ({ unreadCount: s.unreadCount + 1 })),

    clearUnread: () => set({ unreadCount: 0 }),

    addToast: (message, type = 'info') => {
    const id = Date.now();
    set(s => ({ toasts: [...s.toasts, { id, message, type }] }));
    // Auto-remove after 4 seconds
    setTimeout(() => get().removeToast(id), 4000);
    },

    removeToast: (id) =>
    set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })),
}));