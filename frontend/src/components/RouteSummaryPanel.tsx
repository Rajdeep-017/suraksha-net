import { useState, useEffect } from 'react';
import { Sparkles, Loader2, RefreshCw } from 'lucide-react';
import { safetyApi } from '../api/client';
import { useTheme } from '../context/ThemeContext';
import type { SafetyResponse } from '../types/safety';

interface Props {
  data: SafetyResponse;
  start: string;
  end: string;
}

export default function RouteSummaryPanel({ data, start, end }: Props) {
  const { theme } = useTheme();
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const isDark = theme === 'dark';

  const fetchSummary = async () => {
    setLoading(true);
    setError(false);
    try {
      const topHotspots = (data.accident_points ?? [])
        .slice(0, 5)
        .map(p => p.place_name || p.City || 'Unknown');

      const res = await safetyApi.getRouteSummary({
        start,
        end,
        safety_score: data.safety_score,
        risk_level: data.risk_level,
        total_accidents: data.total_accidents,
        travel_time: data.travel_time ?? 0,
        top_hotspots: topHotspots,
      });
      setSummary(res.data.summary);
    } catch {
      setError(true);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!data || !start || !end) return;
    let cancelled = false;
    const doFetch = async () => {
      setLoading(true);
      setError(false);
      try {
        const topHotspots = (data.accident_points ?? [])
          .slice(0, 5)
          .map(p => p.place_name || p.City || 'Unknown');
        const res = await safetyApi.getRouteSummary({
          start,
          end,
          safety_score: data.safety_score,
          risk_level: data.risk_level,
          total_accidents: data.total_accidents,
          travel_time: data.travel_time ?? 0,
          top_hotspots: topHotspots,
        });
        if (!cancelled) setSummary(res.data.summary);
      } catch {
        if (!cancelled) setError(true);
      }
      if (!cancelled) setLoading(false);
    };
    doFetch();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.safety_score, start, end]);

  return (
    <div className={`mt-3 ${isDark ? 'bg-slate-900/60' : 'bg-white/80'} backdrop-blur-xl border ${isDark ? 'border-white/10' : 'border-slate-200'} rounded-2xl overflow-hidden shadow-xl transition-colors`}>
      {/* Header */}
      <div className={`px-4 py-2.5 border-b ${isDark ? 'border-white/5 bg-slate-800/50' : 'border-slate-100 bg-slate-50/80'} flex items-center gap-2`}>
        <Sparkles size={13} className="text-purple-400" />
        <h3 className="text-[11px] font-black uppercase tracking-widest text-purple-400 flex-1">
          AI Route Summary
        </h3>
        <button
          onClick={fetchSummary}
          disabled={loading}
          className="text-slate-500 hover:text-purple-400 transition-colors disabled:opacity-30"
          title="Regenerate summary"
        >
          <RefreshCw size={11} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Content */}
      <div className="px-4 py-3">
        {loading ? (
          <div className="flex items-center gap-2 py-4">
            <Loader2 size={14} className="animate-spin text-purple-400" />
            <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Generating AI summary…</span>
          </div>
        ) : error ? (
          <p className="text-[11px] text-red-400 py-2">Could not generate summary. Check your Groq API key.</p>
        ) : summary ? (
          <p className={`text-[11px] leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            {summary}
          </p>
        ) : null}
      </div>
    </div>
  );
}
