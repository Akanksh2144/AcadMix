/**
 * System Design Arena — Comprehensive Component Registry
 *
 * Centralized registry of 131 system design components organized into the exact
 * 18 architectural categories:
 * CLIENT-SIDE, INFRASTRUCTURE, NETWORK, COMPUTE, STORAGE, DATA PLATFORM, AI/ML,
 * PAYMENTS, CACHE, QUEUE, SECURITY, PLATFORM, RELIABILITY, OBSERVABILITY, DSA, PATTERNS, LLD, EXTRAS.
 */

import {
  Users, Globe, CloudArrowDown, Scales, Desktop, Lightning,
  Database, Stack, HardDrive, Queue, Robot, ChartLineUp,
  PlugsConnected, ShieldCheck, ArrowsSplit, Cloud, Hexagon,
  Clock, Broadcast, ShareNetwork, Cpu, ChartBar, Compass,
  MagnifyingGlass, Buildings, FlowArrow, Skull, Waves,
  Megaphone, Brain, Table, Key, Vault, Gauge,
  TerminalWindow, Siren, ShieldPlus, DesktopTower,
  DeviceMobile, Laptop, Television, WifiHigh, CheckCircle,
  Code, TreeStructure, GitMerge, FileText, Lock, Shield,
  Keyhole, ShieldWarning, Pulse, Eye, Funnel, Hash,
  ListNumbers, Path, Circuitry, Cube, Crosshair, CurrencyCircleDollar,
  Receipt, Wallet, BugBeetle, ArrowClockwise, Heartbeat, Archive,
  type Icon
} from '@phosphor-icons/react';

export interface ComponentMetadata {
  type: string;
  label: string;
  category: string;
  icon: Icon;
  color: string;
  defaults: Record<string, any>;
  description?: string;
}

export interface PaletteSection {
  title: string;
  items: ComponentMetadata[];
}

