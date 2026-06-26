import React, { useState, useEffect } from 'react';
import DashboardHeader from '../components/DashboardHeader';
import { motion, AnimatePresence } from 'framer-motion';
import { Bus, SignOut, Sun, Moon, UserCircle, BookOpen, Bell, Briefcase, Info } from '@phosphor-icons/react';
import { useTheme } from '../contexts/ThemeContext';
import { notificationsAPI } from '../services/api';
import AdminTransportPanel from '../components/admin/AdminTransportPanel';
import CampusMap from '../components/campus/CampusMap';




const TransportAdminDashboard = ({ navigate, user, onLogout }) => {
  const { isDark, toggle: toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F19] transition-colors duration-300">
      <DashboardHeader 
        user={user} 
        title="TransportAdmin Dashboard" 
        onLogout={onLogout} 
        onProfileClick={() => navigate('faculty-profile')} 
      />


      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 200, damping: 20 }} className="mb-8">
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2">Transport Management</h2>
          <p className="text-base font-medium text-slate-500 dark:text-slate-400">Manage fleet, routes, trips, and GPS devices</p>
        </motion.div>

        <AdminTransportPanel />
      </div>
    </div>
  );
};

export default TransportAdminDashboard;
