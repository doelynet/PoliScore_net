import { useAuthStore } from '../../store/authStore';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

/* ─────────────────────────────────────────────
    DATA
    ───────────────────────────────────────────── */

const STATS = [
    { value: '350+', label: 'MPs & Senators tracked' },
    { value: '2',    label: 'Chambers monitored' },
    { value: '47',   label: 'Counties represented' },
    { value: '100%', label: 'Free to participate' },
];

const FEATURES = [
    { icon: '', title: 'Real-time Bill Tracking',    body: 'Follow a bill from First Reading → Committee Stage → Third Reading → Presidential Assent. Never miss a stage change.' },
    { icon: '', title: 'Vote Yes / No / Abstain',    body: 'Cast structured votes on any bill. Results are aggregated by industry and business type — your sectors voice, quantified.' },
    { icon: '', title: 'Policy Discussion Forums',   body: 'Go beyond hashtags. Moderated threads keep debate constructive. Attach bills, tag clauses, propose amendments.' },
    { icon: '', title: 'Business Networking',        body: 'Connect with entrepreneurs in your industry. Private messaging, connection requests, and coalition-building tools.' },
    { icon: '', title: 'Sentiment Reports',          body: 'Aggregated vote breakdowns by sector, enterprise size, and county — shareable PDFs for parliamentary committees.' },
    { icon: '', title: 'Smart Notifications',        body: 'Subscribe to any bill. Get alerted the moment a stage changes, a vote closes, or an MP speaks on legislation you follow.' },
];

const BILLS = [
    {
        id: 'finance-2024',
        number: 'National Assembly Bill No. 14 of 2024',
        title: 'Finance Bill 2024',
        status: 'rejected', statusLabel: 'Rejected',
        excerpt: 'Proposed eco-levy, digital content tax & motor vehicle duty — triggered nationwide protests.',
        votes: { yes: 12, no: 78, abstain: 10 },
        category: 'Taxation',
    },
    {
        id: 'tax-laws',
        number: 'National Assembly Bill No. 2 of 2024',
        title: 'Tax Laws (Amendment) Bill 2024',
        status: 'enacted', statusLabel: 'Enacted',
        excerpt: 'Amendments to income tax, VAT and excise duty affecting SMEs and digital businesses.',
        votes: { yes: 54, no: 33, abstain: 13 },
        category: 'Taxation',
    },
    {
        id: 'business-reg',
        number: 'National Assembly Bill No. 8 of 2025',
        title: 'Business Registration (Amendment) Bill',
        status: 'committee_stage', statusLabel: 'Committee Stage',
        excerpt: 'Streamlining SME registration, reducing compliance burden and digitising the process.',
        votes: { yes: 67, no: 18, abstain: 15 },
        category: 'Trade',
    },
];

const STAGES = [
    'First Reading', 'Second Reading', 'Committee Stage',
    'Third Reading', 'Presidential Assent',
];

const STATUS_STYLES = {
    rejected:            { bg: '#fef2f2', color: '#b91c1c', dot: '#ef4444' },
    enacted:             { bg: '#f0fdf4', color: '#166534', dot: '#22c55e' },
    committee_stage:     { bg: '#fffbeb', color: '#92400e', dot: '#f59e0b' },
    first_reading:       { bg: '#eff6ff', color: '#1e40af', dot: '#3b82f6' },
    third_reading:       { bg: '#faf5ff', color: '#6b21a8', dot: '#a855f7' },
    presidential_assent: { bg: '#f0fdf4', color: '#166534', dot: '#22c55e' },
};

/* ─────────────────────────────────────────────
    TINY COMPONENTS
    ───────────────────────────────────────────── */

function StatusBadge({ status, label }) {
    const s = STATUS_STYLES[status] || STATUS_STYLES.first_reading;
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: s.bg, color: s.color,
            fontSize: 11, fontWeight: 600, letterSpacing: '0.4px',
            padding: '3px 10px', borderRadius: 20,
        }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot, flexShrink: 0 }} />
            {label}
        </span>
    );
}

