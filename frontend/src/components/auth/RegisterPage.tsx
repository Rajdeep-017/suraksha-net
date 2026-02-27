import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, type UserRole } from '../../context/AuthContext';
import { Navigation, UserPlus, Loader2, Mail, Lock, User, ShieldCheck, AlertCircle } from 'lucide-react';

const ROLES: { value: UserRole; label: string; desc: string }[] = [
    { value: 'Driver', label: 'Driver', desc: 'Route safety & navigation' },
    { value: 'Admin', label: 'Admin', desc: 'Dashboard & incident management' },
    { value: 'Analyst', label: 'Analyst', desc: 'Analytics & model monitoring' },
];

export default function RegisterPage() {
    const { register } = useAuth();
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<UserRole>('Driver');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const validate = () => {
        if (!name.trim()) return 'Name is required.';
        if (!email.trim()) return 'Email is required.';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Enter a valid email address.';
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
        const ok = await register(email, name, password, role);
        setLoading(false);
        if (ok) {
            const dest = role === 'Admin' ? '/admin' : role === 'Analyst' ? '/analytics' : '/driver';
            navigate(dest, { replace: true });
        } else {
            setError('Registration failed.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#080c16] relative overflow-hidden">
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-emerald-500/5 blur-3xl" />
                <div className="absolute bottom-0 right-0 w-[600px] h-[600px] rounded-full bg-purple-500/5 blur-3xl" />
            </div>

            <div className="relative z-10 w-full max-w-md px-6">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-3 mb-4">
                        <div className="bg-emerald-500 p-2.5 rounded-xl shadow-lg shadow-emerald-500/20">
                            <Navigation className="text-white" size={24} />
                        </div>
                        <div className="text-left">
                            <h1 className="text-2xl font-black text-white tracking-tight">SURAKSHA-NET</h1>
                            <p className="text-[11px] text-emerald-400 font-semibold tracking-widest uppercase">Road Safety Intelligence</p>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
                    <h2 className="text-lg font-bold text-white mb-1">Create account</h2>
                    <p className="text-sm text-slate-500 mb-6">Join the road safety network</p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Full Name</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                                <input
                                    type="text"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    className="w-full bg-slate-800 border border-white/5 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-600 outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                                    placeholder="Rajdeep Kumar"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="w-full bg-slate-800 border border-white/5 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-600 outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                                    placeholder="you@example.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="w-full bg-slate-800 border border-white/5 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-600 outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                                    placeholder="Min. 4 characters"
                                />
                            </div>
                        </div>

                        {/* Role selector */}
                        <div>
                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                                <ShieldCheck size={12} className="inline mr-1" />Role
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                {ROLES.map(r => (
                                    <button
                                        key={r.value}
                                        type="button"
                                        onClick={() => setRole(r.value)}
                                        className={`py-2.5 px-2 rounded-xl border text-xs font-bold transition-all ${role === r.value
                                                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                                                : 'bg-slate-800 border-white/5 text-slate-500 hover:text-slate-300 hover:border-white/10'
                                            }`}
                                    >
                                        <div>{r.label}</div>
                                        <div className="text-[9px] font-normal mt-0.5 opacity-70">{r.desc}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                                <AlertCircle size={14} />
                                <span>{error}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-sm mt-2"
                        >
                            {loading ? <Loader2 className="animate-spin" size={16} /> : <UserPlus size={16} />}
                            {loading ? 'Creating...' : 'Create Account'}
                        </button>
                    </form>

                    <p className="text-center text-sm text-slate-500 mt-6">
                        Already have an account?{' '}
                        <Link to="/login" className="text-emerald-400 font-semibold hover:text-emerald-300 transition-colors">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
