import { Navigation, Search, Loader2, MapPin, Radio } from "lucide-react";
import { SafetyScoreCard } from "./SafetyScoreCard";
import { useApiHealth } from "../hooks/useApiStatus";
import { useTheme } from "../context/ThemeContext";

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
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className={`w-80 h-full ${isDark ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'} border-r flex flex-col z-10 shadow-2xl overflow-y-auto transition-colors`}>

      {/* ── Header ── */}
      <div className={`px-5 pt-5 pb-4 border-b ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-emerald-500 p-1.5 rounded-lg">
              <Navigation className="text-white" size={16} />
            </div>
            <h1 className={`text-lg font-black italic tracking-tighter ${isDark ? 'text-white' : 'text-slate-900'}`}>SURAKSHA-NET</h1>
          </div>

          {/* Live backend status badge */}
          <div className={`flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-full border ${online === null ? `${isDark ? 'text-slate-400 border-slate-700 bg-slate-800' : 'text-slate-400 border-slate-300 bg-slate-100'}` :
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
      <div className={`px-5 py-4 border-b ${isDark ? 'border-white/5' : 'border-slate-100'} space-y-3`}>
        <p className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          Route Safety Analysis
        </p>

        <div className="space-y-2">
          <label className={`text-[10px] font-bold uppercase ml-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Origin</label>
          {trackingEnabled ? (
            <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 rounded-xl px-3 py-2.5">
              <Radio size={12} className="text-blue-400 animate-pulse shrink-0" />
              <div className="min-w-0">
                <p className="text-blue-300 text-xs font-bold truncate">Live Location (GPS)</p>
                <p className="text-[10px] text-blue-400/70 font-mono truncate">{start || 'Acquiring…'}</p>
              </div>
            </div>
          ) : (
            <div className="relative">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
              <input
                className={`w-full ${isDark ? 'bg-slate-800 border-white/5 text-white placeholder-slate-600' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'} border rounded-xl pl-9 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all`}
                placeholder="e.g. Pune Station"
                value={start}
                onChange={(e) => setStart(e.target.value)}
              />
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label className={`text-[10px] font-bold uppercase ml-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Destination</label>
          <div className="relative">
            <MapPin className={`absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
            <input
              className={`w-full ${isDark ? 'bg-slate-800 border-white/5 text-white placeholder-slate-600' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'} border rounded-xl pl-9 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all`}
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
            : `${isDark ? 'bg-slate-800 border-white/5 text-slate-400 hover:text-white hover:border-white/10' : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-700 hover:border-slate-300'}`
            }`}
        >
          <Radio size={14} className={trackingEnabled ? 'animate-pulse' : ''} />
          {trackingEnabled ? 'Live Tracking On' : 'Enable Live Tracking'}
        </button>

        {/* Travel Time chip */}
        {travelTime != null && travelTime > 0 && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
            <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Est. Travel Time</p>
            <p className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {Math.floor(travelTime / 60)}h {travelTime % 60}m
            </p>
          </div>
        )}
      </div>

      {/* ── Safety Score card ── */}
      {score !== undefined && (
        <div className={`px-5 py-4 border-b ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
          <SafetyScoreCard score={score} level={level || 'Medium'} />
        </div>
      )}

      {/* ── Footer ── */}
      <div className="px-5 py-3 mt-auto">
        <p className={`text-[9px] text-center ${isDark ? 'text-slate-700' : 'text-slate-400'}`}>
          Suraksha-Net AI Road Safety System · 2026
        </p>
      </div>
    </div>
  );
};