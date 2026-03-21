import { THEMES, useThemeStore } from '../store/themeStore';

const CYCLE = [THEMES.LIGHT, THEMES.DARK, THEMES.SYSTEM];

const icons = {
    light: (
        // Sun
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="5"/>
        <line x1="12" y1="1" x2="12" y2="3"/>
        <line x1="12" y1="21" x2="12" y2="23"/>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
        <line x1="1" y1="12" x2="3" y2="12"/>
        <line x1="21" y1="12" x2="23" y2="12"/>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
        </svg>
    ),
    dark: (
        // Moon
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
    ),
    system: (
        // Monitor
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
        <line x1="8" y1="21" x2="16" y2="21"/>
        <line x1="12" y1="17" x2="12" y2="21"/>
        </svg>
    ),
    };

    const labels = {
    light:  'Light',
    dark:   'Dark',
    system: 'System',
    };

    /**
     * ThemeToggle
     *
     * Props:
     *   variant  — 'icon' (default) | 'pill' | 'menu'
     *   className — extra Tailwind classes for the wrapper
     */
    export default function ThemeToggle({ variant = 'icon', className = '' }) {
    const theme   = useThemeStore(s => s.theme);
    const setTheme = useThemeStore(s => s.setTheme);

    const next = () => {
        const idx  = CYCLE.indexOf(theme);
        const next = CYCLE[(idx + 1) % CYCLE.length];
        setTheme(next);
    };

    // ── icon button (compact, for sidebars / navbars) ──
    if (variant === 'icon') {
        return (
        <button
            onClick={next}
            title={`Theme: ${labels[theme]} — click to cycle`}
            aria-label="Toggle theme"
            className={`
            flex items-center justify-center w-8 h-8 rounded-lg
            text-gray-500 dark:text-gray-400
            hover:bg-gray-100 dark:hover:bg-gray-800
            transition-colors duration-150
            ${className}
            `}
        >
            <span className="transition-transform duration-200 hover:scale-110">
            {icons[theme]}
            </span>
        </button>
        );
    }

    // ── pill (shows label, for settings rows) ──
    if (variant === 'pill') {
        return (
        <button
            onClick={next}
            aria-label="Toggle theme"
            className={`
            inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium
            border border-gray-200 dark:border-gray-700
            text-gray-700 dark:text-gray-300
            bg-white dark:bg-gray-900
            hover:bg-gray-50 dark:hover:bg-gray-800
            transition-all duration-150
            ${className}
            `}
        >
            {icons[theme]}
            <span>{labels[theme]}</span>
        </button>
        );
    }

    // ── menu (3-button segmented control) ──
    if (variant === 'menu') {
        return (
        <div
            role="group"
            aria-label="Theme selector"
            className={`
            inline-flex rounded-lg overflow-hidden
            border border-gray-200 dark:border-gray-700
            bg-gray-100 dark:bg-gray-800
            p-0.5 gap-0.5
            ${className}
            `}
        >
            {CYCLE.map(t => {
            const active = theme === t;
            return (
                <button
                key={t}
                onClick={() => setTheme(t)}
                aria-pressed={active}
                title={labels[t]}
                className={`
                    flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium
                    transition-all duration-150
                    ${active
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                    }
                `}
                >
                {icons[t]}
                <span className="hidden sm:inline">{labels[t]}</span>
                </button>
            );
            })}
        </div>
        );
    }

    return null;
}