import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { requestPasswordReset } from '../../api/auth.api';

export default function ResetPassword() {
    const [email, setEmail]   = useState('');
    const [sent,  setSent]    = useState(false);

    const { mutate, isPending, error } = useMutation({
        mutationFn: () => requestPasswordReset(email),
        onSuccess: () => setSent(true),
    });

    if (sent) {
        return (
        <div className="text-center">
            <div className="text-green-600 text-4xl mb-4">✓</div>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Check your inbox</h2>
            <p className="text-gray-500 text-sm mb-6">
            If that email exists we've sent reset instructions.
            </p>
            <Link to="/login" className="text-green-600 hover:underline text-sm">
            Back to sign in
            </Link>
        </div>
        );
    }

    return (
    <>
        <p style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 13, fontWeight: 500,
        color: '#1a2e0e', margin: '0 0 4px',
        letterSpacing: -0.2
        }}>Reset password</p>

        <p style={{
        fontSize: 12, color: '#8a9e7a',
        margin: '0 0 1.5rem', lineHeight: 1.6
        }}>
        Enter your email and we'll send you a reset link.
        </p>

        {error && (
        <div style={{
            background: '#fef2f2', border: '0.5px solid #fca5a5',
            color: '#b91c1c', fontSize: 12,
            borderRadius: 8, padding: '10px 14px', marginBottom: 16
        }}>
            {error.message}
        </div>
        )}

        <form
        onSubmit={(e) => { e.preventDefault(); mutate(); }}
        style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
        >
        <div>
            <label style={{
            display: 'block', fontSize: 10.5, fontWeight: 500,
            color: '#8a9e7a', textTransform: 'uppercase',
            letterSpacing: '0.8px', marginBottom: 5
            }}>Email</label>
            <input
            type="email" required
            value={email}
            onChange={e => setEmail(e.target.value)}
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

        <button
            type="submit"
            disabled={isPending}
            style={{
            width: '100%', padding: '10px',
            background: isPending ? '#639922' : '#3B6D11',
            border: 'none', borderRadius: 9,
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 13, fontWeight: 500,
            color: '#fff', cursor: 'pointer', letterSpacing: 0.2
            }}
        >
            {isPending ? 'Sending…' : 'Send reset link'}
        </button>
        </form>

        <hr style={{ border: 'none', borderTop: '0.5px solid rgba(59,109,17,0.1)', margin: '1.25rem 0' }} />

        <p style={{ fontSize: 12, color: '#8a9e7a', textAlign: 'center', margin: 0 }}>
        <Link to="/login" style={{ color: '#3B6D11', fontWeight: 500, textDecoration: 'none' }}>
            Back to sign in
        </Link>
        </p>
    </>
    );
    }