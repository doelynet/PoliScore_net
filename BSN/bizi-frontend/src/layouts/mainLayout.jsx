// src/layouts/mainLayout.jsx  — add ThemeToggle to sidebar footer

import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore }        from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';
import { initSocket, disconnectSocket } from '../socket/socketClient';
import { useQueryClient }      from '@tanstack/react-query';
import ThemeToggle             from '../components/themeToggle';

const navItems = [
    { to: '/bills',            label: 'Bills',         icon: '' },
    { to: '/forum',            label: 'Forum',         icon: '' },
    { to: '/network',          label: 'Network',       icon: '' },
    { to: '/network/discover', label: 'Discover',      icon: '' },
    { to: '/messages',         label: 'Messages',      icon: '' },
    { to: '/notifications',    label: 'Notifications', icon: '' },
    ];

    export default function MainLayout() {
    const navigate    = useNavigate();
    const queryClient = useQueryClient();
    const user        = useAuthStore(s => s.user);
    const token       = useAuthStore(s => s.token);
    const logout      = useAuthStore(s => s.logout);
    const unread      = useNotificationStore(s => s.unreadCount);

    useEffect(() => {
        if (token) initSocket(token, queryClient);
        return () => disconnectSocket();
    }, [token, queryClient]);

    const handleLogout = () => {
        logout();
        disconnectSocket();
        navigate('/login', { replace: true });
    };

    return (
        <div className="min-h-screen bg-[var(--bg-page)] flex">

        {/* Sidebar */}
        <aside className="w-56 bg-[var(--bg-sidebar)] border-r border-[var(--border-muted)] flex flex-col fixed h-full z-10">
            {/* Logo */}
            <div className="px-5 py-5 border-b border-[var(--border-muted)]">
            <span className="text-xl font-bold text-[var(--brand)]">Bizi</span>
            </div>

            {/* Nav links */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navItems.map(({ to, label, icon }) => (
                <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                    isActive
                        ? 'bg-[var(--brand-light)] text-[var(--brand)] font-medium'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--brand-light)] hover:text-[var(--text-primary)]'
                    }`
                }
                >
                <span className="text-base">{icon}</span>
                <span>{label}</span>
                {label === 'Notifications' && unread > 0 && (
                    <span className="ml-auto bg-[var(--brand)] text-white text-xs rounded-full
                                    w-5 h-5 flex items-center justify-center">
                    {unread > 99 ? '99+' : unread}
                    </span>
                )}
                </NavLink>
            ))}
            </nav>

            {/* Footer: user + theme toggle + logout */}
            <div className="px-3 py-4 border-t border-[var(--border-muted)] space-y-2">

            {/* Theme toggle row */}
            <div className="flex items-center justify-between px-3 py-1">
                <span className="text-xs text-[var(--text-muted)]">Theme</span>
                <ThemeToggle variant="icon" />
            </div>

            {/* User profile link */}
            <NavLink
                to={`/profile/${user?.username}`}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[var(--brand-light)] transition-colors"
            >
                <div className="w-7 h-7 rounded-full bg-[var(--brand-light)] flex items-center justify-center
                                text-[var(--brand)] text-xs font-semibold shrink-0">
                {user?.fullName?.[0]?.toUpperCase() ?? '?'}
                </div>
                <div className="min-w-0">
                <p className="text-sm font-medium text-[var(--text-primary)] truncate">{user?.fullName}</p>
                <p className="text-xs text-[var(--text-muted)] truncate">@{user?.username}</p>
                </div>
            </NavLink>

            <button
                onClick={handleLogout}
                className="w-full text-left px-3 py-2 text-sm text-red-500
                        hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
            >
                Sign out
            </button>
            </div>
        </aside>

        <main className="flex-1 ml-56 min-h-screen bg-[var(--bg-page)]">
            <div className="max-w-4xl mx-auto px-6 py-8">
            <Outlet />
            </div>
        </main>

        </div>
    );
}