function VoteBar({ yes, no, abstain }) {
    const total = yes + no + abstain || 1;
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', height: 6, borderRadius: 4, overflow: 'hidden', gap: 1 }}>
                <div style={{ flex: yes / total,     background: '#22c55e', minWidth: yes     ? 2 : 0 }} />
                <div style={{ flex: no / total,      background: '#ef4444', minWidth: no      ? 2 : 0 }} />
                <div style={{ flex: abstain / total, background: '#d1d5db', minWidth: abstain ? 2 : 0 }} />
            </div>
            <div style={{ display: 'flex', gap: 12, fontSize: 10.5, color: '#6b7280' }}>
                <span style={{ color: '#16a34a' }}>✓ {yes}% yes</span>
                <span style={{ color: '#dc2626' }}>✗ {no}% no</span>
                <span>{abstain}% abstain</span>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────
    HOOK — intersection observer for fade-in
    ───────────────────────────────────────────── */
function useReveal() {
    const ref = useRef(null);
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const obs = new IntersectionObserver(([e]) => {
            if (e.isIntersecting) { setVisible(true); obs.disconnect(); }
        }, { threshold: 0.12 });
        obs.observe(el);
        return () => obs.disconnect();
    }, []);
    return [ref, visible];
}

/* ─────────────────────────────────────────────
    SECTION WRAPPER
    ───────────────────────────────────────────── */
function Reveal({ children, delay = 0, style = {} }) {
    const [ref, visible] = useReveal();
    return (
        <div ref={ref} style={{
            opacity:   visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(28px)',
            transition: `opacity 0.65s ease ${delay}s, transform 0.65s ease ${delay}s`,
            ...style,
        }}>
            {children}
        </div>
    );
}

/* ─────────────────────────────────────────────
    SHARED BOLT LOGO
    ───────────────────────────────────────────── */
function BoltLogo({ size = 28 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 48 46" fill="none">
            <path
                fill="#3B6D11"
                d="M25.946 44.938c-.664.845-2.021.375-2.021-.698V33.937a2.26 2.26 0 0 0-2.262-2.262H10.287c-.92 0-1.456-1.04-.92-1.788l7.48-10.471c1.07-1.497 0-3.578-1.842-3.578H1.237c-.92 0-1.456-1.04-.92-1.788L10.013.474c.214-.297.556-.474.92-.474h28.894c.92 0 1.456 1.04.92 1.788l-7.48 10.471c-1.07 1.498 0 3.579 1.842 3.579h11.377c.943 0 1.473 1.088.89 1.83L25.947 44.94z"
            />
        </svg>
    );
}

const navLinkStyle = {
    fontSize: 13, color: '#5a6e4a', textDecoration: 'none',
    fontWeight: 500, transition: 'color 0.15s',
};

/* ─────────────────────────────────────────────
    NAVBAR  — receives token + user as props
    ───────────────────────────────────────────── */
