import React, { useState, useEffect } from 'react';
import { 
  Users, MagnifyingGlass, Funnel, FileArrowUp, GraduationCap, CheckCircle, 
  XCircle, Clock, Warning, ArrowRight, ShieldCheck, Sparkle, Trophy 
} from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';
import PageHeader from '../components/PageHeader';
import AlertModal from '../components/AlertModal';
import { toast } from 'sonner';

import { admissionsAPI } from '../services/api';


const STAGES = [
  { id: 'enquiry', name: 'Enquiries', color: 'border-slate-200 dark:border-white/10' },
  { id: 'submitted', name: 'Applications', color: 'border-blue-500/30' },
  { id: 'seat_allocated', name: 'Seat Allocated', color: 'border-amber-500/30' },
  { id: 'confirmed', name: 'Confirmed', color: 'border-emerald-500/30' },
  { id: 'enrolled', name: 'Enrolled SIS', color: 'border-indigo-500/30' }
];

import DashboardHeader from '../components/DashboardHeader';

interface AdmissionsManagementProps {
  navigate?: (path: string) => void;
  user?: any;
  onLogout?: () => void;
}

const AdmissionsManagement: React.FC<AdmissionsManagementProps> = ({ navigate, user, onLogout }) => {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'funnel' | 'tasks' | 'counseling' | 'analytics'>('funnel');
  
  // Search / Filters
  const [search, setSearch] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedQuota, setSelectedQuota] = useState('');
  
  // Selected Candidate for 360° Drawer
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
  
  // Modals
  const [counselingModal, setCounselingModal] = useState(false);
  const [meritModal, setMeritModal] = useState(false);
  const [importModal, setImportModal] = useState(false);
  const [webhookModal, setWebhookModal] = useState(false);

  // Webhook Simulation Lead State
  const [testLeadName, setTestLeadName] = useState('Ananya Verma');
  const [testLeadMobile, setTestLeadMobile] = useState('9876501234');
  const [testLeadEmail, setTestLeadEmail] = useState('ananya.verma@gmail.com');
  const [testLeadBranch, setTestLeadBranch] = useState('CSE');
  const [testLeadSource, setTestLeadSource] = useState('Meta Ads (FB/IG)');
  const [ingestingWebhook, setIngestingWebhook] = useState(false);
  
  // Capacities
  const [capacities, setCapacities] = useState({ CSE: 60, ECE: 60, MECH: 60 });
  const [csvData, setCsvData] = useState('');
  const [draggedCandidateId, setDraggedCandidateId] = useState<string | null>(null);

  const handleStatusChange = async (candidateId: string, newStatus: string) => {
    try {
      setCandidates(prev => prev.map(c => c.id === candidateId ? { ...c, status: newStatus } : c));
      if (selectedCandidate && selectedCandidate.id === candidateId) {
        setSelectedCandidate(prev => prev ? { ...prev, status: newStatus } : null);
      }
      await admissionsAPI.updateStatus(candidateId, newStatus);
      const stageObj = STAGES.find(s => s.id === newStatus);
      toast.success(`Moved candidate to ${stageObj ? stageObj.name : newStatus}`);
    } catch {
      toast.error('Failed to update stage');
      loadCandidates();
    }
  };

  const handleDragStart = (e: React.DragEvent, candidateId: string) => {
    setDraggedCandidateId(candidateId);
    e.dataTransfer.setData('text/plain', candidateId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetStage: string) => {
    e.preventDefault();
    const candidateId = e.dataTransfer.getData('text/plain') || draggedCandidateId;
    if (!candidateId) return;
    setDraggedCandidateId(null);
    await handleStatusChange(candidateId, targetStage);
  };
  
  useEffect(() => {
    loadCandidates();
  }, [selectedBranch, selectedQuota]);

  const loadCandidates = async () => {
    setLoading(true);
    try {
      const res = await admissionsAPI.list({
        branch: selectedBranch,
        quota: selectedQuota
      });
      setCandidates(res.data || []);
    } catch (err) {
      toast.error('Failed to load candidate list');
    }
    setLoading(false);
  };

  const handleSimulateWebhook = async () => {
    setIngestingWebhook(true);
    try {
      const res = await admissionsAPI.ingestWebhookLead({
        full_name: testLeadName,
        mobile_number: testLeadMobile,
        email: testLeadEmail,
        branch: testLeadBranch,
        lead_source: testLeadSource,
        utm_source: 'campaign_monsoon_2026'
      });
      toast.success(`Inbound Webhook Processed! Status: ${res.data.status} (Ref: ${res.data.admission_number})`);
      setWebhookModal(false);
      loadCandidates();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Webhook ingestion failed');
    } finally {
      setIngestingWebhook(false);
    }
  };

  const handleImport = async () => {
    if (!csvData.trim()) {
      toast.error('CSV data cannot be empty');
      return;
    }
    try {
      const res = await admissionsAPI.bulkImport(csvData);
      toast.success(`Successfully imported ${res.data.imported} candidates!`);
      setImportModal(false);
      setCsvData('');
      loadCandidates();
    } catch {
      toast.error('Bulk import failed');
    }
  };

  const handleMeritList = async () => {
    try {
      const res = await admissionsAPI.generateMeritList('Phase 1');
      toast.success(`Generated Merit List. ${res.data.length} candidates ranked.`);
      setMeritModal(false);
      loadCandidates();
    } catch {
      toast.error('Merit list generation failed');
    }
  };

  const handleRunCounseling = async () => {
    try {
      const res = await admissionsAPI.runCounseling(capacities);
      toast.success(`Counseling completed! Allocated ${res.data.allocated.length} seats.`);
      setCounselingModal(false);
      loadCandidates();
    } catch {
      toast.error('Seat allocation failed');
    }
  };

  const handleDocVerification = async (candidateId: string, status: string) => {
    try {
      await admissionsAPI.verifyDocuments(candidateId, status);
      toast.success(`Document status updated to ${status}`);
      setSelectedCandidate(prev => prev ? { ...prev, documents_verified: status, status: status === 'verified' ? 'confirmed' : prev.status } : null);
      loadCandidates();
    } catch {
      toast.error('Verification failed');
    }
  };

  const handleRollover = async (candidateId: string) => {
    try {
      const res = await admissionsAPI.rollover(candidateId);
      toast.success(`Successfully rolled over! Reg No: ${res.data.register_number}`);
      setSelectedCandidate(prev => prev ? { ...prev, status: 'enrolled' } : null);
      loadCandidates();
    } catch {
      toast.error('Rollover failed');
    }
  };

  const filtered = candidates.filter(c => 
    c.full_name.toLowerCase().includes(search.toLowerCase()) ||
    c.admission_number.toLowerCase().includes(search.toLowerCase()) ||
    c.mobile_number.includes(search)
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F19] transition-colors duration-300">
      {user?.role === 'admissions_officer' ? (
        <DashboardHeader 
          user={user}
          title="Admissions & Enrollment CRM"
          onLogout={onLogout}
          onProfileClick={() => {}}
        />
      ) : (
        <PageHeader 
          title="Admissions & Enrollment CRM"
          subtitle="Manage prospective students, merit rankings, counseling, and enrollment."
          backTo="admin-dashboard"
        />
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        
        {/* KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-white/[0.02] border border-slate-100 dark:border-white/10 p-5 rounded-3xl flex items-center justify-between shadow-sm">
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Total Leads Ingested</p>
              <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-1">{candidates.length}</h3>
            </div>
            <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl">
              <Users size={20} weight="bold" />
            </div>
          </div>

          <div className="bg-white dark:bg-white/[0.02] border border-slate-100 dark:border-white/10 p-5 rounded-3xl flex items-center justify-between shadow-sm">
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Enrollment Conversion</p>
              <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-1">
                {candidates.length > 0 ? Math.round((candidates.filter(c => c.status === 'enrolled').length / candidates.length) * 100) : 0}%
              </h3>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl">
              <GraduationCap size={20} weight="bold" />
            </div>
          </div>

          <div className="bg-white dark:bg-white/[0.02] border border-slate-100 dark:border-white/10 p-5 rounded-3xl flex items-center justify-between shadow-sm">
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">High Melt Risks</p>
              <h3 className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
                {candidates.filter(c => (c.melt_risk_score ?? 0) > 70).length}
              </h3>
            </div>
            <div className="p-3 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-2xl">
              <Warning size={20} weight="bold" />
            </div>
          </div>

          <div className="bg-white dark:bg-white/[0.02] border border-slate-100 dark:border-white/10 p-5 rounded-3xl flex items-center justify-between shadow-sm">
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Pending Document Reviews</p>
              <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
                {candidates.filter(c => c.documents_verified === 'pending').length}
              </h3>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-2xl">
              <Clock size={20} weight="bold" />
            </div>
          </div>
        </div>

        {/* Tab switcher matching external shape (pill shaped) */}
        <div className="flex justify-between items-center w-full">
          <div className="flex gap-2 bg-slate-100 dark:bg-slate-800/40 p-1 rounded-full border border-slate-200/50 dark:border-white/5 shadow-inner">
            {[
              { id: 'funnel', name: 'Admissions Funnel' },
              { id: 'tasks', name: 'Priority Call Queue' },
              { id: 'counseling', name: 'Counseling & Merit' },
              { id: 'analytics', name: 'Analytics' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-6 py-2 rounded-full text-xs font-black transition-all ${
                  activeTab === tab.id 
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setWebhookModal(true)} 
              className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-indigo-200 dark:border-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-extrabold hover:bg-indigo-100 transition-all"
            >
              <Sparkle size={16} /> Webhook & Ad Leads
            </button>
            <button 
              onClick={() => setImportModal(true)} 
              className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 text-xs font-extrabold hover:bg-slate-50 dark:hover:bg-white/5 transition-all"
            >
              <FileArrowUp size={16} /> Import Candidates
            </button>
          </div>
        </div>

        {/* FUNNEL VIEW */}
        {activeTab === 'funnel' && (
          <div className="space-y-4">
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white dark:bg-white/[0.02] border border-slate-100 dark:border-white/10 p-4 rounded-3xl">
              <div className="relative md:col-span-2">
                <MagnifyingGlass className="absolute left-4 top-3 text-slate-400" size={18} />
                <input 
                  type="text" 
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search candidate name, mobile, admission ref..."
                  className="w-full pl-12 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5 text-sm"
                />
              </div>
              <select 
                value={selectedBranch} 
                onChange={e => setSelectedBranch(e.target.value)}
                className="px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5 text-sm"
              >
                <option value="">All Branches</option>
                <option value="CSE">CSE</option>
                <option value="ECE">ECE</option>
                <option value="MECH">MECH</option>
              </select>
              <select 
                value={selectedQuota} 
                onChange={e => setSelectedQuota(e.target.value)}
                className="px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5 text-sm"
              >
                <option value="">All Quotas</option>
                <option value="General">General</option>
                <option value="Govt">Govt</option>
                <option value="Management">Management</option>
              </select>
            </div>

            {/* Kanban Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 overflow-x-auto pb-4">
              {STAGES.map(stage => {
                const stageCandidates = filtered.filter(c => c.status === stage.id);
                return (
                  <div 
                    key={stage.id} 
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, stage.id)}
                    className="bg-white dark:bg-white/[0.02] border border-slate-100 dark:border-white/10 p-4 rounded-3xl min-w-[220px] flex flex-col space-y-4 hover:border-indigo-400/50 transition-colors"
                  >
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">{stage.name}</h4>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/5">{stageCandidates.length}</span>
                    </div>

                    <div className="flex-1 flex flex-col gap-3 min-h-[150px]">
                      {stageCandidates.map(cand => (
                        <div 
                          key={cand.id} 
                          draggable
                          onDragStart={(e) => handleDragStart(e, cand.id)}
                          onClick={() => setSelectedCandidate(cand)}
                          className="p-4 rounded-2xl border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.01] hover:-translate-y-0.5 hover:shadow-md cursor-grab active:cursor-grabbing transition-all duration-200"
                        >
                          <p className="text-xs font-bold text-slate-400">{cand.admission_number}</p>
                          <h5 className="font-extrabold text-slate-800 dark:text-slate-200 mt-1">{cand.full_name}</h5>
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">{cand.branch}</span>
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400">{cand.quota}</span>
                            {cand.lead_source && (
                              <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400">
                                {cand.lead_source}
                              </span>
                            )}
                          </div>
                          {cand.exam_percentile && (
                            <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 mt-2 flex items-center gap-1">
                              <Trophy size={12} /> {cand.exam_percentile}% ({cand.exam_type})
                            </p>
                          )}
                        </div>
                      ))}
                      {stageCandidates.length === 0 && (
                        <div className="flex-1 border border-dashed border-slate-200 dark:border-white/5 rounded-2xl flex items-center justify-center p-6 text-center text-[10px] font-extrabold text-slate-400">Drag Candidate Here</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* CALL QUEUE VIEW */}
        {activeTab === 'tasks' && (
          <div className="bg-white dark:bg-white/[0.02] border border-slate-100 dark:border-white/10 p-6 rounded-3xl space-y-4">
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white">Priority Follow-Up Queue</h3>
              <p className="text-xs text-slate-400 mt-0.5">High-priority leads requiring immediate counselor outreach based on payment delays, document issues, or AI Melt Risk.</p>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-white/5">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-slate-50 dark:bg-white/[0.02] text-slate-400 uppercase font-black tracking-wider border-b border-slate-100 dark:border-white/5">
                    <th className="px-4 py-3">Rank/Risk</th>
                    <th className="px-4 py-3">Candidate Details</th>
                    <th className="px-4 py-3">Primary Alert Factors</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Outreach Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {candidates
                    .filter(c => c.status !== 'enrolled')
                    .sort((a, b) => (b.melt_risk_score ?? 0) - (a.melt_risk_score ?? 0))
                    .map(c => {
                      const risk = c.melt_risk_score ?? 0;
                      return (
                        <tr key={c.id} className="border-b border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/[0.01] cursor-pointer" onClick={() => setSelectedCandidate(c)}>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className={`text-sm font-black ${
                                risk > 70 ? 'text-rose-600' : risk > 30 ? 'text-amber-500' : 'text-emerald-500'
                              }`}>{Math.round(risk)}%</span>
                              <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full ${
                                risk > 70 ? 'bg-rose-50 text-rose-600' : risk > 30 ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
                              }`}>Risk</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-extrabold text-slate-800 dark:text-white text-sm">{c.full_name}</div>
                            <div className="text-[10px] text-slate-400">{c.email} • {c.mobile_number}</div>
                          </td>
                          <td className="px-4 py-3 font-semibold text-slate-500 max-w-xs truncate">
                            {c.melt_risk_factors || "No risk flags detected"}
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 uppercase">{c.status}</span>
                          </td>
                          <td className="px-4 py-3 text-right space-x-2" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => {
                                toast.success(`Calling ${c.full_name} at ${c.mobile_number}...`);
                              }}
                              className="px-3 py-1.5 rounded-full bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 text-[10px] font-black hover:bg-slate-200 dark:hover:bg-white/10"
                            >
                              Call Lead
                            </button>
                            <button
                              onClick={() => {
                                toast.success(`[WhatsApp Nudge Sent] Reminded ${c.full_name} to confirm their seat.`);
                              }}
                              className="px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-black hover:bg-indigo-100"
                            >
                              WhatsApp Nudge
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* COUNSELING TAB */}
        {activeTab === 'counseling' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white dark:bg-white/[0.02] border border-slate-100 dark:border-white/10 p-6 rounded-3xl space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-extrabold text-slate-900 dark:text-white">Active Counseling Setup</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Automated seat allotment based on category ranking, preferences, and branch capacities.</p>
                  </div>
                  <button 
                    onClick={() => setCounselingModal(true)}
                    className="px-5 py-2.5 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-sm transition-all"
                  >
                    Run Seat Allocation
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {Object.entries(capacities).map(([branch, cap]) => (
                    <div key={branch} className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5">
                      <p className="text-xs font-black text-slate-400">{branch} Total Capacity</p>
                      <h4 className="text-xl font-black text-slate-800 dark:text-white mt-1">{cap} Seats</h4>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white dark:bg-white/[0.02] border border-slate-100 dark:border-white/10 p-6 rounded-3xl space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-extrabold text-slate-900 dark:text-white">Merit List (Phase 1)</h3>
                    <p className="text-xs text-slate-400 mt-0.5">View and generate ranked candidates ready for the counseling process.</p>
                  </div>
                  <button 
                    onClick={() => setMeritModal(true)}
                    className="px-5 py-2.5 rounded-full border border-slate-200 dark:border-white/10 text-xs font-black hover:bg-slate-50 dark:hover:bg-white/5 transition-all"
                  >
                    Generate Merit Phase 1
                  </button>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-white/5">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-white/[0.02] text-slate-400 uppercase font-black tracking-wider border-b border-slate-100 dark:border-white/5">
                        <th className="px-4 py-3">Rank</th>
                        <th className="px-4 py-3">Candidate</th>
                        <th className="px-4 py-3">Percentile</th>
                        <th className="px-4 py-3">Category</th>
                        <th className="px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.filter(c => c.merit_rank).sort((a,b) => a.merit_rank - b.merit_rank).map(c => (
                        <tr key={c.id} className="border-b border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/[0.01]">
                          <td className="px-4 py-3 font-black text-indigo-600">{c.merit_rank}</td>
                          <td className="px-4 py-3 font-extrabold">{c.full_name}</td>
                          <td className="px-4 py-3 font-bold">{c.exam_percentile}%</td>
                          <td className="px-4 py-3">{c.category}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 dark:bg-amber-500/10 text-amber-600">Allocated</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-white/[0.02] border border-slate-100 dark:border-white/10 p-6 rounded-3xl space-y-4">
              <h3 className="font-extrabold text-slate-900 dark:text-white">Seat Fill Ratios</h3>
              <div className="space-y-4">
                {['CSE', 'ECE', 'MECH'].map(branch => {
                  const allocated = filtered.filter(c => c.allocated_branch === branch).length;
                  const cap = capacities[branch as keyof typeof capacities];
                  const percentage = Math.min(100, (allocated / cap) * 100);
                  return (
                    <div key={branch} className="space-y-1">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-slate-700 dark:text-slate-300">{branch} Admissions</span>
                        <span className="text-slate-400">{allocated} / {cap}</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${percentage}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ANALYTICS TAB */}
        {activeTab === 'analytics' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-white/[0.02] border border-slate-100 dark:border-white/10 p-6 rounded-3xl flex flex-col items-center text-center justify-center min-h-56">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Leads Received</p>
              <h2 className="text-4xl font-black text-slate-800 dark:text-white mt-2">{filtered.length}</h2>
              <p className="text-xs text-slate-400 mt-1">Across all inquiry channels</p>
            </div>
            <div className="bg-white dark:bg-white/[0.02] border border-slate-100 dark:border-white/10 p-6 rounded-3xl flex flex-col items-center text-center justify-center min-h-56">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Enrollment Conversion</p>
              <h2 className="text-4xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
                {filtered.length > 0 ? ((filtered.filter(c => c.status === 'enrolled').length / filtered.length) * 100).toFixed(0) : 0}%
              </h2>
              <p className="text-xs text-slate-400 mt-1">From initial lead to SIS student account</p>
            </div>
            <div className="bg-white dark:bg-white/[0.02] border border-slate-100 dark:border-white/10 p-6 rounded-3xl flex flex-col items-center text-center justify-center min-h-56">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Verified Enrolments</p>
              <h2 className="text-4xl font-black text-indigo-600 dark:text-indigo-400 mt-2">
                {filtered.filter(c => c.documents_verified === 'verified').length}
              </h2>
              <p className="text-xs text-slate-400 mt-1">Mandatory documents approved</p>
            </div>
          </div>
        )}
      </div>

      {/* 360° Candidate Drawer Slide-over */}
      <AnimatePresence>
        {selectedCandidate && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedCandidate(null)}
              className="fixed inset-0 bg-black z-40"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-white dark:bg-[#0B0F19] border-l border-slate-100 dark:border-white/10 z-50 p-6 overflow-y-auto space-y-6"
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-black uppercase bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full">{selectedCandidate.admission_number}</span>
                  <h3 className="text-xl font-black text-slate-800 dark:text-white mt-2">{selectedCandidate.full_name}</h3>
                  <p className="text-xs text-slate-400">{selectedCandidate.email} • {selectedCandidate.mobile_number}</p>
                </div>
                <button onClick={() => setSelectedCandidate(null)} className="text-slate-400 hover:text-slate-600">
                  <XCircle size={24} weight="fill" />
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 space-y-3">
                <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">Admission Metadata</h4>
                <div className="grid grid-cols-2 gap-4 text-xs font-bold text-slate-600 dark:text-slate-300">
                  <p>Branch Prefs: <span className="text-slate-900 dark:text-white">{selectedCandidate.course_preferences || selectedCandidate.branch}</span></p>
                  <p>Quota: <span className="text-slate-900 dark:text-white">{selectedCandidate.quota}</span></p>
                  <p>Category: <span className="text-slate-900 dark:text-white">{selectedCandidate.category}</span></p>
                  <p>Gender: <span className="text-slate-900 dark:text-white">{selectedCandidate.gender}</span></p>
                </div>
                <div className="pt-2 border-t border-slate-200/60 dark:border-white/5">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Move Candidate Stage</label>
                  <select
                    value={selectedCandidate.status}
                    onChange={(e) => handleStatusChange(selectedCandidate.id, e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
                  >
                    {STAGES.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                    <option value="rejected">Rejected / Withdrawn</option>
                  </select>
                </div>
              </div>

              {/* AI Seat Melt Risk Index */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                    <Sparkle size={14} className="text-indigo-500 animate-pulse" /> AI Seat Melt Risk Index
                  </h4>
                  <button 
                    onClick={async () => {
                      try {
                        const res = await admissionsAPI.recalculateRisk(selectedCandidate.id);
                        toast.success('Risk recalculated!');
                        setSelectedCandidate(prev => ({ 
                          ...prev, 
                          melt_risk_score: res.data.melt_risk_score,
                          melt_risk_factors: res.data.melt_risk_factors
                        }));
                        loadCandidates();
                      } catch {
                        toast.error('Recalculation failed');
                      }
                    }}
                    className="text-[10px] font-black text-indigo-600 hover:text-indigo-500 transition-colors uppercase"
                  >
                    Recalculate
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-slate-800 dark:text-white">
                      {selectedCandidate.melt_risk_score != null ? Math.round(selectedCandidate.melt_risk_score) : 0}%
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">risk chance</span>
                  </div>

                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                    (selectedCandidate.melt_risk_score ?? 0) > 70 
                      ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600' 
                      : (selectedCandidate.melt_risk_score ?? 0) > 30 
                      ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600' 
                      : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600'
                  }`}>
                    {(selectedCandidate.melt_risk_score ?? 0) > 70 
                      ? 'High Risk' 
                      : (selectedCandidate.melt_risk_score ?? 0) > 30 
                      ? 'Moderate Risk' 
                      : 'Low Risk'}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="h-2 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-500 ${
                    (selectedCandidate.melt_risk_score ?? 0) > 70 
                      ? 'bg-rose-500' 
                      : (selectedCandidate.melt_risk_score ?? 0) > 30 
                      ? 'bg-amber-500' 
                      : 'bg-emerald-500'
                  }`} style={{ width: `${selectedCandidate.melt_risk_score ?? 0}%` }} />
                </div>

                {/* Risk Factors List */}
                <div className="text-[11px] space-y-1 text-slate-500 dark:text-slate-400">
                  <p className="font-bold text-slate-400">Risk Factors detected:</p>
                  <ul className="list-disc pl-4 space-y-1">
                    {selectedCandidate.melt_risk_factors 
                      ? selectedCandidate.melt_risk_factors.split(',').map((factor: string, idx: number) => (
                          <li key={idx}>{factor.trim()}</li>
                        ))
                      : <li>No risk flags detected</li>
                    }
                  </ul>
                </div>
              </div>

              {/* Document Checklist verification controls */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">Document Checklist Verification</h4>
                <div className="space-y-2">
                  {[
                    { name: 'X Marksheet', status: selectedCandidate.documents_verified },
                    { name: 'XII Marksheet', status: selectedCandidate.documents_verified },
                    { name: 'Aadhaar Card', status: selectedCandidate.documents_verified }
                  ].map((doc, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 rounded-xl bg-slate-50/50 dark:bg-white/[0.01] border border-slate-100 dark:border-white/5">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{doc.name}</span>
                      <div className="flex items-center gap-2">
                        {doc.status === 'verified' ? (
                          <span className="text-[10px] font-black text-emerald-600 uppercase flex items-center gap-1"><ShieldCheck size={14} /> Approved</span>
                        ) : (
                          <>
                            <button 
                              onClick={() => handleDocVerification(selectedCandidate.id, 'verified')}
                              className="px-3 py-1 rounded-full bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 text-[10px] font-black transition-all"
                            >
                              Verify
                            </button>
                            <button 
                              onClick={() => handleDocVerification(selectedCandidate.id, 'rejected')}
                              className="px-3 py-1 rounded-full bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 text-rose-600 text-[10px] font-black transition-all"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 1-Click Rollover triggers */}
              <div className="pt-6 border-t border-slate-100 dark:border-white/10 space-y-3">
                {selectedCandidate.status === 'enrolled' ? (
                  <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 text-center">
                    <p className="text-xs font-black text-indigo-600 dark:text-indigo-400 flex items-center justify-center gap-1">
                      <ShieldCheck size={18} /> Rolled Over to Active SIS
                    </p>
                  </div>
                ) : (
                  <button 
                    onClick={() => handleRollover(selectedCandidate.id)}
                    className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black transition-all flex items-center justify-center gap-2"
                  >
                    <span>1-Click Rollover to Student</span> <ArrowRight size={16} />
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Counseling Setup Modal */}
      <AlertModal 
        open={counselingModal}
        title="Trigger Seat Allocation"
        message="Running counseling will process all merit-listed candidates and allocate seats according to course preferences and available capacities."
        type="info"
        confirmText="Run Allocation"
        cancelText="Cancel"
        onConfirm={handleRunCounseling}
        onCancel={() => setCounselingModal(false)}
      />

      {/* Merit List Modal */}
      <AlertModal 
        open={meritModal}
        title="Generate Merit list Phase 1"
        message="Rank eligible candidates by entrance exam percentiles. This creates the merit list audit phase."
        type="info"
        confirmText="Generate"
        cancelText="Cancel"
        onConfirm={handleMeritList}
        onCancel={() => setMeritModal(false)}
      />

      {/* CSV Bulk Import Modal */}
      <AnimatePresence>
        {importModal && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setImportModal(false)}
              className="fixed inset-0 bg-black z-40"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 m-auto w-full max-w-lg h-fit bg-white dark:bg-[#0B0F19] rounded-3xl border border-slate-100 dark:border-white/10 z-50 p-6 space-y-4"
            >
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Import Candidates (CSV)</h3>
              <p className="text-xs text-slate-400">Paste your raw candidate CSV details. Validates roll numbers and deduplicates mobile records.</p>
              <textarea 
                value={csvData}
                onChange={e => setCsvData(e.target.value)}
                placeholder="admission_number,full_name,mobile_number,email,gender,branch,batch,quota,category,exam_type,exam_roll_number,exam_score,exam_percentile,course_preferences&#10;AD-1,Rahul Sharma,9876543210,rahul@gmail.com,Male,CSE,2026,General,General,JEE,12345,95.5,99.2,CSE,ECE"
                className="w-full min-h-36 p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5 text-xs font-mono"
              />
              <div className="flex gap-2 justify-end">
                <button onClick={() => setImportModal(false)} className="px-4 py-2 rounded-full border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-500">Cancel</button>
                <button onClick={handleImport} className="px-5 py-2 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-full text-xs font-black">Upload Candidates</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Webhook & Lead Ingestion Modal */}
      <AnimatePresence>
        {webhookModal && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setWebhookModal(false)}
              className="fixed inset-0 bg-black z-40"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 m-auto w-full max-w-xl h-fit bg-white dark:bg-[#0B0F19] rounded-3xl border border-slate-100 dark:border-white/10 z-50 p-6 space-y-4"
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-black uppercase bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400 px-2 py-0.5 rounded-full">Real-Time Ingestion</span>
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mt-1">Webhook & Ad Lead Configuration</h3>
                </div>
                <button onClick={() => setWebhookModal(false)} className="text-slate-400 hover:text-slate-600">
                  <XCircle size={22} weight="fill" />
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 space-y-2">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Live Inbound Webhook Endpoint URL</p>
                <div className="p-3 bg-slate-900 text-slate-100 rounded-xl text-xs font-mono break-all flex justify-between items-center">
                  <span>{window.location.origin}/api/v1/admissions/webhooks/lead-inbound</span>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/api/v1/admissions/webhooks/lead-inbound`);
                      toast.success('Webhook URL copied!');
                    }}
                    className="px-2.5 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-[10px] font-bold"
                  >
                    Copy URL
                  </button>
                </div>
                <p className="text-[10px] text-slate-400">Supports Meta (FB/IG) Lead Ads, Google Lead Forms, Shiksha webhooks, & custom JSON forms with auto-deduplication.</p>
              </div>

              {/* Simulation Sandbox Form */}
              <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-500/5 border border-indigo-100 dark:border-indigo-500/10 space-y-3">
                <h4 className="text-xs font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider">Test Inbound Webhook Simulator</h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">Full Name</label>
                    <input 
                      type="text" 
                      value={testLeadName} 
                      onChange={e => setTestLeadName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">10-Digit Mobile</label>
                    <input 
                      type="text" 
                      value={testLeadMobile} 
                      onChange={e => setTestLeadMobile(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">Email</label>
                    <input 
                      type="email" 
                      value={testLeadEmail} 
                      onChange={e => setTestLeadEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">Ad Lead Source</label>
                    <select 
                      value={testLeadSource} 
                      onChange={e => setTestLeadSource(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
                    >
                      <option value="Meta Ads (FB/IG)">Meta Ads (FB/IG)</option>
                      <option value="Google Ads">Google Ads</option>
                      <option value="Website Form">Website Form</option>
                      <option value="Shiksha Lead">Shiksha Lead</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button 
                    onClick={handleSimulateWebhook}
                    disabled={ingestingWebhook}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full text-xs font-black transition-all disabled:opacity-50"
                  >
                    {ingestingWebhook ? 'Ingesting...' : 'Fire Test Webhook Payload'}
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <button onClick={() => setWebhookModal(false)} className="px-5 py-2 rounded-full border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-500">Close</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdmissionsManagement;
