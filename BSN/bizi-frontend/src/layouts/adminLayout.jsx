import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const adminNav = [
        { 
        to: '/admin', 
        label: 'Dashboard', 
        icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
        )
    },
    { 
        to: '/admin/bills', 
        label: 'Bills', 
        icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        )
    },
    { 
        to: '/admin/users', 
        label: 'Users', 
        icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
        )
    },
    { 
        to: '/admin/reports', 
        label: 'Reports', 
        icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
        </svg>
        )
    },
    ];

    export default function AdminLayout() {
    const navigate = useNavigate();
    const logout = useAuthStore(s => s.logout);
    const user = useAuthStore(s => s.user);

    const handleLogout = () => {
        logout();
        navigate('/login', { replace: true });
    };

    return (
        <div 
        className="min-h-screen flex"
        style={{ backgroundColor: '#0f1a09' }}
        >
        {/* Admin sidebar */}
        <aside 
            className="w-[220px] flex flex-col fixed h-full z-10"
            style={{ backgroundColor: '#1a2610' }}
        >
            {/* Logo */}
            <div 
            className="px-5 py-5"
            style={{ borderBottom: '1px solid rgba(126, 200, 74, 0.15)' }}
            >
            <div className="flex items-center gap-2">
                <span 
                className="text-xl font-bold"
                style={{ 
                    fontFamily: 'DM Serif Display, serif',
                    color: '#e8f0e0'
                }}
                >
                Bizi
                </span>
                <span 
                className="text-[10px] font-medium px-2 py-0.5 rounded"
                style={{ 
                    backgroundColor: '#3B6D11',
                    color: '#e8f0e0'
                }}
                >
                ADMIN
                </span>
            </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-4 space-y-1">
            {adminNav.map(({ to, label, icon }) => (
                <NavLink
                key={to}
                to={to}
                end={to === '/admin'}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200"
                style={({ isActive }) => ({
                    backgroundColor: isActive ? 'rgba(126, 200, 74, 0.12)' : 'transparent',
                    borderLeft: isActive ? '3px solid #7ec84a' : '3px solid transparent',
                    color: isActive ? '#e8f0e0' : '#6a8a5a',
                    fontWeight: isActive ? '500' : '400',
                })}
                >
                {icon}
                <span>{label}</span>
                </NavLink>
            ))}

            {/* Divider */}
            <div 
                className="my-4"
                style={{ borderTop: '1px solid rgba(126, 200, 74, 0.1)' }}
            />

            {/* Back to app */}
            <NavLink
                to="/bills"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200"
                style={{ color: '#6a8a5a' }}
                onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(126, 200, 74, 0.08)';
                e.currentTarget.style.color = '#a8c490';
                }}
                onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#6a8a5a';
                }}
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Back to app</span>
            </NavLink>
            </nav>

            {/* User section */}
            <div 
            className="px-3 py-4"
            style={{ borderTop: '1px solid rgba(126, 200, 74, 0.15)' }}
            >
            <div className="flex items-center gap-3 px-3 mb-3">
                <div 
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium"
                style={{ 
                    backgroundColor: 'rgba(126, 200, 74, 0.15)',
                    color: '#7ec84a'
                }}
                >
                {user?.fullName?.charAt(0) || user?.username?.charAt(0) || 'A'}
                </div>
                <div className="flex-1 min-w-0">
                <p 
                    className="text-sm font-medium truncate"
                    style={{ color: '#e8f0e0' }}
                >
                    {user?.fullName || user?.username}
                </p>
                <p 
                    className="text-xs truncate"
                    style={{ color: '#6a8a5a' }}
                >
                    {user?.email}
                </p>
                </div>
            </div>
            <button
                onClick={handleLogout}
                className="w-full text-left px-3 py-2 text-sm rounded-lg transition-all duration-200"
                style={{ color: '#ef4444' }}
                onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                }}
                onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                }}
            >
                Sign out
            </button>
            </div>
        </aside>

        {/* Main content */}
        <main 
            className="flex-1 ml-[220px] min-h-screen"
            style={{ backgroundColor: '#0f1a09' }}
        >
            <div className="max-w-6xl mx-auto px-6 py-8">
            <Outlet />
            </div>
        </main>
        </div>
    );
}