export const PALETTE_SECTIONS: PaletteSection[] = [
  {
    title: 'CLIENT-SIDE',
    items: [
      { type: 'client', label: 'Web Browser / Users', category: 'CLIENT-SIDE', icon: Users, color: 'var(--accent-purple)', defaults: { label: 'Web Users', requestsPerSec: 1000, protocol: 'https' } },
      { type: 'singlePageApp', label: 'SPA (React / Vue)', category: 'CLIENT-SIDE', icon: Desktop, color: '#8B5CF6', defaults: { label: 'React SPA Client', requestsPerSec: 500, bundleSizeKb: 350 } },
      { type: 'mobileClient', label: 'Mobile App (iOS/Android)', category: 'CLIENT-SIDE', icon: DeviceMobile, color: '#A855F7', defaults: { label: 'Mobile Native App', requestsPerSec: 800, cellularLatencyMs: 45 } },
      { type: 'desktopApp', label: 'Desktop Client (Electron)', category: 'CLIENT-SIDE', icon: Laptop, color: '#6366F1', defaults: { label: 'Desktop Client', requestsPerSec: 200 } },
      { type: 'iotDevice', label: 'IoT Sensor / Edge', category: 'CLIENT-SIDE', icon: WifiHigh, color: '#10B981', defaults: { label: 'IoT Sensor Array', requestsPerSec: 5000, mqttProtocol: true } },
      { type: 'smartTV', label: 'Smart TV / Set-Top', category: 'CLIENT-SIDE', icon: Television, color: '#EC4899', defaults: { label: 'Smart TV Client', requestsPerSec: 300, streamingMode: true } },
      { type: 'serviceWorker', label: 'Service Worker / PWA', category: 'CLIENT-SIDE', icon: Cpu, color: '#06B6D4', defaults: { label: 'Browser Service Worker', offlineCacheRatio: 0.4 } },
      { type: 'graphqlClient', label: 'GraphQL Apollo Client', category: 'CLIENT-SIDE', icon: ShareNetwork, color: '#E10098', defaults: { label: 'Apollo Client', batchingEnabled: true } },
      { type: 'websocketClient', label: 'WebSocket Live Socket', category: 'CLIENT-SIDE', icon: Broadcast, color: '#3B82F6', defaults: { label: 'WebSocket Client', heartbeatSec: 15 } },
      { type: 'sseClient', label: 'SSE Event Subscriber', category: 'CLIENT-SIDE', icon: Waves, color: '#14B8A6', defaults: { label: 'EventSource Subscriber', autoReconnect: true } },
    ],
  },
  {
    title: 'INFRASTRUCTURE',
    items: [
      { type: 'dns', label: 'DNS / Anycast Route 53', category: 'INFRASTRUCTURE', icon: Globe, color: 'var(--accent-blue)', defaults: { label: 'DNS / Route53', ttl: 300, routingPolicy: 'latency-based' } },
      { type: 'cdn', label: 'CDN (CloudFront / Fastly)', category: 'INFRASTRUCTURE', icon: CloudArrowDown, color: 'var(--accent-teal)', defaults: { label: 'Global CDN Edge', cacheHitRatio: 0.88, edgeLatency: 10 } },
      { type: 'reverseProxy', label: 'Reverse Proxy (NGINX)', category: 'INFRASTRUCTURE', icon: ArrowsSplit, color: '#06B6D4', defaults: { label: 'NGINX Reverse Proxy', workerProcesses: 8, sslTermination: true } },
      { type: 'bastionHost', label: 'SSH Bastion Host', category: 'INFRASTRUCTURE', icon: DesktopTower, color: '#64748B', defaults: { label: 'SSH Bastion / Jump Box', auditLogging: true, mfaRequired: true } },
      { type: 'vpnGateway', label: 'VPN Direct Connect', category: 'INFRASTRUCTURE', icon: ShieldPlus, color: '#10B981', defaults: { label: 'IPsec VPN Gateway', bandwidthGbps: 10, encrypted: true } },
      { type: 'natGateway', label: 'NAT Gateway / Egress', category: 'INFRASTRUCTURE', icon: FlowArrow, color: '#64748B', defaults: { label: 'Managed NAT Gateway', maxConnections: 65535 } },
      { type: 'bareMetal', label: 'Dedicated Bare Metal', category: 'INFRASTRUCTURE', icon: HardDrive, color: '#475569', defaults: { label: 'Bare Metal Rack (64c/512GB)', cores: 64, ramGb: 512 } },
    ],
  },
  {
    title: 'NETWORK',
    items: [
      { type: 'loadBalancer', label: 'ALB Layer 7 Balancer', category: 'NETWORK', icon: Scales, color: 'var(--accent-orange)', defaults: { label: 'Application Load Balancer', algorithm: 'round-robin', sslOffload: true } },
      { type: 'networkLoadBalancer', label: 'NLB Layer 4 TCP Balancer', category: 'NETWORK', icon: Scales, color: '#F97316', defaults: { label: 'Network Load Balancer (L4)', throughputGbps: 40, ultraLowLatency: true } },
      { type: 'apiGateway', label: 'API Gateway (Kong / Envoy)', category: 'NETWORK', icon: PlugsConnected, color: '#3B82F6', defaults: { label: 'API Gateway', authCheck: true, rateLimit: 10000, latencyAdded: 4 } },
      { type: 'firewall', label: 'WAF / DDoS Shield', category: 'NETWORK', icon: ShieldCheck, color: '#EF4444', defaults: { label: 'Cloud Armor WAF', blockedRate: 0.04, latencyAdded: 2 } },
      { type: 'serviceMesh', label: 'Service Mesh (Istio)', category: 'NETWORK', icon: ShareNetwork, color: '#6366F1', defaults: { label: 'Istio Service Mesh', mtlsEnabled: true, retryPolicy: 'exponential' } },
      { type: 'ingressController', label: 'Kubernetes Ingress (Traefik)', category: 'NETWORK', icon: FlowArrow, color: '#2563EB', defaults: { label: 'K8s Ingress Controller', routingRules: 25 } },
      { type: 'egressProxy', label: 'Egress Filtering Proxy', category: 'NETWORK', icon: ShieldPlus, color: '#475569', defaults: { label: 'Squid Egress Proxy', domainWhitelist: true } },
      { type: 'bgpRouter', label: 'BGP Anycast Router', category: 'NETWORK', icon: Globe, color: '#0EA5E9', defaults: { label: 'BGP Anycast Router', convergenceMs: 15 } },
      { type: 'vpcPeering', label: 'VPC Peering / PrivateLink', category: 'NETWORK', icon: PlugsConnected, color: '#8B5CF6', defaults: { label: 'AWS PrivateLink Endpoint', privateIpRange: '10.0.0.0/16' } },
      { type: 'dnsResolver', label: 'Internal DNS CoreDNS', category: 'NETWORK', icon: TreeStructure, color: '#38BDF8', defaults: { label: 'CoreDNS Internal Resolver', cacheSize: 10000 } },
    ],
  },
  {
    title: 'COMPUTE',
    items: [
      { type: 'appServer', label: 'App Server / REST API', category: 'COMPUTE', icon: Desktop, color: 'var(--accent-blue)', defaults: { label: 'App Server Node', replicas: 2, maxThreads: 250, processingTime: 40 } },
      { type: 'workerPool', label: 'Async Worker Pool', category: 'COMPUTE', icon: Robot, color: 'var(--accent-purple)', defaults: { label: 'Celery / Sidekiq Pool', workers: 6, taskProcessingTime: 180 } },
      { type: 'serverless', label: 'AWS Lambda / Function', category: 'COMPUTE', icon: Cloud, color: '#F59E0B', defaults: { label: 'Serverless Function', coldStartMs: 120, memoryMb: 1024, processingTime: 25 } },
      { type: 'kubernetes', label: 'Kubernetes EKS Cluster', category: 'COMPUTE', icon: Hexagon, color: '#3B82F6', defaults: { label: 'K8s Cluster (EKS)', pods: 8, autoScaling: true, maxThreads: 800 } },
      { type: 'cronJob', label: 'Cron Airflow Scheduler', category: 'COMPUTE', icon: Clock, color: '#8B5CF6', defaults: { label: 'Cron / Airflow DAGs', intervalSec: 3600, batchSize: 2000 } },
      { type: 'websocketServer', label: 'WebSocket Gateway', category: 'COMPUTE', icon: Broadcast, color: '#10B981', defaults: { label: 'WebSocket Server Cluster', maxConnections: 100000, keepAlive: true } },
      { type: 'presenceServer', label: 'Presence & Status Server', category: 'COMPUTE', icon: Users, color: '#10B981', defaults: { label: 'Heartbeat Presence Service', activeSessions: 250000 } },
      { type: 'transcodingWorker', label: 'FFmpeg Video Transcoder', category: 'COMPUTE', icon: Waves, color: '#F97316', defaults: { label: 'Video Transcoding Workers', resolutions: ['4K', '1080p', '720p'] } },
      { type: 'syncService', label: 'Delta File Sync Engine', category: 'COMPUTE', icon: FlowArrow, color: '#06B6D4', defaults: { label: 'Rsync Delta Engine', blockChunkSizeKb: 4096 } },
      { type: 'searchCrawler', label: 'Web Crawler Fetcher Pool', category: 'COMPUTE', icon: MagnifyingGlass, color: '#EAB308', defaults: { label: 'Distributed Crawler Engine', concurrentFetchers: 150 } },
      { type: 'idGenerator', label: 'Snowflake ID Generator', category: 'COMPUTE', icon: Key, color: '#64748B', defaults: { label: 'Snowflake Ticket Server', bits: 64, throughputPerSec: 500000 } },
      { type: 'microservice', label: 'Domain Microservice', category: 'COMPUTE', icon: Cube, color: '#6366F1', defaults: { label: 'Order/User Microservice', replicas: 3, isolationLevel: 'high' } },
      { type: 'grpcService', label: 'High-Throughput gRPC Node', category: 'COMPUTE', icon: PlugsConnected, color: '#0D9488', defaults: { label: 'Internal gRPC Service', protobufSchema: true, processingTime: 8 } },
    ],
  },
  {
    title: 'STORAGE',
    items: [
      { type: 'objectStorage', label: 'AWS S3 Object Storage', category: 'STORAGE', icon: HardDrive, color: 'var(--ink-light)', defaults: { label: 'AWS S3 Bucket', durability: '99.999999999%', latency: 45 } },
      { type: 'blockStorage', label: 'NVMe Block Disk (EBS)', category: 'STORAGE', icon: HardDrive, color: '#475569', defaults: { label: 'EBS Provisioned IOPS Disk', iops: 16000, sizeGb: 1000 } },
      { type: 'fileSystem', label: 'Distributed File System (NFS)', category: 'STORAGE', icon: Stack, color: '#0284C7', defaults: { label: 'AWS EFS / NFS Share', posixCompliant: true, readThroughputMbSec: 500 } },
      { type: 'blobStorage', label: 'Azure Blob / Ceph Cluster', category: 'STORAGE', icon: Cloud, color: '#2563EB', defaults: { label: 'Ceph Distributed Store', replicationFactor: 3 } },
      { type: 'coldStorage', label: 'Glacier Archival Storage', category: 'STORAGE', icon: Archive, color: '#64748B', defaults: { label: 'Glacier Deep Archive', retrievalTimeHours: 12, costPerGbMonth: 0.001 } },
      { type: 'nvmePool', label: 'Local NVMe Ephemeral Scratch', category: 'STORAGE', icon: Cpu, color: '#EF4444', defaults: { label: 'NVMe Scratch Raid 0', iops: 100000, latencyMs: 0.5 } },
    ],
  },
  {
    title: 'DATA PLATFORM',
    items: [
      { type: 'sqlDatabase', label: 'PostgreSQL / MySQL SQL DB', category: 'DATA PLATFORM', icon: Database, color: 'var(--accent-green)', defaults: { label: 'PostgreSQL Primary', readReplicas: 1, indexed: true, sharded: false } },
      { type: 'nosqlDatabase', label: 'DynamoDB / MongoDB NoSQL', category: 'DATA PLATFORM', icon: Stack, color: 'var(--accent-green)', defaults: { label: 'DynamoDB Table', consistencyLevel: 'eventual', partitionKey: 'user_id' } },
      { type: 'timeSeriesDb', label: 'Prometheus / Influx TimeSeries', category: 'DATA PLATFORM', icon: ChartBar, color: '#10B981', defaults: { label: 'InfluxDB Time-Series', retentionDays: 90, writeThroughput: 80000 } },
      { type: 'graphDb', label: 'Neo4j Graph Database', category: 'DATA PLATFORM', icon: ShareNetwork, color: '#8B5CF6', defaults: { label: 'Neo4j Graph Store', maxHops: 3, indexType: 'adjacency-list' } },
      { type: 'vectorDb', label: 'Pinecone / Milvus Vector DB', category: 'DATA PLATFORM', icon: Compass, color: '#EC4899', defaults: { label: 'Pinecone Vector Store', dimensions: 1536, indexType: 'HNSW', latency: 12 } },
      { type: 'searchEngine', label: 'Elasticsearch / OpenSearch Index', category: 'DATA PLATFORM', icon: MagnifyingGlass, color: '#EAB308', defaults: { label: 'Elasticsearch Cluster', shards: 10, replicas: 1 } },
      { type: 'dataWarehouse', label: 'Snowflake / BigQuery Warehouse', category: 'DATA PLATFORM', icon: Buildings, color: '#3B82F6', defaults: { label: 'Snowflake Warehouse', computeNodes: 16, columnar: true } },
      { type: 'spatialIndex', label: 'Spatial DB (Geohash / PostGIS)', category: 'DATA PLATFORM', icon: Compass, color: '#10B981', defaults: { label: 'PostGIS Spatial Store', precision: 7, rTreeIndexed: true } },
      { type: 'dataLake', label: 'Delta Lake / Apache Iceberg', category: 'DATA PLATFORM', icon: Waves, color: '#06B6D4', defaults: { label: 'Iceberg Data Lake', parquetFormat: true, schemaEvolution: true } },
      { type: 'olapEngine', label: 'ClickHouse Real-time OLAP', category: 'DATA PLATFORM', icon: ChartLineUp, color: '#F59E0B', defaults: { label: 'ClickHouse OLAP Cluster', scanSpeedRowsPerSec: 10000000 } },
      { type: 'etlPipeline', label: 'Airbyte / Fivetran ETL Pipeline', category: 'DATA PLATFORM', icon: FlowArrow, color: '#A855F7', defaults: { label: 'Fivetran CDC Engine', syncIntervalMin: 15 } },
    ],
  },
  {
    title: 'AI/ML',
    items: [
      { type: 'llmGateway', label: 'LLM Gateway (Vertex AI/OpenAI)', category: 'AI/ML', icon: Brain, color: '#EC4899', defaults: { label: 'Vertex AI Model Router', model: 'gemini-1.5-pro / gpt-4o', tps: 60, latency: 420 } },
      { type: 'modelServing', label: 'GPU Inference Server (Triton/vLLM)', category: 'AI/ML', icon: Cpu, color: '#8B5CF6', defaults: { label: 'Triton GPU Cluster (H100)', gpus: 8, batchSize: 64, latency: 95 } },
      { type: 'featureStore', label: 'Feature Store (Feast / Hopsworks)', category: 'AI/ML', icon: Table, color: '#10B981', defaults: { label: 'Feast Feature Store', lowLatencyStore: 'redis', offlineStore: 'bigquery' } },
      { type: 'aiAgent', label: 'Autonomous AI Agent (LangChain)', category: 'AI/ML', icon: Robot, color: '#6366F1', defaults: { label: 'LangChain Agent Worker', maxSteps: 8, toolCalling: true } },
      { type: 'embeddingEngine', label: 'Vector Embedding Generator', category: 'AI/ML', icon: Hash, color: '#38BDF8', defaults: { label: 'Embedding Worker (text-embedding-3)', batchSize: 100 } },
      { type: 'modelRegistry', label: 'MLflow Model Registry Store', category: 'AI/ML', icon: Archive, color: '#64748B', defaults: { label: 'MLflow Model Registry', versionControl: true } },
      { type: 'fineTuningWorker', label: 'LoRA Fine-Tuning GPU Node', category: 'AI/ML', icon: Lightning, color: '#F97316', defaults: { label: 'LoRA Training Node', gpuType: 'A100-80GB', checkpointIntervalHours: 4 } },
    ],
  },
  {
    title: 'PAYMENTS',
    items: [
      { type: 'paymentGateway', label: 'Stripe / PayPal Payment API', category: 'PAYMENTS', icon: CurrencyCircleDollar, color: '#10B981', defaults: { label: 'Stripe / Adyen Gateway', idempotencyCheck: true, pciDssCompliant: true } },
      { type: 'ledgerDatabase', label: 'Double-Entry Immutable Ledger DB', category: 'PAYMENTS', icon: Receipt, color: '#059669', defaults: { label: 'Immutable Ledger Store', acidStrict: true, appendOnly: true } },
      { type: 'reconciliationEngine', label: 'Daily Audit & Reconciliation', category: 'PAYMENTS', icon: Scales, color: '#8B5CF6', defaults: { label: 'Reconciliation Audit Engine', batchCronHour: 2, discrepancyThreshold: 0.0001 } },
      { type: 'fraudDetection', label: 'Real-Time Fraud Scoring ML Engine', category: 'PAYMENTS', icon: ShieldWarning, color: '#EF4444', defaults: { label: 'Fraud Engine (Sift/Stripe Radar)', riskThreshold: 85, latencyMs: 35 } },
    ],
  },
  {
    title: 'CACHE',
    items: [
      { type: 'cache', label: 'Redis Cluster (Cache-Aside)', category: 'CACHE', icon: Lightning, color: 'var(--accent-red)', defaults: { label: 'Redis Cache Cluster', hitRatio: 0.82, pattern: 'cache-aside', ttlSec: 300 } },
      { type: 'memcached', label: 'Memcached Pool', category: 'CACHE', icon: Cpu, color: '#EF4444', defaults: { label: 'Memcached High-Concurrency Pool', hitRatio: 0.85, threads: 16 } },
      { type: 'cdnEdgeCache', label: 'Cloudflare Workers KV Edge Cache', category: 'CACHE', icon: CloudArrowDown, color: '#06B6D4', defaults: { label: 'Cloudflare KV Edge Cache', hitRatio: 0.92, edgeLatencyMs: 5 } },
      { type: 'localCache', label: 'In-Memory Local Cache (Guava)', category: 'CACHE', icon: HardDrive, color: '#F59E0B', defaults: { label: 'Local Guava / Caffeine Cache', hitRatio: 0.75, latencyMs: 0.1 } },
      { type: 'leaderboardStore', label: 'Redis ZSET Leaderboard Engine', category: 'CACHE', icon: ChartLineUp, color: '#EC4899', defaults: { label: 'Redis ZSET Leaderboard Cache', maxRankings: 5000000 } },
      { type: 'bufferCache', label: 'Write-Back Buffer Cache Engine', category: 'CACHE', icon: Stack, color: '#A855F7', defaults: { label: 'Write-Back Buffer Cache', flushIntervalMs: 500 } },
    ],
  },
  {
    title: 'QUEUE',
    items: [
      { type: 'messageQueue', label: 'Apache Kafka Broker', category: 'QUEUE', icon: Queue, color: 'var(--accent-orange)', defaults: { label: 'Kafka Event Log', partitions: 8, consumerGroups: 2 } },
      { type: 'eventBus', label: 'AWS EventBridge / RabbitMQ Bus', category: 'QUEUE', icon: FlowArrow, color: '#F97316', defaults: { label: 'EventBridge Topic Bus', schemaRegistry: true } },
      { type: 'deadLetterQueue', label: 'Dead Letter Queue (DLQ Buffer)', category: 'QUEUE', icon: Skull, color: '#EF4444', defaults: { label: 'DLQ / Failed Message Store', retentionHours: 336, maxRetries: 5 } },
      { type: 'streamProcessor', label: 'Apache Flink / Spark Stream', category: 'QUEUE', icon: Waves, color: '#06B6D4', defaults: { label: 'Flink Streaming Processor', windowSec: 60, exactlyOnce: true } },
      { type: 'pubsub', label: 'Google Pub/Sub / AWS SNS Topic', category: 'QUEUE', icon: Megaphone, color: '#A855F7', defaults: { label: 'Pub/Sub Fanout Topic', subscribers: 5 } },
      { type: 'taskQueue', label: 'Redis BullMQ / AWS SQS Queue', category: 'QUEUE', icon: ListNumbers, color: '#D97706', defaults: { label: 'BullMQ Task Queue', concurrency: 20 } },
      { type: 'priorityQueue', label: 'Weighted Priority Queue Engine', category: 'QUEUE', icon: Funnel, color: '#DC2626', defaults: { label: 'Priority Dispatch Queue', priorityBuckets: 3 } },
    ],
  },
  {
    title: 'SECURITY',
    items: [
      { type: 'authService', label: 'Auth0 / Keycloak SSO Provider', category: 'SECURITY', icon: Key, color: '#EAB308', defaults: { label: 'Auth0 / Keycloak SSO', jwtExpirySec: 3600, mfaEnabled: true } },
      { type: 'secretManager', label: 'HashiCorp Vault / AWS Secrets', category: 'SECURITY', icon: Vault, color: '#64748B', defaults: { label: 'HashiCorp Vault Engine', autoRotateDays: 30 } },
      { type: 'rateLimiter', label: 'Token Bucket Rate Limiter', category: 'SECURITY', icon: Gauge, color: '#F97316', defaults: { label: 'Token Bucket Rate Limiter', maxQpsPerUser: 100 } },
      { type: 'certificateAuthority', label: 'PKI / TLS CA Certificate Node', category: 'SECURITY', icon: ShieldCheck, color: '#10B981', defaults: { label: 'Let\'s Encrypt TLS CA', autoRenewalDays: 60 } },
      { type: 'hsmModule', label: 'Hardware Security Module (HSM)', category: 'SECURITY', icon: Keyhole, color: '#475569', defaults: { label: 'Cloud HSM Key Vault', fips140Level: 3 } },
      { type: 'siemEngine', label: 'SIEM Correlation Engine', category: 'SECURITY', icon: BugBeetle, color: '#EF4444', defaults: { label: 'SIEM Threat Correlator', realTimeAlerts: true } },
      { type: 'zeroTrustProxy', label: 'Zero Trust BeyondCorp Proxy', category: 'SECURITY', icon: Shield, color: '#6366F1', defaults: { label: 'Cloudflare Zero Trust Proxy', devicePostureCheck: true } },
    ],
  },
  {
    title: 'PLATFORM',
    items: [
      { type: 'serviceRegistry', label: 'Consul / Eureka Service Discovery', category: 'PLATFORM', icon: TreeStructure, color: '#8B5CF6', defaults: { label: 'Consul Service Discovery', heartbeatCheckSec: 10 } },
      { type: 'configServer', label: 'Spring Cloud Config / Etcd KV', category: 'PLATFORM', icon: SlidersHorizontal, color: '#06B6D4', defaults: { label: 'Etcd Distributed Config Store', watchEnabled: true } },
      { type: 'featureFlags', label: 'LaunchDarkly Feature Flag Node', category: 'PLATFORM', icon: GitMerge, color: '#10B981', defaults: { label: 'LaunchDarkly Flag Engine', targetingRules: 15 } },
      { type: 'portalGateway', label: 'Developer Portal / Backstage', category: 'PLATFORM', icon: Desktop, color: '#3B82F6', defaults: { label: 'Backstage Developer Portal', apiCatalogSync: true } },
      { type: 'tenantRouter', label: 'Multi-Tenant Tenant Resolver', category: 'PLATFORM', icon: ArrowsSplit, color: '#A855F7', defaults: { label: 'Tenant Middleware Router', headerResolution: 'X-Tenant' } },
    ],
  },
  {
    title: 'RELIABILITY',
    items: [
      { type: 'circuitBreaker', label: 'Hystrix / Resilience4j Breaker', category: 'RELIABILITY', icon: Circuitry, color: '#EF4444', defaults: { label: 'Resilience4j Circuit Breaker', failureThresholdPct: 50, openWindowSec: 30 } },
      { type: 'chaosMonkey', label: 'Chaos Monkey Fault Injector', category: 'RELIABILITY', icon: Skull, color: '#D97706', defaults: { label: 'Gremlin Chaos Injector', killRatePct: 5 } },
      { type: 'healthChecker', label: 'Active Probe Heartbeat Monitor', category: 'RELIABILITY', icon: Heartbeat, color: '#10B981', defaults: { label: 'Active Health Probe Node', intervalSec: 5, timeoutMs: 1000 } },
      { type: 'backupService', label: 'Automated Snapshot & DR Node', category: 'RELIABILITY', icon: ArrowClockwise, color: '#3B82F6', defaults: { label: 'Snapshot DR Backup Node', retentionDays: 30, rpoMin: 15 } },
      { type: 'failoverController', label: 'Multi-Region Failover Router', category: 'RELIABILITY', icon: ArrowsSplit, color: '#F59E0B', defaults: { label: 'Automatic Failover Controller', healthCheckFailuresToSwitch: 3 } },
      { type: 'consistentHashRing', label: 'Consistent Hash Ring Router', category: 'RELIABILITY', icon: Hexagon, color: '#8B5CF6', defaults: { label: 'Consistent Hash Ring', virtualNodes: 150, replicationFactor: 3 } },
    ],
  },
  {
    title: 'OBSERVABILITY',
    items: [
      { type: 'metricsDashboard', label: 'Grafana Metrics Dashboard', category: 'OBSERVABILITY', icon: ChartLineUp, color: 'var(--accent-pink)', defaults: { label: 'Grafana Observability Dashboard' } },
      { type: 'logAggregator', label: 'Datadog / Splunk Log Aggregator', category: 'OBSERVABILITY', icon: TerminalWindow, color: '#3B82F6', defaults: { label: 'Datadog Log Aggregator', logVolumeGbDay: 800, retentionDays: 14 } },
      { type: 'alertManager', label: 'PagerDuty / Opsgenie Alert Node', category: 'OBSERVABILITY', icon: Siren, color: '#EF4444', defaults: { label: 'PagerDuty Alert Manager', escalationTimeoutMin: 15 } },
      { type: 'distributedTracer', label: 'Jaeger / Zipkin Tracer Node', category: 'OBSERVABILITY', icon: Path, color: '#10B981', defaults: { label: 'Jaeger Distributed Tracer', samplingRatePct: 10 } },
      { type: 'profilerNode', label: 'Continuous Profiler (Pyroscope)', category: 'OBSERVABILITY', icon: Pulse, color: '#6366F1', defaults: { label: 'Pyroscope Continuous Profiler', cpuProfiling: true, heapProfiling: true } },
    ],
  },
  {
    title: 'DSA',
    items: [
      { type: 'bloomFilter', label: 'Bloom Filter Membership Node', category: 'DSA', icon: Funnel, color: '#8B5CF6', defaults: { label: 'Probabilistic Bloom Filter', falsePositiveRate: 0.01, capacityBits: 10000000 } },
      { type: 'hyperLogLog', label: 'HyperLogLog Cardinality Node', category: 'DSA', icon: Hash, color: '#06B6D4', defaults: { label: 'HyperLogLog Estimator', standardErrorPct: 0.81 } },
      { type: 'lruCacheNode', label: 'LRU / LFU Eviction Structure', category: 'DSA', icon: Stack, color: '#F59E0B', defaults: { label: 'LRU Eviction Structure', capacityItems: 100000 } },
      { type: 'merkleTree', label: 'Merkle Tree Crypto Verifier', category: 'DSA', icon: TreeStructure, color: '#10B981', defaults: { label: 'Merkle Tree Hash Verifier', sha256Leafs: true } },
      { type: 'skipList', label: 'Concurrent Skip List Index', category: 'DSA', icon: ListNumbers, color: '#EC4899', defaults: { label: 'Concurrent Skip List Store', maxLevels: 16 } },
      { type: 'quadTree', label: 'Geospatial Quadtree Node', category: 'DSA', icon: Compass, color: '#14B8A6', defaults: { label: 'Quadtree Spatial Partition', maxLeafPoints: 50 } },
      { type: 'consistentHashNode', label: 'Consistent Hash Virtual Ring Structure', category: 'DSA', icon: Hexagon, color: '#A855F7', defaults: { label: 'Hash Ring Structure Node', vNodesPerServer: 200 } },
    ],
  },
  {
    title: 'PATTERNS',
    items: [
      { type: 'cqrsRouter', label: 'CQRS Command/Query Split Router', category: 'PATTERNS', icon: ArrowsSplit, color: '#3B82F6', defaults: { label: 'CQRS Command/Query Splitter', syncReplication: false } },
      { type: 'eventSourcing', label: 'Event Sourcing Append Store', category: 'PATTERNS', icon: FileText, color: '#10B981', defaults: { label: 'Event Sourcing Store', snapshotEveryEvents: 100 } },
      { type: 'sagaOrchestrator', label: 'Saga Transaction Orchestrator', category: 'PATTERNS', icon: GitMerge, color: '#F97316', defaults: { label: 'Distributed Saga Orchestrator', compensationRollback: true } },
      { type: 'sidecarContainer', label: 'Kubernetes Sidecar Proxy Container', category: 'PATTERNS', icon: Cube, color: '#6366F1', defaults: { label: 'Envoy Sidecar Container', logInjection: true } },
      { type: 'stranglerFig', label: 'Strangler Fig Migration Gateway', category: 'PATTERNS', icon: Path, color: '#EAB308', defaults: { label: 'Strangler Fig Gateway', legacyTrafficPct: 30 } },
      { type: 'shardingRouter', label: 'Database Sharding Router Node', category: 'PATTERNS', icon: FlowArrow, color: '#0EA5E9', defaults: { label: 'Scatter-Gather Sharding Router', shardKey: 'tenant_id' } },
    ],
  },
  {
    title: 'LLD',
    items: [
      { type: 'factoryPattern', label: 'Abstract Factory Creation Node', category: 'LLD', icon: Cube, color: '#8B5CF6', defaults: { label: 'Abstract Factory Node', objectCreationPool: 500 } },
      { type: 'singletonService', label: 'Singleton Global State Node', category: 'LLD', icon: CheckCircle, color: '#10B981', defaults: { label: 'Singleton Service Manager', threadSafe: true } },
      { type: 'observerBroker', label: 'Observer Subject/Listener Node', category: 'LLD', icon: Eye, color: '#06B6D4', defaults: { label: 'Observer Event Broker', asyncNotification: true } },
      { type: 'strategyRouter', label: 'Strategy Algorithm Selector', category: 'LLD', icon: GitMerge, color: '#F59E0B', defaults: { label: 'Strategy Algorithm Router', defaultStrategy: 'fastest-path' } },
      { type: 'stateMachine', label: 'Finite State Machine Engine', category: 'LLD', icon: Circuitry, color: '#EF4444', defaults: { label: 'Finite State Machine Workflow', strictTransitions: true } },
      { type: 'commandBus', label: 'Command Pattern Dispatcher', category: 'LLD', icon: FlowArrow, color: '#6366F1', defaults: { label: 'Command Dispatcher Bus', undoSupported: true } },
    ],
  },
  {
    title: 'EXTRAS',
    items: [
      { type: 'pushGateway', label: 'APNS / FCM Push Gateway', category: 'EXTRAS', icon: Broadcast, color: '#EC4899', defaults: { label: 'APNS / FCM Push Gateway', batchSize: 1000, retryExponential: true } },
      { type: 'emailSmsService', label: 'Twilio / SES Email & SMS Gateway', category: 'EXTRAS', icon: ShareNetwork, color: '#8B5CF6', defaults: { label: 'Twilio / AWS SES Gateway', ratePerSec: 500 } },
      { type: 'externalApi', label: 'Third-Party Partner Webhook / API', category: 'EXTRAS', icon: PlugsConnected, color: '#64748B', defaults: { label: 'Third-Party Partner API', timeoutMs: 3000 } },
      { type: 'webhookReceiver', label: 'Inbound Webhook Verification Node', category: 'EXTRAS', icon: CheckCircle, color: '#10B981', defaults: { label: 'Inbound Webhook Receiver', hmacVerification: true } },
      { type: 'mockServer', label: 'WireMock Sandbox Test Double', category: 'EXTRAS', icon: Code, color: '#A855F7', defaults: { label: 'WireMock Sandbox Node', simulatedLatencyMs: 50 } },
      { type: 'legacyMainframe', label: 'Legacy AS/400 COBOL Mainframe', category: 'EXTRAS', icon: DesktopTower, color: '#475569', defaults: { label: 'Legacy AS/400 Mainframe', maxConcurrentTransactions: 50, latencyMs: 800 } },
      { type: 'blockchainNode', label: 'Ethereum / Hyperledger Smart Node', category: 'EXTRAS', icon: Cube, color: '#F59E0B', defaults: { label: 'Ethereum RPC Node', blockTimeSec: 12, consensus: 'PoS' } },
      { type: 'captchaService', label: 'Cloudflare Turnstile CAPTCHA Node', category: 'EXTRAS', icon: ShieldCheck, color: '#14B8A6', defaults: { label: 'Turnstile CAPTCHA Verifier', botDetectionPct: 99.5 } },
    ],
  },
];

// Flat lookup map by node type
export const COMPONENT_MAP: Record<string, ComponentMetadata> = {};
for (const section of PALETTE_SECTIONS) {
  for (const item of section.items) {
    COMPONENT_MAP[item.type] = item;
  }
}
