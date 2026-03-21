import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getBill, getBillStages } from '../../api/bills.api';
import { castVote, getResults } from '../../api/votes.api';
import { useAuthStore } from '../../store/authStore';

/* ─────────────────────────────────────────────
    CONFIGURATION
    ───────────────────────────────────────────── */
const STAGE_ORDER = [
    'draft',
    'first_reading',
    'second_reading',
    'committee_stage',
    'third_reading',
    'presidential_assent',
    'enacted',
];

const STAGE_LABELS = {
    draft:               'Draft',
    first_reading:       'First Reading',
    second_reading:      'Second Reading',
    committee_stage:     'Committee Stage',
    third_reading:       'Third Reading',
    presidential_assent: 'Presidential Assent',
    enacted:             'Enacted',
    rejected:            'Rejected',
};

const STATUS_STYLES = {
    draft:               { bg: 'rgba(107,114,128,0.1)', color: '#4b5563',  dot: '#6b7280' },
    first_reading:       { bg: 'rgba(59,130,246,0.1)',  color: '#1d4ed8',  dot: '#3b82f6' },
    second_reading:      { bg: 'rgba(139,92,246,0.1)',  color: '#6d28d9',  dot: '#8b5cf6' },
    committee_stage:     { bg: 'rgba(245,158,11,0.1)',  color: '#b45309',  dot: '#f59e0b' },
    third_reading:       { bg: 'rgba(236,72,153,0.1)',  color: '#be185d',  dot: '#ec4899' },
    presidential_assent: { bg: 'rgba(16,185,129,0.1)',  color: '#047857',  dot: '#10b981' },
    enacted:             { bg: 'rgba(34,197,94,0.1)',   color: '#15803d',  dot: '#22c55e' },
    rejected:            { bg: 'rgba(239,68,68,0.1)',   color: '#b91c1c',  dot: '#ef4444' },
};

/* ─────────────────────────────────────────────
    HELPERS
    ───────────────────────────────────────────── */
function formatDate(dateString) {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-GB', {
        day: 'numeric', month: 'short', year: 'numeric',
    });
}

function getStageIndex(stage) {
    return STAGE_ORDER.indexOf(stage);
}

/* ─────────────────────────────────────────────
    SMALL COMPONENTS
    ───────────────────────────────────────────── */
function StatusBadge({ status }) {
    const s = STATUS_STYLES[status] || STATUS_STYLES.draft;
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: s.bg, color: s.color,
            fontSize: 11, fontWeight: 600, letterSpacing: '0.4px',
            padding: '4px 12px', borderRadius: 20, textTransform: 'uppercase',
        }}>
            <span style={{
                width: 6, height: 6, borderRadius: '50%', background: s.dot, flexShrink: 0,
                animation: ['committee_stage','second_reading','third_reading'].includes(status)
                    ? 'pulse 2s ease-in-out infinite' : 'none',
            }} />
            {STAGE_LABELS[status] || status}
        </span>
    );
}

function CategoryTag({ category }) {
    if (!category) return null;
    return (
        <span style={{
            display: 'inline-block', fontSize: 10, fontWeight: 600,
            letterSpacing: '0.5px', textTransform: 'uppercase',
            color: '#3B6D11', background: 'rgba(59,109,17,0.1)',
            padding: '4px 10px', borderRadius: 12,
        }}>{category}</span>
    );
}

function VoteBar({ yes = 0, no = 0, abstain = 0, total }) {
    const t = total || yes + no + abstain || 1;
    const yPct = Math.round((yes / t) * 100);
    const nPct = Math.round((no  / t) * 100);
    const aPct = Math.round((abstain / t) * 100);
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', height: 6, borderRadius: 4, overflow: 'hidden', gap: 2, background: '#f3f4f6' }}>
                <div style={{ width: `${yPct}%`, background: '#22c55e', minWidth: yes     > 0 ? 4 : 0, transition: 'width 0.5s' }} />
                <div style={{ width: `${nPct}%`, background: '#ef4444', minWidth: no      > 0 ? 4 : 0, transition: 'width 0.5s' }} />
                <div style={{ width: `${aPct}%`, background: '#9ca3af', minWidth: abstain > 0 ? 4 : 0, transition: 'width 0.5s' }} />
            </div>
            <div style={{ display: 'flex', gap: 16, fontSize: 11 }}>
                <span style={{ color: '#16a34a', fontWeight: 500 }}>{yPct}% yes</span>
                <span style={{ color: '#dc2626', fontWeight: 500 }}>{nPct}% no</span>
                <span style={{ color: '#6b7280', fontWeight: 500 }}>{aPct}% abstain</span>
                <span style={{ color: '#9ca3af', marginLeft: 'auto' }}>{t} total votes</span>
            </div>
        </div>
    );
}

