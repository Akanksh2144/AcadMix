import React from 'react';

interface NodeConfigurationMenuProps {
  node: any;
}

export function NodeConfigurationMenu({ node }: NodeConfigurationMenuProps) {
  if (!node) return null;

  const { type, data, id } = node;
  const onChange = (field: string, value: any) => {
    if (data.onDataChange) {
      data.onDataChange(id, field, value);
    }
  };

  const renderField = (label: string, children: React.ReactNode, valueDisplay?: React.ReactNode) => (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1">
        <label className="text-sm font-semibold text-[var(--ink-light)]">{label}</label>
        {valueDisplay && <span className="text-sm font-bold text-[var(--accent-blue)]">{valueDisplay}</span>}
      </div>
      {children}
    </div>
  );

  const renderInput = (label: string, field: string, type: string = 'text', min?: number, max?: number) => {
    return renderField(label, (
      <input
        type={type}
        min={min}
        max={max}
        value={data[field] ?? ''}
        onChange={(e) => {
          let val: any = e.target.value;
          if (type === 'number') val = Number(val);
          if (min !== undefined) val = Math.max(min, val);
          if (max !== undefined) val = Math.min(max, val);
          onChange(field, val);
        }}
        className="w-full px-3 py-2 text-sm rounded-lg bg-[var(--paper-alt)] border border-[var(--ink-border)] text-[var(--ink)] focus:outline-none focus:ring-0 focus:border-[var(--accent-blue)] transition-all"
      />
    ));
  };

  const renderSlider = (label: string, field: string, min: number, max: number, suffix: string = '') => {
    const value = data[field] ?? min;
    return renderField(label, (
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(field, Number(e.target.value))}
        className="w-full accent-[var(--accent-blue)]"
      />
    ), `${value}${suffix}`);
  };

  const renderSelect = (label: string, field: string, options: { label: string, value: string }[]) => {
    return renderField(label, (
      <select
        value={data[field] ?? options[0]?.value}
        onChange={(e) => onChange(field, e.target.value)}
        className="w-full px-3 py-2 text-sm rounded-lg bg-[var(--paper-alt)] border border-[var(--ink-border)] text-[var(--ink)] focus:outline-none focus:ring-0 focus:border-[var(--accent-blue)] transition-all appearance-none"
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    ));
  };

  const renderCheckbox = (label: string, field: string) => {
    return (
      <div className="flex items-center justify-between mb-4">
        <label className="text-sm font-semibold text-[var(--ink-light)]">{label}</label>
        <input
          type="checkbox"
          checked={!!data[field]}
          onChange={(e) => onChange(field, e.target.checked)}
          className="w-4 h-4 rounded border-[var(--ink-border)] text-[var(--accent-blue)] focus:ring-[var(--accent-blue)]"
        />
      </div>
    );
  };

  return (
    <div className="p-4 bg-[var(--paper-node)] rounded-xl border border-[var(--ink-border)] mt-4">
      <h3 className="text-sm font-bold text-[var(--ink)] mb-4 tracking-wide uppercase border-b border-[var(--ink-border)] pb-2">
        Configuration
      </h3>
      <div className="space-y-2">
        {type === 'appServer' && (
          <>
            {renderInput('Replicas', 'replicas', 'number', 1, 50)}
            {renderInput('Threads per Replica', 'maxThreads', 'number', 10, 2000)}
            {renderSlider('Process Time', 'processingTime', 10, 500, 'ms')}
          </>
        )}
        
        {type === 'cache' && (
          <>
            {renderSelect('Eviction Policy', 'evictionPolicy', [
              { label: 'LRU (Least Recently Used)', value: 'LRU' },
              { label: 'LFU (Least Frequently Used)', value: 'LFU' },
              { label: 'FIFO (First In First Out)', value: 'FIFO' },
            ])}
            {renderSelect('Caching Pattern', 'pattern', [
              { label: 'Write-Around / Read-Through', value: 'write_around' },
              { label: 'Write-Through', value: 'write_through' },
              { label: 'Write-Back', value: 'write_back' },
            ])}
            {renderSlider('Cache Hit Ratio Target', 'hitRatio', 0, 100, '%')}
          </>
        )}

        {type === 'cdn' && (
          <>
            {renderSlider('Cache Hit Ratio', 'cacheHitRatio', 0, 100, '%')}
            {renderSlider('Edge Latency', 'edgeLatency', 5, 100, 'ms')}
          </>
        )}

        {type === 'client' && (
          <>
            {renderSelect('Protocol', 'protocol', [
              { label: 'HTTP/2', value: 'HTTP/2' },
              { label: 'WebSockets', value: 'WebSockets' },
              { label: 'gRPC', value: 'gRPC' },
              { label: 'TCP', value: 'TCP' },
            ])}
            {renderInput('Requests per Second', 'requestsPerSec', 'number', 0, 500000)}
          </>
        )}

        {type === 'dns' && (
          <>
            {renderSelect('Routing Policy', 'routingPolicy', [
              { label: 'Latency-based', value: 'latency' },
              { label: 'Geolocation', value: 'geolocation' },
              { label: 'Weighted Round Robin', value: 'weighted' },
              { label: 'Failover', value: 'failover' },
            ])}
            {renderSlider('TTL', 'ttl', 60, 86400, 's')}
          </>
        )}

        {type === 'loadBalancer' && (
          <>
            {renderSelect('Algorithm', 'algorithm', [
              { label: 'Round Robin', value: 'round_robin' },
              { label: 'Least Connections', value: 'least_connections' },
              { label: 'IP Hash', value: 'ip_hash' },
            ])}
            {renderSlider('Health Check Interval', 'healthCheckInterval', 1, 60, 's')}
          </>
        )}

        {type === 'messageQueue' && (
          <>
            {renderSelect('Queue Type', 'queueType', [
              { label: 'Log-based (Kafka)', value: 'log' },
              { label: 'Message Broker (RabbitMQ)', value: 'broker' },
              { label: 'In-Memory (Redis PubSub)', value: 'memory' },
            ])}
            {renderInput('Partitions', 'partitions', 'number', 1, 128)}
            {renderInput('Consumer Groups', 'consumerGroups', 'number', 1, 20)}
          </>
        )}

        {type === 'noSqlDatabase' && (
          <>
            {renderSelect('Consistency Level', 'consistencyLevel', [
              { label: 'Eventual Consistency', value: 'eventual' },
              { label: 'Strong Consistency', value: 'strong' },
              { label: 'Quorum', value: 'quorum' },
            ])}
            {renderSelect('Partition Key', 'partitionKey', [
              { label: 'User ID (Hash)', value: 'user_id' },
              { label: 'Timestamp (Range)', value: 'timestamp' },
              { label: 'Composite', value: 'composite' },
            ])}
          </>
        )}

        {type === 'objectStorage' && (
          <>
            {renderSlider('Avg Latency', 'latency', 10, 500, 'ms')}
            {renderSlider('Max Throughput', 'maxThroughput', 10, 10000, ' MB/s')}
          </>
        )}

        {type === 'sqlDatabase' && (
          <>
            {renderInput('Read Replicas', 'readReplicas', 'number', 0, 15)}
            {renderSlider('Replication Lag', 'replicationLag', 0, 5000, 'ms')}
            {renderCheckbox('Indexes Enabled', 'indexed')}
            {renderCheckbox('Sharding Enabled', 'sharded')}
            {data.sharded && renderInput('Shard Count', 'shardCount', 'number', 2, 100)}
          </>
        )}

        {type === 'workerPool' && (
          <>
            {renderInput('Worker Instances', 'workers', 'number', 1, 1000)}
            {renderSlider('Task Processing Time', 'taskProcessingTime', 50, 5000, 'ms')}
          </>
        )}
      </div>
    </div>
  );
}
