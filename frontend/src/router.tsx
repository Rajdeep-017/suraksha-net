import { Navigate, Outlet } from 'react-router-dom';
import { useAuth, type UserRole } from './context/AuthContext';

// ── Lazy imports ─────────────────────────────────────────────
import { lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';

const Layout = lazy(() => import('./components/layout/Layout'));
const AuthPage = lazy(() => import('./components/auth/AuthPage'));
const AdminDashboard = lazy(() => import('./components/admin/AdminDashboard'));
const AnalyticsPage = lazy(() => import('./components/analytics/AnalyticsPage'));
const ModelMonitoring = lazy(() => import('./components/model-monitoring/ModelMonitoring'));
const IncidentReports = lazy(() => import('./components/incidents/IncidentReports'));

// Driver page is the existing App component
import DriverApp from './App';

// ── Loading fallback ─────────────────────────────────────────
function LoadingScreen() {
    return (
        <div className="flex items-center justify-center h-screen w-screen bg-[#080c16]">
            <div className="flex flex-col items-center gap-3">
                <Loader2 className="animate-spin text-emerald-400" size={32} />
                <p className="text-sm text-slate-500 font-medium">Loading...</p>
            </div>
        </div>
    );
}

function SuspenseWrap({ children }: { children: React.ReactNode }) {
    return <Suspense fallback={<LoadingScreen />}>{children}</Suspense>;
}

// ── Protected Route ──────────────────────────────────────────
function ProtectedRoute({ allowedRoles }: { allowedRoles?: UserRole[] }) {
    const { user } = useAuth();
    if (!user) return <Navigate to="/login" replace />;
    if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/driver" replace />;
    return <Outlet />;
}

// ── 404 ──────────────────────────────────────────────────────
function NotFound() {
    return (
        <div className="flex items-center justify-center h-screen w-screen bg-[#080c16]">
            <div className="text-center">
                <h1 className="text-6xl font-black text-white mb-2">404</h1>
                <p className="text-slate-500 mb-4">Page not found</p>
                <a href="/driver" className="text-emerald-400 hover:text-emerald-300 text-sm font-semibold">Go to Dashboard</a>
            </div>
        </div>
    );
}

// ── Route Config ─────────────────────────────────────────────
import { createBrowserRouter } from 'react-router-dom';

export const router = createBrowserRouter([
    // Public routes
    {
        path: '/login',
        element: <SuspenseWrap><AuthPage /></SuspenseWrap>,
    },
    {
        path: '/register',
        element: <SuspenseWrap><AuthPage /></SuspenseWrap>,
    },

    // Protected routes inside Layout shell
    {
        element: <SuspenseWrap><ProtectedRoute /></SuspenseWrap>,
        children: [
            {
                element: <SuspenseWrap><Layout /></SuspenseWrap>,
                children: [
                    // Driver view — all roles
                    {
                        path: '/driver',
                        element: <DriverApp />,
                    },

                    // Admin only
                    {
                        element: <ProtectedRoute allowedRoles={['Admin']} />,
                        children: [
                            { path: '/admin', element: <SuspenseWrap><AdminDashboard /></SuspenseWrap> },
                        ],
                    },

                    // Admin + Analyst
                    {
                        element: <ProtectedRoute allowedRoles={['Admin', 'Analyst']} />,
                        children: [
                            { path: '/analytics', element: <SuspenseWrap><AnalyticsPage /></SuspenseWrap> },
                            { path: '/model-monitoring', element: <SuspenseWrap><ModelMonitoring /></SuspenseWrap> },
                        ],
                    },

                    // All roles
                    {
                        path: '/incidents',
                        element: <SuspenseWrap><IncidentReports /></SuspenseWrap>,
                    },
                ],
            },
        ],
    },

    // Redirects
    { path: '/', element: <Navigate to="/login" replace /> },
    { path: '*', element: <NotFound /> },
]);
