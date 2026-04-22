import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Editor from '@monaco-editor/react';
import { Database, Play, CheckCircle, XCircle, List, ArrowLeft, Lightbulb, Table as TableIcon } from '@phosphor-icons/react';
import { useTheme } from '../contexts/ThemeContext';
import { placementPrepAPI } from '../services/api';
import { toast } from 'sonner';

import initSqlJs from 'sql.js';
import sqlWasm from 'sql.js/dist/sql-wasm.wasm?url';

const diffColors = {
  easy: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/15 border-emerald-100 dark:border-emerald-500/20',
  medium: 'text-amber-600 bg-amber-50 dark:bg-amber-500/15 border-amber-100 dark:border-amber-500/20',
  hard: 'text-red-600 bg-red-50 dark:bg-red-500/15 border-red-100 dark:border-red-500/20'
};

const SQLPractice = ({ navigate, user }) => {
  const { isDark } = useTheme();
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProblem, setSelectedProblem] = useState(null);
  
  // Editor & DB State
  const [query, setQuery] = useState('-- Write your SQL query here\nSELECT * FROM ...;');
  const [db, setDb] = useState(null);
  const [dbError, setDbError] = useState(null);
  
  // Execution Result
  const [result, setResult] = useState(null);
  const [expected, setExpected] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  const [execTime, setExecTime] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [tab, setTab] = useState('output'); // 'output' or 'expected'

  // Ref to track component mount and SQL Engine
  const mounted = useRef(true);
  const sqlEngineRef = useRef(null);

  // Initialize SQLite WASM
  useEffect(() => {
    mounted.current = true;
    const initDB = async () => {
      try {
        if (!sqlEngineRef.current) {
           const SQL = await initSqlJs({ locateFile: () => sqlWasm });
           if (!mounted.current) return;
           sqlEngineRef.current = SQL;
        }
        if (mounted.current) {
          setDb(() => new sqlEngineRef.current.Database());
        }
      } catch (err) {
        console.error("Failed to load generic SQL Engine", err);
        setDbError("Failed to initialize the SQL Engine.");
      }
    };
    initDB();
    return () => { mounted.current = false; };
  }, []);

  // Fetch Problems
  useEffect(() => {
    placementPrepAPI.sqlProblems()
      .then(res => {
        setProblems(res.data);
        setLoading(false);
      })
      .catch((e) => {
        toast.error("Failed to fetch questions");
        setLoading(false);
      });
  }, []);

  // Load a Problem Session
  const loadProblem = (prob) => {
    setSelectedProblem(prob);
    setQuery(`-- Write your query below for: ${prob.title}\n`);
    setResult(null);
    setExpected(prob.expected_output);
    setIsCorrect(null);
    setShowHint(false);
    setTab('output');

    // Re-initialize database schema for this session
    if (sqlEngineRef.current) {
      try {
        // Create fresh memory database
        const freshDb = new sqlEngineRef.current.Database();
        if (prob.schema_sql) {
            freshDb.run(prob.schema_sql);
        }
        setDb(() => freshDb);
      } catch (e) {
         setDbError("Schema loading failed: " + e.message);
      }
    }
  };

  // Compare Arrays of Objects (Order Agnostic)
  const isResultCorrect = (actual, exp) => {
      if (!actual || !exp) return false;
      // SQLite returns: [{columns: ['a'], values: [[1]]}]
      // Expected is stored identically: [{columns: ['a'], values: [[1]]}]
      try {
          if (actual.length !== exp.length) return false;
          // Extremely strict structural deep check
          const normalize = (res) => {
              if (res.length === 0) return [];
              const rawRows = res[0].values.map(valArr => valArr.join('|'));
              return rawRows.sort();
          };
          const normA = normalize(actual);
          const normE = normalize(exp);
          if (normA.length !== normE.length) return false;
          for (let i = 0; i < normA.length; i++) {
              if (normA[i] !== normE[i]) return false;
          }
          return true;
      } catch (e) {
          return false;
      }
  };

  // Run Query
  const handleRunQuery = () => {
    if (!db || !selectedProblem) return;
    const t0 = performance.now();
    try {
      const res = db.exec(query);
      const t1 = performance.now();
      setExecTime((t1 - t0).toFixed(1));
      
      setResult(res);
      
      const correct = isResultCorrect(res, expected);
      setIsCorrect(correct);
      
      if (correct) {
          toast.success("Query Passed! Great job.");
      } else {
          toast.error("Incorrect Output. Check the expected output tab.");
      }

      // Log attempt
      placementPrepAPI.logSqlAttempt({
          problem_id: selectedProblem.id,
          is_correct: correct,
          time_taken_sec: Math.round((t1 - t0)/1000)
      }).catch(() => {});

    } catch (err) {
      setResult([{ error_string: err.message }]);
      setIsCorrect(false);
      setExecTime((performance.now() - t0).toFixed(1));
    }
  };

  if (loading) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0F172A]">
              <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
      );
  }

  // --- Render Problem List ---
  if (!selectedProblem) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0F172A] p-4 lg:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
            <button onClick={() => navigate('/career-toolkit')} className="flex items-center gap-2 text-slate-500 hover:text-indigo-500 transition-colors font-bold text-sm">
                <ArrowLeft size={16} weight="bold" /> Back to Career Toolkit
            </button>
            <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-500/20">
                    <Database size={32} weight="fill" className="text-white" />
                </div>
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">SQL Practice Arena</h1>
                    <p className="text-slate-500">Real-world schemas used by mass recruiters.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {problems.map((p, i) => (
                    <motion.div 
                        initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay: i*0.05 }}
                        key={p.id} 
                        onClick={() => loadProblem(p)}
                        className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-white/10 rounded-2xl p-5 cursor-pointer hover:border-indigo-500 hover:shadow-xl hover:shadow-indigo-500/10 transition-all group relative overflow-hidden"
                    >
                        <div className="flex items-start justify-between mb-3">
                            <h3 className="font-extrabold text-slate-800 dark:text-white text-lg group-hover:text-indigo-500 transition-colors line-clamp-2 pr-4">{p.title}</h3>
                            <span className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-widest flex-shrink-0 ${diffColors[p.difficulty]}`}>
                                {p.difficulty}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mt-4">
                            <span className="flex items-center gap-1 bg-slate-100 dark:bg-white/5 py-1 px-2 rounded"><TableIcon size={14}/> {p.dataset_theme}</span>
                            {p.company_tag && <span className="bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 py-1 px-2 rounded">🏢 {p.company_tag}</span>}
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
      </div>
    );
  }

  // --- Render Arena (DataLemur Layout) ---
  const renderTable = (resultData) => {
      if (!resultData || resultData.length === 0) return <div className="p-4 text-slate-500 text-sm font-medium">No results found.</div>;
      if (resultData[0].error_string) return <div className="p-4 text-red-500 bg-red-50/50 dark:bg-red-500/5 font-mono text-sm whitespace-pre-wrap">{resultData[0].error_string}</div>;
      
      const res = resultData[0];
      if (!res.columns || !res.values) return <div className="p-4 text-slate-500 text-sm font-medium">Empty set.</div>;
      
      return (
        <div className="overflow-x-auto w-full border-t border-slate-100 dark:border-white/5">
            <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 dark:bg-white/5 border-b border-slate-100 dark:border-white/5">
                    <tr>
                        {res.columns.map((col, idx) => (
                            <th key={idx} className="px-4 py-2 font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest text-[10px]">{col}</th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                    {res.values.map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                            {row.map((val, cIdx) => (
                                <td key={cIdx} className="px-4 py-2 text-slate-700 dark:text-slate-300 font-mono text-xs">{val === null ? 'NULL' : val.toString()}</td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      );
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-[#0F172A]">
        {/* Header */}
        <header className="h-16 shrink-0 bg-white dark:bg-[#1E293B] border-b border-slate-200 dark:border-white/10 px-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <button onClick={() => setSelectedProblem(null)} className="p-2 -ml-2 rounded-xl text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors">
                    <List size={22} weight="bold" />
                </button>
                <div className="w-8 h-8 flex items-center justify-center bg-indigo-500 rounded-lg text-white font-extrabold shadow-md">
                    <Database size={16} weight="fill" />
                </div>
                <div>
                    <h2 className="font-extrabold text-slate-800 dark:text-white text-sm line-clamp-1">{selectedProblem.title}</h2>
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className={`px-1.5 py-0.5 border rounded uppercase text-[9px] font-bold tracking-widest ${diffColors[selectedProblem.difficulty]}`}>{selectedProblem.difficulty}</span>
                        {selectedProblem.company_tag && <span className="text-[10px] font-bold text-slate-400">{selectedProblem.company_tag}</span>}
                        <span className="bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded text-[9px] font-bold tracking-widest uppercase ml-1">SQLite Dialect</span>
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <button 
                  onClick={handleRunQuery}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-transform active:scale-95"
                >
                    <Play size={16} weight="fill" /> Run Query
                </button>
            </div>
        </header>

        {/* Content Splitter */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
            {/* Left Panel: Problem Statement */}
            <div className="w-full lg:w-1/3 bg-white dark:bg-[#1E293B] overflow-y-auto border-r border-slate-200 dark:border-white/10 flex flex-col">
                <div className="p-6">
                    <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-4">Problem Statement</h3>
                    <div className="prose prose-slate dark:prose-invert prose-sm max-w-none text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                        {selectedProblem.problem_statement}
                    </div>
                    
                    <div className="mt-8">
                        <button onClick={() => setShowHint(!showHint)} className="flex items-center gap-2 text-amber-500 font-bold text-xs uppercase tracking-widest hover:text-amber-600 transition-colors mb-3">
                            <Lightbulb size={16} weight="duotone" /> {showHint ? 'Hide Hint' : 'Show Hint'}
                        </button>
                        <AnimatePresence>
                            {showHint && selectedProblem.hint && (
                                <motion.div initial={{ height:0, opacity:0 }} animate={{ height:'auto', opacity:1 }} exit={{ height:0, opacity:0 }} className="p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl">
                                    <p className="text-sm font-medium text-amber-900 dark:text-amber-200">{selectedProblem.hint}</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="mt-8 border-t border-slate-100 dark:border-white/10 pt-6">
                        <h4 className="font-extrabold text-slate-800 dark:text-white mb-4 flex items-center gap-2"><TableIcon size={18} weight="duotone" className="text-indigo-500"/> Schema Reference</h4>
                        <div className="bg-slate-50 dark:bg-[#0F172A] rounded-xl p-4 overflow-x-auto text-[11px] font-mono whitespace-pre-wrap text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/10">
                            {selectedProblem.schema_sql.split('INSERT')[0]} 
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Panel: Editor + Output */}
            <div className="w-full lg:w-2/3 flex flex-col">
                {/* Editor Top */}
                <div className="flex-1 relative border-b border-slate-200 dark:border-white/10 min-h-[300px]">
                    <Editor
                        defaultLanguage="pgsql"
                        value={query}
                        onChange={(val) => setQuery(val)}
                        theme={isDark ? 'vs-dark' : 'light'}
                        options={{
                            minimap: { enabled: false },
                            fontSize: 14,
                            padding: { top: 16 },
                            scrollBeyondLastLine: false,
                            wordWrap: 'on'
                        }}
                    />
                </div>

                {/* Results Bottom */}
                <div className="h-64 bg-white dark:bg-[#1E293B] shrink-0 flex flex-col">
                    <div className="px-4 border-b border-slate-100 dark:border-white/10 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button onClick={() => setTab('output')} className={`py-3 text-sm font-bold border-b-2 transition-colors ${tab === 'output' ? 'border-indigo-500 text-indigo-500' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>Output</button>
                            <button onClick={() => setTab('expected')} className={`py-3 text-sm font-bold border-b-2 transition-colors ${tab === 'expected' ? 'border-indigo-500 text-indigo-500' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>Expected</button>
                        </div>
                        {isCorrect !== null && (
                            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${isCorrect ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 flex-row' : 'bg-red-50 text-red-600 dark:bg-red-500/10'}`}>
                                {isCorrect ? <CheckCircle weight="fill" /> : <XCircle weight="fill" />} 
                                {isCorrect ? 'Correct' : 'Incorrect'}
                            </div>
                        )}
                        {execTime > 0 && <span className="text-xs font-bold text-slate-400 bg-slate-50 dark:bg-white/5 px-2 py-0.5 rounded">{execTime}ms</span>}
                    </div>
                    <div className="flex-1 overflow-auto bg-slate-50 dark:bg-[#0F172A]/50">
                        {tab === 'output' ? (
                            result === null ? (
                                <div className="h-full flex items-center justify-center text-slate-400 font-bold text-xs uppercase tracking-widest"><Play size={16} className="mr-2"/> Run query to see output</div>
                            ) : renderTable(result)
                        ) : (
                            renderTable(expected)
                        )}
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default SQLPractice;
