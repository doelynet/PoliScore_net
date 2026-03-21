import { useState} from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getBills, createBill, updateBill, deleteBill } from '../../api/bills.api';

// Categories and statuses
const CATEGORIES = [
    'Taxation', 'Trade', 'Finance', 'Health', 'Education',
    'Infrastructure', 'Environment', 'Digital Economy', 'Labor', 'Investment', 'General'
    ];

    const STATUSES = [
    { value: 'draft', label: 'Draft' },
    { value: 'first_reading', label: 'First Reading' },
    { value: 'second_reading', label: 'Second Reading' },
    { value: 'committee_stage', label: 'Committee Stage' },
    { value: 'third_reading', label: 'Third Reading' },
    { value: 'presidential_assent', label: 'Presidential Assent' },
    { value: 'enacted', label: 'Enacted' },
    { value: 'rejected', label: 'Rejected' },
    ];

    // Status badge colors
    const STATUS_COLORS = {
    draft: { bg: 'rgba(107, 114, 128, 0.15)', text: '#9ca3af', dot: '#6b7280' },
    first_reading: { bg: 'rgba(59, 130, 246, 0.15)', text: '#60a5fa', dot: '#3b82f6' },
    second_reading: { bg: 'rgba(126, 200, 74, 0.15)', text: '#7ec84a', dot: '#3B6D11' },
    committee_stage: { bg: 'rgba(245, 158, 11, 0.15)', text: '#fbbf24', dot: '#f59e0b' },
    third_reading: { bg: 'rgba(168, 85, 247, 0.15)', text: '#c084fc', dot: '#a855f7' },
    presidential_assent: { bg: 'rgba(236, 72, 153, 0.15)', text: '#f472b6', dot: '#ec4899' },
    enacted: { bg: 'rgba(34, 197, 94, 0.15)', text: '#4ade80', dot: '#22c55e' },
    rejected: { bg: 'rgba(239, 68, 68, 0.15)', text: '#f87171', dot: '#ef4444' },
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

    // Table row skeleton
    const TableRowSkeleton = () => (
    <tr>
        {[...Array(7)].map((_, i) => (
        <td key={i} className="px-4 py-3">
            <div 
            className="h-4 rounded animate-pulse"
            style={{ 
                backgroundColor: 'rgba(126, 200, 74, 0.08)',
                width: i === 1 ? '60%' : i === 6 ? '80px' : '70%'
            }}
            />
        </td>
        ))}
    </tr>
    );

    // Status Badge Component
    const StatusBadge = ({ status }) => {
    const colors = STATUS_COLORS[status] || STATUS_COLORS.draft;
    const label = STATUSES.find(s => s.value === status)?.label || status;
    
    return (
        <span 
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
        style={{ backgroundColor: colors.bg, color: colors.text }}
        >
        <span 
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: colors.dot }}
        />
        {label}
        </span>
    );
    };

    export default function AdminBills() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [searchParams] = useSearchParams();
    
    // State
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [editingBill, setEditingBill] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [formError, setFormError] = useState('');
    
    // Form state
    const [formData, setFormData] = useState({
        title: '',
        billNumber: '',
        category: '',
        status: 'draft',
        sponsor: '',
        summary: '',
        description: '',
        amount: '',
        dueDate: '',
        stageNotes: ''
    });

    // Fetch bills
    const { data, isLoading, error } = useQuery({
        queryKey: ['admin-bills'],
        queryFn: async () => {
        const res = await getBills({ limit: 100 });
        return res.data;
        },
    });

    // Create mutation
    const createMutation = useMutation({
        mutationFn: (data) => createBill(data),
        onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['admin-bills'] });
        closePanel();
        },
        onError: (err) => setFormError(err.message),
    });

    // Update mutation
    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => updateBill(id, data),
        onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['admin-bills'] });
        closePanel();
        },
        onError: (err) => setFormError(err.message),
    });

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: (id) => deleteBill(id),
        onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['admin-bills'] });
        setDeleteConfirm(null);
        },
    });

    // Inline status update mutation
    const statusMutation = useMutation({
        mutationFn: ({ id, status }) => updateBill(id, { status }),
        onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['admin-bills'] });
        },
    });

    // Filter bills
    const filteredBills = (data?.bills || []).filter(bill => {
        const matchesSearch = !search || 
        bill.title?.toLowerCase().includes(search.toLowerCase()) ||
        bill.billNumber?.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = !statusFilter || bill.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    // Open panel for create/edit
    const openPanel = (bill = null) => {
        if (bill) {
        setEditingBill(bill);
        setFormData({
            title: bill.title || '',
            billNumber: bill.billNumber || '',
            category: bill.category || '',
            status: bill.status || 'draft',
            sponsor: bill.sponsor || '',
            summary: bill.summary || '',
            description: bill.description || '',
            amount: bill.amount || '',
            dueDate: bill.dueDate ? bill.dueDate.split('T')[0] : '',
            stageNotes: bill.stageNotes || ''
        });
        } else {
        setEditingBill(null);
        setFormData({
            title: '',
            billNumber: '',
            category: '',
            status: 'draft',
            sponsor: '',
            summary: '',
            description: '',
            amount: '',
            dueDate: '',
            stageNotes: ''
        });
        }
        setFormError('');
        setIsPanelOpen(true);
    };

    const closePanel = () => {
        setIsPanelOpen(false);
        setEditingBill(null);
        setFormError('');
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setFormError('');
        
        const payload = {
        ...formData,
        amount: formData.amount ? Number(formData.amount) : undefined,
        };

        if (editingBill) {
        updateMutation.mutate({ id: editingBill._id, data: payload });
        } else {
        createMutation.mutate(payload);
        }
    };

    const isSaving = createMutation.isPending || updateMutation.isPending;

    return (
        <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
            <h1 
            className="text-3xl font-bold"
            style={{ 
                fontFamily: 'DM Serif Display, serif',
                color: '#e8f0e0'
            }}
            >
            Bills
            </h1>
            <button
            onClick={() => openPanel()}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
            style={{ 
                backgroundColor: '#3B6D11',
                color: '#ffffff'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#639922'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3B6D11'}
            >
            Add Bill
            </button>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
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
                placeholder="Search bills..."
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
            <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 rounded-lg text-sm outline-none transition-all duration-200 cursor-pointer"
            style={{ 
                backgroundColor: '#0f1a09',
                border: '1px solid rgba(126, 200, 74, 0.25)',
                color: '#e8f0e0'
            }}
            >
            <option value="">All Statuses</option>
            {STATUSES.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
            ))}
            </select>
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
            Failed to load bills: {error.message}
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
                    {['Bill Number', 'Title', 'Category', 'Status', 'Sponsor', 'Stage Updated', 'Actions'].map((header) => (
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
                ) : filteredBills.length === 0 ? (
                    <tr>
                    <td colSpan={7} className="px-4 py-12 text-center">
                        <div style={{ color: '#6a8a5a' }}>
                        <svg 
                            className="w-12 h-12 mx-auto mb-3" 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p>No bills yet. Add your first bill.</p>
                        </div>
                    </td>
                    </tr>
                ) : (
                    filteredBills.map((bill, index) => (
                    <tr 
                        key={bill._id}
                        className="transition-colors duration-150"
                        style={{ 
                        backgroundColor: index % 2 === 1 ? 'rgba(126, 200, 74, 0.03)' : 'transparent',
                        borderBottom: '1px solid rgba(126, 200, 74, 0.08)'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(126, 200, 74, 0.06)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = index % 2 === 1 ? 'rgba(126, 200, 74, 0.03)' : 'transparent'}
                    >
                        <td className="px-4 py-3">
                        <span 
                            className="font-mono text-sm"
                            style={{ color: '#a8c490' }}
                        >
                            {bill.billNumber || '-'}
                        </span>
                        </td>
                        <td className="px-4 py-3">
                        <span 
                            className="text-sm font-medium"
                            style={{ color: '#e8f0e0' }}
                        >
                            {bill.title}
                        </span>
                        </td>
                        <td className="px-4 py-3">
                        <span 
                            className="text-sm"
                            style={{ color: '#a8c490' }}
                        >
                            {bill.category || '-'}
                        </span>
                        </td>
                        <td className="px-4 py-3">
                        <StatusBadge status={bill.status} />
                        </td>
                        <td className="px-4 py-3">
                        <span 
                            className="text-sm"
                            style={{ color: '#a8c490' }}
                        >
                            {bill.sponsor || '-'}
                        </span>
                        </td>
                        <td className="px-4 py-3">
                        <span 
                            className="text-sm"
                            style={{ color: '#6a8a5a' }}
                        >
                            {formatDate(bill.updatedAt)}
                        </span>
                        </td>
                        <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                            {/* View */}
                            <button
                            onClick={() => navigate(`/bills/${bill._id}/stages`)}
                            className="p-2 rounded-lg transition-colors duration-150"
                            style={{ color: '#6a8a5a' }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = 'rgba(126, 200, 74, 0.1)';
                                e.currentTarget.style.color = '#7ec84a';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.color = '#6a8a5a';
                            }}
                            title="View bill"
                            >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            </button>
                            {/* Edit */}
                            <button
                            onClick={() => openPanel(bill)}
                            className="p-2 rounded-lg transition-colors duration-150"
                            style={{ color: '#6a8a5a' }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = 'rgba(126, 200, 74, 0.1)';
                                e.currentTarget.style.color = '#7ec84a';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.color = '#6a8a5a';
                            }}
                            title="Edit bill"
                            >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            </button>
                            {/* Stage dropdown */}
                            <select
                            value={bill.status}
                            onChange={(e) => statusMutation.mutate({ id: bill._id, status: e.target.value })}
                            className="p-1.5 rounded text-xs cursor-pointer outline-none"
                            style={{ 
                                backgroundColor: 'transparent',
                                border: '1px solid rgba(126, 200, 74, 0.2)',
                                color: '#a8c490'
                            }}
                            title="Change status"
                            >
                            {STATUSES.map(({ value, label }) => (
                                <option key={value} value={value} style={{ backgroundColor: '#1a2610' }}>
                                {label}
                                </option>
                            ))}
                            </select>
                            {/* Delete */}
                            <button
                            onClick={() => setDeleteConfirm(bill._id)}
                            className="p-2 rounded-lg transition-colors duration-150"
                            style={{ color: '#6a8a5a' }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                                e.currentTarget.style.color = '#ef4444';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.color = '#6a8a5a';
                            }}
                            title="Delete bill"
                            >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            </button>
                        </div>
                        </td>
                    </tr>
                    ))
                )}
                </tbody>
            </table>
            </div>
        </div>

        {/* Slide-over Panel */}
        {isPanelOpen && (
            <>
            {/* Backdrop */}
            <div 
                className="fixed inset-0 z-40 transition-opacity duration-300"
                style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
                onClick={closePanel}
            />
            
            {/* Panel */}
            <div 
                className="fixed right-0 top-0 h-full w-full sm:w-[480px] z-50 overflow-y-auto"
                style={{ backgroundColor: '#1a2610' }}
            >
                <form onSubmit={handleSubmit} className="flex flex-col h-full">
                {/* Header */}
                <div 
                    className="flex items-center justify-between px-6 py-4"
                    style={{ borderBottom: '1px solid rgba(126, 200, 74, 0.15)' }}
                >
                    <h2 
                    className="text-xl font-bold"
                    style={{ 
                        fontFamily: 'DM Serif Display, serif',
                        color: '#e8f0e0'
                    }}
                    >
                    {editingBill ? 'Edit Bill' : 'New Bill'}
                    </h2>
                    <button
                    type="button"
                    onClick={closePanel}
                    className="p-2 rounded-lg transition-colors duration-150"
                    style={{ color: '#6a8a5a' }}
                    >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    </button>
                </div>

                {/* Form Fields */}
                <div className="flex-1 px-6 py-4 space-y-4 overflow-y-auto">
                    {formError && (
                    <div 
                        className="p-3 rounded-lg text-sm"
                        style={{ 
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        color: '#ef4444'
                        }}
                    >
                        {formError}
                    </div>
                    )}

                    {/* Title */}
                    <div>
                    <label className="block text-[11px] font-medium uppercase tracking-wider mb-1.5" style={{ color: '#6a8a5a' }}>
                        Title *
                    </label>
                    <input
                        type="text"
                        required
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-lg text-sm outline-none transition-all duration-200"
                        style={{ 
                        backgroundColor: '#0f1a09',
                        border: '1px solid rgba(126, 200, 74, 0.25)',
                        color: '#e8f0e0'
                        }}
                        onFocus={(e) => e.currentTarget.style.borderColor = '#7ec84a'}
                        onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(126, 200, 74, 0.25)'}
                    />
                    </div>

                    {/* Bill Number */}
                    <div>
                    <label className="block text-[11px] font-medium uppercase tracking-wider mb-1.5" style={{ color: '#6a8a5a' }}>
                        Bill Number
                    </label>
                    <input
                        type="text"
                        value={formData.billNumber}
                        onChange={(e) => setFormData({ ...formData, billNumber: e.target.value })}
                        placeholder="e.g., HB-2026-001"
                        className="w-full px-4 py-2.5 rounded-lg text-sm outline-none transition-all duration-200"
                        style={{ 
                        backgroundColor: '#0f1a09',
                        border: '1px solid rgba(126, 200, 74, 0.25)',
                        color: '#e8f0e0'
                        }}
                        onFocus={(e) => e.currentTarget.style.borderColor = '#7ec84a'}
                        onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(126, 200, 74, 0.25)'}
                    />
                    </div>

                    {/* Category & Status */}
                    <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[11px] font-medium uppercase tracking-wider mb-1.5" style={{ color: '#6a8a5a' }}>
                        Category
                        </label>
                        <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-lg text-sm outline-none cursor-pointer"
                        style={{ 
                            backgroundColor: '#0f1a09',
                            border: '1px solid rgba(126, 200, 74, 0.25)',
                            color: '#e8f0e0'
                        }}
                        >
                        <option value="">Select...</option>
                        {CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-[11px] font-medium uppercase tracking-wider mb-1.5" style={{ color: '#6a8a5a' }}>
                        Status
                        </label>
                        <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-lg text-sm outline-none cursor-pointer"
                        style={{ 
                            backgroundColor: '#0f1a09',
                            border: '1px solid rgba(126, 200, 74, 0.25)',
                            color: '#e8f0e0'
                        }}
                        >
                        {STATUSES.map(({ value, label }) => (
                            <option key={value} value={value}>{label}</option>
                        ))}
                        </select>
                    </div>
                    </div>

                    {/* Sponsor */}
                    <div>
                    <label className="block text-[11px] font-medium uppercase tracking-wider mb-1.5" style={{ color: '#6a8a5a' }}>
                        Sponsor
                    </label>
                    <input
                        type="text"
                        value={formData.sponsor}
                        onChange={(e) => setFormData({ ...formData, sponsor: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-lg text-sm outline-none transition-all duration-200"
                        style={{ 
                        backgroundColor: '#0f1a09',
                        border: '1px solid rgba(126, 200, 74, 0.25)',
                        color: '#e8f0e0'
                        }}
                        onFocus={(e) => e.currentTarget.style.borderColor = '#7ec84a'}
                        onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(126, 200, 74, 0.25)'}
                    />
                    </div>

                    {/* Summary */}
                    <div>
                    <label className="block text-[11px] font-medium uppercase tracking-wider mb-1.5" style={{ color: '#6a8a5a' }}>
                        Summary
                    </label>
                    <textarea
                        rows={3}
                        value={formData.summary}
                        onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                        placeholder="Plain language description..."
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

                    {/* Description */}
                    <div>
                    <label className="block text-[11px] font-medium uppercase tracking-wider mb-1.5" style={{ color: '#6a8a5a' }}>
                        Description
                    </label>
                    <textarea
                        rows={4}
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Full text / details..."
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

                    {/* Amount & Due Date */}
                    <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[11px] font-medium uppercase tracking-wider mb-1.5" style={{ color: '#6a8a5a' }}>
                        Amount (KES)
                        </label>
                        <input
                        type="number"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-lg text-sm outline-none transition-all duration-200"
                        style={{ 
                            backgroundColor: '#0f1a09',
                            border: '1px solid rgba(126, 200, 74, 0.25)',
                            color: '#e8f0e0'
                        }}
                        onFocus={(e) => e.currentTarget.style.borderColor = '#7ec84a'}
                        onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(126, 200, 74, 0.25)'}
                        />
                    </div>
                    <div>
                        <label className="block text-[11px] font-medium uppercase tracking-wider mb-1.5" style={{ color: '#6a8a5a' }}>
                        Due Date
                        </label>
                        <input
                        type="date"
                        value={formData.dueDate}
                        onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-lg text-sm outline-none transition-all duration-200"
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

                    {/* Stage Notes */}
                    <div>
                    <label className="block text-[11px] font-medium uppercase tracking-wider mb-1.5" style={{ color: '#6a8a5a' }}>
                        Stage Notes
                    </label>
                    <textarea
                        rows={2}
                        value={formData.stageNotes}
                        onChange={(e) => setFormData({ ...formData, stageNotes: e.target.value })}
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
                </div>

                {/* Footer */}
                <div 
                    className="flex items-center justify-end gap-3 px-6 py-4"
                    style={{ borderTop: '1px solid rgba(126, 200, 74, 0.15)' }}
                >
                    <button
                    type="button"
                    onClick={closePanel}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                    style={{ 
                        border: '1px solid rgba(126, 200, 74, 0.3)',
                        color: '#a8c490'
                    }}
                    >
                    Cancel
                    </button>
                    <button
                    type="submit"
                    disabled={isSaving}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50"
                    style={{ 
                        backgroundColor: '#3B6D11',
                        color: '#ffffff'
                    }}
                    >
                    {isSaving ? 'Saving...' : 'Save'}
                    </button>
                </div>
                </form>
            </div>
            </>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
            <>
            <div 
                className="fixed inset-0 z-40"
                style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
                onClick={() => setDeleteConfirm(null)}
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
                Delete Bill?
                </h3>
                <p className="text-sm mb-6" style={{ color: '#a8c490' }}>
                This action cannot be undone. The bill and all its stage history will be permanently removed.
                </p>
                <div className="flex justify-end gap-3">
                <button
                    onClick={() => setDeleteConfirm(null)}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                    style={{ 
                    border: '1px solid rgba(126, 200, 74, 0.3)',
                    color: '#a8c490'
                    }}
                >
                    Cancel
                </button>
                <button
                    onClick={() => deleteMutation.mutate(deleteConfirm)}
                    disabled={deleteMutation.isPending}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50"
                    style={{ 
                    border: '1px solid #ef4444',
                    color: '#ef4444'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                    {deleteMutation.isPending ? 'Deleting...' : 'Delete Bill'}
                </button>
                </div>
            </div>
            </>
        )}
        </div>
    );
}