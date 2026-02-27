import { ShieldAlert, AlertTriangle, CheckCircle, MapPin, TrendingDown, TrendingUp } from 'lucide-react';
import type { SafetyResponse } from '../types/safety';

interface Props {
  data: SafetyResponse;
}

/* ── Circular SVG gauge ─────────────────────────────────────────────────── */
const ScoreGauge = ({ score }: { score: number }) => {
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const filled = circumference * (score / 100);
  const color =
    score > 69 ? '#10b981' :
      score > 39 ? '#f59e0b' :
        '#ef4444';

  return (
    <div className="relative flex items-center justify-center" style={{ width: 88, height: 88 }}>
      <svg width="88" height="88" viewBox="0 0 88 88" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="44" cy="44" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
        <circle
          cx="44" cy="44" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${filled} ${circumference}`}
          style={{ transition: 'stroke-dasharray 0.6s ease, stroke 0.4s ease' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-lg font-black text-white leading-none">{score}%</span>
        <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Safety</span>
      </div>
    </div>
  );
};

/* ── Risk level chip ────────────────────────────────────────────────────── */
const RiskChip = ({ level }: { level: string }) => {
  const upper = level.toUpperCase();
  const cls =
    upper === 'HIGH' ? 'text-rose-400 bg-rose-500/10 border-rose-500/30' :
      upper === 'MODERATE' ? 'text-amber-400 bg-amber-500/10 border-amber-500/30' :
        'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
  const Icon = upper === 'HIGH' ? TrendingUp : upper === 'MODERATE' ? AlertTriangle : CheckCircle;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${cls}`}>
      <Icon size={10} />
      {upper} RISK
    </span>
  );
};

/* ── Main Panel ─────────────────────────────────────────────────────────── */
export const RiskAnalysisPanel = ({ data }: Props) => {
  const { safety_score, risk_level, total_accidents, accident_points, travel_time } = data;

  const topHotspots = [...(accident_points ?? [])]
    .sort((a, b) => (b.Risk_Score ?? 0) - (a.Risk_Score ?? 0))
    .slice(0, 3);

  const travelMins = travel_time ?? 0;
  const hrs = Math.floor(travelMins / 60);
  const mins = travelMins % 60;

  return (
    <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-xl">

      {/* Header */}
      <div className="px-4 py-3 border-b border-white/5 bg-slate-800/50 flex items-center gap-2">
        <ShieldAlert size={13} className="text-emerald-400" />
        <h3 className="text-[11px] font-black uppercase tracking-widest text-emerald-400 flex-1">
          Risk Analysis
        </h3>
        <span className="text-[10px] text-slate-500 font-semibold italic">Route only</span>
      </div>

      {/* Score row */}
      <div className="px-4 pt-4 pb-3 flex items-center gap-4">
        <ScoreGauge score={safety_score} />
        <div className="flex-1 space-y-1.5">
          <RiskChip level={risk_level} />
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <AlertTriangle size={10} className="text-amber-400 shrink-0" />
            <span>
              <span className="font-bold text-white">{total_accidents}</span> hotspot{total_accidents !== 1 ? 's' : ''} on route
            </span>
          </div>
          {travelMins > 0 && (
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <TrendingDown size={10} className="text-emerald-400 shrink-0" />
              <span>Est. <span className="font-bold text-white">
                {hrs > 0 ? `${hrs}h ` : ''}{mins}m
              </span> travel</span>
            </div>
          )}
        </div>
      </div>

      {/* Advice banner */}
      <div className={`mx-3 mb-3 px-3 py-2 rounded-xl text-[10px] font-medium leading-snug border ${safety_score < 40
        ? 'bg-rose-500/8 border-rose-500/20 text-rose-300'
        : safety_score < 70
          ? 'bg-amber-500/8 border-amber-500/20 text-amber-300'
          : 'bg-emerald-500/8 border-emerald-500/20 text-emerald-300'
        }`}>
        {safety_score < 40
          ? '⚠️ High risk — caution advised. Night travel not recommended.'
          : safety_score < 70
            ? '🟡 Moderate risk — drive carefully and maintain safe speeds.'
            : '✅ Route looks safe. Standard precautions apply.'}
      </div>

      {/* Top hotspots */}
      {topHotspots.length > 0 && (
        <>
          <div className="px-4 pb-1.5">
            <p className="text-[9px] text-slate-600 uppercase tracking-widest font-bold flex items-center gap-1">
              <MapPin size={8} /> Top Risk Spots on Route
            </p>
          </div>
          <div className="px-3 pb-3 space-y-1.5">
            {topHotspots.map((pt, i) => {
              const score = pt.Risk_Score ?? 0;
              const name = pt.place_name ?? pt.City ?? 'Unknown location';
              const badgeCls =
                score > 50 ? 'text-rose-400 bg-rose-500/10 border-rose-500/20' :
                  score > 25 ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' :
                    'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
              return (
                <div
                  key={i}
                  className="flex items-center gap-2 bg-slate-800/40 rounded-lg px-3 py-2 border border-white/5"
                >
                  <span className="text-[11px] text-slate-500 font-mono w-3.5 shrink-0">{i + 1}.</span>
                  <p className="text-[10px] text-white truncate flex-1" title={name}>{name}</p>
                  <span className={`text-[10px] font-bold border px-1.5 py-0.5 rounded-full ${badgeCls}`}>
                    {score.toFixed(0)}
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};