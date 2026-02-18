// import { useState } from 'react';
// import { Sidebar } from './components/Sidebar';
// import { RoadSafetyMap } from './components/RoadSafetyMap';
// import { RiskAnalysisPanel } from './components/RiskAnalysisPanel';
// import { useRoadSafety } from './hooks/useRoadSafety';
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";

// export default function App() {
//   const [start, setStart] = useState('');
//   const [end, setEnd] = useState('');
//   const { analyzeRoute, loading, data, accidents } = useRoadSafety();

//   const handleAnalyze = () => {
//     if (start && end) analyzeRoute(start, end);
//   };

//   return (
//     <div className="flex h-screen w-screen overflow-hidden bg-slate-950 font-sans">
//       {/* 1. Control Sidebar */}
//       <Sidebar 
//         onAnalyze={handleAnalyze} 
//         loading={loading}
//         score={data?.safety_score}
//         level={data?.risk_level}
//       />

//       {/* 2. Central Content Area */}
//       <main className="flex-1 relative flex flex-col">
//         {/* Full-screen Map Layer */}
//         <div className="absolute inset-0 z-0">
//           <RoadSafetyMap accidents={accidents} />
//         </div>

//         {/* 3. Floating Analytics Overlay */}
//         {data && (
//           <div className="absolute bottom-6 right-6 w-96 z-10">
//             <Tabs defaultValue="locations" className="w-full">
//               <TabsList className="grid w-full grid-cols-2 bg-slate-900/80 backdrop-blur-md">
//                 <TabsTrigger value="locations">Hotspots</TabsTrigger>
//                 <TabsTrigger value="stats">Stats</TabsTrigger>
//               </TabsList>
              
//               <TabsContent value="locations">
//                 <RiskAnalysisPanel locations={data.high_risk_locations} />
//               </TabsContent>
              
//               <TabsContent value="stats">
//                 <div className="glass-panel p-4 rounded-xl text-xs text-slate-300">
//                   Total accidents on this path: <span className="text-rose-400 font-bold">{data.total_accidents}</span>
//                 </div>
//               </TabsContent>
//             </Tabs>
//           </div>
//         )}
//       </main>
//     </div>
//   );
// }
// import { useState } from "react";
// // Since App is in /src, we use ./ to find the component folder
// import { Sidebar } from "./components/Sidebar";
// import { RoadSafetyMap } from "./components/RoadSafetyMap";
// import { RiskAnalysisPanel } from "./components/RiskAnalysisPanel";
// import { AccidentStatistics } from "./components/AccidentStatistics";
// import { useRoadSafety } from "./hooks/useRoadSafety";
// import { StatisticsPanel } from "./components/StatisticsPanel";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";

// export default function App() {
//   const [start, setStart] = useState("");
//   const [end, setEnd] = useState("");
//   const { analyzeRoute, loading, data, accidents } = useRoadSafety();

//   const handleAnalyze = () => {
//     // start and end are now used here
//     if (start && end) {
//       analyzeRoute(start, end);
//     }
//   };

//   return (
//     <div className="flex h-screen w-screen overflow-hidden bg-slate-950">
//       {/* 1. Sidebar with state setters passed as props */}
//       <Sidebar
//         start={start}
//         setStart={setStart} 
//         end={end}
//         setEnd={setEnd}
//         onAnalyze={handleAnalyze}
//         loading={loading}
//         score={data?.safety_score}
//         level={data?.risk_level}
//         travelTime={data?.travel_time}
//       />

//       <main className="flex-1 relative flex flex-col">
//         {/* 2. Full-screen Map */}
//         {/* <div className="absolute inset-0 z-0">
//           <RoadSafetyMap 
//             accidents={accidents || []} 
//             center={[18.5204, 73.8567]} // Pune coordinates
//           />
//         </div> */}
//         <RoadSafetyMap 
//       accidents={accidents} 
//       startCoord={data?.start_coords} 
//       endCoord={data?.end_coords} 
//       routeGeometry={data?.route_geometry} // This is the key for the road-following path!
//     />
//     {data?.travel_time && (
//       <div className="absolute top-6 right-6 z-10 bg-slate-900/90 backdrop-blur-md border border-white/10 p-4 rounded-2xl shadow-2xl">
//         <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Est. Travel Time</p>
//         <p className="text-2xl font-black text-white">
//           {Math.floor(data.travel_time / 60)}h {data.travel_time % 60}m
//         </p>
//       </div>
//     )}

