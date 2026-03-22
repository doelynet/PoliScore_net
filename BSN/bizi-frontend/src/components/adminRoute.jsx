import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

// Redirects to /login if not authenticated, to / if not admin
export default function AdminRoute() {
    const user  = useAuthStore(s => s.user);
    const token = useAuthStore(s => s.token);
    
    if (!token)                    return <Navigate to="/login" replace />;
    if (user?.role !== 'admin')    return <Navigate to="/"      replace />;
    return <Outlet />;
    }
    