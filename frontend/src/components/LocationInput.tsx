import { MapPin, Navigation, Loader2 } from "lucide-react";

interface LocationInputProps {
  startLocation: string;
  endLocation: string;
  onStartLocationChange: (value: string) => void;
  onEndLocationChange: (value: string) => void;
  onAnalyze: () => void;
  loading?: boolean;
}

export function LocationInput({
  startLocation,
  endLocation,
  onStartLocationChange,
  onEndLocationChange,
  onAnalyze,
  loading = false,
}: LocationInputProps) {
  return (
    <div className="glass-panel p-6 rounded-2xl flex flex-col gap-4">
      <div className="flex items-center gap-2 mb-2">
        <Navigation className="h-5 w-5 text-emerald-500" />
        <h2 className="text-sm font-bold uppercase tracking-tight text-slate-300">Route Analysis</h2>
      </div>

      <div className="space-y-3">
        <div className="relative">
          <MapPin className="absolute left-3 top-3 h-4 w-4 text-blue-500" />
          <input
            className="w-full bg-slate-900/50 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all"
            placeholder="Start Location..."
            value={startLocation}
            onChange={(e) => onStartLocationChange(e.target.value)}
          />
        </div>

        <div className="relative">
          <MapPin className="absolute left-3 top-3 h-4 w-4 text-purple-500" />
          <input
            className="w-full bg-slate-900/50 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all"
            placeholder="Destination..."
            value={endLocation}
            onChange={(e) => onEndLocationChange(e.target.value)}
          />
        </div>
      </div>

      <button
        onClick={onAnalyze}
        disabled={loading || !startLocation || !endLocation}
        className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20"
      >
        {loading ? <Loader2 className="animate-spin h-4 w-4" /> : "Analyze Safety Path"}
      </button>
    </div>
  );
}