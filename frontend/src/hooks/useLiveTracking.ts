import { useState, useEffect, useCallback, useRef } from 'react';

export interface GeoPosition {
    lat: number;
    lng: number;
    accuracy: number;  // metres
    heading?: number;  // degrees (0 = north)
    speed?: number;    // m/s
}

/**
 * Haversine formula — returns distance in kilometres between two lat/lng points.
 */
export function haversineKm(
    lat1: number, lng1: number,
    lat2: number, lng2: number
): number {
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Human-readable distance string: "120 m" or "3.4 km". */
export function formatDistance(km: number): string {
    if (km < 1) return `${Math.round(km * 1000)} m`;
    return `${km.toFixed(1)} km`;
}

interface UseLiveTrackingOptions {
    /** How close (in km) to an accident point triggers an alert. Default 0.5 km. */
    alertRadiusKm?: number;
    /** Disabled when false — lets the user toggle tracking. Default true. */
    enabled?: boolean;
}

interface ProximityAlert {
    id: string;
    lat: number;
    lng: number;
    distanceKm: number;
    description?: string;
    riskScore?: number;
}

export function useLiveTracking(
    accidentPoints: { lat?: number; lng?: number; Latitude?: number; Longitude?: number; description?: string; Risk_Score?: number; id?: string }[],
    options: UseLiveTrackingOptions = {}
) {
    const { alertRadiusKm = 0.5, enabled = true } = options;

    const [position, setPosition] = useState<GeoPosition | null>(null);
    const [geoError, setGeoError] = useState<string | null>(null);
    const [alerts, setAlerts] = useState<ProximityAlert[]>([]);
    const [tracking, setTracking] = useState(false);

    // Keep latest accidentPoints in a ref so the watchPosition callback always has fresh data
    const pointsRef = useRef(accidentPoints);
    useEffect(() => { pointsRef.current = accidentPoints; }, [accidentPoints]);

    const checkProximity = useCallback((pos: GeoPosition) => {
        const nearby: ProximityAlert[] = [];
        for (const pt of pointsRef.current) {
            const ptLat = pt.Latitude ?? pt.lat;
            const ptLng = pt.Longitude ?? pt.lng;
            if (ptLat == null || ptLng == null) continue;
            const distKm = haversineKm(pos.lat, pos.lng, ptLat, ptLng);
            if (distKm <= alertRadiusKm) {
                nearby.push({
                    id: pt.id ?? `${ptLat}-${ptLng}`,
                    lat: ptLat,
                    lng: ptLng,
                    distanceKm: distKm,
                    description: pt.description,
                    riskScore: pt.Risk_Score,
                });
            }
        }
        // Sort by closest first
        nearby.sort((a, b) => a.distanceKm - b.distanceKm);
        setAlerts(nearby);
    }, [alertRadiusKm]);

    useEffect(() => {
        if (!enabled || !navigator.geolocation) {
            if (!navigator.geolocation) setGeoError('Geolocation is not supported by this browser.');
            return;
        }

        setTracking(true);
        const watchId = navigator.geolocation.watchPosition(
            (pos) => {
                const geoPos: GeoPosition = {
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                    accuracy: pos.coords.accuracy,
                    heading: pos.coords.heading ?? undefined,
                    speed: pos.coords.speed ?? undefined,
                };
                setPosition(geoPos);
                setGeoError(null);
                checkProximity(geoPos);
            },
            (err) => {
                setGeoError(err.message);
                setTracking(false);
            },
            {
                enableHighAccuracy: true,
                maximumAge: 5000,   // accept positions up to 5 s old
                timeout: 10000,
            }
        );

        return () => {
            navigator.geolocation.clearWatch(watchId);
            setTracking(false);
        };
    }, [enabled, checkProximity]);

    /**
     * For any lat/lng, returns the distance from the current user position.
     * Returns null if position is not available.
     */
    const distanceFromUser = useCallback(
        (lat: number, lng: number): number | null => {
            if (!position) return null;
            return haversineKm(position.lat, position.lng, lat, lng);
        },
        [position]
    );

    return {
        position,
        geoError,
        tracking,
        alerts,         // accident points within alertRadiusKm
        distanceFromUser,
    };
}
