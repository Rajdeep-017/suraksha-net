// src/types/safety.ts

export interface AccidentLocation {
  id?: string;
  // Both naming conventions exist: backend CSV uses Latitude/Longitude (capital),
  // while some endpoints use lat/lng (lowercase). Both are optional to handle both.
  lat?: number;
  lng?: number;
  Latitude?: number;
  Longitude?: number;
  severity?: 'low' | 'medium' | 'high' | string;
  accidents?: number;
  description?: string;
  Risk_Score?: number;
  City?: string;
  Road_Condition?: string;
  place_name?: string;   // reverse-geocoded street/locality name
  // Index signature allows access to any remaining CSV column
  [key: string]: any;
}

export interface Segment {
  coords: [number, number][];
  risk: number;
}

export interface RiskLocation {
  id: string;
  name: string;
  distance: string;
  riskLevel: 'low' | 'medium' | 'high';
  accidents: number;
  timeOfDay?: string;
}

export interface SafetyResponse {
  safety_score: number;
  risk_level: string;
  total_accidents: number;
  high_risk_locations: RiskLocation[];
  accident_points: AccidentLocation[];
  start_coords?: [number, number];
  end_coords?: [number, number];
  route_geometry?: [number, number][];
  travel_time?: number;
  segmented_path: Segment[];
}