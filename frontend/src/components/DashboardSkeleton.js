import React from 'react';

const Shimmer = ({ className = '' }) => (
  <div className={`skeleton-shimmer rounded-2xl ${className}`} />
);

const DashboardSkeleton = () => (
  <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F19]">
    {/* Header skeleton */}
    <div className="bg-white/70 dark:bg-[#131825]/80 backdrop-blur-xl border-b border-slate-100/50 dark:border-white/5 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Shimmer className="w-10 h-10 !rounded-xl" />
          <div>
            <Shimmer className="w-24 h-5 mb-1.5" />
            <Shimmer className="w-16 h-3" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Shimmer className="w-10 h-10 !rounded-full" />
          <Shimmer className="w-36 h-10 hidden sm:block" />
          <Shimmer className="w-10 h-10 !rounded-full" />
        </div>
      </div>
    </div>

    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* Greeting skeleton */}
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <Shimmer className="w-80 h-10 sm:h-12 mb-2" />
          <Shimmer className="w-56 h-4" />
        </div>
        <Shimmer className="w-40 h-20 !rounded-3xl" />
      </div>

      {/* Stat cards skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-[#1A202C] rounded-3xl border border-slate-100/50 dark:border-white/5 p-4 sm:p-6" style={{ boxShadow: '0 8px 30px rgb(0 0 0 / 0.04)' }}>
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <Shimmer className="w-20 h-3" />
              <Shimmer className="w-9 h-9 !rounded-xl" />
            </div>
            <Shimmer className="w-16 h-8 mb-1.5" />
            <Shimmer className="w-24 h-3" />
          </div>
        ))}
      </div>

      {/* Quick access skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 mb-6 sm:mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-[#1A202C] rounded-3xl border border-slate-100/50 dark:border-white/5 p-4 sm:p-6 flex items-center gap-3 sm:gap-4" style={{ boxShadow: '0 8px 30px rgb(0 0 0 / 0.04)' }}>
            <Shimmer className="w-10 h-10 sm:w-12 sm:h-12 !rounded-xl flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <Shimmer className="w-full h-4 mb-1.5" />
              <Shimmer className="w-2/3 h-3" />
            </div>
          </div>
        ))}
      </div>

      {/* Bottom grid skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {[...Array(3)].map((_, i) => (
          <div key={i} className={`bg-white dark:bg-[#1A202C] rounded-3xl border border-slate-100/50 dark:border-white/5 p-5 sm:p-6 ${i === 2 ? 'bg-gradient-to-br from-indigo-500/10 to-purple-600/10' : ''}`} style={{ boxShadow: '0 8px 30px rgb(0 0 0 / 0.04)' }}>
            <div className="flex items-center gap-2 mb-5">
              <Shimmer className="w-5 h-5 !rounded-lg" />
              <Shimmer className="w-28 h-5" />
            </div>
            <div className="space-y-3">
              {[...Array(4)].map((_, j) => (
                <div key={j} className="flex items-center gap-3">
                  <Shimmer className="w-8 h-8 !rounded-lg flex-shrink-0" />
                  <div className="flex-1">
                    <Shimmer className="w-full h-3 mb-1" />
                    <Shimmer className="w-1/2 h-2.5" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default DashboardSkeleton;
