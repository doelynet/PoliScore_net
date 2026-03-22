import { useState} from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { login } from '../../api/auth.api';
import { useAuthStore } from '../../store/authStore';

    
    export default function Login() {
    const navigate = useNavigate();
    const setAuth  = useAuthStore(s => s.login);
    
    const [form, setForm] = useState({ email: '', password: '' });
    

    
    const { mutate, isPending, error } = useMutation({
        mutationFn: login,
        onSuccess: (res) => {
            const{user,token}=res.data.data;
            setAuth(user, token);

            navigate(user.role === 'admin' ? '/admin' : '/', { replace: true });
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
        }}>Sign in</p>

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

        <div>
            <label style={{
            display: 'block', fontSize: 10.5, fontWeight: 500,
            color: '#8a9e7a', textTransform: 'uppercase',
            letterSpacing: '0.8px', marginBottom: 5
            }}>Email</label>
            <input
            type="email" required
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
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

        <div>
            <label style={{
            display: 'block', fontSize: 10.5, fontWeight: 500,
            color: '#8a9e7a', textTransform: 'uppercase',
            letterSpacing: '0.8px', marginBottom: 5
            }}>Password</label>
            <input
            type="password" required
            value={form.password}
            onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            placeholder="••••••••"
            style={{
                width: '100%', boxSizing: 'border-box',
                background: '#f7f5f0',
                border: '0.5px solid rgba(59,109,17,0.2)',
                borderRadius: 9, padding: '9px 12px',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13, color: '#1a2e0e', outline: 'none'
            }}
            />
            <Link to="/reset-password" style={{
            display: 'block', textAlign: 'right',
            fontSize: 11, color: '#8a9e7a',
            textDecoration: 'none', marginTop: 4
            }}>Forgot password?</Link>
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
            {isPending ? 'Signing in…' : 'Sign in'}
        </button>

        </form>

        <hr style={{ border: 'none', borderTop: '0.5px solid rgba(59,109,17,0.1)', margin: '1.25rem 0' }} />

        <p style={{ fontSize: 12, color: '#8a9e7a', textAlign: 'center', margin: 0 }}>
        No account?{' '}
        <Link to="/register" style={{ color: '#3B6D11', fontWeight: 500, textDecoration: 'none' }}>
            Create one
        </Link>
        </p>
        </>
    );
}