function Navbar({ token, user }) {
    const [scrolled, setScrolled] = useState(false);
    useEffect(() => {
        const fn = () => setScrolled(window.scrollY > 40);
        window.addEventListener('scroll', fn, { passive: true });
        return () => window.removeEventListener('scroll', fn);
    }, []);

    return (
        <nav style={{
            position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 clamp(1.5rem, 5vw, 4rem)',
            height: 60,
            background:    scrolled ? 'rgba(240,237,230,0.92)' : 'transparent',
            backdropFilter: scrolled ? 'blur(12px)' : 'none',
            borderBottom:  scrolled ? '0.5px solid rgba(59,109,17,0.12)' : 'none',
            transition: 'background 0.3s, backdrop-filter 0.3s, border-color 0.3s',
        }}>
            {/* Logo — always links back to landing */}
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
                <BoltLogo size={24} />
                <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: '#1a2e0e', letterSpacing: -0.5 }}>
                    Bizi
                </span>
                <span style={{
                    fontSize: 10, fontWeight: 600, color: '#3B6D11',
                    background: 'rgba(59,109,17,0.1)',
                    padding: '2px 7px', borderRadius: 10, letterSpacing: '0.5px',
                    textTransform: 'uppercase',
                }}>Bills</span>
            </Link>

            {/* Links */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
                <a href="#features"  style={navLinkStyle}>Features</a>
                <a href="#bills"     style={navLinkStyle}>Bills</a>
                <a href="#how"       style={navLinkStyle}>How it works</a>

                {token ? (
                    <>
                        <Link to="/bills" style={navLinkStyle}>Dashboard</Link>
                        <Link to={`/profile/${user?.username}`} style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
                            <div style={{
                                width: 30, height: 30, borderRadius: '50%',
                                background: 'rgba(59,109,17,0.12)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 13, fontWeight: 600, color: '#3B6D11',
                            }}>
                                {user?.fullName?.[0]?.toUpperCase() ?? '?'}
                            </div>
                            <span style={{ ...navLinkStyle, margin: 0 }}>{user?.fullName}</span>
                        </Link>
                    </>
                ) : (
                    <>
                        <Link to="/login" style={navLinkStyle}>Log in</Link>
                        <Link
                            to="/register"
                            style={{
                                background: '#3B6D11', color: '#fff',
                                padding: '7px 18px', borderRadius: 8,
                                fontSize: 13, fontWeight: 500, textDecoration: 'none',
                                letterSpacing: 0.2, transition: 'background 0.15s',
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = '#639922'}
                            onMouseLeave={e => e.currentTarget.style.background = '#3B6D11'}
                        >
                            Get started
                        </Link>
                    </>
                )}
            </div>
        </nav>
    );
}

/* ─────────────────────────────────────────────
    HERO  — receives token as prop
    ───────────────────────────────────────────── */
