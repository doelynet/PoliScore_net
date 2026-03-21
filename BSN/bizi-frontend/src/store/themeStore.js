import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const THEMES = {
    LIGHT:  'light',
    DARK:   'dark',
    SYSTEM: 'system',
};

// Read the OS preference once
    const getSystemTheme = () =>
    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

    // Apply resolved theme to <html> data-theme attribute
    // Tailwind dark mode reads the `dark` class; we support both approaches
    const applyTheme = (theme) => {
    const resolved = theme === THEMES.SYSTEM ? getSystemTheme() : theme;
    const root = document.documentElement;

    root.setAttribute('data-theme', resolved);   // CSS variables fallback
    if (resolved === 'dark') {
        root.classList.add('dark');
    } else {
        root.classList.remove('dark');
    }
    };

    export const useThemeStore = create(
    persist(
        (set, get) => ({
        theme: THEMES.SYSTEM,   // persisted preference

        // The theme actually shown right now ('light' | 'dark')
        resolved: getSystemTheme(),

        setTheme: (theme) => {
            const resolved = theme === THEMES.SYSTEM ? getSystemTheme() : theme;
            applyTheme(theme);
            set({ theme, resolved });
        },

        // Call once on app boot
        init: () => {
            const { theme } = get();
            const resolved = theme === THEMES.SYSTEM ? getSystemTheme() : theme;
            applyTheme(theme);
            set({ resolved });

            // Keep in sync when OS preference changes (only relevant for 'system')
            const mq = window.matchMedia('(prefers-color-scheme: dark)');
            mq.addEventListener('change', () => {
            if (get().theme === THEMES.SYSTEM) {
                const r = getSystemTheme();
                applyTheme(THEMES.SYSTEM);
                set({ resolved: r });
            }
            });
        },
        }),
        {
        name: 'bizi-theme',
        partialize: (s) => ({ theme: s.theme }),
        }
    )
);