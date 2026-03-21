import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getBills } from '../../api/bills.api';

/* ─────────────────────────────────────────────
    STATUS CONFIGURATION
    ───────────────────────────────────────────── */
    const STATUS_CONFIG = {
    draft:               { label: 'Draft',              color: '#6b7280', bg: 'rgba(107, 114, 128, 0.1)' },
    first_reading:       { label: 'First Reading',     color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' },
    second_reading:      { label: 'Second Reading',    color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)' },
    committee_stage:     { label: 'Committee Stage',   color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
    third_reading:       { label: 'Third Reading',     color: '#ec4899', bg: 'rgba(236, 72, 153, 0.1)' },
    presidential_assent: { label: 'Presidential Assent', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
    enacted:             { label: 'Enacted',           color: '#22c55e', bg: 'rgba(34, 197, 94, 0.1)' },
    rejected:            { label: 'Rejected',          color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' },
    };

    const CATEGORIES = ['All', 'Taxation', 'Trade', 'Finance', 'Health', 'Education', 'Infrastructure', 'Environment'];

    const STAGE_ORDER = [
    'draft', 'first_reading', 'second_reading', 'committee_stage', 
    'third_reading', 'presidential_assent', 'enacted'
    ];

    /* ─────────────────────────────────────────────
    ANIMATION HOOK — staggered fade-in
    ───────────────────────────────────────────── */
    function useStaggeredReveal(items, baseDelay = 50) {
    const [visibleItems, setVisibleItems] = useState([]);
    
    useEffect(() => {
        if (!items?.length) return;
    const timer = setTimeout(() => {
        setVisibleItems([]);
    }, 0);
    
    return () => clearTimeout(timer);
    },
    [items, baseDelay]);
    
    return visibleItems;
    }

    /* ─────────────────────────────────────────────
    COMPONENTS
    ───────────────────────────────────────────── */

    function SearchIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
        </svg>
    );
    }

    function FilterIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
        </svg>
    );
    }

    function ChevronIcon({ direction = 'right' }) {
    return (
        <svg 
        width="16" 
        height="16" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        style={{ transform: direction === 'down' ? 'rotate(90deg)' : 'none' }}
        >
        <polyline points="9 18 15 12 9 6" />
        </svg>
    );
    }

    function StatusBadge({ status }) {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
    return (
        <span
        className="status-badge"
        style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: '20px',
            fontSize: '11px',
            fontWeight: '600',
            letterSpacing: '0.3px',
            color: config.color,
            backgroundColor: config.bg,
            textTransform: 'uppercase',
        }}
        >
        <span
            style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: config.color,
            animation: status === 'committee_stage' ? 'pulse 2s infinite' : 'none',
            }}
        />
        {config.label}
        </span>
    );
    }

    function StageProgress({ status }) {
    const currentIndex = STAGE_ORDER.indexOf(status);
    const isRejected = status === 'rejected';
    
    return (
        <div className="stage-progress" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        {STAGE_ORDER.slice(0, 5).map((stage, index) => (
            <div
            key={stage}
            style={{
                width: index <= currentIndex && !isRejected ? '20px' : '8px',
                height: '4px',
                borderRadius: '2px',
                backgroundColor: isRejected
                ? 'rgba(239, 68, 68, 0.3)'
                : index <= currentIndex
                    ? 'var(--brand)'
                    : 'var(--border-subtle)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
            />
        ))}
        </div>
    );
    }

    function VoteBar({ votes }) {
    const yes = votes?.yes || 0;
    const no = votes?.no || 0;
    const abstain = votes?.abstain || 0;
    const total = yes + no + abstain || 1;
    
    return (
        <div className="vote-bar" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div
            style={{
            display: 'flex',
            height: '4px',
            borderRadius: '2px',
            overflow: 'hidden',
            gap: '1px',
            backgroundColor: 'var(--bg-input)',
            }}
        >
            <div
            style={{
                width: `${(yes / total) * 100}%`,
                backgroundColor: '#22c55e',
                transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
            />
            <div
            style={{
                width: `${(no / total) * 100}%`,
                backgroundColor: '#ef4444',
                transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
            />
            <div
            style={{
                width: `${(abstain / total) * 100}%`,
                backgroundColor: '#9ca3af',
                transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
            />
        </div>
        <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: 'var(--text-muted)' }}>
            <span style={{ color: '#22c55e' }}>{yes} yes</span>
            <span style={{ color: '#ef4444' }}>{no} no</span>
            <span>{abstain} abstain</span>
        </div>
        </div>
    );
    }

    function BillCard({ bill, isVisible }) {
    const cardRef = useRef(null);
    
    return (
        <Link
        to={`/bills/${bill.id}`}
        ref={cardRef}
        className="bill-card"
        style={{
            display: 'block',
            textDecoration: 'none',
            backgroundColor: 'var(--bg-card)',
            borderRadius: '16px',
            border: '1px solid var(--border-subtle)',
            padding: '24px',
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
            transition: `opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1), 
                        transform 0.4s cubic-bezier(0.4, 0, 0.2, 1),
                        box-shadow 0.2s ease,
                        border-color 0.2s ease`,
            cursor: 'pointer',
        }}
        onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = 'var(--shadow-card)';
            e.currentTarget.style.borderColor = 'var(--brand)';
            e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = 'none';
            e.currentTarget.style.borderColor = 'var(--border-subtle)';
            e.currentTarget.style.transform = 'translateY(0)';
        }}
        >
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ flex: 1 }}>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                {bill.billNumber || `Bill #${bill.id?.slice(0, 8)}`}
            </p>
            <h3 style={{ 
                fontSize: '17px', 
                fontWeight: '600', 
                color: 'var(--text-primary)', 
                margin: 0, 
                lineHeight: 1.4,
                fontFamily: "'DM Serif Display', serif",
            }}>
                {bill.title}
            </h3>
            </div>
            <StatusBadge status={bill.status} />
        </div>

        {/* Description */}
        {bill.summary && (
            <p style={{ 
            fontSize: '13.5px', 
            color: 'var(--text-secondary)', 
            lineHeight: 1.65, 
            marginBottom: '16px',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            }}>
            {bill.summary}
            </p>
        )}

        {/* Meta row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
            {bill.category && (
            <span style={{
                fontSize: '11px',
                color: 'var(--brand)',
                backgroundColor: 'var(--brand-light)',
                padding: '3px 10px',
                borderRadius: '6px',
                fontWeight: '500',
            }}>
                {bill.category}
            </span>
            )}
            {bill.sponsor && (
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Sponsored by <span style={{ color: 'var(--text-secondary)', fontWeight: '500' }}>{bill.sponsor}</span>
            </span>
            )}
        </div>

        {/* Progress and votes */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px' }}>
            <StageProgress status={bill.status} />
            {bill.votes && <VoteBar votes={bill.votes} />}
        </div>

        {/* Footer with arrow */}
        <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'flex-end', 
            marginTop: '16px',
            paddingTop: '16px',
            borderTop: '1px solid var(--border-muted)',
        }}>
            <span style={{ 
            fontSize: '12px', 
            color: 'var(--brand)', 
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            }}>
            View details
            <ChevronIcon />
            </span>
        </div>
        </Link>
    );
    }

    function EmptyState() {
    return (
        <div style={{
        textAlign: 'center',
        padding: '80px 20px',
        backgroundColor: 'var(--bg-card)',
        borderRadius: '16px',
        border: '1px solid var(--border-subtle)',
        }}>
        <div style={{
            width: '64px',
            height: '64px',
            margin: '0 auto 20px',
            borderRadius: '16px',
            backgroundColor: 'var(--brand-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '28px',
        }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="1.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <line x1="10" y1="9" x2="8" y2="9" />
            </svg>
        </div>
        <h3 style={{ 
            fontSize: '18px', 
            fontWeight: '600', 
            color: 'var(--text-primary)', 
            marginBottom: '8px',
            fontFamily: "'DM Serif Display', serif",
        }}>
            No bills found
        </h3>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', maxWidth: '300px', margin: '0 auto' }}>
            Try adjusting your search or filter criteria to find what you're looking for.
        </p>
        </div>
    );
    }

    function LoadingSkeleton() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {[1, 2, 3, 4].map((i) => (
            <div
            key={i}
            style={{
                backgroundColor: 'var(--bg-card)',
                borderRadius: '16px',
                border: '1px solid var(--border-subtle)',
                padding: '24px',
                animation: 'shimmer 1.5s infinite',
            }}
            >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div>
                <div style={{ width: '100px', height: '12px', backgroundColor: 'var(--bg-input)', borderRadius: '4px', marginBottom: '8px' }} />
                <div style={{ width: '250px', height: '20px', backgroundColor: 'var(--bg-input)', borderRadius: '4px' }} />
                </div>
                <div style={{ width: '100px', height: '24px', backgroundColor: 'var(--bg-input)', borderRadius: '20px' }} />
            </div>
            <div style={{ width: '100%', height: '40px', backgroundColor: 'var(--bg-input)', borderRadius: '4px', marginBottom: '16px' }} />
            <div style={{ display: 'flex', gap: '8px' }}>
                {[1, 2, 3, 4, 5].map((j) => (
                <div key={j} style={{ width: '20px', height: '4px', backgroundColor: 'var(--bg-input)', borderRadius: '2px' }} />
                ))}
            </div>
            </div>
        ))}
        </div>
    );
    }

    /* ─────────────────────────────────────────────
    MAIN COMPONENT
    ───────────────────────────────────────────── */
    export default function BillList() {
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('All');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortBy, setSortBy] = useState('newest');
    const [showFilters, setShowFilters] = useState(false);

    const { data, isLoading, error } = useQuery({
        queryKey: ['bills', { search, category: category !== 'All' ? category : undefined, status: statusFilter !== 'all' ? statusFilter : undefined }],
        queryFn: () => getBills({ 
        search: search || undefined, 
        category: category !== 'All' ? category : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        }),
    });

    const bills = data?.data?.bills || data?.data || [];
    
    // Sort bills
    const sortedBills = [...bills].sort((a, b) => {
        if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
        if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
        if (sortBy === 'title') return a.title.localeCompare(b.title);
        return 0;
    });

    const visibleItems = useStaggeredReveal(sortedBills, 60);

    return (
        <div className="bill-list-page" style={{ minHeight: '100vh' }}>
        {/* Custom styles */}
        <style>{`
            @keyframes shimmer {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
            }
            
            @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
            }
            
            @keyframes slideDown {
            from { opacity: 0; height: 0; }
            to { opacity: 1; height: auto; }
            }
            
            .filter-chip {
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            }
            
            .filter-chip:hover {
            transform: translateY(-1px);
            }
            
            .search-input:focus {
            outline: none;
            border-color: var(--brand);
            box-shadow: 0 0 0 3px var(--brand-light);
            }
            
            .filter-panel {
            animation: slideDown 0.3s ease-out;
            }
        `}</style>

        {/* Page Header */}
        <header style={{ marginBottom: '32px' }}>
            <div style={{ marginBottom: '8px' }}>
            <span style={{
                fontSize: '11px',
                fontWeight: '600',
                color: 'var(--brand)',
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
            }}>
                Parliamentary Bills
            </span>
            </div>
            <h1 style={{
            fontSize: 'clamp(28px, 5vw, 36px)',
            fontWeight: '400',
            color: 'var(--text-primary)',
            margin: '0 0 8px',
            fontFamily: "'DM Serif Display', serif",
            letterSpacing: '-0.5px',
            }}>
            Track Legislation
            </h1>
            <p style={{
            fontSize: '15px',
            color: 'var(--text-secondary)',
            margin: 0,
            lineHeight: 1.6,
            }}>
            Follow bills from introduction through enactment. Stay informed on legislation that impacts your business.
            </p>
        </header>

        {/* Search and Filter Bar */}
        <div style={{ marginBottom: '24px' }}>
            {/* Search row */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
            <div style={{ flex: 1, position: 'relative' }}>
                <div style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
                pointerEvents: 'none',
                }}>
                <SearchIcon />
                </div>
                <input
                type="text"
                placeholder="Search bills by title, number, or keyword..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="search-input"
                style={{
                    width: '100%',
                    padding: '12px 16px 12px 44px',
                    borderRadius: '12px',
                    border: '1px solid var(--border-input)',
                    backgroundColor: 'var(--bg-input)',
                    fontSize: '14px',
                    color: 'var(--text-primary)',
                    transition: 'all 0.2s ease',
                }}
                />
            </div>
            <button
                onClick={() => setShowFilters(!showFilters)}
                style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 20px',
                borderRadius: '12px',
                border: '1px solid var(--border-input)',
                backgroundColor: showFilters ? 'var(--brand-light)' : 'var(--bg-card)',
                color: showFilters ? 'var(--brand)' : 'var(--text-secondary)',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                }}
            >
                <FilterIcon />
                Filters
                <ChevronIcon direction={showFilters ? 'down' : 'right'} />
            </button>
            </div>

            {/* Filter panel */}
            {showFilters && (
            <div className="filter-panel" style={{
                padding: '20px',
                backgroundColor: 'var(--bg-card)',
                borderRadius: '12px',
                border: '1px solid var(--border-subtle)',
                marginBottom: '16px',
            }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                {/* Status filter */}
                <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Status
                    </label>
                    <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-input)',
                        backgroundColor: 'var(--bg-input)',
                        fontSize: '14px',
                        color: 'var(--text-primary)',
                        cursor: 'pointer',
                    }}
                    >
                    <option value="all">All Statuses</option>
                    {Object.entries(STATUS_CONFIG).map(([key, val]) => (
                        <option key={key} value={key}>{val.label}</option>
                    ))}
                    </select>
                </div>

                {/* Sort filter */}
                <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Sort By
                    </label>
                    <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-input)',
                        backgroundColor: 'var(--bg-input)',
                        fontSize: '14px',
                        color: 'var(--text-primary)',
                        cursor: 'pointer',
                    }}
                    >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="title">Title A-Z</option>
                    </select>
                </div>
                </div>
            </div>
            )}

            {/* Category chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {CATEGORIES.map((cat) => (
                <button
                key={cat}
                onClick={() => setCategory(cat)}
                className="filter-chip"
                style={{
                    padding: '8px 16px',
                    borderRadius: '20px',
                    border: category === cat ? '1px solid var(--brand)' : '1px solid var(--border-subtle)',
                    backgroundColor: category === cat ? 'var(--brand)' : 'var(--bg-card)',
                    color: category === cat ? '#fff' : 'var(--text-secondary)',
                    fontSize: '13px',
                    fontWeight: '500',
                    cursor: 'pointer',
                }}
                >
                {cat}
                </button>
            ))}
            </div>
        </div>

        {/* Results count */}
        {!isLoading && (
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
            {sortedBills.length === 0 
                ? 'No bills match your criteria' 
                : `Showing ${sortedBills.length} bill${sortedBills.length !== 1 ? 's' : ''}`
            }
            </p>
        )}

        {/* Bill List */}
        {isLoading ? (
            <LoadingSkeleton />
        ) : error ? (
            <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            backgroundColor: 'var(--error-bg)',
            borderRadius: '16px',
            border: '1px solid var(--error-border)',
            color: 'var(--error-text)',
            }}>
            <p style={{ margin: 0 }}>Failed to load bills. Please try again later.</p>
            </div>
        ) : sortedBills.length === 0 ? (
            <EmptyState />
        ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {sortedBills.map((bill, index) => (
                <BillCard 
                key={bill.id} 
                bill={bill} 
                index={index}
                isVisible={visibleItems.includes(index)}
                />
            ))}
            </div>
        )}
        </div>
    );
}