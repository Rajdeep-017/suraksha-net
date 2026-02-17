import { Shield, AlertTriangle, CheckCircle } from 'lucide-react';
import { clsx } from 'clsx';

interface Props {
  score: number;
  level: string;
}

export const SafetyScoreCard = ({ score, level }: Props) => {
  const isSafe = score > 70;

  return (
    <div className="glass-panel p-6 rounded-2xl border border-white/10 bg-slate-800/40">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-emerald-500" /> {/* Now it's being read! */}
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">
            Safety Score
          </h3>
        </div>
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Route Safety Score</h3>
        {isSafe ? <CheckCircle className="text-emerald-400" /> : <AlertTriangle className="text-rose-400" />}
      </div>
      
      <div className="flex items-end gap-3">
        <span className={clsx(
          "text-6xl font-black tracking-tighter",
          isSafe ? "text-emerald-400" : "text-rose-400"
        )}>
          {score}%
        </span>
        <div className="pb-2">
          <p className="text-xs font-bold text-slate-300 uppercase leading-none">{level} RISK</p>
          <p className="text-[10px] text-slate-500 mt-1 italic">Based on AI cluster analysis</p>
        </div>
      </div>
    </div>
  );
};