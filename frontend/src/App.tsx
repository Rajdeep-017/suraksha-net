import { useState, useMemo, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { RoadSafetyMap } from './components/RoadSafetyMap';
import { RiskAnalysisPanel } from './components/RiskAnalysisPanel';
import { RiskTable } from './components/RiskTable';
import { NavigateSafePanel } from './components/NavigateSafePanel';
import { ProximityAlert } from './components/ProximityAlert';
import { RiskWarningToast } from './components/RiskWarningToast';
import { useRoadSafety } from './hooks/useRoadSafety';
import { useNavigateSafe } from './hooks/useApiStatus';
import { useLiveTracking } from './hooks/useLiveTracking';
import { useEffect } from 'react';
import { ShieldAlert, MapPin, Route, Loader2, AlertTriangle } from 'lucide-react';

// ── Tab definition ──────────────────────────────────────────────────────────
type TabId = 'risk' | 'hotspots' | 'navigate';
const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'risk', label: 'Risk', icon: <ShieldAlert size={14} /> },
  { id: 'hotspots', label: 'Hotspots', icon: <MapPin size={14} /> },
  { id: 'navigate', label: 'Navigate', icon: <Route size={14} /> },
];

export default function App() {
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [trackingEnabled, setTrackingEnabled] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('risk');
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
  const [riskWarning, setRiskWarning] = useState<{ name: string; pct: string } | null>(null);

  const { analyzeRoute, loading, data, accidents, error } = useRoadSafety();
  const { navigateSafe, loading: navLoading, result: navResult, error: navError } = useNavigateSafe();
  const { position, tracking, alerts, distanceFromUser } = useLiveTracking(
    accidents ?? [],
    { enabled: trackingEnabled, alertRadiusKm: 0.5 }
  );

  // Auto-fill start with GPS when tracking turns on
  useEffect(() => {
    if (trackingEnabled && position) {
      setStart(`${position.lat.toFixed(5)}, ${position.lng.toFixed(5)}`);
    }
  }, [trackingEnabled, position?.lat, position?.lng]);

  // Reset selected route when new results arrive
  useEffect(() => {
    if (navResult) {
      setSelectedRouteIndex(0);
      setActiveTab('navigate'); // Auto-show routes when results arrive
    }
  }, [navResult]);

  const handleAnalyze = async () => {
    if (!start || !end) return;
    setActiveTab('risk'); // Switch to risk tab when analysis starts
    const result = await analyzeRoute(start, end);
    if (result?.start_coords && result?.end_coords) {
      await navigateSafe({
        origin_lat: result.start_coords[0],
        origin_lon: result.start_coords[1],
        dest_lat: result.end_coords[0],
        dest_lon: result.end_coords[1],
        city: start.split(',')[0].trim(),
      });
    }
  };

  const handleToggleTracking = () => {
    setTrackingEnabled(prev => !prev);
    if (trackingEnabled) setStart('');
  };

  // Build unified route list for map and panel
  const allRoutes = useMemo(() => {
    if (!navResult) return [];
    return [navResult.recommended_safe_path, ...navResult.alternatives];
  }, [navResult]);

  // Build navigate route objects for the map
  const navigateRoutes = useMemo(() => {
    return allRoutes.map((route, i) => ({
      geometry: route.route_geometry || [],
      risk: route.average_risk,
      selected: i === selectedRouteIndex,
      name: route.name,
      index: i,
    }));
  }, [allRoutes, selectedRouteIndex]);

  const handleSelectRoute = useCallback((index: number) => {
    setSelectedRouteIndex(index);
    setActiveTab('navigate');

    // Show warning for high-risk routes (≥ 40% and not the recommended)
    const route = allRoutes[index];
    if (route && index > 0) {
      const risk = parseInt(route.risk_percentage);
      if (risk >= 40) {
        setRiskWarning({ name: route.name, pct: route.risk_percentage });
      }
    }
  }, [allRoutes]);

  const mapCenter: [number, number] =
    position && trackingEnabled
      ? [position.lat, position.lng]
      : data?.start_coords
        ? [data.start_coords[0], data.start_coords[1]]
        : accidents && accidents.length > 0
          ? [accidents[0].Latitude ?? accidents[0].lat ?? 18.5204, accidents[0].Longitude ?? accidents[0].lng ?? 73.8567]
          : [18.5204, 73.8567];

  const hasData = !!(data || navResult || navLoading || loading);
  const isAnalyzing = loading || navLoading;

  return (
    <div className="flex h-full w-full overflow-hidden bg-[#0b0f1a]">

      {/* ── LEFT: Input Sidebar ──────────────────────────────────────── */}
      <Sidebar
        onAnalyze={handleAnalyze}
        loading={loading}
        score={data?.safety_score}
        level={data?.risk_level}
        start={start}
        setStart={setStart}
        end={end}
        setEnd={setEnd}
        travelTime={data?.travel_time}
        trackingEnabled={trackingEnabled}
        onToggleTracking={handleToggleTracking}
      />

      {/* ── CENTER: Map ─────────────────────────────────────────────── */}
      <main className="relative flex-1 overflow-hidden">
        <RoadSafetyMap
          accidents={accidents ?? []}
          segmentedPath={data?.segmented_path}
          routeGeometry={data?.route_geometry}
          center={mapCenter}
          userPosition={trackingEnabled ? position : null}
          navigateRoutes={navigateRoutes.length > 0 ? navigateRoutes : undefined}
          onSelectRoute={handleSelectRoute}
        />

        {/* Proximity alert — floats top-center over map only */}
        <ProximityAlert alerts={alerts} position={position} />

        {/* Risk warning toast */}
        {riskWarning && (
          <RiskWarningToast
            routeName={riskWarning.name}
            riskPercentage={riskWarning.pct}
            onClose={() => setRiskWarning(null)}
          />
        )}

        {/* Loading overlay — top-center over map */}
        {isAnalyzing && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-slate-900/95 backdrop-blur-md px-5 py-2.5 rounded-xl border border-white/10 text-sm font-medium text-slate-300 shadow-2xl">
            <Loader2 className="w-4 h-4 border-emerald-500 animate-spin" />
            {navLoading ? 'Finding safest route…' : 'Analyzing safety data…'}
          </div>
        )}

        {/* Error banner */}
        {error && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-red-600/90 backdrop-blur-md px-5 py-2.5 rounded-xl border border-red-400 text-sm font-semibold text-white shadow-2xl">
            <AlertTriangle size={16} /><span>{error}</span>
          </div>
        )}
      </main>

      {/* ── RIGHT: Tabbed results panel ─────────────────────────────── */}
      {hasData && (
        <aside className="w-[300px] shrink-0 h-full bg-[#0d1220] border-l border-white/8 flex flex-col z-10 shadow-2xl">

          {/* Tab bar */}
          <div className="flex border-b border-white/8 shrink-0">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex flex-col items-center gap-1 py-3 text-[10px] font-bold uppercase tracking-widest transition-all border-b-2 ${activeTab === tab.id
                  ? 'text-emerald-400 border-emerald-500 bg-emerald-500/5'
                  : 'text-slate-500 border-transparent hover:text-slate-300 hover:bg-white/3'
                  }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content — fills rest of panel, scrollable */}
          <div className="flex-1 overflow-y-auto">

            {/* ── RISK TAB ── */}
            {activeTab === 'risk' && (
              <div className="p-4">
                {loading ? (
                  <div className="flex flex-col items-center gap-3 py-16 text-slate-600">
                    <Loader2 className="animate-spin" size={28} />
                    <p className="text-xs">Analyzing route risk…</p>
                  </div>
                ) : data ? (
                  <RiskAnalysisPanel data={data} />
                ) : (
                  <EmptyState icon={<ShieldAlert size={32} />} message="Analyze a route to see its risk profile." />
                )}
              </div>
            )}

            {/* ── HOTSPOTS TAB ── */}
            {activeTab === 'hotspots' && (
              <div className="p-4">
                {loading ? (
                  <div className="flex flex-col items-center gap-3 py-16 text-slate-600">
                    <Loader2 className="animate-spin" size={28} />
                    <p className="text-xs">Loading hotspots…</p>
                  </div>
                ) : (data?.accident_points?.length ?? 0) > 0 || (data?.segmented_path?.length ?? 0) > 0 ? (
                  <RiskTable
                    segmentedPath={data?.segmented_path}
                    accidentPoints={data?.accident_points}
                    distanceFromUser={distanceFromUser}
                    tracking={tracking}
                  />
                ) : (
                  <EmptyState icon={<MapPin size={32} />} message="No hotspot data yet. Analyze a route first." />
                )}
              </div>
            )}

            {/* ── NAVIGATE TAB ── */}
            {activeTab === 'navigate' && (
              <div className="p-4">
                {!navResult && !navLoading && !navError ? (
                  <EmptyState icon={<Route size={32} />} message="Safe routes will appear here after analysis." />
                ) : (
                  <NavigateSafePanel
                    result={navResult}
                    loading={navLoading}
                    error={navError}
                    selectedIndex={selectedRouteIndex}
                    onSelectRoute={handleSelectRoute}
                  />
                )}
              </div>
            )}

          </div>

          {/* Bottom status strip */}
          <div className="shrink-0 px-4 py-2 border-t border-white/5 flex items-center justify-between">
            <span className="text-[9px] text-slate-700 font-mono uppercase tracking-widest">Suraksha-Net AI</span>
            {data && (
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${(data.safety_score ?? 0) >= 70 ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/8' :
                (data.safety_score ?? 0) >= 40 ? 'text-amber-400 border-amber-500/20 bg-amber-500/8' :
                  'text-rose-400 border-rose-500/20 bg-rose-500/8'
                }`}>
                Safety {data.safety_score ?? 0}%
              </span>
            )}
          </div>
        </aside>
      )}
    </div>
  );
}

/* ── Empty state placeholder ───────────────────────────────────────────── */
function EmptyState({ icon, message }: { icon: React.ReactNode; message: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <div className="text-slate-700">{icon}</div>
      <p className="text-xs text-slate-600 max-w-[200px] leading-relaxed">{message}</p>
    </div>
  );
}