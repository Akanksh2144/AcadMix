import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Editor from '@monaco-editor/react';
import { Cpu, Play, CheckCircle, XCircle, List, ArrowLeft, Lightbulb, MagnifyingGlass, Info, BookmarkSimple, TerminalWindow, Graph, Browsers } from '@phosphor-icons/react';
import { useTheme } from '../contexts/ThemeContext';
import { toast } from 'sonner';

// @ts-ignore
import ECE_PROBLEMS from '../data/ece_problems.json';

const diffColors: Record<string, string> = {
  Beginner: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/15 border-emerald-100 dark:border-emerald-500/20',
  Intermediate: 'text-blue-600 bg-blue-50 dark:bg-blue-500/15 border-blue-100 dark:border-blue-500/20',
  Advanced: 'text-amber-600 bg-amber-50 dark:bg-amber-500/15 border-amber-100 dark:border-amber-500/20',
  Interview: 'text-red-600 bg-red-50 dark:bg-red-500/15 border-red-100 dark:border-red-500/20'
};

const categoryIcons: Record<string, React.ReactNode> = {
  embedded: <Cpu size={16} weight="duotone" />,
  vlsi: <Browsers size={16} weight="duotone" />,
  analog: <Graph size={16} weight="duotone" />,
  digital: <TerminalWindow size={16} weight="duotone" />,
  pcb: <Browsers size={16} weight="duotone" />
};

