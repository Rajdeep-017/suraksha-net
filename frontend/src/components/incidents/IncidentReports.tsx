import { useState, useMemo, type FormEvent } from 'react';
import {
    FileText, Send, Loader2, CheckCircle, AlertCircle, MapPin,
    Clock, ChevronDown, X, Map, List, Filter, ShieldCheck, Eye, CheckCircle2
} from 'lucide-react';
import { SEEDED_INCIDENTS, type IncidentRecord } from '../../data/mockData';
import { useAuth } from '../../context/AuthContext';

type StatusTab = 'All' | 'Pending' | 'Reviewed' | 'Resolved';

const SEVERITY_COLORS: Record<string, string> = {
    High: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    Medium: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    Low: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
};

const STATUS_COLORS: Record<string, string> = {
    Pending: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    Reviewed: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    Resolved: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
};

// ── Report Form ──────────────────────────────────────────────
function ReportForm({ onSubmit }: { onSubmit: (inc: IncidentRecord) => void }) {
    const [name, setName] = useState('');
    const [contact, setContact] = useState('');
    const [lat, setLat] = useState('');
    const [lng, setLng] = useState('');
    const [severity, setSeverity] = useState<'Low' | 'Medium' | 'High'>('Medium');
    const [desc, setDesc] = useState('');
    const [locationName, setLocationName] = useState('');
    const [weather, setWeather] = useState('Clear');
    const [road, setRoad] = useState('Dry');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');

    const autoFillGPS = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                pos => { setLat(pos.coords.latitude.toFixed(5)); setLng(pos.coords.longitude.toFixed(5)); },
                () => setError('Could not get GPS location'),
            );
        }
    };

    const validate = () => {
        if (!name.trim()) return 'Reporter name is required.';
        if (!contact.trim()) return 'Contact is required.';
        if (!lat || !lng) return 'Location (lat/lng) is required.';
        if (!desc.trim()) return 'Description is required.';
        return '';
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        const err = validate();
        if (err) { setError(err); return; }
        setError('');
        setLoading(true);
        await new Promise(r => setTimeout(r, 600));
        const newInc: IncidentRecord = {
            id: `INC-${Date.now()}`,
            reporterName: name,
            contact,
            timestamp: new Date().toISOString(),
            location: locationName.trim() || `${lat}, ${lng}`,
            lat: parseFloat(lat),
            lng: parseFloat(lng),
            severity,
            description: desc,
            weather,
            roadCondition: road,
            status: 'Pending',
        };
        onSubmit(newInc);
        setLoading(false);
        setSubmitted(true);
        setTimeout(() => setSubmitted(false), 3000);
        setName(''); setContact(''); setLat(''); setLng(''); setDesc(''); setLocationName('');
    };

    return (
        <div className="bg-slate-900/60 border border-white/5 rounded-xl p-4">
            <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                <FileText size={13} className="text-emerald-400" /> Report Incident
            </h3>

            <form onSubmit={handleSubmit} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-[9px] text-slate-500 uppercase block mb-1">Reporter Name</label>
                        <input value={name} onChange={e => setName(e.target.value)}
                            className="w-full bg-slate-800 border border-white/5 rounded-lg px-3 py-2 text-xs text-white outline-none" placeholder="Your name" />
                    </div>
                    <div>
                        <label className="text-[9px] text-slate-500 uppercase block mb-1">Contact</label>
                        <input value={contact} onChange={e => setContact(e.target.value)}
                            className="w-full bg-slate-800 border border-white/5 rounded-lg px-3 py-2 text-xs text-white outline-none" placeholder="+91 ..." />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-[9px] text-slate-500 uppercase block mb-1">Latitude</label>
                        <input value={lat} onChange={e => setLat(e.target.value)}
                            className="w-full bg-slate-800 border border-white/5 rounded-lg px-3 py-2 text-xs text-white outline-none" placeholder="18.5204" />
                    </div>
                    <div>
                        <label className="text-[9px] text-slate-500 uppercase block mb-1">Longitude</label>
                        <input value={lng} onChange={e => setLng(e.target.value)}
                            className="w-full bg-slate-800 border border-white/5 rounded-lg px-3 py-2 text-xs text-white outline-none" placeholder="73.8567" />
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button type="button" onClick={autoFillGPS}
                        className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1">
                        <MapPin size={10} /> Auto-fill from GPS
                    </button>
                </div>

                <div>
                    <label className="text-[9px] text-slate-500 uppercase block mb-1">Location Name</label>
                    <input value={locationName} onChange={e => setLocationName(e.target.value)}
                        className="w-full bg-slate-800 border border-white/5 rounded-lg px-3 py-2 text-xs text-white outline-none"
                        placeholder="e.g. Hinjewadi Phase 1, Near Katraj Bypass" />
                </div>

                <div className="grid grid-cols-3 gap-3">
                    <div>
                        <label className="text-[9px] text-slate-500 uppercase block mb-1">Severity</label>
                        <select value={severity} onChange={e => setSeverity(e.target.value as any)}
                            className="w-full bg-slate-800 border border-white/5 rounded-lg px-3 py-2 text-xs text-white outline-none">
                            <option>Low</option><option>Medium</option><option>High</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-[9px] text-slate-500 uppercase block mb-1">Weather</label>
                        <select value={weather} onChange={e => setWeather(e.target.value)}
                            className="w-full bg-slate-800 border border-white/5 rounded-lg px-3 py-2 text-xs text-white outline-none">
                            {['Clear', 'Rainy', 'Foggy', 'Cloudy', 'Stormy'].map(w => <option key={w}>{w}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-[9px] text-slate-500 uppercase block mb-1">Road</label>
                        <select value={road} onChange={e => setRoad(e.target.value)}
                            className="w-full bg-slate-800 border border-white/5 rounded-lg px-3 py-2 text-xs text-white outline-none">
                            {['Dry', 'Wet', 'Slippery', 'Potholed', 'Good'].map(r => <option key={r}>{r}</option>)}
                        </select>
                    </div>
                </div>

                <div>
                    <label className="text-[9px] text-slate-500 uppercase block mb-1">Description</label>
                    <textarea value={desc} onChange={e => setDesc(e.target.value)}
                        className="w-full bg-slate-800 border border-white/5 rounded-lg px-3 py-2 text-xs text-white outline-none h-20 resize-none"
                        placeholder="Describe the incident..." />
                </div>

                <div>
                    <label className="text-[9px] text-slate-500 uppercase block mb-1">Photo (optional)</label>
                    <input type="file" accept="image/*"
                        className="w-full text-[10px] text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-slate-800 file:text-slate-400 hover:file:bg-slate-700" />
                </div>

                {error && (
                    <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                        <AlertCircle size={12} /> {error}
                    </div>
                )}

                <button type="submit" disabled={loading}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-2">
                    {loading ? <Loader2 size={14} className="animate-spin" /> : submitted ? <CheckCircle size={14} /> : <Send size={14} />}
                    {loading ? 'Submitting...' : submitted ? 'Submitted!' : 'Submit Report'}
                </button>
            </form>
        </div>
    );
}

// ── Incident Card ────────────────────────────────────────────
function IncidentCard({ inc, onExpand, isAdmin, onQuickResolve }: {
    inc: IncidentRecord;
    onExpand: (id: string) => void;
    isAdmin: boolean;
    onQuickResolve?: (id: string) => void;
}) {
    return (
        <div
            onClick={() => onExpand(inc.id)}
            className="bg-slate-900/40 border border-white/5 rounded-xl p-3 hover:bg-slate-900/60 transition-all cursor-pointer group"
        >
            <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${SEVERITY_COLORS[inc.severity]}`}>
                        {inc.severity}
                    </span>
                    <p className="text-xs text-white font-medium truncate">{inc.location}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                    {/* Admin quick-resolve button */}
                    {isAdmin && inc.status !== 'Resolved' && onQuickResolve && (
                        <button
                            onClick={e => { e.stopPropagation(); onQuickResolve(inc.id); }}
                            title="Quick resolve"
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20"
                        >
                            <CheckCircle2 size={12} />
                        </button>
                    )}
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${STATUS_COLORS[inc.status]}`}>
                        {inc.status}
                    </span>
                </div>
            </div>
            <p className="text-[11px] text-slate-400 line-clamp-2">{inc.description}</p>
            <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-600">
                <span className="flex items-center gap-1"><Clock size={9} /> {inc.timestamp.replace('T', ' ').slice(0, 16)}</span>
                <span>{inc.reporterName}</span>
            </div>
            {/* Show resolution info if resolved */}
            {inc.status === 'Resolved' && inc.resolvedBy && (
                <div className="mt-1.5 flex items-center gap-1.5 text-[9px] text-emerald-500/70">
                    <ShieldCheck size={9} />
                    <span>Resolved by {inc.resolvedBy}</span>
                    {inc.resolvedAt && <span>· {inc.resolvedAt.replace('T', ' ').slice(0, 16)}</span>}
                </div>
            )}
        </div>
    );
}

