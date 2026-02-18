// src/components/CircularSafetyMeter.tsx
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface Props {
  score: number;
}

export const CircularSafetyMeter = ({ score }: Props) => {
  // Data for the background and the actual score
  const data = [
    { value: score },        // The actual safety level
    { value: 100 - score },  // The "empty" part of the circle
  ];

  // Color logic: High safety = Emerald, Low safety = Red
  const getColor = (s: number) => {
    if (s > 70) return '#10b981'; // Emerald
    if (s > 40) return '#f59e0b'; // Amber
    return '#ef4444';             // Red
  };

  return (
    <div className="relative w-full h-48 flex flex-col items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            startAngle={180}
            endAngle={0}
            paddingAngle={0}
            dataKey="value"
            stroke="none"
          >
            <Cell fill={getColor(score)} />
            <Cell fill="rgba(255,255,255,0.05)" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      
      {/* Floating Score Text in Center */}
      <div className="absolute top-[60%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
        <p className="text-4xl font-black text-white">{score}</p>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Safety Index</p>
      </div>
    </div>
  );
};