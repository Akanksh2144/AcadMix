import React, { memo, useMemo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { ChartBar } from '@phosphor-icons/react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface FFTData {
  label: string;
  /** Injected by the parent simulator after running the engine */
  signalData?: Float64Array;
  timeData?: Float64Array;
  [key: string]: unknown;
}

/**
 * Simple DFT magnitude (we only need the first N/2 bins for display).
 */
function computeFFTMagnitude(signal: Float64Array): { freqs: number[]; mags: number[] } {
  const N = signal.length;
  const halfN = Math.floor(N / 2);
  const freqs: number[] = [];
  const mags: number[] = [];

  // Only compute up to Nyquist
  const step = Math.max(1, Math.floor(halfN / 64)); // max 64 bins for perf
  for (let k = 0; k < halfN; k += step) {
    let re = 0;
    let im = 0;
    for (let n = 0; n < N; n++) {
      const angle = (2 * Math.PI * k * n) / N;
      re += signal[n] * Math.cos(angle);
      im -= signal[n] * Math.sin(angle);
    }
    const mag = Math.sqrt(re * re + im * im) / N;
    freqs.push(k); // bin index ≈ frequency in Hz for 1s duration
    mags.push(mag);
  }
  return { freqs, mags };
}

function FFTNode({ data }: NodeProps & { data: FFTData }) {
  const chartData = useMemo(() => {
    if (!data.signalData) return null;
    const { freqs, mags } = computeFFTMagnitude(data.signalData);

    return {
      labels: freqs.map((f) => `${f}`),
      datasets: [
        {
          label: '|X(f)|',
          data: mags,
          backgroundColor: 'rgba(168, 85, 247, 0.6)',
          borderColor: '#a855f7',
          borderWidth: 1,
          borderRadius: 2,
        },
      ],
    };
  }, [data.signalData]);

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 0 } as const,
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false },
      },
      scales: {
        x: {
          display: true,
          title: { display: true, text: 'Freq (Hz)', color: '#6b7280', font: { size: 9 } },
          ticks: { color: '#6b7280', font: { size: 8 }, maxTicksLimit: 8 },
          grid: { display: false },
        },
        y: {
          grid: { color: 'rgba(255,255,255,0.06)' },
          ticks: { color: '#6b7280', font: { size: 8 }, maxTicksLimit: 5 },
          title: { display: true, text: 'Mag', color: '#6b7280', font: { size: 9 } },
        },
      },
    }),
    []
  );

  return (
    <div className="bg-gray-900 border-2 border-purple-400 rounded-2xl shadow-lg shadow-purple-500/20 min-w-[320px] overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-fuchsia-500 px-4 py-2 flex items-center gap-2">
        <ChartBar size={16} weight="bold" className="text-white" />
        <span className="text-xs font-bold text-white uppercase tracking-wider">FFT Spectrum</span>
      </div>

      {/* FFT Display */}
      <div className="p-2">
        <div className="w-full h-[160px] bg-gray-950 rounded-xl border border-gray-800 p-2 relative overflow-hidden">
          {chartData ? (
            <Bar data={chartData} options={chartOptions} />
          ) : (
            <div className="h-full flex items-center justify-center text-gray-600 text-xs font-mono">
              No signal — connect an input
            </div>
          )}
        </div>
      </div>

      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3.5 !h-3.5 !bg-purple-400 !border-2 !border-gray-900 !rounded-full !shadow-md"
      />
    </div>
  );
}

export default memo(FFTNode);
