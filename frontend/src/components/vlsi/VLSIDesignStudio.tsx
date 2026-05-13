import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  useNodesState, useEdgesState, addEdge,
  type Connection, type Edge, type Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Cpu, Play, Pause, SkipForward, Code, Download, Trash, ArrowCounterClockwise } from '@phosphor-icons/react';
import { toast } from 'sonner';
import ComponentLibraryPanel from './ComponentLibraryPanel';
import PropertiesInspector from './PropertiesInspector';
import VLSICanvas from './VLSICanvas';
import { getCatalogEntry } from './componentCatalog';
import { evaluateNode, generateVerilog } from './vlsiEngine';
import type { LogicState } from './types';

let nodeCounter = 10;

// ─── Starter Circuit ──────────────────────────────────────────────────────────
const makeStarterNodes = (onPropertyChange: (id: string, f: string, v: any) => void): Node[] => [
  {
    id: 'clk-1', type: 'clock', position: { x: 80, y: 130 },
    data: { refDes: 'CLK1', componentType: 'clock', properties: { frequency: 1, label: 'CLK' }, pins: getCatalogEntry('clock')!.pins, logicOutputs: { out: 0 }, state: { clockState: 0 }, onPropertyChange },
  },
  {
    id: 'sw-1', type: 'input_switch', position: { x: 80, y: 280 },
    data: { refDes: 'SW1', componentType: 'input_switch', properties: { label: 'EN' }, pins: getCatalogEntry('input_switch')!.pins, logicOutputs: { out: 1 }, state: { state: 1 }, onPropertyChange },
  },
  {
    id: 'and-1', type: 'gate_and', position: { x: 300, y: 200 },
    data: { refDes: 'U1', componentType: 'gate_and', properties: {}, pins: getCatalogEntry('gate_and')!.pins, logicOutputs: { out: 0 }, onPropertyChange },
  },
  {
    id: 'led-1', type: 'output_led', position: { x: 520, y: 200 },
    data: { refDes: 'LED1', componentType: 'output_led', properties: { label: 'OUT', color: 'red' }, pins: getCatalogEntry('output_led')!.pins, logicInputs: { in: 0 }, onPropertyChange },
  },
];

const STARTER_EDGES: Edge[] = [
  { id: 'e1', source: 'clk-1', sourceHandle: 'out', target: 'and-1', targetHandle: 'in1', type: 'smoothstep', style: { stroke: '#475569', strokeWidth: 2 } },
  { id: 'e2', source: 'sw-1',  sourceHandle: 'out', target: 'and-1', targetHandle: 'in2', type: 'smoothstep', style: { stroke: '#10B981', strokeWidth: 2 } },
  { id: 'e3', source: 'and-1', sourceHandle: 'out', target: 'led-1', targetHandle: 'in',  type: 'smoothstep', style: { stroke: '#475569', strokeWidth: 2 } },
];