function VoteButtons({ onVote, userVote, disabled }) {
    const [hovered, setHovered] = useState(null);
    const buttons = [
        { type: 'yes',     label: 'Yes',     border: '#22c55e', color: '#16a34a', hoverBg: 'rgba(34,197,94,0.1)'   },
        { type: 'no',      label: 'No',      border: '#ef4444', color: '#dc2626', hoverBg: 'rgba(239,68,68,0.1)'   },
        { type: 'abstain', label: 'Abstain', border: '#9ca3af', color: '#6b7280', hoverBg: 'rgba(156,163,175,0.1)' },
    ];
    return (
        <div style={{ display: 'flex', gap: 12 }}>
            {buttons.map(btn => {
                const isActive = userVote === btn.type;
                return (
                    <button
                        key={btn.type}
                        onClick={() => !disabled && onVote(btn.type)}
                        onMouseEnter={() => setHovered(btn.type)}
                        onMouseLeave={() => setHovered(null)}
                        style={{
                            flex: 1, padding: '10px 16px', borderRadius: 8,
                            fontSize: 13, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer',
                            border: `1.5px solid ${btn.border}`, color: btn.color,
                            background: isActive ? btn.hoverBg : hovered === btn.type ? btn.hoverBg : 'transparent',
                            transform: hovered === btn.type ? 'translateY(-1px)' : 'none',
                            transition: 'all 0.2s',
                            opacity: disabled ? 0.6 : 1,
                        }}
                    >
                        {isActive ? `✓ ${btn.label}` : btn.label}
                    </button>
                );
            })}
        </div>
    );
}

function UserChip({ user }) {
    if (!user) return null;
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontSize: 11, color: '#6b7280', background: '#f3f4f6',
            padding: '3px 10px 3px 6px', borderRadius: 12,
        }}>
            <span style={{
                width: 18, height: 18, borderRadius: '50%',
                background: 'rgba(59,109,17,0.15)', color: '#3B6D11',
                fontSize: 9, fontWeight: 600,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
                {user.username?.charAt(0).toUpperCase() || 'U'}
            </span>
            {user.fullName || user.username}
        </span>
    );
}

/* ─────────────────────────────────────────────
    STAGE NODE (desktop horizontal)
    ───────────────────────────────────────────── */
function StageNode({ stageKey, stageData, isCompleted, isCurrent, isRejected, isFuture, isLast }) {
    const label = STAGE_LABELS[stageKey] || stageKey;
    let nodeColor = '#d1d5db';
    let nodeBg    = 'transparent';
    let glowStyle = {};

    if (isRejected && stageKey === 'rejected') { nodeColor = '#ef4444'; nodeBg = '#ef4444'; }
    else if (isCompleted) { nodeColor = '#3B6D11'; nodeBg = '#3B6D11'; }
    else if (isCurrent)   {
        nodeColor = '#3B6D11'; nodeBg = '#3B6D11';
        glowStyle = { boxShadow: '0 0 0 4px rgba(59,109,17,0.2), 0 0 16px rgba(59,109,17,0.3)' };
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', flex: isLast ? '0 0 auto' : 1, minWidth: 80 }}>
            <div style={{
                width: 24, height: 24, borderRadius: '50%',
                border: `2px solid ${nodeColor}`, background: nodeBg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative', zIndex: 2,
                transition: 'all 0.3s', ...glowStyle,
            }}>
                {isCompleted && !isCurrent && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                    </svg>
                )}
                {isCurrent && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff', animation: 'pulse 2s ease-in-out infinite' }} />}
                {isRejected && stageKey === 'rejected' && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                )}
            </div>

            <div style={{ marginTop: 10, textAlign: 'center', maxWidth: 100 }}>
                {isCurrent && (
                    <span style={{ display: 'block', fontSize: 9, fontWeight: 700, color: '#3B6D11', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 4 }}>
                        Current
                    </span>
                )}
                <span style={{ display: 'block', fontSize: 12, fontWeight: isCurrent ? 600 : 500, color: isFuture ? '#9ca3af' : '#374151', lineHeight: 1.3 }}>
                    {label}
                </span>
                {stageData?.changedAt && (
                    <span style={{ display: 'block', fontSize: 10, color: '#9ca3af', marginTop: 4 }}>
                        {formatDate(stageData.changedAt)}
                    </span>
                )}
                {stageData?.notes && (
                    <span style={{ display: 'block', fontSize: 10, fontStyle: 'italic', color: '#6b7280', marginTop: 4, maxWidth: 100 }}>
                        {stageData.notes}
                    </span>
                )}
                {stageData?.changedByUser && (
                    <div style={{ marginTop: 6 }}><UserChip user={stageData.changedByUser} /></div>
                )}
            </div>
        </div>
    );
}

