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
import { useState } from "react";
// Since App is in /src, we use ./ to find the component folder
import { Sidebar } from "./components/Sidebar";
import { RoadSafetyMap } from "./components/RoadSafetyMap";
import { RiskAnalysisPanel } from "./components/RiskAnalysisPanel";
import { AccidentStatistics } from "./components/AccidentStatistics";
import { useRoadSafety } from "./hooks/useRoadSafety";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";

export default function App() {
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const { analyzeRoute, loading, data, accidents } = useRoadSafety();

  const handleAnalyze = () => {
    // start and end are now used here
    if (start && end) {
      analyzeRoute(start, end);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950">
      {/* 1. Sidebar with state setters passed as props */}
      <Sidebar
        start={start}
        setStart={setStart} 
        end={end}
        setEnd={setEnd}
        onAnalyze={handleAnalyze}
        loading={loading}
        score={data?.safety_score}
        level={data?.risk_level}
      />

      <main className="flex-1 relative flex flex-col">
        {/* 2. Full-screen Map */}
        <div className="absolute inset-0 z-0">
          <RoadSafetyMap 
            accidents={accidents || []} 
            center={[18.5204, 73.8567]} // Pune coordinates
          />
        </div>

        {/* 3. Analytics Overlay */}
        {data && (
          <div className="absolute bottom-6 right-6 w-[450px] z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Tabs defaultValue="hotspots" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-slate-900/90 backdrop-blur-xl border border-white/10">
                <TabsTrigger value="hotspots">Risk Hotspots</TabsTrigger>
                <TabsTrigger value="stats">Trends</TabsTrigger>
              </TabsList>

              <TabsContent value="hotspots">
                <RiskAnalysisPanel locations={data.high_risk_locations} />
              </TabsContent>

              <TabsContent value="stats">
                <div className="glass-panel p-2 rounded-xl">
                  {/* Assuming your backend provides trend data */}
                  <AccidentStatistics data={[]} /> 
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </main>
    </div>
  );
}