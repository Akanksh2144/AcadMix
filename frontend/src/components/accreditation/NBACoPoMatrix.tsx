import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Table, X, ArrowSquareOut, CheckCircle, Warning } from '@phosphor-icons/react';

interface AttainmentCell {
  co_code: string;
  co_id: string;
  po_code: string;
  po_id: string;
  strength: number;        // 1, 2, or 3
  attainment: number | null; // percentage
  is_attained: boolean | null;
}

interface DrilldownData {
  co_code: string;
  po_code: string;
  strength: number;
  direct_attainment: number | null;
  indirect_attainment: number | null;
  final_attainment: number | null;
  threshold: number;
  assessments: Array<{
    type: string;
    name: string;
    co_marks_avg: number;
    max_marks: number;
  }>;
}

interface NBACoPoMatrixProps {
  viewMode: 'principal' | 'nodal';
  departmentId?: string;
  academicYear?: string;
}

const NBACoPoMatrix: React.FC<NBACoPoMatrixProps> = ({ viewMode, departmentId, academicYear }) => {
  const [coLabels, setCoLabels] = useState<string[]>([]);
  const [poLabels, setPoLabels] = useState<string[]>([]);
  const [matrix, setMatrix] = useState<Record<string, AttainmentCell>>({});
  const [loading, setLoading] = useState(true);
  const [drilldown, setDrilldown] = useState<DrilldownData | null>(null);

  useEffect(() => {
    // Mock data — replace with API: GET /api/accreditation/nba/attainment/{department_id}
    const cos = ['CO1', 'CO2', 'CO3', 'CO4', 'CO5', 'CO6'];
    const pos = ['PO1', 'PO2', 'PO3', 'PO4', 'PO5', 'PO6', 'PO7', 'PO8', 'PO9', 'PO10', 'PO11', 'PO12'];

    const mockMatrix: Record<string, AttainmentCell> = {};
    cos.forEach(co => {
      pos.forEach(po => {
        const hasMapping = Math.random() > 0.4;
        if (hasMapping) {
          const strength = [1, 2, 3][Math.floor(Math.random() * 3)];
          const attainment = Math.random() > 0.1 ? Math.round(Math.random() * 100) : null;
          mockMatrix[`${co}-${po}`] = {
            co_code: co,
            co_id: co,
            po_code: po,
            po_id: po,
            strength,
            attainment,
            is_attained: attainment !== null ? attainment >= 60 : null,
          };
        }
      });
    });

    setCoLabels(cos);
    setPoLabels(pos);
    setMatrix(mockMatrix);
    setLoading(false);
  }, [departmentId, academicYear]);

  const getCellColor = (cell: AttainmentCell | undefined) => {
    if (!cell) return 'bg-slate-50 dark:bg-white/[0.02]';
    if (cell.attainment === null) return 'bg-slate-100 dark:bg-white/5';
    if (cell.is_attained) return 'bg-emerald-50 dark:bg-emerald-500/10';
    if (cell.attainment >= 50) return 'bg-amber-50 dark:bg-amber-500/10';
    return 'bg-red-50 dark:bg-red-500/10';
  };

  const getCellText = (cell: AttainmentCell | undefined) => {
    if (!cell) return '';
    if (cell.attainment === null) return '—';
    return `${cell.attainment}%`;
  };

  const getCellTextColor = (cell: AttainmentCell | undefined) => {
    if (!cell || cell.attainment === null) return 'text-slate-400';
    if (cell.is_attained) return 'text-emerald-700 dark:text-emerald-400';
    if (cell.attainment >= 50) return 'text-amber-700 dark:text-amber-400';
    return 'text-red-700 dark:text-red-400';
  };

  const handleCellClick = (cell: AttainmentCell | undefined) => {
    if (!cell) return;
    // Mock drilldown — replace with API call
    setDrilldown({
      co_code: cell.co_code,
      po_code: cell.po_code,
      strength: cell.strength,
      direct_attainment: cell.attainment ? cell.attainment * 0.95 : null,
      indirect_attainment: cell.attainment ? cell.attainment * 1.1 : null,
      final_attainment: cell.attainment,
      threshold: 60,
      assessments: [
        { type: 'IA1', name: 'Internal Assessment 1', co_marks_avg: 14.2, max_marks: 20 },
        { type: 'IA2', name: 'Internal Assessment 2', co_marks_avg: 12.8, max_marks: 20 },
        { type: 'Assignment', name: 'Assignment 1', co_marks_avg: 8.5, max_marks: 10 },
        { type: 'End-Sem', name: 'End Semester Exam', co_marks_avg: 52.3, max_marks: 80 },
      ],
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-teal-500/30 border-t-teal-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Table size={24} weight="duotone" className="text-teal-500" />
            NBA CO-PO Attainment Matrix
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Click any cell to drill down into assessment-level breakdown
          </p>
        </div>
        {/* Legend */}
        <div className="hidden sm:flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-500" /> ≥ 60% Attained</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-500" /> 50-59% At Risk</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-500" /> &lt; 50% Below</span>
        </div>
      </div>

      {/* Heatmap Matrix */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="soft-card overflow-x-auto"
      >
        <table className="w-full text-xs">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-white dark:bg-[#1A202C] p-3 text-left font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-white/10">
                CO \ PO
              </th>
              {poLabels.map(po => (
                <th key={po} className="p-3 text-center font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-white/10 whitespace-nowrap">
                  {po}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {coLabels.map((co, ri) => (
              <tr key={co}>
                <td className="sticky left-0 z-10 bg-white dark:bg-[#1A202C] p-3 font-bold text-slate-700 dark:text-slate-300 border-b border-slate-50 dark:border-white/5">
                  {co}
                </td>
                {poLabels.map(po => {
                  const key = `${co}-${po}`;
                  const cell = matrix[key];
                  return (
                    <td
                      key={po}
                      onClick={() => handleCellClick(cell)}
                      className={`p-3 text-center border-b border-slate-50 dark:border-white/5 transition-all cursor-pointer hover:ring-2 hover:ring-indigo-400/50 hover:z-10 ${getCellColor(cell)}`}
                    >
                      <span className={`font-bold ${getCellTextColor(cell)}`}>
                        {getCellText(cell)}
                      </span>
                      {cell && cell.strength && (
                        <span className="block text-[10px] text-slate-400 mt-0.5">
                          S:{cell.strength}
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>

      {/* Drilldown Side-Drawer */}
      <AnimatePresence>
        {drilldown && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[80] bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setDrilldown(null)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed right-0 top-0 bottom-0 z-[81] w-full max-w-md bg-white dark:bg-[#1A202C] shadow-2xl border-l border-slate-100 dark:border-white/10 overflow-y-auto"
            >
              <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {drilldown.co_code} → {drilldown.po_code}
                  </h3>
                  <button onClick={() => setDrilldown(null)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5">
                    <X size={18} className="text-slate-500" />
                  </button>
                </div>

                {/* Attainment Summary */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Direct', value: drilldown.direct_attainment, suffix: '%' },
                    { label: 'Indirect', value: drilldown.indirect_attainment, suffix: '%' },
                    { label: 'Final', value: drilldown.final_attainment, suffix: '%' },
                  ].map(item => (
                    <div key={item.label} className="soft-card p-3 text-center">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.label}</p>
                      <p className={`text-xl font-black mt-1 ${
                        item.value !== null && item.value >= drilldown.threshold
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {item.value !== null ? `${Math.round(item.value)}${item.suffix}` : '—'}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <span className="text-slate-500">Mapping Strength:</span>
                  <span className="font-bold text-slate-800 dark:text-white">{drilldown.strength}</span>
                  <span className="text-slate-400">|</span>
                  <span className="text-slate-500">Threshold:</span>
                  <span className="font-bold text-slate-800 dark:text-white">{drilldown.threshold}%</span>
                </div>

                {/* Assessment Breakdown */}
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Assessment Contributions</h4>
                  <div className="space-y-2">
                    {drilldown.assessments.map((a, i) => {
                      const pct = (a.co_marks_avg / a.max_marks) * 100;
                      return (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="soft-card p-3"
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-100 dark:bg-white/10 rounded text-slate-600 dark:text-slate-300">
                                {a.type}
                              </span>
                              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{a.name}</span>
                            </div>
                            <span className="text-sm font-bold text-slate-800 dark:text-white">
                              {a.co_marks_avg.toFixed(1)} / {a.max_marks}
                            </span>
                          </div>
                          <div className="h-1.5 rounded-full bg-slate-100 dark:bg-white/5 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ delay: i * 0.05 + 0.2, duration: 0.5 }}
                              className={`h-full rounded-full ${pct >= 60 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                            />
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {/* Verdict */}
                <div className={`p-4 rounded-xl border-2 ${
                  drilldown.final_attainment !== null && drilldown.final_attainment >= drilldown.threshold
                    ? 'border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/5'
                    : 'border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/5'
                }`}>
                  <div className="flex items-center gap-2">
                    {drilldown.final_attainment !== null && drilldown.final_attainment >= drilldown.threshold ? (
                      <>
                        <CheckCircle size={20} weight="fill" className="text-emerald-500" />
                        <span className="font-bold text-emerald-700 dark:text-emerald-400">CO Attained</span>
                      </>
                    ) : (
                      <>
                        <Warning size={20} weight="fill" className="text-red-500" />
                        <span className="font-bold text-red-700 dark:text-red-400">Below Threshold — Action Required</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NBACoPoMatrix;
