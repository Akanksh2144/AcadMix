import React, { useState, useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  BackgroundVariant,
  Panel,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  type Edge,
  type Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { Play, Plus, WaveSine, Funnel, ChartLineUp, SlidersHorizontal } from '@phosphor-icons/react';

import SignalGeneratorNode from './nodes/SignalGeneratorNode';
import AdderNode from './nodes/AdderNode';
import GainNode from './nodes/GainNode';
import FilterNode from './nodes/FilterNode';
import ScopeNode from './nodes/ScopeNode';
import { runSimulation, type SimulationResult } from './engine';

// ── Node type registry ───────────────────────────────────────────────────────

const nodeTypes = {
  signalGenerator: SignalGeneratorNode,
  adder: AdderNode,
  gain: GainNode,
  filter: FilterNode,
  scope: ScopeNode,
};

// ── Initial demo graph ───────────────────────────────────────────────────────

const INITIAL_NODES: Node[] = [
  {
    id: 'sig1',
    type: 'signalGenerator',
    position: { x: 50, y: 40 },
    data: { label: 'Sine 5 Hz', waveform: 'sine', frequency: 5, amplitude: 1, dcOffset: 0 },
  },
  {
    id: 'sig2',
    type: 'signalGenerator',
    position: { x: 50, y: 320 },
    data: { label: 'Square 20 Hz', waveform: 'square', frequency: 20, amplitude: 0.5, dcOffset: 0 },
  },
  {
    id: 'add1',
    type: 'adder',
    position: { x: 370, y: 160 },
    data: { label: 'Adder' },
  },
  {
    id: 'filt1',
    type: 'filter',
    position: { x: 570, y: 160 },
    data: { label: 'LP Filter', filterType: 'lowpass', cutoff: 0.15 },
  },
  {
    id: 'scope1',
    type: 'scope',
    position: { x: 850, y: 140 },
    data: { label: 'Scope' },
  },
];

const INITIAL_EDGES: Edge[] = [
  { id: 'e-sig1-add', source: 'sig1', target: 'add1', targetHandle: 'a', animated: true, style: { stroke: '#818cf8' } },
  { id: 'e-sig2-add', source: 'sig2', target: 'add1', targetHandle: 'b', animated: true, style: { stroke: '#818cf8' } },
  { id: 'e-add-filt', source: 'add1', target: 'filt1', animated: true, style: { stroke: '#34d399' } },
  { id: 'e-filt-scope', source: 'filt1', target: 'scope1', animated: true, style: { stroke: '#22d3ee' } },
];

// ── Toolbar palette ──────────────────────────────────────────────────────────

const PALETTE = [
  { type: 'signalGenerator', label: 'Signal Gen', icon: WaveSine, defaults: { label: 'Signal', waveform: 'sine', frequency: 5, amplitude: 1, dcOffset: 0 } },
  { type: 'adder', label: 'Adder', icon: Plus, defaults: { label: 'Adder' } },
  { type: 'gain', label: 'Gain', icon: SlidersHorizontal, defaults: { label: 'Gain', gain: 1 } },
  { type: 'filter', label: 'Filter', icon: Funnel, defaults: { label: 'Filter', filterType: 'lowpass', cutoff: 0.2 } },
  { type: 'scope', label: 'Scope', icon: ChartLineUp, defaults: { label: 'Scope' } },
] as const;

// ── Component ────────────────────────────────────────────────────────────────

let nodeCounter = 100;

export default function DSPBlockSimulator() {
  const [nodes, setNodes, onNodesChange] = useNodesState(INITIAL_NODES);
  const [edges, setEdges, onEdgesChange] = useEdgesState(INITIAL_EDGES);
  const [simResult, setSimResult] = useState<SimulationResult | null>(null);
  const [showPalette, setShowPalette] = useState(false);

  // ── Data change callback (passed into each node via data) ────────────────
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

  // Inject the callback & live signal data into every node's data
  const enrichedNodes = useMemo(() => {
    return nodes.map((n) => ({
      ...n,
      data: {
        ...n.data,
        onDataChange: handleNodeDataChange,
        // Inject scope data if available
        ...(n.type === 'scope' && simResult
          ? { signalData: simResult.signals[n.id], timeData: simResult.time }
          : {}),
      },
    }));
  }, [nodes, handleNodeDataChange, simResult]);

  // ── Connection handler ───────────────────────────────────────────────────
  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) =>
        addEdge(
          { ...params, animated: true, style: { stroke: '#818cf8' } },
          eds,
        ),
      );
    },
    [setEdges],
  );

  // ── Add node from palette ────────────────────────────────────────────────
  const addNode = useCallback(
    (type: string, defaults: Record<string, any>) => {
      const id = `node-${nodeCounter++}`;
      const newNode: Node = {
        id,
        type,
        position: { x: 300 + Math.random() * 200, y: 100 + Math.random() * 200 },
        data: { ...defaults },
      };
      setNodes((nds) => [...nds, newNode]);
      setShowPalette(false);
    },
    [setNodes],
  );

  // ── Run simulation ──────────────────────────────────────────────────────
  const handleRun = useCallback(() => {
    const graphNodes = nodes.map((n) => ({
      id: n.id,
      type: n.type!,
      data: n.data as any,
    }));
    const graphEdges = edges.map((e) => ({
      source: e.source,
      target: e.target,
      sourceHandle: e.sourceHandle,
      targetHandle: e.targetHandle,
    }));
    const result = runSimulation(graphNodes, graphEdges);
    setSimResult(result);
  }, [nodes, edges]);

  return (
    <div className="w-full h-full flex flex-col bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl overflow-hidden shadow-sm">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-md shadow-indigo-500/20">
            <WaveSine size={16} weight="bold" className="text-white" />
          </div>
          <span className="font-semibold text-gray-700 dark:text-gray-300">
            Native DSP Block Simulator
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Add Block button */}
          <div className="relative">
            <button
              onClick={() => setShowPalette(!showPalette)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-full text-sm font-semibold transition-all"
            >
              <Plus size={16} weight="bold" />
              Add Block
            </button>

            {/* Palette Dropdown */}
            {showPalette && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl shadow-black/20 z-50 overflow-hidden">
                {PALETTE.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.type}
                      onClick={() => addNode(item.type, { ...item.defaults })}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <Icon size={18} weight="duotone" />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Run button */}
          <button
            onClick={handleRun}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-semibold transition-all shadow-sm shadow-blue-500/20 active:scale-95"
          >
            <Play size={16} weight="fill" />
            Run Simulation
          </button>
        </div>
      </div>

      {/* React Flow Canvas */}
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
          defaultEdgeOptions={{ animated: true, style: { stroke: '#818cf8', strokeWidth: 2 } }}
          proOptions={{ hideAttribution: true }}
        >
          <Controls
            position="bottom-left"
            className="!bg-white/80 dark:!bg-gray-800/80 !border !border-gray-200 dark:!border-gray-700 !rounded-xl !shadow-lg backdrop-blur-sm"
          />
          <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1}
            color="rgba(148, 163, 184, 0.2)"
          />

          {/* Hint panel */}
          <Panel position="bottom-right">
            <div className="flex items-center gap-3 text-[11px] text-gray-400 dark:text-gray-500 font-mono bg-white/60 dark:bg-gray-800/60 backdrop-blur-md rounded-xl px-4 py-2 border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
              <span className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 rounded bg-white/60 dark:bg-white/10 text-[10px] font-bold shadow-sm">Scroll</kbd>
                <span className="opacity-80">Zoom</span>
              </span>
              <span className="w-px h-3.5 bg-current opacity-20" />
              <span className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 rounded bg-white/60 dark:bg-white/10 text-[10px] font-bold shadow-sm">Drag</kbd>
                <span className="opacity-80">Move</span>
              </span>
              <span className="w-px h-3.5 bg-current opacity-20" />
              <span className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 rounded bg-white/60 dark:bg-white/10 text-[10px] font-bold shadow-sm">Delete</kbd>
                <span className="opacity-80">Remove</span>
              </span>
            </div>
          </Panel>
        </ReactFlow>
      </div>
    </div>
  );
}
