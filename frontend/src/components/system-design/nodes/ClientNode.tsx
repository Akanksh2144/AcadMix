import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Users } from '@phosphor-icons/react';

function ClientNode({ id, data }: NodeProps & { data: any }) {
  const onChange = (field: string, value: any) => {
    data.onDataChange?.(id, field, value);
  };

  return (
    <div className="bg-white dark:bg-gray-800 border-2 border-violet-400 dark:border-violet-500 rounded-2xl shadow-lg shadow-violet-500/10 min-w-[210px] overflow-hidden">
      <div className="bg-gradient-to-r from-violet-500 to-purple-600 px-4 py-2 flex items-center gap-2">
        <Users size={16} weight="bold" className="text-white" />
        <span className="text-xs font-bold text-white uppercase tracking-wider">Client / Users</span>
      </div>

      <div className="p-3 space-y-2.5">
        <div>
          <label className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Target QPS</label>
          <input
            type="number"
            min={1}
            value={data.requestsPerSec ?? 1000}
            onChange={(e) => onChange('requestsPerSec', Number(e.target.value))}
            className="nodrag w-full mt-0.5 px-2.5 py-1.5 text-xs rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-violet-400 focus:border-transparent outline-none transition-all"
          />
        </div>

        <div>
          <label className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Protocol</label>
          <select
            value={data.protocol || 'http2'}
            onChange={(e) => onChange('protocol', e.target.value)}
            className="nodrag w-full mt-0.5 px-2.5 py-1.5 text-xs rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-violet-400 focus:border-transparent outline-none transition-all"
          >
            <option value="http1">HTTP/1.1</option>
            <option value="http2">HTTP/2</option>
            <option value="http3">HTTP/3 (QUIC)</option>
            <option value="websocket">WebSockets</option>
            <option value="grpc">gRPC</option>
          </select>
        </div>
      </div>

      {data.metrics && (
        <div className="px-3 py-2 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30 text-[10px]">
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Outgoing: {data.metrics.processedQPS.toFixed(0)} req/s</span>
            <span className="font-bold text-violet-500">{data.metrics.latencyAdded}ms</span>
          </div>
        </div>
      )}

      <Handle
        type="source"
        position={Position.Right}
        className="!w-3.5 !h-3.5 !bg-violet-500 !border-2 !border-white dark:!border-gray-800 !rounded-full !shadow-md"
      />
    </div>
  );
}

export default memo(ClientNode);
