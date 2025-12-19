import React from 'react';
import { Play, Pause, Trophy, Target, Clock } from 'lucide-react';

const TrainingPage = ({ 
  videoRef,
  overlayCanvasRef,
  zones,
  score,
  shots,
  sessionTime,
  onStopSession,
  formatTime
}) => {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="bg-gray-800 p-4 shadow-lg">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Play className="text-green-400" />
          Training Active
        </h1>
      </div>

      <div className="p-4 space-y-4">
        <div className="grid grid-cols-3 gap-4 bg-gray-800 p-4 rounded-lg">
          <div className="text-center">
            <Trophy className="mx-auto text-yellow-400 mb-1" size={28} />
            <div className="text-3xl font-bold">{score}</div>
            <div className="text-sm text-gray-400">Score</div>
          </div>
          <div className="text-center">
            <Target className="mx-auto text-blue-400 mb-1" size={28} />
            <div className="text-3xl font-bold">{shots}</div>
            <div className="text-sm text-gray-400">Hits</div>
          </div>
          <div className="text-center">
            <Clock className="mx-auto text-purple-400 mb-1" size={28} />
            <div className="text-3xl font-bold">{formatTime(sessionTime)}</div>
            <div className="text-sm text-gray-400">Time</div>
          </div>
        </div>

        <div className="relative bg-black rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full"
          />
          <canvas
            ref={overlayCanvasRef}
            className="absolute top-0 left-0 w-full h-full pointer-events-none"
          />
          
          <div className="absolute top-4 left-4 bg-green-500 bg-opacity-90 px-3 py-2 rounded-lg animate-pulse">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span className="font-semibold">TRACKING</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="font-semibold mb-3">Active Zones</h3>
          <div className="grid grid-cols-2 gap-2">
            {zones.map(zone => (
              <div key={zone.id} className="flex items-center gap-2 bg-gray-700 p-2 rounded">
                <div
                  className="w-3 h-3 rounded"
                  style={{ backgroundColor: zone.color }}
                />
                <span className="text-sm">{zone.label}</span>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={onStopSession}
          className="w-full bg-red-500 hover:bg-red-600 px-4 py-4 rounded-lg font-semibold flex items-center justify-center gap-2 text-lg"
        >
          <Pause size={24} />
          End Session
        </button>
      </div>
    </div>
  );
};

export default TrainingPage;