// ── Detail Modal ─────────────────────────────────────────────
function DetailModal({ inc, onClose, isAdmin, onStatusChange }: {
    inc: IncidentRecord;
    onClose: () => void;
    isAdmin: boolean;
    onStatusChange: (id: string, status: IncidentRecord['status'], note?: string) => void;
}) {
    const [adminNote, setAdminNote] = useState(inc.adminNote || '');
    const [confirmResolve, setConfirmResolve] = useState(false);

    const handleStatusChange = (newStatus: IncidentRecord['status']) => {
        onStatusChange(inc.id, newStatus, adminNote.trim() || undefined);
        if (newStatus === 'Resolved') {
            setConfirmResolve(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-[30rem] max-h-[85vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-bold text-white">Incident {inc.id}</h4>
                    <button onClick={onClose} className="text-slate-500 hover:text-white"><X size={16} /></button>
                </div>

                <div className="space-y-3 text-xs">
                    <div className="flex items-center gap-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${SEVERITY_COLORS[inc.severity]}`}>{inc.severity}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_COLORS[inc.status]}`}>{inc.status}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div><span className="text-slate-500 block text-[10px] uppercase">Reporter</span><span className="text-white font-medium">{inc.reporterName}</span></div>
                        <div><span className="text-slate-500 block text-[10px] uppercase">Contact</span><span className="text-white font-medium">{inc.contact}</span></div>
                        <div><span className="text-slate-500 block text-[10px] uppercase">Location</span><span className="text-white font-medium">{inc.location}</span></div>
                        <div><span className="text-slate-500 block text-[10px] uppercase">Timestamp</span><span className="text-white font-medium">{inc.timestamp.replace('T', ' ').slice(0, 16)}</span></div>
                        <div><span className="text-slate-500 block text-[10px] uppercase">Weather</span><span className="text-white font-medium">{inc.weather}</span></div>
                        <div><span className="text-slate-500 block text-[10px] uppercase">Road</span><span className="text-white font-medium">{inc.roadCondition}</span></div>
                    </div>

                    <div>
                        <span className="text-slate-500 block text-[10px] uppercase mb-1">Description</span>
                        <p className="text-slate-300 leading-relaxed">{inc.description}</p>
                    </div>

                    <div className="text-[10px] text-slate-600">
                        Lat: {inc.lat.toFixed(5)}, Lng: {inc.lng.toFixed(5)}
                    </div>

                    {/* Resolution info if already resolved */}
                    {inc.status === 'Resolved' && (inc.resolvedBy || inc.adminNote) && (
                        <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-3 space-y-1.5">
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400">
                                <ShieldCheck size={12} /> Resolution Details
                            </div>
                            {inc.resolvedBy && (
                                <p className="text-[11px] text-slate-400">
                                    Resolved by <span className="text-white font-medium">{inc.resolvedBy}</span>
                                    {inc.resolvedAt && <span className="text-slate-600"> · {inc.resolvedAt.replace('T', ' ').slice(0, 16)}</span>}
                                </p>
                            )}
                            {inc.adminNote && (
                                <p className="text-[11px] text-slate-400 italic">"{inc.adminNote}"</p>
                            )}
                        </div>
                    )}

                    {/* ── Admin Actions ── */}
                    {isAdmin && inc.status !== 'Resolved' && (
                        <div className="border-t border-white/5 pt-4 mt-4 space-y-3">
                            <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                                <ShieldCheck size={11} className="text-emerald-400" /> Admin Actions
                            </h5>

                            {/* Admin note */}
                            <div>
                                <label className="text-[9px] text-slate-500 uppercase block mb-1">Resolution Note (optional)</label>
                                <textarea
                                    value={adminNote}
                                    onChange={e => setAdminNote(e.target.value)}
                                    className="w-full bg-slate-800/80 border border-white/5 rounded-lg px-3 py-2 text-xs text-white outline-none h-16 resize-none focus:border-emerald-500/30 transition-colors"
                                    placeholder="Add a note about the resolution..."
                                />
                            </div>

                            {/* Action buttons */}
                            <div className="flex gap-2">
                                {inc.status === 'Pending' && (
                                    <button
                                        onClick={() => handleStatusChange('Reviewed')}
                                        className="flex-1 flex items-center justify-center gap-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/20 text-blue-400 text-xs font-bold py-2.5 rounded-xl transition-all"
                                    >
                                        <Eye size={13} /> Mark as Reviewed
                                    </button>
                                )}

                                {!confirmResolve ? (
                                    <button
                                        onClick={() => setConfirmResolve(true)}
                                        className="flex-1 flex items-center justify-center gap-2 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/20 text-emerald-400 text-xs font-bold py-2.5 rounded-xl transition-all"
                                    >
                                        <CheckCircle2 size={13} /> Resolve
                                    </button>
                                ) : (
                                    <div className="flex-1 flex flex-col gap-1.5">
                                        <p className="text-[10px] text-amber-400 text-center font-medium">Confirm resolution?</p>
                                        <div className="flex gap-1.5">
                                            <button
                                                onClick={() => handleStatusChange('Resolved')}
                                                className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2 rounded-lg transition-all"
                                            >
                                                <CheckCircle2 size={12} /> Yes, Resolve
                                            </button>
                                            <button
                                                onClick={() => setConfirmResolve(false)}
                                                className="px-3 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-bold py-2 rounded-lg transition-all"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ── Success Toast ────────────────────────────────────────────
function SuccessToast({ message, onDone }: { message: string; onDone: () => void }) {
    useState(() => { setTimeout(onDone, 3000); });
    return (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2 bg-emerald-600/90 backdrop-blur-md px-5 py-2.5 rounded-xl border border-emerald-400/30 text-sm font-semibold text-white shadow-2xl animate-slide-down">
            <CheckCircle size={16} /> {message}
        </div>
    );
}

// ── Main Page ────────────────────────────────────────────────
export default function IncidentReports() {
    const { user } = useAuth();
    const isAdmin = user?.role === 'Admin';

    const [incidents, setIncidents] = useState<IncidentRecord[]>(SEEDED_INCIDENTS);
    const [tab, setTab] = useState<StatusTab>('All');
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
    const [toast, setToast] = useState<string | null>(null);

    const filtered = useMemo(() => {
        if (tab === 'All') return incidents;
        return incidents.filter(inc => inc.status === tab);
    }, [incidents, tab]);

    const counts = {
        All: incidents.length,
        Pending: incidents.filter(i => i.status === 'Pending').length,
        Reviewed: incidents.filter(i => i.status === 'Reviewed').length,
        Resolved: incidents.filter(i => i.status === 'Resolved').length,
    };

    const handleNewIncident = (inc: IncidentRecord) => {
        setIncidents(prev => [inc, ...prev]);
    };

    const handleStatusChange = (id: string, newStatus: IncidentRecord['status'], note?: string) => {
        setIncidents(prev => prev.map(inc => {
            if (inc.id !== id) return inc;
            return {
                ...inc,
                status: newStatus,
                adminNote: note || inc.adminNote,
                resolvedAt: newStatus === 'Resolved' ? new Date().toISOString() : inc.resolvedAt,
                resolvedBy: newStatus === 'Resolved' ? (user?.name || user?.email || 'Admin') : inc.resolvedBy,
            };
        }));
        setExpandedId(null);
        setToast(`Incident marked as ${newStatus}`);
    };

    const handleQuickResolve = (id: string) => {
        handleStatusChange(id, 'Resolved');
    };

    const expandedInc = incidents.find(i => i.id === expandedId);

    const TABS: StatusTab[] = ['All', 'Pending', 'Reviewed', 'Resolved'];

    return (
        <div className="h-full overflow-hidden bg-[#080c16] flex">
            {/* Left: Form */}
            <div className="w-[380px] shrink-0 border-r border-white/5 overflow-y-auto p-4">
                <ReportForm onSubmit={handleNewIncident} />

                {/* Admin stats summary */}
                {isAdmin && (
                    <div className="mt-4 bg-slate-900/60 border border-white/5 rounded-xl p-4">
                        <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                            <ShieldCheck size={13} className="text-emerald-400" /> Admin Overview
                        </h3>
                        <div className="grid grid-cols-3 gap-2">
                            <div className="text-center bg-amber-500/5 border border-amber-500/10 rounded-lg py-2">
                                <p className="text-lg font-black text-amber-400">{counts.Pending}</p>
                                <p className="text-[9px] text-slate-500 uppercase font-bold">Pending</p>
                            </div>
                            <div className="text-center bg-blue-500/5 border border-blue-500/10 rounded-lg py-2">
                                <p className="text-lg font-black text-blue-400">{counts.Reviewed}</p>
                                <p className="text-[9px] text-slate-500 uppercase font-bold">Reviewed</p>
                            </div>
                            <div className="text-center bg-emerald-500/5 border border-emerald-500/10 rounded-lg py-2">
                                <p className="text-lg font-black text-emerald-400">{counts.Resolved}</p>
                                <p className="text-[9px] text-slate-500 uppercase font-bold">Resolved</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Right: Feed */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <h1 className="text-lg font-black text-white">Incident Reports</h1>
                        {isAdmin && (
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 uppercase tracking-widest">
                                Admin
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setViewMode(v => v === 'list' ? 'map' : 'list')}
                            className={`flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-lg border transition-all ${viewMode === 'map' ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' : 'text-slate-500 border-white/5'
                                }`}
                        >
                            {viewMode === 'list' ? <Map size={12} /> : <List size={12} />}
                            {viewMode === 'list' ? 'Map View' : 'List View'}
                        </button>
                    </div>
                </div>

                {/* Status tabs */}
                <div className="flex border-b border-white/5 shrink-0">
                    {TABS.map(t => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            className={`flex-1 py-2.5 text-[10px] font-bold uppercase tracking-widest transition-all border-b-2 flex items-center justify-center gap-1.5 ${tab === t
                                ? 'text-emerald-400 border-emerald-500 bg-emerald-500/5'
                                : 'text-slate-500 border-transparent hover:text-slate-300'
                                }`}
                        >
                            {t}
                            <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${tab === t ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-600'}`}>
                                {counts[t]}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4">
                    {viewMode === 'list' ? (
                        <div className="space-y-2">
                            {filtered.length === 0 ? (
                                <div className="text-center py-16 text-slate-600">
                                    <FileText size={32} className="mx-auto mb-3 text-slate-700" />
                                    <p className="text-xs">No incidents in this category.</p>
                                </div>
                            ) : (
                                filtered.map(inc => (
                                    <IncidentCard
                                        key={inc.id}
                                        inc={inc}
                                        onExpand={setExpandedId}
                                        isAdmin={isAdmin}
                                        onQuickResolve={handleQuickResolve}
                                    />
                                ))
                            )}
                        </div>
                    ) : (
                        <div className="bg-slate-900/60 border border-white/5 rounded-xl h-full flex items-center justify-center">
                            <div className="text-center">
                                <MapPin size={32} className="mx-auto text-slate-700 mb-3" />
                                <p className="text-xs text-slate-600">Incident map visualization</p>
                                <p className="text-[10px] text-slate-700 mt-1">{filtered.length} incidents plotted</p>
                                {/* Map markers summary */}
                                <div className="flex justify-center gap-3 mt-4">
                                    {(['High', 'Medium', 'Low'] as const).map(sev => {
                                        const count = filtered.filter(i => i.severity === sev).length;
                                        return (
                                            <span key={sev} className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${SEVERITY_COLORS[sev]}`}>
                                                {sev}: {count}
                                            </span>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Detail modal */}
            {expandedInc && (
                <DetailModal
                    inc={expandedInc}
                    onClose={() => setExpandedId(null)}
                    isAdmin={isAdmin}
                    onStatusChange={handleStatusChange}
                />
            )}

            {/* Success toast */}
            {toast && <SuccessToast message={toast} onDone={() => setToast(null)} />}
        </div>
    );
}
