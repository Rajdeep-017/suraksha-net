// 1. Removed unused 'React' import to fix TS6133
import { 
  PieChart, Pie, Cell, ResponsiveContainer 
} from 'recharts';
import { 
  AlertTriangle, 
  Clock, 
  ShieldAlert, 
  MapPin, 
  TrendingDown 
} from 'lucide-react';

interface StatisticsPanelProps {
  data: {
    safety_score: number;
    risk_level: string;
    total_accidents: number;
    high_risk_locations: any[];
    travel_time?: number; // Optional as per backend response
  };
}

const CircularSafetyMeter = ({ score }: { score: number }) => {
  const chartData = [{ value: score }, { value: 100 - score }];
  const getColor = (s: number) => {
    if (s > 70) return '#10b981'; 
    if (s > 40) return '#f59e0b'; 
    return '#ef4444';
  };

  return (
    <div className="relative w-full h-40 flex flex-col items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="80%"
            innerRadius={60}
            outerRadius={80}
            startAngle={180}
            endAngle={0}
            dataKey="value"
            stroke="none"
          >
            <Cell fill={getColor(score)} />
            <Cell fill="rgba(255,255,255,0.05)" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute top-[55%] text-center">
        <span className="text-4xl font-black text-white">{score}%</span>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Safety Index</p>
      </div>
    </div>
  );
};

export const StatisticsPanel = ({ data }: StatisticsPanelProps) => {
  if (!data) return null;

  // Fix TS18048 & TS6133: Define local variable with fallback
  const travelTime = data.travel_time ?? 0;

  return (
    <div className="w-full bg-slate-900/90 backdrop-blur-2xl border-t border-white/10 p-6">
      <div className="max-w-[1600px] mx-auto flex flex-col lg:flex-row items-center gap-10">
        
        <div className="w-full lg:w-1/5 flex justify-center border-b lg:border-b-0 lg:border-r border-white/5 pb-6 lg:pb-0 lg:pr-10">
          <CircularSafetyMeter score={data.safety_score} />
        </div>

        <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-6 w-full">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-slate-500">
              <ShieldAlert size={14} />
              <span className="text-[10px] font-bold uppercase tracking-widest">Risk Level</span>
            </div>
            <p className={`text-2xl font-black ${data.risk_level === 'High' ? 'text-red-500' : 'text-emerald-500'}`}>
              {data.risk_level.toUpperCase()}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-slate-500">
              <AlertTriangle size={14} />
              <span className="text-[10px] font-bold uppercase tracking-widest">Incident Points</span>
            </div>
            <p className="text-2xl font-black text-white">{data.total_accidents}</p>
          </div>

          {/* FIX: Use 'travelTime' local variable instead of 'data.travel_time' */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-slate-500">
              <Clock size={14} />
              <span className="text-[10px] font-bold uppercase tracking-widest">Est. Duration</span>
            </div>
            <p className="text-2xl font-black text-white">
              {Math.floor(travelTime / 60)}h {travelTime % 60}m
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-slate-500">
              <TrendingDown size={14} />
              <span className="text-[10px] font-bold uppercase tracking-widest">Advice</span>
            </div>
            <p className="text-xs font-medium text-slate-400 leading-tight">
              {data.safety_score < 50 
                ? "Caution: High risk detected. Night travel not recommended." 
                : "Standard safety conditions. Maintain highway speeds."}
            </p>
          </div>
        </div>

        <div className="w-full lg:w-1/4 bg-white/5 rounded-2xl p-4 border border-white/5">
          <div className="flex items-center gap-2 mb-3">
            <MapPin size={14} className="text-emerald-500" />
            <span className="text-[10px] font-bold text-white uppercase tracking-widest">Critical Hotspots</span>
          </div>
          <div className="space-y-3">
            {data.high_risk_locations.slice(0, 2).map((loc, i) => (
              <div key={i} className="flex justify-between items-center text-xs">
                <span className="text-slate-400 truncate w-32">{loc.name}</span>
                <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-500 font-bold border border-red-500/20">
                  {loc.accidents} Risks
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};