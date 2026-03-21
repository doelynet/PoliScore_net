import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
    persist(
    (set, get) => ({
        user:  null,
        token: null,

        login: (user, token) => set({ user, token }),

        logout: () => {
        set({ user: null, token: null });
        // Clear any other persisted state here if needed
        },

        updateUser: (updates) =>
        set(state => ({ user: state.user ? { ...state.user, ...updates } : null })),

        isLoggedIn: () => !!get().token,
        isAdmin:    () => get().user?.role === 'admin',
    }),
    {
        name: 'bizi-auth', //localstoragekey
        partialize: (s) => ({        
        user:  s.user,
        token: s.token,
        }),
    }
    )
);