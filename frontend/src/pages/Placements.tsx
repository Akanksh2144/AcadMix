import React, { useState, useEffect } from 'react';
import { Buildings, MapPin, CalendarBlank, Briefcase, Clock, Users, Star, CaretDown, CaretUp, XCircle, FilePdf, Sparkle, CheckCircle, WarningCircle } from '@phosphor-icons/react';
import PageHeader from '../components/PageHeader';
import { placementsAPI, resumeVaultAPI, usersAPI } from '../services/api';

const formatDate = (d) => {
  if (!d) return '—';
  const date = new Date(d);
  return date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
};

const getDaysUntil = (d) => {
  if (!d) return null;
  const diff = new Date(d).getTime() - Date.now();
  if (diff < 0) return { text: 'Completed', past: true };
  const days = Math.floor(diff / 86400000);
  if (days === 0) return { text: 'Today', urgent: true };
  if (days === 1) return { text: 'Tomorrow', urgent: true };
  if (days <= 3) return { text: `In ${days} days`, urgent: true };
  return { text: `In ${days} days`, urgent: false };
};

const Placements = ({ navigate, user }) => {
  const [placements, setPlacements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [filter, setFilter] = useState('upcoming'); // all, upcoming, completed
  
  // Apply Modal State
  const [applyDrive, setApplyDrive] = useState(null);
  const [resumes, setResumes] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  
  // ATS Score State
  const [atsScore, setAtsScore] = useState(null);
  const [atsLoading, setAtsLoading] = useState(false);
  const [atsError, setAtsError] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await placementsAPI.studentPlacements();
        setPlacements(data);
        
        // Also fetch user's resumes for the apply modal
        const rRes = await resumeVaultAPI.list();
        if (rRes.data) {
           setResumes(rRes.data);
           const p = rRes.data.find(r => r.is_primary);
           if (p) setSelectedResumeId(p.id);
           else if (rRes.data.length > 0) setSelectedResumeId(rRes.data[0].id);
        }
      } catch (err) { console.error(err); }
      setLoading(false);
    };
    fetch();
  }, []);

  const handleApplyClick = (e, drive) => {
    e.stopPropagation();
    setApplyDrive(drive);
    setError(null);
    setSuccessMsg(null);
    setAtsScore(null);
    setAtsError(null);
  };
  
  const generateAtsScore = async () => {
    if (!selectedResumeId) {
        setAtsError("Please select a resume first.");
        return;
    }
    setAtsLoading(true);
    setAtsError(null);
    try {
        const { data } = await placementsAPI.scoreResume(applyDrive.id, { resume_id: selectedResumeId });
        setAtsScore(data);
    } catch (err) {
        setAtsError(err.response?.data?.detail || "Failed to generate AI score.");
    }
    setAtsLoading(false);
  };

  const submitApplication = async (e) => {
    e.preventDefault();
    if (!selectedResumeId) {
       setError("Please select a resume or upload one in your Profile.");
       return;
    }
    setApplying(true);
    setError(null);
    try {
       await placementsAPI.applyToDrive(applyDrive.id, {
           resume_id: selectedResumeId
       });
       setSuccessMsg("Successfully applied!");
       setTimeout(() => setApplyDrive(null), 2000);
       // Refresh drives? Maybe update locally to show "Applied" instead.
       // The backend doesn't return "already applied" status in studentPlacements yet, so we could locally mark it.
    } catch (err) {
       setError(err.response?.data?.detail || "You are not eligible or an error occurred.");
    }
    setApplying(false);
  };

  const now = new Date();
  const filtered = placements.filter(p => {
    if (filter === 'upcoming') return !p.drive_date || new Date(p.drive_date) >= now;
    if (filter === 'completed') return p.drive_date && new Date(p.drive_date) < now;
    return true;
  });

  const upcoming = placements.filter(p => !p.drive_date || new Date(p.drive_date) >= now);
  const completed = placements.filter(p => p.drive_date && new Date(p.drive_date) < now);

  if (loading) return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F19] transition-colors duration-300 flex items-center justify-center">
      <div className="text-center">
        <div className="w-14 h-14 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-sm font-bold text-slate-400">Loading placement drives...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F19] transition-colors duration-300">
      <PageHeader
        navigate={navigate} user={user} title="Placements"
        subtitle={`${upcoming.length} upcoming • ${completed.length} completed`}
        maxWidth="max-w-7xl"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1 p-1.5 bg-slate-100 dark:bg-white/[0.04] rounded-xl mb-6 sm:mb-8 w-fit" style={{animation: 'fadeInUp 0.2s ease'}}>
          {[
            { key: 'all', label: `All (${placements.length})` },
            { key: 'upcoming', label: `Upcoming (${upcoming.length})` },
            { key: 'completed', label: `Past (${completed.length})` },
          ].map(tab => (
            <button key={tab.key} onClick={() => setFilter(tab.key)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border border-transparent ${
                filter === tab.key
                  ? 'bg-white dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 shadow-sm dark:border-indigo-500/25'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-white/[0.04]'
              }`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Placement Cards */}
        {filtered.length > 0 ? (
          <div className="space-y-4">
            {filtered.map((p, i) => {
              const deadline = getDaysUntil(p.drive_date);
              const isExpanded = expandedId === p.id;
              const isPast = deadline?.past;

              return (
                <div key={p.id} className={`soft-card overflow-hidden ${isPast ? 'opacity-70' : ''}`}
                  style={{animation: `fadeInUp ${0.25 + i * 0.05}s ease`}}>
                  {/* Main row */}
                  <button
                    className="w-full text-left p-5 sm:p-6 flex items-start gap-4"
                    onClick={() => setExpandedId(isExpanded ? null : p.id)}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      isPast ? 'bg-slate-100' : 'bg-indigo-50 dark:bg-indigo-500/15'
                    }`}>
                      <Buildings size={24} weight="duotone" className={isPast ? 'text-slate-400' : 'text-indigo-500'} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-extrabold text-lg text-slate-900 truncate">{p.company_name || 'Company'}</h3>
                          {p.role && (
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                              <Briefcase size={14} weight="duotone" /> {p.role}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {deadline && (
                            <span className={`soft-badge ${
                              deadline.past ? 'bg-slate-100 text-slate-400' :
                              deadline.urgent ? 'bg-red-50 text-red-600' :
                              'bg-emerald-50 text-emerald-600'
                            }`}>
                              {deadline.urgent && <Clock size={12} weight="bold" className="mr-1 inline" />}
                              {deadline.text}
                            </span>
                          )}
                          {isExpanded ? <CaretUp size={16} className="text-slate-400" /> : <CaretDown size={16} className="text-slate-400" />}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm font-medium text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <CalendarBlank size={14} weight="duotone" />
                          <span>{formatDate(p.drive_date)}</span>
                        </div>
                        {p.location && (
                          <div className="flex items-center gap-1.5">
                            <MapPin size={14} weight="duotone" />
                            <span>{p.location}</span>
                          </div>
                        )}
                        {p.package_lpa && (
                          <div className="flex items-center gap-1.5">
                            <Star size={14} weight="duotone" />
                            <span>{p.package_lpa} LPA</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </button>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-0 border-t border-slate-100 dark:border-slate-700 mt-0"
                      style={{animation: 'fadeInUp 0.15s ease'}}>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                        {p.description && (
                          <div className="sm:col-span-2">
                            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">About</p>
                            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{p.description}</p>
                          </div>
                        )}
                        {p.eligibility && (
                          <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Eligibility</p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">{p.eligibility}</p>
                          </div>
                        )}
                        {p.package_lpa && (
                          <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Package</p>
                            <p className="text-sm font-bold text-emerald-600">{p.package_lpa} LPA</p>
                          </div>
                        )}
                        {p.drive_date && (
                          <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Date & Time</p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">{formatDate(p.drive_date)}{p.time ? ` at ${p.time}` : ''}</p>
                          </div>
                        )}
                        {p.location && (
                          <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Location</p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">{p.location}</p>
                          </div>
                        )}
                        {p.contact_email && (
                          <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Contact</p>
                            <p className="text-sm text-indigo-600 font-medium">{p.contact_email}</p>
                          </div>
                        )}
                        {p.rounds && (
                          <div className="sm:col-span-2">
                            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Rounds</p>
                            <div className="flex flex-wrap gap-2">
                              {(typeof p.rounds === 'string' ? p.rounds.split(',') : p.rounds).map((r, ri) => (
                                <span key={ri} className="soft-badge bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600">{typeof r === 'string' ? r.trim() : r}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        {!isPast && (
                          <div className="sm:col-span-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-end">
                            <button 
                              onClick={(e) => handleApplyClick(e, p)}
                              className="btn-primary flex items-center gap-2"
                            >
                              <Briefcase size={16} weight="bold" />
                              One-Click Apply
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="soft-card p-12 sm:p-16 text-center" style={{animation: 'fadeInUp 0.3s ease'}}>
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Briefcase size={36} weight="duotone" className="text-slate-400" />
            </div>
            <h3 className="font-bold text-lg text-slate-600 dark:text-slate-400 mb-1">
              {filter === 'upcoming' ? 'No upcoming placement drives' :
                filter === 'completed' ? 'No past drives' : 'No placement drives yet'}
            </h3>
            <p className="text-sm text-slate-400">
              Placement drives will appear here when the placement cell publishes them.
            </p>
          </div>
        )}
      </div>

      {/* One-Click Apply Modal */}
      {applyDrive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          style={{animation: 'fadeIn 0.2s ease'}}>
          <div className="bg-white dark:bg-[#151b2b] w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]"
            style={{animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'}}>
            
            {/* Header */}
            <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/15 flex items-center justify-center">
                  <Briefcase size={20} className="text-indigo-600 dark:text-indigo-400" weight="duotone" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white">Apply to {applyDrive.company_name}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{applyDrive.role}</p>
                </div>
              </div>
              <button 
                onClick={() => setApplyDrive(null)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full transition-colors"
              >
                <XCircle size={24} weight="bold" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 sm:p-6 overflow-y-auto custom-scrollbar flex-1">
              {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-xl flex items-start gap-3">
                  <XCircle size={20} className="text-red-500 mt-0.5 shrink-0" weight="fill" />
                  <p className="text-sm text-red-600 dark:text-red-400">
                    <span className="font-bold block mb-0.5">Application Failed</span>
                    {error}
                  </p>
                </div>
              )}

              {successMsg ? (
                <div className="flex flex-col items-center justify-center py-8 text-center" style={{animation: 'fadeInUp 0.4s ease'}}>
                  <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mb-4">
                    <Star size={32} weight="fill" />
                  </div>
                  <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Application Submitted!</h4>
                  <p className="text-slate-500 dark:text-slate-400 max-w-sm">
                    Your profile and primary resume have been sent to the placement cell for {applyDrive.company_name}.
                  </p>
                </div>
              ) : (
                <form id="apply-form" onSubmit={submitApplication} className="space-y-6">
                  
                  {/* Pre-filled Profile Data */}
                  <div>
                    <h4 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4">Verified Profile Data</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-3 bg-slate-50 dark:bg-[#0B0F19] rounded-xl border border-slate-100 dark:border-slate-800">
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Full Name</p>
                        <p className="font-semibold text-slate-900 dark:text-white text-sm">{user.name}</p>
                      </div>
                      <div className="p-3 bg-slate-50 dark:bg-[#0B0F19] rounded-xl border border-slate-100 dark:border-slate-800">
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Email</p>
                        <p className="font-semibold text-slate-900 dark:text-white text-sm truncate">{user.email}</p>
                      </div>
                      <div className="p-3 bg-slate-50 dark:bg-[#0B0F19] rounded-xl border border-slate-100 dark:border-slate-800">
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">College ID</p>
                        <p className="font-semibold text-slate-900 dark:text-white text-sm">{user.college_id || 'N/A'}</p>
                      </div>
                      <div className="p-3 bg-slate-50 dark:bg-[#0B0F19] rounded-xl border border-slate-100 dark:border-slate-800">
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">CGPA (Auto-fetched)</p>
                        <p className="font-semibold text-indigo-600 dark:text-indigo-400 text-sm">Verified by DB</p>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 mt-2 flex items-center gap-1.5 flex-wrap">
                      <Users size={14} /> Profile data is automatically synchronized with your student dashboard.
                    </p>
                  </div>

                  {/* Resume Selection */}
                  <div>
                    <h4 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center justify-between">
                      Select Resume
                      <a href="/student/profile" className="text-xs text-indigo-500 hover:text-indigo-600 normal-case font-medium">Manage Vault</a>
                    </h4>
                    
                    {resumes.length === 0 ? (
                       <div className="p-6 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-center">
                         <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
                           <FilePdf size={24} />
                         </div>
                         <p className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-1">No resumes found</p>
                         <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">You need to upload at least one resume to apply.</p>
                         <button type="button" onClick={() => { setApplyDrive(null); navigate('/student/profile'); }} className="btn-secondary py-2">
                           Go to Resume Vault
                         </button>
                       </div>
                    ) : (
                      <div className="space-y-3">
                        {resumes.map(r => (
                          <label key={r.id} className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                            selectedResumeId === r.id 
                              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10' 
                              : 'border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-500/30'
                          }`}>
                            <div className="mt-0.5">
                              <input 
                                type="radio" 
                                name="resume" 
                                value={r.id} 
                                checked={selectedResumeId === r.id}
                                onChange={(e) => setSelectedResumeId(e.target.value)}
                                className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-600"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                               <div className="flex items-center gap-2">
                                  <p className={`text-sm font-bold truncate ${selectedResumeId === r.id ? 'text-indigo-900 dark:text-indigo-100' : 'text-slate-900 dark:text-slate-200'}`}>
                                    {r.filename}
                                  </p>
                                  {r.is_primary && (
                                     <span className="text-[10px] font-bold uppercase py-0.5 px-2 bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 rounded-full">Primary</span>
                                  )}
                               </div>
                               <p className="text-xs text-slate-500 md:truncate mt-0.5">Parsed on {r.created_at ? new Date(r.created_at).toLocaleDateString() : 'Unknown Date'}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* ATS Scoring Section */}
                  {resumes.length > 0 && selectedResumeId && (
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-bold uppercase tracking-widest text-slate-400">ATS Match Score</h4>
                        {!atsScore && (
                          <button 
                            type="button" 
                            onClick={generateAtsScore}
                            disabled={atsLoading}
                            className="btn-secondary py-1.5 px-3 text-xs bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 border-0 flex items-center gap-1.5"
                          >
                            {atsLoading ? (
                              <div className="w-3 h-3 border-2 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin"></div>
                            ) : <Sparkle size={14} weight="fill" />}
                            {atsLoading ? 'Analyzing...' : 'Generate Score'}
                          </button>
                        )}
                      </div>

                      {atsError && (
                        <div className="text-xs text-red-500 mb-4">{atsError}</div>
                      )}

                      {atsScore && (
                        <div className="soft-card p-4 bg-slate-50 dark:bg-[#0B0F19] flex flex-col sm:flex-row gap-5 items-center sm:items-start" style={{animation: 'fadeInUp 0.3s ease'}}>
                          {/* Circular Score */}
                          <div className="flex-shrink-0 relative w-20 h-20 flex items-center justify-center">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                              <path className="text-slate-200 dark:text-slate-800" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                              <path 
                                className={`${atsScore.match_percentage >= 80 ? 'text-emerald-500' : atsScore.match_percentage >= 50 ? 'text-amber-500' : 'text-red-500'}`} 
                                strokeDasharray={`${atsScore.match_percentage}, 100`} 
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                                fill="none" stroke="currentColor" strokeWidth="3" 
                              />
                            </svg>
                            <div className="absolute flex flex-col items-center justify-center">
                              <span className="text-lg font-black text-slate-900 dark:text-white leading-none">{atsScore.match_percentage}%</span>
                            </div>
                          </div>
                          
                          {/* Details */}
                          <div className="flex-1 w-full space-y-3">
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                              {atsScore.brief_summary}
                            </p>
                            
                            {atsScore.strong_matches?.length > 0 && (
                              <div>
                                <p className="text-xs font-bold text-slate-500 mb-1.5 flex items-center gap-1"><CheckCircle size={14} className="text-emerald-500"/> Matched Keywords</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {atsScore.strong_matches.map((kw, idx) => (
                                    <span key={idx} className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 rounded-full">{kw}</span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {atsScore.missing_keywords?.length > 0 && (
                              <div>
                                <p className="text-xs font-bold text-slate-500 mb-1.5 flex items-center gap-1"><WarningCircle size={14} className="text-amber-500"/> Missing Critical Keywords</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {atsScore.missing_keywords.map((kw, idx) => (
                                    <span key={idx} className="text-[10px] font-bold px-2 py-0.5 border border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-500 rounded-full">{kw}</span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                </form>
              )}
            </div>

            {/* Footer */}
            {!successMsg && (
              <div className="p-5 sm:p-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 shrink-0 bg-slate-50 dark:bg-[#151b2b] rounded-b-2xl">
                <button 
                  type="button" 
                  onClick={() => setApplyDrive(null)}
                  className="btn-secondary"
                  disabled={applying}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  form="apply-form"
                  disabled={applying || !selectedResumeId}
                  className="btn-primary min-w-[140px]"
                >
                  {applying ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Applying...
                    </span>
                  ) : (
                    'Submit Application'
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default Placements;
