import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, UserFocus, GraduationCap, Warning, ArrowClockwise, 
  CheckCircle, XCircle, TrendUp, FileText
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import { accreditationAPI, formatApiError } from '../../services/api';

interface NBADashboardProps {
  collegeId?: string;
  batchYear?: string; // e.g., "2022-26"
}

const NBADashboard: React.FC<NBADashboardProps> = ({ collegeId, batchYear = '2022-26' }) => {
  const [sfrData, setSfrData] = useState<any>(null);
  const [successRateData, setSuccessRateData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!collegeId) return;
    setLoading(true);
    setError(null);
    try {
      const [sfrRes, successRes] = await Promise.all([
        accreditationAPI.getNBAFacultyCadre(collegeId),
        accreditationAPI.getNBASuccessRate(collegeId, batchYear)
      ]);
      setSfrData(sfrRes);
      setSuccessRateData(successRes);
    } catch (err: any) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [collegeId, batchYear]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-64 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
          <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl flex flex-col items-center text-center space-y-3">
        <Warning size={32} weight="duotone" className="text-red-500" />
        <div>
          <h3 className="text-sm font-bold text-red-800 dark:text-red-400">Failed to load NBA Data</h3>
          <p className="text-xs text-red-600 dark:text-red-300 mt-1">{error}</p>
        </div>
        <button 
          onClick={fetchData}
          className="mt-2 flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition-colors"
        >
          <ArrowClockwise size={16} /> Retry
        </button>
      </div>
    );
  }

  if (!sfrData || !successRateData) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <GraduationCap size={24} weight="duotone" className="text-indigo-500" />
            NBA Performance Calculators
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Real-time tracking of Criterion 4 & 5 compliance metrics.
          </p>
        </div>
        <button 
          onClick={() => toast.info('Report generation engine is queuing the NBA SAR...')}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-500/30 transition-all"
        >
          <FileText size={18} weight="bold" />
          Generate NBA Report
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Criterion 5: SFR & Cadre */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="soft-card p-6 flex flex-col"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
                <Users size={20} weight="duotone" className="text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Criterion 5: SFR & Cadre</h3>
                <p className="text-xs text-slate-500">Student-Faculty Ratio and Hierarchy</p>
              </div>
            </div>
            {sfrData.sfr?.is_compliant ? (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-bold rounded-full">
                <CheckCircle size={14} weight="fill" /> Compliant
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 text-xs font-bold rounded-full">
                <XCircle size={14} weight="fill" /> Non-Compliant
              </span>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-white/5">
              <p className="text-xs text-slate-500">Total Students</p>
              <p className="text-lg font-black text-slate-900 dark:text-white">{sfrData.sfr?.total_students}</p>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-white/5">
              <p className="text-xs text-slate-500">Total Faculty</p>
              <p className="text-lg font-black text-slate-900 dark:text-white">{sfrData.sfr?.total_faculty}</p>
            </div>
            <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl border border-indigo-100 dark:border-indigo-500/20">
              <p className="text-xs text-indigo-600 dark:text-indigo-400 font-bold">SFR</p>
              <p className="text-lg font-black text-indigo-700 dark:text-indigo-300">
                1:{sfrData.sfr?.ratio}
              </p>
            </div>
          </div>

          <div className="space-y-4 flex-1">
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800 pb-2">Cadre Proportion (Required vs Available)</h4>
            
            <div className="space-y-3">
              <CadreRow 
                label="Professors" 
                available={sfrData.cadre?.professors?.available || 0} 
                required={sfrData.cadre?.professors?.required || 0} 
              />
              <CadreRow 
                label="Associate Profs" 
                available={sfrData.cadre?.associate_professors?.available || 0} 
                required={sfrData.cadre?.associate_professors?.required || 0} 
              />
              <CadreRow 
                label="Assistant Profs" 
                available={sfrData.cadre?.assistant_professors?.available || 0} 
                required={sfrData.cadre?.assistant_professors?.required || 0} 
              />
            </div>
          </div>
        </motion.div>

        {/* Criterion 4: Success Rate */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="soft-card p-6 flex flex-col"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center">
                <TrendUp size={20} weight="duotone" className="text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Criterion 4: Success Rate</h3>
                <p className="text-xs text-slate-500">Batch {successRateData.batch}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">Success Index</p>
              <p className="text-xl font-black text-purple-600 dark:text-purple-400">
                {successRateData.success_rate_index}
              </p>
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-center">
            {successRateData.total_admitted === 0 ? (
              <div className="text-center p-6 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <UserFocus size={24} className="mx-auto text-slate-400 mb-2" />
                <p className="text-sm text-slate-500">No students enrolled in this batch.</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">Cleared without backlogs</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {successRateData.cleared_without_backlogs} / {successRateData.total_admitted}
                    </span>
                  </div>
                  <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 rounded-full transition-all duration-1000" 
                      style={{ width: `${(successRateData.cleared_without_backlogs / successRateData.total_admitted) * 100}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">Students with backlogs</span>
                    <span className="font-bold text-amber-600 dark:text-amber-400">
                      {successRateData.students_with_backlogs} / {successRateData.total_admitted}
                    </span>
                  </div>
                  <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-amber-500 rounded-full transition-all duration-1000" 
                      style={{ width: `${(successRateData.students_with_backlogs / successRateData.total_admitted) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

const CadreRow = ({ label, available, required }: { label: string, available: number, required: number }) => {
  const isMet = available >= required;
  const pct = required > 0 ? Math.min((available / required) * 100, 100) : 100;
  
  return (
    <div>
      <div className="flex justify-between text-sm mb-1.5">
        <span className="text-slate-700 dark:text-slate-300 font-semibold">{label}</span>
        <span className="text-slate-500 text-xs">
          <span className={`font-bold ${isMet ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
            {available}
          </span>
          {' '} / {required} required
        </span>
      </div>
      <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-1000 ${isMet ? 'bg-emerald-500' : 'bg-amber-500'}`} 
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

export default NBADashboard;