function Hero({ token }) {
    return (
        <section style={{
            minHeight: '100vh',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            textAlign: 'center',
            padding: '120px clamp(1.5rem, 8vw, 6rem) 80px',
            position: 'relative', overflow: 'hidden',
        }}>
            {/* Background grain */}
            <div style={{
                position: 'absolute', inset: 0, pointerEvents: 'none',
                backgroundImage: `radial-gradient(ellipse 80% 60% at 50% 0%, rgba(59,109,17,0.08) 0%, transparent 70%)`,
            }} />

            {/* Decorative rings */}
            {[320, 520, 720].map((s, i) => (
                <div key={i} style={{
                    position: 'absolute', width: s, height: s,
                    border: `0.5px solid rgba(59,109,17,${0.07 - i * 0.02})`,
                    borderRadius: '50%', top: '50%', left: '50%',
                    transform: 'translate(-50%, -50%)', pointerEvents: 'none',
                }} />
            ))}

            <div style={{ position: 'relative', maxWidth: 760 }}>
                {/* Eyebrow */}
                <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    background: 'rgba(59,109,17,0.08)',
                    border: '0.5px solid rgba(59,109,17,0.2)',
                    borderRadius: 20, padding: '5px 14px',
                    fontSize: 12, color: '#3B6D11', fontWeight: 600,
                    letterSpacing: '0.5px', textTransform: 'uppercase',
                    marginBottom: 28, animation: 'fadeUp 0.6s ease both',
                }}>
                    <BoltLogo size={14} />
                    Bunge Mfukoni
                </div>

                {/* Headline */}
                <h1 style={{
                    fontFamily: "'DM Serif Display', serif",
                    fontSize: 'clamp(42px, 7vw, 76px)',
                    color: '#1a2e0e', lineHeight: 1.08,
                    letterSpacing: -2, margin: '0 0 24px',
                    animation: 'fadeUp 0.7s ease 0.1s both',
                }}>
                    Kenya's Parliament,<br />
                    <span style={{ color: '#3B6D11' }}>in your pocket.</span>
                </h1>

                <p style={{
                    fontSize: 'clamp(15px, 2vw, 18px)',
                    color: '#5a6e4a', lineHeight: 1.75,
                    maxWidth: 520, margin: '0 auto 44px',
                    animation: 'fadeUp 0.7s ease 0.2s both',
                }}>
                    Track parliamentary bills from First Reading to Presidential Assent.
                    Vote on legislation. Connect with Kenya's business community.
                    Make your voice count.
                </p>

                {/* CTAs */}
                <div style={{
                    display: 'flex', gap: 12, justifyContent: 'center',
                    flexWrap: 'wrap', animation: 'fadeUp 0.7s ease 0.3s both',
                }}>
                    {/* Primary CTA — changes based on auth */}
                    <Link
                        to={token ? '/bills' : '/register'}
                        style={{
                            background: '#3B6D11', color: '#fff',
                            padding: '13px 28px', borderRadius: 10,
                            fontSize: 15, fontWeight: 600, textDecoration: 'none',
                            display: 'inline-flex', alignItems: 'center', gap: 8,
                            boxShadow: '0 4px 20px rgba(59,109,17,0.3)',
                            transition: 'transform 0.15s, box-shadow 0.15s, background 0.15s',
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 8px 28px rgba(59,109,17,0.35)';
                            e.currentTarget.style.background = '#639922';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.transform = '';
                            e.currentTarget.style.boxShadow = '0 4px 20px rgba(59,109,17,0.3)';
                            e.currentTarget.style.background = '#3B6D11';
                        }}
                    >
                        {token ? 'Go to Dashboard' : 'Start tracking bills'} <span>→</span>
                    </Link>

                    {/* Secondary CTA */}
                    <Link
                        to="/bills"
                        style={{
                            background: 'rgba(59,109,17,0.08)',
                            border: '0.5px solid rgba(59,109,17,0.25)',
                            color: '#3B6D11', padding: '13px 28px', borderRadius: 10,
                            fontSize: 15, fontWeight: 500, textDecoration: 'none',
                            transition: 'background 0.15s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(59,109,17,0.14)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(59,109,17,0.08)'}
                    >
                        Browse bills
                    </Link>
                </div>

                {/* Subtle note — hide if logged in */}
                {!token && (
                    <p style={{ marginTop: 20, fontSize: 12, color: '#8a9e7a', animation: 'fadeUp 0.7s ease 0.4s both' }}>
                        Free for all Kenyan citizens & businesses · No credit card required
                    </p>
                )}
            </div>
        </section>
    );
}

/* ─────────────────────────────────────────────
    STATS
    ───────────────────────────────────────────── */
function Stats() {
    return (
        <section style={{
            borderTop: '0.5px solid rgba(59,109,17,0.12)',
            borderBottom: '0.5px solid rgba(59,109,17,0.12)',
            padding: '48px clamp(1.5rem, 8vw, 6rem)',
        }}>
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: 32, maxWidth: 900, margin: '0 auto',
            }}>
                {STATS.map((s, i) => (
                    <Reveal key={i} delay={i * 0.08}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{
                                fontFamily: "'DM Serif Display', serif",
                                fontSize: 42, color: '#3B6D11', lineHeight: 1, marginBottom: 6,
                            }}>{s.value}</div>
                            <div style={{ fontSize: 13, color: '#8a9e7a', fontWeight: 500 }}>{s.label}</div>
                        </div>
                    </Reveal>
                ))}
            </div>
        </section>
    );
}

/* ─────────────────────────────────────────────
    FEATURES
    ───────────────────────────────────────────── */
