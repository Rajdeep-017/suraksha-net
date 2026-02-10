import React from 'react';
import MapView from './components/MapView';
import RiskPanel from './components/RiskPanel';

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <header className="mb-6 text-center">
        <h1 className="text-3xl font-black text-blue-900">🛡️ SURAKSHA-NET INDIA</h1>
        <p className="text-gray-600">Proactive Road Safety & Risk Visualization</p>
      </header>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Prediction Tool */}
        <div className="lg:col-span-1">
          <RiskPanel />
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-bold text-blue-800 text-sm">Tech Breakdown:</h3>
            <ul className="text-xs text-blue-700 list-disc ml-4 mt-2">
              <li>XGBoost/RandomForest Backend</li>
              <li>Real-time Weather Integration</li>
              <li>Temporal Risk Analysis (Time/Month)</li>
            </ul>
          </div>
        </div>

        {/* Right Side: Heatmap Visualization */}
        <div className="lg:col-span-2 bg-white p-2 rounded-xl shadow-xl overflow-hidden" style={{ minHeight: '600px' }}>
          <MapView />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;