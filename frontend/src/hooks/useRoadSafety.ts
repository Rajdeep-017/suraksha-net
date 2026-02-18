// import { useState, useCallback } from 'react';
// import { safetyApi } from '../api/client';
// import type { AccidentLocation, SafetyResponse } from '../types/safety';

// export function useRoadSafety() {
//   const [loading, setLoading] = useState(false);
//   const [data, setData] = useState<SafetyResponse | null>(null);
//   const [accidents, setAccidents] = useState<AccidentLocation[]>([]);

//   const analyzeRoute = useCallback(async (start: string, end: string) => {
//     setLoading(true);
//     try {
//       const response = await safetyApi.analyzeRoute(start, end);
//       setData(response.data);
//       setAccidents(response.data.accident_points);
//     } catch (error) {
//       console.error("Safety analysis failed", error);
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   return { analyzeRoute, loading, data, accidents };
// }
// import { useState, useCallback } from 'react';
// import type { AccidentLocation, SafetyResponse } from '../types/safety';

// export function useRoadSafety() {
//   const [loading, setLoading] = useState(false);
//   const [data, setData] = useState<SafetyResponse | null>(null);
//   const [accidents, setAccidents] = useState<AccidentLocation[]>([]);

//   const analyzeRoute = useCallback(async (start: string, end: string) => {
//     setLoading(true);
//     console.log(`Analyzing route from ${start} to ${end}...`);

//     try {
//       // For now, let's use a timeout to simulate a real API call
//       await new Promise(resolve => setTimeout(resolve, 1500));

//       // MOCK DATA: This will make your map and tabs light up!
//       const mockResponse: SafetyResponse = {
//         safety_score: 68,
//         risk_level: "Medium",
//         total_accidents: 14,
//         high_risk_locations: [
//           { id: '1', name: 'Pune Station Intersection', distance: '0.5km', riskLevel: 'high', accidents: 8, timeOfDay: '6pm-9pm' },
//           { id: '2', name: 'University Road Curve', distance: '2.1km', riskLevel: 'medium', accidents: 4, timeOfDay: '11pm-2am' }
//         ],
//         accident_points: [
//           { id: 'p1', lat: 18.5289, lng: 73.8744, severity: 'high', accidents: 8, description: 'Heavy traffic collision zone' },
//           { id: 'p2', lat: 18.5320, lng: 73.8350, severity: 'medium', accidents: 4, description: 'Blind spot curve' }
//         ]
//       };

//       setData(mockResponse);
//       setAccidents(mockResponse.accident_points);
      
//     } catch (error) {
//       console.error("Safety analysis failed", error);
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   return { analyzeRoute, loading, data, accidents };
// }

import { useState, useCallback } from 'react';
import { safetyApi } from '../api/client';
import type { AccidentLocation, SafetyResponse } from '../types/safety';

export function useRoadSafety() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SafetyResponse | null>(null);
  const [accidents, setAccidents] = useState<AccidentLocation[]>([]);

  const analyzeRoute = useCallback(async (start: string, end: string) => {
    setLoading(true);
    try {
      const response = await safetyApi.analyzeRoute(start, end);
      
      // This maps the backend JSON you saw in Curl to the Frontend UI
      setData(response.data);
      setAccidents(response.data.accident_points || []);
      
      console.log("Data successfully loaded from Backend:", response.data);
    } catch (error) {
      console.error("Frontend failed to reach Backend:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  return { analyzeRoute, loading, data, accidents };
}