function Features() {
    return (
        <section id="features" style={{ padding: '100px clamp(1.5rem, 8vw, 6rem)' }}>
            <Reveal>
                <div style={{ textAlign: 'center', marginBottom: 64 }}>
                    <span style={{
                        fontSize: 11, fontWeight: 700, color: '#3B6D11',
                        letterSpacing: '1.5px', textTransform: 'uppercase',
                        display: 'block', marginBottom: 16,
                    }}>What Bizi does</span>
                    <h2 style={{
                        fontFamily: "'DM Serif Display', serif",
                        fontSize: 'clamp(32px, 5vw, 48px)',
                        color: '#1a2e0e', letterSpacing: -1, margin: 0,
                    }}>
                        Every tool the business<br />community needs.
                    </h2>
                </div>
            </Reveal>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: 20, maxWidth: 1080, margin: '0 auto',
            }}>
                {FEATURES.map((f, i) => (
                    <Reveal key={i} delay={i * 0.07}>
                        <div style={{
                            background: '#fff',
                            border: '0.5px solid rgba(59,109,17,0.15)',
                            borderRadius: 16, padding: '28px 24px',
                            transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s',
                            cursor: 'default',
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.transform = 'translateY(-4px)';
                            e.currentTarget.style.boxShadow = '0 12px 32px rgba(59,109,17,0.1)';
                            e.currentTarget.style.borderColor = 'rgba(59,109,17,0.35)';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.transform = '';
                            e.currentTarget.style.boxShadow = '';
                            e.currentTarget.style.borderColor = 'rgba(59,109,17,0.15)';
                        }}
                        >
                            <div style={{ fontSize: 28, marginBottom: 14 }}>{f.icon}</div>
                            <h3 style={{ fontSize: 15, fontWeight: 600, color: '#1a2e0e', margin: '0 0 10px', letterSpacing: -0.2 }}>{f.title}</h3>
                            <p style={{ fontSize: 13.5, color: '#5a6e4a', lineHeight: 1.7, margin: 0 }}>{f.body}</p>
                        </div>
                    </Reveal>
                ))}
            </div>
        </section>
    );
}

/* ─────────────────────────────────────────────
    APP PREVIEW — Bill cards
    ───────────────────────────────────────────── */
