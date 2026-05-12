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
  nodeTypes: Record<string, React.ComponentType<any>>;
  onNodesChange: any;
  onEdgesChange: any;
  onConnect: (params: Connection) => void;
  onNodeClick: (event: React.MouseEvent, node: Node) => void;
  onPaneClick: () => void;
}

export default function PCBCanvas({ nodes, edges, nodeTypes, onNodesChange, onEdgesChange, onConnect, onNodeClick, onPaneClick }: Props) {
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
        nodeTypes={nodeTypes}
        fitView
        deleteKeyCode="Delete"
        defaultEdgeOptions={{
          animated: false,
          type: 'step',
          style: { stroke: '#ff0000', strokeWidth: 3, mixBlendMode: 'screen' },
        }}
        proOptions={{ hideAttribution: true }}
      >
        <Controls position="bottom-left" />
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
