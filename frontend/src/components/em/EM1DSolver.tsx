import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, ArrowsClockwise } from '@phosphor-icons/react';

export default function EM1DSolver() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [frequency, setFrequency] = useState(50);
  const [permittivity, setPermittivity] = useState(1);

  // FDTD State
  const state = useRef({
    E: new Float32Array(300),
    H: new Float32Array(300),
    time: 0,
    play: true,
  });

  useEffect(() => {
    state.current.play = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    const N = 300;
    
    // FDTD Parameters
    const dx = 0.01;
    const dt = dx / 2; // Courant limit
    
    const draw = () => {
      if (state.current.play) {
        // Source
        state.current.time += dt;
        state.current.E[0] = Math.sin(2 * Math.PI * (frequency / 1000) * state.current.time);

        // Update H field
        for (let i = 0; i < N - 1; i++) {
          state.current.H[i] = state.current.H[i] + (dt / dx) * (state.current.E[i + 1] - state.current.E[i]);
        }

        // Update E field
        const eps = permittivity; // Relative permittivity
        for (let i = 1; i < N - 1; i++) {
          // Medium boundary at x=150
          const localEps = i > 150 ? eps : 1;
          state.current.E[i] = state.current.E[i] + (dt / dx / localEps) * (state.current.H[i] - state.current.H[i - 1]);
        }
        
        // ABC (Absorbing Boundary Condition)
        state.current.E[N - 1] = state.current.E[N - 2];
      }

      // Render
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cy = canvas.height / 2;
      const scaleY = 100;
      
      // Draw Medium
      ctx.fillStyle = permittivity > 1 ? 'rgba(56, 189, 248, 0.1)' : 'transparent';
      ctx.fillRect(canvas.width / 2, 0, canvas.width / 2, canvas.height);

      ctx.beginPath();
      ctx.strokeStyle = '#f43f5e'; // Red for E field
      ctx.lineWidth = 2;
      for (let i = 0; i < N; i++) {
        const x = (i / N) * canvas.width;
        const y = cy - state.current.E[i] * scaleY;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      ctx.beginPath();
      ctx.strokeStyle = '#3b82f6'; // Blue for H field
      ctx.lineWidth = 2;
      for (let i = 0; i < N; i++) {
        const x = (i / N) * canvas.width;
        const y = cy - state.current.H[i] * scaleY;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      animationId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animationId);
  }, [frequency, permittivity]);

  return (
    <div className="w-full h-full flex flex-col bg-slate-900 rounded-2xl overflow-hidden relative border border-slate-800">
      <div className="flex-1 relative">
        <canvas 
          ref={canvasRef} 
          width={800} 
          height={600} 
          className="w-full h-full object-fill"
        />
        <div className="absolute top-4 right-4 bg-slate-800/80 backdrop-blur-md p-4 rounded-xl border border-slate-700 w-64 flex flex-col gap-4 text-white shadow-xl">
          <h3 className="font-bold text-sm uppercase tracking-wider text-slate-400">Controls</h3>
          
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-slate-400 flex justify-between">
              <span>Source Frequency</span>
              <span className="font-mono text-emerald-400">{frequency} Hz</span>
            </label>
            <input 
              type="range" 
              min="10" max="200" 
              value={frequency} 
              onChange={e => setFrequency(Number(e.target.value))}
              className="w-full accent-emerald-500"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-slate-400 flex justify-between">
              <span>Dielectric (Right Half)</span>
              <span className="font-mono text-cyan-400">εr = {permittivity}</span>
            </label>
            <input 
              type="range" 
              min="1" max="9" step="0.5"
              value={permittivity} 
              onChange={e => setPermittivity(Number(e.target.value))}
              className="w-full accent-cyan-500"
            />
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
                state.current.E.fill(0);
                state.current.H.fill(0);
                state.current.time = 0;
              }}
              className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg flex items-center justify-center transition-colors"
            >
              <ArrowsClockwise weight="bold" />
            </button>
          </div>
        </div>
        
        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-slate-800/80 backdrop-blur-md px-4 py-2 rounded-xl border border-slate-700 flex gap-6 shadow-xl">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-rose-500"></div>
            <span className="text-xs font-bold text-slate-300">Electric Field (E)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-xs font-bold text-slate-300">Magnetic Field (H)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
