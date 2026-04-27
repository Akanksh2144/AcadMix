import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Editor from '@monaco-editor/react';
import { Database, Play, CheckCircle, XCircle, List, ArrowLeft, Lightbulb, Table as TableIcon, Eye, EyeSlash, Timer, CircleHalf, BookmarkSimple, MagnifyingGlass, Info, CaretUp } from '@phosphor-icons/react';
import { useTheme } from '../contexts/ThemeContext';
import { placementPrepAPI } from '../services/api';
import PageHeader from '../components/PageHeader';
import { toast } from 'sonner';
import initSqlJs from 'sql.js';
import sqlWasm from 'sql.js/dist/sql-wasm.wasm?url';
import LOCAL_PROBLEMS from '../data/sql_problems.json';
import { format } from 'sql-formatter';

let CACHED_PROBLEMS: any[] | null = null;

const diffColors: Record<string, string> = {
  easy: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/15 border-emerald-100 dark:border-emerald-500/20',
  medium: 'text-amber-600 bg-amber-50 dark:bg-amber-500/15 border-amber-100 dark:border-amber-500/20',
  hard: 'text-red-600 bg-red-50 dark:bg-red-500/15 border-red-100 dark:border-red-500/20'
};

const companyLogos: Record<string, string> = {
  'Accenture': 'accenture.com', 'Adobe': 'adobe.com', 'Amazon': 'amazon.com',
  'Apollo': 'apollohospitals.com', 'Atlassian': 'atlassian.com', 'Capgemini': 'capgemini.com',
  'Cisco': 'cisco.com', 'Cognizant': 'cognizant.com', 'CRED': 'cred.club', 'Deloitte': 'deloitte.com',
  'EY': 'ey.com', 'Flipkart': 'flipkart.com', 'Freshworks': 'freshworks.com', 'Goldman Sachs': 'goldmansachs.com',
  'Google': 'google.com', 'HCLTech': 'hcltech.com', 'HDFC': 'hdfcbank.com', 'HubSpot': 'hubspot.com',
  'ICICI': 'icicibank.com', 'Infosys': 'infosys.com', 'JP Morgan': 'jpmorgan.com',
  'Juspay': 'juspay.in', 'Kotak': 'kotakbank.in', 'KPMG': 'kpmg.com', 'Meta': 'meta.com', 'Microsoft': 'microsoft.com',
  'Morgan Stanley': 'morganstanley.com', 'Myntra': 'myntra.com', 'Ola': 'olacabs.com',
  'Oracle': 'oracle.com', 'Palo Alto': 'paloaltonetworks.com', 'PayPal': 'paypal.com', 'Paytm': 'paytm.com', 'PhonePe': 'phonepe.com',
  'Practo': 'practo.com', 'PwC': 'pwc.com', 'Razorpay': 'razorpay.com', 'Salesforce': 'salesforce.com',
  'SAP': 'sap.com', 'ServiceNow': 'servicenow.com', 'Stripe': 'stripe.com', 'Swiggy': 'swiggy.com',
  'Target': 'target.com', 'TCS': 'tcs.com', 'TCS Digital': 'tcs.com', 'TCS NQT': 'tcs.com', 'Tech Mahindra': 'techmahindra.com',
  'Twilio': 'twilio.com', 'Uber': 'uber.com', 'UnitedHealth': 'uhg.com', 'Walmart': 'walmart.com', 'Wipro': 'wipro.com',
  'Workday': 'workday.com', 'Zendesk': 'zendesk.com', 'Zomato': 'zomato.com', 'Zoho': 'zoho.com',
};