function StageConnector({ isCompleted }) {
    return (
        <div style={{
            flex: 1, height: 2,
            background: isCompleted ? '#3B6D11' : 'transparent',
            borderTop: isCompleted ? 'none' : '2px dashed #d1d5db',
            position: 'relative', top: 12,
            marginLeft: -12, marginRight: -12, zIndex: 1, transition: 'all 0.3s',
        }} />
    );
}

/* ─────────────────────────────────────────────
    MOBILE STAGE NODE (vertical)
    ───────────────────────────────────────────── */
function MobileStageNode({ stageKey, stageData, isCompleted, isCurrent, isRejected, isFuture, isLast }) {
    const label = STAGE_LABELS[stageKey] || stageKey;
    let nodeColor = '#d1d5db';
    let nodeBg    = 'transparent';
    let glowStyle = {};

    if (isRejected && stageKey === 'rejected') { nodeColor = '#ef4444'; nodeBg = '#ef4444'; }
    else if (isCompleted) { nodeColor = '#3B6D11'; nodeBg = '#3B6D11'; }
    else if (isCurrent)   {
        nodeColor = '#3B6D11'; nodeBg = '#3B6D11';
        glowStyle = { boxShadow: '0 0 0 4px rgba(59,109,17,0.2), 0 0 16px rgba(59,109,17,0.3)' };
    }

    return (
        <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 24 }}>
                <div style={{
                    width: 24, height: 24, borderRadius: '50%',
                    border: `2px solid ${nodeColor}`, background: nodeBg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, zIndex: 2, transition: 'all 0.3s', ...glowStyle,
                }}>
                    {isCompleted && !isCurrent && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12" />
                        </svg>
                    )}
                    {isCurrent && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff', animation: 'pulse 2s ease-in-out infinite' }} />}
                    {isRejected && stageKey === 'rejected' && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    )}
                </div>
                {!isLast && (
                    <div style={{
                        flex: 1, width: 2, minHeight: 40,
                        background: isCompleted ? '#3B6D11' : 'transparent',
                        borderLeft: isCompleted ? 'none' : '2px dashed #d1d5db',
                        marginTop: 4,
                    }} />
                )}
            </div>

            <div style={{ flex: 1, paddingBottom: isLast ? 0 : 24 }}>
                {isCurrent && (
                    <span style={{
                        display: 'inline-block', fontSize: 9, fontWeight: 700,
                        color: '#3B6D11', letterSpacing: '0.5px', textTransform: 'uppercase',
                        marginBottom: 4, background: 'rgba(59,109,17,0.1)', padding: '2px 8px', borderRadius: 4,
                    }}>Current Stage</span>
                )}
                <div style={{ fontSize: 14, fontWeight: isCurrent ? 600 : 500, color: isFuture ? '#9ca3af' : '#374151', marginBottom: 4 }}>
                    {label}
                </div>
                {stageData?.changedAt && <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>{formatDate(stageData.changedAt)}</div>}
                {stageData?.notes     && <div style={{ fontSize: 12, fontStyle: 'italic', color: '#6b7280', marginBottom: 6 }}>{stageData.notes}</div>}
                {stageData?.changedByUser && <UserChip user={stageData.changedByUser} />}
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────
    LOADING SKELETON
    ───────────────────────────────────────────── */
