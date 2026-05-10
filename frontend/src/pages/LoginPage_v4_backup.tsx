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

const PlayfulBackground = () => {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none bg-slate-50/50">
      {/* Soft gradient wash */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/80 via-white to-purple-50/80" />

      {/* Floating Pill - Coral */}
      <motion.div
        animate={{ y: ["0%", "-20%", "0%"], rotate: [0, 15, 0], x: ["0%", "5%", "0%"] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[15%] left-[10%] w-32 h-12 rounded-full border-4 border-rose-200 bg-rose-100/50 backdrop-blur-sm"
      />

      {/* Floating Circle - Mint */}
      <motion.div
        animate={{ y: ["0%", "30%", "0%"], rotate: [0, -20, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute bottom-[20%] left-[15%] w-24 h-24 rounded-full bg-emerald-200/40 backdrop-blur-md"
      />

      {/* Floating Triangle - Lavender */}
      <motion.svg
        animate={{ y: ["0%", "-30%", "0%"], rotate: [0, 45, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute top-[25%] right-[15%] w-28 h-28 opacity-60 text-indigo-200"
        viewBox="0 0 100 100" fill="currentColor"
      >
        <path d="M50 10 L90 80 L10 80 Z" strokeLinejoin="round" strokeWidth="6" stroke="currentColor" fill="currentColor" />
      </motion.svg>

      {/* Floating Ring - Sky Blue */}
      <motion.div
        animate={{ y: ["0%", "25%", "0%"], rotate: [0, -30, 0], x: ["0%", "-10%", "0%"] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 3 }}
        className="absolute bottom-[15%] right-[20%] w-20 h-20 rounded-full border-8 border-sky-200/60 backdrop-blur-sm"
      />

      {/* Floating Squiggle - Amber */}
      <motion.svg
        animate={{ y: ["0%", "15%", "0%"], rotate: [0, 10, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut", delay: 5 }}
        className="absolute top-[45%] left-[5%] w-20 h-20 opacity-50 text-amber-300"
        viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round"
      >
        <path d="M10,50 Q25,20 50,50 T90,50" />
      </motion.svg>

      {/* Another Pill - Fuchsia */}
      <motion.div
        animate={{ y: ["0%", "-20%", "0%"], rotate: [45, 20, 45] }}
        transition={{ duration: 19, repeat: Infinity, ease: "easeInOut", delay: 4 }}
        className="absolute top-[55%] right-[8%] w-16 h-40 rounded-full bg-fuchsia-200/30 backdrop-blur-md"
      />
      
      {/* Massive ambient blurred orbs to keep it premium */}
      <motion.div 
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-br from-yellow-100/40 to-rose-100/40 blur-[100px] mix-blend-multiply"
      />
      <motion.div 
        animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute bottom-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-gradient-to-tr from-cyan-100/40 to-indigo-100/40 blur-[100px] mix-blend-multiply"
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
      {/* Playful EdTech Background */}
      <PlayfulBackground />

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

          {isPreEnrollActive && (
            <div className="flex justify-center mb-8">
              <div className="bg-slate-50 p-1 rounded-full inline-flex ring-1 ring-slate-900/5">
                <button
                  type="button"
                  onClick={() => setIsPreEnrollMode(false)}
                  className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all ${!isPreEnrollMode ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Standard
                </button>
                <button
                  type="button"
                  onClick={() => setIsPreEnrollMode(true)}
                  className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all ${isPreEnrollMode ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Guest/Pre-Enroll
                </button>
              </div>
            </div>
          )}

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
