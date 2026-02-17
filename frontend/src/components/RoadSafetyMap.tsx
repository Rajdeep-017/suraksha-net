import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { AccidentLocation } from '../types/safety';

interface Props {
  accidents: AccidentLocation[];
  center?: [number, number];
}

export const RoadSafetyMap = ({ accidents, center = [18.5204, 73.8567] }: Props) => {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Initialize map
    mapRef.current = L.map(containerRef.current).setView(center, 13);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(mapRef.current);

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [center]);

  useEffect(() => {
    if (!mapRef.current) return;

    // Clear existing markers
    mapRef.current.eachLayer((layer) => {
      if (layer instanceof L.CircleMarker) mapRef.current?.removeLayer(layer);
    });

    // Add accident hotspots
    accidents.forEach((spot) => {
      const color = spot.severity === 'high' ? '#ef4444' : '#eab308';
      
      L.circleMarker([spot.lat, spot.lng], {
        radius: Math.min(spot.accidents * 2, 20),
        fillColor: color,
        color: color,
        weight: 1,
        opacity: 0.8,
        fillOpacity: 0.4,
      })
      .bindPopup(`<strong>${spot.description}</strong><br/>Accidents: ${spot.accidents}`)
      .addTo(mapRef.current!);
    });
  }, [accidents]);

  return <div ref={containerRef} className="h-full w-full rounded-none z-0" />;
};