function LoadingSkeleton() {
    return (
        <div style={{ animation: 'shimmer 1.5s infinite' }}>
            <div style={{ background: '#fff', border: '1px solid rgba(59,109,17,0.15)', borderRadius: 16, padding: 24, marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div style={{ width: 80,  height: 20, background: '#f3f4f6', borderRadius: 10 }} />
                    <div style={{ width: 100, height: 24, background: '#f3f4f6', borderRadius: 12 }} />
                </div>
                <div style={{ width: 120,  height: 12, background: '#f3f4f6', borderRadius: 4, marginBottom: 12 }} />
                <div style={{ width: '100%', height: 24, background: '#f3f4f6', borderRadius: 6, marginBottom: 8 }} />
                <div style={{ width: '60%', height: 24, background: '#f3f4f6', borderRadius: 6, marginBottom: 16 }} />
                <div style={{ width: '100%', height: 6,  background: '#f3f4f6', borderRadius: 3, marginBottom: 24 }} />
                <div style={{ display: 'flex', gap: 12 }}>
                    {[1,2,3].map(i => <div key={i} style={{ flex: 1, height: 42, background: '#f3f4f6', borderRadius: 8 }} />)}
                </div>
            </div>
            <div style={{ background: '#fff', border: '1px solid rgba(59,109,17,0.15)', borderRadius: 16, padding: 24 }}>
                <div style={{ width: 120, height: 16, background: '#f3f4f6', borderRadius: 4, marginBottom: 24 }} />
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    {[1,2,3,4,5].map(i => (
                        <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 24, height: 24, background: '#f3f4f6', borderRadius: '50%' }} />
                            <div style={{ width: 60, height: 12, background: '#f3f4f6', borderRadius: 4 }} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────
    PAGE — fetches data and wires everything
    ───────────────────────────────────────────── */
export default function BillStagesPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const token = useAuthStore(s => s.token);

    // Fetch bill
    const { data: billData, isLoading: billLoading, error: billError } = useQuery({
        queryKey: ['bill', id],
        queryFn: () => getBill(id),
    });

    // Fetch stage history
    const { data: stagesData, isLoading: stagesLoading } = useQuery({
        queryKey: ['bill-stages', id],
        queryFn: () => getBillStages(id),
    });

    // Fetch vote results
    const { data: votesData } = useQuery({
        queryKey: ['bill-votes', id],
        queryFn: () => getResults(id),
        refetchInterval: 30_000, // refresh every 30s
    });

    // Cast vote mutation
    const { mutate: castVoteMutation, isPending: isVoting } = useMutation({
        mutationFn: (voteType) => castVote(id, { vote: voteType }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['bill-votes', id] });
        },
    });

    const isLoading = billLoading || stagesLoading;

    // Unwrap API responses — axios wraps in .data
    const bill   = billData?.data?.data?.bill   ?? billData?.data?.bill   ?? null;
    const stages = stagesData?.data?.data?.stages ?? stagesData?.data?.stages ?? [];
    const voteResults = votesData?.data?.data ?? votesData?.data ?? null;

    // Build votes object for VoteBar
    const votes = voteResults ? {
        yes:     parseInt(voteResults.tally?.yes     ?? 0),
        no:      parseInt(voteResults.tally?.no      ?? 0),
        abstain: parseInt(voteResults.tally?.abstain ?? 0),
        total:   parseInt(voteResults.total          ?? 0),
    } : null;

    if (isLoading) return <LoadingSkeleton />;

    if (billError || !bill) {
        return (
            <div style={{ textAlign: 'center', padding: '80px 20px' }}>
                <p style={{ color: '#b91c1c', marginBottom: 16 }}>Bill not found or failed to load.</p>
                <button onClick={() => navigate('/bills')} style={{
                    padding: '10px 20px', borderRadius: 8,
                    background: '#3B6D11', color: '#fff',
                    border: 'none', cursor: 'pointer', fontSize: 14,
                }}>← Back to Bills</button>
            </div>
        );
    }

    // Build stage data map
    const stageDataMap = {};
    stages.forEach(s => { stageDataMap[s.stage] = s; });

    const currentStageIndex = getStageIndex(bill.status);
    const isRejected = bill.status === 'rejected';
    const stagesToShow = isRejected
        ? [...STAGE_ORDER.slice(0, currentStageIndex + 1), 'rejected']
        : STAGE_ORDER;

    return (
        <div>
            {/* Keyframe animations */}
            <style>{`
                @keyframes pulse   { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:0.6; transform:scale(0.9); } }
                @keyframes shimmer { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
                @keyframes fadeIn  { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
                @media (min-width:768px) { .desktop-timeline { display:flex !important; } .mobile-timeline { display:none !important; } }
            `}</style>

            {/* Back breadcrumb */}
            <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Link to="/bills" style={{ fontSize: 13, color: '#8a9e7a', textDecoration: 'none' }}>Bills</Link>
                <span style={{ color: '#d1d5db' }}>›</span>
                <Link to={`/bills/${id}`} style={{ fontSize: 13, color: '#8a9e7a', textDecoration: 'none' }}>
                    {bill.billNumber || 'Bill'}
                </Link>
                <span style={{ color: '#d1d5db' }}>›</span>
                <span style={{ fontSize: 13, color: '#3B6D11', fontWeight: 500 }}>Stages</span>
            </div>

            {/* BILL SUMMARY CARD */}
            <div style={{
                background: '#fff', border: '1px solid rgba(59,109,17,0.15)',
                borderRadius: 16, padding: 24, marginBottom: 24,
                animation: 'fadeIn 0.5s ease-out',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                    <CategoryTag category={bill.category} />
                    <StatusBadge status={bill.status} />
                </div>

                {bill.billNumber && (
                    <p style={{ fontSize: 12, color: '#9ca3af', margin: '0 0 8px', letterSpacing: '0.3px' }}>
                        {bill.billNumber}
                    </p>
                )}

                <h2 style={{
                    fontFamily: "'DM Serif Display', serif",
                    fontSize: 22, fontWeight: 400, color: '#1a2e0e',
                    margin: '0 0 8px', lineHeight: 1.35, letterSpacing: '-0.3px',
                }}>
                    {bill.title}
                </h2>

                {bill.sponsor && (
                    <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 16px' }}>
                        Sponsored by <span style={{ color: '#374151', fontWeight: 500 }}>{bill.sponsor}</span>
                    </p>
                )}

                {bill.summary && (
                    <p style={{ fontSize: 14, color: '#4b5563', lineHeight: 1.65, margin: '0 0 20px' }}>
                        {bill.summary}
                    </p>
                )}

                {votes && (
                    <div style={{ marginBottom: 20 }}>
                        <VoteBar {...votes} />
                    </div>
                )}

                {token ? (
                    <VoteButtons
                        onVote={castVoteMutation}
                        disabled={isVoting}
                    />
                ) : (
                    <p style={{ fontSize: 13, color: '#8a9e7a', textAlign: 'center', margin: 0 }}>
                        <Link to="/login" style={{ color: '#3B6D11', fontWeight: 500 }}>Sign in</Link> to cast your vote
                    </p>
                )}
            </div>

            {/* STAGE TIMELINE CARD */}
            <div style={{
                background: '#fff', border: '1px solid rgba(59,109,17,0.15)',
                borderRadius: 16, padding: 24,
                animation: 'fadeIn 0.5s ease-out 0.1s both',
            }}>
                <h3 style={{
                    fontFamily: "'DM Serif Display', serif",
                    fontSize: 16, fontWeight: 400, color: '#1a2e0e',
                    margin: '0 0 24px', letterSpacing: '-0.2px',
                }}>
                    Bill Progress
                </h3>

                {/* Desktop — horizontal */}
                <div className="desktop-timeline" style={{ display: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', position: 'relative' }}>
                        {stagesToShow.map((stageKey, idx) => {
                            const stageIdx   = getStageIndex(stageKey);
                            const isCompleted = stageKey !== 'rejected' && stageIdx < currentStageIndex;
                            const isCurrent   = stageKey === bill.status;
                            const isFuture    = stageKey !== 'rejected' && stageIdx > currentStageIndex;
                            const isLast      = idx === stagesToShow.length - 1;
                            return (
                                <div key={stageKey} style={{ display: 'flex', flex: isLast ? '0 0 auto' : 1 }}>
                                    <StageNode
                                        stageKey={stageKey}
                                        stageData={stageDataMap[stageKey]}
                                        isCompleted={isCompleted}
                                        isCurrent={isCurrent}
                                        isRejected={isRejected}
                                        isFuture={isFuture}
                                        isLast={isLast}
                                    />
                                    {!isLast && <StageConnector isCompleted={isCompleted || isCurrent} />}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Mobile — vertical */}
                <div className="mobile-timeline">
                    {stagesToShow.map((stageKey, idx) => {
                        const stageIdx   = getStageIndex(stageKey);
                        const isCompleted = stageKey !== 'rejected' && stageIdx < currentStageIndex;
                        const isCurrent   = stageKey === bill.status;
                        const isFuture    = stageKey !== 'rejected' && stageIdx > currentStageIndex;
                        const isLast      = idx === stagesToShow.length - 1;
                        return (
                            <MobileStageNode
                                key={stageKey}
                                stageKey={stageKey}
                                stageData={stageDataMap[stageKey]}
                                isCompleted={isCompleted}
                                isCurrent={isCurrent}
                                isRejected={isRejected}
                                isFuture={isFuture}
                                isLast={isLast}
                            />
                        );
                    })}
                </div>
            </div>
        </div>
    );
}