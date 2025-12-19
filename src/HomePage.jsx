import React from 'react';
import { Camera, Square, Target, Trophy } from 'lucide-react';

const HomePage = ({ onStartCamera }) => {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <div className="bg-gray-800 p-4 shadow-lg">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Target className="text-green-400" />
          Sports Training Tracker
        </h1>
      </div>
      
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <Camera size={80} className="text-green-400 mb-6" />
        <h2 className="text-3xl font-bold mb-4 text-center">Track Your Progress</h2>
        <p className="text-gray-400 text-center mb-8 max-w-md">
          Use your camera to track ball placement, score points, and improve your tennis or pickleball game
        </p>
        
        <button
          onClick={onStartCamera}
          className="bg-green-500 hover:bg-green-600 px-8 py-4 rounded-lg font-semibold flex items-center gap-3 text-lg shadow-lg"
        >
          <Camera size={24} />
          Start Training
        </button>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl">
          <div className="bg-gray-800 p-4 rounded-lg text-center">
            <Square className="mx-auto text-blue-400 mb-2" size={32} />
            <h3 className="font-semibold mb-1">Draw Zones</h3>
            <p className="text-sm text-gray-400">Define target areas on your court</p>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg text-center">
            <Target className="mx-auto text-green-400 mb-2" size={32} />
            <h3 className="font-semibold mb-1">Track Shots</h3>
            <p className="text-sm text-gray-400">Real-time ball detection & scoring</p>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg text-center">
            <Trophy className="mx-auto text-yellow-400 mb-2" size={32} />
            <h3 className="font-semibold mb-1">View Results</h3>
            <p className="text-sm text-gray-400">Analyze your performance</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;