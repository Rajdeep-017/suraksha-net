import { Shield, AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';

interface Props {
  score: number;
  level: string;
}

export const SafetyScoreCard = ({ score, level: _level }: Props) => {
  // Derive tier from score (consistent with backend)
  const tier: 'safe' | 'moderate' | 'high' =
    score >= 70 ? 'safe' : score >= 40 ? 'moderate' : 'high';

  const config = {
    safe: { color: 'text-emerald-400', icon: <CheckCircle className="text-emerald-400" />, label: 'Safe' },
    moderate: { color: 'text-amber-400', icon: <AlertCircle className="text-amber-400" />, label: 'Moderate' },
    high: { color: 'text-rose-400', icon: <AlertTriangle className="text-rose-400" />, label: 'High' },
  }[tier];

  return (
    <div className="glass-panel p-6 rounded-2xl border border-white/10 bg-slate-800/40">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-emerald-500" />
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">
            Route Safety Score
          </h3>
        </div>
        {config.icon}
      </div>

      <div className="flex items-end gap-3">
        <span className={`text-6xl font-black tracking-tighter ${config.color}`}>
          {score}%
        </span>
        <div className="pb-2">
          <p className={`text-xs font-bold uppercase leading-none ${config.color}`}>{config.label} RISK</p>
          <p className="text-[10px] text-slate-500 mt-1 italic">Based on AI cluster analysis</p>
        </div>
      </div>
    </div>
  );
};
