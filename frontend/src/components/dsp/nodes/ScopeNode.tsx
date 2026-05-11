import React, { memo, useMemo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { ChartLineUp } from '@phosphor-icons/react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface ScopeData {
  label: string;
  /** Injected by the parent simulator after running the engine */
  signalData?: Float64Array;
  timeData?: Float64Array;
  [key: string]: unknown;
}

function ScopeNode({ data }: NodeProps & { data: ScopeData }) {
  const chartData = useMemo(() => {
    if (!data.signalData || !data.timeData) return null;

    const maxPoints = 256; // Downsample for perf inside small canvas
    const step = Math.max(1, Math.floor(data.signalData.length / maxPoints));
    const labels: string[] = [];
    const values: number[] = [];
    for (let i = 0; i < data.signalData.length; i += step) {
      labels.push(data.timeData[i].toFixed(3));
      values.push(data.signalData[i]);
    }

    return {
      labels,
      datasets: [
        {
          label: 'Signal',
          data: values,
          borderColor: '#22d3ee',
          backgroundColor: 'rgba(34, 211, 238, 0.1)',
          borderWidth: 1.5,
          pointRadius: 0,
          tension: 0.1,
          fill: true,
        },
      ],
    };
  }, [data.signalData, data.timeData]);

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
          display: false,
        },
        y: {
          grid: { color: 'rgba(255,255,255,0.06)' },
          ticks: { color: '#6b7280', font: { size: 9 }, maxTicksLimit: 5 },
        },
      },
    }),
    []
  );

  return (
    <div className="bg-gray-900 border-2 border-cyan-400 rounded-2xl shadow-lg shadow-cyan-500/20 min-w-[300px] overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-500 to-teal-500 px-4 py-2 flex items-center gap-2">
        <ChartLineUp size={16} weight="bold" className="text-white" />
        <span className="text-xs font-bold text-white uppercase tracking-wider">Oscilloscope</span>
      </div>

      {/* Scope Display */}
      <div className="p-2">
        <div className="w-full h-[160px] bg-gray-950 rounded-xl border border-gray-800 p-2 relative overflow-hidden">
          {/* Scanline effect */}
          <div className="absolute inset-0 pointer-events-none opacity-5"
            style={{
              backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,200,0.1) 2px, rgba(0,255,200,0.1) 4px)',
            }}
          />

          {chartData ? (
            <Line data={chartData} options={chartOptions} />
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
        className="!w-3.5 !h-3.5 !bg-cyan-400 !border-2 !border-gray-900 !rounded-full !shadow-md"
      />
    </div>
  );
}

export default memo(ScopeNode);
