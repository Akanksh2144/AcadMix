import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNodesState, useEdgesState, addEdge, type Connection, type Edge, type Node } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Cpu, Play, Pause, SkipForward, Code, Download, ArrowsClockwise } from '@phosphor-icons/react';
import ComponentLibraryPanel from './ComponentLibraryPanel';
import PropertiesInspector from './PropertiesInspector';
import VLSICanvas from './VLSICanvas';
import { getCatalogEntry } from './componentCatalog';
import { evaluateNode, generateVerilog } from './vlsiEngine';
import { LogicState } from './types';

let nodeCounter = 1;

const STARTER_NODES: Node[] = [
  { id: 'clk-1', type: 'clock', position: { x: 100, y: 150 }, data: { refDes: 'CLK1', componentType: 'clock', properties: { frequency: 1, label: 'CLK' }, pins: getCatalogEntry('clock')!.pins, logicOutputs: { out: 0 }, state: { clockState: 0 } } },
  { id: 'sw-1', type: 'input_switch', position: { x: 100, y: 250 }, data: { refDes: 'SW1', componentType: 'input_switch', properties: { label: 'EN' }, pins: getCatalogEntry('input_switch')!.pins, logicOutputs: { out: 1 }, state: { state: 1 } } },
  { id: 'and-1', type: 'gate_and', position: { x: 300, y: 200 }, data: { refDes: 'U1', componentType: 'gate_and', properties: {}, pins: getCatalogEntry('gate_and')!.pins, logicOutputs: { out: 0 } } },
  { id: 'led-1', type: 'output_led', position: { x: 500, y: 200 }, data: { refDes: 'LED1', componentType: 'output_led', properties: { label: 'OUT', color: 'red' }, pins: getCatalogEntry('output_led')!.pins, logicInputs: { in: 0 } } },
];

const STARTER_EDGES: Edge[] = [
  { id: 'e1', source: 'clk-1', sourceHandle: 'out', target: 'and-1', targetHandle: 'in1', type: 'step', style: { stroke: '#475569', strokeWidth: 2 } },
  { id: 'e2', source: 'sw-1', sourceHandle: 'out', target: 'and-1', targetHandle: 'in2', type: 'step', style: { stroke: '#10B981', strokeWidth: 2 } },
  { id: 'e3', source: 'and-1', sourceHandle: 'out', target: 'led-1', targetHandle: 'in', type: 'step', style: { stroke: '#475569', strokeWidth: 2 } },
];

