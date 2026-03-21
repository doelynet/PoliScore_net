import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { lazy, Suspense } from 'react';

import AuthLayout   from './layouts/authLayout';
import MainLayout   from './layouts/mainLayout';
import AdminLayout  from './layouts/adminLayout';
import ProtectedRoute from './components/protectedRoute';
import AdminRoute     from './components/adminRoute';

// Lazy load every page — only downloads when the user navigates to it
const Login            = lazy(() => import('./pages/auth/login'));
const Register         = lazy(() => import('./pages/auth/register'));
const ResetPassword    = lazy(() => import('./pages/auth/resetPassword'));

const BillList         = lazy(() => import('./pages/bills/billList'));
const BillDetail       = lazy(() => import('./pages/bills/billDetail'));
const BillStages       = lazy(() => import('./pages/bills/billStages'));
const VoteResults      = lazy(() => import('./pages/voting/voteResults'));
const VoteReport       = lazy(() => import('./pages/voting/voteReport'));

const ForumList        = lazy(() => import('./pages/forum/forumList'));
const ThreadDetail     = lazy(() => import('./pages/forum/threadDetail'));

const Connections      = lazy(() => import('./pages/network/connections'));
const Discover         = lazy(() => import('./pages/network/discover'));
const Profile          = lazy(() => import('./pages/network/profile'));

const Messages         = lazy(() => import('./pages/messages/messages'));
const Notifications    = lazy(() => import('./pages/notifications/notifications'));

const AdminDashboard   = lazy(() => import('./pages/admin/adminDashboard'));
const AdminBills       = lazy(() => import('./pages/admin/adminBills'));
const AdminUsers       = lazy(() => import('./pages/admin/adminUsers'));
const AdminReports     = lazy(() => import('./pages/admin/adminReports'));

// Simple spinner shown while lazy chunks load
const PageLoader = () => (
    <div className="flex items-center justify-center min-h-screen">
    <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
    </div>
);

const router = createBrowserRouter([
  // ── Public auth pages ──
    {
    element: <AuthLayout />,
    children: [
        { path: '/login',           element: <Login /> },
        { path: '/register',        element: <Register /> },
        { path: '/reset-password',  element: <ResetPassword /> },
    ],
    },

  // ── Protected app pages ──
    {
    element: <ProtectedRoute />,
    children: [{
        element: <MainLayout />,
        children: [
        { path: '/',                          element: <BillList /> },
        { path: '/bills',                     element: <BillList /> },
        { path: '/bills/:id',                 element: <BillDetail /> },
        { path: '/bills/:id/stages',          element: <BillStages /> },
        { path: '/bills/:id/vote/results',    element: <VoteResults /> },
        { path: '/bills/:id/vote/report',     element: <VoteReport /> },
        { path: '/forum',                     element: <ForumList /> },
        { path: '/forum/:id',                 element: <ThreadDetail /> },
        { path: '/network',                   element: <Connections /> },
        { path: '/network/discover',          element: <Discover /> },
        { path: '/profile/:username',         element: <Profile /> },
        { path: '/messages',                  element: <Messages /> },
        { path: '/messages/:conversationId',  element: <Messages /> },
        { path: '/notifications',             element: <Notifications /> },
        ],
    }],
    },

  // ── Admin pages ──
    {
    element: <AdminRoute />,
    children: [{
        element: <AdminLayout />,
        children: [
        { path: '/admin',           element: <AdminDashboard /> },
        { path: '/admin/bills',     element: <AdminBills /> },
        { path: '/admin/users',     element: <AdminUsers /> },
        { path: '/admin/reports',   element: <AdminReports /> },
        ],
    }],
    },
]);

export default function AppRouter() {
    return (
    <Suspense fallback={<PageLoader />}>
        <RouterProvider router={router} />
    </Suspense>
    );
}