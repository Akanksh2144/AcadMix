/**
 * System Design Architect Arena — Main Page
 *
 * Provides the interactive design canvas, sidebar component palette,
 * Recharts metrics panel, and progressive challenge engine.
 */

import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  BackgroundVariant,
  Panel,
  useNodesState,
  useEdgesState,
  addEdge,
  ReactFlowProvider,
  useReactFlow,
  type Connection,
  type Edge,
  type Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import {
  Play, Trophy, Lightbulb, CornersOut, CornersIn,
  ArrowSquareOut, ArrowSquareIn, ArrowsClockwise,
  Question, CheckCircle, Warning, X, CaretDown, CaretUp, BookOpen,
} from '@phosphor-icons/react';

import PageHeader from '../components/PageHeader';
import AlertModal from '../components/AlertModal';
import ComponentPalette from '../components/system-design/ComponentPalette';
import MetricsPanel from '../components/system-design/MetricsPanel';
import ChallengeSelector from '../components/system-design/ChallengeSelector';
import { CHALLENGES, checkChallengePassed } from '../components/system-design/challenges';
import { runSimulation } from '../components/system-design/engine';
import type { SimulationResult, ChallengeConfig } from '../components/system-design/types';

// ── Node Types Registration ──────────────────────────────────────────────────

import ClientNode from '../components/system-design/nodes/ClientNode';
import DNSNode from '../components/system-design/nodes/DNSNode';
import CDNNode from '../components/system-design/nodes/CDNNode';
import LoadBalancerNode from '../components/system-design/nodes/LoadBalancerNode';
import AppServerNode from '../components/system-design/nodes/AppServerNode';
import CacheNode from '../components/system-design/nodes/CacheNode';
import SQLDatabaseNode from '../components/system-design/nodes/SQLDatabaseNode';
import NoSQLDatabaseNode from '../components/system-design/nodes/NoSQLDatabaseNode';
import ObjectStorageNode from '../components/system-design/nodes/ObjectStorageNode';
import MessageQueueNode from '../components/system-design/nodes/MessageQueueNode';
import WorkerPoolNode from '../components/system-design/nodes/WorkerPoolNode';
import MetricsDashboardNode from '../components/system-design/nodes/MetricsDashboardNode';

const nodeTypes = {
  client: ClientNode,
  dns: DNSNode,
  cdn: CDNNode,
  loadBalancer: LoadBalancerNode,
  appServer: AppServerNode,
  cache: CacheNode,
  sqlDatabase: SQLDatabaseNode,
  nosqlDatabase: NoSQLDatabaseNode,
  objectStorage: ObjectStorageNode,
  messageQueue: MessageQueueNode,
  workerPool: WorkerPoolNode,
  metricsDashboard: MetricsDashboardNode,
};

let nodeCounter = 1000;

// ── Flow Workspace Content (wrapped in ReactFlowProvider) ────────────────────

