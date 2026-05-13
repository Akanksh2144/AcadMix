import React, { useState } from 'react';
import {
  ReactFlow, Controls, ControlButton, Background, BackgroundVariant,
  type Connection, type Edge, type Node, type OnNodesChange, type OnEdgesChange,
} from '@xyflow/react';
import { LockKey, LockKeyOpen } from '@phosphor-icons/react';
import '@xyflow/react/dist/style.css';
import { vlsiNodeTypes } from './nodes';

interface Props {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: (params: Connection) => void;
  onNodeClick: (event: React.MouseEvent, node: Node) => void;
  onPaneClick: () => void;
}

export default function VLSICanvas({
  nodes, edges, onNodesChange, onEdgesChange, onConnect, onNodeClick, onPaneClick,
}: Props) {
  const [locked, setLocked] = useState(false);

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={vlsiNodeTypes}
        fitView
        fitViewOptions={{ padding: 0.25 }}
        deleteKeyCode="Delete"
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: false,
          style: { stroke: '#475569', strokeWidth: 2 },
        }}
        proOptions={{ hideAttribution: true }}
        panOnDrag={!locked}
        zoomOnScroll={!locked}
        zoomOnPinch={!locked}
        zoomOnDoubleClick={false}
        nodesDraggable={!locked}
        nodesConnectable={!locked}
        elementsSelectable={true}
        className="bg-[#0B0F19]"
      >
        <Controls
          showInteractive={false}
          position="bottom-left"
          className="!flex !flex-col !gap-1 !p-1.5 !bg-slate-900/70 !backdrop-blur-xl !rounded-2xl !border !border-slate-800 !shadow-2xl !overflow-hidden !m-4"
        >
          <ControlButton
            onClick={() => setLocked(l => !l)}
            title={locked ? 'Unlock canvas' : 'Lock canvas'}
            className={`!w-8 !h-8 !rounded-xl !border-none !bg-transparent flex items-center justify-center transition-colors
              ${locked ? '!text-rose-400 hover:!bg-rose-500/10' : '!text-slate-400 hover:!text-emerald-400 hover:!bg-emerald-500/10'}`}
          >
            {locked ? <LockKey size={16} weight="duotone" /> : <LockKeyOpen size={16} weight="duotone" />}
          </ControlButton>
        </Controls>

        <Background
          variant={BackgroundVariant.Dots}
          gap={18}
          size={1}
          color="rgba(148,163,184,0.12)"
          style={{ backgroundColor: '#0B0F19' }}
        />
      </ReactFlow>
    </div>
  );
}
