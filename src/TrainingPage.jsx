import React, { useState } from 'react';
import { Play, Pause, Trophy, Target, Clock, Settings } from 'lucide-react';

const TrainingPage = ({ 
  videoRef,
  overlayCanvasRef,
  zones,
  score,
  shots,
  sessionTime,
  onStopSession,
  formatTime,
  onMouseDown,
  calibrated,
  hsvRange,
  setHsvRange,
  setCalibrated
}) => {
  const [showCalibrationConfig, setShowCalibrationConfig] = useState(false);

  const handleRecalibrate = () => {
    setCalibrated(false);
    setShowCalibrationConfig(false);
  };

  const handleManualConfig = () => {
    setShowCalibrationConfig(true);
  };

  const handleSaveConfig = () => {
    if (hsvRange) {
      setCalibrated(true);
      setShowCalibrationConfig(false);
    }
  };

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

        {!calibrated && (
          <div className="bg-yellow-900 bg-opacity-50 border border-yellow-500 p-4 rounded-lg">
            <p className="text-yellow-200 font-semibold mb-2">Calibration Required</p>
            <p className="text-sm text-yellow-300">Click anywhere on the ball in the video to calibrate, or use manual configuration below.</p>
          </div>
        )}

        {showCalibrationConfig && (
          <div className="bg-gray-800 p-4 rounded-lg border border-blue-500">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Settings size={20} />
              Manual HSV Configuration
            </h3>
            {hsvRange ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm mb-1">Hue Low: {hsvRange.hLow}</label>
                  <input
                    type="range"
                    min="0"
                    max="180"
                    value={hsvRange.hLow}
                    onChange={(e) => setHsvRange({...hsvRange, hLow: parseInt(e.target.value)})}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Hue High: {hsvRange.hHigh}</label>
                  <input
                    type="range"
                    min="0"
                    max="180"
                    value={hsvRange.hHigh}
                    onChange={(e) => setHsvRange({...hsvRange, hHigh: parseInt(e.target.value)})}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Saturation Low: {hsvRange.sLow}</label>
                  <input
                    type="range"
                    min="0"
                    max="255"
                    value={hsvRange.sLow}
                    onChange={(e) => setHsvRange({...hsvRange, sLow: parseInt(e.target.value)})}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Saturation High: {hsvRange.sHigh}</label>
                  <input
                    type="range"
                    min="0"
                    max="255"
                    value={hsvRange.sHigh}
                    onChange={(e) => setHsvRange({...hsvRange, sHigh: parseInt(e.target.value)})}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Value Low: {hsvRange.vLow}</label>
                  <input
                    type="range"
                    min="0"
                    max="255"
                    value={hsvRange.vLow}
                    onChange={(e) => setHsvRange({...hsvRange, vLow: parseInt(e.target.value)})}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Value High: {hsvRange.vHigh}</label>
                  <input
                    type="range"
                    min="0"
                    max="255"
                    value={hsvRange.vHigh}
                    onChange={(e) => setHsvRange({...hsvRange, vHigh: parseInt(e.target.value)})}
                    className="w-full"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveConfig}
                    className="flex-1 bg-green-500 hover:bg-green-600 px-4 py-2 rounded-lg font-semibold"
                  >
                    Save Configuration
                  </button>
                  <button
                    onClick={() => setShowCalibrationConfig(false)}
                    className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-gray-400 text-sm">No calibration data available. Click on the ball first.</p>
            )}
          </div>
        )}

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
            className={`absolute top-0 left-0 w-full h-full ${!calibrated ? 'cursor-crosshair' : 'pointer-events-none'}`}
            onMouseDown={!calibrated ? onMouseDown : undefined}
            style={{ pointerEvents: !calibrated ? 'auto' : 'none' }}
          />
          
          {calibrated ? (
            <div className="absolute top-4 left-4 bg-green-500 bg-opacity-90 px-3 py-2 rounded-lg animate-pulse">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <span className="font-semibold">TRACKING</span>
              </div>
            </div>
          ) : (
            <div className="absolute top-4 left-4 bg-yellow-500 bg-opacity-90 px-3 py-2 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                <span className="font-semibold">CLICK ON BALL TO CALIBRATE</span>
              </div>
            </div>
          )}
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

        <div className="flex gap-2">
          {calibrated && (
            <button
              onClick={handleRecalibrate}
              className="bg-yellow-500 hover:bg-yellow-600 px-4 py-4 rounded-lg font-semibold flex items-center justify-center gap-2"
            >
              <Settings size={20} />
              Recalibrate
            </button>
          )}
          {!calibrated && (
            <button
              onClick={handleManualConfig}
              className="bg-blue-500 hover:bg-blue-600 px-4 py-4 rounded-lg font-semibold flex items-center justify-center gap-2"
            >
              <Settings size={20} />
              Manual Config
            </button>
          )}
          <button
            onClick={onStopSession}
            className="flex-1 bg-red-500 hover:bg-red-600 px-4 py-4 rounded-lg font-semibold flex items-center justify-center gap-2 text-lg"
          >
            <Pause size={24} />
            End Session
          </button>
        </div>
      </div>
    </div>
  );
};

export default TrainingPage;