/**
 * System Design Arena — Metrics Panel
 *
 * Displays simulation results: latency profiles, throughput charts,
 * bottleneck alerts, and system grading. Uses Recharts.
 */

import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import {
  ChartLineUp, Warning, CheckCircle, XCircle, Trophy,
  Lightning, Clock, CurrencyDollar, ShieldCheck,
} from '@phosphor-icons/react';
import type { SimulationResult } from './types';

interface MetricsPanelProps {
  result: SimulationResult | null;
  challengeTargets?: {
    maxLatencyP99: number;
    maxBudget: number;
    targetQPS: number;
  };
  challengeResult?: { passed: boolean; reasons: string[] };
}

export default function MetricsPanel({ result, challengeTargets, challengeResult }: MetricsPanelProps) {
  if (!result) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center px-6 py-10">
        <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
          <ChartLineUp size={28} weight="duotone" className="text-gray-400" />
        </div>
        <h4 className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-1">No Simulation Data</h4>
        <p className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed max-w-[200px]">
          Click <strong>Run Simulation</strong> to test your architecture under load.
        </p>
      </div>
    );
  }

  const { system, bottlenecks, grade, nodeMetrics } = result;

  // Latency chart data
  const latencyData = [
    { name: 'p50', value: system.p50Latency, fill: '#22c55e' },
    { name: 'p95', value: system.p95Latency, fill: '#f59e0b' },
    { name: 'p99', value: system.p99Latency, fill: system.p99Latency > 200 ? '#ef4444' : '#f59e0b' },
  ];

  // Grade color
  const gradeColor = grade.startsWith('A') ? 'text-emerald-500' : grade.startsWith('B') ? 'text-blue-500' : grade.startsWith('C') ? 'text-amber-500' : 'text-red-500';
  const gradeBg = grade.startsWith('A') ? 'bg-emerald-50 dark:bg-emerald-500/10' : grade.startsWith('B') ? 'bg-blue-50 dark:bg-blue-500/10' : grade.startsWith('C') ? 'bg-amber-50 dark:bg-amber-500/10' : 'bg-red-50 dark:bg-red-500/10';

  return (
    <div className="h-full flex flex-col overflow-y-auto">
      {/* Challenge Result Banner */}
      {challengeResult && (
        <div className={`mx-3 mt-3 p-3 rounded-xl border ${challengeResult.passed ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20' : 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20'}`}>
          <div className="flex items-center gap-2 mb-1">
            {challengeResult.passed
              ? <CheckCircle size={18} weight="fill" className="text-emerald-500" />
              : <XCircle size={18} weight="fill" className="text-red-500" />
            }
            <span className={`text-xs font-extrabold uppercase tracking-wider ${challengeResult.passed ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
              {challengeResult.passed ? 'Challenge Passed!' : 'Not Passing'}
            </span>
          </div>
          {!challengeResult.passed && challengeResult.reasons.length > 0 && (
            <ul className="space-y-0.5 mt-1.5">
              {challengeResult.reasons.map((r, i) => (
                <li key={i} className="text-[10px] text-red-500 dark:text-red-400 flex items-start gap-1.5">
                  <span className="mt-0.5 shrink-0">•</span>
                  {r}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Grade Card */}
      <div className="mx-3 mt-3 p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy size={18} weight="duotone" className="text-amber-500" />
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">System Grade</span>
          </div>
          <div className={`${gradeBg} px-3 py-1 rounded-lg`}>
            <span className={`text-xl font-black ${gradeColor}`}>{grade}</span>
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 gap-2 mx-3 mt-3">
        {[
          { icon: Lightning, label: 'Throughput', value: `${formatNum(system.successfulQPS)}`, sub: 'req/s', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10' },
          { icon: XCircle, label: 'Error Rate', value: `${(system.errorRate * 100).toFixed(1)}%`, sub: `${formatNum(system.failedQPS)} dropped`, color: system.errorRate > 0.05 ? 'text-red-500' : 'text-emerald-500', bg: system.errorRate > 0.05 ? 'bg-red-50 dark:bg-red-500/10' : 'bg-emerald-50 dark:bg-emerald-500/10' },
          { icon: CurrencyDollar, label: 'Monthly Cost', value: `$${formatNum(system.totalMonthlyCost)}`, sub: '/month', color: challengeTargets && system.totalMonthlyCost > challengeTargets.maxBudget ? 'text-red-500' : 'text-emerald-500', bg: 'bg-gray-50 dark:bg-gray-800' },
          { icon: ShieldCheck, label: 'Availability', value: `${system.availabilityPercent.toFixed(2)}%`, sub: '', color: system.availabilityPercent > 99 ? 'text-emerald-500' : 'text-amber-500', bg: 'bg-gray-50 dark:bg-gray-800' },
        ].map((m) => {
          const Icon = m.icon;
          return (
            <div key={m.label} className={`p-3 rounded-xl border border-gray-200 dark:border-gray-700 ${m.bg}`}>
              <div className="flex items-center gap-1.5 mb-1">
                <Icon size={12} weight="bold" className={m.color} />
                <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{m.label}</span>
              </div>
              <p className={`text-lg font-black ${m.color}`}>{m.value}</p>
              {m.sub && <p className="text-[10px] text-gray-400">{m.sub}</p>}
            </div>
          );
        })}
      </div>

      {/* Latency Chart */}
      <div className="mx-3 mt-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
        <div className="flex items-center gap-1.5 mb-3">
          <Clock size={14} weight="bold" className="text-gray-400" />
          <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Latency Profile (ms)</span>
        </div>
        <ResponsiveContainer width="100%" height={120}>
          <BarChart data={latencyData} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={35} />
            <Tooltip
              contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid rgba(148,163,184,0.2)' }}
              formatter={(value: number) => [`${value.toFixed(1)}ms`, 'Latency']}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {latencyData.map((entry, idx) => (
                <Cell key={idx} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Bottleneck Alerts */}
      {bottlenecks.length > 0 && (
        <div className="mx-3 mt-3 mb-3 space-y-1.5">
          <div className="flex items-center gap-1.5 px-1">
            <Warning size={14} weight="bold" className="text-amber-500" />
            <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Bottlenecks</span>
          </div>
          {bottlenecks.slice(0, 5).map((nodeId) => {
            const m = nodeMetrics[nodeId];
            if (!m) return null;
            return (
              <div
                key={nodeId}
                className={`px-3 py-2 rounded-lg border text-xs ${
                  m.status === 'critical'
                    ? 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400'
                    : 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20 text-amber-600 dark:text-amber-400'
                }`}
              >
                <p className="font-semibold">{m.bottleneck || nodeId}</p>
                <p className="text-[10px] opacity-70 mt-0.5">
                  {formatNum(m.incomingQPS)} QPS → capacity {formatNum(getCapacityDisplay(m))} • {(m.utilization * 100).toFixed(0)}% utilized
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toFixed(0);
}

function getCapacityDisplay(m: { incomingQPS: number; utilization: number }): number {
  return m.utilization > 0 ? m.incomingQPS / m.utilization : 0;
}
