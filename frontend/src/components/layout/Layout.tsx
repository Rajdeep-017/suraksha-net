import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    Navigation, LogOut, LayoutDashboard, Car, BarChart3,
    Cpu, FileText, ChevronLeft, ChevronRight, User
} from 'lucide-react';
import { useState } from 'react';
import type { UserRole } from '../../context/AuthContext';
import ChatWidget from '../chat/ChatWidget';

interface NavItem {
    to: string;
    label: string;
    icon: React.ReactNode;
    roles: UserRole[];
}

const NAV_ITEMS: NavItem[] = [
    { to: '/driver', label: 'Driver View', icon: <Car size={18} />, roles: ['Driver', 'Admin'] },
    { to: '/admin', label: 'Admin Dashboard', icon: <LayoutDashboard size={18} />, roles: ['Admin'] },
    { to: '/analytics', label: 'Analytics', icon: <BarChart3 size={18} />, roles: ['Admin', 'Analyst'] },
    { to: '/model-monitoring', label: 'Model Monitor', icon: <Cpu size={18} />, roles: ['Admin', 'Analyst'] },
    { to: '/incidents', label: 'Incidents', icon: <FileText size={18} />, roles: ['Driver', 'Admin', 'Analyst'] },
];

const ROLE_COLORS: Record<UserRole, string> = {
    Driver: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    Admin: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    Analyst: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
};

export default function Layout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [collapsed, setCollapsed] = useState(false);

    const visibleItems = NAV_ITEMS.filter(item => user && item.roles.includes(user.role));

    const handleLogout = () => {
        logout();
        navigate('/login', { replace: true });
    };

    return (
        <div className="flex h-screen w-screen overflow-hidden bg-[#080c16]">

            {/* ── Sidebar ─────────────────────────────────────────────── */}
            <aside
                className={`${collapsed ? 'w-16' : 'w-56'} h-full bg-[#0b0f1a] border-r border-white/5 flex flex-col transition-all duration-200 shrink-0 z-20`}
            >
                {/* Logo */}
                <div className={`flex items-center gap-2.5 px-4 py-4 border-b border-white/5 ${collapsed ? 'justify-center' : ''}`}>
                    <div className="bg-emerald-500 p-1.5 rounded-lg shrink-0">
                        <Navigation className="text-white" size={16} />
                    </div>
                    {!collapsed && (
                        <span className="text-sm font-black text-white tracking-tight">SURAKSHA-NET</span>
                    )}
                </div>

                {/* Nav links */}
                <nav className="flex-1 py-3 space-y-1 px-2 overflow-y-auto">
                    {visibleItems.map(item => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                    : 'text-slate-500 hover:text-slate-300 hover:bg-white/3 border border-transparent'
                                } ${collapsed ? 'justify-center' : ''}`
                            }
                            title={item.label}
                        >
                            <span className="shrink-0">{item.icon}</span>
                            {!collapsed && <span>{item.label}</span>}
                        </NavLink>
                    ))}
                </nav>

                {/* Collapse toggle */}
                <button
                    onClick={() => setCollapsed(c => !c)}
                    className="flex items-center justify-center py-3 border-t border-white/5 text-slate-600 hover:text-slate-300 transition-colors"
                >
                    {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                </button>

                {/* User info */}
                <div className={`px-3 py-3 border-t border-white/5 ${collapsed ? 'flex justify-center' : ''}`}>
                    {collapsed ? (
                        <button
                            onClick={handleLogout}
                            className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                            title="Logout"
                        >
                            <LogOut size={16} />
                        </button>
                    ) : (
                        <>
                            <div className="flex items-center gap-2 mb-2">
                                <div className="bg-slate-800 p-1.5 rounded-lg">
                                    <User size={14} className="text-slate-400" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-bold text-white truncate">{user?.name}</p>
                                    <p className="text-[10px] text-slate-600 truncate">{user?.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${ROLE_COLORS[user?.role ?? 'Driver']}`}>
                                    {user?.role}
                                </span>
                                <button
                                    onClick={handleLogout}
                                    className="ml-auto text-[10px] text-slate-600 hover:text-red-400 flex items-center gap-1 transition-colors"
                                >
                                    <LogOut size={12} /> Log out
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </aside>

            {/* ── Page content ────────────────────────────────────────── */}
            <main className="flex-1 overflow-hidden">
                <Outlet />
            </main>

            {/* ── AI Chat Widget ──────────────────────────────────────── */}
            <ChatWidget />
        </div>
    );
}