function SystemDesignFlowWorkspace({ navigate, user }: any) {
  // State
  const [currentChallenge, setCurrentChallenge] = useState<ChallengeConfig>(CHALLENGES[1]); // Default to Stage 1
  const [nodes, setNodes, onNodesChange] = useNodesState(CHALLENGES[1].initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(CHALLENGES[1].initialEdges);
  const [simResult, setSimResult] = useState<SimulationResult | null>(null);
  
  // UI states
  const [isChallengeSelectorOpen, setIsChallengeSelectorOpen] = useState(false);
  const [completedChallenges, setCompletedChallenges] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('acadmix_completed_sysdesign_challenges');
    return saved ? new Set(JSON.parse(saved)) : new Set<string>();
  });
  const [showHintIndex, setShowHintIndex] = useState(0);
  const [isBriefExpanded, setIsBriefExpanded] = useState(true);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '', type: 'info' as 'info' | 'error' | 'success' });

  const { screenToFlowPosition, fitView } = useReactFlow();
  const workspaceRef = useRef<HTMLDivElement>(null);

  // ── Callbacks ─────────────────────────────────────────────────────────────

  // Trigger alert
  const triggerAlert = (title: string, message: string, type: 'info' | 'error' | 'success' = 'info') => {
    setAlertConfig({ title, message, type });
    setIsAlertOpen(true);
  };

  // Node parameter update
  const handleNodeDataChange = useCallback(
    (nodeId: string, field: string, value: any) => {
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id === nodeId) {
            return { ...n, data: { ...n.data, [field]: value } };
          }
          return n;
        }),
      );
    },
    [setNodes],
  );

  // Enrich nodes with change listener and metrics injection
  const enrichedNodes = useMemo(() => {
    return nodes.map((n) => {
      const nodeMetrics = simResult?.nodeMetrics[n.id];
      return {
        ...n,
        data: {
          ...n.data,
          onDataChange: handleNodeDataChange,
          metrics: nodeMetrics,
          // Inject overall sim result into dashboard nodes
          ...(n.type === 'metricsDashboard' ? { simResult } : {}),
        },
      };
    });
  }, [nodes, handleNodeDataChange, simResult]);

  // Connect edges
  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            animated: true,
            style: { stroke: '#6366f1', strokeWidth: 2 },
          },
          eds,
        ),
      );
    },
    [setEdges],
  );

  // Drop component from sidebar onto canvas
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const type = event.dataTransfer.getData('application/reactflow');
      const defaultsStr = event.dataTransfer.getData('application/reactflow-defaults');

      if (!type) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const defaults = defaultsStr ? JSON.parse(defaultsStr) : {};

      const newNode: Node = {
        id: `node_${type}_${nodeCounter++}`,
        type,
        position,
        data: {
          ...defaults,
          label: `${defaults.label || type}`,
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [screenToFlowPosition, setNodes],
  );

  // Extract simulation-relevant configuration to avoid infinite loops from React Flow layout measurement updates
  const simInputKey = useMemo(() => {
    return JSON.stringify({
      nodes: nodes.map(n => ({
        id: n.id,
        type: n.type,
        data: Object.keys(n.data || {}).reduce((acc: any, key) => {
          if (key !== 'onDataChange' && key !== 'metrics' && key !== 'simResult') {
            acc[key] = n.data[key];
          }
          return acc;
        }, {}),
      })),
      edges: edges.map(e => ({
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle,
        targetHandle: e.targetHandle,
      }))
    });
  }, [nodes, edges]);

  // Live simulation update when graph structure or configuration changes
  React.useEffect(() => {
    if (nodes.length === 0) {
      setSimResult(null);
      return;
    }
    const clientNode = nodes.find((n) => n.type === 'client');
    if (!clientNode) {
      setSimResult(null);
      return;
    }
    try {
      const graphNodes = nodes.map((n) => ({
        id: n.id,
        type: n.type!,
        data: n.data,
      }));
      const graphEdges = edges.map((e) => ({
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle,
        targetHandle: e.targetHandle,
      }));
      const result = runSimulation(graphNodes, graphEdges);

      // Cap grade to C- if the system did not meet the stage constraints
      if (currentChallenge.stage > 0) {
        const challengeRes = checkChallengePassed(currentChallenge, result);
        if (!challengeRes.passed) {
          result.grade = result.grade.startsWith('A') || result.grade.startsWith('B') ? 'C-' : result.grade;
        }
      }
      setSimResult(result);
    } catch (err) {
      // Ignore errors during live dragging to avoid console spam
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [simInputKey, currentChallenge]);

  // Run Load Test Simulation (Explicit verification with popup dialogs)
  const handleRunSimulation = () => {
    if (nodes.length === 0) {
      triggerAlert('Empty Canvas', 'Drag and drop components to build your architecture first.', 'error');
      return;
    }

    const clientNode = nodes.find((n) => n.type === 'client');
    if (!clientNode) {
      triggerAlert('Missing Client', 'Your architecture must have at least one Client / Users node to generate traffic.', 'error');
      return;
    }

    try {
      const graphNodes = nodes.map((n) => ({
        id: n.id,
        type: n.type!,
        data: n.data,
      }));
      const graphEdges = edges.map((e) => ({
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle,
        targetHandle: e.targetHandle,
      }));

      const result = runSimulation(graphNodes, graphEdges);

      if (currentChallenge.stage > 0) {
        const challengeRes = checkChallengePassed(currentChallenge, result);
        if (challengeRes.passed) {
          const newCompleted = new Set(completedChallenges);
          newCompleted.add(currentChallenge.id);
          setCompletedChallenges(newCompleted);
          localStorage.setItem('acadmix_completed_sysdesign_challenges', JSON.stringify(Array.from(newCompleted)));

          triggerAlert(
            'Challenge Passed!',
            `Outstanding work! Your system successfully handled ${currentChallenge.targetQPS} QPS under budget.`,
            'success',
          );
        } else {
          // Cap grade to C- if the system did not meet the stage constraints
          result.grade = result.grade.startsWith('A') || result.grade.startsWith('B') ? 'C-' : result.grade;
          triggerAlert(
            'Verification Failed',
            challengeRes.reasons.join('\n'),
            'error',
          );
        }
      } else {
        triggerAlert(
          'Simulation Complete',
          `Sandbox simulation processed ${result.system.successfulQPS} QPS with 0 errors.`,
          'success',
        );
      }
    } catch (err: any) {
      triggerAlert('Simulation Error', err.message || 'An error occurred during topological propagation.', 'error');
    }
  };

  // Reset Canvas
  const handleReset = () => {
    setNodes(currentChallenge.initialNodes);
    setEdges(currentChallenge.initialEdges);
    setSimResult(null);
    setShowHintIndex(0);
  };

  // Select Challenge
  const handleSelectChallenge = (challenge: ChallengeConfig) => {
    setCurrentChallenge(challenge);
    setNodes(challenge.initialNodes);
    setEdges(challenge.initialEdges);
    setSimResult(null);
    setShowHintIndex(0);
    // Auto-fit view after state registers
    setTimeout(() => fitView({ padding: 0.2, duration: 800 }), 100);
  };

  // Show Hint
  const handleShowHint = () => {
    if (currentChallenge.hints.length === 0) return;
    const nextIdx = (showHintIndex + 1) % (currentChallenge.hints.length + 1);
    setShowHintIndex(nextIdx);
  };

  // Toggle fullscreen
  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      workspaceRef.current?.requestFullscreen().then(() => setIsFullScreen(true));
    } else {
      document.exitFullscreen().then(() => setIsFullScreen(false));
    }
  };

  const challengeResult = useMemo(() => {
    if (currentChallenge.stage === 0 || !simResult) return undefined;
    return checkChallengePassed(currentChallenge, simResult);
  }, [currentChallenge, simResult]);

  return (
    <div
      ref={workspaceRef}
      className="h-screen flex flex-col bg-[#F8FAFC] dark:bg-[#0B0F19] transition-colors duration-300 relative"
    >
      {/* Page Header (only when not in fullscreen mode) */}
      {!isFullScreen && (
        <PageHeader
          navigate={navigate}
          user={user}
          title="System Design Arena"
          subtitle={`Stage ${currentChallenge.stage}: ${currentChallenge.title}`}
          maxWidth="max-w-[100%]"
          className="px-6 border-b border-gray-200 dark:border-gray-800 shrink-0"
        />
      )}

      {/* Workspace Split */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left Side: Component Palette */}
        <ComponentPalette className="w-64 shrink-0 hidden md:flex" />

        {/* Center: Canvas Workspace */}
        <div
          className="flex-1 min-w-0 h-full flex flex-col relative"
          onDragOver={onDragOver}
          onDrop={onDrop}
        >
          {/* Top Control Overlay */}
          <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
            {/* Left buttons: Challenge selection + Hint */}
            <div className="flex items-center gap-2 pointer-events-auto">
              <button
                onClick={() => setIsChallengeSelectorOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-850 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-extrabold transition-all border border-gray-200 dark:border-gray-800/80 shadow-md shadow-black/5 active:scale-95"
              >
                <Trophy size={14} weight="fill" className="text-amber-500" />
                Select Stage
              </button>

              {currentChallenge.stage > 0 && (
                <button
                  onClick={handleShowHint}
                  className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-gray-850 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-xl text-xs font-bold transition-all border border-gray-200 dark:border-gray-800/80 shadow-md shadow-black/5 active:scale-95"
                >
                  <Lightbulb size={14} weight="bold" className="text-amber-400" />
                  Hint {showHintIndex > 0 ? `(${showHintIndex}/${currentChallenge.hints.length})` : ''}
                </button>
              )}
            </div>

            {/* Right buttons: Canvas actions */}
            <div className="flex items-center gap-2 pointer-events-auto">
              <button
                onClick={handleReset}
                title="Reset Workspace"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 dark:border-gray-800/80 bg-white dark:bg-gray-850 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-700 transition-colors shadow-md shadow-black/5 active:scale-95"
              >
                <ArrowsClockwise size={16} weight="bold" />
              </button>
              <button
                onClick={toggleFullScreen}
                title="Fullscreen Toggle"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 dark:border-gray-800/80 bg-white dark:bg-gray-850 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-700 transition-colors shadow-md shadow-black/5 active:scale-95"
              >
                {isFullScreen ? <CornersIn size={16} weight="bold" /> : <CornersOut size={16} weight="bold" />}
              </button>
              <button
                onClick={handleRunSimulation}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold transition-all shadow-lg shadow-emerald-500/25 active:scale-95 border-b-2 border-emerald-800"
              >
                <Play size={12} weight="fill" />
                Run Simulation
              </button>
            </div>
          </div>

          {/* Challenge Brief Panel */}
          {currentChallenge.stage > 0 && (
            <div className="absolute top-16 left-4 z-10 w-80 bg-white/95 dark:bg-[#1A202C]/95 backdrop-blur-md border border-slate-200/80 dark:border-white/10 p-4 rounded-2xl shadow-xl pointer-events-auto transition-all duration-300">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-extrabold text-xs uppercase tracking-wider">
                  <BookOpen size={14} weight="bold" />
                  <span>Stage Brief</span>
                </div>
                <button
                  onClick={() => setIsBriefExpanded(!isBriefExpanded)}
                  className="p-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                >
                  {isBriefExpanded ? <CaretUp size={12} weight="bold" /> : <CaretDown size={12} weight="bold" />}
                </button>
              </div>

              {isBriefExpanded ? (
                <>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white mb-1.5">
                    Stage {currentChallenge.stage}: {currentChallenge.title}
                  </h4>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed mb-3">
                    {currentChallenge.description}
                  </p>
                  <div className="grid grid-cols-3 gap-2 border-t border-slate-100 dark:border-white/5 pt-3">
                    <div>
                      <span className="block text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">Target</span>
                      <span className="text-[11px] font-black text-slate-800 dark:text-slate-100">{currentChallenge.targetQPS.toLocaleString()} QPS</span>
                    </div>
                    <div>
                      <span className="block text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">Latency</span>
                      <span className="text-[11px] font-black text-slate-800 dark:text-slate-100">&lt; {currentChallenge.maxLatencyP99}ms</span>
                    </div>
                    <div>
                      <span className="block text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">Budget</span>
                      <span className="text-[11px] font-black text-slate-800 dark:text-slate-100">${currentChallenge.maxBudget}/mo</span>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                  Stage {currentChallenge.stage}: {currentChallenge.title}
                </p>
              )}
            </div>
          )}

          {/* Hint Overlay Banner */}
          {showHintIndex > 0 && currentChallenge.hints[showHintIndex - 1] && (
            <div className="absolute top-16 left-4 right-4 z-10 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/30 rounded-2xl shadow-lg flex items-start gap-2.5 max-w-xl mx-auto pointer-events-auto">
              <Lightbulb size={18} weight="fill" className="text-amber-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-[11px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider mb-0.5">Architect Tip</p>
                <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                  {currentChallenge.hints[showHintIndex - 1]}
                </p>
              </div>
              <button onClick={() => setShowHintIndex(0)} className="text-amber-500 hover:text-amber-700">
                <X size={14} weight="bold" />
              </button>
            </div>
          )}

          {/* Flow Diagram Canvas */}
          <div className="flex-1 min-h-0">
            <ReactFlow
              nodes={enrichedNodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              nodeTypes={nodeTypes}
              fitView
              deleteKeyCode="Delete"
              defaultEdgeOptions={{ animated: true, style: { stroke: '#6366f1', strokeWidth: 2 } }}
              proOptions={{ hideAttribution: true }}
            >
              <Background
                variant={BackgroundVariant.Dots}
                gap={20}
                size={1}
                color="rgba(148, 163, 184, 0.15)"
              />
              <Controls
                position="bottom-left"
                className="!bg-white/80 dark:!bg-gray-800/80 !border !border-gray-200 dark:!border-gray-700 !rounded-xl !shadow-lg backdrop-blur-sm"
              />
              
              <Panel position="bottom-center">
                <div className="flex items-center gap-3 text-[10px] text-gray-400 dark:text-gray-500 font-mono bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-xl px-4 py-2 border border-gray-200/50 dark:border-gray-700/50 shadow-sm mb-2">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 rounded bg-white/60 dark:bg-white/10 text-[9px] font-bold shadow-sm">Delete</kbd>
                    <span className="opacity-80">Remove</span>
                  </span>
                  <span className="w-px h-3 bg-current opacity-20" />
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 rounded bg-white/60 dark:bg-white/10 text-[9px] font-bold shadow-sm">Drag</kbd>
                    <span className="opacity-80">Link</span>
                  </span>
                </div>
              </Panel>
            </ReactFlow>
          </div>
        </div>

        {/* Right Side: Metrics Dashboard */}
        <div className="w-80 shrink-0 border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 flex flex-col">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between shrink-0">
            <h3 className="text-xs font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
              Telemetry Dashboard
            </h3>
          </div>
          <div className="flex-1 overflow-hidden">
            <MetricsPanel
              result={simResult}
              challengeTargets={currentChallenge.stage > 0 ? currentChallenge : undefined}
              challengeResult={challengeResult}
            />
          </div>
        </div>
      </div>

      {/* Challenge Selector Modal */}
      <ChallengeSelector
        challenges={CHALLENGES}
        currentChallengeId={currentChallenge.id}
        isOpen={isChallengeSelectorOpen}
        onClose={() => setIsChallengeSelectorOpen(false)}
        onSelect={handleSelectChallenge}
        completedChallenges={completedChallenges}
      />

      {/* Alert Modal */}
      <AlertModal
        isOpen={isAlertOpen}
        onClose={() => setIsAlertOpen(false)}
        title={alertConfig.title}
        message={alertConfig.message}
      />
    </div>
  );
}

// ── Export Shell ─────────────────────────────────────────────────────────────

export default function SystemDesignArena(props: any) {
  return (
    <ReactFlowProvider>
      <SystemDesignFlowWorkspace {...props} />
    </ReactFlowProvider>
  );
}
