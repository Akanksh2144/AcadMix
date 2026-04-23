import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Editor from '@monaco-editor/react';
import { Database, Play, CheckCircle, XCircle, List, ArrowLeft, Lightbulb, Table as TableIcon, Eye, EyeSlash, Timer, CircleHalf } from '@phosphor-icons/react';
import { useTheme } from '../contexts/ThemeContext';
import { placementPrepAPI } from '../services/api';
import { toast } from 'sonner';
import initSqlJs from 'sql.js';
import sqlWasm from 'sql.js/dist/sql-wasm.wasm?url';
import LOCAL_PROBLEMS from '../data/sql_problems.json';

const diffColors: Record<string, string> = {
  easy: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/15 border-emerald-100 dark:border-emerald-500/20',
  medium: 'text-amber-600 bg-amber-50 dark:bg-amber-500/15 border-amber-100 dark:border-amber-500/20',
  hard: 'text-red-600 bg-red-50 dark:bg-red-500/15 border-red-100 dark:border-red-500/20'
};

/* ── Schema Table Card (DataLemur-style) ──────────────── */
const SchemaTable = ({ table }: { table: any }) => (
  <div className="mb-5">
    <h4 className="font-mono font-bold text-sm text-slate-900 dark:text-white mb-2">
      <code className="bg-slate-100 dark:bg-white/10 px-2 py-0.5 rounded">{table.name}</code> Table:
    </h4>
    <div className="border border-slate-200 dark:border-white/10 rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead><tr className="bg-slate-50 dark:bg-white/5">
          <th className="text-left px-4 py-2 font-bold text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-white/10">Column Name</th>
          <th className="text-left px-4 py-2 font-bold text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-white/10">Type</th>
        </tr></thead>
        <tbody>{table.columns.map((col: any) => (
          <tr key={col.name} className="border-b last:border-0 border-slate-100 dark:border-white/5">
            <td className="px-4 py-2 font-mono text-slate-700 dark:text-slate-300 text-xs">{col.name}</td>
            <td className="px-4 py-2 text-slate-500 dark:text-slate-400 text-xs">{col.type}</td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  </div>
);

/* ── Sample Input Table ───────────────────────────────── */
const SampleInputTable = ({ table }: { table: any }) => {
  if (!table.sample_input?.length) return null;
  return (
    <div className="mb-5">
      <h4 className="font-mono font-bold text-sm text-slate-900 dark:text-white mb-2">
        <code className="bg-slate-100 dark:bg-white/10 px-2 py-0.5 rounded">{table.name}</code> Example Input:
      </h4>
      <div className="border border-slate-200 dark:border-white/10 rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="bg-slate-50 dark:bg-white/5">
            {table.columns.map((col: any) => (
              <th key={col.name} className="text-left px-3 py-2 font-bold text-slate-600 dark:text-slate-300 text-xs border-b border-slate-200 dark:border-white/10 whitespace-nowrap">{col.name}</th>
            ))}
          </tr></thead>
          <tbody>{table.sample_input.map((row: any[], ri: number) => (
            <tr key={ri} className="border-b last:border-0 border-slate-100 dark:border-white/5">
              {row.map((val: any, ci: number) => (
                <td key={ci} className="px-3 py-1.5 font-mono text-slate-700 dark:text-slate-300 text-xs whitespace-nowrap">{val === null ? 'NULL' : String(val)}</td>
              ))}
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
};

/* ── Example Output Table ─────────────────────────────── */
const ExampleOutputTable = ({ output }: { output: any }) => {
  if (!output) return null;
  return (
    <div className="mb-5">
      <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-2">Example Output:</h4>
      <div className="border border-slate-200 dark:border-white/10 rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="bg-slate-50 dark:bg-white/5">
            {output.columns.map((col: string) => (
              <th key={col} className="text-left px-3 py-2 font-bold text-slate-600 dark:text-slate-300 text-xs border-b border-slate-200 dark:border-white/10">{col}</th>
            ))}
          </tr></thead>
          <tbody>{output.rows.map((row: any[], ri: number) => (
            <tr key={ri} className="border-b last:border-0 border-slate-100 dark:border-white/5">
              {row.map((val: any, ci: number) => (
                <td key={ci} className="px-3 py-1.5 font-mono text-slate-700 dark:text-slate-300 text-xs">{val === null ? 'NULL' : String(val)}</td>
              ))}
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════ */
const SQLPractice = ({ navigate, user }: any) => {
  const { isDark } = useTheme();
  const [problems, setProblems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProblem, setSelectedProblem] = useState<any>(null);
  const [statusMap, setStatusMap] = useState<Record<string, 'started' | 'solved'>>(() => {
    try { return JSON.parse(localStorage.getItem('sql_status') || '{}'); } catch { return {}; }
  });
  const updateStatus = (id: string, status: 'started' | 'solved') => {
    setStatusMap(prev => {
      if (prev[id] === 'solved') return prev; // never downgrade from solved
      const next = { ...prev, [id]: status };
      localStorage.setItem('sql_status', JSON.stringify(next));
      return next;
    });
  };
  const [query, setQuery] = useState('-- Write your SQL query here\nSELECT * FROM ...;');
  const [db, setDb] = useState<any>(null);
  const [result, setResult] = useState<any>(null);
  const [expected, setExpected] = useState<any>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [execTime, setExecTime] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [tab, setTab] = useState('output');
  const [questionTab, setQuestionTab] = useState('question');
  const mounted = useRef(true);
  const sqlEngineRef = useRef<any>(null);

  // ── Resizable panels ──
  const [leftPct, setLeftPct] = useState(42);        // left panel width %
  const [editorPct, setEditorPct] = useState(60);    // editor height % of right panel
  const draggingRef = useRef<'h' | 'v' | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);

  const onMouseDown = useCallback((axis: 'h' | 'v') => {
    draggingRef.current = axis;
    document.body.style.cursor = axis === 'h' ? 'col-resize' : 'row-resize';
    document.body.style.userSelect = 'none';
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!draggingRef.current) return;
      if (draggingRef.current === 'h' && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const pct = ((e.clientX - rect.left) / rect.width) * 100;
        setLeftPct(Math.min(Math.max(pct, 25), 65));
      }
      if (draggingRef.current === 'v' && rightRef.current) {
        const rect = rightRef.current.getBoundingClientRect();
        const pct = ((e.clientY - rect.top) / rect.height) * 100;
        setEditorPct(Math.min(Math.max(pct, 25), 85));
      }
    };
    const onUp = () => {
      draggingRef.current = null;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, []);

  // Init SQLite WASM
  useEffect(() => {
    mounted.current = true;
    (async () => {
      try {
        if (!sqlEngineRef.current) {
          const SQL = await initSqlJs({ locateFile: () => sqlWasm });
          if (!mounted.current) return;
          sqlEngineRef.current = SQL;
        }
        if (mounted.current) setDb(() => new sqlEngineRef.current.Database());
      } catch { toast.error('Failed to initialize SQL engine'); }
    })();
    return () => { mounted.current = false; };
  }, []);

  // Fetch problems — API first, fallback to local JSON
  useEffect(() => {
    placementPrepAPI.sqlProblems()
      .then((res: any) => { setProblems(res.data?.length ? res.data : LOCAL_PROBLEMS); setLoading(false); })
      .catch(() => { setProblems(LOCAL_PROBLEMS); setLoading(false); });
  }, []);

  const loadProblem = (prob: any) => {
    setSelectedProblem(prob);
    const tableNames = (prob.tables_meta || []).map((t: any) => t.name);
    const starter = tableNames.length > 0
      ? '-- ' + prob.title + '\nSELECT * FROM ' + tableNames[0] + ' LIMIT 5;'
      : '-- ' + prob.title + '\n-- Write your query below\n';
    setQuery(starter);
    setResult(null); setExpected(prob.expected_output); setIsCorrect(null);
    setShowHint(false); setShowSolution(false); setTab('output'); setQuestionTab('question');
    if (sqlEngineRef.current) {
      try {
        const freshDb = new sqlEngineRef.current.Database();
        if (prob.schema_sql) freshDb.run(prob.schema_sql);
        setDb(() => freshDb);
      } catch (e: any) { toast.error('Schema loading failed: ' + e.message); }
    }
  };

  const isResultCorrect = (actual: any[], exp: any[]) => {
    try {
      if (!actual?.length || !exp?.length) return false;
      const normalize = (res: any) => res[0].values.map((r: any[]) => r.join('|')).sort();
      const a = normalize(actual), b = normalize(exp);
      return a.length === b.length && a.every((v: string, i: number) => v === b[i]);
    } catch { return false; }
  };

  const handleRun = () => {
    if (!db || !selectedProblem) return;
    const t0 = performance.now();
    try {
      const res = db.exec(query);
      setExecTime(+(performance.now() - t0).toFixed(1));
      setResult(res);
      const correct = isResultCorrect(res, expected);
      setIsCorrect(correct);
      if (correct) updateStatus(selectedProblem.id, 'solved');
      else updateStatus(selectedProblem.id, 'started');
      correct ? toast.success('Correct! Great job.') : toast.error('Incorrect. Check the expected output.');
      placementPrepAPI.logSqlAttempt({ problem_id: selectedProblem.id, is_correct: correct, time_taken_sec: Math.round((performance.now() - t0) / 1000) }).catch(() => {});
    } catch (err: any) {
      setResult([{ error_string: err.message }]); setIsCorrect(false);
      setExecTime(+(performance.now() - t0).toFixed(1));
    }
  };

  const renderTable = (data: any) => {
    if (!data?.length) return <div className="p-6 text-slate-400 text-sm font-medium text-center">No results.</div>;
    if (data[0].error_string) return <div className="p-4 text-red-500 bg-red-50/50 dark:bg-red-500/5 font-mono text-sm whitespace-pre-wrap">{data[0].error_string}</div>;
    const r = data[0];
    if (!r.columns || !r.values) return <div className="p-4 text-slate-400 text-sm">Empty set.</div>;
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left whitespace-nowrap">
          <thead className="bg-slate-50 dark:bg-white/5 border-b border-slate-100 dark:border-white/5">
            <tr>{r.columns.map((c: string, i: number) => <th key={i} className="px-4 py-2 font-bold text-slate-600 dark:text-slate-300 text-[10px] uppercase tracking-widest">{c}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-white/5">
            {r.values.map((row: any[], ri: number) => (
              <tr key={ri} className="hover:bg-slate-50 dark:hover:bg-white/5">
                {row.map((v: any, ci: number) => <td key={ci} className="px-4 py-2 text-slate-700 dark:text-slate-300 font-mono text-xs">{v === null ? 'NULL' : String(v)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0F172A]">
      <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  /* ── Problem List ─────────────────────────────────────── */
  if (!selectedProblem) return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0F172A] p-4 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <button onClick={() => navigate('placement-hub')} className="flex items-center gap-2 text-slate-500 hover:text-indigo-500 transition-colors font-bold text-sm">
          <ArrowLeft size={16} weight="bold" /> Back to Placement Hub
        </button>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Database size={32} weight="fill" className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">SQL Practice Arena</h1>
              <p className="text-slate-500">DataLemur-style challenges from mass recruiters.</p>
            </div>
          </div>
          {/* Progress */}
          <div className="soft-card px-5 py-3 flex items-center gap-4 min-w-[200px]">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Progress</span>
                <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">{Object.values(statusMap).filter(s => s === 'solved').length}/{problems.length}</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 dark:bg-white/5 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500" style={{ width: `${problems.length ? (Object.values(statusMap).filter(s => s === 'solved').length / problems.length) * 100 : 0}%` }} />
              </div>
            </div>
            <CheckCircle size={24} weight="fill" className="text-emerald-500 shrink-0" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {problems.map((p: any, i: number) => {
            const status = statusMap[p.id] || 'unsolved'; // 'unsolved' | 'started' | 'solved'
            const badgeColor = status === 'solved' ? 'bg-emerald-500 shadow-emerald-500/30'
              : status === 'started' ? 'bg-red-500 shadow-red-500/30'
              : 'bg-slate-300 dark:bg-slate-600 shadow-slate-300/30';
            const borderColor = status === 'solved' ? 'border-emerald-300 dark:border-emerald-500/30 hover:border-emerald-400'
              : status === 'started' ? 'border-red-300 dark:border-red-500/30 hover:border-red-400'
              : 'border-slate-200 dark:border-white/10 hover:border-indigo-500';
            const titleColor = status === 'solved' ? 'text-emerald-700 dark:text-emerald-400'
              : status === 'started' ? 'text-red-700 dark:text-red-400'
              : 'text-slate-800 dark:text-white';
            const tagLabel = status === 'solved' ? '✓ Solved' : null;
            const tagColor = 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
            return (
            <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              onClick={() => loadProblem(p)}
              className={`relative bg-white dark:bg-[#1E293B] border rounded-2xl p-5 cursor-pointer hover:shadow-xl hover:shadow-indigo-500/10 transition-all group ${borderColor}`}>
              {/* Status badge */}
              <div className={`absolute top-3 right-3 w-7 h-7 rounded-full ${badgeColor} flex items-center justify-center shadow-md`}>
                {status === 'started' ? <CircleHalf size={16} weight="fill" className="text-white" /> : <CheckCircle size={16} weight="fill" className="text-white" />}
              </div>
              <div className="flex items-start justify-between mb-3 pr-8">
                <h3 className={`font-extrabold text-lg group-hover:text-indigo-500 transition-colors line-clamp-2 pr-2 ${titleColor}`}>{p.title}</h3>
                <span className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-widest shrink-0 ${diffColors[p.difficulty]}`}>{p.difficulty}</span>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-4">{p.problem_statement?.split('\n')[0]}</p>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                <span className="flex items-center gap-1 bg-slate-100 dark:bg-white/5 py-1 px-2 rounded"><TableIcon size={14} /> {p.dataset_theme}</span>
                {p.company_tag && <span className="bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 py-1 px-2 rounded">🏢 {p.company_tag}</span>}
                {tagLabel && <span className={`ml-auto py-1 px-2 rounded ${tagColor}`}>{tagLabel}</span>}
              </div>
            </motion.div>);
          })}
        </div>
      </div>
    </div>
  );

  const sp = selectedProblem;

  /* ── Arena (Split Panel) ──────────────────────────────── */
  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-[#0F172A]">
      {/* Header */}
      <header className="h-14 shrink-0 bg-white dark:bg-[#1E293B] border-b border-slate-200 dark:border-white/10 px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => setSelectedProblem(null)} className="p-2 -ml-2 rounded-xl text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors">
            <List size={20} weight="bold" />
          </button>
          <div className="w-7 h-7 bg-indigo-500 rounded-lg flex items-center justify-center"><Database size={14} weight="fill" className="text-white" /></div>
          <div>
            <h2 className="font-extrabold text-slate-800 dark:text-white text-sm line-clamp-1">{sp.title}</h2>
            <div className="flex items-center gap-2">
              <span className={`px-1.5 py-0.5 border rounded text-[9px] font-bold uppercase tracking-widest ${diffColors[sp.difficulty]}`}>{sp.difficulty}</span>
              {sp.company_tag && <span className="text-[10px] font-bold text-slate-400">{sp.company_tag}</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {execTime > 0 && <span className="text-xs font-bold text-slate-400 bg-slate-50 dark:bg-white/5 px-2 py-1 rounded hidden sm:inline-flex items-center gap-1"><Timer size={12} /> {execTime}ms</span>}
          <button onClick={handleRun} className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-transform text-sm">
            <Play size={14} weight="fill" /> Run Code
          </button>
          <button onClick={() => { handleRun(); /* submit logic */ }} className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-lg shadow-indigo-500/20 active:scale-95 transition-transform">
            Submit
          </button>
        </div>
      </header>

      {/* Split Content */}
      <div ref={containerRef} className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* LEFT: Problem + Schema */}
        <div style={{ width: `${leftPct}%` }} className="hidden lg:flex flex-col bg-white dark:bg-[#1E293B] overflow-y-auto shrink-0">
          {/* Tabs */}
          <div className="flex border-b border-slate-200 dark:border-white/10 px-5 gap-4">
            {(['question', 'solution'] as const).map(t => (
              <button key={t} onClick={() => setQuestionTab(t)}
                className={`py-3 text-sm font-bold border-b-2 transition-colors capitalize ${questionTab === t ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                {t === 'question' ? '❓ Question' : '💡 Solution'}
              </button>
            ))}
          </div>

          <div className="p-5 space-y-1">
            {questionTab === 'question' ? (
              <>
                {/* Problem Statement */}
                <div className="prose prose-slate dark:prose-invert prose-sm max-w-none whitespace-pre-wrap leading-relaxed text-slate-700 dark:text-slate-300 mb-6">
                  {sp.problem_statement}
                </div>

                {/* Schema Tables */}
                {sp.tables_meta?.map((t: any) => <SchemaTable key={t.name} table={t} />)}

                {/* Sample Input Tables */}
                {sp.tables_meta?.map((t: any) => <SampleInputTable key={t.name + '-data'} table={t} />)}

                {/* Example Output */}
                <ExampleOutputTable output={sp.example_output} />

                {/* Explanation */}
                {sp.explanation && (
                  <div className="mb-5">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-2">Explanation</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{sp.explanation}</p>
                  </div>
                )}

                {/* Hint */}
                <button onClick={() => setShowHint(!showHint)} className="flex items-center gap-2 text-amber-500 font-bold text-xs uppercase tracking-widest hover:text-amber-600 transition-colors">
                  <Lightbulb size={16} weight="duotone" /> {showHint ? 'Hide Hint' : 'Gimme a Hint'}
                </button>
                <AnimatePresence>
                  {showHint && sp.hint && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      className="mt-2 p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl">
                      <p className="text-sm font-medium text-amber-900 dark:text-amber-200">{sp.hint}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            ) : (
              /* Solution Tab */
              <div>
                {sp.solution_sql ? (
                  <>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">Reference Solution</h4>
                      <button onClick={() => setShowSolution(!showSolution)} className="flex items-center gap-1.5 text-xs font-bold text-indigo-500 hover:text-indigo-600">
                        {showSolution ? <><EyeSlash size={14} /> Hide</> : <><Eye size={14} /> Reveal</>}
                      </button>
                    </div>
                    {showSolution ? (
                      <pre className="bg-slate-50 dark:bg-[#0F172A] rounded-xl p-4 text-sm font-mono text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 overflow-x-auto whitespace-pre-wrap">{sp.solution_sql}</pre>
                    ) : (
                      <div className="bg-slate-50 dark:bg-[#0F172A] rounded-xl p-8 text-center border border-slate-200 dark:border-white/10">
                        <Eye size={32} className="text-slate-300 mx-auto mb-2" />
                        <p className="text-sm text-slate-400 font-bold">Click "Reveal" to see the solution</p>
                        <p className="text-xs text-slate-400 mt-1">Try solving it yourself first!</p>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-slate-400 text-center py-8">Solution not available for this problem.</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Horizontal Resize Handle */}
        <div onMouseDown={() => onMouseDown('h')}
          className="hidden lg:flex w-1.5 shrink-0 cursor-col-resize items-center justify-center bg-slate-100 dark:bg-slate-800 hover:bg-indigo-200 dark:hover:bg-indigo-500/30 active:bg-indigo-300 transition-colors group">
          <div className="w-0.5 h-8 rounded-full bg-slate-300 dark:bg-slate-600 group-hover:bg-indigo-400 transition-colors" />
        </div>

        {/* RIGHT: Editor + Output */}
        <div ref={rightRef} className="flex-1 flex flex-col min-w-0">
          <div style={{ height: `${editorPct}%` }} className="relative shrink-0 overflow-hidden">
            <div className="absolute top-3 right-4 z-10 flex items-center gap-2">
              <span className="bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest">SQLite</span>
            </div>
            <Editor
              defaultLanguage="sql"
              value={query}
              onChange={(val) => setQuery(val || '')}
              theme={isDark ? 'vs-dark' : 'light'}
              options={{ minimap: { enabled: false }, fontSize: 14, padding: { top: 16 }, scrollBeyondLastLine: false, wordWrap: 'on' }}
            />
          </div>

          {/* Vertical Resize Handle */}
          <div onMouseDown={() => onMouseDown('v')}
            className="h-1.5 shrink-0 cursor-row-resize flex items-center justify-center bg-slate-100 dark:bg-slate-800 hover:bg-indigo-200 dark:hover:bg-indigo-500/30 active:bg-indigo-300 transition-colors group">
            <div className="h-0.5 w-8 rounded-full bg-slate-300 dark:bg-slate-600 group-hover:bg-indigo-400 transition-colors" />
          </div>

          {/* Results Panel */}
          <div className="flex-1 bg-white dark:bg-[#1E293B] flex flex-col min-h-0">
            <div className="px-4 border-b border-slate-100 dark:border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button onClick={() => setTab('output')} className={`py-3 text-sm font-bold border-b-2 transition-colors ${tab === 'output' ? 'border-indigo-500 text-indigo-500' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Output</button>
                <button onClick={() => setTab('expected')} className={`py-3 text-sm font-bold border-b-2 transition-colors ${tab === 'expected' ? 'border-indigo-500 text-indigo-500' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Expected</button>
              </div>
              {isCorrect !== null && (
                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${isCorrect ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10' : 'bg-red-50 text-red-600 dark:bg-red-500/10'}`}>
                  {isCorrect ? <CheckCircle weight="fill" /> : <XCircle weight="fill" />}
                  {isCorrect ? 'Correct' : 'Incorrect'}
                </div>
              )}
            </div>
            <div className="flex-1 overflow-auto bg-slate-50 dark:bg-[#0F172A]/50">
              {tab === 'output' ? (
                result === null ? (
                  <div className="h-full flex items-center justify-center text-slate-400 font-bold text-xs uppercase tracking-widest"><Play size={16} className="mr-2" /> Run code to view output</div>
                ) : renderTable(result)
              ) : renderTable(expected)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SQLPractice;
