import React from 'react';
import { BarChart3, Trophy, Target, Clock, Play, ArrowLeft } from 'lucide-react';

const ResultsPage = ({ 
  score, 
  shots, 
  sessionTime,
  hits,
  zones,
  formatTime,
  onNewSession,
  onHome
}) => {
  const accuracy = shots > 0 ? Math.round((shots / Math.max(1, shots * 2)) * 100) : 0;
  
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="bg-gray-800 p-4 shadow-lg">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <BarChart3 className="text-purple-400" />
          Session Results
        </h1>
      </div>

      <div className="p-4 space-y-4">
        <div className="bg-gradient-to-br from-green-600 to-blue-600 p-6 rounded-lg text-center">
          <Trophy className="mx-auto text-yellow-300 mb-3" size={48} />
          <h2 className="text-4xl font-bold mb-2">{score}</h2>
          <p className="text-lg">Total Points</p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-800 p-4 rounded-lg text-center">
            <Target className="mx-auto text-blue-400 mb-2" size={24} />
            <div className="text-2xl font-bold">{shots}</div>
            <div className="text-xs text-gray-400">Successful Hits</div>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg text-center">
            <Clock className="mx-auto text-purple-400 mb-2" size={24} />
            <div className="text-2xl font-bold">{formatTime(sessionTime)}</div>
            <div className="text-xs text-gray-400">Duration</div>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg text-center">
            <BarChart3 className="mx-auto text-green-400 mb-2" size={24} />
            <div className="text-2xl font-bold">{accuracy}%</div>
            <div className="text-xs text-gray-400">Accuracy</div>
          </div>
        </div>

        {hits.length > 0 && (
          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="font-semibold mb-3">Zone Performance</h3>
            <div className="space-y-2">
              {zones.map(zone => {
                const zoneHits = hits.filter(h => h.zone === zone.label).length;
                const zonePoints = hits.filter(h => h.zone === zone.label).reduce((sum, h) => sum + h.points, 0);
                
                return (
                  <div key={zone.id} className="bg-gray-700 p-3 rounded">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded"
                          style={{ backgroundColor: zone.color }}
                        />
                        <span className="font-semibold">{zone.label}</span>
                      </div>
                      <span className="text-yellow-400">{zonePoints} pts</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-600 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${(zoneHits / Math.max(1, shots)) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-400">{zoneHits} hits</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={onNewSession}
            className="flex-1 bg-green-500 hover:bg-green-600 px-4 py-3 rounded-lg font-semibold flex items-center justify-center gap-2"
          >
            <Play size={20} />
            New Session
          </button>
          <button
            onClick={onHome}
            className="flex-1 bg-gray-600 hover:bg-gray-700 px-4 py-3 rounded-lg font-semibold flex items-center justify-center gap-2"
          >
            <ArrowLeft size={20} />
            Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultsPage;