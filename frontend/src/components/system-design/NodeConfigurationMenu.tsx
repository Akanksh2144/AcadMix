import React, { useState } from 'react';

interface NodeConfigurationMenuProps {
  node: any;
}

export function NodeConfigurationMenu({ node }: NodeConfigurationMenuProps) {
  const [activeTab, setActiveTab] = useState<'perf' | 'rel' | 'net' | 'sec'>('perf');

  if (!node) return null;

  const { type, data, id } = node;
  const onChange = (field: string, value: any) => {
    if (data.onDataChange) {
      data.onDataChange(id, field, value);
    }
  };

  const renderField = (label: string, children: React.ReactNode, valueDisplay?: React.ReactNode) => (
    <div className="mb-3.5">
      <div className="flex justify-between items-center mb-1">
        <label className="text-xs font-semibold text-[var(--ink-light)]">{label}</label>
        {valueDisplay && <span className="text-xs font-bold text-[var(--accent-blue)] font-mono">{valueDisplay}</span>}
      </div>
      {children}
    </div>
  );

  const renderInput = (label: string, field: string, type: string = 'text', min?: number, max?: number, defaultValue: any = '') => {
    const val = data[field] !== undefined ? data[field] : defaultValue;
    return renderField(label, (
      <input
        type={type}
        min={min}
        max={max}
        value={val}
        onChange={(e) => {
          let v: any = e.target.value;
          if (type === 'number') v = Number(v);
          if (min !== undefined && type === 'number') v = Math.max(min, v);
          if (max !== undefined && type === 'number') v = Math.min(max, v);
          onChange(field, v);
        }}
        className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-[var(--paper-alt)] border border-[var(--ink-border)] text-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-blue)] transition-all font-mono"
      />
    ));
  };

  const renderSlider = (label: string, field: string, min: number, max: number, suffix: string = '', defaultValue: number = min) => {
    const value = data[field] !== undefined ? data[field] : defaultValue;
    return renderField(label, (
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(field, Number(e.target.value))}
        className="w-full accent-[var(--accent-blue)] cursor-pointer h-1.5 rounded-lg bg-[var(--ink-border)]"
      />
    ), `${value}${suffix}`);
  };

  const renderSelect = (label: string, field: string, options: { label: string; value: string }[], defaultValue?: string) => {
    const val = data[field] !== undefined ? data[field] : (defaultValue ?? options[0]?.value);
    return renderField(label, (
      <select
        value={val}
        onChange={(e) => onChange(field, e.target.value)}
        className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-[var(--paper-alt)] border border-[var(--ink-border)] text-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-blue)] transition-all appearance-none cursor-pointer"
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    ));
  };

  const renderCheckbox = (label: string, field: string, defaultValue: boolean = false) => {
    const checked = data[field] !== undefined ? !!data[field] : defaultValue;
    return (
      <div className="flex items-center justify-between py-1 mb-2">
        <label className="text-xs font-semibold text-[var(--ink-light)]">{label}</label>
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(field, e.target.checked)}
          className="w-4 h-4 rounded border-[var(--ink-border)] text-[var(--accent-blue)] focus:ring-[var(--accent-blue)] cursor-pointer accent-[var(--accent-blue)]"
        />
      </div>
    );
  };

  // Enterprise Defaults based on component category
  const defaultLatency = type === 'client' ? 0 : type === 'cache' || type === 'memcached' ? 2 : 15;
  const defaultThroughput = type === 'client' ? 10000 : 100000;
  const defaultCost = typeof data.cost === 'number' ? data.cost : 50;
  const defaultPort = type === 'sqlDatabase' ? 5432 : type === 'cache' ? 6379 : type === 'messageQueue' ? 9092 : 443;

  return (
    <div className="p-3.5 bg-[var(--paper-node)] rounded-xl border border-[var(--ink-border)] mt-3 shadow-sm">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-[var(--ink-border)]">
        <h3 className="text-xs font-bold text-[var(--ink)] tracking-wider uppercase flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[var(--accent-blue)] animate-pulse" />
          Enterprise Specs
        </h3>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--paper-alt)] text-[var(--ink-light)] border border-[var(--ink-border)] uppercase">
          {type || 'Node'}
        </span>
      </div>

      {/* Pill-shaped Tab Menu with active tab matching external container shape */}
      <div className="flex p-1 bg-[var(--paper-alt)] rounded-full border border-[var(--ink-border)] mb-4 gap-1">
        {[
          { id: 'perf', label: 'Perf & Cost' },
          { id: 'rel', label: 'Resilience' },
          { id: 'net', label: 'Network' },
          { id: 'sec', label: 'Security' },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-1 px-2 text-[11px] font-bold rounded-full transition-all duration-200 text-center truncate ${
                isActive
                  ? 'bg-[var(--accent-blue)] text-white shadow-sm'
                  : 'text-[var(--ink-light)] hover:text-[var(--ink)] hover:bg-[var(--paper-node)]'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="space-y-1">
        {/* TAB 1: PERFORMANCE & COST */}
        {activeTab === 'perf' && (
          <div>
            {renderSlider('Latency (ms)', 'latency', 0, 1000, ' ms', defaultLatency)}
            {renderInput('Throughput Limit (RPS)', 'throughput', 'number', 10, 1000000, defaultThroughput)}
            {renderInput('Base Cost ($/mo)', 'cost', 'number', 0, 50000, defaultCost)}

            {/* Component-Specific Architecture Parameters */}
            {type === 'appServer' && (
              <div className="mt-4 pt-3 border-t border-[var(--ink-border)]">
                <div className="text-xs font-bold text-[var(--ink)] mb-2.5">Server Cluster Scaling</div>
                {renderInput('Replicas', 'replicas', 'number', 1, 100, 2)}
                {renderInput('Threads / Replica', 'maxThreads', 'number', 10, 5000, 200)}
                {renderSlider('Process Time (ms)', 'processingTime', 5, 500, ' ms', 25)}
              </div>
            )}

            {(type === 'cache' || type === 'memcached') && (
              <div className="mt-4 pt-3 border-t border-[var(--ink-border)]">
                <div className="text-xs font-bold text-[var(--ink)] mb-2.5">Cache Tuning</div>
                {renderSelect('Eviction Policy', 'evictionPolicy', [
                  { label: 'LRU (Least Recently Used)', value: 'LRU' },
                  { label: 'LFU (Least Frequently Used)', value: 'LFU' },
                  { label: 'FIFO (First In First Out)', value: 'FIFO' },
                ], 'LRU')}
                {renderSelect('Caching Pattern', 'pattern', [
                  { label: 'Write-Around / Read-Through', value: 'write_around' },
                  { label: 'Write-Through', value: 'write_through' },
                  { label: 'Write-Back (Async)', value: 'write_back' },
                ], 'write_around')}
                {renderSlider('Cache Hit Ratio', 'hitRatio', 0, 100, '%', 85)}
              </div>
            )}

            {(type === 'cdn' || type === 'cdnEdgeCache') && (
              <div className="mt-4 pt-3 border-t border-[var(--ink-border)]">
                <div className="text-xs font-bold text-[var(--ink)] mb-2.5">CDN Edge Config</div>
                {renderSlider('Edge Hit Ratio', 'cacheHitRatio', 0, 100, '%', 92)}
                {renderSlider('Edge Latency (ms)', 'edgeLatency', 2, 100, ' ms', 8)}
              </div>
            )}

            {type === 'client' && (
              <div className="mt-4 pt-3 border-t border-[var(--ink-border)]">
                <div className="text-xs font-bold text-[var(--ink)] mb-2.5">Traffic Simulation</div>
                {renderInput('Simulated Traffic (QPS)', 'requestsPerSec', 'number', 0, 500000, 1000)}
              </div>
            )}

            {(type === 'sqlDatabase' || type === 'noSqlDatabase') && (
              <div className="mt-4 pt-3 border-t border-[var(--ink-border)]">
                <div className="text-xs font-bold text-[var(--ink)] mb-2.5">Database Architecture</div>
                {renderInput('Read Replicas', 'readReplicas', 'number', 0, 32, 2)}
                {renderSlider('Replication Lag (ms)', 'replicationLag', 0, 5000, ' ms', 15)}
                {renderCheckbox('Indexes Optimized', 'indexed', true)}
                {renderCheckbox('Sharding Enabled', 'sharded', false)}
                {data.sharded && renderInput('Shard Count', 'shardCount', 'number', 2, 256, 4)}
              </div>
            )}

            {(type === 'messageQueue' || type === 'eventBus' || type === 'pubsub') && (
              <div className="mt-4 pt-3 border-t border-[var(--ink-border)]">
                <div className="text-xs font-bold text-[var(--ink)] mb-2.5">Messaging Topology</div>
                {renderSelect('Queue Engine', 'queueType', [
                  { label: 'Partitioned Log (Kafka)', value: 'log' },
                  { label: 'Message Broker (RabbitMQ)', value: 'broker' },
                  { label: 'In-Memory PubSub (Redis)', value: 'memory' },
                ], 'log')}
                {renderInput('Partitions / Shards', 'partitions', 'number', 1, 256, 12)}
                {renderInput('Consumer Groups', 'consumerGroups', 'number', 1, 50, 4)}
              </div>
            )}

            {(type === 'workerPool' || type === 'cronJob') && (
              <div className="mt-4 pt-3 border-t border-[var(--ink-border)]">
                <div className="text-xs font-bold text-[var(--ink)] mb-2.5">Async Worker Fleet</div>
                {renderInput('Worker Instances', 'workers', 'number', 1, 2000, 16)}
                {renderSlider('Task Processing Time', 'taskProcessingTime', 10, 10000, ' ms', 250)}
              </div>
            )}

            {(type === 'loadBalancer' || type === 'networkLoadBalancer' || type === 'apiGateway') && (
              <div className="mt-4 pt-3 border-t border-[var(--ink-border)]">
                <div className="text-xs font-bold text-[var(--ink)] mb-2.5">Load Balancing Strategy</div>
                {renderSelect('Algorithm', 'algorithm', [
                  { label: 'Round Robin', value: 'round_robin' },
                  { label: 'Least Connections', value: 'least_connections' },
                  { label: 'Consistent Hash Ring', value: 'ip_hash' },
                  { label: 'Weighted Response Time', value: 'weighted' },
                ], 'round_robin')}
                {renderSlider('Health Check Interval', 'healthCheckInterval', 1, 60, ' s', 5)}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: RELIABILITY & RESILIENCE */}
        {activeTab === 'rel' && (
          <div>
            {renderSlider('Failure Rate (%)', 'errors', 0, 100, '%', 0)}
            {renderSelect('SLA Target (%)', 'availability', [
              { label: '99.0% (2 Nines)', value: '99.0' },
              { label: '99.9% (3 Nines)', value: '99.9' },
              { label: '99.99% (4 Nines)', value: '99.99' },
              { label: '99.999% (5 Nines)', value: '99.999' },
            ], '99.99')}
            {renderInput('Timeout (ms)', 'timeout', 'number', 100, 60000, 5000)}
            {renderInput('Max Retries', 'maxRetries', 'number', 0, 10, 3)}
            {renderCheckbox('Active Health Checks', 'healthCheck', true)}
            {renderCheckbox('Circuit Breaker Enabled', 'circuitBreakerEnabled', true)}
          </div>
        )}

        {/* TAB 3: NETWORK & GATEWAY */}
        {activeTab === 'net' && (
          <div>
            {renderInput('Connection Timeout (s)', 'connTimeout', 'number', 1, 7200, 3600)}
            {renderSelect('Protocol', 'protocol', [
              { label: 'HTTPS (REST / JSON)', value: 'HTTPS' },
              { label: 'HTTP/2 (Multiplexed)', value: 'HTTP/2' },
              { label: 'gRPC (Protobuf / Low Latency)', value: 'gRPC' },
              { label: 'WebSockets (Bidirectional)', value: 'WebSockets' },
              { label: 'TCP (Raw Socket)', value: 'TCP' },
              { label: 'UDP (Datagram)', value: 'UDP' },
            ], type === 'client' ? 'HTTPS' : 'HTTP/2')}
            {renderInput('Port', 'port', 'number', 1, 65535, defaultPort)}
            {renderCheckbox('Payload Compression (Gzip/Brotli)', 'compression', true)}
            {renderSelect('HTTP Version', 'httpVersion', [
              { label: 'HTTP/1.1 (Standard)', value: '1.1' },
              { label: 'HTTP/2 (Streaming/Multiplexing)', value: '2' },
              { label: 'HTTP/3 (QUIC / UDP)', value: '3' },
            ], '2')}
          </div>
        )}

        {/* TAB 4: SECURITY & COMPLIANCE */}
        {activeTab === 'sec' && (
          <div>
            {renderSelect('Auth Type', 'authType', [
              { label: 'NONE (Public / Internal)', value: 'NONE' },
              { label: 'JWT (OIDC / OAuth 2.0)', value: 'JWT' },
              { label: 'mTLS (Zero Trust Mutual TLS)', value: 'mTLS' },
              { label: 'API Key / Bearer Token', value: 'API_KEY' },
              { label: 'IAM Role-Based Access', value: 'IAM' },
            ], 'JWT')}
            {renderSelect('TLS / SSL Version', 'tlsVersion', [
              { label: 'TLS 1.3 (Modern / Recommended)', value: 'TLS1.3' },
              { label: 'TLS 1.2 (Legacy Enterprise)', value: 'TLS1.2' },
              { label: 'Disabled (Plaintext / Internal VPC)', value: 'NONE' },
            ], 'TLS1.3')}
            {renderCheckbox('Data Encryption at Rest (AES-256)', 'encryptionAtRest', true)}
            {renderCheckbox('WAF / DDoS Shield Active', 'wafEnabled', type === 'apiGateway' || type === 'firewall')}
            {renderCheckbox('Audit Logging Enabled', 'auditLogging', true)}
          </div>
        )}
      </div>
    </div>
  );
}
