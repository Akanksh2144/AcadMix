import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  useNodesState, useEdgesState, addEdge,
  type Connection, type Edge, type Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Cpu, Play, Pause, SkipForward, Code, Download, Trash, Users, Activity } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';
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
  const providerRef = useRef<any>(null);
  const isRemoteChange = useRef(false);

  const simIntervalRef = useRef<number | null>(null);
  const simTimeRef = useRef<number>(0);
  const selectedNode = nodes.find(n => n.id === selectedId);

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

  const toggleCollaboration = useCallback(() => {
    if (isColabActive) {
      if (providerRef.current) {
        providerRef.current.destroy();
        providerRef.current = null;
      }
      setIsColabActive(false);
      setRoomId(null);
      setColabUsers(0);
      toast.success('Collaboration ended');
    } else {
      const id = `vlsi-${Math.random().toString(36).substring(2, 9)}`;
      setRoomId(id);
      
      try {
        const provider = new WebrtcProvider(id, yDocRef.current, {
          signaling: ['wss://y-webrtc-signaling-eu.herokuapp.com', 'wss://y-webrtc-signaling-us.herokuapp.com'],
        });

        provider.on('peers', (params: any) => {
          setColabUsers(params.webrtcConns.size + 1);
        });

        providerRef.current = provider;
        setIsColabActive(true);
        toast.success(`Collaboration Active: Room ${id}`);
      } catch (err) {
        console.error("WebRTC Error:", err);
        toast.error("Failed to start collaboration room.");
      }
    }
  }, [isColabActive]);

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
      if (isColabActive) {
        const yNodes = yDocRef.current.getMap('nodes');
        yNodes.set(newNode.id, { ...newNode, data: { ...newNode.data, onPropertyChange: undefined } });
      }
      return next;
    });
    toast.success(`Added ${catalog.label}`, { duration: 1500 });
  }, [setNodes, isColabActive]);

  const handleDeleteNode = useCallback((id: string) => {
    setNodes(nds => nds.filter(n => n.id !== id));
    setEdges(eds => eds.filter(e => e.source !== id && e.target !== id));
    if (selectedId === id) setSelectedId(null);
    toast.info('Node deleted', { duration: 1500 });
  }, [setNodes, setEdges, selectedId]);

  // ─── Sync Yjs to Local State ───────────────────────────────────────────────
  useEffect(() => {
    if (!isColabActive || !roomId) return;
    const yNodes = yDocRef.current.getMap('nodes');
    const yEdges = yDocRef.current.getMap('edges');

    const syncFromYjs = () => {
      isRemoteChange.current = true;
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
      isRemoteChange.current = false;
    };

    yNodes.observe(syncFromYjs);
    yEdges.observe(syncFromYjs);
    return () => {
      yNodes.unobserve(syncFromYjs);
      yEdges.unobserve(syncFromYjs);
    };
  }, [isColabActive, roomId, setNodes, setEdges]);

  // ─── Sync Local State to Yjs ───────────────────────────────────────────────
  useEffect(() => {
    if (!isColabActive || isRemoteChange.current) return;
    const yNodes = yDocRef.current.getMap('nodes');
    const yEdges = yDocRef.current.getMap('edges');

    yDocRef.current.transact(() => {
      nodes.forEach(n => {
        const existing = yNodes.get(n.id) as any;
        if (!existing || JSON.stringify(existing.position) !== JSON.stringify(n.position)) {
          yNodes.set(n.id, { ...n, data: { ...n.data, onPropertyChange: undefined } });
        }
      });
      edges.forEach(e => {
        if (!yEdges.has(e.id)) yEdges.set(e.id, e);
      });
    });
  }, [nodes, edges, isColabActive]);

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
        <div className="h-14 bg-[#0F172A]/90 backdrop-blur-xl border-b border-slate-800 flex items-center justify-between px-6 shrink-0 z-10">
          <h2 className="text-[11px] font-black tracking-[0.2em] uppercase text-slate-400 flex items-center gap-2 select-none">
            <Cpu size={18} className="text-indigo-400" weight="duotone" />
            VLSI Logic Studio
          </h2>

          <div className="flex items-center bg-slate-900/80 p-1.5 rounded-full border border-slate-800/80 shadow-2xl backdrop-blur-md">
            {/* Run Button Group */}
            <div className="flex items-center gap-1 bg-slate-800/40 rounded-full p-1 border border-white/5 mr-2">
              <button
                onClick={() => setIsRunning(r => !r)}
                className={`relative px-5 py-2 rounded-full text-[10px] font-black tracking-widest uppercase transition-all flex items-center gap-2 z-10 ${
                  isRunning ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {isRunning && (
                  <motion.div
                    layoutId="activePill"
                    className="absolute inset-0 bg-emerald-600 rounded-full -z-10 shadow-lg shadow-emerald-600/30"
                    initial={false}
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                {isRunning ? <Pause size={12} weight="fill" /> : <Play size={12} weight="fill" />}
                {isRunning ? 'Stop' : 'Run'}
              </button>
              
              <button
                onClick={runSimulationStep}
                disabled={isRunning}
                className="px-4 py-2 rounded-full text-[10px] font-bold uppercase text-slate-500 hover:text-slate-300 transition-colors disabled:opacity-20 flex items-center gap-2"
              >
                <SkipForward size={12} weight="fill" /> Step
              </button>
            </div>

            <div className="w-px h-4 bg-slate-700/50 mx-1" />

            {/* Colab Button Pill */}
            <div className="flex items-center mx-2">
              <button
                onClick={toggleCollaboration}
                className={`relative px-5 py-2 rounded-full text-[10px] font-black tracking-widest uppercase transition-all flex items-center gap-2 z-10 ${
                  isColabActive ? 'text-white' : 'text-slate-400 hover:text-indigo-400'
                }`}
              >
                {isColabActive && (
                  <motion.div
                    layoutId="activeColabPill"
                    className="absolute inset-0 bg-indigo-600 rounded-full -z-10 shadow-lg shadow-indigo-600/30"
                    initial={false}
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <Users size={14} weight={isColabActive ? "fill" : "bold"} />
                {isColabActive ? `${colabUsers} Active` : 'Colab'}
                {isColabActive && (
                   <motion.div 
                     initial={{ scale: 0 }}
                     animate={{ scale: 1 }}
                     className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-indigo-400 rounded-full border-2 border-[#0F172A] z-20"
                   />
                )}
              </button>
            </div>

            <div className="w-px h-4 bg-slate-700/50 mx-1" />

            {/* Actions Group */}
            <div className="flex items-center gap-2 ml-2 pr-1">
              <button onClick={handleGenerateCode} className="px-3 py-2 rounded-full text-[10px] font-black tracking-widest uppercase text-slate-400 hover:text-white transition-colors flex items-center gap-2">
                <Code size={14} weight="bold" /> HDL
              </button>
              
              <button onClick={handleClear} className="w-8 h-8 flex items-center justify-center rounded-full text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all">
                <Trash size={14} weight="bold" />
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/40 border border-slate-700/50">
               <Activity size={14} className={isRunning ? "text-emerald-400 animate-pulse" : "text-slate-500"} />
               <span className="text-[10px] font-bold text-slate-400">FPS: 60</span>
             </div>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 relative bg-[#0B0F19] flex flex-col">
          <div className="flex-1 relative">
            <VLSICanvas
              nodes={nodes} edges={edges}
              onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
              onConnect={onConnect} onNodeClick={onNodeClick} onPaneClick={onPaneClick}
            />
            
            <AnimatePresence>
              {isRunning && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-4 left-4 flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded-full text-[10px] font-bold border border-emerald-500/20 backdrop-blur-md pointer-events-none"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  LIVE SIMULATION ACTIVE
                </motion.div>
              )}
            </AnimatePresence>

            {!showWaveform && simulationHistory.length > 0 && (
              <button 
                onClick={() => setShowWaveform(true)}
                className="absolute bottom-6 left-6 bg-slate-900/90 backdrop-blur-md border border-slate-700/50 text-slate-300 px-4 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-wider shadow-2xl hover:bg-slate-800 transition-all flex items-center gap-3 active:scale-95 group"
              >
                <Activity className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                Open Waveforms ({simulationHistory.length})
              </button>
            )}
          </div>

          {showWaveform && !showCode && (
            <motion.div 
              initial={{ height: 0 }}
              animate={{ height: isWaveformExpanded ? '100%' : '280px' }}
              className={`shrink-0 z-20 border-t border-slate-800/80 bg-[#0B0F19]/95 backdrop-blur-xl ${isWaveformExpanded ? 'absolute inset-0' : 'relative'}`}
            >
              <WaveformViewer 
                history={simulationHistory} 
                isExpanded={isWaveformExpanded}
                onExpandToggle={() => setIsWaveformExpanded(!isWaveformExpanded)}
                onClose={() => setShowWaveform(false)}
              />
            </motion.div>
          )}
        </div>
      </div>

      {/* Right panel */}
      <div className="w-60 shrink-0 h-full relative z-10 border-l border-slate-800/70 bg-[#0F172A]/30 backdrop-blur-sm">
        <PropertiesInspector
          selectedNode={selectedNode}
          onPropertyChange={handlePropertyChange}
          onDelete={handleDeleteNode}
        />
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showCode && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-8"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0F172A] border border-slate-700/50 rounded-3xl w-full max-w-3xl flex flex-col shadow-[0_0_50px_-12px_rgba(79,70,229,0.3)] overflow-hidden"
            >
              <div className="px-6 py-4 bg-slate-800/50 border-b border-slate-700/50 flex items-center justify-between">
                <div className="flex flex-col">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-200 flex items-center gap-3">
                    <Code size={18} className="text-indigo-400" weight="bold" /> 
                    Verilog Output
                  </h3>
                  <span className="text-[10px] text-slate-500 font-bold mt-0.5">Synthesized from schematic logic</span>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={handleDownload} className="flex items-center gap-2 px-4 py-2 text-[11px] font-black uppercase tracking-wider text-slate-200 bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all shadow-lg shadow-indigo-600/20">
                    <Download size={14} weight="bold" /> Download .V
                  </button>
                  <button onClick={() => setShowCode(false)} className="w-8 h-8 flex items-center justify-center bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-full transition-colors">
                    <Trash size={16} weight="bold" />
                  </button>
                </div>
              </div>
              <div className="p-8 overflow-y-auto max-h-[60vh] bg-[#05080F]/50 custom-scrollbar">
                <pre className="font-mono text-[13px] text-emerald-400/90 leading-relaxed whitespace-pre-wrap selection:bg-indigo-500/30">
                  {verilogCode}
                </pre>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
