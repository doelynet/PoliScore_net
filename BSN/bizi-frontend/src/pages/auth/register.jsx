import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { register } from '../../api/auth.api';
import { useAuthStore } from '../../store/authStore';

const BUSINESS_TYPES = ['startup', 'smb', 'enterprise', 'freelancer', 'investor', 'enthusiast'];
const INDUSTRIES = [
    'technology', 'finance', 'healthcare', 'education',
    'retail', 'manufacturing', 'transportation', 'energy', 'entertainment',
    ];

    export default function Register() {
    const navigate = useNavigate();
    const setAuth  = useAuthStore(s => s.login);

    const [form, setForm] = useState({
        username:     '',
        email:        '',
        password:     '',
        fullName:     '',
        businessType: '',
        industry:     '',
    });

    const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

    const { mutate, isPending, error } = useMutation({
        mutationFn: register,
        onSuccess: (res) => {
        setAuth(res.data.user, res.data.token);
        navigate('/', { replace: true });
        },
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        mutate(form);
    };

    return (
    <>
        <p style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 13, fontWeight: 500,
        color: '#1a2e0e', margin: '0 0 1.5rem',
        letterSpacing: -0.2
        }}>Create account</p>

        {error && (
        <div style={{
            background: '#fef2f2', border: '0.5px solid #fca5a5',
            color: '#b91c1c', fontSize: 12,
            borderRadius: 8, padding: '10px 14px', marginBottom: 16
        }}>
            {error.message}
        </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Full name + Username row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
            <label style={{
                display: 'block', fontSize: 10.5, fontWeight: 500,
                color: '#8a9e7a', textTransform: 'uppercase',
                letterSpacing: '0.8px', marginBottom: 5
            }}>Full name</label>
            <input
                type="text" required value={form.fullName} onChange={set('fullName')}
                placeholder="John Yakubu"
                style={{
                width: '100%', boxSizing: 'border-box',
                background: '#f7f5f0',
                border: '0.5px solid rgba(59,109,17,0.2)',
                borderRadius: 9, padding: '9px 12px',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13, color: '#1a2e0e', outline: 'none'
                }}
            />
            </div>
            <div>
            <label style={{
                display: 'block', fontSize: 10.5, fontWeight: 500,
                color: '#8a9e7a', textTransform: 'uppercase',
                letterSpacing: '0.8px', marginBottom: 5
            }}>Username</label>
            <input
                type="text" required value={form.username} onChange={set('username')}
                placeholder="johnyakubu01"
                style={{
                width: '100%', boxSizing: 'border-box',
                background: '#f7f5f0',
                border: '0.5px solid rgba(59,109,17,0.2)',
                borderRadius: 9, padding: '9px 12px',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13, color: '#1a2e0e', outline: 'none'
                }}
            />
            </div>
        </div>

        {/* Email */}
        <div>
            <label style={{
            display: 'block', fontSize: 10.5, fontWeight: 500,
            color: '#8a9e7a', textTransform: 'uppercase',
            letterSpacing: '0.8px', marginBottom: 5
            }}>Email</label>
            <input
            type="email" required value={form.email} onChange={set('email')}
            placeholder="you@example.com"
            style={{
                width: '100%', boxSizing: 'border-box',
                background: '#f7f5f0',
                border: '0.5px solid rgba(59,109,17,0.2)',
                borderRadius: 9, padding: '9px 12px',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13, color: '#1a2e0e', outline: 'none'
            }}
            />
        </div>

        {/* Password */}
        <div>
            <label style={{
            display: 'block', fontSize: 10.5, fontWeight: 500,
            color: '#8a9e7a', textTransform: 'uppercase',
            letterSpacing: '0.8px', marginBottom: 5
            }}>Password</label>
            <input
            type="password" required value={form.password} onChange={set('password')}
            placeholder="Min 9 chars, upper, lower, number, symbol"
            style={{
                width: '100%', boxSizing: 'border-box',
                background: '#f7f5f0',
                border: '0.5px solid rgba(59,109,17,0.2)',
                borderRadius: 9, padding: '9px 12px',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13, color: '#1a2e0e', outline: 'none'
            }}
            />
        </div>

        {/* Business type + Industry row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
            <label style={{
                display: 'block', fontSize: 10.5, fontWeight: 500,
                color: '#8a9e7a', textTransform: 'uppercase',
                letterSpacing: '0.8px', marginBottom: 5
            }}>Business type</label>
            <select
                value={form.businessType} onChange={set('businessType')}
                style={{
                width: '100%', boxSizing: 'border-box',
                background: '#f7f5f0',
                border: '0.5px solid rgba(59,109,17,0.2)',
                borderRadius: 9, padding: '9px 12px',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13, color: '#1a2e0e', outline: 'none',
                appearance: 'none'
                }}
            >
                <option value="">Select…</option>
                {BUSINESS_TYPES.map(t => (
                <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
            </select>
            </div>
            <div>
            <label style={{
                display: 'block', fontSize: 10.5, fontWeight: 500,
                color: '#8a9e7a', textTransform: 'uppercase',
                letterSpacing: '0.8px', marginBottom: 5
            }}>Industry</label>
            <select
                value={form.industry} onChange={set('industry')}
                style={{
                width: '100%', boxSizing: 'border-box',
                background: '#f7f5f0',
                border: '0.5px solid rgba(59,109,17,0.2)',
                borderRadius: 9, padding: '9px 12px',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13, color: '#1a2e0e', outline: 'none',
                appearance: 'none'
                }}
            >
                <option value="">Select…</option>
                {INDUSTRIES.map(i => (
                <option key={i} value={i}>{i.charAt(0).toUpperCase() + i.slice(1)}</option>
                ))}
            </select>
            </div>
        </div>

        <button
            type="submit"
            disabled={isPending}
            style={{
            width: '100%', marginTop: 4, padding: '10px',
            background: isPending ? '#639922' : '#3B6D11',
            border: 'none', borderRadius: 9,
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 13, fontWeight: 500,
            color: '#fff', cursor: 'pointer', letterSpacing: 0.2
            }}
        >
            {isPending ? 'Creating account…' : 'Create account'}
        </button>

        </form>

        <hr style={{ border: 'none', borderTop: '0.5px solid rgba(59,109,17,0.1)', margin: '1.25rem 0' }} />

        <p style={{ fontSize: 12, color: '#8a9e7a', textAlign: 'center', margin: 0 }}>
        Already have an account?{' '}
        <Link to="/login" style={{ color: '#3B6D11', fontWeight: 500, textDecoration: 'none' }}>
            Sign in
        </Link>
        </p>
    </>
    );
}