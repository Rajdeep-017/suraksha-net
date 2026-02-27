import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, type UserRole } from '../../context/AuthContext';
import {
    Shield, Loader2, Mail, Lock, User, AlertCircle, Eye, EyeOff,
    Truck, LayoutGrid, BarChart3, ArrowRight
} from 'lucide-react';

/* ── Roles ────────────────────────────────────────────────────────────── */
const ROLES: { value: UserRole; label: string; desc: string; icon: React.ReactNode }[] = [
    { value: 'Driver', label: 'Driver', desc: 'Plan safe routes & report hazards', icon: <Truck size={20} /> },
    { value: 'Admin', label: 'Admin', desc: 'Dashboard & incident management', icon: <LayoutGrid size={20} /> },
    { value: 'Analyst', label: 'Analyst', desc: 'Analytics & model monitoring', icon: <BarChart3 size={20} /> },
];

/* ── Stats for left panel ─────────────────────────────────────────────── */
const STATS = [
    { value: '94.2%', label: 'ML Accuracy' },
    { value: '3', label: 'Route Alternatives' },
    { value: 'Live', label: 'Hazard Mapping' },
];

export default function AuthPage() {
    const { login, register } = useAuth();
    const navigate = useNavigate();

    const [tab, setTab] = useState<'signin' | 'register'>('signin');
    const [role, setRole] = useState<UserRole>('Driver');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPwd, setShowPwd] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const roleDesc = ROLES.find(r => r.value === role)?.desc ?? '';

    const validate = () => {
        if (tab === 'register' && !name.trim()) return 'Name is required.';
        if (!email.trim()) return 'Email is required.';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Enter a valid email.';
        if (!password.trim()) return 'Password is required.';
        if (password.length < 4) return 'Password must be at least 4 characters.';
        return '';
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        const err = validate();
        if (err) { setError(err); return; }
        setError('');
        setLoading(true);

        let ok = false;
        if (tab === 'signin') {
            ok = await login(email, password);
        } else {
            ok = await register(email, name, password, role);
        }
        setLoading(false);

        if (ok) {
            // For login, look up stored role
            if (tab === 'signin') {
                const stored = localStorage.getItem('suraksha_users');
                const users = stored ? JSON.parse(stored) : {};
                const userRole = users[email]?.role || 'Driver';
                const dest = userRole === 'Admin' ? '/admin' : userRole === 'Analyst' ? '/analytics' : '/driver';
                navigate(dest, { replace: true });
            } else {
                const dest = role === 'Admin' ? '/admin' : role === 'Analyst' ? '/analytics' : '/driver';
                navigate(dest, { replace: true });
            }
        } else {
            setError(tab === 'signin' ? 'Login failed. Please try again.' : 'Registration failed.');
        }
    };

    return (
        <div className="min-h-screen flex bg-[#070b14] relative overflow-hidden">

            {/* ── Animated background particles ── */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(30)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute rounded-full bg-cyan-400/20"
                        style={{
                            width: `${2 + Math.random() * 3}px`,
                            height: `${2 + Math.random() * 3}px`,
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animation: `float ${8 + Math.random() * 12}s ease-in-out infinite`,
                            animationDelay: `${Math.random() * 5}s`,
                        }}
                    />
                ))}
            </div>

            {/* ────────────────────── LEFT PANEL — Branding ────────────────────── */}
            <div className="hidden lg:flex w-[42%] flex-col items-center justify-center relative">
                {/* Glow effects */}
                <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-cyan-600/8 blur-[120px]" />
                <div className="absolute bottom-20 left-10 w-[300px] h-[300px] rounded-full bg-blue-600/6 blur-[80px]" />

                <div className="relative z-10 text-center px-12">
                    {/* Shield logo */}
                    <div className="mx-auto mb-8 w-24 h-24 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-cyan-500/25">
                        <Shield size={44} className="text-white" strokeWidth={2.5} />
                    </div>

                    {/* Brand name */}
                    <h1 className="text-4xl font-black text-white tracking-tight mb-2">
                        Suraksha<span className="text-cyan-400">Net</span>
                    </h1>
                    <p className="text-sm text-cyan-400/70 font-medium tracking-wide">
                        AI-Powered Road Risk Intelligence
                    </p>

                    {/* Stats row */}
                    <div className="flex items-center justify-center gap-8 mt-10">
                        {STATS.map((stat, i) => (
                            <div key={i} className="text-center">
                                <p className="text-xl font-black text-cyan-400">{stat.value}</p>
                                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mt-1">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ────────────────────── RIGHT PANEL — Auth Form ─────────────────── */}
            <div className="flex-1 flex items-center justify-center px-6 lg:px-16">
                <div className="w-full max-w-md relative z-10">

                    {/* Welcome heading */}
                    <h2 className="text-3xl font-black text-white mb-1">Welcome Back</h2>
                    <p className="text-sm text-slate-500 mb-7">Select your role to continue</p>

                    {/* ── Role selector ── */}
                    <div className="grid grid-cols-3 gap-3 mb-2">
                        {ROLES.map(r => (
                            <button
                                key={r.value}
                                type="button"
                                onClick={() => setRole(r.value)}
                                className={`group flex flex-col items-center gap-2 py-4 px-2 rounded-xl border-2 transition-all duration-200 ${role === r.value
                                    ? 'border-cyan-500 bg-cyan-500/8 text-cyan-400 shadow-lg shadow-cyan-500/10'
                                    : 'border-white/8 bg-slate-900/40 text-slate-500 hover:border-white/15 hover:text-slate-300'
                                    }`}
                            >
                                <div className={`transition-colors ${role === r.value ? 'text-cyan-400' : 'text-slate-600 group-hover:text-slate-400'}`}>
                                    {r.icon}
                                </div>
                                <span className="text-xs font-bold">{r.label}</span>
                            </button>
                        ))}
                    </div>
                    <p className="text-[11px] text-slate-600 text-center mb-6">{roleDesc}</p>

                    {/* ── Sign In / Register tabs ── */}
                    <div className="flex border-b border-white/10 mb-6">
                        {(['signin', 'register'] as const).map(t => (
                            <button
                                key={t}
                                onClick={() => { setTab(t); setError(''); }}
                                className={`flex-1 pb-3 text-sm font-semibold transition-all border-b-2 ${tab === t
                                    ? 'text-white border-cyan-500'
                                    : 'text-slate-600 border-transparent hover:text-slate-400'
                                    }`}
                            >
                                {t === 'signin' ? 'Sign In' : 'Register'}
                            </button>
                        ))}
                    </div>

                    {/* ── Form ── */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Name — register only */}
                        {tab === 'register' && (
                            <div>
                                <label className="block text-xs text-slate-500 font-semibold mb-1.5">Full Name</label>
                                <div className="relative">
                                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        className="w-full bg-slate-900/60 border border-white/8 rounded-xl pl-11 pr-4 py-3.5 text-sm text-white placeholder-slate-600 outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all"
                                        placeholder="Your full name"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Email */}
                        <div>
                            <label className="block text-xs text-slate-500 font-semibold mb-1.5">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="w-full bg-slate-900/60 border border-white/8 rounded-xl pl-11 pr-4 py-3.5 text-sm text-white placeholder-slate-600 outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all"
                                    placeholder="driver@suraksha.ai"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-xs text-slate-500 font-semibold mb-1.5">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                                <input
                                    type={showPwd ? 'text' : 'password'}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="w-full bg-slate-900/60 border border-white/8 rounded-xl pl-11 pr-12 py-3.5 text-sm text-white placeholder-slate-600 outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPwd(p => !p)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 transition-colors"
                                >
                                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                                <AlertCircle size={14} />
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 text-sm shadow-lg shadow-cyan-500/20 mt-2"
                        >
                            {loading
                                ? <Loader2 className="animate-spin" size={16} />
                                : <ArrowRight size={16} />
                            }
                            {loading
                                ? (tab === 'signin' ? 'Signing in…' : 'Creating account…')
                                : (tab === 'signin' ? 'Sign In' : 'Create Account')
                            }
                        </button>
                    </form>

                    {/* Demo credentials */}
                    <p className="text-center text-[11px] text-slate-600 mt-6">
                        Demo: <span className="text-cyan-500/70 font-mono">driver@suraksha.ai</span>
                        {' / '}
                        <span className="text-cyan-500/70 font-mono">driver123</span>
                    </p>
                </div>
            </div>

            {/* ── Float animation keyframes ── */}
            <style>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0px) translateX(0px); opacity: 0.3; }
                    25% { transform: translateY(-20px) translateX(10px); opacity: 0.6; }
                    50% { transform: translateY(-10px) translateX(-5px); opacity: 0.4; }
                    75% { transform: translateY(-25px) translateX(8px); opacity: 0.5; }
                }
            `}</style>
        </div>
    );
}