export default function VLSIDesignStudio({ user }: { user?: any }) {
  const [nodes, setNodes, onNodesChange] = useNodesState(STARTER_NODES);
  const [edges, setEdges, onEdgesChange] = useEdgesState(STARTER_EDGES);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [verilogCode, setVerilogCode] = useState('');

  const simIntervalRef = useRef<number | null>(null);

  const selectedNode = nodes.find(n => n.id === selectedId);

  const onConnect = useCallback((params: Connection) => {
    setEdges((eds) => addEdge({ ...params, type: 'step', style: { stroke: '#475569', strokeWidth: 2 } }, eds));
  }, [setEdges]);

  const onNodeClick = (_: React.MouseEvent, node: Node) => {
    setSelectedId(node.id);
  };

  const onPaneClick = () => {
    setSelectedId(null);
  };

  const handleAddComponent = (type: string) => {
    const catalog = getCatalogEntry(type);
    if (!catalog) return;

    const newNode: Node = {
      id: `node-${Date.now()}-${nodeCounter++}`,
      type: catalog.type,
      position: { x: 250, y: 200 },
      data: {
        componentType: catalog.type,
        refDes: `${catalog.refDesPrefix}${nodeCounter}`,
        properties: { ...catalog.defaultProperties },
        pins: catalog.pins,
        state: catalog.type === 'input_switch' ? { state: 0 } : catalog.type === 'clock' ? { clockState: 0 } : {},
      }
    };
    setNodes(nds => [...nds, newNode]);
  };

  const handleDeleteNode = (id: string) => {
    setNodes(nds => nds.filter(n => n.id !== id));
    setEdges(eds => eds.filter(e => e.source !== id && e.target !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const handlePropertyChange = (id: string, field: string, value: string | number | boolean) => {
    setNodes(nds => nds.map(n => {
      if (n.id === id) {
        if (field === 'state') {
           return { ...n, data: { ...n.data, state: { ...n.data.state, state: value }, logicOutputs: { out: value as LogicState } } };
        }
        return {
          ...n,
          data: {
            ...n.data,
            properties: { ...(n.data as any).properties, [field]: value }
          }
        };
      }
      return n;
    }));
  };

  // Simulation Step
  const runSimulationStep = useCallback(() => {
    setNodes(currentNodes => {
      let updatedNodes = [...currentNodes];
      
      // Handle clocks: Toggle state
      updatedNodes = updatedNodes.map(n => {
        if (n.type === 'clock' && isRunning) {
          const freq = (n.data.properties as any)?.frequency || 1;
          // Simple toggle every step for now (assume step is fast enough)
          const newClockState = n.data.state?.clockState === 1 ? 0 : 1;
          return { ...n, data: { ...n.data, state: { ...n.data.state, clockState: newClockState }, logicOutputs: { out: newClockState } } };
        }
        return n;
      });

      // Topological or iterative evaluation.
      // For simple simulation, run multiple passes to settle combinational logic
      for (let pass = 0; pass < 3; pass++) {
        updatedNodes = updatedNodes.map(n => {
          // Gather inputs from edges
          const nodeInputs: Record<string, LogicState> = {};
          edges.filter(e => e.target === n.id).forEach(edge => {
            const sourceNode = updatedNodes.find(s => s.id === edge.source);
            if (sourceNode && sourceNode.data.logicOutputs) {
              const outState = (sourceNode.data.logicOutputs as any)[edge.sourceHandle!];
              nodeInputs[edge.targetHandle!] = outState;
            }
          });

          // Save node inputs for visualization (e.g. LED)
          const newLogicInputs = { ...nodeInputs };

          // Evaluate logic
          const { outputs, newState } = evaluateNode(n.type, nodeInputs, n.data.state || {});
          
          return {
            ...n,
            data: {
              ...n.data,
              state: newState,
              logicOutputs: outputs,
              logicInputs: newLogicInputs
            }
          };
        });
      }

      return updatedNodes;
    });

    // Update edge colors based on logic states
    setEdges(currentEdges => currentEdges.map(e => {
      // Need the latest nodes for accurate colors, but we use state
      let isHigh = false;
      let isLow = false;
      setNodes(nds => {
        const sourceNode = nds.find(n => n.id === e.source);
        if (sourceNode && sourceNode.data.logicOutputs) {
          const val = (sourceNode.data.logicOutputs as any)[e.sourceHandle!];
          if (val === 1) isHigh = true;
          else if (val === 0) isLow = true;
        }
        return nds;
      });
      
      let color = '#475569'; // undefined/X
      if (isHigh) color = '#10B981'; // green
      else if (isLow) color = '#F43F5E'; // red

      return {
        ...e,
        style: { ...e.style, stroke: color, mixBlendMode: 'normal' },
        animated: isHigh
      };
    }));

  }, [edges, isRunning]);

  // Handle Play/Pause
  useEffect(() => {
    if (isRunning) {
      simIntervalRef.current = window.setInterval(runSimulationStep, 500); // 500ms per step
    } else {
      if (simIntervalRef.current) clearInterval(simIntervalRef.current);
    }
    return () => {
      if (simIntervalRef.current) clearInterval(simIntervalRef.current);
    };
  }, [isRunning, runSimulationStep]);

  // Verilog Generation
  const handleGenerateCode = () => {
    const graph = {
      nodes: nodes.map(n => ({ id: n.id, type: n.type, properties: n.data.properties as any || {}, refDes: n.data.refDes as string })),
      edges: edges.map(e => ({ id: e.id, source: e.source, sourceHandle: e.sourceHandle!, target: e.target, targetHandle: e.targetHandle! }))
    };
    const code = generateVerilog(graph);
    setVerilogCode(code);
    setShowCode(true);
  };

  return (
    <div className="w-full h-full flex bg-[#0B0F19] text-slate-200 overflow-hidden font-sans">
      <div className="w-64 shrink-0 h-full relative z-10">
        <ComponentLibraryPanel onAddComponent={handleAddComponent} />
      </div>

      <div className="flex-1 flex flex-col relative h-full min-w-0">
        {/* Toolbar */}
        <div className="h-14 bg-[#111827]/90 backdrop-blur-xl border-b border-slate-800 flex items-center justify-between px-4 z-10">
          <div className="flex items-center gap-4">
            <h2 className="text-sm font-black tracking-widest uppercase text-slate-300 flex items-center gap-2">
              <Cpu size={18} className="text-indigo-400" />
              VLSI Logic Studio
            </h2>
          </div>
          
          <div className="flex items-center gap-2 bg-slate-800/50 p-1 rounded-xl border border-slate-700/50">
            <button 
              onClick={() => setIsRunning(!isRunning)} 
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm ${isRunning ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'}`}
            >
              {isRunning ? <Pause size={14} weight="fill" /> : <Play size={14} weight="fill" />}
              {isRunning ? 'Pause' : 'Play'}
            </button>
            <button 
              onClick={runSimulationStep} 
              disabled={isRunning}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-700/50 text-slate-300 hover:bg-slate-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <SkipForward size={14} weight="fill" /> Step
            </button>
            <div className="w-px h-4 bg-slate-700 mx-1"></div>
            <button 
              onClick={handleGenerateCode} 
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-all"
            >
              <Code size={14} weight="bold" /> Gen Verilog
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
          
          {/* Verilog Output Overlay */}
          {showCode && (
            <div className="absolute inset-0 z-50 bg-[#0B0F19]/90 backdrop-blur flex items-center justify-center p-8">
              <div className="bg-[#111827] border border-slate-700 rounded-2xl w-full max-w-3xl flex flex-col shadow-2xl overflow-hidden">
                <div className="px-4 py-3 bg-slate-800/50 border-b border-slate-700 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                    <Code size={16} className="text-indigo-400" /> Generated Verilog HDL
                  </h3>
                  <div className="flex items-center gap-2">
                    <button className="p-1.5 text-slate-400 hover:text-white transition-colors" title="Download .v file">
                      <Download size={16} />
                    </button>
                    <button onClick={() => setShowCode(false)} className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs rounded font-bold transition-colors">
                      Close
                    </button>
                  </div>
                </div>
                <div className="p-4 overflow-y-auto max-h-[60vh]">
                  <pre className="font-mono text-sm text-emerald-400/90 whitespace-pre-wrap">
                    {verilogCode}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="w-64 shrink-0 h-full relative z-10">
        <PropertiesInspector
          selectedNode={selectedNode}
          onPropertyChange={handlePropertyChange}
          onDelete={handleDeleteNode}
        />
      </div>
    </div>
  );
}
