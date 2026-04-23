import axios from 'axios';

// ── Axios instance ────────────────────────────────────────────────────────────
const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export const apiClient = axios.create({
  baseURL: API_BASE,
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
  weather?: string;
  road_condition?: string;
}

export interface PredictRiskResponse {
  status: 'success' | 'error';
  risk_level: string;
  risk_score: number;
}

export interface NavigateSafeRequest {
  origin_lat: number;
  origin_lon: number;
  dest_lat: number;
  dest_lon: number;
  city: string;
}

export interface RouteStep {
  instruction: string;
  distance: string;
  duration: string;
  type: string;
  modifier: string;
  road: string;
  tags: string[];
}

export interface RouteOption {
  name: string;
  average_risk: number;
  risk_percentage: string;
  distance: string;
  duration: string;
  polyline: string;
  final_score: number;
  steps: RouteStep[];
  route_geometry: [number, number][];
  traffic_info: string;
  is_peak_hour: boolean;
}

export interface NavigateSafeResponse {
  recommended_safe_path: RouteOption;
  alternatives: RouteOption[];
}

export interface HealthResponse {
  status: string;
  model_loaded: boolean;
  csv_loaded?: boolean;
  ws_connections?: number;
}

// ── Weather Types ─────────────────────────────────────────────────────────────

export interface WeatherData {
  temp: number;
  feels_like: number;
  humidity: number;
  wind_speed: number;
  visibility: number;
  condition: string;     // Clear | Cloudy | Rainy | Foggy | Stormy | Snowy
  description: string;
  icon: string;
  owm_code: number;
  is_severe: boolean;
  alert_text: string | null;
}

export interface WeatherResponse {
  status: 'success' | 'unavailable';
  weather: WeatherData | null;
  message?: string;
}

// ── Route Summary Type ────────────────────────────────────────────────────────

export interface RouteSummaryRequest {
  start: string;
  end: string;
  safety_score: number;
  risk_level: string;
  total_accidents: number;
  travel_time: number;
  top_hotspots: string[];
  weather?: string;
}

export interface RouteSummaryResponse {
  status: 'success' | 'error';
  summary: string;
}

// ── SOS Types ─────────────────────────────────────────────────────────────────

export interface SOSRequest {
  lat: number;
  lon: number;
  timestamp?: string;
  nearest_hotspot?: string;
  driver_name?: string;
}

export interface SOSResponse {
  status: 'success' | 'error';
  sos_id: string;
  message: string;
}

// ── Admin Broadcast Types ─────────────────────────────────────────────────────

export interface BroadcastRequest {
  zone: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
}

// ── WebSocket Alert Type ──────────────────────────────────────────────────────

export interface WSAlert {
  type: 'zone_entry' | 'weather_warning' | 'admin_broadcast' | 'sos_nearby';
  message: string;
  severity: 'info' | 'warning' | 'critical';
  zone: string;
  timestamp: string;
  data: Record<string, unknown>;
}

// ── API surface ───────────────────────────────────────────────────────────────

export const safetyApi = {
  /** POST /api/analyze-route — main route analysis */
  analyzeRoute: (start: string, end: string) =>
    apiClient.post('/api/analyze-route', { start, end }),

  /** GET /api/health */
  health: () =>
    apiClient.get<HealthResponse>('/api/health'),

  /** POST /api/predict-risk */
  predictRisk: (payload: PredictRiskRequest) =>
    apiClient.post<PredictRiskResponse>('/api/predict-risk', payload),

  /** POST /api/navigate-safe */
  navigateSafe: (payload: NavigateSafeRequest) =>
    apiClient.post<NavigateSafeResponse>('/api/navigate-safe', payload),

  /** GET /api/weather */
  getWeather: (lat: number, lon: number) =>
    apiClient.get<WeatherResponse>(`/api/weather?lat=${lat}&lon=${lon}`),

  /** POST /api/route-summary — AI-generated route summary */
  getRouteSummary: (payload: RouteSummaryRequest) =>
    apiClient.post<RouteSummaryResponse>('/api/route-summary', payload),

  /** POST /api/sos — Emergency SOS */
  sendSOS: (payload: SOSRequest) =>
    apiClient.post<SOSResponse>('/api/sos', payload),

  /** POST /api/admin/broadcast — Admin broadcast warning */
  adminBroadcast: (payload: BroadcastRequest) =>
    apiClient.post('/api/admin/broadcast', payload),

  /** GET /api/admin/alerts — Recent alert log */
  getAlertLog: () =>
    apiClient.get('/api/admin/alerts'),

  /** GET /api/sos/list — SOS events for admin */
  getSOSList: () =>
    apiClient.get('/api/sos/list'),
};