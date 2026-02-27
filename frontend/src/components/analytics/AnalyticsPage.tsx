import { useState, useMemo } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
    LineChart, Line, Area, AreaChart,
    ScatterChart, Scatter, CartesianGrid,
    PieChart, Pie, Cell, Legend,
} from 'recharts';
import { Filter, X, Trophy } from 'lucide-react';
import {
    ACCIDENT_DATA, ACCIDENTS_BY_TIME_BIN, RISK_DISTRIBUTION,
    WEATHER_VS_RISK, FATALITIES_BY_MONTH, TRAFFIC_VS_RISK,
    ROAD_CONDITION_BREAKDOWN, TOP_10_LOCATIONS, CORRELATION_INSIGHTS,
    type AccidentRow,
} from '../../data/mockData';

const PIE_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const WEATHERS = ['Clear', 'Rainy', 'Foggy', 'Cloudy', 'Stormy'];
const ROAD_CONDITIONS = ['Dry', 'Wet', 'Slippery', 'Potholed', 'Under Construction', 'Good'];
const TIME_BINS_LIST = ['Morning Rush', 'Midday', 'Afternoon', 'Evening Rush', 'Night', 'Late Night'];
const DAY_NIGHTS = ['Daytime', 'Nighttime'];

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="bg-slate-900/60 border border-white/5 rounded-xl p-4">
            <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-4">{title}</h3>
            {children}
        </div>
    );
}

