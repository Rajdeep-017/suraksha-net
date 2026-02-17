// import { Navigation, Search } from 'lucide-react';
// import { SafetyScoreCard } from './SafetyScoreCard';

// interface Props {
//   onAnalyze: () => void;
//   loading: boolean;
//   score?: number;
//   level?: string;
// }

// export const Sidebar = ({ onAnalyze, loading, score, level }: Props) => {
//   return (
//     <div className="w-96 h-full bg-slate-900 border-r border-white/10 p-6 flex flex-col gap-6 z-10 shadow-2xl">
//       <div className="flex items-center gap-2">
//         <div className="bg-emerald-500 p-2 rounded-lg">
//           <Navigation className="text-white" size={20} />
//         </div>
//         <h1 className="text-xl font-black text-white italic">SURAKSHA-NET</h1>
//       </div>

//       <div className="space-y-4">
//         <div className="space-y-2">
//           <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Origin</label>
//           <input className="w-full bg-slate-800 border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50" placeholder="e.g. Pune Station" />
//         </div>
//         <div className="space-y-2">
//           <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Destination</label>
//           <input className="w-full bg-slate-800 border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50" placeholder="e.g. Hinjewadi IT Park" />
//         </div>
        
//         <button 
//           onClick={onAnalyze}
//           disabled={loading}
//           className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-emerald-900/20 disabled:opacity-50"
//         >
//           {loading ? "Analyzing Clusters..." : "Analyze Safety Path"}
//         </button>
//       </div>

//       {score && <SafetyScoreCard score={score} level={level || 'Medium'} />}
//     </div>
//   );
// };

import { Navigation, Search, Loader2 } from "lucide-react";
import { SafetyScoreCard } from "./SafetyScoreCard";

// The error happens because these 4 lines were missing from this interface:
interface SidebarProps {
  start: string;
  setStart: (value: string) => void;
  end: string;
  setEnd: (value: string) => void;
  onAnalyze: () => void;
  loading: boolean;
  score?: number;
  level?: string;
}

export const Sidebar = ({ 
  start, 
  setStart, 
  end, 
  setEnd, 
  onAnalyze, 
  loading, 
  score, 
  level 
}: SidebarProps) => {
  return (
    <div className="w-96 h-full bg-slate-900 border-r border-white/10 p-6 flex flex-col gap-6 z-10 shadow-2xl">
      <div className="flex items-center gap-2">
        <div className="bg-emerald-500 p-2 rounded-lg">
          <Navigation className="text-white" size={20} />
        </div>
        <h1 className="text-xl font-black text-white italic tracking-tighter">SURAKSHA-NET</h1>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Origin</label>
          <div className="relative">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />

    <input 
      className="w-full bg-slate-800 border border-white/5 rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all"
      placeholder="e.g. Pune Station"
      value={start}
      onChange={(e) => setStart(e.target.value)}
    />
  </div>
          
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Destination</label>
          <input 
            className="w-full bg-slate-800 border border-white/5 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all" 
            placeholder="e.g. Hinjewadi IT Park"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
          />
        </div>
        
        <button 
          onClick={onAnalyze}
          disabled={loading || !start || !end}
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="animate-spin h-4 w-4" /> : "Analyze Safety Path"}
        </button>
      </div>

      {score !== undefined && <SafetyScoreCard score={score} level={level || 'Medium'} />}
    </div>
  );
};