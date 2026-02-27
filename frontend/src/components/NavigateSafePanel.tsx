import { useState } from 'react';
import { Route, AlertTriangle, CheckCircle, Clock, Ruler, Loader2, ChevronDown, ChevronUp, ArrowLeft, ArrowRight, RotateCw, Navigation, Zap, MousePointerClick } from 'lucide-react';
import type { NavigateSafeResponse, RouteOption, RouteStep } from '../api/client';

interface Props {
    result: NavigateSafeResponse | null;
    loading: boolean;
    error: string | null;
    selectedIndex?: number;
    onSelectRoute?: (index: number) => void;
}

/* ── Risk badge ──────────────────────────────────────────────────────── */
const RiskBadge = ({ pct }: { pct: string }) => {
    const val = parseInt(pct);
    const cls =
        val > 50 ? 'text-rose-400 bg-rose-500/10 border-rose-500/20' :
            val > 25 ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' :
                'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    return (
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${cls}`}>
            {pct} risk
        </span>
    );
};

/* ── Traffic badge ───────────────────────────────────────────────────── */
const TrafficBadge = ({ info, isPeak }: { info: string; isPeak: boolean }) => {
    const cls = isPeak
        ? 'text-red-400 bg-red-500/10 border-red-500/20'
        : info.includes('Moderate')
            ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
            : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border ${cls}`}>
            <Zap size={8} />
            {info}
        </span>
    );
};

/* ── Step icon ────────────────────────────────────────────────────────── */
const StepIcon = ({ type, modifier }: { type: string; modifier: string }) => {
    const t = type.toLowerCase();
    const m = modifier.toLowerCase();
    const cls = 'shrink-0 text-slate-400';
    if (t === 'arrive') return <CheckCircle size={11} className="shrink-0 text-emerald-400" />;
    if (t.includes('roundabout')) return <RotateCw size={11} className={cls} />;
    if (m === 'left' || m === 'sharp left' || m === 'slight left') return <ArrowLeft size={11} className={cls} />;
    if (m === 'right' || m === 'sharp right' || m === 'slight right') return <ArrowRight size={11} className={cls} />;
    return <Navigation size={11} className={cls} />;
};

