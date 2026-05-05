import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Buildings, SignOut, Sun, Moon, MapPin, Users, ChartLine, Bell } from '@phosphor-icons/react';
import { useTheme } from '../contexts/ThemeContext';
import CampusMap from '../components/campus/CampusMap';
import EventApprovalPanel from '../components/campus/EventApprovalPanel';

const DirectorDashboard = ({ navigate, user, onLogout }: any) => {
  const { isDark, toggle: toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('approvals');

  const tabs = [
    { id: 'approvals', label: '📋 Approvals' },
    { id: 'campus', label: '🗺 Campus Map' },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F19] transition-colors duration-300">
      {/* Header */}
      <header className="glass-header border-b border-slate-200/50 dark:border-slate-800/50">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Buildings size={22} weight="duotone" className="text-white" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">AcadMix</h1>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Director</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={toggleTheme}
              className="p-2.5 rounded-full bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 transition-colors">
              {isDark ? <Sun size={20} weight="duotone" /> : <Moon size={20} weight="duotone" />}
            </motion.button>
            <div className="hidden sm:flex items-center gap-3 bg-slate-50 dark:bg-white/5 rounded-2xl px-4 py-2 border border-slate-100 dark:border-white/5">
              <div className="w-8 h-8 rounded-full bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center">
                <Buildings size={18} weight="duotone" className="text-violet-500" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{user?.name}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{user?.email}</p>
              </div>
            </div>
            <button onClick={onLogout} className="p-2.5 rounded-full bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-500 transition-colors">
              <SignOut size={20} weight="duotone" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Welcome, <span className="gradient-text">{user?.name?.split(' ')[0]}</span>
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Group-level event approvals & campus overview</p>
        </motion.div>

        {/* Tabs */}
        <div className="flex overflow-x-auto gap-1 p-1.5 bg-slate-100 dark:bg-white/[0.04] rounded-xl mb-8 hide-scrollbar">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex-1 justify-center flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap border border-transparent ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 shadow-sm dark:border-indigo-500/25'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}>{tab.label}</button>
          ))}
        </div>

        {activeTab === 'approvals' && <EventApprovalPanel user={user} />}
        {activeTab === 'campus' && <CampusMap user={user} navigate={navigate} />}
      </div>
    </div>
  );
};

export default DirectorDashboard;