function AppPreview() {
    return (
        <section id="bills" style={{
            padding: '100px clamp(1.5rem, 8vw, 6rem)',
            background: 'rgba(59,109,17,0.03)',
            borderTop: '0.5px solid rgba(59,109,17,0.1)',
            borderBottom: '0.5px solid rgba(59,109,17,0.1)',
        }}>
            <Reveal>
                <div style={{ textAlign: 'center', marginBottom: 56 }}>
                    <span style={{
                        fontSize: 11, fontWeight: 700, color: '#3B6D11',
                        letterSpacing: '1.5px', textTransform: 'uppercase',
                        display: 'block', marginBottom: 16,
                    }}>Live bills on Bizi</span>
                    <h2 style={{
                        fontFamily: "'DM Serif Display', serif",
                        fontSize: 'clamp(30px, 4.5vw, 44px)',
                        color: '#1a2e0e', letterSpacing: -1, margin: '0 0 14px',
                    }}>See it in action.</h2>
                    <p style={{ fontSize: 14, color: '#8a9e7a', maxWidth: 420, margin: '0 auto' }}>
                        Real Kenyan parliamentary bills. Real community votes.
                    </p>
                </div>
            </Reveal>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: 20, maxWidth: 1080, margin: '0 auto 40px',
            }}>
                {BILLS.map((bill, i) => (
                    <Reveal key={bill.id} delay={i * 0.1}>
                        <Link to="/bills" style={{ textDecoration: 'none' }}>
                            <div style={{
                                background: '#fff', border: '0.5px solid rgba(59,109,17,0.15)',
                                borderRadius: 16, padding: '22px 20px', height: '100%',
                                display: 'flex', flexDirection: 'column', gap: 14,
                                transition: 'transform 0.18s, box-shadow 0.18s, border-color 0.18s',
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.transform = 'translateY(-3px)';
                                e.currentTarget.style.boxShadow = '0 10px 28px rgba(59,109,17,0.1)';
                                e.currentTarget.style.borderColor = 'rgba(59,109,17,0.35)';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.transform = '';
                                e.currentTarget.style.boxShadow = '';
                                e.currentTarget.style.borderColor = 'rgba(59,109,17,0.15)';
                            }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                                    <span style={{
                                        fontSize: 10, color: '#8a9e7a', fontWeight: 500,
                                        background: 'rgba(59,109,17,0.06)',
                                        padding: '2px 8px', borderRadius: 6, flexShrink: 0,
                                    }}>{bill.category}</span>
                                    <StatusBadge status={bill.status} label={bill.statusLabel} />
                                </div>

                                <div>
                                    <div style={{ fontSize: 10, color: '#aab8a0', marginBottom: 4 }}>{bill.number}</div>
                                    <h3 style={{ fontSize: 15, fontWeight: 600, color: '#1a2e0e', margin: 0, letterSpacing: -0.2, lineHeight: 1.35 }}>{bill.title}</h3>
                                </div>

                                <p style={{ fontSize: 12.5, color: '#6a8a5a', lineHeight: 1.65, margin: 0, flex: 1 }}>{bill.excerpt}</p>

                                <VoteBar {...bill.votes} />

                                <div style={{ display: 'flex', gap: 6 }}>
                                    {['Yes', 'No', 'Abstain'].map(v => (
                                        <div key={v} style={{
                                            flex: 1, textAlign: 'center', padding: '6px 0', borderRadius: 8,
                                            fontSize: 11, fontWeight: 600,
                                            border: '0.5px solid rgba(59,109,17,0.2)',
                                            color: '#5a6e4a', cursor: 'pointer',
                                            background: 'rgba(59,109,17,0.04)', transition: 'background 0.12s',
                                        }}>{v}</div>
                                    ))}
                                </div>

                                <div style={{ fontSize: 11, color: '#3B6D11', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                                    View full bill & vote <span>→</span>
                                </div>
                            </div>
                        </Link>
                    </Reveal>
                ))}
            </div>

            <Reveal>
                <div style={{ textAlign: 'center' }}>
                    <Link to="/bills" style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                        color: '#3B6D11', fontWeight: 600, fontSize: 14, textDecoration: 'none',
                        border: '0.5px solid rgba(59,109,17,0.3)',
                        padding: '10px 22px', borderRadius: 10,
                        background: 'rgba(59,109,17,0.06)', transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(59,109,17,0.12)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(59,109,17,0.06)'}
                    >
                        See all parliamentary bills <span>→</span>
                    </Link>
                </div>
            </Reveal>
        </section>
    );
}

/* ─────────────────────────────────────────────
    HOW IT WORKS
    ───────────────────────────────────────────── */
function HowItWorks() {
    const steps = [
        { n: '01', title: 'Register your business',    body: "Create a free account. Tell us your industry, business type, and which bill categories you care about." },
        { n: '02', title: 'Follow bills that affect you', body: 'Get notified the moment a bill moves stage — from First Reading all the way to Presidential Assent or rejection.' },
        { n: '03', title: 'Vote and comment',           body: "Cast a structured Yes / No / Abstain vote. Leave a comment. Your industry's aggregated vote is sharable with MPs." },
        { n: '04', title: 'Build your network',         body: 'Connect with entrepreneurs in your sector. Form coalitions. Take your advocacy from digital to real-world impact.' },
    ];

    return (
        <section id="how" style={{ padding: '100px clamp(1.5rem, 8vw, 6rem)' }}>
            <Reveal>
                <div style={{ textAlign: 'center', marginBottom: 72 }}>
                    <span style={{
                        fontSize: 11, fontWeight: 700, color: '#3B6D11',
                        letterSpacing: '1.5px', textTransform: 'uppercase',
                        display: 'block', marginBottom: 16,
                    }}>How it works</span>
                    <h2 style={{
                        fontFamily: "'DM Serif Display', serif",
                        fontSize: 'clamp(30px, 4.5vw, 44px)',
                        color: '#1a2e0e', letterSpacing: -1, margin: 0,
                    }}>From passive citizen<br />to active participant.</h2>
                </div>
            </Reveal>

            <Reveal>
                <div style={{
                    maxWidth: 700, margin: '0 auto 72px',
                    background: '#fff', border: '0.5px solid rgba(59,109,17,0.15)',
                    borderRadius: 16, padding: '24px 28px',
                }}>
                    <div style={{ fontSize: 11, color: '#8a9e7a', fontWeight: 600, marginBottom: 16, letterSpacing: '0.8px', textTransform: 'uppercase' }}>
                        Bill lifecycle — National Assembly
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 0, overflowX: 'auto' }}>
                        {STAGES.map((stage, i) => (
                            <div key={stage} style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                                <div style={{
                                    background: i <= 1 ? '#3B6D11' : i === 2 ? '#f59e0b' : 'rgba(59,109,17,0.08)',
                                    color:      i <= 1 ? '#fff'    : i === 2 ? '#fff'    : '#8a9e7a',
                                    borderRadius: 8, padding: '6px 12px',
                                    fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap',
                                    border: `0.5px solid ${i <= 1 ? '#3B6D11' : i === 2 ? '#f59e0b' : 'rgba(59,109,17,0.15)'}`,
                                }}>{stage}</div>
                                {i < STAGES.length - 1 && (
                                    <div style={{ width: 20, height: 1, background: 'rgba(59,109,17,0.2)', flexShrink: 0 }} />
                                )}
                            </div>
                        ))}
                    </div>
                    <div style={{ marginTop: 12, fontSize: 11, color: '#aab8a0' }}>
                        Bills shown at: <span style={{ color: '#3B6D11', fontWeight: 600 }}>First Reading</span> and <span style={{ color: '#3B6D11', fontWeight: 600 }}>Second Reading</span> stages · <span style={{ color: '#f59e0b', fontWeight: 600 }}>Committee Stage</span> — active now
                    </div>
                </div>
            </Reveal>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 24, maxWidth: 960, margin: '0 auto',
            }}>
                {steps.map((s, i) => (
                    <Reveal key={i} delay={i * 0.09}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: '#3B6D11', fontFamily: 'monospace', letterSpacing: '1px' }}>{s.n}</div>
                            <h3 style={{ fontSize: 16, fontWeight: 600, color: '#1a2e0e', margin: 0, letterSpacing: -0.3 }}>{s.title}</h3>
                            <p style={{ fontSize: 13.5, color: '#5a6e4a', lineHeight: 1.7, margin: 0 }}>{s.body}</p>
                        </div>
                    </Reveal>
                ))}
            </div>
        </section>
    );
}

