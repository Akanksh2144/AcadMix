/**
 * System Design Arena — Challenge Selector
 *
 * Modal/drawer to select a challenge or free-build sandbox mode.
 * Shows challenge progression with stage numbers and descriptions.
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Play, Lock, Trophy, Lightning, Users, Scales,
  Database, CloudArrowDown, TreeStructure, Rocket,
} from '@phosphor-icons/react';
import type { ChallengeConfig } from './types';

const STAGE_ICONS = [
  TreeStructure, // Sandbox
  Users,         // Stage 1: Single Server
  Database,      // Stage 2: Separate DB
  Scales,        // Stage 3: Load Balancer
  CloudArrowDown,// Stage 4: Caching
  Lightning,     // Stage 5: DB Scale-Out
  Rocket,        // Stage 6: 1B Users
];

const STAGE_COLORS = [
  'from-gray-500 to-slate-500',
  'from-emerald-500 to-green-500',
  'from-blue-500 to-indigo-500',
  'from-amber-500 to-orange-500',
  'from-cyan-500 to-teal-500',
  'from-violet-500 to-purple-500',
  'from-rose-500 to-pink-500',
];

interface ChallengeSelectorProps {
  challenges: ChallengeConfig[];
  currentChallengeId: string;
  isOpen: boolean;
  onClose: () => void;
  onSelect: (challenge: ChallengeConfig) => void;
  completedChallenges: Set<string>;
}

export default function ChallengeSelector({
  challenges,
  currentChallengeId,
  isOpen,
  onClose,
  onSelect,
  completedChallenges,
}: ChallengeSelectorProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed left-0 top-0 bottom-0 z-[201] w-full max-w-md bg-white dark:bg-gray-900 shadow-2xl shadow-black/20 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-md shadow-indigo-500/20">
                  <Trophy size={20} weight="fill" className="text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-gray-900 dark:text-white">Challenges</h2>
                  <p className="text-xs text-gray-400">Scale from 1 to 1 billion users</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X size={18} weight="bold" className="text-gray-400" />
              </button>
            </div>

            {/* Challenge List */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
              {challenges.map((challenge, idx) => {
                const Icon = STAGE_ICONS[idx] || TreeStructure;
                const color = STAGE_COLORS[idx] || STAGE_COLORS[0];
                const isCurrent = challenge.id === currentChallengeId;
                const isCompleted = completedChallenges.has(challenge.id);
                const isLocked = challenge.locked;

                return (
                  <button
                    key={challenge.id}
                    disabled={isLocked}
                    onClick={() => { onSelect(challenge); onClose(); }}
                    className={`w-full text-left p-4 rounded-2xl border transition-all ${
                      isCurrent
                        ? 'border-indigo-400 dark:border-indigo-500 bg-indigo-50/50 dark:bg-indigo-500/10 shadow-md shadow-indigo-500/10'
                        : isLocked
                          ? 'border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 opacity-50 cursor-not-allowed'
                          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-sm shrink-0`}>
                        {isLocked
                          ? <Lock size={18} weight="bold" className="text-white/70" />
                          : <Icon size={18} weight="bold" className="text-white" />
                        }
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-sm font-extrabold text-gray-900 dark:text-white">
                            {challenge.stage === 0 ? '' : `Stage ${challenge.stage}: `}
                            {challenge.title}
                          </span>
                          {isCompleted && (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-500/20 text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                              Passed
                            </span>
                          )}
                          {isCurrent && !isCompleted && (
                            <span className="px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-500/20 text-[9px] font-bold text-indigo-600 dark:text-indigo-400 uppercase">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2">
                          {challenge.description}
                        </p>

                        {/* Constraints */}
                        {challenge.stage > 0 && (
                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-[10px] font-bold text-gray-400">
                              {formatQPS(challenge.targetQPS)} QPS
                            </span>
                            <span className="text-[10px] text-gray-300">•</span>
                            <span className="text-[10px] font-bold text-gray-400">
                              p99 &lt; {challenge.maxLatencyP99}ms
                            </span>
                            <span className="text-[10px] text-gray-300">•</span>
                            <span className="text-[10px] font-bold text-gray-400">
                              ${formatQPS(challenge.maxBudget)}/mo
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Play icon */}
                      {!isLocked && (
                        <div className="shrink-0 mt-1">
                          <Play size={14} weight="fill" className={isCurrent ? 'text-indigo-500' : 'text-gray-300 dark:text-gray-600'} />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function formatQPS(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toString();
}
