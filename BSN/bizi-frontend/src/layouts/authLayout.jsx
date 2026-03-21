import { Outlet, Navigate } from 'react-router-dom';
import { useAuthStore }     from '../store/authStore';
import ThemeToggle          from '../components/themeToggle';

export default function AuthLayout() {
    const token = useAuthStore(s => s.token);
    if (token) return <Navigate to="/" replace />;
    
    return (
        <div style={{
        minHeight:       '100vh',
        display:         'flex',
        backgroundColor: 'var(--bg-page)',
        position:        'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        overflow:        'hidden',
        fontFamily:      "'DM Sans', sans-serif",
        transition:      'background-color 0.2s ease',
        }}>
    
        {/* Decorative circles */}
        <div style={{
            position: 'absolute', borderRadius: '50%',
            width: 400, height: 400, bottom: -100, left: '30%',
            border: '0.5px solid var(--circle-border)',
            pointerEvents: 'none',
        }} />
        <div style={{
            position: 'absolute', borderRadius: '50%',
            width: 260, height: 260, bottom: -60, left: '34%',
            border: '0.5px solid var(--border-subtle)',
            pointerEvents: 'none',
        }} />
    
        {/* Theme toggle — top-right corner */}
        <div style={{ position: 'absolute', top: '1rem', right: '1rem', zIndex: 10 }}>
            <ThemeToggle variant="pill" />
        </div>
    
        {/* LEFT — branding */}
        <div style={{
            flex:           1,
            display:        'flex',
            flexDirection:  'column',
            justifyContent: 'space-between',
            padding:        '3rem 3.5rem',
            alignItems:     'flex-start',
        }}>
            <div>
            <h1 style={{
                fontFamily:    "'DM Serif Display', serif",
                fontSize:      44,
                color:         'var(--text-primary)',
                letterSpacing: -1,
                margin:        0,
                lineHeight:    1,
            }}>Bizi</h1>
            <p style={{
                fontSize:   14,
                color:      'var(--text-secondary)',
                fontStyle:  'italic',
                fontWeight: 300,
                margin:     '8px 0 0',
                letterSpacing: 0.2,
            }}>Bunge Mfukoni</p>
            </div>
            <p style={{
            fontSize:  12,
            color:     'var(--text-muted)',
            maxWidth:  220,
            lineHeight: 1.8,
            fontWeight: 300,
            }}>
            Your pocket parliament — track bills, votes, and representatives with clarity.
            </p>
        </div>
    
        {/* RIGHT — card */}
        <div style={{
            width:      380,
            flexShrink: 0,
            display:    'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding:    '2rem 2rem 2rem 0',
        }}>
            <div style={{
            width:        '100%',
            background:   'var(--bg-card)',
            borderRadius: 20,
            border:       '0.5px solid var(--border-subtle)',
            padding:      '2.25rem 2rem',
            boxShadow:    'var(--shadow-card)',
            transition:   'background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
            }}>
            <Outlet />
            </div>
        </div>
    
        </div>
    );
}