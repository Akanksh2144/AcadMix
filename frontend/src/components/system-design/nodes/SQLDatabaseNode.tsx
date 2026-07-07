import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Database } from '@phosphor-icons/react';

interface SQLDatabaseData {
  label: string;
  readReplicas: number;
  replicationLag: number;
  indexed: boolean;
  sharded: boolean;
  shardCount: number;
  onDataChange?: (id: string, field: string, value: any) => void;
  metrics?: {
    processedQPS: number;
    latencyAdded: number;
    utilization: number;
    status: 'healthy' | 'warning' | 'critical';
  };
  [key: string]: unknown;
}

function SQLDatabaseNode({ id, data }: NodeProps & { data: SQLDatabaseData }) {
  const onChange = (field: string, value: any) => {
    data.onDataChange?.(id, field, value);
  };

  const replicationLag = data.replicationLag ?? 50;
  const sharded = data.sharded ?? false;

  return (
    <div className="bg-white dark:bg-gray-800 border-2 border-emerald-400 dark:border-emerald-500 rounded-2xl shadow-lg shadow-emerald-500/10 min-w-[210px] overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-green-500 px-4 py-2 flex items-center gap-2">
        <Database size={16} weight="bold" className="text-white" />
        <span className="text-xs font-bold text-white uppercase tracking-wider">SQL Database</span>
      </div>

      {/* Controls */}
      <div className="p-3 space-y-2.5">
        <div>
          <label className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Read Replicas</label>
          <input
            type="number"
            min={0}
            max={10}
            value={data.readReplicas ?? 0}
            onChange={(e) => onChange('readReplicas', Number(e.target.value))}
            className="nodrag w-full mt-0.5 px-2.5 py-1.5 text-xs rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-emerald-400 focus:border-transparent outline-none transition-all"
          />
        </div>

        <div>
          <label className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Replication Lag: <span className="text-emerald-500 font-bold">{replicationLag}ms</span>
          </label>
          <input
            type="range"
            min={0}
            max={500}
            step={5}
            value={replicationLag}
            onChange={(e) => onChange('replicationLag', Number(e.target.value))}
            className="nodrag w-full h-1.5 rounded-full appearance-none bg-gray-200 dark:bg-gray-700 accent-emerald-500 cursor-pointer"
          />
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={data.indexed ?? true}
              onChange={(e) => onChange('indexed', e.target.checked)}
              className="nodrag w-3.5 h-3.5 rounded border-gray-300 dark:border-gray-600 text-emerald-500 focus:ring-emerald-400 accent-emerald-500"
            />
            <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Indexed</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={sharded}
              onChange={(e) => onChange('sharded', e.target.checked)}
              className="nodrag w-3.5 h-3.5 rounded border-gray-300 dark:border-gray-600 text-emerald-500 focus:ring-emerald-400 accent-emerald-500"
            />
            <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Sharded</span>
          </label>
        </div>

        {sharded && (
          <div>
            <label className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Shard Count</label>
            <input
              type="number"
              min={1}
              max={32}
              value={data.shardCount ?? 1}
              onChange={(e) => onChange('shardCount', Number(e.target.value))}
              className="nodrag w-full mt-0.5 px-2.5 py-1.5 text-xs rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-emerald-400 focus:border-transparent outline-none transition-all"
            />
          </div>
        )}
      </div>

      {/* Metrics Footer */}
      {data.metrics && (
        <div className="px-3 py-2 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-gray-500">{data.metrics.processedQPS} req/s</span>
            <span className={`font-bold ${data.metrics.status === 'healthy' ? 'text-emerald-500' : data.metrics.status === 'warning' ? 'text-amber-500' : 'text-red-500'}`}>
              {data.metrics.latencyAdded}ms
            </span>
          </div>
          <div className="mt-1 h-1 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${data.metrics.utilization > 0.9 ? 'bg-red-500' : data.metrics.utilization > 0.7 ? 'bg-amber-500' : 'bg-emerald-500'}`}
              style={{ width: `${Math.min(data.metrics.utilization * 100, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3.5 !h-3.5 !bg-emerald-500 !border-2 !border-white dark:!border-gray-800 !rounded-full !shadow-md"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3.5 !h-3.5 !bg-emerald-500 !border-2 !border-white dark:!border-gray-800 !rounded-full !shadow-md"
      />
    </div>
  );
}

export default memo(SQLDatabaseNode);
