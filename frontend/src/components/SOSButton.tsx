import { useState, useEffect, useCallback } from 'react';
import { Phone, X, CheckCircle, AlertTriangle } from 'lucide-react';
import { safetyApi } from '../api/client';
import { useTheme } from '../context/ThemeContext';

interface Props {
  position: { lat: number; lng: number } | null;
  nearestHotspot?: string;
  driverName?: string;
}

type SOSState = 'idle' | 'countdown' | 'sending' | 'sent' | 'error';

export default function SOSButton({ position, nearestHotspot, driverName }: Props) {
  const { theme } = useTheme();
  const [state, setState] = useState<SOSState>('idle');
  const [countdown, setCountdown] = useState(5);
  const [sosId, setSosId] = useState<string | null>(null);

  const sendSOS = useCallback(async () => {
    setState('sending');
    try {
      const res = await safetyApi.sendSOS({
        lat: position?.lat ?? 0,
        lon: position?.lng ?? 0,
        timestamp: new Date().toISOString(),
        nearest_hotspot: nearestHotspot,
        driver_name: driverName,
      });
      setSosId(res.data.sos_id);
      setState('sent');
      // Auto-reset after 10 seconds
      setTimeout(() => {
        setState('idle');
        setSosId(null);
      }, 10000);
    } catch {
      setState('error');
      setTimeout(() => setState('idle'), 5000);
    }
  }, [position, nearestHotspot, driverName]);

  // Countdown timer
  useEffect(() => {
    if (state !== 'countdown') return;
    if (countdown <= 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      sendSOS();
      return;
    }
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [state, countdown, sendSOS]);

  const startSOS = () => {
    setState('countdown');
    setCountdown(5);
  };

  const cancelSOS = () => {
    setState('idle');
    setCountdown(5);
  };

  const isDark = theme === 'dark';

  // Idle state — floating SOS button
  if (state === 'idle') {
    return (
      <button
        onClick={startSOS}
        className="fixed bottom-6 left-6 z-[9998] group"
        title="Emergency SOS"
      >
        <div className="relative">
          {/* Pulse ring */}
          <div className="absolute inset-0 bg-red-500 rounded-2xl animate-ping opacity-20" />
          {/* Button */}
          <div className="relative bg-red-600 hover:bg-red-500 text-white p-4 rounded-2xl shadow-2xl shadow-red-500/30 transition-all hover:scale-105 active:scale-95 flex items-center gap-2">
            <Phone size={20} />
            <span className="text-xs font-black uppercase tracking-wider hidden group-hover:inline">SOS</span>
          </div>
        </div>
      </button>
    );
  }

  // Countdown / sending / sent states — overlay panel
  return (
    <div className="fixed inset-0 z-[9998] flex items-end justify-center pb-8 pointer-events-none">
      <div className={`pointer-events-auto w-[340px] ${isDark ? 'bg-[#0b0f1a]' : 'bg-white'} border ${isDark ? 'border-white/10' : 'border-slate-200'} rounded-2xl shadow-2xl overflow-hidden transition-colors`}>

        {/* Countdown */}
        {state === 'countdown' && (
          <>
            <div className="bg-red-600 px-5 py-4 text-center relative overflow-hidden">
              {/* Animated progress bar */}
              <div
                className="absolute bottom-0 left-0 h-1 bg-white/40 transition-all duration-1000 ease-linear"
                style={{ width: `${(countdown / 5) * 100}%` }}
              />
              <AlertTriangle size={28} className="text-white mx-auto mb-2 animate-bounce" />
              <p className="text-white text-sm font-bold">Sending SOS in</p>
              <p className="text-5xl font-black text-white mt-1">{countdown}</p>
              <p className="text-white/70 text-[10px] mt-1 font-medium">seconds</p>
            </div>

            <div className="p-4 space-y-3">
              <div className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'} space-y-1`}>
                <p>📍 Location: {position ? `${position.lat.toFixed(5)}, ${position.lng.toFixed(5)}` : 'Unknown'}</p>
                {nearestHotspot && <p>⚠️ Nearest risk zone: {nearestHotspot}</p>}
              </div>
              <button
                onClick={cancelSOS}
                className={`w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
              >
                <X size={16} />
                Cancel SOS
              </button>
            </div>
          </>
        )}

        {/* Sending */}
        {state === 'sending' && (
          <div className="p-8 text-center">
            <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Sending Emergency SOS...</p>
            <p className={`text-[10px] mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Contacting emergency services</p>
          </div>
        )}

        {/* Sent */}
        {state === 'sent' && (
          <div className="p-6 text-center">
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-full w-14 h-14 flex items-center justify-center mx-auto mb-3">
              <CheckCircle size={28} className="text-emerald-400" />
            </div>
            <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>SOS Sent Successfully</p>
            {sosId && (
              <p className="text-[11px] text-emerald-400 font-mono mt-1">Ref: {sosId}</p>
            )}
            <p className={`text-[10px] mt-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              Emergency services have been notified. Stay safe.
            </p>

            <div className={`mt-4 p-3 rounded-xl ${isDark ? 'bg-slate-800/50' : 'bg-slate-50'} text-left space-y-1`}>
              <p className={`text-[10px] font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Emergency Contacts:</p>
              <p className={`text-[11px] ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>🚑 Ambulance: 108</p>
              <p className={`text-[11px] ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>🚔 Police: 100</p>
              <p className={`text-[11px] ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>🚒 Fire: 101</p>
            </div>
          </div>
        )}

        {/* Error */}
        {state === 'error' && (
          <div className="p-6 text-center">
            <AlertTriangle size={28} className="text-red-400 mx-auto mb-2" />
            <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Could Not Send SOS</p>
            <p className={`text-[10px] mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              Please call emergency services directly: 112
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
