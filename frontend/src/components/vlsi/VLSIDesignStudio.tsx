import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  useNodesState, useEdgesState, addEdge,
  type Connection, type Edge, type Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Cpu, Play, Pause, SkipForward, Code, Download, Trash, Users, ArrowCounterClockwise, ArrowClockwise, Copy, SignIn } from '@phosphor-icons/react';
import { toast } from 'sonner';
import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';

import ComponentLibraryPanel from './ComponentLibraryPanel';
import PropertiesInspector from './PropertiesInspector';
import VLSICanvas from './VLSICanvas';
import { getCatalogEntry } from './componentCatalog';
import { evaluateNode, generateVerilog, generateTestbench } from './vlsiEngine';
import type { LogicState, TimingData } from './types';
import WaveformViewer from './WaveformViewer';

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
  // ─── States & Refs ──────────────────────────────────────────────────────────
  const onPropertyChangeRef = useRef<(id: string, f: string, v: any) => void>(() => {});
  const [nodes, setNodes, onNodesChange] = useNodesState(makeStarterNodes((...args) => onPropertyChangeRef.current(...args)));
  const [edges, setEdges, onEdgesChange] = useEdgesState(STARTER_EDGES);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [verilogCode, setVerilogCode] = useState('');
  
  const [simulationHistory, setSimulationHistory] = useState<TimingData[]>([]);
  const [showWaveform, setShowWaveform] = useState(false);
  const [isWaveformExpanded, setIsWaveformExpanded] = useState(false);

  // Collaboration State
  const [roomId, setRoomId] = useState<string | null>(null);
  const [isColabActive, setIsColabActive] = useState(false);
  const [colabUsers, setColabUsers] = useState(0);
  const yDocRef = useRef<Y.Doc>(new Y.Doc());
  const undoManagerRef = useRef<Y.UndoManager | null>(null);
  const providerRef = useRef<any>(null);
  const isRemoteChange = useRef(false);
  const isSyncingRef = useRef(false);

  const simIntervalRef = useRef<number | null>(null);
  const simTimeRef = useRef<number>(0);
  const selectedNode = nodes.find(n => n.id === selectedId);

  // Initialize UndoManager
  useEffect(() => {
    const yNodes = yDocRef.current.getMap('nodes');
    const yEdges = yDocRef.current.getMap('edges');
    undoManagerRef.current = new Y.UndoManager([yNodes, yEdges]);
  }, []);

  const handleUndo = useCallback(() => undoManagerRef.current?.undo(), []);
  const handleRedo = useCallback(() => undoManagerRef.current?.redo(), []);

  // ─── Handlers ───────────────────────────────────────────────────────────────
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

  useEffect(() => { onPropertyChangeRef.current = handlePropertyChange; }, [handlePropertyChange]);

  const toggleCollaboration = useCallback((existingId?: string) => {
    if (isColabActive && !existingId) {
      providerRef.current?.destroy();
      providerRef.current = null;
      setIsColabActive(false);
      setRoomId(null);
      setColabUsers(0);
      toast.success('Collaboration ended');
    } else {
      const id = existingId || `vlsi-${Math.random().toString(36).substring(2, 9)}`;
      
      // Cleanup previous if switching
      if (providerRef.current) providerRef.current.destroy();

      setRoomId(id);
      providerRef.current = new WebrtcProvider(id, yDocRef.current, {
        signaling: ['wss://y-webrtc-signaling-eu.herokuapp.com', 'wss://y-webrtc-signaling-us.herokuapp.com'],
      });

      providerRef.current.on('peers', (params: any) => {
        setColabUsers(params.webrtcConns.size + 1);
      });

      setIsColabActive(true);
      toast.success(existingId ? `Joined room: ${id}` : `Started room: ${id}`);
    }
  }, [isColabActive]);

  const handleJoinRoom = useCallback(() => {
    const id = window.prompt('Enter Room ID to join:');
    if (id && id.trim()) {
      toggleCollaboration(id.trim());
    }
  }, [toggleCollaboration]);

  const handleCopyRoomId = useCallback(() => {
    if (roomId) {
      navigator.clipboard.writeText(roomId);
      toast.success('Room ID copied to clipboard');
    }
  }, [roomId]);

  const onConnect = useCallback((params: Connection) => {
    setEdges(eds => {
      const newEdges = addEdge({ ...params, type: 'smoothstep', style: { stroke: '#475569', strokeWidth: 2 } }, eds);
      if (isColabActive) {
        const yEdges = yDocRef.current.getMap('edges');
        const edgeId = `e-${params.source}-${params.target}-${params.sourceHandle}-${params.targetHandle}`;
        yEdges.set(edgeId, { ...params, type: 'smoothstep', id: edgeId });
      }
      return newEdges;
    });
  }, [setEdges, isColabActive]);

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => setSelectedId(node.id), []);
  const onPaneClick = useCallback(() => setSelectedId(null), []);

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
    setNodes(nds => {
      const next = nds.concat(newNode);
      const yNodes = yDocRef.current.getMap('nodes');
      yNodes.set(newNode.id, { ...newNode, data: { ...newNode.data, onPropertyChange: undefined } });
      return next;
    });
    toast.success(`Added ${catalog.label}`, { duration: 1500 });
  }, [setNodes]);

  const handleDeleteNode = useCallback((id: string) => {
    const yNodes = yDocRef.current.getMap('nodes');
    const yEdges = yDocRef.current.getMap('edges');
    
    yDocRef.current.transact(() => {
      yNodes.delete(id);
      // Also delete connected edges from Yjs
      yEdges.forEach((edge: any, edgeId) => {
        if (edge.source === id || edge.target === id) {
          yEdges.delete(edgeId);
        }
      });
    });

    if (selectedId === id) setSelectedId(null);
    toast.info('Component deleted', { duration: 1500 });
  }, [selectedId]);

  const onNodesDelete = useCallback((deletedNodes: Node[]) => {
    const yNodes = yDocRef.current.getMap('nodes');
    yDocRef.current.transact(() => {
      deletedNodes.forEach(node => yNodes.delete(node.id));
    });
  }, []);

  const onEdgesDelete = useCallback((deletedEdges: Edge[]) => {
    const yEdges = yDocRef.current.getMap('edges');
    yDocRef.current.transact(() => {
      deletedEdges.forEach(edge => yEdges.delete(edge.id));
    });
  }, []);

  // ─── Sync Yjs to Local State (THE SOURCE OF TRUTH) ────────────────────────
  useEffect(() => {
    const yNodes = yDocRef.current.getMap('nodes');
    const yEdges = yDocRef.current.getMap('edges');

    const syncFromYjs = () => {
      const remoteNodes = Array.from(yNodes.values()).map((n: any) => ({
        ...n,
        data: {
          ...n.data,
          onPropertyChange: (...args: [string, string, any]) => onPropertyChangeRef.current(...args),
        }
      }));
      const remoteEdges = Array.from(yEdges.values()) as Edge[];
      
      setNodes(remoteNodes as Node[]);
      setEdges(remoteEdges);
    };

    // Initialize Yjs if empty (seed it)
    if (yNodes.size === 0 && nodes.length > 0) {
      yDocRef.current.transact(() => {
        nodes.forEach(n => yNodes.set(n.id, { ...n, data: { ...n.data, onPropertyChange: undefined } }));
        edges.forEach(e => yEdges.set(e.id, e));
      });
    } else {
      syncFromYjs();
    }

    yNodes.observe(syncFromYjs);
    yEdges.observe(syncFromYjs);
    return () => {
      yNodes.unobserve(syncFromYjs);
      yEdges.unobserve(syncFromYjs);
    };
  }, []); // Only on mount

  // ─── Sync Local Node Positions ONLY to Yjs (Performance) ──────────────────
  // We handle ADD/DELETE specifically in their handlers to avoid loops
  const onNodeDragStop = useCallback((_: any, node: Node) => {
    const yNodes = yDocRef.current.getMap('nodes');
    yNodes.set(node.id, { ...node, data: { ...node.data, onPropertyChange: undefined } });
  }, []);

  const runSimulationStep = useCallback(() => {
    setNodes(currentNodes => {
      // 1) Toggle clocks
      let updated = currentNodes.map(n => {
        if (n.type !== 'clock') return n;
        const prev = (n.data.state as any)?.clockState ?? 0;
        const next = prev === 1 ? 0 : 1;
        return {
          ...n,
          data: { ...n.data, state: { ...(n.data.state as any), clockState: next }, logicOutputs: { out: next } },
        };
      });

      // 2) Iterative combinational settling (4 passes)
      for (let pass = 0; pass < 4; pass++) {
        updated = updated.map(n => {
          const nodeInputs: Record<string, LogicState> = {};
          edges.forEach(edge => {
            if (edge.target !== n.id) return;
            const src = updated.find(s => s.id === edge.source);
            if (!src) return;
            const val = (src.data.logicOutputs as any)?.[edge.sourceHandle!];
            nodeInputs[edge.targetHandle!] = val;
          });
          const { outputs, newState } = evaluateNode(n.type ?? '', nodeInputs, (n.data.state as any) ?? {});
          return {
            ...n,
            data: { ...n.data, state: newState, logicOutputs: outputs, logicInputs: nodeInputs },
          };
        });
      }

      // 3) Capture History for Waveform Viewer
      const currentSignals: Record<string, LogicState> = {};
      updated.forEach(n => {
        const signalName = (n.data.properties as any)?.label || n.data.refDes;
        if (signalName) {
          const outputs = n.data.logicOutputs as Record<string, LogicState> | undefined;
          const inputs = n.data.logicInputs as Record<string, LogicState> | undefined;

          if (outputs && Object.keys(outputs).length > 0) {
            const keys = Object.keys(outputs);
            if (keys.length === 1) {
              currentSignals[signalName] = outputs[keys[0]];
            } else {
              keys.forEach(k => { currentSignals[`${signalName}_${k}`] = outputs[k]; });
            }
          } else if (inputs && Object.keys(inputs).length > 0) {
            const keys = Object.keys(inputs);
            if (keys.length === 1) {
              currentSignals[signalName] = inputs[keys[0]];
            } else {
              keys.forEach(k => { currentSignals[`${signalName}_${k}`] = inputs[k]; });
            }
          }
        }
      });

      setSimulationHistory(prev => {
        const next = [...prev, { timestamp: simTimeRef.current++, signals: currentSignals }];
        return next.length > 100 ? next.slice(next.length - 100) : next;
      });

      // 4) Update Edges based on the new node states
      setEdges(currentEdges => currentEdges.map(e => {
        const src = updated.find(n => n.id === e.source);
        const val = src ? (src.data.logicOutputs as any)?.[e.sourceHandle!] : undefined;
        const color = val === 1 ? '#10B981' : val === 0 ? '#F43F5E' : '#475569';
        return {
          ...e,
          animated: val === 1,
          style: { ...e.style, stroke: color, strokeWidth: val === 1 ? 2.5 : 2 },
        };
      }));

      return updated;
    });
  }, [edges, setNodes, setEdges]);

  useEffect(() => {
    if (isRunning) {
      simIntervalRef.current = window.setInterval(runSimulationStep, 500);
    } else {
      if (simIntervalRef.current) clearInterval(simIntervalRef.current);
    }
    return () => { if (simIntervalRef.current) clearInterval(simIntervalRef.current); };
  }, [isRunning, runSimulationStep]);

  const getGraphData = useCallback(() => ({
    nodes: nodes.map(n => ({ id: n.id, type: n.type ?? '', properties: (n.data.properties as any) ?? {}, refDes: n.data.refDes as string })),
    edges: edges.map(e => ({ id: e.id, source: e.source, sourceHandle: e.sourceHandle ?? '', target: e.target, targetHandle: e.targetHandle ?? '' })),
  }), [nodes, edges]);

  const handleGenerateCode = useCallback(() => {
    try {
      setVerilogCode(generateVerilog(getGraphData()));
      setShowCode(true);
    } catch (err) {
      toast.error('Failed to generate Verilog.');
    }
  }, [getGraphData]);

  const handleGenerateTestbench = useCallback(() => {
    try {
      setVerilogCode(generateTestbench(getGraphData(), 'TopModule'));
      setShowCode(true);
      toast.success('Testbench generated!');
    } catch (err) {
      toast.error('Failed to generate Testbench.');
    }
  }, [getGraphData]);

  const handleClear = useCallback(() => {
    setNodes([]); setEdges([]); setSelectedId(null); setIsRunning(false);
    setSimulationHistory([]); simTimeRef.current = 0;
    toast.info('Canvas cleared');
  }, [setNodes, setEdges]);

  const handleDownload = useCallback(() => {
    const blob = new Blob([verilogCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'design.v'; a.click();
    URL.revokeObjectURL(url);
  }, [verilogCode]);

  return (
    <div className="w-full h-full flex bg-[#0B0F19] text-slate-200 overflow-hidden">
      {/* Left panel */}
      <div className="w-60 shrink-0 h-full relative z-10 border-r border-slate-800/70">
        <ComponentLibraryPanel onAddComponent={handleAddComponent} />
      </div>

      {/* Centre */}
      <div className="flex-1 flex flex-col relative h-full min-w-0">
        {/* Top toolbar */}
        <div className="h-12 bg-[#0F172A]/90 backdrop-blur-xl border-b border-slate-800 flex items-center justify-between px-4 shrink-0 z-10">
          <h2 className="text-[11px] font-black tracking-[0.2em] uppercase text-slate-400 flex items-center gap-2 select-none">
            <Cpu size={16} className="text-indigo-400" weight="duotone" />
            VLSI Logic Studio
          </h2>

          <div className="flex items-center gap-1 bg-slate-900/60 p-1 rounded-full border border-slate-800/80 max-w-[60%] overflow-x-auto no-scrollbar">
            <button
              onClick={() => setIsRunning(r => !r)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black tracking-tighter uppercase transition-all whitespace-nowrap
                ${isRunning ? 'bg-amber-500/15 text-amber-400' : 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'}`}
            >
              {isRunning ? <Pause size={10} weight="fill" /> : <Play size={10} weight="fill" />}
              {isRunning ? 'Stop' : 'Run'}
            </button>

            <button
              onClick={runSimulationStep}
              disabled={isRunning}
              className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black tracking-tighter uppercase text-slate-400 hover:text-slate-200 disabled:opacity-30"
            >
              <SkipForward size={10} weight="fill" /> Step
            </button>

            <div className="w-px h-3 bg-slate-700/50 mx-0.5" />

            <button
              onClick={() => toggleCollaboration()}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black tracking-tighter uppercase transition-all relative
                ${isColabActive ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10'}`}
              title={isColabActive ? `In Room: ${roomId} (Click to Stop)` : 'Start New Room'}
            >
              <Users size={12} weight={isColabActive ? "fill" : "bold"} />
              {isColabActive ? `${colabUsers} Active` : 'Host'}
              {isColabActive && <span className="absolute -top-1 -right-1 w-2 h-2 bg-indigo-400 rounded-full animate-ping" />}
            </button>

            {isColabActive && (
              <button
                onClick={handleCopyRoomId}
                className="flex items-center justify-center w-6 h-6 rounded-full text-slate-500 hover:text-indigo-400"
                title="Copy Room ID"
              >
                <Copy size={12} weight="bold" />
              </button>
            )}

            {!isColabActive && (
              <button
                onClick={handleJoinRoom}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black tracking-tighter uppercase text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10"
                title="Join Existing Room"
              >
                <SignIn size={12} weight="bold" /> Join
              </button>
            )}

            <div className="w-px h-3 bg-slate-700/50 mx-0.5" />

            <button onClick={handleUndo} className="flex items-center justify-center w-6 h-6 rounded-full text-slate-500 hover:text-indigo-400">
              <ArrowCounterClockwise size={12} weight="bold" />
            </button>
            <button onClick={handleRedo} className="flex items-center justify-center w-6 h-6 rounded-full text-slate-500 hover:text-indigo-400">
              <ArrowClockwise size={12} weight="bold" />
            </button>

            <div className="w-px h-3 bg-slate-700/50 mx-0.5" />

            <button onClick={handleGenerateCode} className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black tracking-tighter uppercase text-slate-400 hover:text-slate-200">
              <Code size={12} weight="bold" /> HDL
            </button>

            <button onClick={handleClear} className="flex items-center justify-center w-6 h-6 rounded-full text-slate-500 hover:text-rose-400">
              <Trash size={12} weight="bold" />
            </button>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 relative bg-[#0B0F19] flex flex-col">
          <div className="flex-1 relative">
            <VLSICanvas
              nodes={nodes} edges={edges}
              onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
              onConnect={onConnect} onNodeClick={onNodeClick} onPaneClick={onPaneClick}
              onNodesDelete={onNodesDelete} onEdgesDelete={onEdgesDelete}
              onNodeDragStop={onNodeDragStop}
            />
            {isRunning && (
              <div className="absolute top-4 left-4 flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-[10px] font-bold border border-emerald-500/20 backdrop-blur pointer-events-none">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                SIMULATING
              </div>
            )}
            {!showWaveform && simulationHistory.length > 0 && (
              <button 
                onClick={() => setShowWaveform(true)}
                className="absolute bottom-4 left-4 bg-slate-900 border border-slate-700 text-slate-300 px-3 py-1.5 rounded-lg text-xs font-bold font-mono shadow-xl hover:bg-slate-800 transition flex items-center gap-2"
              >
                <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12h4l3-9 5 18 3-9h3" />
                </svg>
                Waveforms ({simulationHistory.length})
              </button>
            )}
          </div>

          {showWaveform && !showCode && (
            <div className={`shrink-0 z-20 border-t border-slate-800 ${isWaveformExpanded ? 'absolute inset-0' : ''}`} style={{ height: isWaveformExpanded ? '100%' : '260px' }}>
              <WaveformViewer 
                history={simulationHistory} 
                isExpanded={isWaveformExpanded}
                onExpandToggle={() => setIsWaveformExpanded(!isWaveformExpanded)}
                onClose={() => setShowWaveform(false)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Right panel */}
      <div className="w-60 shrink-0 h-full relative z-10 border-l border-slate-800/70">
        <PropertiesInspector
          selectedNode={selectedNode}
          onPropertyChange={handlePropertyChange}
          onDelete={handleDeleteNode}
        />
      </div>

      {/* Modal */}
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
