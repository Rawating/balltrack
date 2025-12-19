import { useState, useRef, useEffect } from 'react';
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
  const [sessionActive, setSessionActive] = useState(false);
  const [lastHitTime, setLastHitTime] = useState(0);
  const [ballPosition, setBallPosition] = useState(null);
  const [calibrated, setCalibrated] = useState(false);
  const [hsvRange, setHsvRange] = useState(null);

  const videoRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const detectionCanvasRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const detectionRef = useRef(null);
  
  // Performance optimization: Reusable Mats
  const matsRef = useRef({
    src: null,
    hsv: null,
    mask: null,
    kernel: null,
    contours: null,
    hierarchy: null
  });
  
  // Motion tracking
  const ballHistoryRef = useRef([]);
  const velocityRef = useRef({ vx: 0, vy: 0 });
  const frameCountRef = useRef(0);
  const missedFramesRef = useRef(0);

  /* ================= CAMERA ================= */
  useEffect(() => {
    if (page !== 'setup' && page !== 'training') return;

    let active = true;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
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

  /* ================= BALL CALIBRATION ================= */
  const calibrateBall = (e) => {
    if (!videoRef.current || !detectionCanvasRef.current || calibrated) return;

    const rect = overlayCanvasRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const video = videoRef.current;
    const canvas = detectionCanvasRef.current;
    const ctx = canvas.getContext('2d');

    // Sample area around click
    const scaleX = canvas.width / overlayCanvasRef.current.width;
    const scaleY = canvas.height / overlayCanvasRef.current.height;
    const sampleX = Math.floor(clickX * scaleX);
    const sampleY = Math.floor(clickY * scaleY);

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    if (!window.cv) return;
    
    const src = window.cv.matFromImageData(imageData);
    const hsv = new window.cv.Mat();
    window.cv.cvtColor(src, hsv, window.cv.COLOR_RGBA2RGB);
    window.cv.cvtColor(hsv, hsv, window.cv.COLOR_RGB2HSV);

    // Sample 5x5 region around click
    const hValues = [];
    const sValues = [];
    const vValues = [];
    
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        const px = Math.max(0, Math.min(canvas.width - 1, sampleX + dx));
        const py = Math.max(0, Math.min(canvas.height - 1, sampleY + dy));
        const pixel = hsv.ucharPtr(py, px);
        hValues.push(pixel[0]);
        sValues.push(pixel[1]);
        vValues.push(pixel[2]);
      }
    }

    // Calculate mean and std dev
    const hMean = hValues.reduce((a, b) => a + b) / hValues.length;
    const sMean = sValues.reduce((a, b) => a + b) / sValues.length;
    const vMean = vValues.reduce((a, b) => a + b) / vValues.length;

    // Set adaptive ranges (±30 for H, wider for S/V)
    setHsvRange({
      hLow: Math.max(0, hMean - 15),
      hHigh: Math.min(180, hMean + 15),
      sLow: Math.max(0, sMean - 50),
      sHigh: 255,
      vLow: Math.max(0, vMean - 50),
      vHigh: 255
    });

    setCalibrated(true);
    src.delete();
    hsv.delete();

    alert(`Ball calibrated! HSV: H=${Math.round(hMean)}, S=${Math.round(sMean)}, V=${Math.round(vMean)}`);
  };

  /* ================= OPTIMIZED BALL DETECTION ================= */
  useEffect(() => {
    if (page !== 'training' || !sessionActive || !calibrated) return;
    if (!window.cv || !window.cv.Mat) {
      console.warn('OpenCV not loaded yet');
      return;
    }

    // Initialize reusable Mats once
    if (!matsRef.current.kernel) {
      matsRef.current.kernel = window.cv.getStructuringElement(
        window.cv.MORPH_ELLIPSE, 
        new window.cv.Size(5, 5)
      );
      matsRef.current.contours = new window.cv.MatVector();
      matsRef.current.hierarchy = new window.cv.Mat();
    }

    const PROCESS_EVERY_N_FRAMES = 2; // Process every 2nd frame
    const DETECTION_WIDTH = 640;
    const DETECTION_HEIGHT = 360;
    const KEEP_ALIVE_FRAMES = 3; // Keep ball alive for 3 missed frames

    const detectBall = () => {
      if (!videoRef.current || !overlayCanvasRef.current || !detectionCanvasRef.current) {
        detectionRef.current = requestAnimationFrame(detectBall);
        return;
      }

      frameCountRef.current++;

      // Skip frames for performance
      if (frameCountRef.current % PROCESS_EVERY_N_FRAMES !== 0) {
        detectionRef.current = requestAnimationFrame(detectBall);
        return;
      }

      try {
        const video = videoRef.current;
        const canvas = detectionCanvasRef.current;
        const ctx = canvas.getContext('2d');

        // Downscale for faster processing
        canvas.width = DETECTION_WIDTH;
        canvas.height = DETECTION_HEIGHT;

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        // Reuse or create Mats
        if (matsRef.current.src) matsRef.current.src.delete();
        if (matsRef.current.hsv) matsRef.current.hsv.delete();
        if (matsRef.current.mask) matsRef.current.mask.delete();
        
        matsRef.current.src = window.cv.matFromImageData(imageData);
        matsRef.current.hsv = new window.cv.Mat();
        matsRef.current.mask = new window.cv.Mat();

        const src = matsRef.current.src;
        const hsv = matsRef.current.hsv;
        const mask = matsRef.current.mask;

        // Convert to HSV only
        window.cv.cvtColor(src, hsv, window.cv.COLOR_RGBA2RGB);
        window.cv.cvtColor(hsv, hsv, window.cv.COLOR_RGB2HSV);

        // Use calibrated HSV range
        const lower = new window.cv.Mat(hsv.rows, hsv.cols, hsv.type(), [
          hsvRange.hLow, hsvRange.sLow, hsvRange.vLow, 0
        ]);
        const upper = new window.cv.Mat(hsv.rows, hsv.cols, hsv.type(), [
          hsvRange.hHigh, hsvRange.sHigh, hsvRange.vHigh, 255
        ]);
        
        window.cv.inRange(hsv, lower, upper, mask);

        // Morphological operations
        window.cv.morphologyEx(mask, mask, window.cv.MORPH_OPEN, matsRef.current.kernel);
        window.cv.morphologyEx(mask, mask, window.cv.MORPH_CLOSE, matsRef.current.kernel);

        // Clear and reuse contours
        matsRef.current.contours.delete();
        matsRef.current.contours = new window.cv.MatVector();
        
        window.cv.findContours(
          mask, 
          matsRef.current.contours, 
          matsRef.current.hierarchy, 
          window.cv.RETR_EXTERNAL, 
          window.cv.CHAIN_APPROX_SIMPLE
        );

        // Adaptive minimum area (0.01% of screen)
        const minArea = (canvas.width * canvas.height) * 0.0001;
        const maxArea = (canvas.width * canvas.height) * 0.05;

        let bestCandidate = null;
        let bestScore = 0;

        // Predict next position using velocity
        let predictedX = 0;
        let predictedY = 0;
        if (ballHistoryRef.current.length >= 2) {
          const last = ballHistoryRef.current[ballHistoryRef.current.length - 1];
          const prev = ballHistoryRef.current[ballHistoryRef.current.length - 2];
          velocityRef.current.vx = last.x - prev.x;
          velocityRef.current.vy = last.y - prev.y;
          predictedX = last.x + velocityRef.current.vx;
          predictedY = last.y + velocityRef.current.vy;
        }

        for (let i = 0; i < matsRef.current.contours.size(); i++) {
          const contour = matsRef.current.contours.get(i);
          const area = window.cv.contourArea(contour);
          
          if (area < minArea || area > maxArea) continue;

          const perimeter = window.cv.arcLength(contour, true);
          const circularity = 4 * Math.PI * area / (perimeter * perimeter);
          
          if (circularity < 0.5) continue;

          const moments = window.cv.moments(contour);
          if (moments.m00 === 0) continue;

          const x = moments.m10 / moments.m00;
          const y = moments.m01 / moments.m00;

          // Distance to predicted position (if we have history)
          let distanceScore = 1;
          if (ballHistoryRef.current.length >= 2) {
            const dist = Math.sqrt(
              Math.pow(x - predictedX, 2) + Math.pow(y - predictedY, 2)
            );
            // Reject if too far from prediction
            if (dist > 100) continue;
            distanceScore = 1 / (1 + dist / 50);
          }

          const score = area * circularity * distanceScore;

          if (score > bestScore) {
            bestScore = score;
            bestCandidate = {
              x,
              y,
              radius: Math.sqrt(area / Math.PI),
              area,
              circularity
            };
          }
        }

        // Scale back to overlay canvas size
        const scaleX = overlayCanvasRef.current.width / canvas.width;
        const scaleY = overlayCanvasRef.current.height / canvas.height;

        if (bestCandidate) {
          const scaledX = bestCandidate.x * scaleX;
          const scaledY = bestCandidate.y * scaleY;
          const scaledRadius = bestCandidate.radius * scaleX;

          // Add to history
          ballHistoryRef.current.push({ x: scaledX, y: scaledY, radius: scaledRadius });
          if (ballHistoryRef.current.length > 5) {
            ballHistoryRef.current.shift();
          }

          // Average for stability
          const avgX = ballHistoryRef.current.reduce((sum, b) => sum + b.x, 0) / ballHistoryRef.current.length;
          const avgY = ballHistoryRef.current.reduce((sum, b) => sum + b.y, 0) / ballHistoryRef.current.length;
          const avgRadius = ballHistoryRef.current.reduce((sum, b) => sum + b.radius, 0) / ballHistoryRef.current.length;

          setBallPosition({ x: avgX, y: avgY, radius: avgRadius });
          checkZoneHit(avgX, avgY);
          
          missedFramesRef.current = 0;
        } else {
          // Keep ball alive for a few frames
          missedFramesRef.current++;
          if (missedFramesRef.current >= KEEP_ALIVE_FRAMES) {
            setBallPosition(null);
            ballHistoryRef.current = [];
          }
        }

        // Cleanup
        lower.delete();
        upper.delete();

      } catch (err) {
        console.error('Detection error:', err);
      }

      detectionRef.current = requestAnimationFrame(detectBall);
    };

    detectBall();

    return () => {
      if (detectionRef.current) {
        cancelAnimationFrame(detectionRef.current);
      }
      setBallPosition(null);
      ballHistoryRef.current = [];
      
      // Cleanup Mats
      if (matsRef.current.src) matsRef.current.src.delete();
      if (matsRef.current.hsv) matsRef.current.hsv.delete();
      if (matsRef.current.mask) matsRef.current.mask.delete();
      if (matsRef.current.kernel) matsRef.current.kernel.delete();
      if (matsRef.current.contours) matsRef.current.contours.delete();
      if (matsRef.current.hierarchy) matsRef.current.hierarchy.delete();
      
      matsRef.current = {
        src: null,
        hsv: null,
        mask: null,
        kernel: null,
        contours: null,
        hierarchy: null
      };
    };
  }, [page, sessionActive, zones, calibrated, hsvRange]);

  /* ================= CHECK ZONE HIT ================= */
  const checkZoneHit = (x, y) => {
    const now = Date.now();
    if (now - lastHitTime < 800) return;

    for (const zone of zones) {
      const zoneX = Math.min(zone.startX, zone.endX);
      const zoneY = Math.min(zone.startY, zone.endY);
      const zoneW = Math.abs(zone.endX - zone.startX);
      const zoneH = Math.abs(zone.endY - zone.startY);

      if (x >= zoneX && x <= zoneX + zoneW && y >= zoneY && y <= zoneY + zoneH) {
        setScore(s => s + zone.points);
        setShots(s => s + 1);
        setHits(h => [...h, { zone: zone.label, points: zone.points, time: now }]);
        setLastHitTime(now);
        break;
      }
    }
  };

  /* ================= ZONE DRAW ================= */
  const handleCanvasMouseDown = e => {
    // Calibration mode
    if (page === 'training' && !calibrated) {
      calibrateBall(e);
      return;
    }

    if (page !== 'setup') return;

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

  /* ================= DRAW ZONES AND BALL ================= */
  useEffect(() => {
    const c = overlayCanvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    
    ctx.clearRect(0, 0, c.width, c.height);

    // Calibration prompt
    if (page === 'training' && !calibrated) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Click on the ball to calibrate', c.width / 2, c.height / 2 - 20);
      ctx.font = '18px Arial';
      ctx.fillText('(Point to a yellow/green ball)', c.width / 2, c.height / 2 + 20);
      ctx.textAlign = 'left';
      return;
    }

    // Draw zones
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
      
      ctx.fillStyle = z.color;
      ctx.font = 'bold 16px Arial';
      ctx.fillText(`${z.label} (${z.points}pts)`, x + 5, y + 20);
    });

    // Draw current zone
    if (currentZone && isDrawing) {
      const x = Math.min(currentZone.startX, currentZone.endX);
      const y = Math.min(currentZone.startY, currentZone.endY);
      const w = Math.abs(currentZone.endX - currentZone.startX);
      const h = Math.abs(currentZone.endY - currentZone.startY);
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = currentZone.color;
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, w, h);
      ctx.setLineDash([]);
    }

    // Draw ball
    if (ballPosition && page === 'training' && calibrated) {
      ctx.beginPath();
      ctx.arc(ballPosition.x, ballPosition.y, ballPosition.radius + 5, 0, 2 * Math.PI);
      ctx.strokeStyle = '#00ff00';
      ctx.lineWidth = 4;
      ctx.stroke();
      
      ctx.beginPath();
      ctx.arc(ballPosition.x, ballPosition.y, 5, 0, 2 * Math.PI);
      ctx.fillStyle = '#00ff00';
      ctx.fill();
      
      // Crosshair
      ctx.strokeStyle = '#00ff00';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(ballPosition.x - 15, ballPosition.y);
      ctx.lineTo(ballPosition.x + 15, ballPosition.y);
      ctx.moveTo(ballPosition.x, ballPosition.y - 15);
      ctx.lineTo(ballPosition.x, ballPosition.y + 15);
      ctx.stroke();
    }
  }, [zones, currentZone, isDrawing, ballPosition, page, calibrated]);

  /* ================= SESSION ================= */
  const startSession = () => {
    if (!zones.length) return alert('Create at least one zone');
    setPage('training');
    setSessionActive(true);
    setScore(0);
    setShots(0);
    setHits([]);
    setSessionTime(0);
    setCalibrated(false);
    ballHistoryRef.current = [];
    frameCountRef.current = 0;
    missedFramesRef.current = 0;
    timerRef.current = setInterval(() => setSessionTime(t => t + 1), 1000);
  };

  const stopSession = () => {
    clearInterval(timerRef.current);
    setSessionActive(false);
    setCalibrated(false);
    setPage('results');
  };

  const formatTime = s =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  const goHome = () => {
    setZones([]);
    setScore(0);
    setShots(0);
    setHits([]);
    setCalibrated(false);
    setPage('home');
  };

  /* ================= RENDER ================= */
  return (
    <>
      <canvas ref={detectionCanvasRef} style={{ display: 'none' }} />
      
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
          onMouseDown={handleCanvasMouseDown}
          calibrated={calibrated}
          hsvRange={hsvRange}
          setHsvRange={setHsvRange}
          setCalibrated={setCalibrated}
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
          onNewSession={() => {
            setSessionActive(false);
            setPage('setup');
          }}
          onHome={goHome}
        />
      )}
    </>
  );
}