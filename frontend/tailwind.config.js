// /** @type {import('tailwindcss').Config} */
// module.exports = {
//   content: ["./src/**/*.{js,jsx,ts,tsx}"],
//   theme: {
//     extend: {
//       colors: {
//         'suraksha-safe': '#22c55e',
//         'suraksha-danger': '#ef4444',
//         'panel-bg': 'rgba(255, 255, 255, 0.7)',
//         'dark-bg': '#0f172a',
//       },
//     },
//   },
//   plugins: [],
// }

// /** @type {import('tailwindcss').Config} */
// module.exports = {
//   content: [
//     "./src/**/*.{js,jsx,ts,tsx}",
//   ],
//   theme: {
//     extend: {
//       colors: {
//         // Semantic Safety Colors
//         'suraksha-safe': '#22c55e',    // Emerald Green
//         'suraksha-danger': '#ef4444',  // Rose Red
//         'suraksha-warning': '#f59e0b', // Amber
        
//         // Dashboard Neutrals
//         'panel-bg': 'rgba(255, 255, 255, 0.7)',
//         'dark-bg': '#0f172a',          // Slate 900
//       },
//       backdropBlur: {
//         'md': '12px',
//         'lg': '24px',
//       },
//       boxShadow: {
//         'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
//         'glow': '0 0 15px rgba(34, 197, 94, 0.4)', // For the safe route
//       },
//       borderRadius: {
//         '3xl': '1.5rem',
//         '4xl': '2rem',
//       },
//     },
//   },
//   plugins: [],
// }

import L from 'leaflet';
import { Marker, Popup } from 'react-leaflet';

// 1. Define the pulsing icon using Tailwind classes
const pulsingRiskIcon = L.divIcon({
  className: 'custom-pulsing-icon', // Removes default Leaflet styles
  html: `
    <div class="relative flex items-center justify-center w-6 h-6">
      <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
      <span class="relative inline-flex rounded-full h-3 w-3 bg-red-600 border border-white"></span>
    </div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12], // Centers the icon on the coordinate
});

// 2. Use it in your component
{hotspots.map((spot, i) => (
  <Marker 
    key={i} 
    position={[spot.lat, spot.lng]} 
    icon={pulsingRiskIcon}
  >
    <Popup>
      <div className="p-1 font-sans">
        <div className="text-[10px] font-black text-red-600 tracking-tighter uppercase mb-1">
           ⚠️ High Risk Zone
        </div>
        <p className="text-[10px] text-slate-500 font-bold leading-tight">
          AI detected an accident cluster here.
        </p>
      </div>
    </Popup>
  </Marker>
))}