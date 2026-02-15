// import React, { useState } from 'react';
// import { Shield, Navigation, AlertCircle, Clock, Map as MapIcon, ChevronRight } from 'lucide-react';
// import { fetchSaferRoute } from './services/api';
// import SafetyMap from './components/SafetyMap';

// function App() {
//   const [routes, setRoutes] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);

//   const handleSearch = async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       const data = await fetchSaferRoute({
//         origin_lat: 18.5204, // Temporary: Use actual state from inputs later
//         origin_lon: 73.8567,
//         dest_lat: 18.5913,
//         dest_lon: 73.7389,
//         city: "Pune"
//       });
//       setRoutes(data.all_routes_ranked || []);
//     } catch (err) {
//       setError("Connection to Suraksha-Net AI failed.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="relative h-screen w-screen bg-slate-900 overflow-hidden font-sans">
//       {/* FULLSCREEN MAP */}
//       <div className="absolute inset-0 z-0">
//         <SafetyMap routes={routes} />
//       </div>

//       {/* FLOATING NAVIGATION PANEL */}
//       <div className="absolute top-6 left-6 z-10 w-96 max-h-[92vh] flex flex-col gap-4">
        
//         {/* BRAND & SEARCH CARD */}
//         <div className="glass-panel p-6 rounded-3xl">
//           <div className="flex items-center gap-3 mb-6">
//             <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-500/30">
//               <Shield size={24} fill="currentColor" />
//             </div>
//             <div>
//               <h1 className="text-xl font-black text-slate-800 tracking-tight leading-none">SURAKSHA-NET</h1>
//               <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">AI Road Safety Engine</p>
//             </div>
//           </div>

//           <div className="space-y-3">
//             <div className="relative">
//               <div className="absolute left-4 top-4 w-2 h-2 rounded-full border-2 border-slate-400" />
//               <input className="w-full bg-slate-100/80 p-3 pl-10 rounded-xl text-sm font-medium border-none focus:ring-2 focus:ring-indigo-500" placeholder="Current Location" />
//             </div>
//             <div className="relative">
//               <div className="absolute left-4 top-4 w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[8px] border-t-slate-400" />
//               <input className="w-full bg-slate-100/80 p-3 pl-10 rounded-xl text-sm font-medium border-none focus:ring-2 focus:ring-indigo-500" placeholder="Destination" />
//             </div>
//             <button 
//               onClick={handleSearch}
//               disabled={loading}
//               className={`w-full mt-2 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg ${loading ? 'bg-slate-400' : 'bg-slate-900 hover:bg-indigo-600 text-white shadow-indigo-500/20'}`}
//             >
//               {loading ? "Analyzing..." : <><Navigation size={18} /> Calculate Safe Route</>}
//             </button>
//           </div>
//         </div>

//         {/* ROUTE LIST (Scrollable) */}
//         <div className="overflow-y-auto space-y-3 pr-2 scrollbar-hide">
//           {routes.map((r, idx) => (
//             <div key={idx} className={`glass-panel p-4 rounded-2xl cursor-pointer border-2 transition-all ${idx === 0 ? 'border-suraksha-safe bg-emerald-50/50' : 'border-transparent'}`}>
//               <div className="flex justify-between items-start mb-3">
//                 <div className="flex items-center gap-2">
//                   <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${idx === 0 ? 'bg-suraksha-safe text-white' : 'bg-slate-200 text-slate-600'}`}>
//                     {idx === 0 ? "RECOMMENDED" : "ALTERNATIVE"}
//                   </span>
//                   <span className="text-xs font-bold text-slate-400">{r.name || `Route ${idx + 1}`}</span>
//                 </div>
//                 <div className="text-right">
//                   <div className={`text-sm font-black ${idx === 0 ? 'text-suraksha-safe' : 'text-slate-600'}`}>Risk: {r.risk_percentage}</div>
//                 </div>
//               </div>

