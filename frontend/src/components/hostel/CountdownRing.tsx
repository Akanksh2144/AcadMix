import React, { useState, useEffect, useCallback } from 'react';

// ═══════════════════════════════════════════════════════════════════════════════
// COUNTDOWN RING — CSS conic-gradient timer for bed locks
// ═══════════════════════════════════════════════════════════════════════════════

interface CountdownRingProps {
  expiresAt: string;
  onExpired: () => void;
  size?: number;
}

export default function CountdownRing({ expiresAt, onExpired, size = 80 }: CountdownRingProps) {
  const [timeLeft, setTimeLeft] = useState('');
  const [progress, setProgress] = useState(1); // 1 = full, 0 = expired
  const [urgent, setUrgent] = useState(false);

  const totalMs = 10 * 60 * 1000; // 10 minutes

  const tick = useCallback(() => {
    const now = Date.now();
    const target = new Date(expiresAt).getTime();
    const diff = target - now;

    if (diff <= 0) {
      setTimeLeft('EXPIRED');
      setProgress(0);
      onExpired();
      return false;
    }

    const m = Math.floor(diff / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    setTimeLeft(`${m}:${s.toString().padStart(2, '0')}`);
    setProgress(Math.max(0, diff / totalMs));
    setUrgent(diff < 120000); // under 2 min
    return true;
  }, [expiresAt, onExpired, totalMs]);

  useEffect(() => {
    tick();
    const interval = setInterval(() => {
      const shouldContinue = tick();
      if (!shouldContinue) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [tick]);

  const isExpired = timeLeft === 'EXPIRED';
  const strokeColor = isExpired
    ? '#ef4444'
    : urgent
    ? '#ef4444'
    : '#14b8a6'; // teal for normal, red for urgent

  // Conic gradient progress
  const conicGradient = isExpired
    ? 'conic-gradient(#ef4444 0deg, #ef4444 360deg)'
    : `conic-gradient(${strokeColor} ${progress * 360}deg, rgba(148,163,184,0.15) ${progress * 360}deg)`;

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="relative rounded-full flex items-center justify-center"
        style={{
          width: size,
          height: size,
          background: conicGradient,
          padding: '4px',
        }}
      >
        {/* Inner circle */}
        <div className="w-full h-full rounded-full bg-white dark:bg-slate-900 flex items-center justify-center">
          <div className="text-center">
            <span className={`text-lg font-bold ${urgent || isExpired ? 'text-red-500' : 'text-teal-600 dark:text-teal-400'}`}>
              {isExpired ? '⏰' : timeLeft}
            </span>
          </div>
        </div>
      </div>

      <span className={`text-xs font-bold ${
        isExpired ? 'text-red-500' : urgent ? 'text-red-500 animate-pulse' : 'text-teal-600 dark:text-teal-400'
      }`}>
        {isExpired ? 'Lock Expired' : `${timeLeft} remaining`}
      </span>
    </div>
  );
}
