import { useState, useEffect, useMemo } from 'react';
import {
    AlertTriangle, Users, Gauge, MapPin, Bell,
    Activity, Database, Cpu, RefreshCw, Download, Send,
    Loader2, CheckCircle, ChevronLeft, ChevronRight, Filter, X,
    TrendingUp, TrendingDown
} from 'lucide-react';
import {
    ACCIDENT_DATA, TOTAL_ACCIDENTS, TOTAL_FATALITIES,
    AVG_RISK_SCORE, HIGHEST_RISK_ZONE,
    type AccidentRow,
} from '../../data/mockData';
import { apiClient } from '../../api/client';

// ── KPI Card ─────────────────────────────────────────────────
function KpiCard({ icon, label, value, delta, color }: {
    icon: React.ReactNode; label: string; value: string | number;
    delta?: string; color: string;
}) {
    const isUp = delta?.startsWith('+');
    return (
        <div className="bg-slate-900/60 border border-white/5 rounded-xl p-4 flex items-start gap-3">
            <div className={`p-2.5 rounded-xl ${color}`}>{icon}</div>
            <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</p>
                <p className="text-xl font-black text-white mt-0.5">{value}</p>
                {delta && (
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold mt-1 ${isUp ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {isUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />} {delta} vs last month
                    </span>
                )}
            </div>
        </div>
    );
}

// ── System Status ────────────────────────────────────────────
function SystemStatus() {
    const [health, setHealth] = useState<{ status: string; model_loaded: boolean } | null>(null);
    useEffect(() => {
        apiClient.get('/api/health').then(r => setHealth(r.data)).catch(() => setHealth(null));
    }, []);
    const dot = (ok: boolean | null) => (
        <span className={`inline-block w-2 h-2 rounded-full ${ok === null ? 'bg-slate-600' : ok ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
    );
    return (
        <div className="bg-slate-900/60 border border-white/5 rounded-xl p-4 space-y-3">
            <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Activity size={13} className="text-blue-400" /> System Status
            </h3>
            <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                    <span className="text-slate-500">API Server</span>
                    <span className="flex items-center gap-1.5 text-white font-bold">{dot(health !== null)} {health ? 'Online' : 'Offline'}</span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-slate-500">ML Model</span>
                    <span className="flex items-center gap-1.5 text-white font-bold">{dot(health?.model_loaded ?? null)} {health?.model_loaded ? 'Loaded' : 'Not Loaded'}</span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-slate-500">Model Accuracy</span>
                    <span className="text-emerald-400 font-bold">88.35%</span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-slate-500">Feature Count</span>
                    <span className="text-white font-bold">15</span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-slate-500">Data Freshness</span>
                    <span className="text-white font-bold">22 Feb 2026</span>
                </div>
            </div>
        </div>
    );
}

// ── Quick Actions ────────────────────────────────────────────
function QuickActions({ onExport }: { onExport: () => void }) {
    const [retraining, setRetraining] = useState(false);
    const [retrained, setRetrained] = useState(false);
    const [alertModal, setAlertModal] = useState(false);

    const handleRetrain = async () => {
        setRetraining(true);
        await new Promise(r => setTimeout(r, 2000)); // fake
        setRetraining(false);
        setRetrained(true);
        setTimeout(() => setRetrained(false), 3000);
    };

    return (
        <div className="bg-slate-900/60 border border-white/5 rounded-xl p-4 space-y-3">
            <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Cpu size={13} className="text-purple-400" /> Quick Actions
            </h3>
            <button
                onClick={handleRetrain}
                disabled={retraining}
                className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-bold py-2.5 rounded-xl transition-all"
            >
                {retraining ? <Loader2 size={14} className="animate-spin" /> : retrained ? <CheckCircle size={14} /> : <RefreshCw size={14} />}
                {retraining ? 'Retraining...' : retrained ? 'Model Retrained!' : 'Retrain Model'}
            </button>
            <button
                onClick={onExport}
                className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold py-2.5 rounded-xl border border-white/5 transition-all"
            >
                <Download size={14} /> Export CSV
            </button>
            <button
                onClick={() => setAlertModal(true)}
                className="w-full flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold py-2.5 rounded-xl transition-all"
            >
                <Send size={14} /> Broadcast Alert
            </button>

            {/* Alert modal */}
            {alertModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setAlertModal(false)}>
                    <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-96 shadow-2xl" onClick={e => e.stopPropagation()}>
                        <h4 className="text-sm font-bold text-white mb-3">Broadcast Safety Alert</h4>
                        <textarea
                            className="w-full bg-slate-800 border border-white/5 rounded-xl p-3 text-sm text-white placeholder-slate-600 outline-none focus:ring-2 focus:ring-amber-500/50 h-24 resize-none"
                            placeholder="Type alert message..."
                        />
                        <div className="flex gap-2 mt-3">
                            <button
                                onClick={() => setAlertModal(false)}
                                className="flex-1 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold py-2 rounded-xl"
                            >
                                Send Alert
                            </button>
                            <button
                                onClick={() => setAlertModal(false)}
                                className="px-4 bg-slate-800 text-slate-400 text-xs font-bold py-2 rounded-xl border border-white/5"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Incidents Table ──────────────────────────────────────────
function IncidentsTable({ data }: { data: AccidentRow[] }) {
    const PAGE_SIZE = 10;
    const [page, setPage] = useState(0);
    const [locationFilter, setLocationFilter] = useState('');
    const [timeBinFilter, setTimeBinFilter] = useState('');
    const [dayNightFilter, setDayNightFilter] = useState('');
    const [minRisk, setMinRisk] = useState(0);
    const [showFilters, setShowFilters] = useState(false);

    const filtered = useMemo(() => {
        let d = data;
        if (locationFilter) d = d.filter(r => r.location.toLowerCase().includes(locationFilter.toLowerCase()));
        if (timeBinFilter) d = d.filter(r => r.timeBin === timeBinFilter);
        if (dayNightFilter) d = d.filter(r => r.dayNight === dayNightFilter);
        if (minRisk > 0) d = d.filter(r => r.riskScore >= minRisk);
        return d.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    }, [data, locationFilter, timeBinFilter, dayNightFilter, minRisk]);

    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
    const pageData = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

    const riskColor = (score: number) =>
        score > 60 ? 'text-rose-400 bg-rose-500/10 border-rose-500/20' :
            score > 30 ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' :
                'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';

    return (
        <div className="bg-slate-900/60 border border-white/5 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
                <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    <Database size={13} className="text-emerald-400" /> Recent Incidents
                    <span className="text-[10px] text-slate-600 font-normal">({filtered.length} records)</span>
                </h3>
                <button
                    onClick={() => setShowFilters(f => !f)}
                    className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg border transition-all ${showFilters ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' : 'text-slate-500 border-white/5'}`}
                >
                    <Filter size={10} /> Filters
                </button>
            </div>

            {/* Filter bar */}
            {showFilters && (
                <div className="px-4 py-3 border-b border-white/5 bg-slate-950/50 flex flex-wrap gap-3 items-end">
                    <div>
                        <label className="text-[9px] text-slate-500 uppercase block mb-1">Location</label>
                        <input
                            value={locationFilter}
                            onChange={e => { setLocationFilter(e.target.value); setPage(0); }}
                            className="bg-slate-800 border border-white/5 rounded-lg px-2 py-1.5 text-xs text-white w-36 outline-none"
                            placeholder="Search..."
                        />
                    </div>
                    <div>
                        <label className="text-[9px] text-slate-500 uppercase block mb-1">Time Bin</label>
                        <select
                            value={timeBinFilter}
                            onChange={e => { setTimeBinFilter(e.target.value); setPage(0); }}
                            className="bg-slate-800 border border-white/5 rounded-lg px-2 py-1.5 text-xs text-white outline-none"
                        >
                            <option value="">All</option>
                            {['Morning Rush', 'Midday', 'Afternoon', 'Evening Rush', 'Night', 'Late Night'].map(t => <option key={t}>{t}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-[9px] text-slate-500 uppercase block mb-1">Day/Night</label>
                        <select
                            value={dayNightFilter}
                            onChange={e => { setDayNightFilter(e.target.value); setPage(0); }}
                            className="bg-slate-800 border border-white/5 rounded-lg px-2 py-1.5 text-xs text-white outline-none"
                        >
                            <option value="">All</option>
                            <option>Daytime</option>
                            <option>Nighttime</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-[9px] text-slate-500 uppercase block mb-1">Min Risk: {minRisk}</label>
                        <input
                            type="range" min={0} max={100} value={minRisk}
                            onChange={e => { setMinRisk(+e.target.value); setPage(0); }}
                            className="w-28 accent-emerald-500"
                        />
                    </div>
                    <button onClick={() => { setLocationFilter(''); setTimeBinFilter(''); setDayNightFilter(''); setMinRisk(0); setPage(0); }}
                        className="text-[10px] text-slate-500 hover:text-red-400 flex items-center gap-1">
                        <X size={10} /> Clear
                    </button>
                </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-xs">
                    <thead>
                        <tr className="border-b border-white/5 text-[10px] text-slate-600 uppercase tracking-wider">
                            <th className="px-4 py-2.5 text-left">Timestamp</th>
                            <th className="px-4 py-2.5 text-left">Location</th>
                            <th className="px-4 py-2.5 text-left">Weather</th>
                            <th className="px-4 py-2.5 text-left">Road</th>
                            <th className="px-4 py-2.5 text-center">Risk</th>
                            <th className="px-4 py-2.5 text-center">Fatal</th>
                            <th className="px-4 py-2.5 text-left">Day/Night</th>
                            <th className="px-4 py-2.5 text-left">Time Bin</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pageData.map(r => (
                            <tr key={r.id} className="border-b border-white/3 hover:bg-white/2 transition-colors">
                                <td className="px-4 py-2.5 text-slate-400 font-mono text-[10px]">{r.timestamp.replace('T', ' ').slice(0, 16)}</td>
                                <td className="px-4 py-2.5 text-white font-medium">{r.location}</td>
                                <td className="px-4 py-2.5 text-slate-400">{r.weather}</td>
                                <td className="px-4 py-2.5 text-slate-400">{r.roadCondition}</td>
                                <td className="px-4 py-2.5 text-center">
                                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${riskColor(r.riskScore)}`}>
                                        {r.riskScore}
                                    </span>
                                </td>
                                <td className="px-4 py-2.5 text-center font-bold text-white">{r.fatalities || '-'}</td>
                                <td className="px-4 py-2.5 text-slate-400">{r.dayNight}</td>
                                <td className="px-4 py-2.5 text-slate-400">{r.timeBin}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="px-4 py-3 border-t border-white/5 flex items-center justify-between">
                <span className="text-[10px] text-slate-600">Page {page + 1} of {totalPages || 1}</span>
                <div className="flex gap-2">
                    <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
                        className="px-3 py-1 rounded-lg text-xs text-white bg-slate-800 border border-white/5 disabled:opacity-30">
                        <ChevronLeft size={12} />
                    </button>
                    <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}
                        className="px-3 py-1 rounded-lg text-xs text-white bg-slate-800 border border-white/5 disabled:opacity-30">
                        <ChevronRight size={12} />
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Main Dashboard ───────────────────────────────────────────
export default function AdminDashboard() {
    const exportCSV = () => {
        const header = 'Timestamp,Location,Weather,Road_Condition,Risk_Score,Fatalities,Day_Night,Time_Bin\n';
        const rows = ACCIDENT_DATA.map(r =>
            `${r.timestamp},${r.location},${r.weather},${r.roadCondition},${r.riskScore},${r.fatalities},${r.dayNight},${r.timeBin}`
        ).join('\n');
        const blob = new Blob([header + rows], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'suraksha_incidents.csv'; a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="h-full overflow-y-auto bg-[#080c16] p-6 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-xl font-black text-white">Admin Dashboard</h1>
                <p className="text-sm text-slate-500 mt-0.5">Real-time road safety overview</p>
            </div>

            {/* KPI Row */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <KpiCard icon={<AlertTriangle size={18} className="text-rose-400" />} label="Total Accidents" value={TOTAL_ACCIDENTS} delta="+12%" color="bg-rose-500/10" />
                <KpiCard icon={<Users size={18} className="text-amber-400" />} label="Total Fatalities" value={TOTAL_FATALITIES} delta="+3%" color="bg-amber-500/10" />
                <KpiCard icon={<Gauge size={18} className="text-blue-400" />} label="Avg Risk Score" value={AVG_RISK_SCORE} delta="-5%" color="bg-blue-500/10" />
                <KpiCard icon={<MapPin size={18} className="text-purple-400" />} label="Highest Risk Zone" value={HIGHEST_RISK_ZONE?.location || '-'} color="bg-purple-500/10" />
                <KpiCard icon={<Bell size={18} className="text-emerald-400" />} label="Active Alerts" value={7} delta="+2%" color="bg-emerald-500/10" />
            </div>

            {/* Middle row: Status + Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                <SystemStatus />
                <QuickActions onExport={exportCSV} />
                <div className="lg:col-span-2">
                    {/* Placeholder for mini hotspot map — optional */}
                    <div className="bg-slate-900/60 border border-white/5 rounded-xl p-4 h-full flex flex-col items-center justify-center">
                        <MapPin size={32} className="text-slate-700 mb-2" />
                        <p className="text-xs text-slate-600">Hotspot map available in Driver View</p>
                    </div>
                </div>
            </div>

            {/* Incidents Table */}
            <IncidentsTable data={ACCIDENT_DATA} />
        </div>
    );
}
