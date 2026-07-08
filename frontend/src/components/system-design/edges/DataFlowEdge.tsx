import React from 'react';
import { BaseEdge, getBezierPath, type EdgeProps } from '@xyflow/react';

export default function DataFlowEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetPosition,
    targetX,
    targetY,
  });

  // Extract stroke color to match the dot with the line color
  const strokeColor = style?.stroke || '#60a5fa';

  return (
    <>
      <BaseEdge path={edgePath} style={style} markerEnd={markerEnd} id={id} />
      {/* Dynamic animated dot flowing along the wire */}
      <circle r={5} fill={strokeColor} className="drop-shadow-md">
        <animateMotion 
          dur={style?.animationDuration === '0s' ? '3s' : (style?.animationDuration || '3s')} 
          repeatCount="indefinite" 
          path={edgePath} 
        />
      </circle>
    </>
  );
}
