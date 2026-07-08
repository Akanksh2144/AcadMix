/**
 * System Design Arena — Challenge Definitions
 *
 * 7-stage progressive challenges from "1 User" to "1 Billion Users".
 * Each challenge provides initial nodes, target QPS, latency budgets,
 * cost caps, and progressive hints.
 */

import type { ChallengeConfig } from './types';

export const CHALLENGES: ChallengeConfig[] = [
  // ── Stage 0: Free-Build Sandbox ─────────────────────────────────────────
  {
    id: 'sandbox',
    stage: 0,
    title: 'Sandbox Mode',
    description: 'Free-build mode. Design any system architecture without constraints. Experiment freely with all components.',
    targetQPS: 0,
    maxLatencyP99: Infinity,
    initialNodes: [],
    initialEdges: [],
    hints: [
      'Consider how data flows from the user edge down to persistent storage tiers.',
      'Bottlenecks often occur when compute capacity is outpaced by incoming request volume.',
      'Caching frequently accessed data closer to the user reduces both latency and backend load.',
      'Asynchronous processing can decouple high-latency tasks from critical user-facing request paths.',
      'Monitoring red saturation indicators on nodes helps pinpoint where throughput is getting throttled.',
    ],
    locked: false,
  },

  // ── Stage 1: URL Shortener (TinyURL) ────────────────────────────────────
  {
    id: 'stage-1-tinyurl',
    stage: 1,
    title: 'URL Shortener (TinyURL)',
    description: 'Design a high-throughput URL shortener like TinyURL. Read requests (redirects) dominate the traffic. Minimize redirect latency under heavy load.',
    targetQPS: 100000,
    maxLatencyP99: 80,
    initialNodes: [
      {
        id: 'client-1',
        type: 'client',
        position: { x: 50, y: 200 },
        data: { label: 'Users', requestsPerSec: 100000, protocol: 'http2' },
      },
      {
        id: 'server-1',
        type: 'appServer',
        position: { x: 400, y: 200 },
        data: { label: 'TinyURL App', replicas: 1, maxThreads: 200, processingTime: 50 },
      },
      {
        id: 'db-1',
        type: 'sqlDatabase',
        position: { x: 750, y: 200 },
        data: { label: 'URL Map DB', readReplicas: 0, replicationLag: 50, indexed: true, sharded: false, shardCount: 1 },
      },
    ],
    initialEdges: [
      { id: 'e-c1-s1', source: 'client-1', target: 'server-1' },
      { id: 'e-s1-db1', source: 'server-1', target: 'db-1' },
    ],
    hints: [
      'Read-heavy workloads benefit immensely from edge caching before traffic ever hits compute servers.',
      'When database queries are repetitive and deterministic, an in-memory layer can prevent disk I/O bottlenecks.',
      'Hot keys and viral links need special handling — consider how high-TTL caching protects backing stores.',
      'Single-server architectures create a single point of failure and severe concurrent connection limits.',
      'Optimizing database lookup speed is essential when billions of records must be searched in milliseconds.',
    ],
    locked: false,
  },

  // ── Stage 2: Real-Time Chat (WhatsApp) ──────────────────────────────────
  {
    id: 'stage-2-whatsapp',
    stage: 2,
    title: 'Real-Time Chat (WhatsApp)',
    description: 'Design WhatsApp. The system must support low-latency message delivery, connection persistence (WebSockets), and buffer offline writes.',
    targetQPS: 300000,
    maxLatencyP99: 120,
    initialNodes: [
      {
        id: 'client-1',
        type: 'client',
        position: { x: 50, y: 220 },
        data: { label: 'Active Users', requestsPerSec: 300000, protocol: 'http1.1' },
      },
      {
        id: 'server-1',
        type: 'appServer',
        position: { x: 450, y: 220 },
        data: { label: 'Chat Gateway', replicas: 2, maxThreads: 200, processingTime: 30 },
      },
      {
        id: 'db-1',
        type: 'sqlDatabase',
        position: { x: 800, y: 220 },
        data: { label: 'Messages DB', readReplicas: 0, replicationLag: 50, indexed: true, sharded: false, shardCount: 1 },
      },
    ],
    initialEdges: [
      { id: 'e-c1-s1', source: 'client-1', target: 'server-1' },
      { id: 'e-s1-db1', source: 'server-1', target: 'db-1' },
    ],
    hints: [
      'Traditional request-response protocols introduce excessive overhead for continuous bidirectional communication.',
      'When incoming write volume exceeds database ingestion capacity, decoupling writes via asynchronous buffers prevents dropped messages.',
      'Background workers can process queued messages at a steady pace without blocking real-time user connections.',
      'High-frequency append-only message logs require storage engines optimized for sequential write throughput.',
      'Maintaining persistent connection states for millions of concurrent users requires horizontally scalable gateway clusters.',
      'Fast lookups for user online status and session routing are best handled by distributed in-memory data grids.',
    ],
    locked: false,
  },

  // ── Stage 3: Video Streaming (Netflix/YouTube) ──────────────────────────
  {
    id: 'stage-3-netflix',
    stage: 3,
    title: 'Video Streaming (Netflix/YouTube)',
    description: 'Scale video streaming traffic globally. Deliver heavy video chunks with sub-100ms startup times, and transcode video uploads asynchronously.',
    targetQPS: 500000,
    maxLatencyP99: 150,
    initialNodes: [
      {
        id: 'client-1',
        type: 'client',
        position: { x: 50, y: 250 },
        data: { label: 'Streamers', requestsPerSec: 500000, protocol: 'http2' },
      },
      {
        id: 'server-1',
        type: 'appServer',
        position: { x: 450, y: 250 },
        data: { label: 'Video Catalog Server', replicas: 3, maxThreads: 200, processingTime: 40 },
      },
      {
        id: 'db-1',
        type: 'sqlDatabase',
        position: { x: 800, y: 250 },
        data: { label: 'Metadata DB', readReplicas: 0, replicationLag: 50, indexed: true, sharded: false, shardCount: 1 },
      },
    ],
    initialEdges: [
      { id: 'e-c1-s1', source: 'client-1', target: 'server-1' },
      { id: 'e-s1-db1', source: 'server-1', target: 'db-1' },
    ],
    hints: [
      'Serving large static media files from core application servers quickly consumes available network bandwidth and compute threads.',
      'Placing content delivery networks at edge locations drastically reduces streaming startup latency across global regions.',
      'Video transcoding is highly CPU-intensive and should be isolated from live user traffic using asynchronous worker pools.',
      'Separating raw media object storage from transactional metadata databases prevents storage saturation.',
      'Distributing API gateway traffic across multiple application server instances ensures smooth catalog browsing during peak hours.',
      'Caching popular movie metadata and user recommendations in memory keeps catalog search latency well below P99 budgets.',
    ],
    locked: false,
  },

  // ── Stage 4: Ride-Hailing (Uber/Lyft) ──────────────────────────────────
  {
    id: 'stage-4-uber',
    stage: 4,
    title: 'Ride-Hailing (Uber/Lyft)',
    description: 'Design Uber. Handle high-frequency GPS coordinate updates from drivers, run real-time geospatial searches, and dispatch rides.',
    targetQPS: 150000,
    maxLatencyP99: 100,
    initialNodes: [
      {
        id: 'client-1',
        type: 'client',
        position: { x: 50, y: 200 },
        data: { label: 'Drivers (GPS Pings)', requestsPerSec: 150000, protocol: 'http2' },
      },
      {
        id: 'server-1',
        type: 'appServer',
        position: { x: 400, y: 200 },
        data: { label: 'Dispatch Core', replicas: 2, maxThreads: 250, processingTime: 30 },
      },
      {
        id: 'db-1',
        type: 'sqlDatabase',
        position: { x: 750, y: 200 },
        data: { label: 'Trip Logs', readReplicas: 0, replicationLag: 50, indexed: true, sharded: false, shardCount: 1 },
      },
    ],
    initialEdges: [
      { id: 'e-c1-s1', source: 'client-1', target: 'server-1' },
      { id: 'e-s1-db1', source: 'server-1', target: 'db-1' },
    ],
    hints: [
      'High-frequency location pings from millions of active drivers will quickly overwhelm traditional synchronous database writes.',
      'Geospatial queries require specialized indexing or in-memory location grids rather than standard relational table scans.',
      'Ingesting real-time telemetry is best handled by event streaming pipelines that decouple ingestion from core matching logic.',
      'Dispatch algorithms require significant compute headroom and sticky session routing to match riders and drivers efficiently.',
      'Separating immutable historical trip logs into high-throughput storage engines preserves core database performance for live operations.',
      'Read replicas can absorb heavy billing and analytics queries without degrading primary transactional performance.',
    ],
    locked: false,
  },

  // ── Stage 5: Flash Sale (Robinhood/Ticketmaster) ───────────────────────
  {
    id: 'stage-5-flash-sale',
    stage: 5,
    title: 'Flash Sale (Robinhood/Ticketmaster)',
    description: 'Design a flash sale or stock trading platform. Prevent double-booking/over-selling of limited stock under massive spikes of write requests.',
    targetQPS: 250000,
    maxLatencyP99: 110,
    initialNodes: [
      {
        id: 'client-1',
        type: 'client',
        position: { x: 50, y: 220 },
        data: { label: 'Buyers', requestsPerSec: 250000, protocol: 'http2' },
      },
      {
        id: 'server-1',
        type: 'appServer',
        position: { x: 450, y: 220 },
        data: { label: 'Orders Gateway', replicas: 3, maxThreads: 200, processingTime: 20 },
      },
      {
        id: 'db-1',
        type: 'sqlDatabase',
        position: { x: 800, y: 220 },
        data: { label: 'Inventory DB', readReplicas: 0, replicationLag: 50, indexed: true, sharded: false, shardCount: 1 },
      },
    ],
    initialEdges: [
      { id: 'e-c1-s1', source: 'client-1', target: 'server-1' },
      { id: 'e-s1-db1', source: 'server-1', target: 'db-1' },
    ],
    hints: [
      'Sudden traffic spikes during flash events can cause severe database contention and locking if orders are processed synchronously.',
      'Event buffering enables systems to absorb massive write surges while preserving strict order arrival sequencing.',
      'Preventing overselling and race conditions requires strict ACID guarantees and transactional integrity at the database layer.',
      'Tracking real-time inventory counts in high-speed distributed caches prevents unnecessary database trips for sold-out items.',
      'Horizontally partitioning database tables distributes concurrent write contention across multiple independent storage shards.',
      'Implementing edge rate limiting and request throttling protects downstream backend services from cascading failures.',
    ],
    locked: false,
  },

  // ── Stage 6: Distributed Web Crawler ──────────────────────────────────
  {
    id: 'stage-6-web-crawler',
    stage: 6,
    title: 'Distributed Web Crawler',
    description: 'Design a distributed search engine web crawler. Download web content, cache active DNS, filter duplicate links, and store pages.',
    targetQPS: 80000,
    maxLatencyP99: 200,
    initialNodes: [
      {
        id: 'client-1',
        type: 'client',
        position: { x: 50, y: 200 },
        data: { label: 'Seed URL Queue', requestsPerSec: 80000, protocol: 'http2' },
      },
      {
        id: 'server-1',
        type: 'appServer',
        position: { x: 400, y: 200 },
        data: { label: 'Crawler Controller', replicas: 1, maxThreads: 200, processingTime: 50 },
      },
      {
        id: 'db-1',
        type: 'sqlDatabase',
        position: { x: 750, y: 200 },
        data: { label: 'Deduplication DB', readReplicas: 0, replicationLag: 50, indexed: true, sharded: false, shardCount: 1 },
      },
    ],
    initialEdges: [
      { id: 'e-c1-s1', source: 'client-1', target: 'server-1' },
      { id: 'e-s1-db1', source: 'server-1', target: 'db-1' },
    ],
    hints: [
      'Repeated domain name lookups introduce significant latency — caching domain resolutions locally accelerates outgoing requests.',
      'Crawling billions of web pages requires highly distributed worker pools coordinating tasks asynchronously.',
      'Storing large unstructured HTML documents and media files requires scalable object stores rather than structured relational schemas.',
      'Preventing infinite loops and re-crawling duplicate URLs requires memory-efficient probabilistic data structures like Bloom filters.',
      'Decoupling URL discovery from page downloading ensures worker threads remain continuously utilized without idling.',
      'Indexing extracted metadata and link graphs requires storage solutions optimized for rapid graph traversal and full-text search.',
    ],
    locked: false,
  },

  // ── Stage 7: News Feed (Twitter/Instagram) ──────────────────────────────
  {
    id: 'stage-7-twitter-feed',
    stage: 7,
    title: 'Global News Feed (Twitter/Instagram)',
    description: 'Design Twitter. Scale the global news feed to 1 Million QPS. Support dynamic timeline generation, media file CDNs, and sharded databases.',
    targetQPS: 1000000,
    maxLatencyP99: 100,
    initialNodes: [
      {
        id: 'client-1',
        type: 'client',
        position: { x: 50, y: 300 },
        data: { label: 'Global Readers', requestsPerSec: 1000000, protocol: 'http2' },
      },
      {
        id: 'dns-1',
        type: 'dns',
        position: { x: 250, y: 300 },
        data: { label: 'Geo-DNS', ttl: 60, routingPolicy: 'geo' },
      },
    ],
    initialEdges: [
      { id: 'e-c1-dns', source: 'client-1', target: 'dns-1' },
    ],
    hints: [
      'Global user bases require geographically distributed routing policies to direct users to their nearest data center edge.',
      'Generating feeds on-the-fly for millions of concurrent users creates massive database read amplification without pre-computation.',
      'The fan-out-on-write pattern pushes new posts directly into followers in-memory timelines for instant retrieval.',
      'Hot keys from viral accounts require hybrid routing — pulling content on demand rather than pushing to millions of timelines simultaneously.',
      'Massive social graphs and tweet archives require horizontal database sharding across multiple dedicated database nodes.',
      'Offloading secondary tasks like analytics ingestion and push notifications to background event streams preserves core API responsiveness.',
    ],
    locked: false,
  },
];

/**
 * Checks if a simulation result passes a challenge's constraints.
 */
export function checkChallengePassed(
  challenge: ChallengeConfig,
  result: { system: { p99Latency: number; errorRate: number; totalMonthlyCost: number; successfulQPS: number } },
): { passed: boolean; reasons: string[] } {
  if (challenge.id === 'sandbox') return { passed: true, reasons: [] };

  const reasons: string[] = [];

  if (result.system.p99Latency > challenge.maxLatencyP99) {
    reasons.push(`p99 latency ${result.system.p99Latency.toFixed(0)}ms exceeds ${challenge.maxLatencyP99}ms limit`);
  }

  if (result.system.errorRate > 0.05) {
    reasons.push(`Error rate ${(result.system.errorRate * 100).toFixed(1)}% exceeds 5% threshold`);
  }

  if (result.system.successfulQPS < challenge.targetQPS * 0.95) {
    reasons.push(`Throughput ${result.system.successfulQPS.toFixed(0)} QPS below ${challenge.targetQPS} target`);
  }

  return { passed: reasons.length === 0, reasons };
}
