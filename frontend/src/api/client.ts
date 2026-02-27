import axios from 'axios';

// ── Axios instance ────────────────────────────────────────────────────────────
export const apiClient = axios.create({
  baseURL: 'http://127.0.0.1:8000',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// ── Request / Response Types ──────────────────────────────────────────────────

export interface PredictRiskRequest {
  lat: number;
  lon: number;
  city: string;
  weather?: string;       // 'Clear' | 'Rainy' | 'Foggy'
  road_condition?: string; // 'Dry' | 'Wet' | 'Icy'
}

export interface PredictRiskResponse {
  status: 'success' | 'error';
  risk_level: string;     // e.g. 'High' | 'Moderate' | 'Low'
  risk_score: number;     // integer from model
}

export interface NavigateSafeRequest {
  origin_lat: number;
  origin_lon: number;
  dest_lat: number;
  dest_lon: number;
  city: string;
}

export interface RouteStep {
  instruction: string;  // human-readable e.g. "Turn right onto NH-48"
  distance: string;     // e.g. "1.2 km" or "300 m"
  duration: string;     // e.g. "2 min"
  type: string;         // "turn", "roundabout", "arrive", etc.
  modifier: string;     // "left", "right", "straight"
  road: string;         // road/highway name
  tags: string[];       // ["highway", "roundabout", "flyover"]
}

export interface RouteOption {
  name: string;
  average_risk: number;
  risk_percentage: string;
  distance: string;
  duration: string;
  polyline: string;
  final_score: number;
  steps: RouteStep[];   // turn-by-turn maneuvers from Mappls
  route_geometry: [number, number][];  // decoded polyline for map rendering
  traffic_info: string;                // e.g. "🔴 Heavy traffic · Morning Rush"
  is_peak_hour: boolean;
}

export interface NavigateSafeResponse {
  recommended_safe_path: RouteOption;
  alternatives: RouteOption[];
}

export interface HealthResponse {
  status: string;         // 'healthy' | 'online'
  model_loaded: boolean;
  csv_loaded?: boolean;
}

// ── API surface ───────────────────────────────────────────────────────────────

export const safetyApi = {
  /** POST /api/analyze-route — main route analysis (OSRM + CSV risk) */
  analyzeRoute: (start: string, end: string) =>
    apiClient.post('/api/analyze-route', { start, end }),

  /** GET /api/health — checks if ML models are loaded */
  health: () =>
    apiClient.get<HealthResponse>('/api/health'),

  /** POST /api/predict-risk — single-point risk prediction via ML model */
  predictRisk: (payload: PredictRiskRequest) =>
    apiClient.post<PredictRiskResponse>('/api/predict-risk', payload),

  /** POST /api/navigate-safe — Mappls multi-route ranking by safety */
  navigateSafe: (payload: NavigateSafeRequest) =>
    apiClient.post<NavigateSafeResponse>('/api/navigate-safe', payload),
};