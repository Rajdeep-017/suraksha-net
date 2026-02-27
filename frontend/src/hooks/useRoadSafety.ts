import { useState, useCallback } from 'react';
import { safetyApi } from '../api/client';
import type { AccidentLocation, SafetyResponse } from '../types/safety';

export function useRoadSafety() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SafetyResponse | null>(null);
  const [accidents, setAccidents] = useState<AccidentLocation[]>([]);
  const [error, setError] = useState<string | null>(null);

  const analyzeRoute = useCallback(async (start: string, end: string): Promise<SafetyResponse | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await safetyApi.analyzeRoute(start, end);
      const rawData = response.data;

      const transformedData: SafetyResponse = {
        safety_score: rawData.safety_score ?? 0,
        risk_level: rawData.risk_level ?? 'Safe',
        total_accidents: rawData.total_accidents ?? 0,
        high_risk_locations: rawData.high_risk_locations ?? [],
        accident_points: rawData.accident_points ?? [],
        start_coords: rawData.start_coords,
        end_coords: rawData.end_coords,
        route_geometry: rawData.route_geometry,
        travel_time: rawData.travel_time ?? 0,
        segmented_path: rawData.segmented_path ?? [],
      };

      setData(transformedData);
      setAccidents(rawData.accident_points ?? []);
      console.log('✅ Route analysis loaded:', transformedData);
      return transformedData;          // ← returned so App.tsx can chain navigateSafe
    } catch (err: any) {
      const message =
        err?.response?.data?.detail ||
        err?.message ||
        'Could not connect to the safety server.';
      console.error('❌ Route analysis failed:', err);
      setError(message);
      setData(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { analyzeRoute, loading, data, accidents, error };
}