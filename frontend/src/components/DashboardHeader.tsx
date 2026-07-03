import React, { useState, useEffect, useMemo } from 'react';
import { Bank, Bell, Sun, Moon, CloudSun, SignOut, Info, Briefcase, UserCircle, CaretDown } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';
import Avatar from 'boring-avatars';
import { useTheme } from '../contexts/ThemeContext';
import { notificationsAPI } from '../services/api';

const getInitials = (name?: string) => {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return parts[0][0].toUpperCase();
};

const getProfessionalGradient = (name?: string) => {
  if (!name) return 'from-indigo-500 to-purple-600';
  const gradients = [
    'from-indigo-500 to-purple-600',
    'from-blue-500 to-indigo-600',
    'from-emerald-500 to-teal-600',
    'from-violet-500 to-fuchsia-600',
    'from-slate-600 to-slate-800',
    'from-cyan-500 to-blue-600',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % gradients.length;
  return gradients[index];
};

/**
 * Reusable Dashboard Header matching the premium UI pattern.
 * Squircle buttons (rounded-2xl) and a fully pill-shaped profile container.
 */
const DashboardHeader = ({ user, title, onLogout, onProfileClick }) => {
  const { isDark, toggle: toggleTheme } = useTheme();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [imgFailed, setImgFailed] = useState(false);

  // Poll notifications
  useEffect(() => {
    const fetchNotifs = () => {
      notificationsAPI.getAll({ limit: 10 }).then(res => {
        setNotifications(res.data.data || []);
        setUnreadCount(res.data.unread_count || 0);
      }).catch(() => {});
    };
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 60000); // 1 minute
    return () => clearInterval(interval);
  }, []);

  const handleMarkAllRead = () => {
    notificationsAPI.markAllRead().then(() => {
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setShowNotifications(false);
    });
  };

  const formatTime = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    const now = new Date();
    const diff = Math.floor((now - d) / 60000);
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  const iconBaseClass = "w-11 h-11 flex items-center justify-center rounded-2xl bg-slate-50/80 border border-slate-200 shadow-sm hover:bg-slate-100 dark:bg-[#1A202C] dark:border-slate-700 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-all cursor-pointer";

  // Generate a random seed for the boring avatar per session
  const sessionAvatarSeed = useMemo(() => {
    const key = 'student_avatar_seed';
    let seed = sessionStorage.getItem(key);
    if (!seed) {
      seed = Math.random().toString(36).substring(7);
      sessionStorage.setItem(key, seed);
    }
    return seed;
  }, []);

  return (
    <header className="glass-header z-40 relative">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        {/* Left: Logo & Title */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
            <Bank size={22} weight="duotone" className="text-white" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              AcadMix
            </h1>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
              {title}
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className={
                unreadCount > 0
                  ? "w-11 h-11 flex items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 border border-indigo-400 text-white shadow-md shadow-indigo-500/25 hover:from-indigo-600 hover:to-indigo-700 cursor-pointer transition-all relative"
                  : "w-11 h-11 flex items-center justify-center rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100/90 dark:from-white/[0.03] dark:to-white/[0.01] border border-slate-200/60 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:shadow-sm cursor-pointer transition-all"
              }
              aria-label="Notifications"
            >
              <Bell size={20} weight={showNotifications || unreadCount > 0 ? "fill" : "duotone"} />
              {unreadCount > 0 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center border-2 border-white dark:border-[#0B0F19]">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </div>
              )}
            </button>

            <AnimatePresence>
              {showNotifications && (
                <>
                  <div className="fixed inset-0 z-[60]" onClick={() => setShowNotifications(false)}></div>
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    className="fixed top-16 right-4 sm:right-8 z-[61] w-80 sm:w-96 bg-white dark:bg-[#1A202C] rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden"
                  >
                    <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <h4 className="font-extrabold text-slate-800 dark:text-slate-100">Notifications</h4>
                      <button onClick={handleMarkAllRead} className="text-xs font-bold text-indigo-500 hover:text-indigo-600 transition-colors">Mark all as read</button>
                    </div>
                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-50 dark:divide-slate-800/50">
                      {notifications.length === 0 ? (
                        <div className="px-5 py-8 text-center text-sm text-slate-400">No notifications yet</div>
                      ) : notifications.map((item) => (
                        <div key={item.id} className={`flex items-start gap-3 px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors ${!item.is_read ? 'bg-indigo-50/30 dark:bg-indigo-500/5' : ''}`}>
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${item.type === 'alert' ? 'bg-rose-50 dark:bg-rose-500/15' : 'bg-indigo-50 dark:bg-indigo-500/15'}`}>
                            <Info size={14} weight="duotone" className={item.type === 'alert' ? 'text-rose-500' : 'text-indigo-500'} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">{item.title}</p>
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">{item.message}</p>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1.5 block">{formatTime(item.created_at)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Theme Toggle Switch */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleTheme}
            className={`relative w-20 h-11 rounded-full overflow-hidden transition-all duration-500 cursor-pointer shadow-inner border flex-shrink-0 ${
              isDark 
                ? "bg-slate-950 border-slate-800 shadow-slate-950/50" 
                : "bg-gradient-to-r from-sky-400 to-sky-300 border-sky-200"
            }`}
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {/* Light Mode Scene: Clouds */}
            <div className={`absolute inset-0 transition-opacity duration-500 pointer-events-none ${isDark ? 'opacity-0' : 'opacity-100'}`}>
              <svg className="absolute bottom-[-4px] right-[-2px] w-12 h-8 text-white/80" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.36 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.64-4.96z" />
              </svg>
              <svg className="absolute bottom-[2px] right-[14px] w-9 h-6 text-white/50" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.36 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.64-4.96z" />
              </svg>
            </div>

            {/* Dark Mode Scene: Stars */}
            <div className={`absolute inset-0 transition-opacity duration-500 pointer-events-none ${isDark ? 'opacity-100' : 'opacity-0'}`}>
              <div className="absolute top-2.5 left-3 w-0.5 h-0.5 bg-white rounded-full animate-pulse"></div>
              <div className="absolute top-6 left-6 w-0.5 h-0.5 bg-white/80 rounded-full"></div>
              <div className="absolute top-3.5 left-9 w-1 h-1 bg-white/40 rounded-full"></div>
              <svg className="absolute top-2 left-6 w-2 h-2 text-white animate-pulse" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0L14.6 9.4L24 12L14.6 14.6L12 24L9.4 14.6L0 12L9.4 9.4Z" />
              </svg>
              <svg className="absolute top-6 left-2 w-1.5 h-1.5 text-white/70" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0L14.6 9.4L24 12L14.6 14.6L12 24L9.4 14.6L0 12L9.4 9.4Z" />
              </svg>
            </div>

            {/* Knob: Sun/Moon */}
            <div 
              className={`absolute top-[3px] left-[3px] w-8 h-8 rounded-full transition-transform duration-500 ease-in-out ${
                isDark ? 'transform translate-x-[42px]' : 'transform translate-x-0'
              }`}
            >
              {/* Sun Knob */}
              <div className={`absolute inset-0 rounded-full transition-opacity duration-500 bg-gradient-to-br from-amber-300 to-yellow-500 shadow-[0_0_12px_rgba(245,158,11,0.6)] ${isDark ? 'opacity-0' : 'opacity-100'}`}>
                <div className="absolute inset-1 rounded-full border border-yellow-200/30"></div>
              </div>

              {/* Moon Knob */}
              <div className={`absolute inset-0 rounded-full transition-opacity duration-500 bg-gradient-to-br from-slate-100 to-slate-200 shadow-[0_0_10px_rgba(255,255,255,0.4)] ${isDark ? 'opacity-100' : 'opacity-0'}`}>
                <div className="absolute top-1.5 left-2 w-1.5 h-1.5 rounded-full bg-slate-400/35"></div>
                <div className="absolute bottom-2.5 left-3 w-1 h-1 rounded-full bg-slate-400/30"></div>
                <div className="absolute top-3.5 right-2.5 w-2 h-2 rounded-full bg-slate-400/35 shadow-inner"></div>
              </div>
            </div>
          </motion.button>

          {/* User Profile Card */}
          <button
            onClick={onProfileClick}
            className="hidden sm:flex items-center gap-3 h-11 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 hover:opacity-95 active:scale-[0.98] transition-all rounded-2xl p-1 pr-5 cursor-pointer shadow-md shadow-indigo-500/10 hover:shadow-indigo-500/20"
          >
            <div className="w-9 h-9 rounded-[10px] overflow-hidden flex items-center justify-center bg-white/15 border border-white/20 flex-shrink-0">
              {user?.role === 'student' ? (
                <Avatar 
                  size={36} 
                  name={sessionAvatarSeed} 
                  variant="beam" 
                  colors={['#6366f1', '#14b8a6', '#8b5cf6', '#06b6d4', '#34d399']} 
                />
              ) : (
                <span className="text-white font-black text-xs tracking-wider uppercase">
                  {getInitials(user?.name)}
                </span>
              )}
            </div>
            <div className="text-left">
              <p className="text-[14px] font-black text-white leading-tight">
                {user?.name || "User"}
              </p>
              <p className="text-[10px] font-extrabold text-indigo-100/90 dark:text-indigo-100/90 uppercase tracking-widest mt-0.5">
                {user?.designation || user?.role?.replace('_', ' ') || "Role"}
              </p>
            </div>
            <CaretDown size={14} weight="bold" className="text-white/80 ml-1 flex-shrink-0" />
          </button>
          
          <button
            onClick={onProfileClick}
            className={`sm:hidden ${iconBaseClass} text-indigo-500`}
            aria-label="Profile Menu"
          >
            <UserCircle size={22} weight="duotone" />
          </button>

          {/* Sign Out */}
          <button 
            onClick={onLogout} 
            className="w-11 h-11 flex items-center justify-center rounded-2xl bg-gradient-to-br from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white shadow-md shadow-rose-600/10 border border-rose-500/10 cursor-pointer transition-all"
            title="Sign Out"
          >
            <SignOut size={20} weight="duotone" />
          </button>
          
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