/* ── Step tag chip ────────────────────────────────────────────────────── */
const StepTag = ({ tag }: { tag: string }) => {
    const map: Record<string, { label: string; cls: string }> = {
        highway: { label: 'Highway', cls: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
        roundabout: { label: 'Roundabout', cls: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
    };
    const config = map[tag] ?? { label: tag, cls: 'text-slate-400 bg-slate-500/10 border-slate-500/20' };
    return (
        <span className={`text-[8px] font-bold border rounded px-1 py-px ${config.cls}`}>
            {config.label}
        </span>
    );
};

/* ── Turn-by-turn step list ───────────────────────────────────────────── */
const StepsList = ({ steps }: { steps: RouteStep[] }) => {
    if (!steps || steps.length === 0) {
        return <p className="text-[10px] text-slate-600 italic px-1">No step data from Mappls for this route.</p>;
    }
    return (
        <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
            {steps.map((step, i) => (
                <div key={i} className="flex items-start gap-2 py-1.5 border-b border-white/4 last:border-0">
                    <div className="mt-0.5">
                        <StepIcon type={step.type} modifier={step.modifier} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-white leading-snug">{step.instruction}</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className="text-[9px] text-slate-500">{step.distance}</span>
                            {step.tags.map(tag => <StepTag key={tag} tag={tag} />)}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

/* ── Route card ───────────────────────────────────────────────────────── */
const RouteCard = ({
    route, rank, isBest, isSelected, onSelect
}: {
    route: RouteOption; rank: number; isBest?: boolean;
    isSelected?: boolean; onSelect?: () => void;
}) => {
    const [expanded, setExpanded] = useState(false);
    const hasSteps = route.steps && route.steps.length > 0;

    return (
        <div className={`rounded-xl border transition-all ${isSelected
            ? 'border-cyan-500/60 bg-cyan-500/5 ring-1 ring-cyan-500/30 shadow-lg shadow-cyan-500/10'
            : isBest
                ? 'border-emerald-500/40 bg-emerald-500/5'
                : 'border-white/5 bg-slate-800/50'
            }`}>
            {/* Card header */}
            <div className="p-3">
                <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                        {isBest
                            ? <CheckCircle size={12} className="text-emerald-400 shrink-0" />
                            : <span className="text-[10px] text-slate-600 font-bold w-4 shrink-0">#{rank}</span>
                        }
                        <p className="text-xs font-bold text-white truncate">{route.name}</p>
                    </div>
                    <RiskBadge pct={route.risk_percentage} />
                </div>
                <div className="flex items-center gap-4 text-[10px] text-slate-500">
                    <span className="flex items-center gap-1"><Clock size={10} /> {route.duration}</span>
                    <span className="flex items-center gap-1"><Ruler size={10} /> {route.distance}</span>
                </div>

                {/* Traffic badge */}
                {route.traffic_info && (
                    <div className="mt-2">
                        <TrafficBadge info={route.traffic_info} isPeak={route.is_peak_hour} />
                    </div>
                )}

                {isBest && (
                    <p className="text-[10px] text-emerald-500 font-semibold mt-1.5">
                        ✓ Recommended safest route
                    </p>
                )}

                {/* Select button */}
                <button
                    onClick={onSelect}
                    className={`mt-2.5 w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${isSelected
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 cursor-default'
                        : 'bg-slate-700/50 text-slate-400 border border-white/5 hover:bg-cyan-500/10 hover:text-cyan-400 hover:border-cyan-500/20'
                        }`}
                >
                    <MousePointerClick size={10} />
                    {isSelected ? 'Selected' : 'Select This Route'}
                </button>
            </div>

            {/* Step toggle button */}
            {hasSteps && (
                <>
                    <button
                        onClick={() => setExpanded(p => !p)}
                        className="w-full flex items-center justify-between px-3 py-1.5 border-t border-white/5 text-[10px] text-slate-500 hover:text-slate-300 hover:bg-white/3 transition-colors"
                    >
                        <span className="flex items-center gap-1">
                            <Route size={9} />
                            {route.steps.length} turn{route.steps.length !== 1 ? 's' : ''} · directions
                        </span>
                        {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                    </button>
                    {expanded && (
                        <div className="px-3 py-2 border-t border-white/5 bg-slate-950/30">
                            <StepsList steps={route.steps} />
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

/* ── Main panel ───────────────────────────────────────────────────────── */
export const NavigateSafePanel = ({ result, loading, error, selectedIndex = 0, onSelectRoute }: Props) => {
    if (loading) {
        return (
            <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex flex-col items-center gap-3 shadow-xl">
                <Loader2 className="animate-spin text-emerald-400" size={22} />
                <p className="text-xs text-slate-400">Finding safest routes…</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-slate-900/60 backdrop-blur-xl border border-red-500/20 rounded-2xl p-4 shadow-xl">
                <div className="flex items-start gap-2 text-xs text-red-400">
                    <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    if (!result) return null;

    // Build unified route list: [recommended, ...alternatives]
    const allRoutes = [result.recommended_safe_path, ...result.alternatives];
    const totalRoutes = allRoutes.length;

    return (
        <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-xl">
            {/* Header */}
            <div className="px-4 py-3 border-b border-white/5 bg-slate-800/50">
                <div className="flex items-center gap-2 mb-1">
                    <Route size={13} className="text-emerald-400" />
                    <h3 className="text-[11px] font-black uppercase tracking-widest text-emerald-400 flex-1">
                        Safe Navigation
                    </h3>
                </div>
                <div className="flex items-center gap-2 mt-1">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                        {totalRoutes} route{totalRoutes !== 1 ? 's' : ''} found
                    </span>
                    {result.alternatives.length > 0 && (
                        <span className="text-[10px] text-slate-500">
                            {result.alternatives.length} alternative{result.alternatives.length !== 1 ? 's' : ''}
                        </span>
                    )}
                </div>
                <p className="text-[9px] text-slate-600 mt-1">Ranked by safety · tap route to select · click for turn directions</p>
            </div>

            <div className="p-3 space-y-2.5 max-h-[28rem] overflow-y-auto">
                {/* All route cards */}
                {allRoutes.map((route, i) => (
                    <RouteCard
                        key={i}
                        route={route}
                        rank={i + 1}
                        isBest={i === 0}
                        isSelected={selectedIndex === i}
                        onSelect={() => onSelectRoute?.(i)}
                    />
                ))}
            </div>
        </div>
    );
};
