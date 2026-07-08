import React from 'react';

interface NodeChaosBannerProps {
  id: string;
  data: any;
}

/**
 * NodeChaosBanner — Universal visual fault indicator and 1-click healer for all system design nodes.
 * Displays prominently whenever a node has active chaos injected (or elevated errors/latency).
 */
export const NodeChaosBanner: React.FC<NodeChaosBannerProps> = ({ id, data }) => {
  const hasChaos = Boolean(data?.chaosActive || (data?.errors && data.errors > 0));
  if (!hasChaos) return null;

  const faultLabel = data?.chaosActive || `High Error Rate (${data?.errors}%)`;

  return (
    <div className="mx-2 mb-2 px-2.5 py-1.5 rounded-lg bg-red-500/20 dark:bg-red-950/60 border border-red-500/70 text-red-700 dark:text-red-300 text-xs font-bold font-[Caveat] flex items-center justify-center gap-1.5 shadow-sm animate-pulse">
      <div className="flex items-center gap-1 truncate" title={faultLabel}>
        <span className="text-sm">💥</span>
        <span className="truncate tracking-wide">{faultLabel}</span>
      </div>
    </div>
  );
};

export default NodeChaosBanner;