//         {/* 3. Analytics Overlay */}
//         {data && (
//           <div className="absolute bottom-6 right-6 w-[450px] z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
//             <Tabs defaultValue="hotspots" className="w-full">
//               <TabsList className="grid w-full grid-cols-2 bg-slate-900/90 backdrop-blur-xl border border-white/10">
//                 <TabsTrigger value="hotspots">Risk Hotspots</TabsTrigger>
//                 <TabsTrigger value="stats">Trends</TabsTrigger>
//               </TabsList>

//               <TabsContent value="hotspots">
//                 <RiskAnalysisPanel locations={data.high_risk_locations} />
//               </TabsContent>

//               <TabsContent value="stats">
//                 <div className="glass-panel p-2 rounded-xl">
//                   {/* Assuming your backend provides trend data */}
//                   <AccidentStatistics data={[]} /> 
//                 </div>
//               </TabsContent>
//             </Tabs>
//           </div>
//         )}
//       </main>
//     </div>
//   );
// }

import { useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { RoadSafetyMap } from "./components/RoadSafetyMap";
import { StatisticsPanel } from "./components/StatisticsPanel";
import { useRoadSafety } from "./hooks/useRoadSafety";

/**
 * SURAKSHA-NET DASHBOARD
 * Layout Structure:
 * [SIDEBAR (Left)] | [MAIN AREA (Right Column)]
 * | -> [MAP (Flex-1)]
 * | -> [STATISTICS (Bottom Panel)]
 */
export default function App() {
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const { analyzeRoute, loading, data, accidents } = useRoadSafety();

  const handleAnalyze = () => {
    if (start && end) {
      analyzeRoute(start, end);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-200">
      
      {/* 1. LEFT SIDEBAR (Fixed Width) */}
      <Sidebar
        start={start}
        setStart={setStart}
        end={end}
        setEnd={setEnd}
        onAnalyze={handleAnalyze}
        loading={loading}
        score={data?.safety_score}
        level={data?.risk_level}
        travelTime={data?.travel_time}
      />

      {/* 2. MAIN CONTENT AREA (Fills remaining width) */}
      <main className="flex-1 flex flex-col relative">
        
        {/* TOP: MAIN MAP AREA (Fills available height) */}
        <div className="flex-1 relative z-0">
          <RoadSafetyMap 
            accidents={accidents || []} 
            startCoord={data?.start_coords} 
            endCoord={data?.end_coords} 
            routeGeometry={data?.route_geometry}
          />
          
          {/* Optional: Floating Travel Time Badge on Map */}
          {data?.travel_time && (
            <div className="absolute top-6 right-6 z-10 bg-slate-900/90 backdrop-blur-md border border-white/10 p-4 rounded-2xl shadow-2xl animate-in fade-in zoom-in duration-300">
              <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Est. Duration</p>
              <p className="text-2xl font-black text-white">
                {Math.floor(data.travel_time / 60)}h {data.travel_time % 60}m
              </p>
            </div>
          )}
        </div>

        {/* BOTTOM: STATISTICS & ANALYSIS PANEL */}
        {/* This panel only appears once the analysis is done */}
        {data ? (
          <div className="animate-in slide-in-from-bottom-full duration-700">
            <StatisticsPanel data={data} />
          </div>
        ) : (
          <div className="h-32 bg-slate-900/50 border-t border-white/5 flex items-center justify-center">
            <p className="text-slate-500 text-sm italic font-medium">
              Enter origin and destination to generate safety statistics...
            </p>
          </div>
        )}

      </main>
    </div>
  );
}