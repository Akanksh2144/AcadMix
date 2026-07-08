/**
 * System Design Arena — Simulation Summary Modal
 *
 * Displays a comprehensive evaluation report after a simulation completes or is stopped.
 * Features:
 * - Color-coded Grade Badge (S / A / B / C / D / F)
 * - Overall score out of 100 with threshold verification
 * - 4 Category Progress Bars (Scalability, Reliability, Performance, Simplicity)
 * - Detailed Breakdown Table (Traffic, Latency, Error rate, SPOFs, Component count)
 * - Interactive 5-Star Rating Feedback
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, CheckCircle, WarningCircle } from '@phosphor-icons/react';
import type { SimulationResult } from './types';

interface SimulationSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: SimulationResult | null;
  targetQPS: number;
  maxLatencyP99: number;
  nodesCount: number;
  spofCount?: number;
}

export default function SimulationSummaryModal({
  isOpen,
  onClose,
  result,
  targetQPS,
  maxLatencyP99,
  nodesCount,
  spofCount = 0,
}: SimulationSummaryModalProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);

  if (!isOpen || !result) return null;

  const { system, grade } = result;

  // Calculate clean integer category scores out of 100
  const target = Math.max(1, targetQPS || 100000);
  const trafficRatio = Math.min(1, system.successfulQPS / target);
  
  const scalabilityScore = Math.min(100, Math.round(trafficRatio * 100));
  const reliabilityScore = Math.max(0, Math.min(100, Math.round(100 - (spofCount * 15) - (system.errorRate * 500))));
  
  const latencyDiff = Math.max(0, system.p99Latency - maxLatencyP99);
  const performanceScore = Math.max(0, Math.min(100, Math.round(100 - (latencyDiff / Math.max(1, maxLatencyP99)) * 50)));
  
  const simplicityScore = Math.max(40, Math.min(100, Math.round(100 - Math.max(0, nodesCount - 6) * 6)));

  const overallScore = Math.round((scalabilityScore * 0.35) + (reliabilityScore * 0.25) + (performanceScore * 0.25) + (simplicityScore * 0.15));
  const isPassed = grade === 'S' || grade === 'A' || grade === 'B' || grade === 'C' || grade === 'C+';

  // Badge Styling
  let badgeColor = 'border-amber-400 text-amber-500 bg-amber-500/10';
  if (grade === 'S' || grade === 'A') badgeColor = 'border-emerald-500 text-emerald-500 bg-emerald-500/10';
  else if (grade === 'B') badgeColor = 'border-blue-500 text-blue-500 bg-blue-500/10';
  else if (grade === 'D' || grade === 'F') badgeColor = 'border-rose-500 text-rose-500 bg-rose-500/10';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', duration: 0.5, bounce: 0.2 }}
          className="w-full max-w-xl bg-[var(--paper-alt)] border border-[var(--ink-border)] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-6 border-b border-[var(--ink-border)] flex items-center justify-between bg-[var(--paper)]">
            <div className="flex items-center gap-5">
              {/* Grade Circle Badge */}
              <div className={`w-16 h-16 rounded-full border-[3px] flex items-center justify-center font-extrabold text-3xl shrink-0 shadow-inner ${badgeColor}`}>
                {grade}
              </div>
              <div>
                <h2 className="text-2xl font-black text-[var(--ink)] tracking-tight">
                  {isPassed ? 'Simulation passed' : 'Simulation review required'}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm font-bold text-[var(--ink-light)]">
                    Overall score: <strong className="text-[var(--ink)] text-base">{overallScore}/100</strong>
                  </span>
                  {overallScore >= 60 ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-500">
                      <CheckCircle size={14} weight="fill" /> Above 60 threshold
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-500">
                      <WarningCircle size={14} weight="fill" /> Below 60 threshold
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full flex items-center justify-center text-[var(--ink-light)] hover:text-[var(--ink)] hover:bg-[var(--paper-node)] transition-colors"
            >
              <X size={20} weight="bold" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1 text-[var(--ink)]">
            {/* 4 Category Progress Bars */}
            <div className="space-y-3.5">
              {/* Scalability */}
              <div>
                <div className="flex justify-between items-baseline mb-1">
                  <span className="text-sm font-bold text-[var(--ink)]">Scalability</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-semibold text-[var(--ink-light)]">35%</span>
                    <span className="text-base font-extrabold text-rose-500">{scalabilityScore}</span>
                  </div>
                </div>
                <div className="h-2.5 w-full bg-[var(--paper-node)] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${scalabilityScore}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className={`h-full rounded-full ${scalabilityScore < 50 ? 'bg-rose-500' : scalabilityScore < 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                  />
                </div>
              </div>

              {/* Reliability */}
              <div>
                <div className="flex justify-between items-baseline mb-1">
                  <span className="text-sm font-bold text-[var(--ink)]">Reliability</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-semibold text-[var(--ink-light)]">25%</span>
                    <span className="text-base font-extrabold text-amber-500">{reliabilityScore}</span>
                  </div>
                </div>
                <div className="h-2.5 w-full bg-[var(--paper-node)] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${reliabilityScore}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
                    className={`h-full rounded-full ${reliabilityScore < 50 ? 'bg-rose-500' : reliabilityScore < 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                  />
                </div>
              </div>

              {/* Performance */}
              <div>
                <div className="flex justify-between items-baseline mb-1">
                  <span className="text-sm font-bold text-[var(--ink)]">Performance</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-semibold text-[var(--ink-light)]">25%</span>
                    <span className="text-base font-extrabold text-emerald-500">{performanceScore}</span>
                  </div>
                </div>
                <div className="h-2.5 w-full bg-[var(--paper-node)] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${performanceScore}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
                    className={`h-full rounded-full ${performanceScore < 50 ? 'bg-rose-500' : performanceScore < 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                  />
                </div>
              </div>

              {/* Simplicity */}
              <div>
                <div className="flex justify-between items-baseline mb-1">
                  <span className="text-sm font-bold text-[var(--ink)]">Simplicity</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-semibold text-[var(--ink-light)]">15%</span>
                    <span className="text-base font-extrabold text-emerald-500">{simplicityScore}</span>
                  </div>
                </div>
                <div className="h-2.5 w-full bg-[var(--paper-node)] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${simplicityScore}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
                    className={`h-full rounded-full ${simplicityScore < 50 ? 'bg-rose-500' : simplicityScore < 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                  />
                </div>
              </div>
            </div>

            {/* Breakdown Table */}
            <div className="border-t border-[var(--ink-border)] pt-5">
              <span className="block text-[11px] font-extrabold text-[var(--ink-light)] uppercase tracking-wider mb-3">
                BREAKDOWN
              </span>
              <div className="space-y-3 text-sm font-medium">
                {/* Traffic */}
                <div className="flex justify-between items-center py-1 border-b border-[var(--ink-border)]/50">
                  <span className="text-[var(--ink-light)] font-semibold">Handled traffic</span>
                  <div className="flex items-center gap-4">
                    <span className="font-extrabold text-blue-500">
                      {targetQPS > 0 ? `${Math.round(trafficRatio * 100)}%` : `${system.successfulQPS.toLocaleString()} QPS`}
                    </span>
                    <span className="text-xs text-[var(--ink-faint)] w-24 text-right">
                      {targetQPS > 0 ? `of target QPS` : `total throughput`}
                    </span>
                  </div>
                </div>

                {/* Latency */}
                <div className="flex justify-between items-center py-1 border-b border-[var(--ink-border)]/50">
                  <span className="text-[var(--ink-light)] font-semibold">p99 latency</span>
                  <div className="flex items-center gap-4">
                    <span className={`font-extrabold ${system.p99Latency > maxLatencyP99 ? 'text-rose-500' : 'text-blue-500'}`}>
                      {system.p99Latency.toFixed(0)}ms
                    </span>
                    <span className="text-xs text-[var(--ink-faint)] w-24 text-right">
                      SLA: {maxLatencyP99 === Infinity ? 'None' : `${maxLatencyP99}ms`}
                    </span>
                  </div>
                </div>

                {/* Error Rate */}
                <div className="flex justify-between items-center py-1 border-b border-[var(--ink-border)]/50">
                  <span className="text-[var(--ink-light)] font-semibold">Error rate</span>
                  <div className="flex items-center gap-4">
                    <span className={`font-extrabold ${system.errorRate > 0.01 ? 'text-rose-500' : 'text-blue-500'}`}>
                      {(system.errorRate * 100).toFixed(2)}%
                    </span>
                    <span className="text-xs text-[var(--ink-faint)] w-24 text-right">
                      Target: &lt;1%
                    </span>
                  </div>
                </div>

                {/* Single Points of Failure */}
                <div className="flex justify-between items-center py-1 border-b border-[var(--ink-border)]/50">
                  <span className="text-[var(--ink-light)] font-semibold">Single points of failure</span>
                  <div className="flex items-center gap-4">
                    <span className={`font-extrabold ${spofCount > 0 ? 'text-amber-500' : 'text-blue-500'}`}>
                      {spofCount}
                    </span>
                    <span className="text-xs text-[var(--ink-faint)] w-24 text-right">
                      {spofCount > 0 ? 'Add replicas' : 'Optimal: 0'}
                    </span>
                  </div>
                </div>

                {/* Components */}
                <div className="flex justify-between items-center py-1">
                  <span className="text-[var(--ink-light)] font-semibold">Components</span>
                  <div className="flex items-center gap-4">
                    <span className="font-extrabold text-blue-500">
                      {nodesCount}
                    </span>
                    <span className="text-xs text-[var(--ink-faint)] w-24 text-right">
                      Optimal: ~6
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* How was the simulation? */}
            <div className="border-t border-[var(--ink-border)] pt-5">
              <span className="block text-[11px] font-extrabold text-[var(--ink-light)] uppercase tracking-wider mb-2">
                HOW WAS THE SIMULATION?
              </span>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => {
                  const isFilled = star <= (hoverRating || rating);
                  return (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 text-2xl transition-transform hover:scale-110 focus:outline-none"
                    >
                      <Star
                        size={26}
                        weight={isFilled ? 'fill' : 'regular'}
                        className={isFilled ? 'text-amber-400 drop-shadow' : 'text-[var(--ink-faint)]'}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-5 border-t border-[var(--ink-border)] bg-[var(--paper)] flex justify-end">
            <button
              onClick={onClose}
              className="px-8 py-2.5 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20 transition-all active:scale-95"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
