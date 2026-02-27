import { AlertTriangle, Navigation, X } from 'lucide-react';
import { useState } from 'react';
import { formatDistance } from '../hooks/useLiveTracking';

interface Alert {
    id: string;
    distanceKm: number;
    description?: string;
    riskScore?: number;
}

interface Props {
    alerts: Alert[];
    position: { lat: number; lng: number; speed?: number } | null;
}

export const ProximityAlert = ({ alerts, position }: Props) => {
    const [dismissed, setDismissed] = useState<Set<string>>(new Set());

    const visible = alerts.filter(a => !dismissed.has(a.id));
    if (visible.length === 0 || !position) return null;

    // Colour by closest alert distance
    const closest = visible[0].distanceKm;
    const urgency =
        closest < 0.15 ? 'border-red-500 bg-red-600/90'       // < 150 m — immediate
            : closest < 0.3 ? 'border-orange-500 bg-orange-600/80' // < 300 m — urgent
                : 'border-amber-500 bg-amber-600/70';                   // < 500 m — warning

    const speedKmh = position.speed != null ? Math.round(position.speed * 3.6) : null;

    return (
        <div className={`absolute top-16 left-1/2 -translate-x-1/2 z-50 w-96 backdrop-blur-xl border rounded-2xl shadow-2xl overflow-hidden ${urgency}`}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/20">
                <div className="flex items-center gap-2">
                    <AlertTriangle size={16} className="text-white animate-pulse" />
                    <span className="text-white font-black text-sm uppercase tracking-wider">
                        ⚠ Accident Zone Ahead
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    {speedKmh != null && (
                        <span className="text-white/80 text-xs font-bold">
                            {speedKmh} km/h
                        </span>
                    )}
                    <button
                        onClick={() => setDismissed(new Set(visible.map(a => a.id)))}
                        className="text-white/60 hover:text-white transition-colors"
                    >
                        <X size={14} />
                    </button>
                </div>
            </div>

            {/* Alert rows */}
            <div className="divide-y divide-white/10 max-h-40 overflow-y-auto">
                {visible.map(alert => (
                    <div key={alert.id} className="flex items-center justify-between px-4 py-2.5">
                        <div className="flex items-center gap-2.5">
                            <Navigation size={14} className="text-white/80 shrink-0" />
                            <div>
                                <p className="text-white text-xs font-semibold leading-tight">
                                    {alert.description ?? 'High-risk accident area'}
                                </p>
                                {alert.riskScore != null && (
                                    <p className="text-white/60 text-[10px]">Risk score: {alert.riskScore}</p>
                                )}
                            </div>
                        </div>
                        <span className={`text-white font-black text-sm shrink-0 ${alert.distanceKm < 0.15 ? 'animate-pulse' : ''
                            }`}>
                            {formatDistance(alert.distanceKm)}
                        </span>
                    </div>
                ))}
            </div>

            {/* Footer hint */}
            <div className="px-4 py-1.5 bg-black/20 text-center">
                <p className="text-white/60 text-[10px]">Reduce speed · Stay alert · Drive safely</p>
            </div>
        </div>
    );
};
