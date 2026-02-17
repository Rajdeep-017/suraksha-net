import { AlertCircle, MapPin } from "lucide-react";

interface RiskLocation {
  id: string;
  name: string;
  riskLevel: "low" | "medium" | "high";
  accidents: number;
}

export function RiskAnalysisPanel({ locations }: { locations: RiskLocation[] }) {
  return (
    <div className="space-y-3 max-h-96 overflow-y-auto pr-2 scrollbar-hide">
      {locations.map((loc) => (
        <div key={loc.id} className="glass-panel p-4 rounded-xl border-l-4 border-l-rose-500 bg-slate-800/20 hover:bg-slate-800/40 transition-all">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2">
      <MapPin size={14} className="text-slate-500" /> {/* Now it's read! */}
      <h4 className="text-sm font-bold text-slate-200">{loc.name}</h4>
    </div>
            <h4 className="text-sm font-bold text-slate-200">{loc.name}</h4>
            <span className="text-[10px] font-black bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded">
              {loc.riskLevel.toUpperCase()}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-2 text-slate-500">
            <AlertCircle size={12} />
            <span className="text-xs">{loc.accidents} Recent Accidents</span>
          </div>
        </div>
      ))}
    </div>
  );
}