//               <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
//                 <div className="flex items-center gap-1"><Clock size={12} /> {r.duration}</div>
//                 <div className="flex items-center gap-1"><MapIcon size={12} /> {r.distance}</div>
//                 <div className="ml-auto flex items-center gap-1 text-indigo-600">View <ChevronRight size={14} /></div>
//               </div>
//             </div>
//           ))}
//           {error && <div className="p-4 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl flex items-center gap-2 font-bold"><AlertCircle size={14}/> {error}</div>}
//         </div>
//       </div>
//     </div>
//   );
// }

// export default App;

// import React, { useState, useEffect } from 'react';
// import { Shield, Navigation, AlertTriangle, Clock, Map as MapIcon } from 'lucide-react';
// import SafetyMap from './components/SafetyMap';
// import SearchInput from './components/SearchInput';
// import { fetchSaferRoute } from './services/api';
import React, { useState } from 'react';
import { Shield, Navigation, Clock, Map as MapIcon, ChevronRight } from 'lucide-react';
import SafetyMap from './components/SafetyMap';
import SearchInput from './components/SearchInput';
import 'leaflet/dist/leaflet.css'; // Import this here to avoid PostCSS errors
import './index.css'; // Your tailwind styles
import { fetchSaferRoute } from './services/api'; // Ensure the path matches your services folder
function App() {
  const [routes, setRoutes] = useState([]);
  const [hotspots, setHotspots] = useState([]); // High-risk clusters
  const [loading, setLoading] = useState(false);
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);

  const handleCalculateRoute = async () => {
    if (!origin || !destination) return alert("Please select both points.");
    
    setLoading(true);
    try {
      const data = await fetchSaferRoute({
        origin_lat: origin.lat,
        origin_lon: origin.lng,
        dest_lat: destination.lat,
        dest_lon: destination.lng,
        city: "Pune" // Dynamic based on search
      });
      
      setRoutes(data.all_routes_ranked);
      setHotspots(data.risk_hotspots); // Backend now returns these
    } catch (err) {
      console.error("Navigation failed", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative h-screen w-screen bg-slate-900 overflow-hidden">
      {/* 1. THE MAP LAYER */}
      <div className="absolute inset-0 z-0">
        <SafetyMap routes={routes} hotspots={hotspots} />
      </div>

      {/* 2. THE UI OVERLAY */}
      <div className="absolute top-6 left-6 z-10 w-96 max-h-[92vh] flex flex-col gap-4">
        
        {/* Search & Brand Card */}
        <div className="glass-panel p-6 rounded-3xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg">
              <Shield size={24} />
            </div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight">SURAKSHA-NET</h1>
          </div>

          <div className="space-y-3">
            <SearchInput 
               placeholder="Starting Point..." 
               onSelect={setOrigin} 
               iconType="origin" 
            />
            <SearchInput 
               placeholder="Destination..." 
               onSelect={setDestination} 
               iconType="destination" 
            />
            
            <button 
              onClick={handleCalculateRoute}
              disabled={loading}
              className="w-full mt-2 py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-indigo-600 transition-all flex justify-center items-center gap-2 shadow-xl shadow-indigo-500/20"
            >
              {loading ? (
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <><Navigation size={18} /> Analyze Safety Path</>
              )}
            </button>
          </div>
        </div>

        {/* Dynamic Route Comparison List */}
        <div className="overflow-y-auto space-y-3 pr-2 scrollbar-hide">
          {routes.map((route, idx) => (
            <div key={idx} className={`glass-panel p-4 rounded-2xl border-2 transition-all ${idx === 0 ? 'border-suraksha-safe bg-emerald-50/50' : 'border-transparent'}`}>
              <div className="flex justify-between items-start mb-2">
                <span className={`text-[10px] font-black px-2 py-1 rounded-md ${idx === 0 ? 'bg-suraksha-safe text-white' : 'bg-slate-200 text-slate-600'}`}>
                  {idx === 0 ? "SHORTEST SAFE PATH" : "ALTERNATIVE"}
                </span>
                <span className="text-sm font-black text-slate-700">Risk: {route.risk_percentage}</span>
              </div>
              <div className="flex gap-4 text-xs font-bold text-slate-500">
                <span className="flex items-center gap-1"><Clock size={12}/> {route.duration}</span>
                <span className="flex items-center gap-1"><MapIcon size={12}/> {route.distance}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;