import React, { useCallback, useMemo } from 'react';
import {
  ReactFlow, Controls, Background, BackgroundVariant, Panel,
  useNodesState, useEdgesState, addEdge,
  type Connection, type Edge, type Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { pcbNodeTypes } from './nodes';
import type { ComponentType } from './types';
import { getCatalogEntry } from './componentCatalog';

interface Props {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: any;
  onEdgesChange: any;
  onConnect: (params: Connection) => void;
  onNodeClick: (event: React.MouseEvent, node: Node) => void;
  onPaneClick: () => void;
}

export default function PCBCanvas({ nodes, edges, onNodesChange, onEdgesChange, onConnect, onNodeClick, onPaneClick }: Props) {
  return (
    <div className="flex-1 min-h-0 h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={pcbNodeTypes}
        fitView
        deleteKeyCode="Delete"
        defaultEdgeOptions={{
          animated: false,
          type: 'step',
          style: { stroke: '#dc2626', strokeWidth: 4 },
        }}
        proOptions={{ hideAttribution: true }}
      >
        <Controls
          position="bottom-left"
          className="!bg-white/80 dark:!bg-gray-800/80 !border !border-gray-200 dark:!border-gray-700 !rounded-xl !shadow-lg backdrop-blur-sm"
        />
        <Background
          variant={BackgroundVariant.Lines}
          gap={20}
          color="rgba(255, 255, 255, 0.06)"
          style={{ backgroundColor: '#111812' }}
        />
        <Panel position="bottom-right">
          <div className="flex items-center gap-3 text-[10px] text-gray-500 font-mono bg-black/40 backdrop-blur-md rounded-xl px-4 py-2 border border-gray-700/30 shadow-sm">
            <span><kbd className="px-1.5 py-0.5 rounded bg-white/10 text-[9px] font-bold shadow-sm">Scroll</kbd> Zoom</span>
            <span className="w-px h-3 bg-gray-600" />
            <span><kbd className="px-1.5 py-0.5 rounded bg-white/10 text-[9px] font-bold shadow-sm">Drag</kbd> Pan</span>
            <span className="w-px h-3 bg-gray-600" />
            <span><kbd className="px-1.5 py-0.5 rounded bg-white/10 text-[9px] font-bold shadow-sm">Del</kbd> Remove</span>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}
