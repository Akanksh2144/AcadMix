import React, { useState, useEffect } from 'react';
import {
  X, Crosshair, Stack, Lightning, ShieldWarning, CheckCircle,
  Database, Desktop, Globe, Queue, HardDrive, Target, Flame,
  Trophy, SlidersHorizontal, ArrowRight, Info
} from '@phosphor-icons/react';
import type { Node } from '@xyflow/react';

interface ChaosTargetModalProps {
  isOpen: boolean;
  onClose: () => void;
  chaosItem: any | null;
  nodes: Node[];
  onInject: (chaosItem: any, targetIds?: string | string[], blastMode?: 'single' | 'layer' | 'global') => void;
}

export default function ChaosTargetModal({
  isOpen,
  onClose,
  chaosItem,
  nodes,
  onInject,
}: ChaosTargetModalProps) {
  const [blastMode, setBlastMode] = useState<'single' | 'layer' | 'global'>('single');
  const [selectedNodeId, setSelectedNodeId] = useState<string>('');

  // Filter out non-component nodes (like lanes or purely visual containers)
  const availableNodes = nodes.filter(
    (n) => n.type !== 'lane' && n.type !== 'metricsDashboard'
  );

  useEffect(() => {
    if (availableNodes.length > 0 && !selectedNodeId) {
      // Default select first database or compute node if available
      const firstDbOrCompute = availableNodes.find(
        (n) => n.type === 'sqlDatabase' || n.type === 'nosqlDatabase' || n.type === 'appServer'
      );
      if (firstDbOrCompute) {
        setSelectedNodeId(firstDbOrCompute.id);
      } else {
        setSelectedNodeId(availableNodes[0].id);
      }
    }
  }, [availableNodes, selectedNodeId, isOpen]);

  if (!isOpen || !chaosItem) return null;

  const handleApply = () => {
    if (blastMode === 'single') {
      if (!selectedNodeId) return;
      onInject(chaosItem, selectedNodeId, 'single');
    } else if (blastMode === 'layer') {
      onInject(chaosItem, undefined, 'layer');
    } else {
      onInject(chaosItem, undefined, 'global');
    }
    onClose();
  };

  const getLayerDescription = (item: any) => {
    const id = item?.id || '';
    if (id.includes('disk') || id.includes('storage') || id.includes('cache')) {
      return 'Targets only Database (SQL/NoSQL), Object Storage, and Caching layers.';
    }
    if (id.includes('instance') || id.includes('memory') || id.includes('thread') || id.includes('cpu') || id.includes('deadlock')) {
      return 'Targets only Compute nodes (App Servers, Worker Pools, Microservices).';
    }
    if (id.includes('network') || id.includes('packet') || id.includes('latency') || id.includes('dns') || id.includes('tls') || id.includes('lb')) {
      return 'Targets only Entry & Gateway nodes (DNS, CDN, Load Balancers, Proxies).';
    }
    return 'Targets all active compute and data nodes matching this fault profile.';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[var(--paper)] border-2 border-[var(--ink-border)] rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-[var(--paper-node)] border-b border-[var(--ink-border)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl select-none">{chaosItem.emoji}</span>
            <div>
              <h3 className="text-lg font-bold text-[var(--ink)] flex items-center gap-2">
                {chaosItem.label}
                <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 border border-red-500/30 font-semibold">
                  SPOF Targeting
                </span>
              </h3>
              <p className="text-xs text-[var(--ink-light)] truncate max-w-[320px]">
                {chaosItem.description}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-lg flex items-center justify-center text-[var(--ink-light)] hover:text-[var(--ink)] hover:bg-[var(--paper-alt)] transition-colors"
          >
            <X size={18} weight="bold" />
          </button>
        </div>

        {/* Body: Blast Radius Selection */}
        <div className="p-6 space-y-5">
          <div>
            <label className="text-xs font-bold text-[var(--ink-light)] uppercase tracking-wider block mb-2">
              1. Select Blast Radius (Target Scope)
            </label>

            {/* Pill Tab Switcher */}
            <div className="flex p-1 bg-[var(--paper-node)] border border-[var(--ink-border)] rounded-full text-xs font-bold gap-1 shadow-inner">
              <button
                onClick={() => setBlastMode('single')}
                className={`flex-1 py-2 px-3 rounded-full flex items-center justify-center gap-1.5 transition-all ${
                  blastMode === 'single'
                    ? 'bg-[var(--accent-blue)] text-white shadow-sm'
                    : 'text-[var(--ink-light)] hover:text-[var(--ink)] hover:bg-[var(--paper-alt)]'
                }`}
              >
                <Crosshair size={15} weight={blastMode === 'single' ? 'bold' : 'regular'} />
                <span>Single Component (SPOF)</span>
              </button>
              <button
                onClick={() => setBlastMode('layer')}
                className={`flex-1 py-2 px-3 rounded-full flex items-center justify-center gap-1.5 transition-all ${
                  blastMode === 'layer'
                    ? 'bg-[var(--accent-orange)] text-white shadow-sm'
                    : 'text-[var(--ink-light)] hover:text-[var(--ink)] hover:bg-[var(--paper-alt)]'
                }`}
              >
                <Stack size={15} weight={blastMode === 'layer' ? 'bold' : 'regular'} />
                <span>Layer Specific</span>
              </button>
              <button
                onClick={() => setBlastMode('global')}
                className={`flex-1 py-2 px-3 rounded-full flex items-center justify-center gap-1.5 transition-all ${
                  blastMode === 'global'
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'text-[var(--ink-light)] hover:text-[var(--ink)] hover:bg-[var(--paper-alt)]'
                }`}
              >
                <Flame size={15} weight={blastMode === 'global' ? 'bold' : 'regular'} />
                <span>System-Wide</span>
              </button>
            </div>
          </div>

          {/* Mode Specific Configuration */}
          {blastMode === 'single' && (
            <div className="space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[var(--ink)]">Target Specific Node on Canvas:</span>
                <span className="text-[var(--ink-light)]">{availableNodes.length} active nodes available</span>
              </div>

              {availableNodes.length === 0 ? (
                <div className="p-4 bg-[var(--paper-alt)] border border-[var(--ink-border)] rounded-xl text-center text-xs text-[var(--ink-light)]">
                  No active components found on the canvas. Drag components first to test SPOF failover.
                </div>
              ) : (
                <div className="max-h-52 overflow-y-auto pr-1 space-y-2">
                  {availableNodes.map((node) => {
                    const isSelected = selectedNodeId === node.id;
                    const metrics = (node.data?.metrics as any) || {};
                    const qps = metrics.processedQPS ? `${metrics.processedQPS.toFixed(0)} QPS` : '0 QPS';
                    const isHealthy = metrics.status !== 'critical' && !node.data?.chaosActive;

                    return (
                      <button
                        key={node.id}
                        type="button"
                        onClick={() => setSelectedNodeId(node.id)}
                        className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'border-[var(--accent-blue)] bg-blue-50/20 dark:bg-blue-950/20 ring-2 ring-[var(--accent-blue)]/50'
                            : 'border-[var(--ink-border)] bg-[var(--paper-node)] hover:bg-[var(--paper-alt)]'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                            isSelected ? 'bg-[var(--accent-blue)] text-white' : 'bg-[var(--paper-alt)] text-[var(--ink)]'
                          }`}>
                            <Target size={18} weight="bold" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-sm text-[var(--ink)] truncate">
                              {(node.data?.label as string) || node.type}
                            </div>
                            <div className="text-xs text-[var(--ink-light)] flex items-center gap-2">
                              <span className="uppercase font-mono tracking-wider">{node.type}</span>
                              <span>•</span>
                              <span>{qps}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {node.data?.chaosActive ? (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-red-500/20 text-red-500 font-bold border border-red-500/30">
                              Degraded
                            </span>
                          ) : (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold">
                              Healthy
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {blastMode === 'layer' && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-800 dark:text-amber-200 space-y-1.5 animate-fadeIn">
              <div className="font-bold flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                <Info size={16} weight="fill" />
                <span>Layer-Scoped Blast Radius</span>
              </div>
              <p>{getLayerDescription(chaosItem)}</p>
            </div>
          )}

          {blastMode === 'global' && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-800 dark:text-red-200 space-y-1.5 animate-fadeIn">
              <div className="font-bold flex items-center gap-1.5 text-red-600 dark:text-red-400">
                <Flame size={16} weight="fill" />
                <span>System-Wide Blast Radius (Global Outage)</span>
              </div>
              <p>
                Injects this degradation across all {availableNodes.length} active nodes simultaneously. Ideal for testing total catastrophe and region blackout resilience.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[var(--paper-node)] border-t border-[var(--ink-border)] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-[var(--ink-border)] text-[var(--ink)] hover:bg-[var(--paper-alt)] text-xs font-bold transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={blastMode === 'single' && !selectedNodeId}
            className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 shadow-md transition-all active:scale-95"
          >
            <span>🚀 Inject Fault</span>
            <ArrowRight size={14} weight="bold" />
          </button>
        </div>
      </div>
    </div>
  );
}
