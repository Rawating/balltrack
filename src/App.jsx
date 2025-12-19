import React, { useState, useRef, useEffect } from 'react';
import HomePage from './HomePage';
import ZoneSetupPage from './ZoneSetupPage';
import TrainingPage from './TrainingPage';
import ResultsPage from './ResultsPage';

export default function App() {
  const [page, setPage] = useState('home');
  const [zones, setZones] = useState([]);
  const [currentZone, setCurrentZone] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [score, setScore] = useState(0);
  const [shots, setShots] = useState(0);
  const [hits, setHits] = useState([]);
  const [sessionTime, setSessionTime] = useState(0);

  const videoRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);

  /* ================= CAMERA ================= */
  useEffect(() => {
    if (page !== 'setup') return;

    let active = true;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false
        });

        if (!active || !videoRef.current) return;

        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        await videoRef.current.play();
      } catch (err) {
        console.error(err);
        alert('Camera access failed: ' + err.message);
      }
    };

    startCamera();

    return () => {
      active = false;
      streamRef.current?.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    };
  }, [page]);

  /* ================= ZONE DRAW ================= */
  const handleCanvasMouseDown = e => {
    const r = overlayCanvasRef.current.getBoundingClientRect();
    setIsDrawing(true);
    setCurrentZone({
      startX: e.clientX - r.left,
      startY: e.clientY - r.top,
      endX: e.clientX - r.left,
      endY: e.clientY - r.top,
      points: 1,
      color: `hsl(${zones.length * 60},70%,50%)`
    });
  };

  const handleCanvasMouseMove = e => {
    if (!isDrawing) return;
    const r = overlayCanvasRef.current.getBoundingClientRect();
    setCurrentZone(z => ({
      ...z,
      endX: e.clientX - r.left,
      endY: e.clientY - r.top
    }));
  };

  const handleCanvasMouseUp = () => {
    if (!currentZone) return;
    const w = Math.abs(currentZone.endX - currentZone.startX);
    const h = Math.abs(currentZone.endY - currentZone.startY);
    if (w > 20 && h > 20) {
      setZones(z => [
        ...z,
        { ...currentZone, id: Date.now(), label: `Zone ${z.length + 1}` }
      ]);
    }
    setIsDrawing(false);
    setCurrentZone(null);
  };

  /* ================= DRAW ZONES ================= */
  useEffect(() => {
    const c = overlayCanvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, c.width, c.height);

    zones.forEach(z => {
      const x = Math.min(z.startX, z.endX);
      const y = Math.min(z.startY, z.endY);
      const w = Math.abs(z.endX - z.startX);
      const h = Math.abs(z.endY - z.startY);
      ctx.strokeStyle = z.color;
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, w, h);
      ctx.fillStyle = z.color + '33';
      ctx.fillRect(x, y, w, h);
    });

    if (currentZone) {
      const x = Math.min(currentZone.startX, currentZone.endX);
      const y = Math.min(currentZone.startY, currentZone.endY);
      const w = Math.abs(currentZone.endX - currentZone.startX);
      const h = Math.abs(currentZone.endY - currentZone.startY);
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = currentZone.color;
      ctx.strokeRect(x, y, w, h);
      ctx.setLineDash([]);
    }
  }, [zones, currentZone]);

  /* ================= SESSION ================= */
  const startSession = () => {
    if (!zones.length) return alert('Create at least one zone');
    setPage('training');
    setScore(0);
    setShots(0);
    setSessionTime(0);
    timerRef.current = setInterval(() => setSessionTime(t => t + 1), 1000);
  };

  const stopSession = () => {
    clearInterval(timerRef.current);
    setPage('results');
  };

  const formatTime = s =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  const goHome = () => {
    setZones([]);
    setPage('home');
  };

  /* ================= RENDER ================= */
  return (
    <>
      {page === 'home' && <HomePage onStartCamera={() => setPage('setup')} />}

      {page === 'setup' && (
        <ZoneSetupPage
          videoRef={videoRef}
          overlayCanvasRef={overlayCanvasRef}
          zones={zones}
          currentZone={currentZone}
          isDrawing={isDrawing}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onStartSession={startSession}
          onResetZones={() => setZones([])}
          onBack={goHome}
        />
      )}

      {page === 'training' && (
        <TrainingPage
          videoRef={videoRef}
          overlayCanvasRef={overlayCanvasRef}
          zones={zones}
          score={score}
          shots={shots}
          sessionTime={sessionTime}
          onStopSession={stopSession}
          formatTime={formatTime}
        />
      )}

      {page === 'results' && (
        <ResultsPage
          score={score}
          shots={shots}
          sessionTime={sessionTime}
          hits={hits}
          zones={zones}
          formatTime={formatTime}
          onNewSession={() => setPage('setup')}
          onHome={goHome}
        />
      )}
    </>
  );
}
