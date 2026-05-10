import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, FileText, Database, ArrowClockwise, Warning, CheckCircle, Student, ChartLineUp, Users, BookOpen } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { accreditationAPI, formatApiError } from '../../services/api';

interface NIRFMatrixProps {
  viewMode: 'principal' | 'nodal';
  collegeId?: string;
  academicYear?: string;
}

const NIRFMatrix: React.FC<NIRFMatrixProps> = ({ viewMode, collegeId, academicYear = '2024-2025' }) => {
  const [loading, setLoading] = useState(false);

  // Mocked parameters for the UI based on NIRF DCS
  const parameters = [
    {
      id: 'TLR',
      name: 'Teaching, Learning & Resources',
      weight: 0.30,
      metrics: [
        { label: 'Student Strength', val: '2,450', status: 'optimal' },
        { label: 'Faculty-Student Ratio', val: '1:18', status: 'optimal' },
        { label: 'Faculty Cadre & Qual.', val: '65% PhD', status: 'warning' },
        { label: 'Financial Resources', val: 'Utilized', status: 'optimal' }
      ]
    },
    {
      id: 'RPC',
      name: 'Research & Professional Practice',
      weight: 0.30,
      metrics: [
        { label: 'Combined Metric for Pubs', val: '145', status: 'optimal' },
        { label: 'Combined Metric for Quality', val: '320 Cit.', status: 'optimal' },
        { label: 'IPR and Patents', val: '12 Filed', status: 'optimal' },
        { label: 'Footprint of Projects', val: '₹4.5Cr', status: 'warning' }
      ]
    },
    {
      id: 'GO',
      name: 'Graduation Outcomes',
      weight: 0.20,
      metrics: [
        { label: 'Placement & Higher Studies', val: '88%', status: 'optimal' },
        { label: 'University Exams', val: '95% Pass', status: 'optimal' },
        { label: 'Median Salary', val: '₹6.5 LPA', status: 'warning' }
      ]
    },
    {
      id: 'OI',
      name: 'Outreach & Inclusivity',
      weight: 0.10,
      metrics: [
        { label: 'Region Diversity', val: '15 States', status: 'optimal' },
        { label: 'Women Diversity', val: '42%', status: 'optimal' },
        { label: 'Economically/Socially Challenged', val: 'Supported', status: 'optimal' },
        { label: 'Physically Challenged', val: 'Facilities OK', status: 'optimal' }
      ]
    },
    {
      id: 'PR',
      name: 'Peer Perception',
      weight: 0.10,
      metrics: [
        { label: 'Academic Peers', val: 'Favorable', status: 'optimal' },
        { label: 'Employers', val: 'Highly Favorable', status: 'optimal' }
      ]
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ChartLineUp size={24} weight="duotone" className="text-indigo-500" />
            NIRF DCS Compliance (Engineering)
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Data Capturing System metrics for National Institutional Ranking Framework.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={async () => {
              try {
                toast.loading('Queuing NIRF DCS Generation...', { id: 'nirf_report' });
                const res = await accreditationAPI.generateReport({
                  report_type: 'NIRF',
                  academic_year: academicYear
                });
                toast.loading(`Job queued! Generating DCS Report & Data Template...`, { id: 'nirf_report' });
                
                const jobId = res.data?.job_id || res.job_id;
                if (!jobId) {
                   toast.success('Job queued successfully, but job tracking ID was not returned.', { id: 'nirf_report' });
                   return;
                }
                
                const pollInterval = setInterval(async () => {
                  try {
                    const statusRes = await accreditationAPI.getReportStatus(jobId);
                    const status = statusRes.data?.status || statusRes.status;
                    const reportUrl = statusRes.data?.report_url || statusRes.report_url;
                    
                    if (status === 'COMPLETED' || status === 'completed') {
                       clearInterval(pollInterval);
                       toast.success('NIRF Report generation complete! Downloading...', { id: 'nirf_report' });
                       if (reportUrl) {
                          window.open(reportUrl, '_blank');
                       }
                    } else if (status === 'FAILED' || status === 'failed') {
                       clearInterval(pollInterval);
                       toast.error('Report generation failed. Please check backend logs.', { id: 'nirf_report' });
                    }
                  } catch (e) {
                     clearInterval(pollInterval);
                     toast.error('Connection lost while checking report status.', { id: 'nirf_report' });
                  }
                }, 3000);
              } catch (err: any) {
                toast.error(`Failed to queue report: ${formatApiError(err)}`, { id: 'nirf_report' });
              }
            }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-500/30 transition-all"
          >
            <FileText size={18} weight="bold" />
            Generate NIRF Export (.zip)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {parameters.map((param, i) => (
          <motion.div
            key={param.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="soft-card p-5 border border-slate-100 dark:border-white/5 relative overflow-hidden"
          >
            <div className="flex justify-between items-start mb-4">
               <div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-100">{param.name}</h3>
                  <p className="text-xs font-medium text-slate-500 mt-0.5">Weight: {(param.weight * 100).toFixed(0)}%</p>
               </div>
               <span className="px-2 py-1 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-black tracking-widest uppercase rounded-lg">
                  {param.id}
               </span>
            </div>

            <div className="space-y-3">
               {param.metrics.map((m, j) => (
                  <div key={j} className="flex justify-between items-center text-sm">
                     <span className="text-slate-600 dark:text-slate-400">{m.label}</span>
                     <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{m.val}</span>
                        {m.status === 'optimal' ? (
                           <CheckCircle weight="fill" className="text-emerald-500" size={16}/>
                        ) : (
                           <Warning weight="fill" className="text-amber-500" size={16}/>
                        )}
                     </div>
                  </div>
               ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default NIRFMatrix;
