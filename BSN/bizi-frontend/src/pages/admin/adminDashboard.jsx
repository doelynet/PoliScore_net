import { useQuery } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import client from '../../api/client';

// Stage display config
const STAGES = [
    { key: 'draft', label: 'Draft' },
    { key: 'first_reading', label: 'First Reading' },
    { key: 'committee_stage', label: 'Committee' },
    { key: 'second_reading', label: 'Second Reading' },
    { key: 'third_reading', label: 'Third Reading' },
    { key: 'presidential_assent', label: 'Presidential Assent' },
    { key: 'enacted', label: 'Enacted' },
    { key: 'rejected', label: 'Rejected' },
    ];

    // Format current date
    const formatDate = () => {
    const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    return new Date().toLocaleDateString('en-GB', options);
    };

    // Skeleton loaders
    const StatCardSkeleton = () => (
    <div 
        className="p-5 rounded-xl animate-pulse"
        style={{ 
        backgroundColor: '#1f2e14',
        border: '1px solid rgba(126, 200, 74, 0.15)'
        }}
    >
        <div className="h-4 w-20 rounded mb-3" style={{ backgroundColor: 'rgba(126, 200, 74, 0.1)' }} />
        <div className="h-8 w-16 rounded mb-2" style={{ backgroundColor: 'rgba(126, 200, 74, 0.15)' }} />
        <div className="h-3 w-24 rounded" style={{ backgroundColor: 'rgba(126, 200, 74, 0.08)' }} />
    </div>
    );

    const StagesSkeleton = () => (
    <div 
        className="p-6 rounded-xl"
        style={{ 
        backgroundColor: '#1f2e14',
        border: '1px solid rgba(126, 200, 74, 0.15)'
        }}
    >
        <div className="h-5 w-32 rounded mb-4" style={{ backgroundColor: 'rgba(126, 200, 74, 0.1)' }} />
        <div className="flex flex-wrap gap-2">
        {[...Array(8)].map((_, i) => (
            <div 
            key={i}
            className="h-8 w-28 rounded-full animate-pulse"
            style={{ backgroundColor: 'rgba(126, 200, 74, 0.08)' }}
            />
        ))}
        </div>
    </div>
    );

    // Stat Card Component
    const StatCard = ({ icon, label, value, trend, trendLabel, status }) => {
    const getStatusColor = () => {
        if (status === 'danger') return '#ef4444';
        if (status === 'warning') return '#f59e0b';
        return '#7ec84a';
    };

    return (
        <div 
        className="p-5 rounded-xl transition-all duration-300 hover:translate-y-[-2px]"
        style={{ 
            backgroundColor: '#1f2e14',
            border: '1px solid rgba(126, 200, 74, 0.15)'
        }}
        >
        <div className="flex items-center gap-2 mb-3">
            <span style={{ color: '#6a8a5a' }}>{icon}</span>
            <span 
            className="text-xs font-medium uppercase tracking-wider"
            style={{ color: '#6a8a5a' }}
            >
            {label}
            </span>
        </div>
        <p 
            className="text-3xl font-bold mb-1"
            style={{ 
            color: getStatusColor(),
            fontFamily: 'DM Serif Display, serif'
            }}
        >
            {value}
        </p>
        {(trend !== undefined || trendLabel) && (
            <p className="text-xs" style={{ color: '#6a8a5a' }}>
            {trend !== undefined && (
                <span style={{ color: trend > 0 ? '#22c55e' : '#6a8a5a' }}>
                {trend > 0 ? '+' : ''}{trend}
                </span>
            )}
            {trendLabel && <span> {trendLabel}</span>}
            </p>
        )}
        </div>
    );
    };

    // Quick Action Card
    const QuickActionCard = ({ icon, label, to }) => {
    const navigate = useNavigate();
    
    return (
        <button
        onClick={() => navigate(to)}
        className="p-5 rounded-xl text-left transition-all duration-300 hover:translate-y-[-2px] group"
        style={{ 
            backgroundColor: '#1f2e14',
            border: '1px solid rgba(126, 200, 74, 0.15)'
        }}
        >
        <div 
            className="w-10 h-10 rounded-lg flex items-center justify-center mb-3 transition-colors duration-300"
            style={{ backgroundColor: 'rgba(126, 200, 74, 0.1)' }}
        >
            <span style={{ color: '#7ec84a' }}>{icon}</span>
        </div>
        <p 
            className="text-sm font-medium"
            style={{ color: '#e8f0e0' }}
        >
            {label}
        </p>
        </button>
    );
    };

    export default function AdminDashboard() {
    const { data, isLoading, error } = useQuery({
        queryKey: ['admin-stats'],
        queryFn: async () => {
        const res = await client.get('/admin/stats');
        return res.data;
        },
    });

    return (
        <div className="space-y-8">
        {/* Page Header */}
        <div>
            <h1 
            className="text-3xl font-bold mb-1"
            style={{ 
                fontFamily: 'DM Serif Display, serif',
                color: '#e8f0e0'
            }}
            >
            Dashboard
            </h1>
            <p style={{ color: '#6a8a5a' }}>{formatDate()}</p>
        </div>

        {/* Error State */}
        {error && (
            <div 
            className="p-4 rounded-lg"
            style={{ 
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#ef4444'
            }}
            >
            Failed to load dashboard stats: {error.message}
            </div>
        )}

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {isLoading ? (
            <>
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
            </>
            ) : (
            <>
                <StatCard
                icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                }
                label="Total Users"
                value={data?.totalUsers || 0}
                trend={data?.newUsersToday}
                trendLabel="today"
                />
                <StatCard
                icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                }
                label="Total Bills"
                value={data?.totalBills || 0}
                />
                <StatCard
                icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                    </svg>
                }
                label="Pending Reports"
                value={data?.pendingReports || 0}
                status={
                    (data?.pendingReports || 0) > 5 
                    ? 'danger' 
                    : (data?.pendingReports || 0) > 0 
                        ? 'warning' 
                        : 'normal'
                }
                />
                <StatCard
                icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                }
                label="Active Posts"
                value={data?.totalPosts || 0}
                trend={data?.newPostsToday}
                trendLabel="today"
                />
            </>
            )}
        </div>

        {/* Bills by Stage */}
        {isLoading ? (
            <StagesSkeleton />
        ) : (
            <div 
            className="p-6 rounded-xl"
            style={{ 
                backgroundColor: '#1f2e14',
                border: '1px solid rgba(126, 200, 74, 0.15)'
            }}
            >
            <h2 
                className="text-lg font-semibold mb-4"
                style={{ 
                fontFamily: 'DM Serif Display, serif',
                color: '#e8f0e0'
                }}
            >
                Bills by Stage
            </h2>
            <div className="flex flex-wrap gap-2">
                {STAGES.map(({ key, label }) => {
                const count = data?.billsByStage?.[key] || 0;
                return (
                    <Link
                    key={key}
                    to={`/admin/bills?status=${key}`}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-all duration-200 hover:translate-y-[-1px]"
                    style={{ 
                        backgroundColor: 'rgba(126, 200, 74, 0.08)',
                        border: '1px solid rgba(126, 200, 74, 0.15)',
                        color: '#a8c490'
                    }}
                    >
                    <span>{label}</span>
                    <span 
                        className="px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{ 
                        backgroundColor: count > 0 ? 'rgba(126, 200, 74, 0.2)' : 'rgba(126, 200, 74, 0.08)',
                        color: count > 0 ? '#7ec84a' : '#6a8a5a'
                        }}
                    >
                        {count}
                    </span>
                    </Link>
                );
                })}
            </div>
            </div>
        )}

        {/* Quick Actions */}
        <div>
            <h2 
            className="text-lg font-semibold mb-4"
            style={{ 
                fontFamily: 'DM Serif Display, serif',
                color: '#e8f0e0'
            }}
            >
            Quick Actions
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <QuickActionCard
                icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                }
                label="Add New Bill"
                to="/admin/bills"
            />
            <QuickActionCard
                icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                </svg>
                }
                label="Review Reports"
                to="/admin/reports"
            />
            <QuickActionCard
                icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                }
                label="Manage Users"
                to="/admin/users"
            />
            </div>
        </div>

        {/* Recent Activity Placeholder */}
        <div 
            className="p-6 rounded-xl"
            style={{ 
            backgroundColor: '#1f2e14',
            border: '1px solid rgba(126, 200, 74, 0.15)'
            }}
        >
            <h2 
            className="text-lg font-semibold mb-3"
            style={{ 
                fontFamily: 'DM Serif Display, serif',
                color: '#e8f0e0'
            }}
            >
            Recent Activity
            </h2>
            <div 
            className="flex items-center justify-center py-8 rounded-lg"
            style={{ 
                backgroundColor: 'rgba(126, 200, 74, 0.05)',
                border: '1px dashed rgba(126, 200, 74, 0.15)'
            }}
            >
            <div className="text-center">
                <svg 
                className="w-10 h-10 mx-auto mb-2" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                style={{ color: '#6a8a5a' }}
                >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p style={{ color: '#6a8a5a' }}>Activity feed coming soon</p>
            </div>
            </div>
        </div>
        </div>
    );
}