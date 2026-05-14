import React, { useMemo } from 'react';
import { CornersOut, CornersIn, Download, X } from '@phosphor-icons/react';
import type { TimingData } from './types';

interface WaveformViewerProps {
  history: TimingData[];
  isExpanded?: boolean;
  onExpandToggle?: () => void;
  onClose?: () => void;
}

export default function WaveformViewer({ history, isExpanded = false, onExpandToggle, onClose }: WaveformViewerProps) {
  // Extract all unique signal names from history
  const signals = useMemo(() => {
    const names = new Set<string>();
    history.forEach(tick => {
      Object.keys(tick.signals).forEach(n => names.add(n));
    });
    return Array.from(names).sort();
  }, [history]);

  if (signals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500 font-mono text-sm bg-[#0B0F19] rounded-lg border border-slate-800">
        No waveform data available. Add named components (e.g., SW1, CLK1, OUT) and run the simulation.
        {onClose && (
          <button onClick={onClose} className="mt-4 px-3 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300">
            Close
          </button>
        )}
      </div>
    );
  }

  const ROW_HEIGHT = 40;
  const TICK_WIDTH = 20;

  return (
    <div className={`flex flex-col bg-[#0B0F19] border border-slate-800 shadow-2xl rounded-lg overflow-hidden ${isExpanded ? 'w-full h-full' : 'w-full h-64'}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-2 text-slate-300 font-mono text-sm font-bold">
          <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12h4l3-9 5 18 3-9h3" />
          </svg>
          Logic Analyzer (Timing Diagram)
        </div>
        <div className="flex items-center gap-2">
          {onExpandToggle && (
            <button
              onClick={onExpandToggle}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
              title={isExpanded ? 'Minimize' : 'Maximize'}
            >
              {isExpanded ? <CornersIn size={16} /> : <CornersOut size={16} />}
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
              title="Close"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Waveform Content */}
      <div className="flex-1 overflow-auto relative">
        <div className="flex h-full">
          {/* Signal Names Sidebar */}
          <div className="w-24 shrink-0 bg-slate-900/50 border-r border-slate-800 sticky left-0 z-20">
            <div className="h-6 border-b border-slate-800/50 bg-slate-900 sticky top-0" /> {/* Time axis header placeholder */}
            {signals.map(sig => (
              <div
                key={sig}
                className="flex items-center justify-end pr-3 font-mono text-xs font-bold text-slate-300"
                style={{ height: ROW_HEIGHT }}
              >
                {sig}
              </div>
            ))}
          </div>

          {/* Canvas Area */}
          <div className="flex-1 relative bg-[length:20px_20px] bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px)]">
            <div className="absolute inset-0 min-w-max">
              {/* Time Axis */}
              <div className="h-6 border-b border-slate-800/50 bg-slate-900/80 sticky top-0 z-10 flex">
                {history.map((tick, i) => (
                  <div key={i} className="flex-none font-mono text-[9px] text-slate-500 pl-1 pt-1" style={{ width: TICK_WIDTH }}>
                    {i % 10 === 0 ? i : ''}
                  </div>
                ))}
              </div>

              {/* Waveform Traces */}
              <div className="relative" style={{ width: history.length * TICK_WIDTH }}>
                {signals.map((sig, sigIdx) => (
                  <div key={sig} className="relative border-b border-slate-800/30" style={{ height: ROW_HEIGHT }}>
                    <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                      <path
                        d={generatePath(history, sig, TICK_WIDTH, ROW_HEIGHT)}
                        fill="none"
                        stroke="#10B981"
                        strokeWidth="1.5"
                        strokeLinejoin="bevel"
                      />
                    </svg>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function generatePath(history: TimingData[], signalName: string, tickWidth: number, rowHeight: number): string {
  if (history.length === 0) return '';
  
  const HIGH_Y = rowHeight * 0.2;
  const LOW_Y = rowHeight * 0.8;
  const UNKNOWN_Y = rowHeight * 0.5;

  let path = '';
  let prevVal: string | number = 'X';
  let prevY = UNKNOWN_Y;

  history.forEach((tick, i) => {
    const val = tick.signals[signalName] ?? 'X';
    let y = UNKNOWN_Y;
    if (val === 1) y = HIGH_Y;
    else if (val === 0) y = LOW_Y;

    const xStart = i * tickWidth;
    const xEnd = (i + 1) * tickWidth;

    if (i === 0) {
      path += `M ${xStart} ${y} L ${xEnd} ${y}`;
    } else {
      if (val !== prevVal) {
        // Transition
        path += ` L ${xStart} ${y} L ${xEnd} ${y}`;
      } else {
        // Hold
        path += ` L ${xEnd} ${y}`;
      }
    }
    
    prevVal = val;
    prevY = y;
  });

  return path;
}
