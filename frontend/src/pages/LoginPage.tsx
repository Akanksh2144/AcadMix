import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap, UserCircle, Lock, Eye, EyeSlash, PaperPlaneTilt, Phone, Receipt } from '@phosphor-icons/react';
import { authAPI, formatApiError } from '../services/api';
import { useTenant } from '../contexts/TenantContext';
import { useIsPreEnrollOpen } from '../hooks/useCollegeModules';
import { preEnrollAPI } from '../services/api';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

const KnowledgeNetworkBackground = () => {
  const nodes = [
    { id: 1, x: 10, y: 20 }, { id: 2, x: 80, y: 15 }, { id: 3, x: 45, y: 40 },
    { id: 4, x: 90, y: 60 }, { id: 5, x: 25, y: 75 }, { id: 6, x: 65, y: 85 },
    { id: 7, x: 30, y: 95 }, { id: 8, x: 75, y: 35 }, { id: 9, x: 15, y: 50 },
    { id: 10, x: 55, y: 10 }, { id: 11, x: 5, y: 80 }, { id: 12, x: 95, y: 25 },
    { id: 13, x: 20, y: 35 }, { id: 14, x: 40, y: 20 }, { id: 15, x: 60, y: 25 },
    { id: 16, x: 35, y: 60 }, { id: 17, x: 75, y: 65 }, { id: 18, x: 50, y: 55 },
    { id: 19, x: 85, y: 80 }, { id: 20, x: 10, y: 90 }, { id: 21, x: 45, y: 80 },
    { id: 22, x: 5, y: 40 }, { id: 23, x: 30, y: 10 }, { id: 24, x: 70, y: 5 },
    { id: 25, x: 95, y: 45 }, { id: 26, x: 80, y: 50 }, { id: 27, x: 55, y: 95 },
    { id: 28, x: 15, y: 65 }, { id: 29, x: 90, y: 95 }, { id: 30, x: 40, y: 100 }
  ];
  const connections = [
    [1, 3], [1, 9], [3, 8], [2, 8], [8, 4], [3, 5], [9, 5], [5, 7], 
    [6, 7], [4, 6], [10, 2], [10, 3], [9, 11], [11, 5], [2, 12], [12, 4],
    [1, 13], [13, 14], [14, 3], [14, 10], [10, 15], [15, 2], [15, 8],
    [3, 18], [18, 16], [16, 5], [16, 9], [18, 17], [17, 8], [17, 4],
    [17, 6], [18, 6], [6, 19], [19, 4], [19, 12], [7, 21], [21, 18],
    [21, 6], [21, 27], [27, 7], [27, 19], [11, 20], [20, 7], [9, 22],
    [22, 1], [14, 23], [23, 1], [10, 24], [24, 2], [12, 25], [25, 4],
    [25, 26], [26, 17], [26, 8], [5, 28], [28, 22], [19, 29], [29, 27],
    [21, 30], [30, 7], [30, 27], [13, 3], [15, 3], [16, 13], [28, 16],
    [2, 24], [10, 14], [3, 16], [17, 19], [12, 17], [20, 11], [22, 13]
  ];

  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none bg-slate-50">
      {/* Network Layer 1 - Slow drift */}
      <motion.div 
        animate={{ x: ["-2%", "2%", "-2%"], y: ["-2%", "2%", "-2%"] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-0"
      >
        <svg className="absolute w-full h-full opacity-60">
          {connections.map(([n1, n2], i) => {
            const node1 = nodes.find(n => n.id === n1);
            const node2 = nodes.find(n => n.id === n2);
            if (!node1 || !node2) return null;
            return <line key={`line1-${i}`} x1={`${node1.x}%`} y1={`${node1.y}%`} x2={`${node2.x}%`} y2={`${node2.y}%`} stroke="#818cf8" strokeWidth="1" strokeOpacity="0.15" />
          })}
          {nodes.map(n => (
            <circle key={`node1-${n.id}`} cx={`${n.x}%`} cy={`${n.y}%`} r="3" fill="#818cf8" fillOpacity="0.4" />
          ))}
          {/* Active pulsing nodes */}
          <motion.circle animate={{ r: [3, 6, 3], fillOpacity: [0.4, 0.8, 0.4] }} transition={{ duration: 4, repeat: Infinity }} cx={`${nodes[2].x}%`} cy={`${nodes[2].y}%`} fill="#818cf8" />
          <motion.circle animate={{ r: [3, 5, 3], fillOpacity: [0.4, 0.9, 0.4] }} transition={{ duration: 5, repeat: Infinity, delay: 2 }} cx={`${nodes[7].x}%`} cy={`${nodes[7].y}%`} fill="#c084fc" />
          <motion.circle animate={{ r: [3, 7, 3], fillOpacity: [0.3, 0.9, 0.3] }} transition={{ duration: 3.5, repeat: Infinity, delay: 1 }} cx={`${nodes[15].x}%`} cy={`${nodes[15].y}%`} fill="#38bdf8" />
          <motion.circle animate={{ r: [2, 5, 2], fillOpacity: [0.4, 1, 0.4] }} transition={{ duration: 4.5, repeat: Infinity, delay: 3 }} cx={`${nodes[22].x}%`} cy={`${nodes[22].y}%`} fill="#818cf8" />
          <motion.circle animate={{ r: [3, 6, 3], fillOpacity: [0.3, 0.8, 0.3] }} transition={{ duration: 6, repeat: Infinity, delay: 0.5 }} cx={`${nodes[28].x}%`} cy={`${nodes[28].y}%`} fill="#c084fc" />
        </svg>
      </motion.div>

      {/* Network Layer 2 - Scaled, offset, different color drift */}
      <motion.div 
        animate={{ x: ["2%", "-2%", "2%"], y: ["2%", "-2%", "2%"], scale: 1.5, rotate: 5 }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-0 origin-center"
      >
        <svg className="absolute w-full h-full opacity-30">
          {connections.map(([n1, n2], i) => {
            const node1 = nodes.find(n => n.id === n1);
            const node2 = nodes.find(n => n.id === n2);
            if (!node1 || !node2) return null;
            return <line key={`line2-${i}`} x1={`${node1.x}%`} y1={`${node1.y}%`} x2={`${node2.x}%`} y2={`${node2.y}%`} stroke="#c084fc" strokeWidth="1" strokeOpacity="0.2" />
          })}
          {nodes.map(n => (
            <circle key={`node2-${n.id}`} cx={`${n.x}%`} cy={`${n.y}%`} r="4" fill="#c084fc" fillOpacity="0.3" />
          ))}
        </svg>
      </motion.div>

      {/* Soft overlay gradient to ensure text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-50/80"></div>
      
      {/* Animated Ambient Orbs for premium SaaS feel */}
      <motion.div 
        animate={{ x: [0, 40, 0], y: [0, -30, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[-5%] right-[-5%] w-[40vw] h-[40vw] rounded-full bg-gradient-to-br from-indigo-400/10 to-purple-400/10 blur-[100px]"
      />
      <motion.div 
        animate={{ x: [0, -40, 0], y: [0, 50, 0] }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-[-10%] left-[-10%] w-[45vw] h-[45vw] rounded-full bg-gradient-to-tr from-cyan-400/10 to-blue-500/10 blur-[120px]"
      />
    </div>
  );
};

const LoginPage = ({ onLogin }) => {
  const [collegeId, setCollegeId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { data: preEnrollStatus } = useIsPreEnrollOpen();
  const isPreEnrollActive = preEnrollStatus?.is_open ?? false;
  const [isPreEnrollMode, setIsPreEnrollMode] = useState(false);
  
  const [admissionNumber, setAdmissionNumber] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  
  const tenant = useTenant();
  const showQuickLogin = tenant.isDemo || ['localhost', '127.0.0.1'].includes(window.location.hostname);

  const quickLoginRoles = [
    { role: 'Student', collegeId: '22WJ8A6745', password: '22WJ8A6745', color: 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700', icon: '🎓' },
    { role: 'Teacher', collegeId: 'T001', password: 'teacher123', color: 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700', icon: '👨‍🏫' },
    { role: 'HOD', collegeId: 'HOD001', password: 'hod123', color: 'bg-amber-50 hover:bg-amber-100 text-amber-700', icon: '👔' },
    { role: 'Principal', collegeId: 'PRIN001', password: 'teacher123', color: 'bg-purple-50 hover:bg-purple-100 text-purple-700', icon: '🏫' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    if (!isPreEnrollMode) {
      try {
        const { data } = await authAPI.login(collegeId, password);
        onLogin(data);
      } catch (err: any) {
        setError(formatApiError(err.response?.data?.detail) || err.message || 'Login failed');
      }
      setLoading(false);
      return;
    }
  };

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!collegeId || !admissionNumber || !mobileNumber) {
      setError("Please fill all fields");
      return;
    }
    setError('');
    setLoading(true);
    try {
      await preEnrollAPI.requestOTP({ college_id: collegeId, admission_number: admissionNumber, phone_number: mobileNumber });
      setOtpSent(true);
    } catch (err: any) {
      setError(formatApiError(err.response?.data?.detail) || 'Failed to send OTP');
    }
    setLoading(false);
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await preEnrollAPI.verifyOTP({ college_id: collegeId, admission_number: admissionNumber, phone_number: mobileNumber, otp });
      sessionStorage.setItem('pre_enroll_token', data.access_token);
      window.location.href = "/pre-enroll/hostel";
    } catch (err: any) {
      setError(formatApiError(err.response?.data?.detail) || 'Invalid OTP');
    }
    setLoading(false);
  };

  const handleQuickLogin = async (id, pass) => {
    setError('');
    setLoading(true);
    try {
      const { data } = await authAPI.login(id, pass);
      onLogin(data);
    } catch (err: any) {
      setError(formatApiError(err.response?.data?.detail) || err.message || 'Quick login failed');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* EdTech Knowledge Network Background */}
      <KnowledgeNetworkBackground />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 24 }}
        className="w-full max-w-[440px] relative z-10"
      >
        {/* Collab Signature */}
        <div className="flex flex-col items-center justify-center mb-8 mt-2">
          {tenant.tenantSlug ? (
            <div className="flex items-center gap-5">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
                className="bg-transparent rounded-xl transition-all duration-300"
              >
                <img
                  src="/logos/acadmix-wordmark.png"
                  alt="AcadMix"
                  className="h-12 sm:h-14 w-auto object-contain drop-shadow-sm transition-all duration-300"
                />
              </motion.div>

              <motion.span
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.2 }}
                className="text-2xl sm:text-3xl font-extralight text-slate-400 select-none"
              >
                ×
              </motion.span>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
                className="flex items-center justify-center transition-all duration-300"
              >
                <img
                  src={`/logos/${tenant.tenantSlug}-emblem.png`}
                  alt={tenant.tenantName || tenant.tenantSlug}
                  className="h-10 sm:h-12 w-auto object-contain"
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.style.display = 'none';
                    const fallback = target.nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
                <div
                  className="h-10 w-10 sm:h-12 sm:w-12 rounded-full items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-500"
                  style={{ display: 'none' }}
                >
                  <span className="text-white font-bold text-sm tracking-tight">
                    {tenant.tenantSlug.slice(0, 4).toUpperCase()}
                  </span>
                </div>
              </motion.div>
            </div>
          ) : (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
              className={`flex items-center justify-center w-20 h-20 rounded-[1.5rem] shadow-xl shadow-slate-900/5 ring-1 ring-slate-900/5 bg-white mb-6 ${tenant.logo ? 'p-2' : 'p-0'}`}
            >
              {tenant.logo ? (
                <img src={tenant.logo} alt="Logo" className="w-full h-full object-contain rounded-xl" />
              ) : (
                <GraduationCap size={40} weight="duotone" className="text-indigo-600" />
              )}
            </motion.div>
          )}

          <h1 className={`text-2xl font-extrabold tracking-tight text-slate-900 text-center mb-2 ${tenant.tenantSlug ? 'mt-6' : ''}`}>
            Welcome to {tenant.tenantName || 'AcadMix'}
          </h1>
          <p className="text-sm font-medium text-slate-500 text-center">
            {isPreEnrollMode ? "Pre-Enrollment Access" : "Sign in to access your dashboard"}
          </p>
        </div>

        {/* The Card */}
        <div className="bg-white rounded-3xl shadow-[0_8px_40px_-12px_rgba(0,0,0,0.1)] ring-1 ring-slate-900/5 p-8 relative overflow-hidden">
          
          {/* Subtle Top Gradient Bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 opacity-80"></div>


          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: 'auto', marginBottom: 20 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                className="overflow-hidden"
              >
                <div className="p-3.5 bg-rose-50 rounded-2xl border border-rose-100 text-rose-600 text-sm font-semibold flex items-center justify-center text-center">
                  {error}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <AnimatePresence mode="wait">
            <motion.div
              key={isPreEnrollMode ? (otpSent ? 'otp' : 'pre-enroll') : 'standard'}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {isPreEnrollMode && otpSent ? (
                <form onSubmit={handleVerifyOTP} className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 ml-1">Enter OTP</label>
                    <div className="relative group">
                      <Lock size={18} weight="duotone" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                      <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)}
                        placeholder="6-digit code" className="w-full bg-slate-50 border-0 ring-1 ring-slate-900/5 focus:ring-2 focus:ring-indigo-500 rounded-2xl py-3 pl-11 pr-4 text-slate-900 text-sm font-medium transition-all !outline-none" maxLength={6} />
                    </div>
                  </div>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" disabled={loading} className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-2xl py-3.5 text-sm font-bold shadow-lg shadow-slate-900/20 transition-all flex items-center justify-center gap-2">
                    {loading ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : <>Verify Access <PaperPlaneTilt size={16} weight="bold" /></>}
                  </motion.button>
                </form>
              ) : isPreEnrollMode && !otpSent ? (
                <form onSubmit={handleRequestOTP} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 ml-1">College ID</label>
                    <div className="relative group">
                      <UserCircle size={18} weight="duotone" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                      <input type="text" value={collegeId} onChange={(e) => setCollegeId(e.target.value.toUpperCase())}
                        placeholder="e.g. 22WJ8A6745" className="w-full bg-slate-50 border-0 ring-1 ring-slate-900/5 focus:ring-2 focus:ring-indigo-500 rounded-2xl py-3 pl-11 pr-4 text-slate-900 text-sm font-medium transition-all !outline-none" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 ml-1">Admission No.</label>
                    <div className="relative group">
                      <Receipt size={18} weight="duotone" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                      <input type="text" value={admissionNumber} onChange={(e) => setAdmissionNumber(e.target.value)}
                        placeholder="e.g. ADM2026102" className="w-full bg-slate-50 border-0 ring-1 ring-slate-900/5 focus:ring-2 focus:ring-indigo-500 rounded-2xl py-3 pl-11 pr-4 text-slate-900 text-sm font-medium transition-all !outline-none" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 ml-1">Mobile Number</label>
                    <div className="relative group">
                      <Phone size={18} weight="duotone" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                      <input type="text" value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)}
                        placeholder="Linked mobile number" className="w-full bg-slate-50 border-0 ring-1 ring-slate-900/5 focus:ring-2 focus:ring-indigo-500 rounded-2xl py-3 pl-11 pr-4 text-slate-900 text-sm font-medium transition-all !outline-none" maxLength={10} />
                    </div>
                  </div>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" disabled={loading} className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-2xl py-3.5 text-sm font-bold shadow-lg shadow-slate-900/20 transition-all flex items-center justify-center gap-2 mt-2">
                    {loading ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : <>Send OTP <PaperPlaneTilt size={16} weight="bold" /></>}
                  </motion.button>
                </form>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 ml-1">College ID</label>
                    <div className="relative group">
                      <UserCircle size={18} weight="duotone" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                      <input type="text" value={collegeId} onChange={(e) => setCollegeId(e.target.value.toUpperCase())}
                        placeholder="Enter Roll Number or ID" className="w-full bg-slate-50 border-0 ring-1 ring-slate-900/5 focus:ring-2 focus:ring-indigo-500 rounded-2xl py-3.5 pl-11 pr-4 text-slate-900 text-sm font-semibold transition-all !outline-none placeholder:text-slate-400 placeholder:font-medium" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center ml-1">
                      <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400">Password</label>
                      <a href="#" className="text-[11px] font-bold text-indigo-500 hover:text-indigo-600">Forgot?</a>
                    </div>
                    <div className="relative group">
                      <Lock size={18} weight="duotone" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                      <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter Password" className="w-full bg-slate-50 border-0 ring-1 ring-slate-900/5 focus:ring-2 focus:ring-indigo-500 rounded-2xl py-3.5 pl-11 pr-12 text-slate-900 text-sm font-semibold transition-all !outline-none placeholder:text-slate-400 placeholder:font-medium" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 transition-colors rounded-xl hover:bg-slate-200/50">
                        {showPassword ? <EyeSlash size={18} weight="bold" /> : <Eye size={18} weight="bold" />}
                      </button>
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit" disabled={loading}
                    className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white rounded-2xl py-3.5 text-sm font-bold shadow-sm shadow-indigo-500/10 transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {loading ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : <>Sign In <PaperPlaneTilt size={16} weight="bold" /></>}
                  </motion.button>
                </form>
              )}
            </motion.div>
          </AnimatePresence>

          {isPreEnrollActive && (
            <div className="mt-6 text-center">
              {!isPreEnrollMode ? (
                <button 
                  type="button" 
                  onClick={() => setIsPreEnrollMode(true)}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-500 transition-colors flex items-center justify-center gap-1 mx-auto"
                >
                  Looking for Hostel Booking? Proceed here <span className="text-lg leading-none">&rarr;</span>
                </button>
              ) : (
                <button 
                  type="button" 
                  onClick={() => setIsPreEnrollMode(false)}
                  className="text-xs font-bold text-slate-500 hover:text-slate-700 transition-colors flex items-center justify-center gap-1 mx-auto"
                >
                  <span className="text-lg leading-none">&larr;</span> Back to Standard Login
                </button>
              )}
            </div>
          )}

          {showQuickLogin && (
            <div className="mt-8 pt-6 border-t border-slate-100">
              <div className="text-center mb-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Quick Access Demo</span>
              </div>
              <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-2 gap-2">
                {quickLoginRoles.map((roleData) => (
                  <motion.button
                    key={roleData.role}
                    variants={itemVariants}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => handleQuickLogin(roleData.collegeId, roleData.password)}
                    disabled={loading}
                    className={`${roleData.color} rounded-xl px-3 py-2.5 text-xs font-bold transition-all disabled:opacity-60 flex items-center justify-center gap-2`}
                  >
                    <span className="text-sm">{roleData.icon}</span>
                    <span>{roleData.role}</span>
                  </motion.button>
                ))}
              </motion.div>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <p className="text-center mt-8 text-xs font-semibold text-slate-400">
          Secure Access • {new Date().getFullYear()} AcadMix
        </p>
      </motion.div>
    </div>
  );
};

export default LoginPage;
