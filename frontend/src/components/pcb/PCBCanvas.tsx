import React, { useCallback, useMemo } from 'react';
import {
  ReactFlow, Controls, ControlButton, Background, BackgroundVariant, Panel,
  useNodesState, useEdgesState, addEdge,
  type Connection, type Edge, type Node,
} from '@xyflow/react';
import { LockKey, LockKeyOpen } from '@phosphor-icons/react';
import '@xyflow/react/dist/style.css';
import { pcbNodeTypes } from './nodes';
import type { ComponentType } from './types';
import { getCatalogEntry } from './componentCatalog';
import { toast } from 'sonner';

interface Props {
  nodes: Node[];
  edges: Edge[];
  nodeTypes: Record<string, React.ComponentType<any>>;
  onNodesChange: any;
  onEdgesChange: any;
  onConnect: (params: Connection) => void;
  onNodeClick: (event: React.MouseEvent, node: Node) => void;
  onPaneClick: () => void;
}

export default function PCBCanvas({ nodes, edges, nodeTypes, onNodesChange, onEdgesChange, onConnect, onNodeClick, onPaneClick }: Props) {
  const [canvasLocked, setCanvasLocked] = React.useState(false);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (canvasLocked) {
      const target = e.target as HTMLElement;
      // Ignore clicks on controls or panels
      if (target.closest('.react-flow__controls') || target.closest('.react-flow__panel')) {
        return;
      }
      toast.info('Canvas is locked', {
        id: 'canvas-locked-toast', // prevent spamming multiple toasts
      });
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (canvasLocked) {
      toast.info('Canvas is locked', {
        id: 'canvas-locked-toast',
      });
    }
  };

  return (
    <div 
      className="flex-1 min-h-0 h-full" 
      onPointerDownCapture={handlePointerDown}
      onWheelCapture={handleWheel}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        fitView
        deleteKeyCode="Delete"
        defaultEdgeOptions={{
          animated: false,
          type: 'step',
          style: { stroke: '#ff0000', strokeWidth: 3, mixBlendMode: 'screen' },
        }}
        proOptions={{ hideAttribution: true }}
        panOnDrag={!canvasLocked}
        zoomOnScroll={!canvasLocked}
        zoomOnPinch={!canvasLocked}
        zoomOnDoubleClick={!canvasLocked}
        nodesDraggable={!canvasLocked}
        nodesConnectable={!canvasLocked}
        elementsSelectable={!canvasLocked}
      >
        <Controls 
          showInteractive={false} 
          position="bottom-left"
          className="flex flex-row items-center gap-2 p-1.5 bg-slate-900/60 backdrop-blur-xl rounded-full border border-slate-700/50 shadow-2xl overflow-hidden !m-6"
        >
          <ControlButton 
            onClick={() => setCanvasLocked(!canvasLocked)} 
            title="Toggle Canvas Lock"
            className={`!w-10 !h-10 !rounded-full !border-none !bg-transparent hover:!bg-slate-800/80 transition-colors flex items-center justify-center
              ${canvasLocked ? '!text-rose-400 hover:!text-rose-300' : '!text-emerald-400 hover:!text-emerald-300'}
            `}
          >
            {canvasLocked ? <LockKey size={20} weight="duotone" /> : <LockKeyOpen size={20} weight="duotone" />}
          </ControlButton>
        </Controls>
        <Background
          variant={BackgroundVariant.Lines}
          gap={16}
          color="rgba(255, 255, 255, 0.05)"
          style={{ backgroundColor: '#111827' }}
        />

      </ReactFlow>
    </div>
  );
}
