import { Navigation, Search, Loader2, MapPin, Radio } from "lucide-react";
import { SafetyScoreCard } from "./SafetyScoreCard";
import { useApiHealth } from "../hooks/useApiStatus";

interface SidebarProps {
  start: string;
  setStart: (value: string) => void;
  end: string;
  setEnd: (value: string) => void;
  onAnalyze: () => void;
  loading: boolean;
  score?: number;
  level?: string;
  travelTime?: number;
  trackingEnabled: boolean;
  onToggleTracking: () => void;
}

export const Sidebar = ({
  start,
  setStart,
  end,
  setEnd,
  onAnalyze,
  loading,
  score,
  level,
  travelTime,
  trackingEnabled,
  onToggleTracking,
}: SidebarProps) => {
  const { health, online } = useApiHealth();

  return (
    <div className="w-80 h-full bg-slate-900 border-r border-white/10 flex flex-col z-10 shadow-2xl overflow-y-auto">

      {/* ── Header ── */}
      <div className="px-5 pt-5 pb-4 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-emerald-500 p-1.5 rounded-lg">
              <Navigation className="text-white" size={16} />
            </div>
            <h1 className="text-lg font-black text-white italic tracking-tighter">SURAKSHA-NET</h1>
          </div>

          {/* Live backend status badge */}
          <div className={`flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-full border ${online === null ? 'text-slate-400 border-slate-700 bg-slate-800' :
            online ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' :
              'text-red-400 border-red-500/30 bg-red-500/10'
            }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${online === null ? 'bg-slate-500' :
              online ? 'bg-emerald-400 animate-pulse' :
                'bg-red-400'
              }`} />
            {online === null ? 'Checking…' : online ? 'Online' : 'Offline'}
          </div>
        </div>

        {/* Model status sub-line */}
        {online && health && (
          <p className={`text-[10px] mt-1.5 ${health.model_loaded ? 'text-emerald-500/70' : 'text-amber-500/70'}`}>
            {health.model_loaded ? '✓ ML models loaded' : '⚠ ML models not loaded (run train.py)'}
          </p>
        )}
      </div>

      {/* ── Analyze Route section ── */}
      <div className="px-5 py-4 border-b border-white/5 space-y-3">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
          Route Safety Analysis
        </p>

        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Origin</label>
          {trackingEnabled ? (
            // GPS chip — shows live coordinates, read-only
            <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 rounded-xl px-3 py-2.5">
              <Radio size={12} className="text-blue-400 animate-pulse shrink-0" />
              <div className="min-w-0">
                <p className="text-blue-300 text-xs font-bold truncate">Live Location (GPS)</p>
                <p className="text-[10px] text-blue-400/70 font-mono truncate">{start || 'Acquiring…'}</p>
              </div>
            </div>
          ) : (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
              <input
                className="w-full bg-slate-800 border border-white/5 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all text-white placeholder-slate-600"
                placeholder="e.g. Pune Station"
                value={start}
                onChange={(e) => setStart(e.target.value)}
              />
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Destination</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
            <input
              className="w-full bg-slate-800 border border-white/5 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all text-white placeholder-slate-600"
              placeholder="e.g. Hinjewadi IT Park"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
            />
          </div>
        </div>

        <button
          onClick={onAnalyze}
          disabled={loading || !start || !end}
          className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
        >
          {loading ? <Loader2 className="animate-spin h-4 w-4" /> : 'Analyze Safety Path'}
        </button>

        {/* Live Tracking toggle */}
        <button
          onClick={onToggleTracking}
          className={`w-full font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 text-sm border ${trackingEnabled
            ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/20'
            : 'bg-slate-800 border-white/5 text-slate-400 hover:text-white hover:border-white/10'
            }`}
        >
          <Radio size={14} className={trackingEnabled ? 'animate-pulse' : ''} />
          {trackingEnabled ? 'Live Tracking On' : 'Enable Live Tracking'}
        </button>

        {/* Travel Time chip */}
        {travelTime != null && travelTime > 0 && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
            <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Est. Travel Time</p>
            <p className="text-xl font-black text-white">
              {Math.floor(travelTime / 60)}h {travelTime % 60}m
            </p>
          </div>
        )}
      </div>

      {/* ── Safety Score card ── */}
      {score !== undefined && (
        <div className="px-5 py-4 border-b border-white/5">
          <SafetyScoreCard score={score} level={level || 'Medium'} />
        </div>
      )}

      {/* ── Footer ── */}
      <div className="px-5 py-3 mt-auto">
        <p className="text-[9px] text-slate-700 text-center">
          Suraksha-Net AI Road Safety System · 2026
        </p>
      </div>
    </div>
  );
};