export default function VLSIDesignStudio({ user }: { user?: any }) {
  // We store onPropertyChange in a ref so we can reference it in starter nodes
  const onPropertyChangeRef = useRef<(id: string, f: string, v: any) => void>(() => {});

  const [nodes, setNodes, onNodesChange] = useNodesState(makeStarterNodes((...args) => onPropertyChangeRef.current(...args)));
  const [edges, setEdges, onEdgesChange] = useEdgesState(STARTER_EDGES);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [verilogCode, setVerilogCode] = useState('');

  const simIntervalRef = useRef<number | null>(null);
  const selectedNode = nodes.find(n => n.id === selectedId);

  // ─── onPropertyChange (stable ref) ─────────────────────────────────────────
  const handlePropertyChange = useCallback((id: string, field: string, value: string | number | boolean) => {
    setNodes(nds => nds.map(n => {
      if (n.id !== id) return n;
      if (field === 'state') {
        return {
          ...n,
          data: {
            ...n.data,
            state: { ...(n.data.state as any), state: value },
            logicOutputs: { out: value as LogicState },
          },
        };
      }
      return {
        ...n,
        data: {
          ...n.data,
          properties: { ...(n.data.properties as any), [field]: value },
        },
      };
    }));
  }, [setNodes]);

  // Assign to ref so starter nodes (and new nodes) can call latest version
  useEffect(() => { onPropertyChangeRef.current = handlePropertyChange; }, [handlePropertyChange]);

  // ─── Connect ────────────────────────────────────────────────────────────────
  const onConnect = useCallback((params: Connection) => {
    setEdges(eds => addEdge({ ...params, type: 'smoothstep', style: { stroke: '#475569', strokeWidth: 2 } }, eds));
  }, [setEdges]);

  // ─── Node Click ─────────────────────────────────────────────────────────────
  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedId(node.id);
  }, []);

  const onPaneClick = useCallback(() => setSelectedId(null), []);

  // ─── Add Component ──────────────────────────────────────────────────────────
  const handleAddComponent = useCallback((type: string) => {
    const catalog = getCatalogEntry(type);
    if (!catalog) return;
    const id = `node-${Date.now()}-${++nodeCounter}`;
    const newNode: Node = {
      id,
      type: catalog.type,
      position: { x: 250 + Math.random() * 60, y: 200 + Math.random() * 60 },
      data: {
        componentType: catalog.type,
        refDes: `${catalog.refDesPrefix}${nodeCounter}`,
        properties: { ...(catalog.defaultProperties ?? {}) },
        pins: catalog.pins,
        state: catalog.type === 'input_switch' ? { state: 0 } : catalog.type === 'clock' ? { clockState: 0 } : {},
        logicOutputs: {},
        logicInputs: {},
        onPropertyChange: (...args: [string, string, any]) => onPropertyChangeRef.current(...args),
      },
    };
    setNodes(nds => [...nds, newNode]);
    toast.success(`Added ${catalog.label}`, { duration: 1500 });
  }, [setNodes]);

  // ─── Delete Node ────────────────────────────────────────────────────────────
  const handleDeleteNode = useCallback((id: string) => {
    setNodes(nds => nds.filter(n => n.id !== id));
    setEdges(eds => eds.filter(e => e.source !== id && e.target !== id));
    if (selectedId === id) setSelectedId(null);
    toast.info('Node deleted', { duration: 1500 });
  }, [setNodes, setEdges, selectedId]);

  // ─── Simulation Step ────────────────────────────────────────────────────────
  const runSimulationStep = useCallback(() => {
    setNodes(currentNodes => {
      // 1) Toggle clocks on every step (when running)
      let updated = currentNodes.map(n => {
        if (n.type !== 'clock') return n;
        const prev = (n.data.state as any)?.clockState ?? 0;
        const next = prev === 1 ? 0 : 1;
        return {
          ...n,
          data: { ...n.data, state: { ...(n.data.state as any), clockState: next }, logicOutputs: { out: next } },
        };
      });

      // 2) Iterative combinational settling (3 passes)
      for (let pass = 0; pass < 4; pass++) {
        updated = updated.map(n => {
          const nodeInputs: Record<string, LogicState> = {};
          // Look up connected edges from the CURRENT edges snapshot
          edges.forEach(edge => {
            if (edge.target !== n.id) return;
            const src = updated.find(s => s.id === edge.source);
            if (!src) return;
            const val = (src.data.logicOutputs as any)?.[edge.sourceHandle!];
            nodeInputs[edge.targetHandle!] = val;
          });
          const { outputs, newState } = evaluateNode(
            n.type ?? '',
            nodeInputs,
            (n.data.state as any) ?? {},
          );
          return {
            ...n,
            data: { ...n.data, state: newState, logicOutputs: outputs, logicInputs: nodeInputs },
          };
        });
      }
      return updated;
    });

    // 3) Colour wires based on updated output states
    setEdges(currentEdges => {
      // Need latest node states — read them synchronously via a functional update trick
      let latestNodes: Node[] = [];
      setNodes(nds => { latestNodes = nds; return nds; }); // read without mutate

      return currentEdges.map(e => {
        const src = latestNodes.find(n => n.id === e.source);
        const val = src ? (src.data.logicOutputs as any)?.[e.sourceHandle!] : undefined;
        const isHigh = val === 1;
        const isLow  = val === 0;
        const color  = isHigh ? '#10B981' : isLow ? '#F43F5E' : '#475569';
        return {
          ...e,
          animated: isHigh,
          style: { ...e.style, stroke: color, strokeWidth: isHigh ? 2.5 : 2 },
        };
      });
    });
  }, [edges, setNodes, setEdges]);

  // ─── Playback interval ──────────────────────────────────────────────────────
  useEffect(() => {
    if (isRunning) {
      simIntervalRef.current = window.setInterval(runSimulationStep, 500);
    } else {
      if (simIntervalRef.current) clearInterval(simIntervalRef.current);
    }
    return () => { if (simIntervalRef.current) clearInterval(simIntervalRef.current); };
  }, [isRunning, runSimulationStep]);

  // ─── Verilog Generation ─────────────────────────────────────────────────────
  const handleGenerateCode = useCallback(() => {
    const graph = {
      nodes: nodes.map(n => ({
        id: n.id,
        type: n.type ?? '',
        properties: (n.data.properties as any) ?? {},
        refDes: n.data.refDes as string,
      })),
      edges: edges.map(e => ({
        id: e.id,
        source: e.source,
        sourceHandle: e.sourceHandle ?? '',
        target: e.target,
        targetHandle: e.targetHandle ?? '',
      })),
    };
    const code = generateVerilog(graph);
    setVerilogCode(code);
    setShowCode(true);
  }, [nodes, edges]);

  // ─── Clear Canvas ───────────────────────────────────────────────────────────
  const handleClear = useCallback(() => {
    setNodes([]);
    setEdges([]);
    setSelectedId(null);
    setIsRunning(false);
    toast.info('Canvas cleared');
  }, [setNodes, setEdges]);

  // ─── Download Verilog ───────────────────────────────────────────────────────
  const handleDownload = useCallback(() => {
    const blob = new Blob([verilogCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'design.v'; a.click();
    URL.revokeObjectURL(url);
  }, [verilogCode]);

  return (
    <div className="w-full h-full flex bg-[#0B0F19] text-slate-200 overflow-hidden">

      {/* Left panel – component library */}
      <div className="w-60 shrink-0 h-full relative z-10 border-r border-slate-800/70">
        <ComponentLibraryPanel onAddComponent={handleAddComponent} />
      </div>

      {/* Centre – canvas + toolbar */}
      <div className="flex-1 flex flex-col relative h-full min-w-0">

        {/* Top toolbar */}
        <div className="h-12 bg-[#0F172A]/90 backdrop-blur-xl border-b border-slate-800 flex items-center justify-between px-4 shrink-0 z-10">
          <h2 className="text-[11px] font-black tracking-[0.2em] uppercase text-slate-400 flex items-center gap-2 select-none">
            <Cpu size={16} className="text-indigo-400" weight="duotone" />
            VLSI Logic Studio
          </h2>

          <div className="flex items-center gap-1 bg-slate-900/60 p-0.5 rounded-full border border-slate-800/80">
            {/* Play / Pause */}
            <button
              onClick={() => setIsRunning(r => !r)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold transition-all whitespace-nowrap
                ${isRunning
                  ? 'bg-amber-500/15 text-amber-400 hover:bg-amber-500/25'
                  : 'bg-emerald-600 text-white shadow-md'
                }`}
            >
              {isRunning ? <Pause size={12} weight="fill" /> : <Play size={12} weight="fill" />}
              {isRunning ? 'Stop' : 'Play'}
            </button>

            {/* Step */}
            <button
              onClick={runSimulationStep}
              disabled={isRunning}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold text-slate-400 hover:text-slate-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
            >
              <SkipForward size={12} weight="fill" /> Step
            </button>

            <div className="w-px h-3.5 bg-slate-700 mx-0.5" />

            {/* Gen Verilog */}
            <button
              onClick={handleGenerateCode}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold text-slate-400 hover:text-slate-200 transition-all whitespace-nowrap"
            >
              <Code size={12} weight="bold" /> Verilog
            </button>

            {/* Clear */}
            <button
              onClick={handleClear}
              className="flex items-center justify-center w-6 h-6 rounded-full text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
              title="Clear canvas"
            >
              <Trash size={12} weight="bold" />
            </button>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 relative bg-[#0B0F19]">
          <VLSICanvas
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
          />

          {/* Running indicator */}
          {isRunning && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-400 text-[10px] font-bold backdrop-blur-sm shadow z-20 pointer-events-none">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Simulation Running
            </div>
          )}
        </div>
      </div>

      {/* Right panel – properties */}
      <div className="w-60 shrink-0 h-full relative z-10 border-l border-slate-800/70">
        <PropertiesInspector
          selectedNode={selectedNode}
          onPropertyChange={handlePropertyChange}
          onDelete={handleDeleteNode}
        />
      </div>

      {/* Verilog modal */}
      {showCode && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-8">
          <div className="bg-[#0F172A] border border-slate-700 rounded-2xl w-full max-w-2xl flex flex-col shadow-2xl overflow-hidden">
            <div className="px-5 py-3 bg-slate-800/50 border-b border-slate-700/80 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Code size={16} className="text-indigo-400" /> Generated Verilog HDL
              </h3>
              <div className="flex items-center gap-2">
                <button onClick={handleDownload} className="flex items-center gap-1 px-2 py-1 text-[11px] text-slate-400 hover:text-white bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors">
                  <Download size={13} /> .v
                </button>
                <button onClick={() => setShowCode(false)} className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs rounded-lg font-bold transition-colors">
                  Close
                </button>
              </div>
            </div>
            <div className="p-5 overflow-y-auto max-h-[65vh]">
              <pre className="font-mono text-[12px] text-emerald-400 leading-relaxed whitespace-pre-wrap">{verilogCode}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
