import React, { useState } from 'react';
import axios from 'axios';

const RiskPanel = () => {
  const [formData, setFormData] = useState({
    latitude: 19.0760, longitude: 72.8777,
    city: 'Mumbai', weather: 'Clear', road_condition: 'Dry'
  });
  const [result, setResult] = useState(null);

  const handlePredict = async () => {
    try {
      const response = await axios.post('http://127.0.0.1:8000/api/predict-risk', formData);
      setResult(response.data);
    } catch (err) {
      alert("Error predicting risk. Make sure backend is running!");
    }
  };

  return (
    <div className="p-4 bg-white shadow-lg rounded-lg">
      <h2 className="text-xl font-bold mb-4">🛡️ Check Road Safety Score</h2>
      
      <div className="grid grid-cols-2 gap-4">
        <select className="border p-2" onChange={(e) => setFormData({...formData, city: e.target.value})}>
          <option value="Mumbai">Mumbai</option>
          <option value="Delhi">Delhi</option>
          <option value="Bengaluru">Bengaluru</option>
          <option value="Pune">Pune</option>
        </select>

        <select className="border p-2" onChange={(e) => setFormData({...formData, weather: e.target.value})}>
          <option value="Clear">☀️ Clear</option>
          <option value="Rainy">🌧️ Rainy</option>
          <option value="Foggy">🌫️ Foggy</option>
        </select>
      </div>

      <button onClick={handlePredict} className="w-full mt-4 bg-blue-600 text-white p-2 rounded">
        Analyze Risk
      </button>

      {result && (
        <div className={`mt-4 p-4 rounded text-center ${result.level === 'High' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
          <p className="text-sm">Risk Score</p>
          <p className="text-4xl font-black">{result.risk_score} / 10</p>
          <p className="font-bold">Level: {result.level}</p>
        </div>
      )}
    </div>
  );
};

export default RiskPanel;