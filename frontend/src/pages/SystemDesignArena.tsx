/**
 * System Design Architect Arena — Main Page
 *
 * Provides the interactive design canvas, sidebar component palette,
 * Recharts metrics panel, and progressive challenge engine.
 */

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
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
  useUpdateNodeInternals,
  type Connection,
  type Edge,
  type Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import {
  Play, Trophy, Lightbulb, CornersOut, CornersIn,
  ArrowSquareOut, ArrowSquareIn, ArrowsClockwise,
  Question, CheckCircle, Warning, X, CaretDown, CaretUp, BookOpen, Stack,
  Pause,
} from '@phosphor-icons/react';

import PageHeader from '../components/PageHeader';
import AlertModal from '../components/AlertModal';
import ComponentPalette from '../components/system-design/ComponentPalette';
import MetricsPanel from '../components/system-design/MetricsPanel';
import { NodeDetailsPopup } from '../components/system-design/NodeDetailsPopup';
import ChallengeSelector from '../components/system-design/ChallengeSelector';
import SimulationSummaryModal from '../components/system-design/SimulationSummaryModal';
import ChaosTargetModal from '../components/system-design/ChaosTargetModal';
import { CHALLENGES, checkChallengePassed } from '../components/system-design/challenges';
import { runSimulation } from '../components/system-design/engine';
import type { SimulationResult, ChallengeConfig } from '../components/system-design/types';

// ── Node Types Registration ──────────────────────────────────────────────────

import { systemDesignNodeTypes } from '../components/system-design/nodes/index';
import LaneNode from '../components/system-design/nodes/LaneNode';

const nodeTypes = {
  ...systemDesignNodeTypes,
  lane: LaneNode,
};

import DataFlowEdge from '../components/system-design/edges/DataFlowEdge';

const edgeTypes = {
  dataFlow: DataFlowEdge,
};

const LANE_HEIGHT = 400;
const LANE_WIDTH = 20000;
const LANE_CONFIG = [
  { id: 'lane-client', label: 'Client / Edge', color: 'purple', y: 0, height: LANE_HEIGHT, labelOffsetY: 0 },
  { id: 'lane-network', label: 'Network / Ingress', color: 'blue', y: LANE_HEIGHT, height: LANE_HEIGHT, labelOffsetY: 0 },
  { id: 'lane-compute', label: 'Compute / Logic', color: 'slate', y: LANE_HEIGHT * 2, height: LANE_HEIGHT, labelOffsetY: 0 },
  { id: 'lane-data', label: 'Data / Storage', color: 'emerald', y: LANE_HEIGHT * 3, height: LANE_HEIGHT, labelOffsetY: 0 }
];