/* ── Custom Filter Dropdown ── */
const FilterDropdown = ({ value, options, onChange }: {
  value: string; options: { value: string; label: string; icon?: React.ReactNode }[];
  onChange: (v: string) => void;
}) => {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  const selected = options.find(o => o.value === value) || options[0];
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)}
        className="flex items-center gap-2 bg-white dark:bg-[#1E293B] border border-slate-200/70 dark:border-white/10 rounded-2xl px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-500/30 transition-all min-w-[160px]">
        {selected.icon}{selected.label}
        <svg className={`w-4 h-4 ml-auto text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -8, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.96 }} transition={{ duration: 0.15 }}
            className="absolute z-50 top-full mt-2 left-0 min-w-[280px] max-h-[320px] overflow-y-auto bg-white dark:bg-[#1E293B] border border-slate-200/70 dark:border-white/10 rounded-2xl shadow-xl shadow-slate-900/10 py-2">
            {options.map(o => (
              <button key={o.value} onClick={() => { onChange(o.value); setOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-indigo-50 dark:hover:bg-indigo-500/10 text-left ${value === o.value ? 'bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-700 dark:text-slate-300'}`}>
                {o.icon && <span className="shrink-0">{o.icon}</span>}
                <span className="truncate">{o.label}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const HardwareArena = ({ navigate }: any) => {
  const { isDark } = useTheme();
  const [selectedProblem, setSelectedProblem] = useState<any>(null);
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterDiff, setFilterDiff] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [query, setQuery] = useState('');
  const [leftPct, setLeftPct] = useState(40);
  const [editorPct, setEditorPct] = useState(60);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  
  // Resizing logic
  const onMouseDown = (axis: 'h' | 'v') => {
    const onMouseMove = (e: MouseEvent) => {
      if (axis === 'h' && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        let newPct = ((e.clientX - rect.left) / rect.width) * 100;
        setLeftPct(Math.min(Math.max(newPct, 20), 80));
      } else if (axis === 'v' && rightRef.current) {
        const rect = rightRef.current.getBoundingClientRect();
        let newPct = ((e.clientY - rect.top) / rect.height) * 100;
        setEditorPct(Math.min(Math.max(newPct, 20), 80));
      }
    };
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    document.body.style.cursor = axis === 'h' ? 'col-resize' : 'row-resize';
    document.body.style.userSelect = 'none';
  };

  const filteredProblems = ECE_PROBLEMS.filter((p: any) => {
    if (filterCategory !== 'all' && p.category !== filterCategory) return false;
    if (filterDiff !== 'all' && p.difficulty !== filterDiff) return false;
    if (searchQuery && !p.title.toLowerCase().includes(searchQuery.toLowerCase()) && !p.component.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const handleSelect = (p: any) => {
    setSelectedProblem(p);
    setQuery(p.starter_code);
  };

  const handleRun = () => {
    toast.info('Validating Hardware Synthesis...');
    setTimeout(() => {
      toast.error('Simulation Error: Constraints not met.');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0F172A] font-sans text-slate-900 dark:text-white">
      {!selectedProblem ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-center gap-4 mb-8">
            <button onClick={() => navigate?.('/placement-hub')} className="p-2 -ml-2 rounded-xl text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors">
              <ArrowLeft size={24} weight="bold" />
            </button>
            <div>
              <h1 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400">Hardware Arena</h1>
              <p className="text-slate-500 dark:text-slate-400 font-medium">Enterprise-grade ECE problem dungeon</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="flex-1 relative">
              <MagnifyingGlass size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="Search components, topics, or skills..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white dark:bg-[#1E293B] border border-slate-200/70 dark:border-white/10 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow shadow-sm" />
            </div>
            <FilterDropdown value={filterCategory} onChange={setFilterCategory} options={[
              { value: 'all', label: 'All Categories' },
              { value: 'embedded', label: 'Embedded Systems', icon: <Cpu size={16} /> },
              { value: 'vlsi', label: 'VLSI Design', icon: <Browsers size={16} /> },
              { value: 'analog', label: 'Analog Circuits', icon: <Graph size={16} /> },
              { value: 'digital', label: 'Digital Logic', icon: <TerminalWindow size={16} /> },
              { value: 'pcb', label: 'PCB Design', icon: <Browsers size={16} /> }
            ]} />
            <FilterDropdown value={filterDiff} onChange={setFilterDiff} options={[
              { value: 'all', label: 'All Difficulties' },
              { value: 'Beginner', label: 'Beginner (B0)' },
              { value: 'Intermediate', label: 'Intermediate (I1/I2)' },
              { value: 'Advanced', label: 'Advanced (A1)' },
              { value: 'Interview', label: 'Interview (INT)' }
            ]} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProblems.map((p: any) => (
              <motion.div key={p.id} whileHover={{ y: -4, scale: 1.01 }} onClick={() => handleSelect(p)}
                className="group relative bg-white dark:bg-[#1E293B] p-5 rounded-3xl border border-slate-200/70 dark:border-white/10 shadow-sm hover:shadow-xl hover:border-indigo-300 dark:hover:border-indigo-500/40 cursor-pointer flex flex-col h-full transition-all duration-300">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                    {categoryIcons[p.category] || <Cpu size={20} weight="fill" />}
                  </div>
                  <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest border ${diffColors[p.difficulty]}`}>
                    {p.difficulty}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-800 dark:text-white leading-tight mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
                  {p.title}
                </h3>
                <div className="mt-auto">
                  <p className="text-[11px] font-mono text-slate-400 bg-slate-50 dark:bg-slate-800/50 px-2 py-1 rounded w-fit mb-3">
                    {p.component}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {p.skills.slice(0, 3).map((s: string, i: number) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">{s}</span>
                    ))}
                    {p.skills.length > 3 && <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">+{p.skills.length - 3}</span>}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col h-screen">
          <header className="h-14 shrink-0 bg-white dark:bg-[#1E293B] border-b border-slate-200 dark:border-white/10 px-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => setSelectedProblem(null)} className="p-2 -ml-2 rounded-xl text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors">
                <List size={20} weight="bold" />
              </button>
              <div className="w-7 h-7 bg-indigo-500 rounded-lg flex items-center justify-center">
                {categoryIcons[selectedProblem.category]}
              </div>
              <div>
                <h2 className="font-extrabold text-slate-800 dark:text-white text-sm line-clamp-1">{selectedProblem.title}</h2>
                <div className="flex items-center gap-2">
                  <span className={`px-1.5 py-0.5 border rounded text-[9px] font-bold uppercase tracking-widest ${diffColors[selectedProblem.difficulty]}`}>{selectedProblem.difficulty}</span>
                  <span className="text-[10px] font-bold text-slate-400">{selectedProblem.component}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleRun} className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-lg shadow-indigo-500/20 active:scale-95 transition-transform flex items-center gap-2">
                <Play size={14} weight="fill" /> Simulate & Verify
              </button>
            </div>
          </header>

          <div ref={containerRef} className="flex-1 flex flex-col lg:flex-row overflow-hidden">
            {/* LEFT: Problem Spec */}
            <div style={{ width: `${leftPct}%` }} className="hidden lg:flex flex-col bg-white dark:bg-[#1E293B] overflow-y-auto shrink-0 p-6">
              <div className="prose prose-slate dark:prose-invert prose-sm max-w-none">
                <div dangerouslySetInnerHTML={{ __html: selectedProblem.description.replace(/\n\n/g, '<br/><br/>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
              </div>
            </div>

            {/* Horizontal Resize Handle */}
            <div onMouseDown={() => onMouseDown('h')} className="hidden lg:flex w-1.5 shrink-0 cursor-col-resize items-center justify-center bg-slate-100 dark:bg-slate-800 hover:bg-indigo-200 dark:hover:bg-indigo-500/30 transition-colors group">
              <div className="w-0.5 h-8 rounded-full bg-slate-300 dark:bg-slate-600 group-hover:bg-indigo-400 transition-colors" />
            </div>

            {/* RIGHT: Editor + Output */}
            <div ref={rightRef} className="flex-1 flex flex-col min-w-0 bg-[#1e1e1e]">
              <div style={{ height: `${editorPct}%` }} className="relative shrink-0 overflow-hidden pt-4">
                <Editor
                  defaultLanguage={['vlsi', 'digital'].includes(selectedProblem.category) ? 'verilog' : 'c'}
                  value={query}
                  onChange={(val) => setQuery(val || '')}
                  theme="vs-dark"
                  options={{ minimap: { enabled: false }, fontSize: 14, scrollBeyondLastLine: false }}
                />
              </div>

              {/* Vertical Resize Handle */}
              <div onMouseDown={() => onMouseDown('v')} className="h-1.5 shrink-0 cursor-row-resize flex items-center justify-center bg-slate-800 hover:bg-indigo-500/30 transition-colors group">
                <div className="h-0.5 w-8 rounded-full bg-slate-600 group-hover:bg-indigo-400 transition-colors" />
              </div>

              {/* Output Panel */}
              <div className="flex-1 bg-[#1e1e1e] border-t border-white/10 p-4 text-xs font-mono text-slate-300 overflow-y-auto">
                <div className="flex items-center gap-2 mb-2 text-slate-500">
                  <TerminalWindow size={14} /> <span>Simulation Output Console</span>
                </div>
                <p>Ready to synthesize.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HardwareArena;
