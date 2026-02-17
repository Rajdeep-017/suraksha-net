import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Polyline, useMap, CircleMarker, Popup } from 'react-leaflet';
import L from 'leaflet';
import polyline from '@mapbox/polyline';
import 'leaflet/dist/leaflet.css';

// Fix for default Leaflet marker icons in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Component to handle auto-zooming to the routes
const MapController = ({ routes }) => {
    const map = useMap();
    useEffect(() => {
        if (routes.length > 0) {
            const firstRoute = polyline.decode(routes[0].polyline);
            const bounds = L.latLngBounds(firstRoute);
            map.fitBounds(bounds, { padding: [50, 50], animate: true });
        }
    }, [routes, map]);
    return null;
};

const SafetyMap = ({ routes }) => {
    // Memoize decoded routes to prevent unnecessary recalculations
    const decodedRoutes = useMemo(() => {
        return routes.map(r => ({
            ...r,
            positions: polyline.decode(r.polyline)
        }));
    }, [routes]);

    return (
        <MapContainer 
            center={[18.5204, 73.8567]} 
            zoom={13} 
            className="h-full w-full z-0"
            zoomControl={false}
        >
            {/* Dark Mode Tiles for high contrast with red/green data */}
            <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
            />

            <MapController routes={routes} />

            {decodedRoutes.map((route, idx) => {
                const isSafest = idx === 0;
                
                return (
                    <Polyline
                        key={idx}
                        positions={route.positions}
                        pathOptions={{
                            color: isSafest ? '#22c55e' : '#64748b', // suraksha-safe vs slate
                            weight: isSafest ? 8 : 4,
                            opacity: isSafest ? 1 : 0.4,
                            lineJoin: 'round',
                            dashArray: isSafest ? '' : '10, 10'
                        }}
                    >
                        <Popup>
                            <div className="p-1">
                                <p className="font-bold text-sm">{isSafest ? "🛡️ Recommended Path" : "Alternative"}</p>
                                <p className="text-xs">Risk Level: {route.risk_percentage}</p>
                            </div>
                        </Popup>
                    </Polyline>
                );
            })}
        </MapContainer>
    );
};

export default SafetyMap;