const getLaneForNode = (type: string) => {
  if (['client', 'dns', 'cdn'].includes(type)) return 0;
  if (['loadBalancer'].includes(type)) return 1;
  if (['appServer', 'workerPool'].includes(type)) return 2;
  if (['lane'].includes(type)) return -1;
  return 3;
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
  const [activePopupNodeId, setActivePopupNodeId] = useState<string | null>(null);
  const [isBriefExpanded, setIsBriefExpanded] = useState(true);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '', type: 'info' as 'info' | 'error' | 'success' });
  const [showLanes, setShowLanes] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [activeChaosItemForModal, setActiveChaosItemForModal] = useState<any | null>(null);

  const spofCount = useMemo(() => {
    return nodes.filter(n => {
      if (['appServer', 'workerPool', 'sqlDatabase', 'nosqlDatabase', 'cache'].includes(n.type || '')) {
        const replicas = n.data?.replicas || n.data?.readReplicas || 1;
        return replicas <= 1;
      }
      return false;
    }).length;
  }, [nodes]);

  const { screenToFlowPosition, fitView, setCenter, getNodes } = useReactFlow();
  const updateNodeInternals = useUpdateNodeInternals();
  const workspaceRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [dynamicMinZoom, setDynamicMinZoom] = useState(0.25);

  React.useEffect(() => {
    const updateAll = () => {
      getNodes().forEach((n) => {
        if (n.type !== 'lane') {
          updateNodeInternals(n.id);
        }
      });
    };
    const timer1 = setTimeout(updateAll, 50);
    const timer2 = setTimeout(updateAll, 250);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [showLanes, updateNodeInternals, getNodes]);

  React.useEffect(() => {
    const updateZoom = () => {
      if (canvasRef.current) {
        setDynamicMinZoom(canvasRef.current.clientHeight / (LANE_HEIGHT * 4));
      }
    };
    updateZoom();
    const observer = new ResizeObserver(updateZoom);
    if (canvasRef.current) observer.observe(canvasRef.current);
    return () => observer.disconnect();
  }, []);

  // ── Callbacks ─────────────────────────────────────────────────────────────

  // Trigger alert
  const triggerAlert = (title: string, message: string, type: 'info' | 'error' | 'success' = 'info') => {
    setAlertConfig({ title, message, type });
    setIsAlertOpen(true);
  };

  const organizeIntoLanes = useCallback((currentNodes: Node[]) => {
    const realNodes = currentNodes.filter(n => n.type !== 'lane');
    const grouped: Record<number, Node[]> = { 0: [], 1: [], 2: [], 3: [] };
    
    realNodes.forEach(n => {
      const laneIndex = getLaneForNode(n.type || '');
      if (grouped[laneIndex]) {
        grouped[laneIndex].push(n);
      }
    });

    const newNodes: Node[] = [];
    
    if (showLanes) {
      LANE_CONFIG.forEach((lane) => {
        newNodes.push({
          id: lane.id,
          type: 'lane',
          position: { x: -LANE_WIDTH / 2, y: lane.y },
          data: { label: lane.label, color: lane.color, labelOffsetY: lane.labelOffsetY },
          selectable: false,
          draggable: false,
          zIndex: -1,
          style: { width: LANE_WIDTH, height: lane.height }
        });
      });
    }

    Object.keys(grouped).forEach(key => {
      const laneIdx = Number(key);
      const laneNodes = grouped[laneIdx];
      // Center horizontally at x = 0
      const startX = -(laneNodes.length * 350) / 2 + (350 / 2); 
      
      laneNodes.forEach((n, i) => {
        newNodes.push({
          ...n,
          position: showLanes ? {
             x: startX + (i * 350), 
             y: LANE_CONFIG[laneIdx].y + (LANE_HEIGHT / 2) - 100
          } : n.position
        });
      });
    });

    return newNodes;
  }, [showLanes]);

  const fitLanesView = useCallback(() => {
    // Total height of all 4 lanes is LANE_HEIGHT * 4
    // The exact vertical center is LANE_HEIGHT * 2
    setCenter(0, LANE_HEIGHT * 2, { zoom: dynamicMinZoom, duration: 800 });
  }, [setCenter, dynamicMinZoom]);

  const nodeCountRef = useRef(nodes.length);
  
  React.useEffect(() => {
    if (showLanes) {
      setNodes(nds => organizeIntoLanes(nds));
      setTimeout(() => fitLanesView(), 50);
    } else {
      setNodes(nds => nds.filter(n => n.type !== 'lane'));
    }
  }, [showLanes, organizeIntoLanes, setNodes, fitLanesView]);

  // Removed second useEffect to prevent infinite render loop (Maximum update depth exceeded)

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
      const status = nodeMetrics?.status || 'healthy';
      const utilization = nodeMetrics?.utilization ?? 0;
      const isSelected = n.selected;

      let glowClass = '';
      if (status === 'critical') {
        glowClass = '!border-[var(--accent-red)] ring-1 ring-[var(--accent-red)]/50';
      } else if (status === 'warning') {
        glowClass = '!border-[var(--accent-orange)] ring-1 ring-[var(--accent-orange)]/50';
      } else if (utilization > 0) {
        glowClass = '!border-[var(--accent-green)]';
      } else {
        glowClass = 'opacity-90';
      }

      if (isSelected) {
        glowClass += ' ring-1 ring-[var(--ink)] !border-[var(--ink)]';
      }

      const laneIndex = n.type && n.type !== 'lane' ? getLaneForNode(n.type) : -1;
      let extent: any = undefined;
      
      // If lanes are on, strictly bind the node to its architectural lane vertically
      if (showLanes && laneIndex !== -1) {
        const paddingY = LANE_HEIGHT * 0.15; // 15% margin top and bottom (middle 70%)
        extent = [
          [-LANE_WIDTH, laneIndex * LANE_HEIGHT + paddingY],
          [LANE_WIDTH, (laneIndex + 1) * LANE_HEIGHT - paddingY]
        ];
      }

      const className = `transition-colors transition-shadow duration-300 rounded-xl ${glowClass}`;
      const currentData = n.data || {};
      const injectedSimResult = n.type === 'metricsDashboard' ? simResult : undefined;

      const isDataEqual =
        currentData.onDataChange === handleNodeDataChange &&
        currentData.metrics === nodeMetrics &&
        currentData.isVertical === showLanes &&
        (n.type !== 'metricsDashboard' || currentData.simResult === injectedSimResult);

      const isNodeEqual =
        isDataEqual &&
        n.className === className &&
        JSON.stringify(n.extent) === JSON.stringify(extent);

      if (isNodeEqual) {
        return n;
      }

      return {
        ...n,
        extent,
        className,
        data: {
          ...currentData,
          onDataChange: handleNodeDataChange,
          metrics: nodeMetrics,
          isVertical: showLanes,
          // Inject overall sim result into dashboard nodes
          ...(n.type === 'metricsDashboard' ? { simResult: injectedSimResult } : {}),
        },
      };
    });
  }, [nodes, handleNodeDataChange, simResult, showLanes]);

  // Dynamic glowing and speed-controlled animated edges based on active traffic QPS load
  const enrichedEdges = useMemo(() => {
    return edges.map((e) => {
      const sourceMetrics = simResult?.nodeMetrics[e.source];
      const qps = sourceMetrics?.processedQPS ?? 0;
      const isActive = qps > 0;
      
      // Calculate speed: higher QPS = faster dash animations
      const animationSpeed = qps > 0 ? Math.max(0.5, 12 - Math.log(qps) * 1.0) : 0;
      
      let strokeColor = 'var(--ink-faint)'; // Slate 400 when inactive
      if (isActive) {
        const utilization = sourceMetrics?.utilization ?? 0;
        if (utilization > 0.9) {
          strokeColor = 'var(--accent-red)'; // Red for overloaded pipelines
        } else if (utilization > 0.7) {
          strokeColor = 'var(--accent-orange)'; // Amber warning pipelines
        } else {
          strokeColor = 'var(--accent-blue)'; // normal healthy pipelines
        }
      }

      const isEdgeEqual =
        e.type === 'dataFlow' &&
        e.animated === false &&
        e.style?.stroke === strokeColor &&
        e.style?.strokeWidth === (isActive ? 2.5 : 1.5) &&
        e.style?.animationDuration === (isActive ? `${animationSpeed}s` : '0s');

      if (isEdgeEqual) {
        return e;
      }

      return {
        ...e,
        type: 'dataFlow',
        animated: false,
        style: {
          stroke: strokeColor,
          strokeWidth: isActive ? 2.5 : 1.5,
          transition: 'stroke 0.3s ease, stroke-width 0.3s ease',
          animationDuration: isActive ? `${animationSpeed}s` : '0s',
          filter: 'none',
        },
      };
    });
  }, [edges, simResult]);

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

  // Chaos Fault Injection Handler with Granular SPOF & Layer Targeting
  const handleInjectChaos = useCallback((chaosItem: any, targetIds?: string | string[], blastMode: 'single' | 'layer' | 'global' = 'global') => {
    if (!isSimulating) {
      triggerAlert('Chaos Arena Locked', 'Please start the live simulation (▶ Run Simulation) first to inject faults and observe real-time cascading failures.', 'error');
      return;
    }

    const targetList = targetIds ? (Array.isArray(targetIds) ? targetIds : [targetIds]) : [];
    
    let scopeMsg = 'across all downstream services (System-Wide Blast Radius)';
    if (blastMode === 'single' && targetList.length > 0) {
      scopeMsg = `strictly on targeted component (${targetList.join(', ')}) [SPOF Failover Test]`;
    } else if (blastMode === 'layer') {
      scopeMsg = 'on matching architectural layer components';
    }

    triggerAlert(
      `💥 Chaos Injected: ${chaosItem.label}`,
      `${chaosItem.description} — Applied ${scopeMsg}.`,
      'error'
    );

    setNodes((currentNodes) => {
      return currentNodes.map((node) => {
        if (node.type === 'lane' || node.type === 'metricsDashboard') return node;

        // Single node target mode: only modify exact target nodes!
        if (blastMode === 'single' && targetList.length > 0 && !targetList.includes(node.id)) {
          return node;
        }

        // Layer target mode: filter strictly by layer profile
        if (blastMode === 'layer') {
          const id = chaosItem.id || '';
          const isDbOrStorage = node.type === 'sqlDatabase' || node.type === 'nosqlDatabase' || node.type === 'objectStorage' || node.type === 'cache';
          const isCompute = node.type === 'appServer' || node.type === 'workerPool' || node.type === 'singlePageApp';
          const isGateway = node.type === 'dns' || node.type === 'cdn' || node.type === 'loadBalancer' || node.type === 'reverseProxy';

          if ((id.includes('disk') || id.includes('storage') || id.includes('cache')) && !isDbOrStorage) return node;
          if ((id.includes('instance') || id.includes('memory') || id.includes('thread') || id.includes('cpu') || id.includes('deadlock')) && !isCompute) return node;
          if ((id.includes('network') || id.includes('packet') || id.includes('latency') || id.includes('dns') || id.includes('tls') || id.includes('lb')) && !isGateway) return node;
        }

        if (node.type === 'client') {
          if (chaosItem.impact?.qpsMultiplier) {
            const oldQps = node.data?.requestsPerSec || 1000;
            return {
              ...node,
              data: {
                ...node.data,
                requestsPerSec: Math.round(oldQps * chaosItem.impact.qpsMultiplier),
                chaosActive: `Surged ${chaosItem.impact.qpsMultiplier}x by ${chaosItem.label}`,
              },
            };
          }
          return node;
        }

        const currentErrors = typeof node.data?.errors === 'number' ? node.data.errors : 0;
        const currentLatency = typeof node.data?.latency === 'number' ? node.data.latency : (typeof node.data?.customLatency === 'number' ? node.data.customLatency : 10);
        const currentReplicas = typeof node.data?.replicas === 'number' ? node.data.replicas : 1;

        const newErrors = Math.min(100, currentErrors + (chaosItem.impact?.errorRate || 0));
        const newLatency = currentLatency + (chaosItem.impact?.addedLatency || 0);
        const newReplicas = chaosItem.impact?.killReplicasPct
          ? Math.max(1, Math.floor(currentReplicas * (1 - chaosItem.impact.killReplicasPct / 100)))
          : currentReplicas;

        return {
          ...node,
          data: {
            ...node.data,
            errors: newErrors > 0 ? newErrors : undefined,
            latency: newLatency !== 10 ? newLatency : undefined,
            replicas: newReplicas,
            chaosActive: chaosItem.label,
          },
        };
      });
    });
  }, [isSimulating, triggerAlert, setNodes]);

  // Clear Injected Chaos Faults
  const handleClearChaos = useCallback(() => {
    setNodes((currentNodes) => {
      return currentNodes.map((node) => {
        if (!node.data?.chaosActive && !node.data?.errors && !node.data?.latency) return node;
        const { chaosActive, errors, latency, ...cleanData } = node.data;
        return {
          ...node,
          data: cleanData,
        };
      });
    });
    triggerAlert('Chaos Faults Cleared', 'All injected fault states and degradation multipliers have been reset to baseline.', 'info');
  }, [setNodes, triggerAlert]);

  // Remove chaos strictly from a single node (1-click Heal)
  const handleRemoveNodeChaos = useCallback((nodeId: string) => {
    setNodes((currentNodes) => {
      return currentNodes.map((node) => {
        if (node.id !== nodeId) return node;
        if (!node.data?.chaosActive && !node.data?.errors && !node.data?.latency) return node;
        const { chaosActive, errors, latency, ...cleanData } = node.data;
        return {
          ...node,
          data: cleanData,
        };
      });
    });
    triggerAlert('Node Healed 🩺', `Chaos faults removed from component. Returned to healthy baseline.`, 'success');
  }, [setNodes, triggerAlert]);

  useEffect(() => {
    const listener = (e: any) => {
      if (e?.detail?.nodeId) {
        handleRemoveNodeChaos(e.detail.nodeId);
      }
    };
    window.addEventListener('acadmix:remove-node-chaos', listener);
    return () => window.removeEventListener('acadmix:remove-node-chaos', listener);
  }, [handleRemoveNodeChaos]);

  const activeChaosNodes = useMemo(() => {
    return nodes.filter((n) => n.type !== 'lane' && n.type !== 'metricsDashboard' && Boolean(n.data?.chaosActive || (typeof n.data?.errors === 'number' && n.data.errors > 0)));
  }, [nodes]);

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

      if (type === 'chaosMonkey') {
        const chaosObj = defaults.rawChaosItem || {
          label: defaults.label?.replace('Chaos: ', '') || 'Chaos Fault',
          description: defaults.description,
          impact: defaults.impact,
          id: defaults.chaosId,
        };

        // Check if dropped directly over/onto an existing component on the canvas
        const targetNode = nodes.find((n) => {
          if (n.type === 'lane' || n.type === 'metricsDashboard' || n.type === 'chaosMonkey') return false;
          const extent = n.extent as { x: number; y: number } | undefined;
          const nx = extent ? extent.x : (n.position?.x ?? 0);
          const ny = extent ? extent.y : (n.position?.y ?? 0);
          return position.x >= nx - 40 && position.x <= nx + 250 && position.y >= ny - 40 && position.y <= ny + 160;
        });

        if (targetNode) {
          handleInjectChaos(chaosObj, targetNode.id, 'single');
        } else {
          setActiveChaosItemForModal(chaosObj);
        }
        return;
      }

      const newNode: Node = {
        id: `node_${type}_${nodeCounter++}`,
        type: (nodeTypes as any)[type] ? type : 'singlePageApp',
        position,
        data: {
          ...defaults,
          nodeType: type,
          label: `${defaults.label || type}`,
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [screenToFlowPosition, setNodes, nodes, handleInjectChaos],
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
    if (isSimulating) {
      setIsSimulating(false);
      setShowSummaryModal(true);
      return;
    }

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
        } else {
          result.grade = result.grade.startsWith('A') || result.grade.startsWith('B') ? 'C-' : result.grade;
        }
      }
      setSimResult(result);
      setIsSimulating(true);
    } catch (err: any) {
      triggerAlert('Simulation Error', err.message || 'An error occurred during topological propagation.', 'error');
    }
  };

  // Reset Canvas
  const handleReset = () => {
    setNodes(currentChallenge.initialNodes);
    setEdges(currentChallenge.initialEdges);
    setSimResult(null);
    setIsSimulating(false);
    setShowSummaryModal(false);
    setShowHintIndex(0);
  };

  // Select Challenge
  const handleSelectChallenge = (challenge: ChallengeConfig) => {
    setCurrentChallenge(challenge);
    setNodes(challenge.initialNodes);
    setEdges(challenge.initialEdges);
    setSimResult(null);
    setIsSimulating(false);
    setShowSummaryModal(false);
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
      className="h-screen flex flex-col bg-[var(--paper)] transition-colors duration-300 relative sda-canvas"
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
        {/* Left Side: Component Palette & Chaos Arena */}
        <ComponentPalette
          className="w-64 shrink-0 hidden md:flex"
          isSimulating={isSimulating}
          onStartSimulation={handleRunSimulation}
          onInjectChaos={handleInjectChaos}
          onClearChaos={handleClearChaos}
        />

        {/* Center: Canvas Workspace */}
        <div
          className="flex-1 min-w-0 h-full flex flex-col relative"
          onDragOver={onDragOver}
          onDrop={onDrop}
        >
          {/* Floating Active Chaos HUD Banner */}
          {activeChaosNodes.length > 0 && (
            <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 bg-red-950/95 border-2 border-red-500 text-red-100 px-4 py-2.5 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-4 animate-bounce-subtle max-w-[80vw] overflow-x-auto">
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xl animate-pulse">💥</span>
                <div>
                  <h4 className="text-sm font-bold tracking-wide text-white">Chaos Active ({activeChaosNodes.length} {activeChaosNodes.length === 1 ? 'Node' : 'Nodes'} Affected)</h4>
                  <p className="text-[11px] text-red-300 font-medium">Click [×] on any node badge below or inside canvas to heal immediately.</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap max-h-20 overflow-y-auto">
                {activeChaosNodes.map((n) => (
                  <span key={n.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-900/90 border border-red-400/60 text-xs font-semibold text-white shadow-sm">
                    <span>{n.data?.label || n.type}: <strong className="text-amber-300 font-bold">{n.data?.chaosActive || `${n.data?.errors}% Errors`}</strong></span>
                    <button
                      onClick={() => handleRemoveNodeChaos(n.id)}
                      className="w-4 h-4 rounded-full bg-red-600 hover:bg-red-500 flex items-center justify-center text-[11px] font-bold text-white transition-colors ml-1 shadow"
                      title="Heal this node"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <button
                onClick={handleClearChaos}
                className="ml-auto px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg shadow-red-600/40 transition-all flex items-center gap-1.5 flex-shrink-0 border border-red-400/50"
              >
                <span>🩺 Heal All Nodes</span>
              </button>
            </div>
          )}

          {/* Top Control Overlay */}
          <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between pointer-events-none ">
            {/* Left buttons: Challenge selection + Hint */}
            <div className="flex items-center gap-2 pointer-events-auto">
              <button
                onClick={() => setIsChallengeSelectorOpen(true)}
                title="Select Stage"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--ink-border)] bg-[var(--paper-node)] text-[var(--ink-light)] hover:bg-[var(--paper-alt)] hover:text-[var(--ink)] transition-colors active:scale-95"
              >
                <Trophy size={20} weight="fill" />
              </button>

              {currentChallenge.hints && currentChallenge.hints.length > 0 && (
                <button
                  onClick={handleShowHint}
                  title={`Show Hint ${showHintIndex > 0 ? `(${showHintIndex}/${currentChallenge.hints.length})` : ''}`}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--ink-border)] bg-[var(--paper-node)] text-[var(--ink-light)] hover:bg-[var(--paper-alt)] hover:text-[var(--ink)] transition-colors active:scale-95"
                >
                  <Lightbulb size={20} weight="bold" className="text-[var(--accent-orange)]" />
                </button>
              )}
            </div>

            {/* Right buttons: Canvas actions */}
            <div className="flex items-center gap-2 pointer-events-auto">
              <button
                onClick={() => setShowLanes(!showLanes)}
                title="Toggle Architectural Lanes"
                className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-colors active:scale-95 ${
                  showLanes 
                    ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/20' 
                    : 'bg-[var(--paper-node)] border-[var(--ink-border)] text-[var(--ink-light)] hover:bg-[var(--paper-alt)] hover:text-[var(--ink)]'
                }`}
              >
                <Stack size={20} weight="bold" />
              </button>
              <button
                onClick={handleReset}
                title="Reset Workspace"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--ink-border)] bg-[var(--paper-node)] text-[var(--ink-light)] hover:bg-[var(--paper-alt)] hover:text-[var(--ink)] transition-colors active:scale-95"
              >
                <ArrowsClockwise size={20} weight="bold" />
              </button>
              <button
                onClick={toggleFullScreen}
                title="Fullscreen Toggle"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--ink-border)] bg-[var(--paper-node)] text-[var(--ink-light)] hover:bg-[var(--paper-alt)] hover:text-[var(--ink)] transition-colors active:scale-95"
              >
                {isFullScreen ? <CornersIn size={20} weight="bold" /> : <CornersOut size={20} weight="bold" />}
              </button>
              <button
                onClick={handleRunSimulation}
                className={`flex items-center gap-2 px-6 py-2 rounded-xl text-base font-bold transition-all active:scale-95 shadow-md ${
                  isSimulating
                    ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse shadow-rose-600/30'
                    : 'bg-[var(--ink)] hover:opacity-90 text-[var(--paper)]'
                }`}
              >
                {isSimulating ? (
                  <>
                    <Pause size={18} weight="fill" />
                    Stop Sim
                  </>
                ) : (
                  <>
                    <Play size={18} weight="fill" />
                    Run Simulation
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Challenge Brief Panel */}
          {currentChallenge.stage > 0 && (
            <div className="absolute top-16 left-4 z-10 w-80 bg-[var(--paper-node)] border border-[var(--ink-border)] p-4 rounded-xl shadow-sm pointer-events-auto transition-all duration-300 ">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-1.5 text-[var(--ink-light)] font-bold text-xs uppercase tracking-wider">
                  <BookOpen size={14} weight="bold" />
                  <span>Stage Brief</span>
                </div>
                <button
                  onClick={() => setIsBriefExpanded(!isBriefExpanded)}
                  className="p-1 rounded bg-transparent hover:bg-[var(--paper-alt)] text-[var(--ink-light)] hover:text-[var(--ink)] transition-colors"
                >
                  {isBriefExpanded ? <CaretUp size={14} weight="bold" /> : <CaretDown size={14} weight="bold" />}
                </button>
              </div>

              {isBriefExpanded ? (
                <>
                  <h4 className="text-sm font-bold text-[var(--ink)] mb-1">
                    Stage {currentChallenge.stage}: {currentChallenge.title}
                  </h4>
                  <p className="text-xs font-semibold text-[var(--ink-light)] leading-relaxed mb-3">
                    {currentChallenge.description}
                  </p>
                  <div className="grid grid-cols-2 gap-2 border-t border-[var(--ink-border)] pt-3">
                    <div>
                      <span className="block text-[10px] font-bold text-[var(--ink-light)] tracking-wider uppercase mb-0.5">Target</span>
                      <span className="text-sm font-bold text-[var(--ink)]">{currentChallenge.targetQPS.toLocaleString()} QPS</span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold text-[var(--ink-light)] tracking-wider uppercase mb-0.5">Latency</span>
                      <span className="text-sm font-bold text-[var(--ink)]">&lt; {currentChallenge.maxLatencyP99}ms</span>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-sm font-bold text-[var(--ink)] truncate">
                  Stage {currentChallenge.stage}: {currentChallenge.title}
                </p>
              )}
            </div>
          )}

          {/* Flow Diagram Canvas */}
          <div className="flex-1 min-h-0 relative" ref={canvasRef}>
            {!showLanes && (
              <style>{`
                .react-flow__pane {
                  cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath d='M6 2l12 11.2-5.8.5 3.3 7.3-2.3.9-3.2-7.4-4.4 4.8z' fill='%231e293b' stroke='%23ffffff' stroke-width='1.5'/%3E%3C/svg%3E"), default !important;
                }
              `}</style>
            )}
            <ReactFlow
              nodes={enrichedNodes}
              edges={enrichedEdges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeDoubleClick={(_, node) => setActivePopupNodeId(node.id)}
              onPaneClick={() => setActivePopupNodeId(null)}
              onNodeDragStart={() => setActivePopupNodeId(null)}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              fitView
              deleteKeyCode="Delete"
              defaultEdgeOptions={{ type: 'dataFlow', animated: false, style: { stroke: '#6366f1', strokeWidth: 2 } }}
              proOptions={{ hideAttribution: true }}
              minZoom={showLanes ? dynamicMinZoom : 0.1}
              translateExtent={showLanes ? [[-LANE_WIDTH, 0], [LANE_WIDTH, LANE_HEIGHT * 4]] : undefined}
            >
              {showLanes && (
                <Background
                  variant={BackgroundVariant.Lines}
                  gap={24}
                  size={0.5}
                  color="var(--grid)"
                  className="opacity-30"
                />
              )}
              <Controls
                position="bottom-left"
                className="!bg-[var(--paper-alt)] !border !border-[var(--ink-border)] !rounded-xl !shadow-sm"
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

              {showHintIndex > 0 && currentChallenge.hints[showHintIndex - 1] && (
                <Panel position="bottom-right" className="!mb-6 !mr-6 max-w-lg z-50">
                  <div className="bg-[#18181b] text-gray-100 p-4 rounded-xl shadow-2xl flex items-start gap-3 border border-gray-800 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <Lightbulb size={22} weight="fill" className="text-amber-400 shrink-0 mt-0.5" />
                    <div className="flex flex-col flex-1 gap-1.5 min-w-0">
                      <div className="flex items-center justify-between text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                        <span>Architectural Hint ({showHintIndex}/{currentChallenge.hints.length})</span>
                        <div className="flex items-center gap-1.5 ml-2">
                          <button
                            onClick={() => setShowHintIndex(prev => prev <= 1 ? currentChallenge.hints.length : prev - 1)}
                            className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white font-mono text-xs transition-colors"
                            title="Previous Hint"
                          >
                            ←
                          </button>
                          <button
                            onClick={() => setShowHintIndex(prev => prev >= currentChallenge.hints.length ? 1 : prev + 1)}
                            className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white font-mono text-xs transition-colors"
                            title="Next Hint"
                          >
                            →
                          </button>
                        </div>
                      </div>
                      <p className="text-sm font-normal leading-relaxed text-gray-100 font-serif">
                        {currentChallenge.hints[showHintIndex - 1]}
                      </p>
                    </div>
                    <button
                      onClick={() => setShowHintIndex(0)}
                      className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors shrink-0 -mr-1 -mt-1"
                      title="Close Hint"
                    >
                      <X size={16} weight="bold" />
                    </button>
                  </div>
                </Panel>
              )}
              
              <NodeDetailsPopup 
                selectedNode={activePopupNodeId ? enrichedNodes.find(n => n.id === activePopupNodeId) : null}
                selectedNodeMetrics={(() => {
                  const sel = activePopupNodeId ? enrichedNodes.find(n => n.id === activePopupNodeId) : null;
                  return sel ? simResult?.nodeMetrics[sel.id] : undefined;
                })()}
                simResult={simResult}
                onClose={() => setActivePopupNodeId(null)}
              />
            </ReactFlow>
          </div>
        </div>

        {/* Right Side: Metrics Dashboard */}
        <div className="w-80 shrink-0 border-l border-[var(--ink-border)] bg-[var(--paper-alt)] flex flex-col">
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

      {/* Simulation Summary Modal */}
      <SimulationSummaryModal
        isOpen={showSummaryModal}
        onClose={() => setShowSummaryModal(false)}
        result={simResult}
        targetQPS={currentChallenge.targetQPS}
        maxLatencyP99={currentChallenge.maxLatencyP99}
        nodesCount={nodes.filter(n => n.type !== 'lane').length}
        spofCount={spofCount}
      />

      {/* Chaos Granular SPOF Targeting Modal */}
      <ChaosTargetModal
        isOpen={Boolean(activeChaosItemForModal)}
        onClose={() => setActiveChaosItemForModal(null)}
        chaosItem={activeChaosItemForModal}
        nodes={nodes}
        onInject={(item, targetIds, blastMode) => {
          setActiveChaosItemForModal(null);
          handleInjectChaos(item, targetIds, blastMode);
        }}
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
