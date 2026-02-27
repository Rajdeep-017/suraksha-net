import { useEffect } from 'react';
import {
  MapContainer,
  TileLayer,
  Polyline,
  CircleMarker,
  Popup,
  useMap,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import type { Segment, AccidentLocation } from '../types/safety';

interface NavigateRoute {
  geometry: [number, number][];
  risk: number;
  selected: boolean;
  name: string;
  index: number;
}

interface Props {
  accidents: AccidentLocation[];
  segmentedPath?: Segment[];
  routeGeometry?: [number, number][]; // full road-following path from OSRM
  center: [number, number];
  userPosition?: { lat: number; lng: number; accuracy?: number } | null;
  navigateRoutes?: NavigateRoute[];
  onSelectRoute?: (index: number) => void;
}

/**
 * Flies the map to fit the entire route whenever a new route_geometry arrives.
 * Falls back to a simple setView when there's no route.
 */
function MapController({
  center,
  routeGeometry,
  navigateRoutes,
}: {
  center: [number, number];
  routeGeometry?: [number, number][];
  navigateRoutes?: NavigateRoute[];
}) {
  const map = useMap();

  useEffect(() => {
    // Prefer selected navigate route for bounds fitting
    const selectedRoute = navigateRoutes?.find(r => r.selected);
    const geom = selectedRoute?.geometry ?? routeGeometry;

    if (geom && geom.length >= 2) {
      map.fitBounds(geom as [number, number][], { padding: [60, 60] });
    } else {
      map.setView(center, map.getZoom());
    }
  }, [center, routeGeometry, navigateRoutes, map]);

  return null;
}

/** Maps a risk score (0–100) to a traffic-light colour. */
function riskColor(risk: number): string {
  if (risk > 50) return '#ef4444'; // red   – High
  if (risk > 25) return '#f59e0b'; // amber – Medium
  return '#22c55e';               // green – Safe
}

/** Color palette for alternative navigate routes */
const ROUTE_COLORS = ['#06b6d4', '#8b5cf6', '#f59e0b', '#ec4899', '#14b8a6'];

export const RoadSafetyMap = ({
  accidents,
  segmentedPath,
  routeGeometry,
  center,
  userPosition,
  navigateRoutes,
  onSelectRoute,
}: Props) => {
  const hasRoute = routeGeometry && routeGeometry.length >= 2;
  const hasNavRoutes = navigateRoutes && navigateRoutes.length > 0;

  return (
    <div className="h-full w-full">
      <MapContainer
        center={center}
        zoom={12}
        className="h-full w-full"
        zoomControl={true}
      >
        <MapController center={center} routeGeometry={routeGeometry} navigateRoutes={navigateRoutes} />

        {/* ── OpenStreetMap tiles (proper street map) ── */}
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          maxZoom={19}
        />

        {/* ── Navigate routes: draw ALL routes from Mappls ── */}
        {hasNavRoutes && navigateRoutes!.map((route, _idx) => {
          if (!route.geometry || route.geometry.length < 2) return null;
          const color = route.selected ? '#06b6d4' : ROUTE_COLORS[route.index % ROUTE_COLORS.length];

          return (
            <Polyline
              key={`nav-${route.index}`}
              positions={route.geometry}
              pathOptions={{
                color: route.selected ? color : '#64748b',
                weight: route.selected ? 7 : 4,
                opacity: route.selected ? 0.9 : 0.35,
                lineJoin: 'round',
                lineCap: 'round',
                dashArray: route.selected ? undefined : '8,6',
              }}
              eventHandlers={{
                click: () => onSelectRoute?.(route.index),
              }}
            >
              <Popup>
                <div className="text-xs font-sans">
                  <p className="font-bold">{route.name}</p>
                  <p>Risk: {(route.risk * 100).toFixed(0)}%</p>
                  <p>{route.selected ? '✅ Selected' : 'Click to select'}</p>
                </div>
              </Popup>
            </Polyline>
          );
        })}

        {/* ── Base route: full OSRM geometry (only when no navigate routes) ── */}
        {!hasNavRoutes && hasRoute && (
          <Polyline
            positions={routeGeometry!}
            pathOptions={{
              color: '#3b82f6',   // blue base line
              weight: 8,
              opacity: 0.35,
              lineJoin: 'round',
              lineCap: 'round',
            }}
          />
        )}

        {/* ── Risk overlay: colour-coded segments on top of the base line ── */}
        {!hasNavRoutes && segmentedPath?.map((segment, i) => (
          <Polyline
            key={`seg-${i}`}
            positions={segment.coords}
            pathOptions={{
              color: riskColor(segment.risk),
              weight: 5,
              opacity: 0.9,
              lineJoin: 'round',
              lineCap: 'round',
            }}
          >
            <Popup>
              <div className="text-xs font-sans">
                <p className="font-bold">Risk Score: {segment.risk.toFixed(1)}</p>
                <p>
                  {segment.risk > 50
                    ? '🔴 High Risk'
                    : segment.risk > 25
                      ? '🟡 Moderate Risk'
                      : '🟢 Safe'}
                </p>
              </div>
            </Popup>
          </Polyline>
        ))}

        {/* User live position marker */}
        {userPosition && (
          <>
            {/* Accuracy radius ring */}
            {userPosition.accuracy && userPosition.accuracy < 200 && (
              <CircleMarker
                center={[userPosition.lat, userPosition.lng]}
                radius={Math.min(userPosition.accuracy / 5, 40)}
                pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.08, weight: 1, dashArray: '4,4' }}
              />
            )}
            {/* You-are-here dot */}
            <CircleMarker
              center={[userPosition.lat, userPosition.lng]}
              radius={10}
              pathOptions={{ fillColor: '#3b82f6', color: 'white', weight: 3, fillOpacity: 1 }}
            >
              <Popup><div className="text-xs font-bold text-blue-600">📍 Your location</div></Popup>
            </CircleMarker>
          </>
        )}

        {/* ── Accident hotspot circles ── */}
        {accidents?.map((point, idx) => {
          const lat = point.Latitude ?? point.lat;
          const lng = point.Longitude ?? point.lng;
          if (lat == null || lng == null) return null;

          return (
            <CircleMarker
              key={`acc-${idx}`}
              center={[lat, lng]}
              radius={9}
              pathOptions={{
                fillColor: '#ef4444',
                color: '#fff',
                weight: 2,
                fillOpacity: 0.8,
              }}
            >
              <Popup>
                <div className="text-xs font-sans">
                  <p className="font-bold">{point.City ?? 'Accident Location'}</p>
                  <p>Risk Score: {point.Risk_Score}</p>
                  <p>Road: {point.Road_Condition}</p>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
};