import React from 'react';

export function Loader({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg', className?: string }) {
  const sizeMap = {
    sm: 'w-6 h-6 border-2',
    md: 'w-10 h-10 border-3',
    lg: 'w-16 h-16 border-4'
  };

  return (
    <div className={`relative ${sizeMap[size]} ${className}`}>
      {/* Outer subtle ring */}
      <div className="absolute inset-0 rounded-full border-indigo-500/10 border-inherit"></div>
      {/* Animated sweep gradient ring */}
      <div className="absolute inset-0 rounded-full border-transparent border-t-indigo-500 border-r-purple-500 border-inherit animate-spin" style={{ animationDuration: '0.8s' }}></div>
      {/* Inner pulsing glass orb */}
      <div className={`absolute inset-1.5 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 opacity-75 animate-pulse`}></div>
    </div>
  );
}

export function LoadingScreen({ message = 'Loading' }: { message?: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC] dark:bg-[#0B0F19] transition-all">
      <div className="relative flex flex-col items-center p-8 rounded-[32px] bg-white/40 dark:bg-white/[0.02] backdrop-blur-md border border-white/40 dark:border-white/5 shadow-2xl shadow-indigo-500/5">
        <Loader size="lg" />
        
        {/* Elegant Loading Brand Text */}
        <div className="mt-6 flex flex-col items-center">
          <span className="text-[10px] font-black tracking-[0.2em] text-slate-400 dark:text-slate-500 uppercase animate-pulse">{message}</span>
          <span className="text-sm font-black bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent uppercase tracking-[0.15em] mt-1.5 font-premium">AcadMix</span>
        </div>
      </div>
    </div>
  );
}
