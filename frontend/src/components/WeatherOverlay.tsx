import { Thermometer, Wind, Droplets, Eye, AlertTriangle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import type { WeatherData } from '../api/client';

interface Props {
  weather: WeatherData | null;
}

const WEATHER_ICONS: Record<string, string> = {
  Clear: '☀️',
  Cloudy: '☁️',
  Rainy: '🌧️',
  Foggy: '🌫️',
  Stormy: '⛈️',
  Snowy: '❄️',
};

export default function WeatherOverlay({ weather }: Props) {
  const { theme } = useTheme();
  if (!weather) return null;

  const icon = WEATHER_ICONS[weather.condition] || '🌡️';
  const isDark = theme === 'dark';

  return (
    <>
      {/* Storm warning banner */}
      {weather.is_severe && weather.alert_text && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 animate-pulse">
          <div className="flex items-center gap-2 bg-red-600/95 backdrop-blur-md px-5 py-2.5 rounded-xl border border-red-400 text-sm font-bold text-white shadow-2xl shadow-red-500/30">
            <AlertTriangle size={16} className="shrink-0" />
            <span>{weather.alert_text}</span>
          </div>
        </div>
      )}

      {/* Weather card */}
      <div className={`absolute top-4 left-4 z-30 ${isDark ? 'bg-slate-900/90' : 'bg-white/90'} backdrop-blur-xl border ${isDark ? 'border-white/10' : 'border-slate-200'} rounded-2xl p-3 shadow-xl min-w-[180px] transition-colors`}>
        {/* Main row */}
        <div className="flex items-center gap-2.5 mb-2">
          <span className="text-2xl">{icon}</span>
          <div>
            <p className={`text-lg font-black leading-none ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {weather.temp}°C
            </p>
            <p className={`text-[10px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {weather.description}
            </p>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          <StatRow icon={<Thermometer size={10} />} label="Feels" value={`${weather.feels_like}°C`} isDark={isDark} />
          <StatRow icon={<Wind size={10} />} label="Wind" value={`${weather.wind_speed} m/s`} isDark={isDark} />
          <StatRow icon={<Droplets size={10} />} label="Humidity" value={`${weather.humidity}%`} isDark={isDark} />
          <StatRow icon={<Eye size={10} />} label="Vis" value={`${(weather.visibility / 1000).toFixed(1)} km`} isDark={isDark} />
        </div>

        {/* Condition badge */}
        <div className={`mt-2 text-center text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-full border ${
          weather.is_severe
            ? 'text-red-400 bg-red-500/10 border-red-500/20'
            : weather.condition === 'Rainy' || weather.condition === 'Foggy'
              ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
              : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
        }`}>
          {weather.condition} conditions
        </div>
      </div>
    </>
  );
}

function StatRow({ icon, label, value, isDark }: { icon: React.ReactNode; label: string; value: string; isDark: boolean }) {
  return (
    <div className="flex items-center gap-1">
      <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>{icon}</span>
      <span className={`text-[9px] ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>{label}</span>
      <span className={`text-[10px] font-bold ml-auto ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{value}</span>
    </div>
  );
}
