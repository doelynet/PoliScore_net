import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from '../../api/client';
import { useAuthStore } from '../../store/authStore';

// Role badge colors
const ROLE_COLORS = {
    admin: { bg: 'rgba(126, 200, 74, 0.15)', text: '#7ec84a' },
    moderator: { bg: 'rgba(245, 158, 11, 0.15)', text: '#fbbf24' },
    user: { bg: 'rgba(107, 114, 128, 0.15)', text: '#9ca3af' },
    };

    // Filter tabs
    const TABS = [
    { key: 'all', label: 'All' },
    { key: 'admin', label: 'Admins' },
    { key: 'moderator', label: 'Moderators' },
    { key: 'user', label: 'Regular Users' },
    ];

    // Format date
    const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
    };

    // Table row skeleton
    const TableRowSkeleton = () => (
    <tr>
        {[...Array(7)].map((_, i) => (
        <td key={i} className="px-4 py-3">
            <div 
            className="h-4 rounded animate-pulse"
            style={{ 
                backgroundColor: 'rgba(126, 200, 74, 0.08)',
                width: i === 0 ? '32px' : i === 1 ? '50%' : '70%'
            }}
            />
        </td>
        ))}
    </tr>
    );

    // Role Badge Component
    const RoleBadge = ({ role }) => {
    const colors = ROLE_COLORS[role] || ROLE_COLORS.user;
    
    return (
        <span 
        className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize"
        style={{ backgroundColor: colors.bg, color: colors.text }}
        >
        {role}
        </span>
    );
    };

    // Avatar initial
    const Avatar = ({ name, size = 'sm' }) => {
    const initial = name?.charAt(0)?.toUpperCase() || '?';
    const sizeClasses = size === 'sm' ? 'w-8 h-8 text-sm' : 'w-10 h-10 text-base';
    
    return (
        <div 
        className={`${sizeClasses} rounded-full flex items-center justify-center font-medium`}
        style={{ 
            backgroundColor: 'rgba(126, 200, 74, 0.15)',
            color: '#7ec84a'
        }}
        >
        {initial}
        </div>
    );
    };

    export default function AdminUsers() {
    const queryClient = useQueryClient();
    const currentUser = useAuthStore(s => s.user);
    
    // State
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState('all');
    const [suspendConfirm, setSuspendConfirm] = useState(null);
    const [error, setError] = useState('');

    // Fetch users
    const { data, isLoading } = useQuery({
        queryKey: ['admin-users'],
        queryFn: async () => {
        const res = await client.get('/admin/users');
        return res.data;
        },
    });

    // Role mutation
    const roleMutation = useMutation({
        mutationFn: ({ userId, role }) => 
        client.put(`/admin/users/${userId}/role`, { role }),
        onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['admin-users'] });
        setError('');
        },
        onError: (err) => setError(err.message),
    });

    // Suspend mutation
    const suspendMutation = useMutation({
        mutationFn: ({ userId}) => 
        client.put(`/admin/users/${userId}/suspend`), //, { suspend })
        onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['admin-users'] });
        setSuspendConfirm(null);
        setError('');
        },
        onError: (err) => setError(err.message),
    });

    // Filter users
    const filteredUsers = (data?.users || []).filter(user => {
        const matchesSearch = !search || 
        user.fullName?.toLowerCase().includes(search.toLowerCase()) ||
        user.username?.toLowerCase().includes(search.toLowerCase()) ||
        user.email?.toLowerCase().includes(search.toLowerCase());
        const matchesTab = activeTab === 'all' || user.role === activeTab;
        return matchesSearch && matchesTab;
    });

    // Handle role change
    const handleRoleChange = (userId, newRole) => {
        if (userId === currentUser?.id) return; // Can't change own role
        roleMutation.mutate({ userId, role: newRole });
    };

    // Handle suspend
    const handleSuspend = (user) => {
        if (user.id === currentUser?.id) return; // Can't suspend self
        if (user.role === 'admin') return; // Can't suspend admins
        
        suspendMutation.mutate({ 
        userId: user.id, 
        suspend: user.isVerified // If verified, suspend; if suspended, reinstate
        });
    };

    return (
        <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h1 
            className="text-3xl font-bold"
            style={{ 
                fontFamily: 'DM Serif Display, serif',
                color: '#e8f0e0'
            }}
            >
            Users
            </h1>
            <div className="relative w-full sm:w-64">
            <svg 
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                style={{ color: '#6a8a5a' }}
            >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
                type="text"
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm outline-none transition-all duration-200"
                style={{ 
                backgroundColor: '#0f1a09',
                border: '1px solid rgba(126, 200, 74, 0.25)',
                color: '#e8f0e0'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#7ec84a'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(126, 200, 74, 0.25)'}
            />
            </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2">
            {TABS.map(({ key, label }) => (
            <button
                key={key}
                onClick={() => setActiveTab(key)}
                className="px-4 py-2 rounded-full text-sm font-medium transition-all duration-200"
                style={{ 
                backgroundColor: activeTab === key ? 'rgba(126, 200, 74, 0.15)' : 'transparent',
                border: `1px solid ${activeTab === key ? '#7ec84a' : 'rgba(126, 200, 74, 0.2)'}`,
                color: activeTab === key ? '#7ec84a' : '#6a8a5a'
                }}
            >
                {label}
            </button>
            ))}
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
            {error}
            </div>
        )}

        {/* Table */}
        <div 
            className="rounded-xl overflow-hidden"
            style={{ 
            backgroundColor: '#1f2e14',
            border: '1px solid rgba(126, 200, 74, 0.15)'
            }}
        >
            <div className="overflow-x-auto">
            <table className="w-full">
                <thead>
                <tr style={{ borderBottom: '1px solid rgba(126, 200, 74, 0.08)' }}>
                    {['', 'Name', 'Email', 'Business Type', 'Role', 'Joined', 'Actions'].map((header) => (
                    <th 
                        key={header}
                        className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider"
                        style={{ color: '#6a8a5a' }}
                    >
                        {header}
                    </th>
                    ))}
                </tr>
                </thead>
                <tbody>
                {isLoading ? (
                    [...Array(5)].map((_, i) => <TableRowSkeleton key={i} />)
                ) : filteredUsers.length === 0 ? (
                    <tr>
                    <td colSpan={7} className="px-4 py-12 text-center">
                        <div style={{ color: '#6a8a5a' }}>
                        <svg 
                            className="w-12 h-12 mx-auto mb-3" 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <p>No users found matching your search.</p>
                        </div>
                    </td>
                    </tr>
                ) : (
                    filteredUsers.map((user, index) => {
                    const isCurrentUser = user.id === currentUser?.id;
                    const isAdmin = user.role === 'admin';
                    const isSuspended = !user.isVerified;
                    
                    return (
                        <tr 
                        key={user.id}
                        className="transition-colors duration-150"
                        style={{ 
                            backgroundColor: index % 2 === 1 ? 'rgba(126, 200, 74, 0.03)' : 'transparent',
                            borderBottom: '1px solid rgba(126, 200, 74, 0.08)'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(126, 200, 74, 0.06)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = index % 2 === 1 ? 'rgba(126, 200, 74, 0.03)' : 'transparent'}
                        >
                        <td className="px-4 py-3">
                            <Avatar name={user.fullName || user.username} />
                        </td>
                        <td className="px-4 py-3">
                            <div>
                            <p 
                                className="text-sm font-medium"
                                style={{ color: '#e8f0e0' }}
                            >
                                {user.fullName}
                                {isCurrentUser && (
                                <span 
                                    className="ml-2 text-xs px-1.5 py-0.5 rounded"
                                    style={{ backgroundColor: 'rgba(126, 200, 74, 0.15)', color: '#7ec84a' }}
                                >
                                    You
                                </span>
                                )}
                                {isSuspended && (
                                <span 
                                    className="ml-2 text-xs px-1.5 py-0.5 rounded"
                                    style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}
                                >
                                    Suspended
                                </span>
                                )}
                            </p>
                            <p 
                                className="text-xs"
                                style={{ color: '#6a8a5a' }}
                            >
                                @{user.username}
                            </p>
                            </div>
                        </td>
                        <td className="px-4 py-3">
                            <span 
                            className="text-sm"
                            style={{ color: '#a8c490' }}
                            >
                            {user.email}
                            </span>
                        </td>
                        <td className="px-4 py-3">
                            <span 
                            className="text-sm"
                            style={{ color: '#a8c490' }}
                            >
                            {user.businessType || '-'}
                            </span>
                        </td>
                        <td className="px-4 py-3">
                            <RoleBadge role={user.role} />
                        </td>
                        <td className="px-4 py-3">
                            <span 
                            className="text-sm"
                            style={{ color: '#6a8a5a' }}
                            >
                            {formatDate(user.createdAt)}
                            </span>
                        </td>
                        <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                            {/* Role dropdown */}
                            <select
                                value={user.role}
                                onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                disabled={isCurrentUser}
                                className="px-2 py-1.5 rounded text-xs cursor-pointer outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{ 
                                backgroundColor: 'transparent',
                                border: '1px solid rgba(126, 200, 74, 0.2)',
                                color: '#a8c490'
                                }}
                            >
                                <option value="user" style={{ backgroundColor: '#1a2610' }}>User</option>
                                <option value="moderator" style={{ backgroundColor: '#1a2610' }}>Moderator</option>
                                <option value="admin" style={{ backgroundColor: '#1a2610' }}>Admin</option>
                            </select>
                            
                            {/* Suspend/Reinstate button */}
                            <button
                                onClick={() => setSuspendConfirm(user)}
                                disabled={isCurrentUser || isAdmin}
                                className="px-3 py-1.5 rounded text-xs font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{ 
                                border: `1px solid ${isSuspended ? '#22c55e' : '#ef4444'}`,
                                color: isSuspended ? '#22c55e' : '#ef4444'
                                }}
                                onMouseEnter={(e) => {
                                if (!isCurrentUser && !isAdmin) {
                                    e.currentTarget.style.backgroundColor = isSuspended 
                                    ? 'rgba(34, 197, 94, 0.1)' 
                                    : 'rgba(239, 68, 68, 0.1)';
                                }
                                }}
                                onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                }}
                            >
                                {isSuspended ? 'Reinstate' : 'Suspend'}
                            </button>
                            </div>
                        </td>
                        </tr>
                    );
                    })
                )}
                </tbody>
            </table>
            </div>
        </div>

        {/* Suspend Confirmation Modal */}
        {suspendConfirm && (
            <>
            <div 
                className="fixed inset-0 z-40"
                style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
                onClick={() => setSuspendConfirm(null)}
            />
            <div 
                className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md p-6 rounded-xl z-50"
                style={{ backgroundColor: '#1a2610' }}
            >
                <h3 
                className="text-xl font-bold mb-2"
                style={{ 
                    fontFamily: 'DM Serif Display, serif',
                    color: '#e8f0e0'
                }}
                >
                {suspendConfirm.isVerified ? 'Suspend User?' : 'Reinstate User?'}
                </h3>
                <p className="text-sm mb-6" style={{ color: '#a8c490' }}>
                {suspendConfirm.isVerified 
                    ? `Are you sure you want to suspend ${suspendConfirm.fullName || suspendConfirm.username}? They will not be able to access the platform.`
                    : `Are you sure you want to reinstate ${suspendConfirm.fullName || suspendConfirm.username}? They will regain access to the platform.`
                }
                </p>
                <div className="flex justify-end gap-3">
                <button
                    onClick={() => setSuspendConfirm(null)}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                    style={{ 
                    border: '1px solid rgba(126, 200, 74, 0.3)',
                    color: '#a8c490'
                    }}
                >
                    Cancel
                </button>
                <button
                    onClick={() => handleSuspend(suspendConfirm)}
                    disabled={suspendMutation.isPending}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50"
                    style={{ 
                    backgroundColor: suspendConfirm.isVerified ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                    border: `1px solid ${suspendConfirm.isVerified ? '#ef4444' : '#22c55e'}`,
                    color: suspendConfirm.isVerified ? '#ef4444' : '#22c55e'
                    }}
                >
                    {suspendMutation.isPending 
                    ? 'Processing...' 
                    : suspendConfirm.isVerified ? 'Suspend' : 'Reinstate'
                    }
                </button>
                </div>
            </div>
            </>
        )}
        </div>
    );
}