import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from '../../api/client';

// Status badge colors
const STATUS_COLORS = {
    pending: { bg: 'rgba(245, 158, 11, 0.15)', text: '#fbbf24' },
    reviewed: { bg: 'rgba(59, 130, 246, 0.15)', text: '#60a5fa' },
    resolved: { bg: 'rgba(34, 197, 94, 0.15)', text: '#4ade80' },
    dismissed: { bg: 'rgba(107, 114, 128, 0.15)', text: '#9ca3af' },
    };

    // Type badge colors
    const TYPE_COLORS = {
    post: { bg: 'rgba(126, 200, 74, 0.15)', text: '#7ec84a' },
    comment: { bg: 'rgba(59, 130, 246, 0.15)', text: '#60a5fa' },
    user: { bg: 'rgba(168, 85, 247, 0.15)', text: '#c084fc' },
    };

    // Filter tabs
    const TABS = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'reviewed', label: 'Reviewed' },
    { key: 'resolved', label: 'Resolved' },
    { key: 'dismissed', label: 'Dismissed' },
    ];

    // Reason labels
    const REASON_LABELS = {
    spam: 'Spam',
    harassment: 'Harassment',
    misinformation: 'Misinformation',
    hate_speech: 'Hate Speech',
    other: 'Other',
    };

    // Format date
    const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
    };

    // Truncate text
    const truncate = (text, maxLength = 60) => {
    if (!text) return '-';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
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
                width: i === 3 ? '80%' : '60%'
            }}
            />
        </td>
        ))}
    </tr>
    );

    // Badge Component
    const Badge = ({ type, colors }) => {
    const color = colors[type] || colors.other || { bg: 'rgba(107, 114, 128, 0.15)', text: '#9ca3af' };
    
    return (
        <span 
        className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize"
        style={{ backgroundColor: color.bg, color: color.text }}
        >
        {type?.replace('_', ' ') || 'Unknown'}
        </span>
    );
    };

    export default function AdminReports() {
    const queryClient = useQueryClient();
    
    // State
    const [activeTab, setActiveTab] = useState('all');
    const [resolveModal, setResolveModal] = useState(null);
    const [dismissConfirm, setDismissConfirm] = useState(null);
    const [resolution, setResolution] = useState('');
    const [error, setError] = useState('');

    // Fetch reports
    const { data, isLoading } = useQuery({
        queryKey: ['admin-reports'],
        queryFn: async () => {
        const res = await client.get('/reports');
        return res.data;
        },
    });

    // Resolve mutation
    const resolveMutation = useMutation({
        mutationFn: ({ reportId, status, resolution }) => 
        client.put(`/reports/${reportId}/resolve`, { status, resolution }),
        onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
        setResolveModal(null);
        setDismissConfirm(null);
        setResolution('');
        setError('');
        },
        onError: (err) => setError(err.message),
    });

    // Filter reports
    const filteredReports = (data?.reports || []).filter(report => {
        return activeTab === 'all' || report.status === activeTab;
    });

    // Get pending count
    const pendingCount = (data?.reports || []).filter(r => r.status === 'pending').length;

    // Handle resolve
    const handleResolve = () => {
        if (!resolveModal) return;
        resolveMutation.mutate({
        reportId: resolveModal.id,
        status: 'resolved',
        resolution: resolution.trim() || undefined
        });
    };

    // Handle dismiss
    const handleDismiss = () => {
        if (!dismissConfirm) return;
        resolveMutation.mutate({
        reportId: dismissConfirm.id,
        status: 'dismissed'
        });
    };

    // Get empty state message
    const getEmptyMessage = () => {
        if (activeTab === 'pending') return 'No pending reports. The community is behaving!';
        return 'No reports in this category.';
    };

    return (
        <div className="space-y-6">
        {/* Header */}
        <h1 
            className="text-3xl font-bold"
            style={{ 
            fontFamily: 'DM Serif Display, serif',
            color: '#e8f0e0'
            }}
        >
            Reports
        </h1>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2">
            {TABS.map(({ key, label }) => (
            <button
                key={key}
                onClick={() => setActiveTab(key)}
                className="px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2"
                style={{ 
                backgroundColor: activeTab === key ? 'rgba(126, 200, 74, 0.15)' : 'transparent',
                border: `1px solid ${activeTab === key ? '#7ec84a' : 'rgba(126, 200, 74, 0.2)'}`,
                color: activeTab === key ? '#7ec84a' : '#6a8a5a'
                }}
            >
                {label}
                {key === 'pending' && pendingCount > 0 && (
                <span 
                    className="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                    style={{ 
                    backgroundColor: '#f59e0b',
                    color: '#0f1a09'
                    }}
                >
                    {pendingCount}
                </span>
                )}
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
                    {['Type', 'Reason', 'Reporter', 'Description', 'Status', 'Submitted', 'Actions'].map((header) => (
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
                ) : filteredReports.length === 0 ? (
                    <tr>
                    <td colSpan={7} className="px-4 py-12 text-center">
                        <div style={{ color: '#6a8a5a' }}>
                        <svg 
                            className="w-12 h-12 mx-auto mb-3" 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p>{getEmptyMessage()}</p>
                        </div>
                    </td>
                    </tr>
                ) : (
                    filteredReports.map((report, index) => {
                    const canAction = report.status === 'pending' || report.status === 'reviewed';
                    
                    return (
                        <tr 
                        key={report.id || report._id}
                        className="transition-colors duration-150"
                        style={{ 
                            backgroundColor: index % 2 === 1 ? 'rgba(126, 200, 74, 0.03)' : 'transparent',
                            borderBottom: '1px solid rgba(126, 200, 74, 0.08)'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(126, 200, 74, 0.06)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = index % 2 === 1 ? 'rgba(126, 200, 74, 0.03)' : 'transparent'}
                        >
                        <td className="px-4 py-3">
                            <Badge type={report.targetType} colors={TYPE_COLORS} />
                        </td>
                        <td className="px-4 py-3">
                            <span 
                            className="text-sm font-medium"
                            style={{ color: '#e8f0e0' }}
                            >
                            {REASON_LABELS[report.reason] || report.reason}
                            </span>
                        </td>
                        <td className="px-4 py-3">
                            <span 
                            className="text-sm"
                            style={{ color: '#a8c490' }}
                            >
                            {report.reporter?.fullName || report.reporter?.username || '-'}
                            </span>
                        </td>
                        <td className="px-4 py-3 max-w-xs">
                            <span 
                            className="text-sm"
                            style={{ color: '#a8c490' }}
                            title={report.description}
                            >
                            {truncate(report.description)}
                            </span>
                        </td>
                        <td className="px-4 py-3">
                            <Badge type={report.status} colors={STATUS_COLORS} />
                        </td>
                        <td className="px-4 py-3">
                            <span 
                            className="text-sm"
                            style={{ color: '#6a8a5a' }}
                            >
                            {formatDate(report.createdAt)}
                            </span>
                        </td>
                        <td className="px-4 py-3">
                            {canAction ? (
                            <div className="flex items-center gap-2">
                                <button
                                onClick={() => setResolveModal(report)}
                                className="px-3 py-1.5 rounded text-xs font-medium transition-all duration-200"
                                style={{ 
                                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                                    border: '1px solid #22c55e',
                                    color: '#22c55e'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(34, 197, 94, 0.2)'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(34, 197, 94, 0.1)'}
                                >
                                Resolve
                                </button>
                                <button
                                onClick={() => setDismissConfirm(report)}
                                className="px-3 py-1.5 rounded text-xs font-medium transition-all duration-200"
                                style={{ 
                                    border: '1px solid rgba(107, 114, 128, 0.5)',
                                    color: '#9ca3af'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(107, 114, 128, 0.1)'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                Dismiss
                                </button>
                            </div>
                            ) : (
                            <div className="text-xs" style={{ color: '#6a8a5a' }}>
                                {report.resolver && (
                                <span>
                                    {report.status === 'resolved' ? 'Resolved' : 'Dismissed'} by{' '}
                                    <span style={{ color: '#a8c490' }}>
                                    {report.resolver.fullName || report.resolver.username}
                                    </span>
                                </span>
                                )}
                            </div>
                            )}
                        </td>
                        </tr>
                    );
                    })
                )}
                </tbody>
            </table>
            </div>
        </div>

        {/* Resolve Modal */}
        {resolveModal && (
            <>
            <div 
                className="fixed inset-0 z-40"
                style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
                onClick={() => {
                setResolveModal(null);
                setResolution('');
                }}
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
                Resolve Report
                </h3>
                <p className="text-sm mb-4" style={{ color: '#a8c490' }}>
                Add an optional resolution note for this report.
                </p>
                
                <div className="mb-4">
                <label className="block text-[11px] font-medium uppercase tracking-wider mb-1.5" style={{ color: '#6a8a5a' }}>
                    Resolution Note (Optional)
                </label>
                <textarea
                    rows={3}
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    placeholder="Describe the action taken..."
                    className="w-full px-4 py-2.5 rounded-lg text-sm outline-none resize-none transition-all duration-200"
                    style={{ 
                    backgroundColor: '#0f1a09',
                    border: '1px solid rgba(126, 200, 74, 0.25)',
                    color: '#e8f0e0'
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = '#7ec84a'}
                    onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(126, 200, 74, 0.25)'}
                />
                </div>
                
                <div className="flex justify-end gap-3">
                <button
                    onClick={() => {
                    setResolveModal(null);
                    setResolution('');
                    }}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                    style={{ 
                    border: '1px solid rgba(126, 200, 74, 0.3)',
                    color: '#a8c490'
                    }}
                >
                    Cancel
                </button>
                <button
                    onClick={handleResolve}
                    disabled={resolveMutation.isPending}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50"
                    style={{ 
                    backgroundColor: '#3B6D11',
                    color: '#ffffff'
                    }}
                >
                    {resolveMutation.isPending ? 'Resolving...' : 'Resolve Report'}
                </button>
                </div>
            </div>
            </>
        )}

        {/* Dismiss Confirmation Modal */}
        {dismissConfirm && (
            <>
            <div 
                className="fixed inset-0 z-40"
                style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
                onClick={() => setDismissConfirm(null)}
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
                Dismiss Report?
                </h3>
                <p className="text-sm mb-6" style={{ color: '#a8c490' }}>
                Are you sure you want to dismiss this report? This indicates the report was reviewed but no action is needed.
                </p>
                <div className="flex justify-end gap-3">
                <button
                    onClick={() => setDismissConfirm(null)}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                    style={{ 
                    border: '1px solid rgba(126, 200, 74, 0.3)',
                    color: '#a8c490'
                    }}
                >
                    Cancel
                </button>
                <button
                    onClick={handleDismiss}
                    disabled={resolveMutation.isPending}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50"
                    style={{ 
                    border: '1px solid rgba(107, 114, 128, 0.5)',
                    color: '#9ca3af'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(107, 114, 128, 0.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                    {resolveMutation.isPending ? 'Processing...' : 'Dismiss Report'}
                </button>
                </div>
            </div>
            </>
        )}
        </div>
    );
}