/* ─────────────────────────────────────────────
    CTA BANNER  — receives token as prop
    ───────────────────────────────────────────── */
function CTABanner({ token }) {
    return (
        <section style={{
            padding: '80px clamp(1.5rem, 8vw, 6rem)',
            background: '#1a2e0e', textAlign: 'center',
        }}>
            <Reveal>
                <BoltLogo size={36} />
                <h2 style={{
                    fontFamily: "'DM Serif Display', serif",
                    fontSize: 'clamp(28px, 5vw, 50px)',
                    color: '#e8f0e0', letterSpacing: -1.5, margin: '20px 0 16px',
                }}>
                    Bunge iko mfukoni.<br />
                    <span style={{ color: '#7ec84a' }}>Be heard!</span>
                </h2>
                <p style={{ fontSize: 15, color: '#6a8a5a', maxWidth: 420, margin: '0 auto 40px', lineHeight: 1.7 }}>
                    Join Kenya's business community. Track the bills that shape your economy.
                    Vote. Connect. Be heard.
                </p>

                <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                    {token ? (
                        /* Already logged in — send to dashboard */
                        <Link
                            to="/bills"
                            style={{
                                background: '#7ec84a', color: '#0f1a09',
                                padding: '13px 30px', borderRadius: 10,
                                fontSize: 15, fontWeight: 700, textDecoration: 'none',
                                transition: 'background 0.15s, transform 0.15s', display: 'inline-block',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#9ad660'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = '#7ec84a'; e.currentTarget.style.transform = ''; }}
                        >
                            Go to Dashboard →
                        </Link>
                    ) : (
                        /* Not logged in — register / sign in */
                        <>
                            <Link
                                to="/register"
                                style={{
                                    background: '#7ec84a', color: '#0f1a09',
                                    padding: '13px 30px', borderRadius: 10,
                                    fontSize: 15, fontWeight: 700, textDecoration: 'none',
                                    transition: 'background 0.15s, transform 0.15s', display: 'inline-block',
                                }}
                                onMouseEnter={e => { e.currentTarget.style.background = '#9ad660'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = '#7ec84a'; e.currentTarget.style.transform = ''; }}
                            >
                                Create free account →
                            </Link>
                            <Link
                                to="/login"
                                style={{
                                    border: '0.5px solid rgba(126,200,74,0.3)', color: '#a8c490',
                                    padding: '13px 30px', borderRadius: 10,
                                    fontSize: 15, fontWeight: 500, textDecoration: 'none',
                                    transition: 'border-color 0.15s, color 0.15s',
                                }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(126,200,74,0.6)'; e.currentTarget.style.color = '#e8f0e0'; }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(126,200,74,0.3)'; e.currentTarget.style.color = '#a8c490'; }}
                            >
                                Sign in
                            </Link>
                        </>
                    )}
                </div>
            </Reveal>
        </section>
    );
}

/* ─────────────────────────────────────────────
    FOOTER
    ───────────────────────────────────────────── */
function Footer() {
    const links = [
        { label: 'Bills',     to: '/bills' },
        { label: 'Forum',     to: '/forum' },
        { label: 'Network',   to: '/network' },
        { label: 'Login',     to: '/login' },
        { label: 'Register',  to: '/register' },
    ];

    return (
        <footer style={{
            borderTop: '0.5px solid rgba(59,109,17,0.12)',
            padding: '40px clamp(1.5rem, 8vw, 6rem)',
            display: 'flex', flexWrap: 'wrap',
            justifyContent: 'space-between', alignItems: 'center', gap: 20,
        }}>
            {/* Logo links back to landing */}
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
                <BoltLogo size={18} />
                <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 16, color: '#1a2e0e' }}>Bizi</span>
                <span style={{ fontSize: 12, color: '#8a9e7a' }}>— Bunge Mfukoni</span>
            </Link>

            <nav style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                {links.map(l => (
                    <Link key={l.to} to={l.to} style={{
                        fontSize: 13, color: '#8a9e7a', textDecoration: 'none', transition: 'color 0.15s',
                    }}
                    onMouseEnter={e => e.target.style.color = '#3B6D11'}
                    onMouseLeave={e => e.target.style.color = '#8a9e7a'}
                    >{l.label}</Link>
                ))}
            </nav>

            <span style={{ fontSize: 12, color: '#aab8a0' }}>
                © {new Date().getFullYear()} Bizi · Riara University Final Year Project
            </span>
        </footer>
    );
}

/* ─────────────────────────────────────────────
    KEYFRAMES
    ───────────────────────────────────────────── */
const STYLES = `
    @keyframes fadeUp {
        from { opacity: 0; transform: translateY(20px); }
        to   { opacity: 1; transform: translateY(0); }
    }
    body { background: #f0ede6; }
`;

/* ─────────────────────────────────────────────
    PAGE — auth read ONCE here, passed as props
    ───────────────────────────────────────────── */
export default function LandingPage() {
    const token = useAuthStore(s => s.token);
    const user  = useAuthStore(s => s.user);

    useEffect(() => {
        const tag = document.createElement('style');
        tag.textContent = STYLES;
        document.head.appendChild(tag);
        return () => tag.remove();
    }, []);

    return (
        <div style={{
            fontFamily: "'DM Sans', sans-serif",
            background: '#f0ede6',
            minHeight: '100vh',
            color: '#1a2e0e',
        }}>
            <Navbar    token={token} user={user} />
            <Hero      token={token} />
            <Stats />
            <Features />
            <AppPreview />
            <HowItWorks />
            <CTABanner token={token} />
            <Footer />
        </div>
    );
}