import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap, UserCircle, Lock, Eye, EyeSlash, PaperPlaneTilt, Sun, Moon } from '@phosphor-icons/react';
import { authAPI, formatApiError } from '../services/api';
import { useTheme } from '../contexts/ThemeContext';
import { useTenant } from '../contexts/TenantContext';
import * as Sentry from '@sentry/react';
import { Phone, Hash, Receipt } from '@phosphor-icons/react';
import { useIsPreEnrollOpen } from '../hooks/useCollegeModules';
import { preEnrollAPI } from '../services/api';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

const LoginPage = ({ onLogin }) => {
  const [collegeId, setCollegeId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Pre-enrollment flow states
  const { data: preEnrollStatus } = useIsPreEnrollOpen();
  const isPreEnrollActive = preEnrollStatus?.is_open ?? false;
  const [isPreEnrollMode, setIsPreEnrollMode] = useState(false);
  
  const [admissionNumber, setAdmissionNumber] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [preEnrollToken, setPreEnrollToken] = useState<string | null>(null);
  const { isDark, toggle: toggleTheme } = useTheme();
  const tenant = useTenant();
  // Quick login buttons: ONLY show in local development, NEVER in production
  const showQuickLogin = tenant.isDemo || ['localhost', '127.0.0.1'].includes(window.location.hostname);

  const quickLoginRoles = [
    { role: 'Student', collegeId: '22WJ8A6745', password: '22WJ8A6745', color: 'bg-teal-500 hover:bg-teal-600', icon: '🎓' },
    { role: 'Teacher', collegeId: 'T001', password: 'teacher123', color: 'bg-indigo-500 hover:bg-indigo-600', icon: '👨‍🏫' },
    { role: 'HOD', collegeId: 'HOD001', password: 'hod123', color: 'bg-amber-500 hover:bg-amber-600', icon: '👔' },
    { role: 'Exam Cell', collegeId: 'EC001', password: 'examcell123', color: 'bg-orange-500 hover:bg-orange-600', icon: '📋' },
    { role: 'DHTE Nodal Officer', collegeId: 'nodal@dhte.gov', password: 'nodal123', color: 'bg-emerald-500 hover:bg-emerald-600', icon: '🏛️' },
    { role: 'T&P Officer', collegeId: 'TPO001', password: 'tpo123', color: 'bg-blue-500 hover:bg-blue-600', icon: '💼' },
    { role: 'Alumni', collegeId: 'ALUMNI001', password: 'alumni123', color: 'bg-rose-500 hover:bg-rose-600', icon: '🌟' },
    { role: 'Parent', collegeId: 'PARENT001', password: 'parent123', color: 'bg-cyan-500 hover:bg-cyan-600', icon: '👨‍👩‍👧' },
    { role: 'Industry', collegeId: 'IND001', password: 'industry123', color: 'bg-violet-500 hover:bg-violet-600', icon: '🏢' },
    { role: 'Principal', collegeId: 'PRIN001', password: 'teacher123', color: 'bg-fuchsia-500 hover:bg-fuchsia-600', icon: '🏫' },
    { role: 'Retired Faculty', collegeId: 'RF001', password: 'retired123', color: 'bg-lime-600 hover:bg-lime-700', icon: '🎖️' },
    { role: 'Expert', collegeId: 'EXP001', password: 'expert123', color: 'bg-amber-600 hover:bg-amber-700', icon: '🧠' },
    { role: 'Warden', collegeId: 'WARDEN001', password: 'warden123', color: 'bg-pink-500 hover:bg-pink-600', icon: '🏨' },
    { role: 'Transport', collegeId: 'TRANSPORT001', password: 'transport123', color: 'bg-emerald-600 hover:bg-emerald-700', icon: '🚌' },
    { role: 'Librarian', collegeId: 'LIBRARIAN001', password: 'librarian123', color: 'bg-sky-600 hover:bg-sky-700', icon: '📚' },
    { role: 'Security', collegeId: 'SECURITY001', password: 'security123', color: 'bg-stone-600 hover:bg-stone-700', icon: '🛡️' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    // Normal login
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

  // OTP Request Flow
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

  // OTP Verification Flow
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await preEnrollAPI.verifyOTP({ college_id: collegeId, admission_number: admissionNumber, phone_number: mobileNumber, otp });
      // Store isolated token and hard-redirect to avoid polluting the core Auth User state
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
    } catch (err) {
      setError(formatApiError(err.response?.data?.detail) || err.message || 'Quick login failed');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F19] flex transition-colors duration-300">
      {/* Left panel — Hero */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-teal-300 rounded-full blur-3xl"></div>
        </div>
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.1 }}
          className="relative z-10 flex flex-col justify-center p-16 text-white"
        >
          <div className="mb-8">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.2 }}
              className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6"
            >
              <GraduationCap size={36} weight="duotone" className="text-white" />
            </motion.div>
            <h1 className="text-5xl font-extrabold tracking-tight mb-4">Welcome to<br/>{tenant.tenantName || 'AcadMix'}</h1>
            <p className="text-lg font-medium leading-relaxed text-white/80">
              {tenant.tenantSlug
                ? 'Your complete college management portal'
                : 'Your complete college quiz and results management system'}
            </p>
            {tenant.tenantSlug && (
              <div className="mt-3 inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 text-xs font-bold tracking-wide text-white/70">
                Powered by AcadMix
              </div>
            )}
          </div>
          <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-4">
            {['Take Proctored Quizzes', 'Track Your Performance', 'View Semester Results'].map((text, i) => (
              <motion.div key={i} variants={itemVariants}
                whileHover={{ x: 8, transition: { type: 'spring', stiffness: 400, damping: 17 } }}
                className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-2xl px-5 py-3 cursor-default"
              >
                <div className={`w-2.5 h-2.5 rounded-full ${['bg-teal-300', 'bg-amber-300', 'bg-pink-300'][i]}`}></div>
                <span className="font-bold">{text}</span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Right panel — Form */}
      <div className="flex-1 flex items-center justify-center p-8 relative">
        {/* Theme toggle */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={toggleTheme}
          className="absolute top-6 right-6 p-2.5 rounded-full bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 transition-colors z-10"
          aria-label="Toggle theme"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={isDark ? 'dark' : 'light'} initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
              {isDark ? <Sun size={20} weight="duotone" /> : <Moon size={20} weight="duotone" />}
            </motion.div>
          </AnimatePresence>
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.15 }}
          className="w-full max-w-md"
        >
          <div className="flex items-center justify-center mb-8 lg:hidden">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="w-16 h-16 bg-indigo-500 rounded-2xl flex items-center justify-center"
            >
              <GraduationCap size={36} weight="duotone" className="text-white" />
            </motion.div>
          </div>

          {/* ─── Collab Signature: AcadMix × College ─── */}
          {tenant.tenantSlug && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.05 }}
              className="flex flex-col items-center mb-6"
            >
              <div className="flex items-center gap-4">
                {/* AcadMix Logo */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.2 }}
                  className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 dark:shadow-indigo-500/10"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
                  title="AcadMix"
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6.5 6.5L12 2L17.5 6.5M6.5 6.5L2 12L6.5 17.5M6.5 6.5L12 12M17.5 6.5L22 12L17.5 17.5M17.5 6.5L12 12M6.5 17.5L12 22L17.5 17.5M6.5 17.5L12 12M17.5 17.5L12 12" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </motion.div>

                {/* × Symbol */}
                <motion.span
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.35 }}
                  className="text-xl font-light text-slate-300 dark:text-slate-500 select-none"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  ×
                </motion.span>

                {/* College Logo / Initial Badge */}
                <motion.div
                  initial={{ scale: 0, rotate: 180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.2 }}
                  className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/20 dark:shadow-purple-500/10"
                  style={{ background: 'linear-gradient(135deg, #8b5cf6, #a855f7)' }}
                  title={tenant.tenantName || tenant.tenantSlug?.toUpperCase()}
                >
                  <span className="text-white font-extrabold text-lg tracking-tight">
                    {(tenant.tenantSlug || '').slice(0, 3).toUpperCase()}
                  </span>
                </motion.div>
              </div>

              {/* Collab Label */}
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45, duration: 0.4 }}
                className="mt-3 text-xs font-semibold tracking-widest uppercase text-slate-400 dark:text-slate-500"
              >
                AcadMix <span className="text-indigo-400 dark:text-indigo-500 mx-1">×</span> {tenant.tenantName || tenant.tenantSlug?.toUpperCase()}
              </motion.p>
            </motion.div>
          )}

          <div className="soft-card p-8 sm:p-10">
            <div className="flex justify-between items-center mb-1">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                {isPreEnrollMode ? "Pre-Enrollment" : "Sign In"}
              </h2>
              {isPreEnrollActive && (
                 <button 
                  type="button" 
                  onClick={() => setIsPreEnrollMode(!isPreEnrollMode)}
                  className="text-xs font-bold text-indigo-500 hover:text-indigo-600 bg-indigo-500/10 px-3 py-1.5 rounded-full transition-colors"
                 >
                   {isPreEnrollMode ? "Standard Login" : "Guest Login"}
                 </button>
              )}
            </div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-8">
              {isPreEnrollMode ? "Access hostel booking before student onboarding" : "Enter your credentials to continue"}
            </p>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4 p-3 bg-red-50 dark:bg-red-500/10 rounded-xl text-red-600 dark:text-red-400 text-sm font-medium"
                  data-testid="login-error"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* OTP VERIFICATION VIEW */}
            {isPreEnrollMode && otpSent ? (
              <form onSubmit={handleVerifyOTP} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">Enter OTP</label>
                  <div className="relative">
                    <Lock size={18} weight="duotone" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)}
                      placeholder="6-digit OTP" className="soft-input w-full pl-12 pr-4 tracking-widest" maxLength={6} />
                  </div>
                </div>
                <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.97 }} type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
                  {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <>Verify & Access Hostel <PaperPlaneTilt size={18} weight="duotone" /></>}
                </motion.button>
              </form>
            ) : isPreEnrollMode && !otpSent ? (
              <form onSubmit={handleRequestOTP} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">College Select (ID)</label>
                  <div className="relative">
                    <UserCircle size={18} weight="duotone" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input type="text" value={collegeId} onChange={(e) => setCollegeId(e.target.value.toUpperCase())}
                      placeholder="e.g. 22WJ8A6745" className="soft-input w-full pl-12 pr-4" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">Admission No.</label>
                  <div className="relative">
                    <Receipt size={18} weight="duotone" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input type="text" value={admissionNumber} onChange={(e) => setAdmissionNumber(e.target.value)}
                      placeholder="e.g. ADM2026102" className="soft-input w-full pl-12 pr-4" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">Mobile Number</label>
                  <div className="relative">
                    <Phone size={18} weight="duotone" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input type="text" value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)}
                      placeholder="Linked mobile number" className="soft-input w-full pl-12 pr-4" maxLength={10} />
                  </div>
                </div>
                <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.97 }} type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
                  {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <>Send OTP <PaperPlaneTilt size={18} weight="duotone" /></>}
                </motion.button>
              </form>
            ) : (
               <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">College ID / Roll Number</label>
                  <div className="relative">
                    <UserCircle size={18} weight="duotone" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input data-testid="college-id-input" type="text" value={collegeId} onChange={(e) => setCollegeId(e.target.value.toUpperCase())}
                      placeholder="e.g., 22WJ8A6745, T001, A001" className="soft-input w-full pl-12 pr-4" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">Password</label>
                  <div className="relative">
                    <Lock size={18} weight="duotone" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input data-testid="password-input" type={showPassword ? 'text' : 'password'} value={password}
                      onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" className="soft-input w-full pl-12 pr-12" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" data-testid="toggle-password-visibility">
                      {showPassword ? <EyeSlash size={20} weight="duotone" /> : <Eye size={20} weight="duotone" />}
                    </button>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.97 }}
                  data-testid="login-submit-button" type="submit" disabled={loading}
                  className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <>Sign In <PaperPlaneTilt size={18} weight="duotone" /></>}
                </motion.button>
              </form>
            )}

            {showQuickLogin && (
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200 dark:border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white dark:bg-[#1A202C] px-3 text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">Quick Login{tenant.isDemo ? ' (Demo)' : ''}</span>
                </div>
              </div>

              <motion.div variants={containerVariants} initial="hidden" animate="show" className="mt-5 grid grid-cols-2 gap-3">
                {quickLoginRoles.map((roleData) => (
                  <motion.button
                    key={roleData.role}
                    variants={itemVariants}
                    whileHover={{ scale: 1.03, transition: { type: 'spring', stiffness: 400, damping: 17 } }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleQuickLogin(roleData.collegeId, roleData.password)}
                    disabled={loading}
                    className={`${roleData.color} text-white rounded-2xl px-4 py-3 font-bold text-sm transition-all duration-200 disabled:opacity-60 flex items-center justify-center gap-2 shadow-sm`}
                    data-testid={`quick-login-${roleData.role.toLowerCase().replace(' ', '-')}`}
                  >
                    <span className="text-lg">{roleData.icon}</span>
                    <span>{roleData.role}</span>
                  </motion.button>
                ))}
              </motion.div>

              <p className="mt-4 text-xs text-center font-medium text-slate-400 dark:text-slate-500">Click any role to login instantly</p>
            </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;
