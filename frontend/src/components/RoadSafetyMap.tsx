// import { useEffect, useRef } from 'react';
// import L from 'leaflet';
// import 'leaflet/dist/leaflet.css';
// import type { AccidentLocation } from '../types/safety';

// interface Props {
//   accidents: AccidentLocation[];
//   center?: [number, number];
// }

// export const RoadSafetyMap = ({ accidents, center = [18.5204, 73.8567] }: Props) => {
//   const mapRef = useRef<L.Map | null>(null);
//   const containerRef = useRef<HTMLDivElement>(null);

//   useEffect(() => {
//     if (!containerRef.current || mapRef.current) return;

//     // Initialize map
//     mapRef.current = L.map(containerRef.current).setView(center, 13);
    
//     L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
//       attribution: '© OpenStreetMap contributors'
//     }).addTo(mapRef.current);

//     return () => {
//       mapRef.current?.remove();
//       mapRef.current = null;
//     };
//   }, [center]);

//   useEffect(() => {
//     if (!mapRef.current) return;

//     // Clear existing markers
//     mapRef.current.eachLayer((layer) => {
//       if (layer instanceof L.CircleMarker) mapRef.current?.removeLayer(layer);
//     });

//     // Add accident hotspots
//     accidents.forEach((spot) => {
//       const color = spot.severity === 'high' ? '#ef4444' : '#eab308';
      
//       L.circleMarker([spot.lat, spot.lng], {
//         radius: Math.min(spot.accidents * 2, 20),
//         fillColor: color,
//         color: color,
//         weight: 1,
//         opacity: 0.8,
//         fillOpacity: 0.4,
//       })
//       .bindPopup(`<strong>${spot.description}</strong><br/>Accidents: ${spot.accidents}`)
//       .addTo(mapRef.current!);
//     });
//   }, [accidents]);

//   return <div ref={containerRef} className="h-full w-full rounded-none z-0" />;
// };
// import { useEffect} from 'react';
// import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';

// // This sub-component handles moving the camera when search results come in
// function RecenterMap({ accidents }: { accidents: any[] }) {
//   const map = useMap();
//   useEffect(() => {
//     if (accidents.length > 0) {
//       // Zoom to the first accident found in your dataset
//       map.setView([accidents[0].lat, accidents[0].lng], 12);
//     }
//   }, [accidents, map]);
//   return null;
// }

// export const RoadSafetyMap = ({ accidents }: { accidents: any[] }) => {
//   return (
//     <MapContainer center={[18.5204, 73.8567]} zoom={11} className="h-full w-full">
//       <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      
//       <RecenterMap accidents={accidents} />

//       {accidents.map((point) => (
//         <CircleMarker
//           key={point.id}
//           center={[point.lat, point.lng]}
//           radius={10}
//           pathOptions={{ 
//             fillColor: point.severity === 'high' ? '#ef4444' : '#f59e0b',
//             color: 'white',
//             weight: 2,
//             fillOpacity: 0.8 
//           }}
//         >
//           <Popup>
//             <div className="font-sans">
//               <p className="font-bold text-red-600">{point.description}</p>
//               <p className="text-xs text-gray-500">Location: {point.lat}, {point.lng}</p>
//             </div>
//           </Popup>
//         </CircleMarker>
//       ))}
//     </MapContainer>
//   );
// };
// import { MapContainer, TileLayer, CircleMarker, Popup, Polyline, useMap } from 'react-leaflet';
// import { useEffect } from 'react';

// // Sub-component to handle zooming and fitting the path on screen
// function MapController({ pathCoords }: { pathCoords: [number, number][] }) {
//   const map = useMap();
//   useEffect(() => {
//     if (pathCoords.length >= 2) {
//       // Automatically zoom the map so the entire path is visible
//       map.fitBounds(pathCoords, { padding: [50, 50] });
//     }
//   }, [pathCoords, map]);
//   return null;
// }

// export const RoadSafetyMap = ({ accidents, startCoord, endCoord }: any) => {
//   // Create an array for the path line
//   const pathLine: [number, number][] = (startCoord && endCoord) 
//     ? [startCoord, endCoord] 
//     : [];

//   return (
//     <MapContainer center={[20.5937, 78.9629]} zoom={5} className="h-full w-full">
//       <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      
//       {/* 1. Draw the Path Line */}
//       {pathLine.length > 0 && (
//         <Polyline 
//           positions={pathLine} 
//           pathOptions={{ color: '#10b981', weight: 4, opacity: 0.6, dashArray: '10, 10' }} 
//         />
//       )}

//       {/* 2. Recentering logic */}
//       <MapController pathCoords={pathLine} />

//       {/* 3. Your existing Red Dots (Accidents) */}
//       {accidents.map((point: any) => (
//         <CircleMarker
//           key={point.id}
//           center={[point.lat, point.lng]}
//           radius={8}
//           pathOptions={{ fillColor: '#ef4444', color: 'white', weight: 1, fillOpacity: 0.7 }}
//         >
//           <Popup>{point.description}</Popup>
//         </CircleMarker>
//       ))}
//     </MapContainer>
//   );
// };
import { MapContainer, TileLayer, CircleMarker, Popup, Polyline, useMap } from 'react-leaflet';
import { useEffect } from 'react';

// Helper to auto-zoom the map when new coordinates arrive
function ChangeView({ bounds }: { bounds: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (bounds.length >= 2) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [bounds, map]);
  return null;
}

export const RoadSafetyMap = ({ accidents, startCoord, endCoord,routeGeometry }: any) => {
  // const routePath: [number, number][] = (startCoord && endCoord) ? [startCoord, endCoord] : [];
  const displayPath = (routeGeometry && routeGeometry.length > 0) 
    ? routeGeometry 
    : (startCoord && endCoord ? [startCoord, endCoord] : []);

  return (
    <div className="h-full w-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
      <MapContainer center={[20.5937, 78.9629]} zoom={5} className="h-full w-full">
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        
        {/* Draw the ROAD-FOLLOWING Path */}
        {displayPath.length > 0 && (
          <Polyline 
            positions={displayPath} 
            pathOptions={{ 
              color: '#10b981', 
              weight: 5, 
              opacity: 0.8,
              lineJoin: 'round' 
            }} 
          />
        )}

        {/* Auto-Zoom to the entire route */}
        <ChangeView bounds={displayPath} />

        {/* Render Accident Hotspots */}
        {accidents.map((point: any) => (
          <CircleMarker
            key={point.id}
            center={[point.lat, point.lng]}
            radius={8}
            pathOptions={{ 
              fillColor: point.severity === 'high' ? '#ef4444' : '#f59e0b', 
              color: 'white', 
              weight: 1, 
              fillOpacity: 0.8 
            }}
          >
            <Popup>
              <div className="text-slate-900 font-sans">
                <p className="font-bold">{point.description}</p>
                <p className="text-xs">Risk Impact: {point.severity.toUpperCase()}</p>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
};