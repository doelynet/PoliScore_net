import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const adminNav = [
    { to: '/admin',         label: 'Dashboard', icon: '' },
    { to: '/admin/bills',   label: 'Bills',     icon: '' },
    { to: '/admin/users',   label: 'Users',     icon: '' },
    { to: '/admin/reports', label: 'Reports',   icon: '' },
    ];

    export default function AdminLayout() {
    const navigate = useNavigate();
    const logout   = useAuthStore(s => s.logout);
    const user     = useAuthStore(s => s.user);

    const handleLogout = () => {
        logout();
        navigate('/login', { replace: true });
    };

    return (
        <div className="min-h-screen bg-gray-50 flex">

        {/* Admin sidebar */}
        <aside className="w-56 bg-gray-900 flex flex-col fixed h-full z-10">
            <div className="px-5 py-5 border-b border-gray-700">
            <span className="text-xl font-bold text-white">Bizi</span>
            <span className="ml-2 text-xs bg-green-600 text-white px-2 py-0.5 rounded">
                Admin
            </span>
            </div>

            <nav className="flex-1 px-3 py-4 space-y-1">
            {adminNav.map(({ to, label, icon }) => (
                <NavLink
                key={to}
                to={to}
                end={to === '/admin'}
                className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                    isActive
                        ? 'bg-gray-700 text-white font-medium'
                        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                    }`
                }
                >
                <span>{icon}</span>
                <span>{label}</span>
                </NavLink>
            ))}

            {/* Link back to main app */}
            <NavLink
                to="/"
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm
                        text-gray-400 hover:bg-gray-800 hover:text-white transition-colors mt-4"
            >
                <span>←</span>
                <span>Back to app</span>
            </NavLink>
            </nav>

            <div className="px-3 py-4 border-t border-gray-700">
            <p className="text-xs text-gray-500 px-3 mb-2">
                Signed in as <span className="text-gray-300">{user?.username}</span>
            </p>
            <button
                onClick={handleLogout}
                className="w-full text-left px-3 py-2 text-sm text-red-400
                        hover:bg-gray-800 rounded-lg transition-colors"
            >
                Sign out
            </button>
            </div>
        </aside>

        <main className="flex-1 ml-56 min-h-screen">
            <div className="max-w-5xl mx-auto px-6 py-8">
            <Outlet />
            </div>
        </main>

        </div>
    );
    }