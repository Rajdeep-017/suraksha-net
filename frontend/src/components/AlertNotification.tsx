import { useEffect } from 'react';
import { X, AlertTriangle, CloudRain, Megaphone, Siren, Wifi, WifiOff } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import type { WSAlert } from '../api/client';

interface Props {
  alerts: WSAlert[];
  connected: boolean;
  onDismiss: (index: number) => void;
}

const ALERT_STYLES: Record<string, { bg: string; border: string; icon: React.ReactNode; text: string }> = {
  zone_entry: {
    bg: 'bg-amber-500/15',
    border: 'border-amber-500/30',
    icon: <AlertTriangle size={16} className="text-amber-400" />,
    text: 'text-amber-300',
  },
  weather_warning: {
    bg: 'bg-blue-500/15',
    border: 'border-blue-500/30',
    icon: <CloudRain size={16} className="text-blue-400" />,
    text: 'text-blue-300',
  },
  admin_broadcast: {
    bg: 'bg-red-500/15',
    border: 'border-red-500/30',
    icon: <Megaphone size={16} className="text-red-400" />,
    text: 'text-red-300',
  },
  sos_nearby: {
    bg: 'bg-purple-500/15',
    border: 'border-purple-500/30',
    icon: <Siren size={16} className="text-purple-400" />,
    text: 'text-purple-300',
  },
};

function AlertToast({ alert, index, onDismiss }: { alert: WSAlert; index: number; onDismiss: (i: number) => void }) {
  const style = ALERT_STYLES[alert.type] || ALERT_STYLES.zone_entry;

  // Auto-dismiss after 10 seconds
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(index), 10000);
    return () => clearTimeout(timer);
  }, [index, onDismiss]);

  return (
    <div
      className={`${style.bg} border ${style.border} rounded-xl px-4 py-3 shadow-2xl backdrop-blur-md animate-slide-down flex items-start gap-3 max-w-[380px]`}
      style={{
        animation: 'slideDown 0.3s ease-out forwards',
      }}
    >
      <div className="shrink-0 mt-0.5">{style.icon}</div>
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-bold ${style.text}`}>{alert.message}</p>
        {alert.zone && (
          <p className="text-[9px] text-slate-500 mt-0.5">Zone: {alert.zone}</p>
        )}
        <p className="text-[9px] text-slate-600 mt-0.5">
          {new Date(alert.timestamp).toLocaleTimeString()}
        </p>
      </div>
      <button
        onClick={() => onDismiss(index)}
        className="shrink-0 text-slate-500 hover:text-white transition-colors"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export default function AlertNotifications({ alerts, connected, onDismiss }: Props) {
  const _theme = useTheme(); // keep context subscription
  void _theme;
  const visibleAlerts = alerts.slice(0, 3);

  return (
    <>
      {/* Connection status indicator */}
      <div className={`fixed top-4 right-4 z-[9990] flex items-center gap-1.5 text-[9px] font-bold px-2 py-1 rounded-full border backdrop-blur-md ${
        connected
          ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
          : 'text-slate-500 border-slate-600 bg-slate-800/50'
      }`}>
        {connected ? <Wifi size={10} /> : <WifiOff size={10} />}
        {connected ? 'Live' : 'Offline'}
      </div>

      {/* Alert toasts — stacked from top-right */}
      <div className="fixed top-12 right-4 z-[9990] space-y-2">
        {visibleAlerts.map((alert, i) => (
          <AlertToast
            key={`${alert.timestamp}-${i}`}
            alert={alert}
            index={i}
            onDismiss={onDismiss}
          />
        ))}
      </div>

      {/* CSS for slide animation */}
      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-12px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </>
  );
}
