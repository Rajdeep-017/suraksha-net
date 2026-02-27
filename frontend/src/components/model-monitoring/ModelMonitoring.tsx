import { useState } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    LineChart, Line, CartesianGrid, ReferenceLine,
} from 'recharts';
import {
    Cpu, Calendar, Layers, Target, Loader2, CheckCircle, AlertTriangle,
} from 'lucide-react';
import {
    MODEL_METRICS, FEATURE_IMPORTANCE, CONFUSION_MATRIX, WEEKLY_ACCURACY,
} from '../../data/mockData';
import { apiClient } from '../../api/client';

// ── Metric Card ──────────────────────────────────────────────
function MetricCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
    return (
        <div className="bg-slate-900/60 border border-white/5 rounded-xl p-4 text-center">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</p>
            <p className="text-2xl font-black text-white mt-1">{value}</p>
            {sub && <p className="text-[10px] text-slate-600 mt-0.5">{sub}</p>}
        </div>
    );
}

// ── Confusion Matrix ─────────────────────────────────────────
function ConfusionMatrixGrid() {
    const { labels, matrix } = CONFUSION_MATRIX;
    const totals = matrix.map(row => row.reduce((a, b) => a + b, 0));
    const maxVal = Math.max(...matrix.flat());

    return (
        <div className="bg-slate-900/60 border border-white/5 rounded-xl p-4">
            <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                <Target size={13} className="text-purple-400" /> Confusion Matrix
            </h3>
            <div className="overflow-x-auto">
                <table className="mx-auto">
                    <thead>
                        <tr>
                            <th className="w-20" />
                            {labels.map(l => (
                                <th key={l} className="text-[10px] text-slate-500 font-bold uppercase px-2 py-1 text-center w-20">
                                    Pred: {l}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {matrix.map((row, i) => (
                            <tr key={i}>
                                <td className="text-[10px] text-slate-500 font-bold uppercase px-2 py-1 text-right">
                                    True: {labels[i]}
                                </td>
                                {row.map((val, j) => {
                                    const pct = totals[i] > 0 ? Math.round(val / totals[i] * 100) : 0;
                                    const intensity = val / maxVal;
                                    const isDiag = i === j;
                                    return (
                                        <td key={j} className="px-1 py-1">
                                            <div
                                                className={`rounded-lg p-3 text-center border ${isDiag
                                                        ? 'border-emerald-500/30'
                                                        : 'border-white/5'
                                                    }`}
                                                style={{
                                                    backgroundColor: isDiag
                                                        ? `rgba(16, 185, 129, ${0.1 + intensity * 0.3})`
                                                        : `rgba(239, 68, 68, ${intensity * 0.2})`,
                                                }}
                                            >
                                                <p className="text-sm font-black text-white">{val}</p>
                                                <p className="text-[9px] text-slate-400">{pct}%</p>
                                            </div>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ── Live Prediction Tester ───────────────────────────────────
function PredictionTester() {
    const [lat, setLat] = useState('18.5204');
    const [lon, setLon] = useState('73.8567');
    const [weather, setWeather] = useState('Clear');
    const [road, setRoad] = useState('Dry');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ risk_level: string; risk_score: number; risk_probability?: number } | null>(null);
    const [error, setError] = useState('');

    const handlePredict = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await apiClient.post('/api/predict-risk', {
                lat: parseFloat(lat),
                lon: parseFloat(lon),
                city: 'Pune',
                weather,
                road_condition: road,
            });
            setResult(res.data);
        } catch (e: any) {
            setError(e?.response?.data?.detail || 'Prediction failed');
        }
        setLoading(false);
    };

    const riskColor = (level: string) =>
        level === 'High' ? 'text-rose-400 bg-rose-500/10 border-rose-500/20' :
            level === 'Medium' ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' :
                'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';

    return (
        <div className="bg-slate-900/60 border border-white/5 rounded-xl p-4">
            <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                <Cpu size={13} className="text-blue-400" /> Live Prediction Tester
            </h3>

            <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                    <label className="text-[9px] text-slate-500 uppercase block mb-1">Latitude</label>
                    <input value={lat} onChange={e => setLat(e.target.value)}
                        className="w-full bg-slate-800 border border-white/5 rounded-lg px-3 py-2 text-xs text-white outline-none" />
                </div>
                <div>
                    <label className="text-[9px] text-slate-500 uppercase block mb-1">Longitude</label>
                    <input value={lon} onChange={e => setLon(e.target.value)}
                        className="w-full bg-slate-800 border border-white/5 rounded-lg px-3 py-2 text-xs text-white outline-none" />
                </div>
                <div>
                    <label className="text-[9px] text-slate-500 uppercase block mb-1">Weather</label>
                    <select value={weather} onChange={e => setWeather(e.target.value)}
                        className="w-full bg-slate-800 border border-white/5 rounded-lg px-3 py-2 text-xs text-white outline-none">
                        {['Clear', 'Rainy', 'Foggy', 'Cloudy', 'Stormy'].map(w => <option key={w}>{w}</option>)}
                    </select>
                </div>
                <div>
                    <label className="text-[9px] text-slate-500 uppercase block mb-1">Road Condition</label>
                    <select value={road} onChange={e => setRoad(e.target.value)}
                        className="w-full bg-slate-800 border border-white/5 rounded-lg px-3 py-2 text-xs text-white outline-none">
                        {['Dry', 'Wet', 'Slippery', 'Potholed', 'Good'].map(r => <option key={r}>{r}</option>)}
                    </select>
                </div>
            </div>

            <button onClick={handlePredict} disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-2">
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Cpu size={14} />}
                {loading ? 'Predicting...' : 'Run Prediction'}
            </button>

            {result && (
                <div className="mt-3 p-3 bg-slate-950/50 rounded-xl border border-white/5">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-500 uppercase">Predicted Severity</span>
                        <span className={`text-sm font-black px-3 py-1 rounded-full border ${riskColor(result.risk_level)}`}>{result.risk_level}</span>
                    </div>
                    {result.risk_probability != null && (
                        <div className="mt-2">
                            <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                                <span>High-risk probability</span>
                                <span className="text-white font-bold">{(result.risk_probability * 100).toFixed(1)}%</span>
                            </div>
                            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500 rounded-full transition-all"
                                    style={{ width: `${result.risk_probability * 100}%` }} />
                            </div>
                        </div>
                    )}
                </div>
            )}

            {error && (
                <div className="mt-3 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 flex items-center gap-2">
                    <AlertTriangle size={12} /> {error}
                </div>
            )}
        </div>
    );
}

// ── Main Page ────────────────────────────────────────────────
export default function ModelMonitoring() {
    const driftThreshold = 0.84;
    const hasLowAccuracy = WEEKLY_ACCURACY.some(w => w.accuracy < driftThreshold);

    return (
        <div className="h-full overflow-y-auto bg-[#080c16] p-6 space-y-6">
            <div>
                <h1 className="text-xl font-black text-white">Model Monitoring</h1>
                <p className="text-sm text-slate-500 mt-0.5">Performance tracking & live predictions</p>
            </div>

            {/* Model overview cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <MetricCard label="Model Type" value="RF" sub={MODEL_METRICS.type} />
                <MetricCard label="Accuracy" value={`${(MODEL_METRICS.accuracy * 100).toFixed(1)}%`} />
                <MetricCard label="Precision" value={`${(MODEL_METRICS.precision * 100).toFixed(1)}%`} />
                <MetricCard label="Recall" value={`${(MODEL_METRICS.recall * 100).toFixed(1)}%`} />
                <MetricCard label="F1 Score" value={`${(MODEL_METRICS.f1 * 100).toFixed(1)}%`} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <MetricCard label="Training Date" value={MODEL_METRICS.trainingDate} sub="Last retrain" />
                <MetricCard label="Training Rows" value={MODEL_METRICS.trainingRows.toLocaleString()} sub="Dataset size" />
                <MetricCard label="Features" value={String(MODEL_METRICS.featureCount)} sub="Input dimensions" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Feature Importance */}
                <div className="bg-slate-900/60 border border-white/5 rounded-xl p-4">
                    <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                        <Layers size={13} className="text-emerald-400" /> Feature Importance
                    </h3>
                    <ResponsiveContainer width="100%" height={380}>
                        <BarChart data={FEATURE_IMPORTANCE} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis type="number" tick={{ fontSize: 10, fill: '#64748b' }} />
                            <YAxis type="category" dataKey="feature" tick={{ fontSize: 9, fill: '#94a3b8' }} width={160} />
                            <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, fontSize: 12 }} />
                            <Bar dataKey="importance" radius={[0, 4, 4, 0]}>
                                {FEATURE_IMPORTANCE.map((_, i) => {
                                    const t = i / FEATURE_IMPORTANCE.length;
                                    const color = `hsl(${150 - t * 120}, 70%, 50%)`;
                                    return <rect key={i} fill={color} />;
                                })}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Confusion Matrix */}
                <ConfusionMatrixGrid />
            </div>

            {/* Prediction Drift */}
            <div className="bg-slate-900/60 border border-white/5 rounded-xl p-4">
                <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-2">
                    <Calendar size={13} className="text-amber-400" /> Prediction Drift (Weekly Accuracy)
                </h3>
                {hasLowAccuracy && (
                    <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2 mb-4">
                        <AlertTriangle size={14} />
                        Warning: Model accuracy dropped below {(driftThreshold * 100).toFixed(0)}% threshold in recent weeks. Consider retraining.
                    </div>
                )}
                <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={WEEKLY_ACCURACY}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#64748b' }} />
                        <YAxis domain={[0.7, 1]} tickFormatter={v => `${(v * 100).toFixed(0)}%`} tick={{ fontSize: 10, fill: '#64748b' }} />
                        <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, fontSize: 12 }}
                            formatter={(v: number) => `${(v * 100).toFixed(1)}%`} />
                        <ReferenceLine y={driftThreshold} stroke="#f59e0b" strokeDasharray="5 5" label={{ value: 'Threshold', fill: '#f59e0b', fontSize: 10 }} />
                        <Line type="monotone" dataKey="accuracy" stroke="#10b981" strokeWidth={2} dot={{ r: 3, fill: '#10b981' }} />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* Live Prediction Tester */}
            <PredictionTester />
        </div>
    );
}
