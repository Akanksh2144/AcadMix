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
  SlidersHorizontal, type Icon
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
      { type: 'chromeExtension', label: 'Chrome / Browser Extension Client', category: 'CLIENT-SIDE', icon: Code, color: '#F59E0B', defaults: { label: 'Browser Extension Client', backgroundSync: true } },
      { type: 'cliClient', label: 'Command Line (CLI / Terminal) Tool', category: 'CLIENT-SIDE', icon: TerminalWindow, color: '#475569', defaults: { label: 'Terminal CLI Client', batchOutput: true } },
      { type: 'wearableClient', label: 'Apple Watch / Wearable IoT App', category: 'CLIENT-SIDE', icon: Heartbeat, color: '#EF4444', defaults: { label: 'Wearable Health App', syncIntervalSec: 60 } },
      { type: 'gameConsole', label: 'Xbox / PlayStation Game Console Client', category: 'CLIENT-SIDE', icon: Crosshair, color: '#10B981', defaults: { label: 'Game Console Client', lowLatencyUDP: true } },
      { type: 'embeddedSystem', label: 'Embedded Firmware / RTOS Client', category: 'CLIENT-SIDE', icon: Circuitry, color: '#0284C7', defaults: { label: 'RTOS Embedded Client', telemetrySec: 10 } },
      { type: 'botClient', label: 'Automated Script / Scraper Bot', category: 'CLIENT-SIDE', icon: Robot, color: '#D97706', defaults: { label: 'Automated Scraper Bot', proxyRotation: true } },
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
      { type: 'globalAnycast', label: 'Global Anycast Routing Edge', category: 'INFRASTRUCTURE', icon: Globe, color: '#38BDF8', defaults: { label: 'Anycast Routing PoP', convergenceMs: 8 } },
      { type: 'transitGateway', label: 'AWS Transit Gateway / Cloud Router', category: 'INFRASTRUCTURE', icon: TreeStructure, color: '#8B5CF6', defaults: { label: 'Transit Cloud Router', bandwidthGbps: 50 } },
      { type: 'edgeComputing', label: '5G / Local Edge Computing Node', category: 'INFRASTRUCTURE', icon: WifiHigh, color: '#10B981', defaults: { label: '5G Edge Compute PoP', ultraLowLatencyMs: 3 } },
      { type: 'privateCloud', label: 'On-Premises VMware / Private Cloud', category: 'INFRASTRUCTURE', icon: Buildings, color: '#64748B', defaults: { label: 'Private Cloud Data Center', isolatedVLAN: true } },
      { type: 'hybridConnector', label: 'AWS Outposts / Anthos Hybrid Node', category: 'INFRASTRUCTURE', icon: PlugsConnected, color: '#0EA5E9', defaults: { label: 'Hybrid Cloud Connector', latencyMs: 12 } },
      { type: 'colocationRack', label: 'Carrier-Neutral Colocation Data Center Rack', category: 'INFRASTRUCTURE', icon: Stack, color: '#475569', defaults: { label: 'Tier-4 Colocation Rack', dualPowerFeed: true } },
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
      { type: 'sdwanRouter', label: 'SD-WAN Software-Defined Overlay Router', category: 'NETWORK', icon: Circuitry, color: '#06B6D4', defaults: { label: 'SD-WAN Overlay Router', dynamicQoS: true } },
      { type: 'mTLSProxy', label: 'Mutual TLS (mTLS) Encryption Enforcer Proxy', category: 'NETWORK', icon: Lock, color: '#10B981', defaults: { label: 'mTLS Enforcer Proxy', cipherSuite: 'AES-GCM-256' } },
      { type: 'ddosScrubber', label: 'Scrubbing Center / BGP Blackhole Shield', category: 'NETWORK', icon: ShieldWarning, color: '#DC2626', defaults: { label: 'DDoS Scrubbing Center', mitigationGbps: 1000 } },
      { type: 'packetSniffer', label: 'Wireshark / eBPF Packet Mirror & Tap Node', category: 'NETWORK', icon: Eye, color: '#64748B', defaults: { label: 'eBPF Packet Mirror', samplingRatePct: 100 } },
      { type: 'greTunnel', label: 'GRE Overlay / IPsec VPN Tunnel Node', category: 'NETWORK', icon: Path, color: '#8B5CF6', defaults: { label: 'IPsec GRE Tunnel', overheadBytes: 24 } },
      { type: 'internalGateway', label: 'Internal Private API Gateway / Router', category: 'NETWORK', icon: ArrowsSplit, color: '#0284C7', defaults: { label: 'Private API Gateway', vpcScope: true } },
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
      { type: 'gpuCluster', label: 'High-Performance GPU Training / Compute Pod', category: 'COMPUTE', icon: Cpu, color: '#A855F7', defaults: { label: 'H100/A100 GPU Pod', gpus: 8, vramGb: 80 } },
      { type: 'batchProcessor', label: 'High-Volume Nightly Batch Engine (AWS Batch)', category: 'COMPUTE', icon: Stack, color: '#475569', defaults: { label: 'AWS Batch Processing Engine', jobQueueSize: 5000 } },
      { type: 'actorEngine', label: 'Akka / Orleans Distributed Actor Cluster', category: 'COMPUTE', icon: TreeStructure, color: '#E10098', defaults: { label: 'Akka Distributed Actor Cluster', activeActors: 1000000 } },
      { type: 'virtualMachine', label: 'EC2 / GCE Virtual Machine Instance', category: 'COMPUTE', icon: DesktopTower, color: '#3B82F6', defaults: { label: 'EC2 Dedicated VM Instance', vCpu: 16, ramGb: 64 } },
      { type: 'spotInstancePool', label: 'Ephemeral Preemptible Spot Instance Fleet', category: 'COMPUTE', icon: Lightning, color: '#F59E0B', defaults: { label: 'Preemptible Spot Fleet', costSavingsPct: 70 } },
      { type: 'edgeWorkerPool', label: 'Cloudflare Workers / Fastly Compute@Edge Engine', category: 'COMPUTE', icon: CloudArrowDown, color: '#06B6D4', defaults: { label: 'Edge Worker Compute Engine', executionTimeoutMs: 50 } },
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
      { type: 'glacierVault', label: 'Immutable WORM Archival Vault', category: 'STORAGE', icon: Lock, color: '#475569', defaults: { label: 'WORM Immutable Storage Vault', complianceMode: true } },
      { type: 'sanStorage', label: 'Fibre Channel SAN Storage Array', category: 'STORAGE', icon: HardDrive, color: '#0EA5E9', defaults: { label: 'Fibre Channel SAN Array', throughputGbps: 32 } },
      { type: 'distributedCeph', label: 'Ceph / GlusterFS Distributed POSIX Cluster', category: 'STORAGE', icon: Stack, color: '#14B8A6', defaults: { label: 'Ceph POSIX Store', osdCount: 24 } },
      { type: 'ephemeralRamdisk', label: 'Ultra-Low Latency RAMDisk tmpfs', category: 'STORAGE', icon: Lightning, color: '#EC4899', defaults: { label: 'tmpfs RAMDisk Store', latencyMs: 0.05 } },
      { type: 'coldTapeLibrary', label: 'Magnetic Tape Deep Offsite Storage Library', category: 'STORAGE', icon: Archive, color: '#64748B', defaults: { label: 'Magnetic Tape Library Store', capacityPb: 50 } },
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
      { type: 'cockroachDb', label: 'CockroachDB / Spanner Distributed NewSQL DB', category: 'DATA PLATFORM', icon: Database, color: '#2563EB', defaults: { label: 'Google Spanner / CockroachDB', multiRegionConsensus: 'raft' } },
      { type: 'cassandraRing', label: 'Apache Cassandra Wide-Column Ring Store', category: 'DATA PLATFORM', icon: Hexagon, color: '#059669', defaults: { label: 'Cassandra Ring Cluster', replicationFactor: 3, writeConsistency: 'LOCAL_QUORUM' } },
      { type: 'redisGraph', label: 'Graph / In-Memory Relationship Store', category: 'DATA PLATFORM', icon: ShareNetwork, color: '#DC2626', defaults: { label: 'RedisGraph In-Memory Store', traversalSpeedMs: 1 } },
      { type: 'prestoEngine', label: 'Presto / Trino Distributed SQL Query Engine', category: 'DATA PLATFORM', icon: Table, color: '#8B5CF6', defaults: { label: 'Presto Federated SQL Engine', concurrentQueries: 100 } },
      { type: 'cdcConnector', label: 'Debezium / Maxwell CDC Binlog Tailer', category: 'DATA PLATFORM', icon: Pulse, color: '#EAB308', defaults: { label: 'Debezium CDC Binlog Tailer', latencyMs: 15 } },
      { type: 'lakehouseEngine', label: 'Databricks Delta / Apache Hudi Lakehouse Store', category: 'DATA PLATFORM', icon: Buildings, color: '#0284C7', defaults: { label: 'Databricks Delta Lakehouse', ACIDCompliant: true } },
      { type: 'columnarStore', label: 'Apache Druid / Pinot Real-time Columnar Engine', category: 'DATA PLATFORM', icon: ChartBar, color: '#14B8A6', defaults: { label: 'Apache Druid Columnar Store', ingestionRowsPerSec: 500000 } },
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
      { type: 'ragRetriever', label: 'RAG Knowledge Base Retrieval Pipeline', category: 'AI/ML', icon: MagnifyingGlass, color: '#A855F7', defaults: { label: 'RAG Hybrid Retriever', topK: 5, rerankModel: 'cohere-v3' } },
      { type: 'vectorQuantizer', label: 'Product Quantization Vector Compactor', category: 'AI/ML', icon: Funnel, color: '#06B6D4', defaults: { label: 'PQ Vector Compactor Node', compressionRatio: 8 } },
      { type: 'guardrailProxy', label: 'NeMo Guardrails LLM Safety & PII Filter', category: 'AI/ML', icon: ShieldCheck, color: '#EF4444', defaults: { label: 'NeMo Safety Guardrail Node', piiMasking: true } },
      { type: 'rlhfRewardServer', label: 'RLHF Reward Model & Evaluation Worker', category: 'AI/ML', icon: Scales, color: '#10B981', defaults: { label: 'RLHF Reward Evaluator Node', latencyMs: 110 } },
      { type: 'distillationNode', label: 'Teacher-to-Student Model Distillation Node', category: 'AI/ML', icon: ArrowsSplit, color: '#EAB308', defaults: { label: 'Model Distillation Pipeline', studentModelSize: '7B' } },
      { type: 'multimodalEmbedder', label: 'CLIP / Whisper Multimodal Embedding Worker', category: 'AI/ML', icon: Eye, color: '#EC4899', defaults: { label: 'CLIP Multimodal Embedder', modalities: ['image', 'audio', 'text'] } },
    ],
  },
  {
    title: 'PAYMENTS',
    items: [
      { type: 'paymentGateway', label: 'Stripe / PayPal Payment API', category: 'PAYMENTS', icon: CurrencyCircleDollar, color: '#10B981', defaults: { label: 'Stripe / Adyen Gateway', idempotencyCheck: true, pciDssCompliant: true } },
      { type: 'ledgerDatabase', label: 'Double-Entry Immutable Ledger DB', category: 'PAYMENTS', icon: Receipt, color: '#059669', defaults: { label: 'Immutable Ledger Store', acidStrict: true, appendOnly: true } },
      { type: 'reconciliationEngine', label: 'Daily Audit & Reconciliation', category: 'PAYMENTS', icon: Scales, color: '#8B5CF6', defaults: { label: 'Reconciliation Audit Engine', batchCronHour: 2, discrepancyThreshold: 0.0001 } },
      { type: 'fraudDetection', label: 'Real-Time Fraud Scoring ML Engine', category: 'PAYMENTS', icon: ShieldWarning, color: '#EF4444', defaults: { label: 'Fraud Engine (Sift/Stripe Radar)', riskThreshold: 85, latencyMs: 35 } },
      { type: 'pciEnclave', label: 'PCI-DSS Compliant Card Tokenization Enclave', category: 'PAYMENTS', icon: Vault, color: '#475569', defaults: { label: 'PCI Tokenization Enclave', hsmBacked: true } },
      { type: 'swiftGateway', label: 'SWIFT / SEPA Interbank Wire Transfer Gateway', category: 'PAYMENTS', icon: Globe, color: '#2563EB', defaults: { label: 'SWIFT Interbank Gateway', settlementDays: 1 } },
      { type: 'cryptoEscrow', label: 'Multi-Sig Smart Contract Escrow Vault', category: 'PAYMENTS', icon: Lock, color: '#F59E0B', defaults: { label: 'Multi-Sig Escrow Smart Vault', requiredSignatures: 3 } },
      { type: 'billingEngine', label: 'Recurly / Zuora Usage-Based Billing Engine', category: 'PAYMENTS', icon: Receipt, color: '#14B8A6', defaults: { label: 'Zuora Subscription Billing Engine', prorationSupported: true } },
      { type: 'chargebackResolver', label: 'Dispute & Chargeback Mediation Workflow Node', category: 'PAYMENTS', icon: Scales, color: '#EF4444', defaults: { label: 'Chargeback Dispute Engine', autoEvidenceSubmission: true } },
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
      { type: 'multiLevelCache', label: 'L1/L2 Tiered Cache Hierarchy Router', category: 'CACHE', icon: TreeStructure, color: '#8B5CF6', defaults: { label: 'L1 Local + L2 Redis Tiered Cache', combinedHitRatio: 0.96 } },
      { type: 'negativeCache', label: 'Negative / Null Response Filter Cache', category: 'CACHE', icon: ShieldCheck, color: '#EF4444', defaults: { label: 'Negative Null Filter Cache', nullTtlSec: 30 } },
      { type: 'bloomFilterCache', label: 'Cache Pre-Filter Bloom Structure', category: 'CACHE', icon: Funnel, color: '#10B981', defaults: { label: 'Bloom Pre-Filter Cache', falsePositivePct: 1 } },
      { type: 'staleWhileRevalidate', label: 'SWR Async Background Cache Refresher', category: 'CACHE', icon: ArrowClockwise, color: '#0EA5E9', defaults: { label: 'SWR Background Cache Refresher', staleTtlHours: 24 } },
      { type: 'distributedSession', label: 'Distributed Session Store Cluster (Hazelcast)', category: 'CACHE', icon: Users, color: '#F97316', defaults: { label: 'Hazelcast Distributed Session Store', replicationFactor: 2 } },
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
      { type: 'pulsarBroker', label: 'Apache Pulsar Multi-Tenant Topic Cluster', category: 'QUEUE', icon: Stack, color: '#3B82F6', defaults: { label: 'Apache Pulsar Broker Cluster', tieredStorage: true } },
      { type: 'zeroMqBus', label: 'ZeroMQ Brokerless High-Throughput Socket Bus', category: 'QUEUE', icon: Lightning, color: '#EF4444', defaults: { label: 'ZeroMQ Brokerless Socket Bus', latencyUs: 50 } },
      { type: 'delayedTaskQueue', label: 'Amazon EventBridge Scheduler / Delayed Task Router', category: 'QUEUE', icon: Clock, color: '#EAB308', defaults: { label: 'Delayed Event Scheduler Queue', precisionSec: 1 } },
      { type: 'partitionedStream', label: 'Amazon Kinesis Multi-Shard Data Stream', category: 'QUEUE', icon: Waves, color: '#06B6D4', defaults: { label: 'Kinesis Sharded Stream Engine', shards: 16 } },
      { type: 'fanoutDispatcher', label: 'High-Fanout Broadcast Message Dispatcher', category: 'QUEUE', icon: Megaphone, color: '#A855F7', defaults: { label: 'Fanout Broadcast Dispatcher', targetQueues: 50 } },
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
      { type: 'oidcProvider', label: 'OpenID Connect / SAML Federation Identity Node', category: 'SECURITY', icon: Key, color: '#3B82F6', defaults: { label: 'SAML / OIDC Federation Node', sessionTimeoutHours: 8 } },
      { type: 'dataLossPrevention', label: 'DLP PII / Sensitive Data Scrubber Node', category: 'SECURITY', icon: ShieldWarning, color: '#DC2626', defaults: { label: 'DLP Sensitive Data Scrubber', regexRules: 120 } },
      { type: 'wafBotProtector', label: 'Advanced Bot Fingerprinting & Challenge Shield', category: 'SECURITY', icon: ShieldCheck, color: '#10B981', defaults: { label: 'Bot Fingerprinting Challenge Shield', jsChallengeEnabled: true } },
      { type: 'kmsKeyVault', label: 'AWS KMS / Hardware Key Management Vault', category: 'SECURITY', icon: Vault, color: '#8B5CF6', defaults: { label: 'AWS KMS Key Vault', customerManagedKeys: true } },
      { type: 'tamperProofAudit', label: 'WORM Immutable Security Audit Log Recorder', category: 'SECURITY', icon: FileText, color: '#64748B', defaults: { label: 'Immutable Security Audit Log Store', cryptographicHashProof: true } },
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
      { type: 'etcdCluster', label: 'High-Availability Etcd Raft Consensus Cluster', category: 'PLATFORM', icon: Database, color: '#2563EB', defaults: { label: 'Etcd Raft Consensus Cluster', nodes: 5 } },
      { type: 'zookeeperEnsemble', label: 'Apache ZooKeeper Coordination Ensemble', category: 'PLATFORM', icon: TreeStructure, color: '#EAB308', defaults: { label: 'ZooKeeper Coordination Ensemble', sessionTimeoutMs: 4000 } },
      { type: 'terraformWorker', label: 'Infrastructure-as-Code Automation Runner', category: 'PLATFORM', icon: TerminalWindow, color: '#64748B', defaults: { label: 'Terraform / Pulumi IaC Worker', stateLocking: true } },
      { type: 'canaryController', label: 'Flagger / Argo Rollouts Automated Canary Engine', category: 'PLATFORM', icon: FlowArrow, color: '#10B981', defaults: { label: 'Argo Rollouts Canary Controller', stepWeightPct: 10 } },
      { type: 'serviceCatalog', label: 'Universal Internal Service Discovery Catalog', category: 'PLATFORM', icon: BookOpen, color: '#8B5CF6', defaults: { label: 'Universal Service Discovery Catalog', openApiSpecsSync: true } },
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
      { type: 'bulkheadIsolation', label: 'Bulkhead Thread/Connection Pool Isolator', category: 'RELIABILITY', icon: ShieldCheck, color: '#0284C7', defaults: { label: 'Bulkhead Thread Isolator Node', maxConcurrentCalls: 25 } },
      { type: 'rateLimitingGateway', label: 'Distributed Sliding Window Rate Limiting Gateway', category: 'RELIABILITY', icon: Gauge, color: '#F97316', defaults: { label: 'Sliding Window Rate Limiting Gateway', windowMs: 60000 } },
      { type: 'activeActiveRouter', label: 'Multi-Region Active-Active Traffic Director', category: 'RELIABILITY', icon: Globe, color: '#10B981', defaults: { label: 'Active-Active Multi-Region Traffic Router', healthProbeIntervalSec: 2 } },
      { type: 'autoScalerController', label: 'HPA / KEDA Event-Driven Autoscaler Node', category: 'RELIABILITY', icon: ChartLineUp, color: '#A855F7', defaults: { label: 'KEDA Event-Driven Autoscaler', targetCpuUtilizationPct: 70 } },
      { type: 'gracefulShutdown', label: 'Drain Controller & Graceful Shutdown Coordinator', category: 'RELIABILITY', icon: Clock, color: '#64748B', defaults: { label: 'Graceful Drain Controller Node', terminationGracePeriodSec: 30 } },
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
      { type: 'ebpfMonitor', label: 'eBPF Kernel-Level Network & Syscall Profiler', category: 'OBSERVABILITY', icon: Eye, color: '#06B6D4', defaults: { label: 'eBPF Kernel Profiler Node', overheadPct: 0.5 } },
      { type: 'openTelemetryCollector', label: 'OTel Unified Trace/Metric Collector Gateway', category: 'OBSERVABILITY', icon: FlowArrow, color: '#8B5CF6', defaults: { label: 'OpenTelemetry Collector Gateway', batchTimeoutMs: 200 } },
      { type: 'syntheticMonitor', label: '24/7 Global Synthetic Transaction Probe Node', category: 'OBSERVABILITY', icon: Heartbeat, color: '#10B981', defaults: { label: 'Synthetic 24/7 Global Probe Node', locations: 12 } },
      { type: 'costAnomalyDetector', label: 'Cloud FinOps Cost Spike & Anomaly Alert Node', category: 'OBSERVABILITY', icon: CurrencyCircleDollar, color: '#EF4444', defaults: { label: 'FinOps Cost Spike Detector Node', alertThresholdPct: 20 } },
      { type: 'sloBurnCalculator', label: 'Error Budget & SLO Burn Rate Alert Manager', category: 'OBSERVABILITY', icon: Siren, color: '#F97316', defaults: { label: 'SLO Error Budget Burn Alert Manager', sloTargetPct: 99.95 } },
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
      { type: 'countMinSketch', label: 'Count-Min Sketch Frequency Estimator Structure', category: 'DSA', icon: Funnel, color: '#3B82F6', defaults: { label: 'Count-Min Sketch Frequency Estimator', epsilon: 0.001 } },
      { type: 'prefixTreeTrie', label: 'Trie / Prefix Tree Autocomplete Search Node', category: 'DSA', icon: TreeStructure, color: '#10B981', defaults: { label: 'Prefix Trie Search Structure', maxPrefixLen: 50 } },
      { type: 'disjointSetUnion', label: 'Union-Find Connected Components Tracker Node', category: 'DSA', icon: PlugsConnected, color: '#6366F1', defaults: { label: 'Union-Find Disjoint Set Tracker', pathCompression: true } },
      { type: 'bTreeIndexNode', label: 'B+ Tree Persistent Database Index Structure', category: 'DSA', icon: Stack, color: '#0284C7', defaults: { label: 'B+ Tree Persistent Index Node', branchingFactor: 128 } },
      { type: 'consistentHashRingV2', label: 'Maglev / Jump Consistent Hash Ring Structure', category: 'DSA', icon: Hexagon, color: '#A855F7', defaults: { label: 'Maglev Jump Hash Ring Structure', lookupTimeO1: true } },
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
      { type: 'outboxPattern', label: 'Transactional Outbox Pattern Database Relay', category: 'PATTERNS', icon: Database, color: '#059669', defaults: { label: 'Transactional Outbox Relay Node', pollIntervalMs: 200 } },
      { type: 'antiCorruptionLayer', label: 'ACL Domain Translator & Legacy Wrapper Node', category: 'PATTERNS', icon: Shield, color: '#64748B', defaults: { label: 'Domain Anti-Corruption Layer Node', schemaTranslation: true } },
      { type: 'throttlingQueue', label: 'Load-Leveling & Peak Shaving Throttling Buffer', category: 'PATTERNS', icon: Funnel, color: '#F97316', defaults: { label: 'Peak Shaving Throttling Buffer', maxQpsRelease: 500 } },
      { type: 'ambassadorProxy', label: 'Outbound Client Ambassador Proxy Router', category: 'PATTERNS', icon: PlugsConnected, color: '#38BDF8', defaults: { label: 'Outbound Ambassador Proxy Router', circuitBreakerIncluded: true } },
      { type: 'sagaCompensator', label: 'Distributed Saga Rollback & Compensation Worker', category: 'PATTERNS', icon: ArrowClockwise, color: '#EF4444', defaults: { label: 'Saga Compensation Rollback Worker', retryBackoffMaxMin: 60 } },
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
      { type: 'proxyPatternNode', label: 'Structural Proxy Caching & Access Control Node', category: 'LLD', icon: Shield, color: '#0284C7', defaults: { label: 'Structural Proxy Access Node', accessLogging: true } },
      { type: 'decoratorChain', label: 'Middleware Decorator Pipeline Processing Node', category: 'LLD', icon: Stack, color: '#A855F7', defaults: { label: 'Middleware Decorator Pipeline', executionOrderStrict: true } },
      { type: 'publisherSubscriber', label: 'Event-Driven Pub/Sub Broker Mediator Node', category: 'LLD', icon: Megaphone, color: '#EC4899', defaults: { label: 'Event Mediator Pub/Sub Broker', exactDelivery: true } },
      { type: 'builderPool', label: 'Complex Object Builder & Pooling Manager Node', category: 'LLD', icon: Cube, color: '#10B981', defaults: { label: 'Complex Object Builder Pool', poolSize: 100 } },
      { type: 'chainOfResponsibility', label: 'Chain of Responsibility Filter Pipeline Node', category: 'LLD', icon: ListNumbers, color: '#F97316', defaults: { label: 'Chain of Responsibility Pipeline', passThroughOnError: false } },
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
      { type: 'pdfGenerator', label: 'Headless Chrome / Puppeteer PDF Document Generator', category: 'EXTRAS', icon: FileText, color: '#EF4444', defaults: { label: 'Puppeteer PDF Generator Worker', concurrentRenderers: 10 } },
      { type: 'geoRoutingService', label: 'MaxMind IP-to-Geo Routing Decision Service', category: 'EXTRAS', icon: Compass, color: '#06B6D4', defaults: { label: 'IP-to-Geo Decision Router Node', dbUpdateFrequencyDays: 7 } },
      { type: 'qrCodeGenerator', label: 'High-Speed QR Code Dynamic Generation Worker', category: 'EXTRAS', icon: Hash, color: '#10B981', defaults: { label: 'Dynamic QR Code Generator Node', format: 'SVG/PNG' } },
      { type: 'audioTranscription', label: 'Real-Time Audio-to-Text Transcription Worker', category: 'EXTRAS', icon: Waves, color: '#8B5CF6', defaults: { label: 'Real-Time Audio Transcription Worker', model: 'Whisper-Large-v3' } },
      { type: 'virtualWaitingRoom', label: 'Cloudflare Waiting Room / Virtual Queue Node', category: 'EXTRAS', icon: Users, color: '#F97316', defaults: { label: 'Virtual Queue Waiting Room Node', maxActiveSessions: 10000 } },
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
