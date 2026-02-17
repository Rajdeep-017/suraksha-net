import React, { useState } from 'react';
import { MapPin, Search } from 'lucide-react';

const SearchInput = ({ placeholder, onSelect, iconType }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  // In a real app, you'd debounce this call
  const handleChange = async (e) => {
    const val = e.target.value;
    setQuery(val);
    // Fetch suggestions logic here...
  };

  return (
    <div className="relative w-full">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
        {iconType === 'origin' ? <div className="w-2 h-2 rounded-full border-2 border-slate-400" /> : <MapPin size={16} />}
      </div>
      <input 
        className="w-full bg-slate-100/80 p-3 pl-10 rounded-xl text-sm font-medium border-none focus:ring-2 focus:ring-indigo-500 transition-all"
        placeholder={placeholder}
        value={query}
        onChange={handleChange}
      />
      
      {results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 glass-panel rounded-2xl overflow-hidden z-[2000] max-h-60 overflow-y-auto">
          {results.map((loc, i) => (
            <div 
              key={i} 
              className="p-3 hover:bg-indigo-50 cursor-pointer text-xs font-bold text-slate-700 border-b border-slate-100 last:border-none"
              onClick={() => {
                setQuery(loc.placeName);
                onSelect(loc);
                setResults([]);
              }}
            >
              {loc.placeName} <span className="text-[10px] text-slate-400 font-normal">{loc.placeAddress}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
export default SearchInput;

// {/* High Risk Hotspots Overlay */}
// {hotspots.map((spot, i) => (
//   <CircleMarker
//     key={i}
//     center={[spot.lat, spot.lng]}
//     pathOptions={{
//       color: '#ef4444',
//       fillColor: '#ef4444',
//       fillOpacity: 0.4,
//       weight: 1
//     }}
//     radius={15}
//   >
//     <div className="animate-ping absolute inset-0 rounded-full bg-red-500 opacity-20"></div>
//     <Popup>
//       <div className="text-xs font-bold">⚠️ High Risk Zone</div>
//       <p className="text-[10px]">Frequent accident cluster identified by AI.</p>
//     </Popup>
//   </CircleMarker>
// ))}