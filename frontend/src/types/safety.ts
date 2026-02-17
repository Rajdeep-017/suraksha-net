// export interface AccidentLocation {
//   id: string;
//   lat: number;
//   lng: number;
//   severity: "low" | "medium" | "high";
//   accidents: number;
//   description: string;
// }

// export interface RiskLocation {
//   id: string;
//   name: string;
//   distance: string;
//   riskLevel: "low" | "medium" | "high";
//   accidents: number;
//   timeOfDay: string;
// }

// export interface SafetyResponse {
//   safety_score: number;
//   risk_level: string;
//   total_accidents: number;
//   high_risk_locations: RiskLocation[];
//   accident_points: AccidentLocation[];
// }
// src/types/safety.ts

export interface AccidentLocation {
  id: string;
  lat: number;
  lng: number;
  severity: 'low' | 'medium' | 'high';
  accidents: number;
  description: string;
}

export interface RiskLocation {
  id: string;
  name: string;
  distance: string;
  riskLevel: 'low' | 'medium' | 'high';
  accidents: number;
  timeOfDay: string;
}

export interface SafetyResponse {
  safety_score: number;
  risk_level: string;
  total_accidents: number;
  high_risk_locations: RiskLocation[];
  accident_points: AccidentLocation[];
}