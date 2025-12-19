import React from 'react';
import { ArrowLeft, Square, Play, RotateCcw } from 'lucide-react';

const ZoneSetupPage = ({ 
  videoRef, 
  overlayCanvasRef, 
  zones, 
  currentZone,
  isDrawing,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  onStartSession,
  onResetZones,
  onBack
}) => {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="bg-gray-800 p-4 shadow-lg flex items-center gap-4">
        <button onClick={onBack} className="text-gray-400 hover:text-white">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Square className="text-blue-400" />
          Setup Target Zones
        </h1>
      </div>

      <div className="p-4 space-y-4">
        <div className="bg-blue-900 bg-opacity-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Instructions:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Position your camera to see the court clearly</li>
            <li>Click/tap and drag to draw rectangular zones on target areas</li>
            <li>Create multiple zones for different targets</li>
            <li>Press "Start Training" when ready</li>
          </ol>
        </div>

        <div className="relative bg-black rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full"
            onLoadedMetadata={() => {
              if (overlayCanvasRef.current && videoRef.current) {
                overlayCanvasRef.current.width = videoRef.current.videoWidth;
                overlayCanvasRef.current.height = videoRef.current.videoHeight;
              }
            }}
          />
          <canvas
            ref={overlayCanvasRef}
            className="absolute top-0 left-0 w-full h-full cursor-crosshair"
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          />
          
          <div className="absolute top-4 left-4 bg-black bg-opacity-70 px-3 py-2 rounded-lg">
            <div className="flex items-center gap-2">
              <Square size={16} className="text-blue-400" />
              <span>Draw zones on court</span>
            </div>
          </div>
        </div>

        {zones.length > 0 && (
          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Square size={20} />
              Active Zones ({zones.length})
            </h3>
            <div className="space-y-2">
              {zones.map(zone => (
                <div key={zone.id} className="flex items-center justify-between bg-gray-700 p-3 rounded">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: zone.color }}
                    />
                    <span>{zone.label}</span>
                  </div>
                  <span className="text-yellow-400 font-semibold">{zone.points} pts</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={onStartSession}
            disabled={zones.length === 0}
            className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed px-4 py-3 rounded-lg font-semibold flex items-center justify-center gap-2"
          >
            <Play size={20} />
            Start Training
          </button>
          <button
            onClick={onResetZones}
            className="bg-red-500 hover:bg-red-600 px-4 py-3 rounded-lg font-semibold flex items-center gap-2"
          >
            <RotateCcw size={20} />
            Clear
          </button>
        </div>
      </div>
    </div>
  );
};

export default ZoneSetupPage;