const CompanyLogo = ({ name, size = 16 }: { name: string; size?: number }) => {
  const [error, setError] = React.useState(false);
  const domain = companyLogos[name] || `${name.toLowerCase().replace(/\s+/g, '')}.com`;
  if (!domain) return null;
  
  if (error) {
    return (
      <div 
        className="flex items-center justify-center font-bold text-white shrink-0 rounded-sm"
        style={{ 
          width: size, 
          height: size, 
          backgroundColor: `hsl(${name.split('').reduce((a, b) => a + b.charCodeAt(0), 0) % 360}, 70%, 60%)`,
          fontSize: size * 0.6,
          lineHeight: 1
        }}
        title={name}
      >
        {name.charAt(0).toUpperCase()}
      </div>
    );
  }

  return <img src={`https://img.logo.dev/${domain}?token=pk_WWYqoiQzSIyMyloG92OOgg&size=64&format=png`} alt={name} title={name} className="rounded-sm shrink-0 object-contain bg-white" style={{ width: size, height: size }} onError={() => setError(true)} />;
};

/* ── Custom Filter Dropdown (replaces native <select>) ── */
const FilterDropdown = ({ value, options, onChange, renderOption }: {
  value: string; options: { value: string; label: string; icon?: React.ReactNode }[];
  onChange: (v: string) => void; renderOption?: (o: any) => React.ReactNode;
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
            className="absolute z-50 top-full mt-2 left-0 min-w-[280px] max-h-[320px] overflow-y-auto bg-white dark:bg-[#1E293B] border border-slate-200/70 dark:border-white/10 rounded-2xl shadow-xl shadow-slate-900/10 dark:shadow-black/30 py-2">
            {options.map(o => (
              <button key={o.value} onClick={() => { onChange(o.value); setOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-indigo-50 dark:hover:bg-indigo-500/10 text-left ${value === o.value ? 'bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-700 dark:text-slate-300'}`}>
                {o.icon && <span className="shrink-0">{o.icon}</span>}
                <span className="truncate">{renderOption ? renderOption(o) : o.label}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
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
  const [filterDiff, setFilterDiff] = useState('all');
  const [filterCompany, setFilterCompany] = useState('all');
  const [filterTopic, setFilterTopic] = useState('all');
  const [statusMap, setStatusMap] = useState<Record<string, 'started' | 'solved'>>(() => {
    try { return JSON.parse(localStorage.getItem('sql_status') || '{}'); } catch { return {}; }
  });
  const [bookmarks, setBookmarks] = useState<Record<string, boolean>>(() => {
    try { return JSON.parse(localStorage.getItem('sql_bookmarks') || '{}'); } catch { return {}; }
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [showBookmarked, setShowBookmarked] = useState(false);
  const [showScroll, setShowScroll] = useState(false);

  useEffect(() => {
    const handleScroll = () => setShowScroll(window.scrollY > 400);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollYRef = useRef(0);

  // Initialize selected problem from URL on mount/refresh
  useEffect(() => {
    if (problems.length > 0 && !selectedProblem) {
      const params = new URLSearchParams(window.location.search);
      const pid = params.get('pid');
      if (pid) {
        const p = problems.find(x => x.id === pid);
        if (p) {
          loadProblem(p);
          setTimeout(() => window.scrollTo(0, 0), 10);
        }
      }
    }
  }, [problems]); // Intentionally not including selectedProblem to avoid re-triggering

  const toggleBookmark = (id: string) => {
    setBookmarks(prev => {
      const next = { ...prev };
      if (next[id]) delete next[id]; else next[id] = true;
      localStorage.setItem('sql_bookmarks', JSON.stringify(next));
      return next;
    });
  };
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
    if (CACHED_PROBLEMS) {
      setProblems(CACHED_PROBLEMS);
      setLoading(false);
      return;
    }
    placementPrepAPI.sqlProblems()
      .then((res: any) => {
        const data = res.data?.length ? res.data : LOCAL_PROBLEMS;
        CACHED_PROBLEMS = data;
        setProblems(data);
        setLoading(false);
      })
      .catch(() => {
        CACHED_PROBLEMS = LOCAL_PROBLEMS;
        setProblems(LOCAL_PROBLEMS);
        setLoading(false);
      });
  }, []);

  const loadProblem = (prob: any) => {
    scrollYRef.current = window.scrollY;
    const params = new URLSearchParams(window.location.search);
    params.set('pid', prob.id);
    window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);
    
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

  const handleBackToList = () => {
    const params = new URLSearchParams(window.location.search);
    params.delete('pid');
    const newSearch = params.toString();
    const newUrl = window.location.pathname + (newSearch ? `?${newSearch}` : '');
    window.history.replaceState(null, '', newUrl);
    
    setSelectedProblem(null);
    setTimeout(() => window.scrollTo(0, scrollYRef.current), 10);
  };

  const isResultCorrect = (actual: any[], exp: any[]) => {
    try {
      if (!actual?.length || !exp?.length) return false;
      const normalize = (res: any) => res[0].values.map((r: any[]) => r.join('|')).sort();
      const a = normalize(actual), b = normalize(exp);
      return a.length === b.length && a.every((v: string, i: number) => v === b[i]);
    } catch { return false; }
  };

  const handleRun = async () => {
    if (!selectedProblem) return;
    const t0 = performance.now();

    // ── Backend-only problems (e.g. FULL OUTER JOIN) → PostgreSQL ──
    if (selectedProblem.backend_only) {
      try {
        const res = await placementPrepAPI.executeSqlBackend({
          schema_sql: selectedProblem.schema_sql,
          user_query: query,
          problem_id: selectedProblem.id,
        });
        const pgResult = res.data?.results || res.data?.data?.results;
        setExecTime(+(performance.now() - t0).toFixed(1));
        setResult(pgResult);
        const correct = isResultCorrect(pgResult, expected);
        setIsCorrect(correct);
        if (correct) updateStatus(selectedProblem.id, 'solved');
        else updateStatus(selectedProblem.id, 'started');
        correct ? toast.success('Correct! Great job. (PostgreSQL)') : toast.error('Incorrect. Check the expected output.');
        placementPrepAPI.logSqlAttempt({ problem_id: selectedProblem.id, is_correct: correct, time_taken_sec: Math.round((performance.now() - t0) / 1000) }).catch(() => {});
      } catch (err: any) {
        const msg = err?.response?.data?.detail || err?.message || 'Backend execution failed';
        setResult([{ error_string: msg }]);
        setIsCorrect(false);
        setExecTime(+(performance.now() - t0).toFixed(1));
      }
      return;
    }

    // ── Standard SQLite WASM execution ──
    if (!db) return;
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
  const sp = selectedProblem;

  return (
    <>
      <div className={`min-h-screen bg-slate-50 dark:bg-[#0F172A] ${selectedProblem ? 'hidden' : 'block'}`}>
      <PageHeader navigate={navigate} user={user} title="SQL Practice Arena" subtitle="DataLemur-style challenges from mass recruiters" backTo="placement-hub" hideNotifications />
      <div className="px-4 lg:px-10 py-4 lg:py-6 space-y-5">
        {/* ── Progress Dashboard ── */}
        {(() => {
            const solved = Object.values(statusMap).filter(s => s === 'solved').length;
            const total = problems.length;
            const pct = total ? Math.round((solved / total) * 100) : 0;
            const started = Object.values(statusMap).filter(s => s === 'started').length;
            const diffs = [
              { key: 'easy', label: 'Easy', color: 'bg-emerald-500', track: 'bg-emerald-100 dark:bg-emerald-500/10' },
              { key: 'medium', label: 'Medium', color: 'bg-amber-500', track: 'bg-amber-100 dark:bg-amber-500/10' },
              { key: 'hard', label: 'Hard', color: 'bg-red-500', track: 'bg-red-100 dark:bg-red-500/10' },
            ];
            const stats = diffs.map(d => {
              const t = problems.filter((p: any) => p.difficulty === d.key).length;
              const s = problems.filter((p: any) => p.difficulty === d.key && statusMap[p.id] === 'solved').length;
              return { ...d, solved: s, total: t, pct: t ? Math.round((s / t) * 100) : 0 };
            });
            return (
              <div className="soft-card p-5 flex items-stretch gap-5 max-w-lg">
                {/* Hero stat */}
                <div className="flex flex-col items-center justify-center px-4 border-r border-slate-200/60 dark:border-white/5">
                  <span className="text-4xl font-black bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent leading-none">{pct}%</span>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.2em] mt-1">{solved} solved</span>
                  {started > 0 && <span className="text-[10px] font-bold text-amber-500 mt-0.5">{started} in progress</span>}
                </div>
                {/* Per-difficulty bars */}
                <div className="flex-1 space-y-3 py-1">
                  {stats.map(s => (
                    <div key={s.key}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{s.label}</span>
                        <span className="text-xs font-extrabold tabular-nums text-slate-800 dark:text-white">{s.solved}<span className="text-slate-400 font-medium">/{s.total}</span></span>
                      </div>
                      <div className={`h-2 rounded-full overflow-hidden ${s.track}`}>
                        <div className={`h-full rounded-full ${s.color} transition-all duration-700 ease-out`} style={{ width: `${s.pct}%` }} />
                      </div>
                    </div>
                  ))}
                  {/* Overall bar */}
                  <div className="pt-1 border-t border-slate-100 dark:border-white/5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Overall</span>
                      <span className="text-[10px] font-extrabold tabular-nums text-slate-500">{solved}/{total}</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden bg-slate-100 dark:bg-white/5">
                      <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-700 ease-out" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

        {/* ── Filters ── */}
        {(() => {
          const companies = ['all', ...Array.from(new Set(problems.flatMap((p: any) => p.company_tags || [p.company_tag]).filter(Boolean))).sort()];
          const categories = ['all', ...Array.from(new Set(problems.map((p: any) => p.category).filter(Boolean))).sort()];
          const diffOpts = [
            { value: 'all', label: 'All Difficulties' },
            { value: 'easy', label: 'Easy', icon: <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" /> },
            { value: 'medium', label: 'Medium', icon: <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" /> },
            { value: 'hard', label: 'Hard', icon: <span className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0" /> },
          ];
          const companyOpts = companies.map(c => ({
            value: c, label: c === 'all' ? 'All Companies' : c,
            icon: c !== 'all' ? <CompanyLogo name={c} size={18} /> : undefined,
          }));
          const topicOpts = categories.map(t => ({
            value: t, label: t === 'all' ? 'All Topics' : t,
            icon: t !== 'all' ? <span className="text-violet-500">📘</span> : undefined,
          }));
          return (
            <div className="flex flex-wrap gap-3 items-center">
              {/* Search bar */}
              <div className="relative">
                <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search problems..."
                  className="pl-9 pr-4 py-2.5 rounded-2xl border border-slate-200/70 dark:border-white/10 bg-white dark:bg-[#1E293B] text-sm font-semibold text-slate-700 dark:text-slate-300 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-500/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all w-[200px] placeholder:text-slate-400 placeholder:font-medium"
                />
              </div>
              <FilterDropdown value={filterDiff} options={diffOpts} onChange={setFilterDiff} />
              <FilterDropdown value={filterCompany} options={companyOpts} onChange={setFilterCompany} />
              <FilterDropdown value={filterTopic} options={topicOpts} onChange={setFilterTopic} />
              {/* Bookmark filter */}
              <button onClick={() => setShowBookmarked(!showBookmarked)}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-2xl border text-sm font-semibold transition-all shadow-sm hover:shadow-md ${
                  showBookmarked
                    ? 'bg-amber-50 dark:bg-amber-500/15 border-amber-300 dark:border-amber-500/30 text-amber-600 dark:text-amber-400'
                    : 'bg-white dark:bg-[#1E293B] border-slate-200/70 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-indigo-300 dark:hover:border-indigo-500/30'
                }`}>
                <BookmarkSimple size={16} weight={showBookmarked ? 'fill' : 'regular'} /> Saved
              </button>
              {(filterDiff !== 'all' || filterCompany !== 'all' || filterTopic !== 'all' || searchQuery || showBookmarked) && (
                <button onClick={() => { setFilterDiff('all'); setFilterCompany('all'); setFilterTopic('all'); setSearchQuery(''); setShowBookmarked(false); }}
                  className="text-xs font-bold text-red-500 hover:text-red-400 transition-colors px-3 py-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10">
                  ✕ Clear All
                </button>
              )}
            </div>
          );
        })()}

        {(() => {
          const filtered = problems.filter((p: any) => {
            if (filterDiff !== 'all' && p.difficulty !== filterDiff) return false;
            if (filterCompany !== 'all' && !(p.company_tags || [p.company_tag]).includes(filterCompany)) return false;
            if (filterTopic !== 'all' && p.category !== filterTopic) return false;
            if (showBookmarked && !bookmarks[p.id]) return false;
            if (searchQuery) {
              const q = searchQuery.toLowerCase();
              const hay = `${p.title} ${p.topic} ${p.category} ${p.dataset_theme} ${(p.company_tags || [p.company_tag]).join(' ')}`.toLowerCase();
              if (!hay.includes(q)) return false;
            }
            return true;
          });
          return (
          <>
          <p className="text-xs font-bold text-slate-400">{filtered.length} of {problems.length} problems</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((p: any, i: number) => {
            const status = statusMap[p.id] || 'unsolved';
            const borderColor = status === 'solved' ? 'border-emerald-300 dark:border-emerald-500/30 hover:border-emerald-400'
              : status === 'started' ? 'border-red-300 dark:border-red-500/30 hover:border-red-400'
              : 'border-slate-200 dark:border-white/10 hover:border-indigo-500';
            const titleColor = status === 'solved' ? 'text-emerald-700 dark:text-emerald-400'
              : status === 'started' ? 'text-red-700 dark:text-red-400'
              : 'text-slate-800 dark:text-white';
            return (
            <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              onClick={() => loadProblem(p)}
              className={`relative bg-white dark:bg-[#1E293B] border rounded-2xl p-5 cursor-pointer hover:shadow-xl hover:shadow-indigo-500/10 transition-all group ${borderColor}`}>

              <div className="flex items-start justify-between mb-3 min-h-[3.5rem] gap-2">
                <h3 className={`font-extrabold text-lg group-hover:text-indigo-500 transition-colors line-clamp-2 ${titleColor}`}>{p.title}</h3>
                <span className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-widest shrink-0 ${diffColors[p.difficulty]}`}>{p.difficulty}</span>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-4 min-h-[2.5rem]">{p.problem_statement?.split('\n')[0]}</p>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400 flex-nowrap overflow-hidden">
                <span className="flex items-center gap-1 bg-slate-100 dark:bg-white/5 py-1 px-2 rounded whitespace-nowrap shrink-0"><TableIcon size={14} /> {p.dataset_theme}</span>
                {(() => {
                  const tags = Array.from(new Set(
                    (p.company_tags || [p.company_tag])
                      .filter(Boolean)
                      .map((t: any) => typeof t === 'string' ? t.trim() : t)
                      .filter(Boolean)
                  ));
                  if (tags.length > 6) {
                    return (
                      <div className="flex-1 overflow-hidden">
                        <div className="logo-marquee">
                          {[...tags, ...tags].map((c: string, ci: number) => <CompanyLogo key={ci} name={c} size={20} />)}
                        </div>
                      </div>
                    );
                  }
                  return tags.map((c: string, ci: number) => <CompanyLogo key={ci} name={c} size={20} />);
                })()}
              </div>
              {p.topic && <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2 truncate">📘 {p.topic}</p>}
              {/* Bottom row: bookmark + DB logo */}
              <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100 dark:border-white/5">
                <div className="flex items-center gap-3">
                  <button onClick={(e) => { e.stopPropagation(); toggleBookmark(p.id); }}
                    className={`p-1 -ml-1 rounded-lg transition-all ${bookmarks[p.id] ? 'text-amber-500 hover:text-amber-600' : 'text-slate-300 dark:text-slate-600 hover:text-amber-400 dark:hover:text-amber-500'}`}>
                    <BookmarkSimple size={20} weight={bookmarks[p.id] ? 'fill' : 'regular'} />
                  </button>
                  {status === 'solved' && <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 uppercase tracking-wider"><CheckCircle size={14} weight="bold" /> Solved</span>}
                  {status === 'started' && <span className="flex items-center gap-1 text-[10px] font-bold text-amber-500 uppercase tracking-wider"><CircleHalf size={14} weight="bold" /> Started</span>}
                </div>
                <img src={p.backend_only ? 'https://img.logo.dev/postgresql.org?token=pk_WWYqoiQzSIyMyloG92OOgg&size=64&format=png' : 'https://img.logo.dev/sqlite.org?token=pk_WWYqoiQzSIyMyloG92OOgg&size=64&format=png'} alt={p.backend_only ? 'PostgreSQL' : 'SQLite'} className="w-4 h-4 opacity-40 group-hover:opacity-70 transition-opacity object-contain" />
              </div>
            </motion.div>);
          })}
          </div>
          </>
          );
        })()}
      </div>

      {/* Scroll to Top FAB */}
      <AnimatePresence>
        {showScroll && !selectedProblem && (
          <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} 
            className="fixed bottom-8 right-8 z-50 p-3.5 bg-indigo-600 text-white rounded-full shadow-xl shadow-indigo-500/30 hover:bg-indigo-700 hover:scale-110 active:scale-95 transition-all">
            <CaretUp size={24} weight="bold" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>

      {/* ── Arena (Split Panel) ──────────────────────────────── */}
      {selectedProblem && (
        <div className="flex flex-col h-screen bg-slate-50 dark:bg-[#0F172A]">
      {/* Header */}
      <header className="h-14 shrink-0 bg-white dark:bg-[#1E293B] border-b border-slate-200 dark:border-white/10 px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={handleBackToList} className="p-2 -ml-2 rounded-xl text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors">
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
          {sp?.backend_only && <span className="text-xs font-bold bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 px-2.5 py-1 rounded-lg hidden sm:inline-flex items-center gap-1">🐘 PostgreSQL Engine</span>}
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
                {sp.category === 'Date-Time Functions' && !sp.backend_only && (
                  <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-xl flex gap-3 items-start">
                    <Info size={18} weight="fill" className="text-blue-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-blue-800 dark:text-blue-200 leading-relaxed">
                      <strong>Date-Time Quirks:</strong> This sandbox uses SQLite. On test day (MySQL/SQL Server), you might use <code className="bg-blue-100 dark:bg-blue-900/30 px-1 rounded font-mono text-[10px]">DATEADD</code> or <code className="bg-blue-100 dark:bg-blue-900/30 px-1 rounded font-mono text-[10px]">DATEDIFF</code>. Here, you'll need SQLite's <code className="bg-blue-100 dark:bg-blue-900/30 px-1 rounded font-mono text-[10px]">strftime()</code> or <code className="bg-blue-100 dark:bg-blue-900/30 px-1 rounded font-mono text-[10px]">julianday()</code>.
                    </p>
                  </div>
                )}
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
              <div>
                {/* Solution Tab */}
                {sp.solution_sql ? (
                  <>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">Reference Solution</h4>
                      <button onClick={() => setShowSolution(!showSolution)} className="flex items-center gap-1.5 text-xs font-bold text-indigo-500 hover:text-indigo-600">
                        {showSolution ? <><EyeSlash size={14} /> Hide</> : <><Eye size={14} /> Reveal</>}
                      </button>
                    </div>
                    {showSolution ? (
                      <pre className="select-none bg-slate-50 dark:bg-[#0F172A] rounded-xl p-5 text-[13px] font-mono text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                        {(() => {
                          try {
                            return format(sp.solution_sql, { language: sp.backend_only ? 'postgresql' : 'sqlite', keywordCase: 'upper' });
                          } catch {
                            return sp.solution_sql;
                          }
                        })()}
                      </pre>
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
              <span className="bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest">{sp.backend_only ? 'PostgreSQL' : 'SQLite'}</span>
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
      )}
    </>
  );
};

export default SQLPractice;
