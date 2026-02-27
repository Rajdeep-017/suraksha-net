import { Navigation, MapPin, Wifi } from 'lucide-react';
import type { AccidentLocation, Segment } from '../types/safety';
import { formatDistance } from '../hooks/useLiveTracking';

interface RiskTableProps {
  segmentedPath?: Segment[];
  accidentPoints?: AccidentLocation[];
  distanceFromUser: (lat: number, lng: number) => number | null;
  tracking: boolean;
}

const riskLabel = (risk: number) => {
  if (risk > 50) return { text: 'High', cls: 'text-rose-400 bg-rose-500/10 border-rose-500/20' };
  if (risk > 25) return { text: 'Moderate', cls: 'text-amber-400 bg-amber-500/10 border-amber-500/20' };
  return { text: 'Safe', cls: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
};

const distanceColor = (km: number) => {
  if (km < 0.3) return 'text-rose-400 font-bold animate-pulse'; // < 300 m — danger
  if (km < 1.0) return 'text-amber-400 font-semibold';          // < 1 km   — caution
  return 'text-slate-400';                                       // safe distance
};

export const RiskTable = ({ segmentedPath, accidentPoints, distanceFromUser, tracking }: RiskTableProps) => {
  // Build rows from accident points (real locations with Risk_Score) or fall back to route segments
  const useAccidents = accidentPoints && accidentPoints.length > 0;

  if (!useAccidents && (!segmentedPath || segmentedPath.length === 0)) {
    return (
      <div className="flex flex-col bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-xl">
        <div className="px-4 py-3 border-b border-white/5 bg-slate-800/50">
          <h3 className="text-[11px] font-black uppercase tracking-widest text-emerald-400">Route Risk Breakdown</h3>
        </div>
        <p className="px-4 py-8 text-center text-slate-600 text-xs italic">Analyze a route to see risk data.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-xl">

      {/* Header */}
      <div className="px-4 py-3 border-b border-white/5 bg-slate-800/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin size={12} className="text-emerald-400" />
          <h3 className="text-[11px] font-black uppercase tracking-widest text-emerald-400">
            Accident Hotspots
          </h3>
        </div>
        <div className={`flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full border ${tracking
          ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
          : 'text-slate-500 border-slate-700 bg-slate-800'
          }`}>
          <Wifi size={9} className={tracking ? 'animate-pulse' : ''} />
          {tracking ? 'Live' : 'No GPS'}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-y-auto max-h-72">
        {useAccidents ? (
          // Show real accident points with live distance
          <table className="w-full text-left text-xs">
            <thead className="text-[10px] uppercase text-slate-500 bg-slate-950/60 sticky top-0">
              <tr>
                <th className="px-3 py-2">Location</th>
                <th className="px-3 py-2 text-center">Risk</th>
                <th className="px-3 py-2 text-center">
                  <span className="flex items-center justify-center gap-1">
                    <Navigation size={9} /> Distance
                  </span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {accidentPoints!
                .filter(pt => (pt.Latitude ?? pt.lat) != null)
                .map((pt, i) => {
                  const lat = pt.Latitude ?? pt.lat!;
                  const lng = pt.Longitude ?? pt.lng!;
                  const score = pt.Risk_Score ?? 0;
                  const { text, cls } = riskLabel(score);
                  const distKm = distanceFromUser(lat, lng);

                  return (
                    <tr key={i} className="hover:bg-white/5 transition-colors">
                      {/* Location */}
                      <td className="px-3 py-2 max-w-[130px]">
                        <p
                          className="text-white text-[11px] leading-tight truncate"
                          title={pt.place_name ?? pt.City ?? ''}
                        >
                          {pt.place_name ?? pt.City ?? 'Unknown'}
                        </p>
                        {pt.City && pt.place_name && pt.place_name !== pt.City && (
                          <p className="text-[10px] text-slate-600 truncate">{pt.City}</p>
                        )}
                        <p className="text-[9px] text-slate-700 font-mono">{lat.toFixed(3)}, {lng.toFixed(3)}</p>
                      </td>
                      {/* Risk badge */}
                      <td className="px-3 py-2 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${cls}`}>
                          {text}
                        </span>
                        <p className="text-[10px] text-slate-600 mt-0.5">{score.toFixed(0)}</p>
                      </td>
                      {/* Live distance */}
                      <td className="px-3 py-2 text-center">
                        {distKm != null ? (
                          <span className={distanceColor(distKm)}>
                            {formatDistance(distKm)}
                          </span>
                        ) : (
                          <span className="text-slate-600 text-[10px]">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        ) : (
          // Fall back to route segments view
          <table className="w-full text-left text-xs">
            <thead className="text-[10px] uppercase text-slate-500 bg-slate-950/60 sticky top-0">
              <tr>
                <th className="px-3 py-2">Coords</th>
                <th className="px-3 py-2 text-center">Risk</th>
                <th className="px-3 py-2 text-center">Dist.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {[...segmentedPath!]
                .sort((a, b) => b.risk - a.risk)
                .map((seg, i) => {
                  const [lat, lng] = seg.coords[0];
                  const { text, cls } = riskLabel(seg.risk);
                  const distKm = distanceFromUser(lat, lng);
                  return (
                    <tr key={i} className="hover:bg-white/5 transition-colors">
                      <td className="px-3 py-2 font-mono text-slate-400">
                        {lat.toFixed(3)}, {lng.toFixed(3)}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${cls}`}>
                          {text}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        {distKm != null ? (
                          <span className={distanceColor(distKm)}>{formatDistance(distKm)}</span>
                        ) : <span className="text-slate-600">—</span>}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        )}
      </div>

      {/* Legend */}
      <div className="px-4 py-2.5 border-t border-white/5 bg-slate-950/40 flex items-center gap-3 flex-wrap">
        <span className="text-[9px] text-rose-400 font-bold">🔴 &lt;300m</span>
        <span className="text-[9px] text-amber-400 font-bold">🟡 &lt;1km</span>
        <span className="text-[9px] text-slate-500">🟢 Safe</span>
        {!tracking && (
          <span className="text-[9px] text-slate-600 ml-auto italic">Enable GPS for live distance</span>
        )}
      </div>
    </div>
  );
};