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
  'var(--ink-light)',
  'var(--accent-green)',
  'var(--accent-blue)',
  'var(--accent-orange)',
  'var(--accent-teal)',
  'var(--accent-purple)',
  'var(--accent-red)',
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
            className="fixed left-0 top-0 bottom-0 z-[201] w-full max-w-md bg-[var(--paper-alt)] border-r border-[var(--ink-border)] shadow-2xl flex flex-col "
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--ink-border)] shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl border border-[var(--ink-border)] bg-[var(--paper-node)] flex items-center justify-center">
                  <Trophy size={24} weight="fill" className="text-[var(--ink)]" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-[var(--ink)] leading-none">Challenges</h2>
                  <p className="text-base font-bold text-[var(--ink-light)]">Scale from 1 to 1 billion users</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-[var(--paper-node)] transition-colors border border-transparent hover:border-[var(--ink-border)]"
              >
                <X size={20} weight="bold" className="text-[var(--ink-light)]" />
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
                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                      isCurrent
                        ? 'border-[var(--ink)] bg-[var(--paper-node)] shadow-sm'
                        : isLocked
                          ? 'border-[var(--ink-border)] bg-[var(--paper)] opacity-50 cursor-not-allowed'
                          : 'border-[var(--ink-border)] bg-[var(--paper-node)] hover:border-[var(--ink)] hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className="w-10 h-10 rounded-xl border border-[var(--ink-border)] bg-[var(--paper-alt)] flex items-center justify-center shrink-0">
                        {isLocked
                          ? <Lock size={20} weight="bold" className="text-[var(--ink-light)]" />
                          : <Icon size={24} weight="fill" style={{ color }} />
                        }
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-lg font-bold text-[var(--ink)]">
                            {challenge.stage === 0 ? '' : `Stage ${challenge.stage}: `}
                            {challenge.title}
                          </span>
                          {isCompleted && (
                            <span className="px-2 py-0.5 rounded-md bg-[var(--paper-alt)] border border-[var(--accent-green)] text-[10px] font-bold text-[var(--accent-green)] uppercase">
                              Passed
                            </span>
                          )}
                          {isCurrent && !isCompleted && (
                            <span className="px-2 py-0.5 rounded-md bg-[var(--paper-alt)] border border-[var(--ink)] text-[10px] font-bold text-[var(--ink)] uppercase">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-[var(--ink-light)] font-bold leading-relaxed line-clamp-2">
                          {challenge.description}
                        </p>

                        {/* Constraints */}
                        {challenge.stage > 0 && (
                          <div className="flex items-center gap-3 mt-2 font-bold">
                            <span className="text-xs text-[var(--ink-light)]">
                              {formatQPS(challenge.targetQPS)} QPS
                            </span>
                            <span className="text-[10px] text-[var(--ink-faint)]">•</span>
                            <span className="text-xs text-[var(--ink-light)]">
                              p99 &lt; {challenge.maxLatencyP99}ms
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Play icon */}
                      {!isLocked && (
                        <div className="shrink-0 mt-1">
                          <Play size={16} weight="fill" className={isCurrent ? 'text-[var(--ink)]' : 'text-[var(--ink-light)]'} />
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
