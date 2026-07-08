import React from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '@xyflow/react';
import { X } from '@phosphor-icons/react';
import { NodeConfigurationMenu } from './NodeConfigurationMenu';
import { CONCEPT_GUIDES, getIconForType, formatNum } from './MetricsPanel';

export function NodeDetailsPopup({ selectedNode, selectedNodeMetrics, simResult, onClose }: any) {
  const transform = useStore((s: any) => s.transform); // [x, y, zoom]
  const domNode = useStore((s: any) => s.domNode);
  
  if (!selectedNode || typeof document === 'undefined') return null;

  const guide = CONCEPT_GUIDES[selectedNode.type] || {
    title: selectedNode.data.label || selectedNode.type,
    category: 'Infrastructure Tier',
    description: 'Coordinates traffic or stores states inside the application architecture stack.',
    tradeOffs: [],
  };
  const metrics = selectedNodeMetrics;

  // Transform canvas to screen (relative to the React Flow wrapper)
  const nodeWidth = selectedNode.measured?.width || 200;
  let rawLeft = (selectedNode.position.x + nodeWidth + 20) * transform[2] + transform[0];
  let rawTop = selectedNode.position.y * transform[2] + transform[1];

  // Convert to absolute screen coordinates
  const rect = domNode?.getBoundingClientRect() || { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };
  let left = rect.left + rawLeft;
  let top = rect.top + rawTop;

  // Robust bounds clamping
  const POPUP_WIDTH = 320;
  const ESTIMATED_HEIGHT = 550; 

  if (left + POPUP_WIDTH > window.innerWidth - 20) {
    // Flip to left side
    left = rect.left + (selectedNode.position.x - 20) * transform[2] + transform[0] - POPUP_WIDTH;
  }
  if (top + ESTIMATED_HEIGHT > window.innerHeight - 20) {
    top = window.innerHeight - ESTIMATED_HEIGHT - 20; // Push up to fit
  }
  if (top < 20) top = 20; // Prevent top clipping

  const popupContent = (
    <div 
      style={{ position: 'fixed', left, top, zIndex: 99999 }} 
      className="nodrag nopan nowheel w-80 bg-[var(--paper-alt)] rounded-2xl border border-[var(--ink-border)] shadow-2xl p-4 space-y-4 max-h-[85vh] overflow-y-auto"
      onWheel={(e) => e.stopPropagation()} // Stop wheel events from reaching canvas
    >
      {/* Component Identity Card */}
      <div className="flex items-start justify-between bg-[var(--paper-node)] p-3 rounded-xl border border-[var(--ink-border)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl border border-[var(--ink-border)] flex items-center justify-center shrink-0">
            {React.createElement(getIconForType(selectedNode.type), { size: 20, weight: "duotone", className: "text-[var(--accent-blue)]" })}
          </div>
          <div>
            <h3 className="font-bold text-sm text-[var(--ink)] leading-tight">{guide.title}</h3>
            <p className="text-xs text-[var(--ink-light)] font-medium mt-0.5">{guide.category}</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1 text-[var(--ink-light)] hover:text-[var(--ink)] transition-colors rounded-lg hover:bg-[var(--ink-border)]">
          <X size={16} weight="bold" />
        </button>
      </div>

      {/* Metrics Row */}
      {metrics ? (
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-[var(--paper-node)] p-3 rounded-xl border border-[var(--ink-border)]">
            <span className="block text-[10px] font-bold text-[var(--ink-light)] uppercase tracking-wider mb-1">Throughput</span>
            <span className="block font-bold text-lg text-[var(--ink)] leading-none">{formatNum(metrics.processedQPS)} <span className="text-xs text-[var(--ink-light)]">QPS</span></span>
            {metrics.droppedQPS > 0 && (
              <span className="block mt-1 text-xs font-semibold text-[var(--accent-red)]">{formatNum(metrics.droppedQPS)} dropped</span>
            )}
          </div>
          <div className="bg-[var(--paper-node)] p-3 rounded-xl border border-[var(--ink-border)]">
            <span className="block text-[10px] font-bold text-[var(--ink-light)] uppercase tracking-wider mb-1">Latency Added</span>
            <span className="block font-bold text-lg text-[var(--ink)] leading-none">+{metrics.latencyAdded}<span className="text-xs text-[var(--ink-light)]">ms</span></span>
          </div>
          <div className="col-span-2 bg-[var(--paper-node)] p-3 rounded-xl border border-[var(--ink-border)]">
            <div className="flex justify-between items-end mb-1.5">
              <span className="text-[10px] font-bold text-[var(--ink-light)] uppercase tracking-wider">Node Utilization</span>
              <span className={`text-xs font-bold ${(metrics.utilization * 100) > 80 ? 'text-[var(--accent-red)]' : 'text-[var(--accent-blue)]'}`}>
                {(metrics.utilization * 100).toFixed(0)}%
              </span>
            </div>
            <div className="h-1.5 w-full bg-[var(--ink-border)] rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-300 ${(metrics.utilization * 100) > 80 ? 'bg-[var(--accent-red)]' : 'bg-[var(--accent-blue)]'}`}
                style={{ width: `${Math.min(100, Math.max(0, metrics.utilization * 100))}%` }}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="p-3 bg-[var(--paper-node)] rounded-xl border border-[var(--ink-border)] text-center text-[var(--ink-light)] text-xs font-medium">
          Run simulation to see real-time node telemetry metrics.
        </div>
      )}

      {/* Chaos & Fault Status Panel inside Config Popup */}
      {Boolean(selectedNode.data?.chaosActive || (typeof selectedNode.data?.errors === 'number' && selectedNode.data.errors > 0)) && (
        <div className="p-3.5 bg-red-500/10 dark:bg-red-950/50 rounded-xl border border-red-500/60 shadow-md space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-300 font-bold text-xs">
              <span className="text-base animate-pulse">💥</span>
              <span className="tracking-wide">Fault Injected: {selectedNode.data?.chaosActive || `${selectedNode.data?.errors}% Errors`}</span>
            </div>
          </div>
          <p className="text-[11px] text-red-600/90 dark:text-red-300/80 leading-relaxed font-medium">
            This component is actively impacted by chaos engineering simulation. Click below to heal and remove fault injection from this specific node.
          </p>
          <button
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('acadmix:remove-node-chaos', { detail: { nodeId: selectedNode.id } }));
              }
            }}
            className="w-full py-2 px-3 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow-md transition-all flex items-center justify-center gap-1.5 border border-red-400/50"
          >
            <span>Heal / Remove Chaos 🩺</span>
          </button>
        </div>
      )}

      {/* Configuration Controls */}
      <NodeConfigurationMenu 
        type={selectedNode.type}
        data={selectedNode.data}
        onChange={(field: any, val: any) => selectedNode.data.onDataChange?.(selectedNode.id, field, val)}
      />

      {/* Architect Guide */}
      <div className="bg-blue-500/5 dark:bg-blue-400/5 rounded-xl p-3 border border-blue-500/10">
        <h4 className="text-[10px] font-bold text-[var(--accent-blue)] uppercase tracking-wider mb-1.5">Architect Guide</h4>
        <p className="text-xs font-semibold text-[var(--ink-light)] leading-relaxed">{guide.description}</p>
      </div>

      {/* Interview Trade-offs & Tips */}
      {guide.tradeOffs.length > 0 && (
        <div className="border-t border-[var(--ink-border)] pt-3 ">
          <h5 className="text-[10px] font-bold text-[var(--ink-light)] tracking-wider uppercase mb-2">Interview Trade-offs & Tips</h5>
          <div className="space-y-2">
            {guide.tradeOffs.map((tip: string, i: number) => (
              <div key={i} className="text-xs text-[var(--ink)] leading-relaxed flex items-start gap-2 bg-[var(--paper-node)] p-2.5 rounded-xl border border-[var(--ink-border)] font-medium">
                <span className="text-[var(--ink)] shrink-0 select-none">💡</span>
                <span>{tip}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return createPortal(popupContent, document.body);
}
