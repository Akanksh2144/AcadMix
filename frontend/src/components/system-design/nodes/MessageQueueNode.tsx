import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Queue } from '@phosphor-icons/react';

function MessageQueueNode({ id, data }: NodeProps & { data: any }) {
  const onChange = (field: string, value: any) => {
    data.onDataChange?.(id, field, value);
  };

  return (
    <div className="bg-white dark:bg-gray-800 border-2 border-orange-400 dark:border-orange-500 rounded-2xl shadow-lg shadow-orange-500/10 min-w-[210px] overflow-hidden">
      <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-2 flex items-center gap-2">
        <Queue size={16} weight="bold" className="text-white" />
        <span className="text-xs font-bold text-white uppercase tracking-wider">Message Queue / Stream</span>
      </div>

      <div className="p-3 space-y-2.5">
        <div>
          <label className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Broker Type</label>
          <select
            value={data.queueType || 'kafka'}
            onChange={(e) => onChange('queueType', e.target.value)}
            className="nodrag w-full mt-0.5 px-2.5 py-1.5 text-xs rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none transition-all"
          >
            <option value="kafka">Apache Kafka</option>
            <option value="rabbitmq">RabbitMQ</option>
            <option value="sqs">AWS SQS</option>
          </select>
        </div>

        <div>
          <label className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Partitions / Shards</label>
          <input
            type="number"
            min={1}
            max={64}
            value={data.partitions ?? 4}
            onChange={(e) => onChange('partitions', Math.max(1, Number(e.target.value)))}
            className="nodrag w-full mt-0.5 px-2.5 py-1.5 text-xs rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none transition-all"
          />
        </div>

        <div>
          <label className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Consumer Groups</label>
          <input
            type="number"
            min={1}
            max={16}
            value={data.consumerGroups ?? 1}
            onChange={(e) => onChange('consumerGroups', Math.max(1, Number(e.target.value)))}
            className="nodrag w-full mt-0.5 px-2.5 py-1.5 text-xs rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none transition-all"
          />
        </div>
      </div>

      {data.metrics && (
        <div className="px-3 py-2 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30 text-[10px]">
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Backlog: {data.metrics.droppedQPS > 0 ? 'Lagging' : 'Healthy'}</span>
            <span className="font-bold text-orange-500">{data.metrics.processedQPS.toFixed(0)}/s</span>
          </div>
        </div>
      )}

      <Handle
        type="target"
        position={Position.Left}
        className="!w-3.5 !h-3.5 !bg-orange-500 !border-2 !border-white dark:!border-gray-800 !rounded-full !shadow-md"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3.5 !h-3.5 !bg-orange-500 !border-2 !border-white dark:!border-gray-800 !rounded-full !shadow-md"
      />
    </div>
  );
}

export default memo(MessageQueueNode);
