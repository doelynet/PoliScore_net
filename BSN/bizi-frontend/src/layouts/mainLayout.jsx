import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';
import { initSocket, disconnectSocket } from '../socket/socketClient';
import { useQueryClient } from '@tanstack/react-query';

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

    // Connect socket once when layout mounts
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
        <div className="min-h-screen bg-gray-50 flex">

        {/* Sidebar */}
        <aside className="w-56 bg-white border-r border-gray-100 flex flex-col fixed h-full z-10">
            {/* Logo */}
            <div className="px-5 py-5 border-b border-gray-100">
            <span className="text-xl font-bold text-green-600">Bizi</span>
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
                        ? 'bg-green-50 text-green-700 font-medium'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`
                }
                >
                <span className="text-base">{icon}</span>
                <span>{label}</span>
                {label === 'Notifications' && unread > 0 && (
                    <span className="ml-auto bg-green-500 text-white text-xs rounded-full
                                    w-5 h-5 flex items-center justify-center">
                    {unread > 99 ? '99+' : unread}
                    </span>
                )}
                </NavLink>
            ))}
            </nav>

            {/* User info + logout */}
            <div className="px-3 py-4 border-t border-gray-100">
            <NavLink
                to={`/profile/${user?.username}`}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
                <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center
                                text-green-700 text-xs font-semibold shrink-0">
                {user?.fullName?.[0]?.toUpperCase() ?? '?'}
                </div>
                <div className="min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{user?.fullName}</p>
                <p className="text-xs text-gray-400 truncate">@{user?.username}</p>
                </div>
            </NavLink>
            <button
                onClick={handleLogout}
                className="w-full mt-2 text-left px-3 py-2 text-sm text-red-500
                        hover:bg-red-50 rounded-lg transition-colors"
            >
                Sign out
            </button>
            </div>
        </aside>

        {/* Main content — offset by sidebar width */}
        <main className="flex-1 ml-56 min-h-screen">
            <div className="max-w-4xl mx-auto px-6 py-8">
            <Outlet />
            </div>
        </main>

        </div>
    );
    }