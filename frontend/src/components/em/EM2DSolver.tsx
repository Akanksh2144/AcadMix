import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, ArrowsClockwise, MouseLeftClick } from '@phosphor-icons/react';

export default function EM2DSolver() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [frequency, setFrequency] = useState(20);
  const [sourceType, setSourceType] = useState<'point' | 'plane'>('point');

  // FDTD State
  const N = 150; // Grid size N x N
  const state = useRef({
    Ez: new Float32Array(N * N),
    Hx: new Float32Array(N * N),
    Hy: new Float32Array(N * N),
    time: 0,
    play: true,
    mouseX: N / 2,
    mouseY: N / 2,
    isMouseDown: false
  });

  useEffect(() => {
    state.current.play = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    let animationId: number;
    const N = 150;
    
    // FDTD Parameters
    const dx = 0.01;
    const dt = dx / (Math.sqrt(2) * 2); // 2D Courant limit
    
    // For rendering colors
    const imageData = ctx.createImageData(N, N);
    
    const draw = () => {
      if (state.current.play) {
        state.current.time += dt;
        const s = state.current;
        
        // Update Hx and Hy
        for (let y = 0; y < N - 1; y++) {
          for (let x = 0; x < N - 1; x++) {
            const idx = y * N + x;
            s.Hx[idx] -= (dt / dx) * (s.Ez[(y + 1) * N + x] - s.Ez[idx]);
            s.Hy[idx] += (dt / dx) * (s.Ez[y * N + (x + 1)] - s.Ez[idx]);
          }
        }

        // Update Ez
        for (let y = 1; y < N - 1; y++) {
          for (let x = 1; x < N - 1; x++) {
            const idx = y * N + x;
            s.Ez[idx] += (dt / dx) * (
              (s.Hy[idx] - s.Hy[idx - 1]) - 
              (s.Hx[idx] - s.Hx[(y - 1) * N + x])
            );
          }
        }
        
        // Absorbing Boundary Conditions (Simple Mur 1st order approximation)
        for (let i = 0; i < N; i++) {
          s.Ez[i] = 0; // Top
          s.Ez[(N - 1) * N + i] = 0; // Bottom
          s.Ez[i * N] = 0; // Left
          s.Ez[i * N + (N - 1)] = 0; // Right
        }

        // Inject Source
        const srcVal = Math.sin(2 * Math.PI * (frequency / 100) * s.time);
        if (sourceType === 'point') {
          // If mouse is down, inject at mouse, otherwise center
          const mx = s.isMouseDown ? Math.floor((s.mouseX / canvas.width) * N) : Math.floor(N / 2);
          const my = s.isMouseDown ? Math.floor((s.mouseY / canvas.height) * N) : Math.floor(N / 2);
          if (mx > 0 && mx < N - 1 && my > 0 && my < N - 1) {
             s.Ez[my * N + mx] += srcVal * 2; // soft source
          }
        } else {
          // Plane wave from left
          for (let y = 1; y < N - 1; y++) {
            s.Ez[y * N + 1] = srcVal; // hard source
          }
        }
      }

      // Render Ez field to canvas
      const s = state.current;
      for (let i = 0; i < N * N; i++) {
        const val = s.Ez[i];
        const px = i * 4;
        
        // Red for positive, Blue for negative
        if (val > 0) {
          const intensity = Math.min(255, val * 2000);
          imageData.data[px] = intensity; // R
          imageData.data[px+1] = 0;       // G
          imageData.data[px+2] = 0;       // B
        } else {
          const intensity = Math.min(255, -val * 2000);
          imageData.data[px] = 0;         // R
          imageData.data[px+1] = 0;       // G
          imageData.data[px+2] = intensity; // B
        }
        imageData.data[px+3] = 255;       // Alpha
      }
      
      // We draw the N x N image, but we need it scaled.
      // Use a temporary canvas to scale it up smoothly or pixelated.
      const tmpCanvas = document.createElement('canvas');
      tmpCanvas.width = N;
      tmpCanvas.height = N;
      tmpCanvas.getContext('2d')?.putImageData(imageData, 0, 0);
      
      ctx.imageSmoothingEnabled = true;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(tmpCanvas, 0, 0, canvas.width, canvas.height);

      animationId = requestAnimationFrame(draw);
    };

    draw();

    // Mouse handlers for interactive source
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      state.current.mouseX = e.clientX - rect.left;
      state.current.mouseY = e.clientY - rect.top;
    };
    const handleMouseDown = () => state.current.isMouseDown = true;
    const handleMouseUp = () => state.current.isMouseDown = false;

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      cancelAnimationFrame(animationId);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [frequency, sourceType]);

  return (
    <div className="w-full h-full flex flex-col bg-slate-900 rounded-2xl overflow-hidden relative border border-slate-800">
      <div className="flex-1 relative">
        <canvas 
          ref={canvasRef} 
          width={800} 
          height={800} 
          className="w-full h-full object-fill cursor-crosshair"
        />
        
        <div className="absolute top-4 right-4 bg-slate-800/80 backdrop-blur-md p-4 rounded-xl border border-slate-700 w-64 flex flex-col gap-4 text-white shadow-xl">
          <h3 className="font-bold text-sm uppercase tracking-wider text-slate-400">Controls</h3>
          
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-slate-400 flex justify-between">
              <span>Source Frequency</span>
              <span className="font-mono text-emerald-400">{frequency}</span>
            </label>
            <input 
              type="range" 
              min="5" max="100" 
              value={frequency} 
              onChange={e => setFrequency(Number(e.target.value))}
              className="w-full accent-emerald-500"
            />
          </div>

          <div className="flex flex-col gap-2 mt-1">
            <span className="text-xs text-slate-400">Source Type</span>
            <div className="flex bg-slate-900/50 p-1 rounded-lg border border-slate-700">
              <button 
                onClick={() => setSourceType('point')}
                className={`flex-1 text-xs py-1.5 rounded-md font-medium transition-colors ${sourceType === 'point' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Point
              </button>
              <button 
                onClick={() => setSourceType('plane')}
                className={`flex-1 text-xs py-1.5 rounded-md font-medium transition-colors ${sourceType === 'plane' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Plane Wave
              </button>
            </div>
          </div>

          <div className="flex gap-2 mt-2">
            <button 
              onClick={() => setIsPlaying(!isPlaying)}
              className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg flex items-center justify-center gap-2 font-bold text-sm transition-colors"
            >
              {isPlaying ? <Pause weight="fill" /> : <Play weight="fill" />}
              {isPlaying ? 'Pause' : 'Play'}
            </button>
            <button 
              onClick={() => {
                const N = 150;
                state.current.Ez.fill(0);
                state.current.Hx.fill(0);
                state.current.Hy.fill(0);
                state.current.time = 0;
              }}
              className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg flex items-center justify-center transition-colors"
            >
              <ArrowsClockwise weight="bold" />
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-slate-800/80 backdrop-blur-md px-4 py-3 rounded-xl border border-slate-700 flex flex-col gap-2 shadow-xl">
          <div className="flex items-center gap-2 mb-1">
            <MouseLeftClick size={16} className="text-slate-400" />
            <span className="text-xs font-medium text-slate-300">Click & drag to move source</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-400">-Ez</span>
            <div className="w-32 h-3 rounded-full bg-gradient-to-r from-blue-500 via-black to-rose-500"></div>
            <span className="text-xs font-bold text-slate-400">+Ez</span>
          </div>
        </div>
      </div>
    </div>
  );
}