export default function AnalyticsPage() {
    const [weatherFilter, setWeatherFilter] = useState<string[]>([]);
    const [roadFilter, setRoadFilter] = useState<string[]>([]);
    const [timeBinFilter, setTimeBinFilter] = useState<string[]>([]);
    const [dayNightFilter, setDayNightFilter] = useState<string[]>([]);
    const [showFilters, setShowFilters] = useState(false);

    const toggleFilter = (arr: string[], setArr: (v: string[]) => void, val: string) => {
        setArr(arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val]);
    };

    const filtered = useMemo(() => {
        let d: AccidentRow[] = ACCIDENT_DATA;
        if (weatherFilter.length) d = d.filter(r => weatherFilter.includes(r.weather));
        if (roadFilter.length) d = d.filter(r => roadFilter.includes(r.roadCondition));
        if (timeBinFilter.length) d = d.filter(r => timeBinFilter.includes(r.timeBin));
        if (dayNightFilter.length) d = d.filter(r => dayNightFilter.includes(r.dayNight));
        return d;
    }, [weatherFilter, roadFilter, timeBinFilter, dayNightFilter]);

    // Recompute chart data from filtered set
    const timeBinData = TIME_BINS_LIST.map(bin => ({
        name: bin, count: filtered.filter(r => r.timeBin === bin).length,
    }));

    const riskDist = (() => {
        const bins = Array.from({ length: 10 }, (_, i) => ({
            range: `${i * 10}-${i * 10 + 10}`, min: i * 10, max: i * 10 + 10,
        }));
        return bins.map(b => ({
            range: b.range, count: filtered.filter(r => r.riskScore >= b.min && r.riskScore < b.max).length,
        }));
    })();

    const weatherRisk = WEATHERS.map(w => {
        const rows = filtered.filter(r => r.weather === w);
        return { weather: w, avgRisk: rows.length > 0 ? Math.round(rows.reduce((s, r) => s + r.riskScore, 0) / rows.length) : 0 };
    });

    const monthlyFatal = Array.from({ length: 12 }, (_, i) => {
        const m = i + 1;
        const rows = filtered.filter(r => parseInt(r.timestamp.slice(5, 7)) === m);
        return {
            month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
            fatalities: rows.reduce((s, r) => s + r.fatalities, 0),
        };
    });

    const trafficRisk = filtered.map(r => ({ trafficDensity: r.trafficDensity, riskScore: r.riskScore }));

    const roadBreakdown = ROAD_CONDITIONS.map(rc => ({
        name: rc, value: filtered.filter(r => r.roadCondition === rc).length,
    }));

    const hasFilters = weatherFilter.length || roadFilter.length || timeBinFilter.length || dayNightFilter.length;

    return (
        <div className="h-full overflow-y-auto bg-[#080c16] p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-black text-white">Analytics</h1>
                    <p className="text-sm text-slate-500 mt-0.5">{filtered.length} records{hasFilters ? ' (filtered)' : ''}</p>
                </div>
                <button
                    onClick={() => setShowFilters(f => !f)}
                    className={`flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-xl border transition-all ${showFilters ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' : 'text-slate-500 border-white/5 bg-slate-900/60'}`}
                >
                    <Filter size={14} /> Filters {hasFilters ? `(${[weatherFilter, roadFilter, timeBinFilter, dayNightFilter].flat().length})` : ''}
                </button>
            </div>

            {/* Filter bar */}
            {showFilters && (
                <div className="bg-slate-900/60 border border-white/5 rounded-xl p-4 space-y-3">
                    <FilterRow label="Weather" items={WEATHERS} selected={weatherFilter} toggle={v => toggleFilter(weatherFilter, setWeatherFilter, v)} />
                    <FilterRow label="Road Condition" items={ROAD_CONDITIONS} selected={roadFilter} toggle={v => toggleFilter(roadFilter, setRoadFilter, v)} />
                    <FilterRow label="Time Bin" items={TIME_BINS_LIST} selected={timeBinFilter} toggle={v => toggleFilter(timeBinFilter, setTimeBinFilter, v)} />
                    <FilterRow label="Day/Night" items={DAY_NIGHTS} selected={dayNightFilter} toggle={v => toggleFilter(dayNightFilter, setDayNightFilter, v)} />
                    <button onClick={() => { setWeatherFilter([]); setRoadFilter([]); setTimeBinFilter([]); setDayNightFilter([]); }}
                        className="text-[10px] text-slate-500 hover:text-red-400 flex items-center gap-1">
                        <X size={10} /> Clear all
                    </button>
                </div>
            )}

            {/* Charts grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <ChartCard title="Accidents by Time Bin">
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={timeBinData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} />
                            <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                            <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, fontSize: 12 }} />
                            <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Risk Score Distribution">
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={riskDist}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis dataKey="range" tick={{ fontSize: 9, fill: '#64748b' }} />
                            <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                            <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, fontSize: 12 }} />
                            <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Weather vs Avg Risk Score">
                    <ResponsiveContainer width="100%" height={240}>
                        <RadarChart data={weatherRisk}>
                            <PolarGrid stroke="#1e293b" />
                            <PolarAngleAxis dataKey="weather" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                            <PolarRadiusAxis tick={{ fontSize: 9, fill: '#475569' }} />
                            <Radar dataKey="avgRisk" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.2} />
                        </RadarChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Fatalities Over Time (Monthly)">
                    <ResponsiveContainer width="100%" height={220}>
                        <AreaChart data={monthlyFatal}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#64748b' }} />
                            <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                            <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, fontSize: 12 }} />
                            <Area type="monotone" dataKey="fatalities" stroke="#ef4444" fill="#ef4444" fillOpacity={0.15} />
                        </AreaChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Traffic Density vs Risk Score">
                    <ResponsiveContainer width="100%" height={220}>
                        <ScatterChart>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis dataKey="trafficDensity" name="Traffic" tick={{ fontSize: 10, fill: '#64748b' }} />
                            <YAxis dataKey="riskScore" name="Risk" tick={{ fontSize: 10, fill: '#64748b' }} />
                            <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, fontSize: 12 }} />
                            <Scatter data={trafficRisk} fill="#8b5cf6" fillOpacity={0.6} />
                        </ScatterChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Road Condition Breakdown">
                    <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                            <Pie data={roadBreakdown} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value"
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                labelLine={false}
                                style={{ fontSize: 9 }}
                            >
                                {roadBreakdown.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                            </Pie>
                            <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, fontSize: 12 }} />
                        </PieChart>
                    </ResponsiveContainer>
                </ChartCard>
            </div>

            {/* Top 10 */}
            <div className="bg-slate-900/60 border border-white/5 rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-white/5">
                    <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                        <Trophy size={13} className="text-amber-400" /> Top 10 Dangerous Locations
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="border-b border-white/5 text-[10px] text-slate-600 uppercase tracking-wider">
                                <th className="px-4 py-2.5 text-center">Rank</th>
                                <th className="px-4 py-2.5 text-left">Location</th>
                                <th className="px-4 py-2.5 text-center">Avg Risk</th>
                                <th className="px-4 py-2.5 text-center">Accidents</th>
                                <th className="px-4 py-2.5 text-center">Fatalities</th>
                                <th className="px-4 py-2.5 text-left">Weather</th>
                                <th className="px-4 py-2.5 text-left">Time Bin</th>
                            </tr>
                        </thead>
                        <tbody>
                            {TOP_10_LOCATIONS.map((loc, i) => (
                                <tr key={loc.location} className="border-b border-white/3 hover:bg-white/2">
                                    <td className="px-4 py-2.5 text-center font-black text-amber-400">#{i + 1}</td>
                                    <td className="px-4 py-2.5 text-white font-medium">{loc.location}</td>
                                    <td className="px-4 py-2.5 text-center">
                                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${loc.avgRisk > 60 ? 'text-rose-400 bg-rose-500/10 border-rose-500/20' :
                                                loc.avgRisk > 30 ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' :
                                                    'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                                            }`}>{loc.avgRisk}</span>
                                    </td>
                                    <td className="px-4 py-2.5 text-center text-white font-bold">{loc.totalAccidents}</td>
                                    <td className="px-4 py-2.5 text-center text-white font-bold">{loc.totalFatalities}</td>
                                    <td className="px-4 py-2.5 text-slate-400">{loc.dominantWeather}</td>
                                    <td className="px-4 py-2.5 text-slate-400">{loc.dominantTimeBin}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Correlation Insights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {CORRELATION_INSIGHTS.map((insight, i) => (
                    <div key={i} className="bg-slate-900/60 border border-white/5 rounded-xl p-4 flex items-start gap-3">
                        <div className="bg-amber-500/10 p-2 rounded-lg shrink-0">
                            <Trophy size={14} className="text-amber-400" />
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">{insight}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

function FilterRow({ label, items, selected, toggle }: {
    label: string; items: string[]; selected: string[]; toggle: (v: string) => void;
}) {
    return (
        <div>
            <label className="text-[9px] text-slate-500 uppercase tracking-widest block mb-1.5">{label}</label>
            <div className="flex flex-wrap gap-1.5">
                {items.map(item => (
                    <button
                        key={item}
                        onClick={() => toggle(item)}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all ${selected.includes(item)
                                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                : 'bg-slate-800 text-slate-500 border-white/5 hover:text-slate-300'
                            }`}
                    >
                        {item}
                    </button>
                ))}
            </div>
        </div>
    );
}
