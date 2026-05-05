import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Trash, Plus, X, BookOpen, User, MagicWand, CheckCircle } from '@phosphor-icons/react';
import { timetableAPI, facultyAPI, api } from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';

const SECTIONS = ['ECE', 'IT-1', 'IT-2', 'CSC', 'AIML-1', 'AIML-2', 'AIML-3', 'DS-1', 'DS-2'];

const SLOT_COLORS = [
  'bg-indigo-100 text-indigo-800 border-indigo-200',
  'bg-emerald-100 text-emerald-800 border-emerald-200',
  'bg-amber-100 text-amber-800 border-amber-200',
  'bg-rose-100 text-rose-800 border-rose-200',
  'bg-violet-100 text-violet-800 border-violet-200',
  'bg-cyan-100 text-cyan-800 border-cyan-200',
  'bg-orange-100 text-orange-800 border-orange-200',
  'bg-teal-100 text-teal-800 border-teal-200',
];

export default function TimetableManager({ user, mockSubjects = [] }) {
  const [section, setSection] = useState('DS-1');
  const [semester, setSemester] = useState(3);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState(null);
  
  const [teachers, setTeachers] = useState([]);
  
  // Generator State
  const [showWizard, setShowWizard] = useState(false);
  const [allocations, setAllocations] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [generatedPreview, setGeneratedPreview] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const subjectColorMap = {};
  let colorIdx = 0;

  const getSubjectColor = (code) => {
    if (!subjectColorMap[code]) {
      subjectColorMap[code] = SLOT_COLORS[colorIdx % SLOT_COLORS.length];
      colorIdx++;
    }
    return subjectColorMap[code];
  };

  const fetchTimetable = useCallback(async () => {
    setLoading(true);
    try {
      const res = await timetableAPI.getHod(user?.department || 'ET', '2026', section, '2025-2026'); // Example hardcoded batch
      setSlots(res.data);
    } catch (err) {
      console.error('Failed to fetch timetable:', err);
    }
    setLoading(false);
  }, [section, semester, user]);

  useEffect(() => {
    fetchTimetable();
  }, [fetchTimetable]);

  useEffect(() => {
    const load = async () => {
      try {
        const [t, s] = await Promise.all([
          facultyAPI.teachers(),
          api.get('/admin/college/settings')
        ]);
        setTeachers(t.data);
        if (s.data.settings && s.data.settings.timetable_config) {
          setSettings(s.data.settings.timetable_config);
        } else {
          // Defaults
          setSettings({
            periods_per_day: 8,
            working_days: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'],
            breaks: [{ type: 'lunch', after_period: 4, duration_mins: 60 }]
          });
        }
      } catch (e) { console.error(e); }
    };
    load();
  }, []);

  const DAYS = settings?.working_days || ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const PERIODS_COUNT = settings?.periods_per_day || 8;
  const PERIODS = Array.from({ length: PERIODS_COUNT }, (_, i) => i + 1);

  const getSlot = (day, period) => slots.find(s => s.day === day && s.period_no === period);

  const addAllocationRow = () => {
    setAllocations([...allocations, { subject_code: '', subject_name: '', faculty_id: '', hours_per_week: 4, is_lab: false }]);
  };

  const updateAllocation = (index, field, value) => {
    const newAllocs = [...allocations];
    newAllocs[index][field] = value;
    
    // Auto-fill subject name based on code
    if (field === 'subject_code') {
       const subj = mockSubjects.find(s => s.code === value);
       if (subj) newAllocs[index].subject_name = subj.name;
    }
    setAllocations(newAllocs);
  };

  const removeAllocation = (index) => {
    setAllocations(allocations.filter((_, i) => i !== index));
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setErrorMsg(null);
    try {
      const payload = {
        department_id: user?.department || 'ET',
        batch: '2026', // example
        section: section,
        academic_year: '2025-2026',
        semester: semester,
        allocations: allocations
      };
      
      const response = await api.post('/hod/timetable/generate', payload);
      setGeneratedPreview(response.data.slots);
      setSlots(response.data.slots); // Preview locally
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || err.message);
    } finally {
      setGenerating(false);
    }
  };

  const commitTimetable = async () => {
    if (!generatedPreview) return;
    try {
      await timetableAPI.saveHod({ slots: generatedPreview });
      alert('Timetable Saved Successfully!'); // Replace with custom alert later if needed
      setGeneratedPreview(null);
      setShowWizard(false);
      fetchTimetable();
    } catch (err) {
      alert('Failed to save timetable');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h4 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Calendar size={24} weight="duotone" className="text-indigo-500" />
            Timetable Manager
          </h4>
          <p className="text-sm text-slate-500 mt-1">Manage and auto-generate class schedules</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={section} onChange={e => setSection(e.target.value)} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-200">
            {SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={semester} onChange={e => setSemester(Number(e.target.value))} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-200">
            {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Sem {s}</option>)}
          </select>
          <button 
            onClick={() => {
              setAllocations([{ subject_code: '', subject_name: '', faculty_id: '', hours_per_week: 4, is_lab: false }]);
              setGeneratedPreview(null);
              setShowWizard(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/30"
          >
            <MagicWand size={18} weight="bold" />
            Generate Smart Timetable
          </button>
        </div>
      </div>

      {/* Timetable Grid */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1A202C] shadow-sm">
        {loading || !settings ? (
          <div className="p-12 text-center text-slate-500">Loading timetable grid...</div>
        ) : (
          <table className="w-full border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50">
                <th className="p-3 text-xs font-semibold text-slate-500 uppercase border-b border-r border-slate-200 dark:border-slate-700 w-[80px]">
                  Period
                </th>
                {DAYS.map(day => (
                  <th key={day} className="p-3 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase border-b border-r border-slate-200 dark:border-slate-700 text-center">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERIODS.map(periodNum => {
                const isBreakAfter = settings.breaks.find(b => b.after_period === periodNum);
                return (
                  <React.Fragment key={periodNum}>
                    <tr>
                      <td className="p-2 border-r border-b border-slate-200 dark:border-slate-700 text-center bg-slate-50 dark:bg-slate-800/30">
                        <div className="text-sm font-bold text-slate-700 dark:text-slate-300">P{periodNum}</div>
                      </td>
                      {DAYS.map(day => {
                        const slot = getSlot(day, periodNum);
                        return (
                          <td key={day} className="p-1.5 border-r border-b border-slate-200 dark:border-slate-700 min-h-[80px] h-[80px] relative dark:bg-[#1A202C]">
                            {slot ? (
                              <div className={`p-2 rounded-xl border h-full flex flex-col justify-between ${getSubjectColor(slot.subject_code)} transition-all hover:shadow-md group`}>
                                <div>
                                  <div className="text-xs font-bold truncate">{slot.subject_name}</div>
                                  <div className="text-[10px] opacity-70 truncate">{slot.subject_code}</div>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] opacity-80 font-medium flex items-center gap-1 truncate">
                                    <User size={10} />
                                    {teachers.find(t => t.id === slot.faculty_id)?.name || slot.faculty_id}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <span className="text-slate-200 dark:text-slate-700 text-xs">—</span>
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                    {isBreakAfter && (
                      <tr>
                        <td colSpan={DAYS.length + 1} className="bg-amber-50/50 dark:bg-amber-500/10 text-center py-2 text-[10px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-[0.2em] border-b border-slate-200 dark:border-slate-700">
                          🍽️ Break ({isBreakAfter.duration_mins} Mins)
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {generatedPreview && (
        <div className="flex items-center justify-end gap-3 p-4 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl border border-indigo-100 dark:border-indigo-500/20">
          <p className="text-sm font-medium text-indigo-700 dark:text-indigo-300 mr-auto">
            Review the generated timetable above. You can regenerate or save it permanently.
          </p>
          <button onClick={() => { setGeneratedPreview(null); fetchTimetable(); }} className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors">
            Discard Preview
          </button>
          <button onClick={commitTimetable} className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-lg shadow-md shadow-indigo-500/20 transition-all">
            <CheckCircle weight="bold" />
            Commit & Save Grid
          </button>
        </div>
      )}

      {/* Generator Wizard Modal */}
      <AnimatePresence>
        {showWizard && !generatedPreview && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto py-10" 
            onClick={() => setShowWizard(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-4xl p-6 sm:p-8 border border-slate-100 dark:border-slate-800" 
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <MagicWand className="text-indigo-500" />
                    AI Timetable Generator
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">Map subjects to faculty and let the algorithm solve constraints.</p>
                </div>
                <button onClick={() => setShowWizard(false)} className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                  <X size={20} weight="bold" />
                </button>
              </div>

              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-12 gap-3 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <div className="col-span-3">Subject</div>
                  <div className="col-span-4">Faculty Assigned</div>
                  <div className="col-span-2">Hrs/Week</div>
                  <div className="col-span-2">Type</div>
                  <div className="col-span-1"></div>
                </div>

                {allocations.map((alloc, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-3 items-center bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl border border-slate-100 dark:border-slate-700/50">
                    <div className="col-span-3">
                      <select 
                        value={alloc.subject_code}
                        onChange={(e) => updateAllocation(idx, 'subject_code', e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                      >
                        <option value="">Select Subject</option>
                        {mockSubjects.map(s => <option key={s.code} value={s.code}>{s.name} ({s.code})</option>)}
                      </select>
                    </div>
                    <div className="col-span-4">
                      <select 
                        value={alloc.faculty_id}
                        onChange={(e) => updateAllocation(idx, 'faculty_id', e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                      >
                        <option value="">Select Faculty</option>
                        {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <input 
                        type="number" min="1" max="10"
                        value={alloc.hours_per_week}
                        onChange={(e) => updateAllocation(idx, 'hours_per_week', parseInt(e.target.value) || 4)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                    <div className="col-span-2 flex items-center h-full">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="checkbox"
                          checked={alloc.is_lab}
                          onChange={(e) => updateAllocation(idx, 'is_lab', e.target.checked)}
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                        />
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Lab (Contiguous)</span>
                      </label>
                    </div>
                    <div className="col-span-1 flex justify-center">
                      <button onClick={() => removeAllocation(idx)} className="p-2 text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors">
                        <Trash size={18} weight="bold" />
                      </button>
                    </div>
                  </div>
                ))}

                <button onClick={addAllocationRow} className="w-full py-3 flex items-center justify-center gap-2 border-2 border-dashed border-slate-200 dark:border-slate-700 text-slate-500 hover:text-indigo-500 hover:border-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-xl transition-all font-semibold text-sm">
                  <Plus weight="bold" /> Add Subject Allocation
                </button>
              </div>

              {errorMsg && (
                <div className="mb-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-300 text-sm font-medium">
                  {errorMsg}
                </div>
              )}

              <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                <button 
                  onClick={handleGenerate} 
                  disabled={generating || allocations.length === 0}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-indigo-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generating ? (
                    <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Generating...</>
                  ) : (
                    <><MagicWand weight="bold" /> Generate Constraints</>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
