// import axios from 'axios';
// import type { AccidentLocation, SafetyResponse } from '../types/safety';
// const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// export const apiClient = axios.create({
//   baseURL: API_URL,
//   headers: {
//     'Content-Type': 'application/json',
//   },
// });

// export const safetyApi = {
//   getAccidents: () => apiClient.get<AccidentLocation[]>('/accidents'),
//   analyzeRoute: (start: string, end: string) => 
//     apiClient.post<SafetyResponse>('/analyze-route', { start, end }),
//   getStats: () => apiClient.get('/statistics'),
// };
// src/api/client.ts
// import axios from 'axios';

// export const apiClient = axios.create({
//   baseURL: 'http://localhost:8000', // Port 8000 for Python
//   headers: { 'Content-Type': 'application/json' }
// });

// export const safetyApi = {
//   analyzeRoute: (start: string, end: string) => 
//     apiClient.post('/api/analyze-route', { start, end }), // Matches the Python route
// };
import axios from 'axios';

export const apiClient = axios.create({
  // Use the exact same IP as your successful Curl
  baseURL: 'http://127.0.0.1:8000', 
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

export const safetyApi = {
  analyzeRoute: (start: string, end: string) => 
    apiClient.post('/api/analyze-route', { start, end }),
};