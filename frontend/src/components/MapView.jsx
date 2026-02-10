import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';
import 'leaflet/dist/leaflet.css';

// This sub-component handles the Heatmap layer
function HeatmapLayer({ points }) {
  const map = useMap();

  useEffect(() => {
    if (!points || points.length === 0) return;

    // Format: [lat, lng, intensity]
    const heatData = points.map(p => [p.Latitude, p.Longitude, p.Risk_Score / 10]);
    
    const heatLayer = L.heatLayer(heatData, {
      radius: 25,
      blur: 15,
      maxZoom: 10,
      gradient: { 0.4: 'blue', 0.6: 'lime', 0.8: 'yellow', 1.0: 'red' }
    }).addTo(map);

    return () => map.removeLayer(heatLayer);
  }, [points, map]);

  return null;
}

const MapView = () => {
  const [accidents, setAccidents] = useState([]);

  useEffect(() => {
    // Fetch data from our FastAPI backend
    fetch('http://127.0.0.1:8000/api/accidents')
      .then(res => res.json())
      .then(data => setAccidents(data))
      .catch(err => console.error("Error loading map data:", err));
  }, []);

  return (
    <div className="map-wrapper" style={{ height: '500px', width: '100%' }}>
      <MapContainer center={[20.5937, 78.9629]} zoom={5} style={{ height: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />
        <HeatmapLayer points={accidents} />
      </MapContainer>
    </div>
  );
};

export default MapView;