import React, { useEffect, useRef } from 'react';
import { authAPI } from '../../services/api';

interface IdleTimerProps {
  user: any;
  onLogout: () => void;
}

const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const HEARTBEAT_THROTTLE_MS = 2 * 60 * 1000; // 2 minutes

const IdleTimer: React.FC<IdleTimerProps> = ({ user, onLogout }) => {
  const logoutTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastHeartbeatRef = useRef<number>(0);

  // Cross-tab sync relies purely on localStorage
  const forceLogout = () => {
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
    onLogout();
  };

  const syncHeartbeat = async () => {
    const now = Date.now();
    // Validate cross-tab cooldowns natively before execution
    const cachedActivity = parseInt(localStorage.getItem('lastHeartbeatActivity') || '0', 10);
    
    if (now - cachedActivity >= HEARTBEAT_THROTTLE_MS) {
      if (now - lastHeartbeatRef.current >= HEARTBEAT_THROTTLE_MS) {
        lastHeartbeatRef.current = now;
        localStorage.setItem('lastHeartbeatActivity', now.toString());
        try {
          await authAPI.heartbeat();
        } catch (error) {
          // If the backend forcefully kicked us out with 401 via sliding expiration, api.js will catch it.
        }
      }
    }
  };

  const handleActivity = () => {
    if (!user) return;
    
    const now = Date.now();
    localStorage.setItem('lastIdleActivity', now.toString());
    
    resetTimers(now);
    syncHeartbeat();
  };

  const resetTimers = (timestamp: number) => {
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
    
    const elapsed = Date.now() - timestamp;
    const remaining = IDLE_TIMEOUT_MS - elapsed;
    
    if (remaining <= 0) {
      forceLogout();
    } else {
      logoutTimerRef.current = setTimeout(forceLogout, remaining);
    }
  };

  useEffect(() => {
    if (!user) {
      if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
      return;
    }

    const events = ['wheel', 'pointerdown', 'pointermove', 'touchstart', 'touchmove', 'keydown'];
    
    const activityListener = () => handleActivity();
    const visibilityListener = () => {
      if (document.visibilityState === 'visible') {
        handleActivity();
      }
    };
    
    // Listen for storage events to synchronize explicit tab interactions actively
    const storageListener = (e: StorageEvent) => {
      if (e.key === 'lastIdleActivity' && e.newValue) {
        resetTimers(parseInt(e.newValue, 10));
      }
    };

    events.forEach(e => window.addEventListener(e, activityListener, { passive: true }));
    document.addEventListener('visibilitychange', visibilityListener);
    window.addEventListener('storage', storageListener);

    // Initial boundary checks mapping execution 
    handleActivity();

    return () => {
      events.forEach(e => window.removeEventListener(e, activityListener));
      document.removeEventListener('visibilitychange', visibilityListener);
      window.removeEventListener('storage', storageListener);
      if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
    };
  }, [user]);

  return null; // Headless component orchestrating passive executions
};

export default IdleTimer;
