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
    maxBudget: Infinity,
    initialNodes: [],
    initialEdges: [],
    hints: [
      'Drag components from the palette on the left.',
      'Connect nodes by dragging from a source handle to a target handle.',
      'Click "Run Simulation" to test your architecture under load.',
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
    maxBudget: 500,
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
      'The App Server only has 1 replica (200 capacity) but needs to handle 100,000 QPS. You need a CDN to intercept static reads at the edge.',
      'Add a CDN node between the Client and App Server. Set its hit ratio high (e.g. 0.85+).',
      'The database is receiving too many read misses. Place a Redis Cache between the App Server and the database.',
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
    maxBudget: 1500,
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
      'Standard HTTP/1.1 is too slow for real-time delivery. Change the client protocol to WebSocket.',
      'Direct writes to the SQL Database will fail at this volume. Insert a Message Queue (Kafka/SQS) to buffer write operations.',
      'Add a Worker Pool to read from the Message Queue and write to a NoSQL Database (e.g., MongoDB/Cassandra) optimized for write throughput.',
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
    maxBudget: 2500,
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
      'Video files cannot be served directly from databases or app servers. Route client traffic through a CDN to cache media files.',
      'Add an Object Storage node (like S3) to host raw and transcoded video files.',
      'Add a Worker Pool connected to a Message Queue to handle heavy video encoding jobs asynchronously.',
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
    maxBudget: 1800,
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
      'Scale the app servers by putting a Load Balancer in front of them, using the IP-hash algorithm to ensure sticky routing.',
      'To query active locations, keep geohashes in a Redis Cache (in-memory geospatial store) instead of writing to disk.',
      'Persist final ride history logs to a NoSQL Database optimized for high write throughput.',
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
    maxBudget: 3000,
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
      'Direct orders will choke the database. Buffer incoming purchases by placing a Message Queue (Kafka) after the app servers.',
      'Use a SQL Database to guarantee ACID transactions (prevent double selling). Shard it (e.g. 4+ shards) to increase write throughput.',
      'Add a Redis Cache (write-back pattern) to track inventory seat counts in-memory.',
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
    maxBudget: 1500,
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
      'DNS resolution on every page fetch is a bottleneck. Add a DNS cache node (Geo-DNS or high TTL) to speed up link resolution.',
      'Asynchronously distribute downloading jobs using a Message Queue connected to a Worker Pool of crawler bots.',
      'Store raw page HTML files in Object Storage rather than in a relational database. Deduplicate links using a Redis Bloom Filter.',
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
    maxBudget: 8000,
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
      'Distribute load via Geo-DNS routing to regional clusters, and use a CDN to absorb dynamic photo/video loads.',
      'Add a Load Balancer routing to large App Server clusters (e.g. 12+ replicas) with optimized processing times.',
      'Use Redis Cache to store active user feed timelines (fan-out on write). Shard the PostgreSQL Metadata DB across 4+ shards.',
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

  if (result.system.totalMonthlyCost > challenge.maxBudget) {
    reasons.push(`Monthly cost $${result.system.totalMonthlyCost.toFixed(0)} exceeds $${challenge.maxBudget} budget`);
  }

  if (result.system.successfulQPS < challenge.targetQPS * 0.95) {
    reasons.push(`Throughput ${result.system.successfulQPS.toFixed(0)} QPS below ${challenge.targetQPS} target`);
  }

  return { passed: reasons.length === 0, reasons };
}
