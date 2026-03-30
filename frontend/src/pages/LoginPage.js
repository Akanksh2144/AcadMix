import React, { useState } from 'react';
import { GraduationCap, UserCircle, Lock, Eye, EyeSlash, PaperPlaneTilt } from '@phosphor-icons/react';

const LoginPage = ({ onLogin }) => {
  const [loginMethod, setLoginMethod] = useState('password');
  const [collegeId, setCollegeId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (collegeId.startsWith('T')) onLogin('teacher');
    else if (collegeId.startsWith('A')) onLogin('admin');
    else onLogin('student');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      {/* Left Side - Hero */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-teal-300 rounded-full blur-3xl"></div>
        </div>
        <div className="relative z-10 flex flex-col justify-center p-16 text-white">
          <div className="mb-8">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6">
              <GraduationCap size={36} weight="duotone" className="text-white" />
            </div>
            <h1 className="text-5xl font-extrabold tracking-tight mb-4">Welcome to<br/>QuizPortal</h1>
            <p className="text-lg font-medium leading-relaxed text-white/80">
              Your complete college quiz and results management system
            </p>
          </div>
          <div className="space-y-4">
            {['Take Proctored Quizzes', 'Track Your Performance', 'View Semester Results'].map((text, i) => (
              <div key={i} className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-2xl px-5 py-3">
                <div className={`w-2.5 h-2.5 rounded-full ${['bg-teal-300', 'bg-amber-300', 'bg-pink-300'][i]}`}></div>
                <span className="font-bold">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="flex items-center justify-center mb-8 lg:hidden">
            <div className="w-16 h-16 bg-indigo-500 rounded-2xl flex items-center justify-center">
              <GraduationCap size={36} weight="duotone" className="text-white" />
            </div>
          </div>

          <div className="soft-card p-8 sm:p-10">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-1">Sign In</h2>
            <p className="text-sm font-medium text-slate-500 mb-8">Enter your credentials to continue</p>

            {/* Login Method Toggle */}
            <div className="bg-slate-100 rounded-full p-1 flex mb-6">
              <button
                data-testid="password-login-tab"
                onClick={() => setLoginMethod('password')}
                className={`flex-1 pill-tab ${loginMethod === 'password' ? 'pill-tab-active' : 'pill-tab-inactive'}`}
              >
                Password
              </button>
              <button
                data-testid="otp-login-tab"
                onClick={() => setLoginMethod('otp')}
                className={`flex-1 pill-tab ${loginMethod === 'otp' ? 'pill-tab-active' : 'pill-tab-inactive'}`}
              >
                OTP
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">
                  College ID / Roll Number
                </label>
                <div className="relative">
                  <UserCircle size={20} weight="duotone" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    data-testid="college-id-input"
                    type="text"
                    value={collegeId}
                    onChange={(e) => setCollegeId(e.target.value)}
                    placeholder="e.g., S2024001, T001, A001"
                    className="soft-input w-full pl-11 pr-4"
                  />
                </div>
              </div>

              {loginMethod === 'password' ? (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock size={20} weight="duotone" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      data-testid="password-input"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="soft-input w-full pl-11 pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      data-testid="toggle-password-visibility"
                    >
                      {showPassword ? <EyeSlash size={20} weight="duotone" /> : <Eye size={20} weight="duotone" />}
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">OTP</label>
                    <button type="button" className="text-xs font-bold text-indigo-500 hover:text-indigo-600" data-testid="send-otp-button">
                      Send OTP
                    </button>
                  </div>
                  <input
                    data-testid="otp-input"
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Enter 6-digit OTP"
                    maxLength="6"
                    className="soft-input w-full text-center text-xl tracking-[0.5em]"
                  />
                </div>
              )}

              {loginMethod === 'password' && (
                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 font-medium text-slate-600 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 rounded-md accent-indigo-500" data-testid="remember-me-checkbox" />
                    Remember me
                  </label>
                  <button type="button" className="font-bold text-indigo-500 hover:text-indigo-600" data-testid="forgot-password-link">
                    Forgot Password?
                  </button>
                </div>
              )}

              <button data-testid="login-submit-button" type="submit" className="btn-primary w-full flex items-center justify-center gap-2">
                Sign In <PaperPlaneTilt size={18} weight="duotone" />
              </button>
            </form>

            <div className="mt-6 p-4 bg-amber-50 rounded-2xl">
              <p className="text-xs font-bold uppercase tracking-widest text-amber-700 mb-1">Demo Logins</p>
              <p className="text-xs font-medium text-amber-600">Student: S2024001 &bull; Teacher: T001 &bull; Admin: A001</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
