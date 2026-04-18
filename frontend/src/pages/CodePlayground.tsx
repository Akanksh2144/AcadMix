import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Play, Terminal, Copy, Trash, CaretDown, Lightning, Clock, CheckCircle, ChartBar, WarningCircle, X, Funnel, ArrowCounterClockwise, Sparkle, ChartLineUp, Eye, CheckSquareOffset, Plus, MagnifyingGlass } from '@phosphor-icons/react';
import PageHeader from '../components/PageHeader';
import { toast } from 'sonner';

import Editor from '@monaco-editor/react';
import api from '../services/api';
import { useTheme } from '../contexts/ThemeContext';

const LANGUAGES = [
  { id: 'python', label: 'Python', icon: <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/python/python-original.svg" alt="Python" className="w-5 h-5 shrink-0 drop-shadow-sm" /> },
  { id: 'javascript', label: 'JavaScript', icon: <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/javascript/javascript-original.svg" alt="JavaScript" className="w-5 h-5 shrink-0 rounded-sm drop-shadow-sm" /> },
  { id: 'java', label: 'Java', icon: <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/java/java-original.svg" alt="Java" className="w-5 h-5 shrink-0 drop-shadow-sm" /> },
  { id: 'c', label: 'C', icon: <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/c/c-original.svg" alt="C" className="w-5 h-5 shrink-0 drop-shadow-sm" /> },
  { id: 'cpp', label: 'C++', icon: <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/cplusplus/cplusplus-original.svg" alt="C++" className="w-5 h-5 shrink-0 drop-shadow-sm" /> },
];

const DEFAULT_TEMPLATES = {
  python: '# Write your Python code here\n\ndef main():\n    print("Hello, World!")\n\nmain()\n',
  javascript: '// Write your JavaScript code here\n\nfunction main() {\n  console.log("Hello, World!");\n}\n\nmain();\n',
  java: 'public class Solution {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}\n',
  c: '#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}\n',
  cpp: '#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, World!" << endl;\n    return 0;\n}\n'
};

const CodePlayground = ({ navigate, user }) => {
  const { isDark } = useTheme();
  const [language, setLanguage] = useState('python');
  const [code, setCode] = useState(DEFAULT_TEMPLATES['python']);
  const [stdin, setStdin] = useState('');
  const [output, setOutput] = useState(null);
  const [testResults, setTestResults] = useState([]);
  const [running, setRunning] = useState(false);
  const [execTime, setExecTime] = useState(null);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const langMenuRef = useRef(null);

  // Close language dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target)) {
        setShowLangMenu(false);
      }
    };
    if (showLangMenu) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showLangMenu]);
  
  const [showChallengesModal, setShowChallengesModal] = useState(false);
  const [showInsightsModal, setShowInsightsModal] = useState(false);
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [aiReview, setAiReview] = useState(null);
  const [reviewing, setReviewing] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  
  const [showCoach, setShowCoach] = useState(false);
  const [coachMessages, setCoachMessages] = useState([]);
  const [isCoachTyping, setIsCoachTyping] = useState(false);
  const [coachInput, setCoachInput] = useState('');
  const endOfMessagesRef = useRef(null);
  
  const [history, setHistory] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [isChallengesLoading, setIsChallengesLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [activeChallenge, setActiveChallenge] = useState(() => {
    const saved = localStorage.getItem('acadmix_active_challenge');
    return saved ? JSON.parse(saved) : null;
  });

  const [activeConsoleTab, setActiveConsoleTab] = useState('test_cases');
  const formatPythonLiteral = (str) => {
    if (typeof str === 'string' && str.startsWith('"') && str.endsWith('"') && str.includes('\\n')) {
      return str.slice(1, -1).replace(/\\n/g, '\n');
    }
    return str || '';
  };

  const [userTestCases, setUserTestCases] = useState(() => {
    const saved = localStorage.getItem('acadmix_active_challenge');
    if (saved) {
      try {
        const challenge = JSON.parse(saved);
        if (challenge.test_cases) {
          const unhidden = challenge.test_cases.filter(tc => !tc.is_hidden).map(tc => ({
            input_data: formatPythonLiteral(tc.input_data),
            expected_output: tc.expected_output
          }));
          if (unhidden.length > 0) return unhidden;
        }
      } catch(e) {}
    }
    return [{ input_data: '', expected_output: '' }];
  });
  const [activeTestCaseIdx, setActiveTestCaseIdx] = useState(0);

  const handleLoadChallenge = (challenge) => {
    setActiveChallenge(challenge);
    setLanguage(challenge.language || 'python');
    setCode(challenge.template_code || DEFAULT_TEMPLATES[challenge.language || 'python']);
    setOutput(null);
    setExecTime(null);
    setShowChallengesModal(false);
    
    if (challenge.test_cases) {
       const unhidden = challenge.test_cases.filter(tc => !tc.is_hidden).map(tc => ({
           input_data: formatPythonLiteral(tc.input_data),
           expected_output: tc.expected_output
       }));
       setUserTestCases(unhidden.length > 0 ? unhidden : [{ input_data: '', expected_output: '' }]);
    }
    setActiveTestCaseIdx(0);
    setActiveConsoleTab('test_cases');
  };

  useEffect(() => {
    if (activeChallenge) {
      localStorage.setItem('acadmix_active_challenge', JSON.stringify(activeChallenge));
    } else {
      localStorage.removeItem('acadmix_active_challenge');
    }
  }, [activeChallenge]);
  
  // Resizable Pane State
  const [leftWidth, setLeftWidth] = useState(40); // Initial 40% width for left pane
  const [topHeight, setTopHeight] = useState(66); // Initial height for top code editor pane
  const [isDragging, setIsDragging] = useState(false);
  const [isDraggingH, setIsDraggingH] = useState(false);
  const containerRef = useRef(null);
  const rightPaneRef = useRef(null);
  
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging && containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        let newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
        if (newWidth < 20) newWidth = 20;
        if (newWidth > 80) newWidth = 80;
        setLeftWidth(newWidth);
      } else if (isDraggingH && rightPaneRef.current) {
        const rightRect = rightPaneRef.current.getBoundingClientRect();
        let newHeight = ((e.clientY - rightRect.top) / rightRect.height) * 100;
        if (newHeight < 20) newHeight = 20;
        if (newHeight > 80) newHeight = 80;
        setTopHeight(newHeight);
      }
    };
    const handleMouseUp = () => {
      if (isDragging) setIsDragging(false);
      if (isDraggingH) setIsDraggingH(false);
    };
    
    if (isDragging || isDraggingH) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none';
      if (isDragging) document.body.style.cursor = 'col-resize';
      if (isDraggingH) document.body.style.cursor = 'row-resize';
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [isDragging, isDraggingH]);

  const editorRef = useRef(null);

  useEffect(() => {
    fetchChallenges();
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchChallenges = async () => {
    setIsChallengesLoading(true);
    try {
      const res = await api.get('/challenges', { params: { limit: 100 } });
      const rawData = res.data?.data || res.data;
      const parsedChallenges = Array.isArray(rawData) ? rawData : [];
      setChallenges(parsedChallenges);
      
      // Auto-update activeChallenge if we now have test_cases from the backend
      if (activeChallenge && parsedChallenges.length > 0) {
        const freshActive = parsedChallenges.find(c => c.id === activeChallenge.id);
        if (freshActive && freshActive.test_cases && !activeChallenge.test_cases) {
          handleLoadChallenge(freshActive);
        }
      }
    } catch(err) { console.error(err); }
    setIsChallengesLoading(false);
  };

  const filteredChallenges = React.useMemo(() => {
    return challenges.filter(c => {
      const matchDiff = !difficultyFilter || c.difficulty === difficultyFilter;
      const term = searchQuery.toLowerCase();
      const matchSearch = !term || (c.title && c.title.toLowerCase().includes(term)) || (c.topics && c.topics.some(t => t.toLowerCase().includes(term)));
      return matchDiff && matchSearch;
    });
  }, [challenges, difficultyFilter, searchQuery]);
  
  const fetchStats = async () => {
    try {
      const res = await api.get('/challenges/stats');
      setStats(res.data);
    } catch(err) { console.error(err); }
  };

  const currentLang = LANGUAGES.find(l => l.id === language);

  const handleLanguageChange = (langId) => {
    setLanguage(langId);
    const challengeTemplate = activeChallenge?.init_code?.[langId] || activeChallenge?.template_code;
    if (langId === (activeChallenge?.language || 'python') && challengeTemplate) {
      setCode(challengeTemplate);
    } else {
      setCode(activeChallenge?.init_code?.[langId] || DEFAULT_TEMPLATES[langId] || '');
    }
    setOutput(null);
    setExecTime(null);
    setShowLangMenu(false);
  };

  const _executeCodeHit = async (is_submit = false) => {
    if (!code.trim() || running) return;
    setRunning(true);
    if (is_submit) setActiveConsoleTab('results');
    setOutput(null);
    const startTime = Date.now();
    try {
      let data = {};
      if (activeChallenge) {
        const endpoint = is_submit ? '/challenges/submit' : '/challenges/run';
        const res = await api.post(endpoint, {
          code,
          language,
          challenge_id: activeChallenge.id,
          test_cases: is_submit ? [] : userTestCases // Pass custom user test cases for Run mode
        });
        data = res.data;
        if(is_submit && data.success) fetchStats(); 
      } else {
        const res = await api.post('/code/execute', {
          code,
          language,
          test_input: '',
        });
        data = res.data;
      }

      const elapsed = Date.now() - startTime;
      setExecTime(elapsed);
      const result = data.error && data.exit_code !== 0
        ? `Error:\n${data.error}`
        : data.output || '(no output)';
      
      let rawOutput = result;
      if (rawOutput && rawOutput.includes('___ACADMIX_SEP___')) {
         const parts = rawOutput.split('___ACADMIX_SEP___');
         rawOutput = rawOutput.replace(/___ACADMIX_SEP___/g, '').replace(/___ACADMIX_END___/g, '');
         const parsedResults = userTestCases.map((tc, idx) => {
             const actual = (parts[idx] || '').trim();
             let passed = null;
             if (tc.expected_output && tc.expected_output.trim() !== '') {
                 passed = actual === tc.expected_output.trim();
             }
             return { actual_output: actual, passed };
         });
         setTestResults(parsedResults);
      } else {
         setTestResults([]);
      }
      
      setOutput(rawOutput);
      
      setHistory(prev => [{
        language,
        code: code.substring(0, 100) + (code.length > 100 ? '...' : ''),
        rawCode: code,
        output: result.substring(0, 80),
        rawOutput: result,
        time: elapsed,
        timestamp: new Date().toLocaleTimeString(),
        success: data.exit_code === 0,
      }, ...prev].slice(0, 10));

    } catch (err) {
      console.error("CodeRunner Error:", err, err.response?.data);
      const errDetail = err.response?.data?.detail 
                     || err.response?.data?.error 
                     || (err.message === 'Network Error' ? 'Network Error: Backend is unreachable or CORS failed' : null)
                     || 'Execution failed. Please try again.';
      
      if (err.response?.status === 404 && typeof errDetail === 'string' && errDetail.includes('Challenge not found')) {
        setActiveChallenge(null);
        localStorage.removeItem('acadmix_active_challenge');
        toast.error("The challenge you were working on was no longer found. Returning to free-code mode.", { duration: 5000 });
      }

      setOutput(`Error: ${typeof errDetail === 'string' ? errDetail : JSON.stringify(errDetail)}`);
      setExecTime(Date.now() - startTime);
    }
    setRunning(false);
  };
  
  const handleRun = () => _executeCodeHit(false);
  const handleSubmit = () => _executeCodeHit(true);

  const handleCoachSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!coachInput.trim() || isCoachTyping) return;
    
    const newMessages = [...coachMessages, { role: "user", content: coachInput }];
    setCoachMessages(newMessages);
    setCoachInput('');
    setIsCoachTyping(true);

    try {
      const isError = output && output.startsWith('Error:');
      const token = localStorage.getItem('auth_token');
      const url = `${import.meta.env.VITE_BACKEND_URL || ''}/api/code/coach`;

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          messages: newMessages,
          language,
          code,
          output: isError ? '' : (output || ''),
          error: isError ? output : '',
          challenge_title: activeChallenge?.title,
          challenge_description: activeChallenge?.description
        })
      });

      if (!res.ok) throw new Error("Network Error");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      
      let messageStarted = false;
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        if (!chunk) continue;
        
        if (!messageStarted) {
           messageStarted = true;
           setIsCoachTyping(false);
           setCoachMessages(prev => [...prev, { role: "assistant", content: chunk }]);
        } else {
           setCoachMessages(prev => {
              const updated = [...prev];
              const lastMessage = { ...updated[updated.length - 1] };
              lastMessage.content += chunk;
              updated[updated.length - 1] = lastMessage;
              return updated;
           });
        }
      }
    } catch (err) {
      console.error("AI Coach Error:", err);
      setCoachMessages(prev => [...prev, { role: "assistant", content: "*Transmission failed. Please try again.*" }]);
    }
    setIsCoachTyping(false);
  };

  useEffect(() => {
    if (endOfMessagesRef.current) {
      endOfMessagesRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [coachMessages, isCoachTyping]);

  const handleAnalysis = async (run) => {
    setReviewing(true);
    setShowReviewModal(true);
    
    if (run.aiReview) {
      setAiReview(run.aiReview);
      setReviewing(false);
      return;
    }
    
    setAiReview("");
    try {
      const isError = run.rawOutput && run.rawOutput.startsWith('Error:');
      const resData = await api.post('/code/review', {
        language: run.language,
        code: run.rawCode || run.code,
        output: isError ? '' : (run.rawOutput || ''),
        error: isError ? run.rawOutput : '',
        execution_time_ms: run.time || 0
      });

      const initData = resData.data || resData;
      
      // Short-circuit if the backend executed synchronously (ARQ fallback)
      if (initData.status === "completed" && initData.task_id === "sync-fallback") {
          run.aiReview = initData.review;
          setAiReview(initData.review);
          setReviewing(false);
          return;
      }
      
      const taskId = initData.task_id;
      
      // Polling Mechanism for Async Event Queue Simulation
      let attempts = 0;
      while (attempts < 30) {
          const delay = attempts < 5 ? 500 : 1500;
          await new Promise(resolve => setTimeout(resolve, delay));
          attempts++;
          
          try {
              const statusResData = await api.get(`/code/review_status/${taskId}`);
              const statusData = statusResData.data || statusResData;
              
              if (statusData.status === "completed") {
                  run.aiReview = statusData.review;
                  setAiReview(statusData.review);
                  break;
              } else if (statusData.status === "failed") {
                  throw new Error(statusData.error || "Async task failed");
              }
          } catch (pollingErr) {
              // Ignore polling 404s/500s or processing loops
          }
      }
      
    } catch (err) {
      console.error("AI Review Error:", err);
      let errMsg = err.message;
      try {
        const parsed = JSON.parse(errMsg);
        if (parsed.detail) errMsg = parsed.detail;
      } catch (e) {}

      setAiReview({
          time_complexity: "Error",
          space_complexity: "Error",
          logic_summary: `AI Code Analysis failed: ${errMsg}`,
          suggested_improvements: ["Please fix the above error and try again."]
      });
    }
    setReviewing(false);
  };

  const handleCopyOutput = () => {
    if (output) navigator.clipboard.writeText(output);
  };

  const handleClearOutput = () => {
    setOutput(null);
    setExecTime(null);
  };

  const handleEditorMount = (editor) => {
    editorRef.current = editor;
  };

  const handleCopyOrCut = () => {
    try {
      if (editorRef.current) {
        const selection = editorRef.current.getSelection();
        let text = editorRef.current.getModel().getValueInRange(selection);
        // Handle empty selection (Monaco full line copy)
        if (!text && selection.startLineNumber) {
           text = editorRef.current.getModel().getLineContent(selection.startLineNumber) + '\n';
        }
        window.__editorCopiedText = text;
      }
    } catch(err) {}
  };

  const handlePasteCapture = (e) => {
    let pastedText = e.clipboardData.getData('text') || '';
    let copiedText = window.__editorCopiedText || '';
    
    // Normalize line endings to prevent cross-OS paste mismatch blocks
    pastedText = pastedText.replace(/\r\n/g, '\n');
    copiedText = copiedText.replace(/\r\n/g, '\n');

    if (pastedText && pastedText !== copiedText) {
      // Final fallback for edge-case whitespace/line-endings mismatch in line copies
      if (pastedText.trim() === copiedText.trim()) return;
      e.preventDefault();
      e.stopPropagation();
      toast.error("🛡️ Integrity Lock Active: Pasting from external sources is disabled during this session. You may only move code copied from within this editor.", { duration: 5000 });
    }
  };

  const dashboardPage = user?.role === 'teacher' ? 'teacher-dashboard' : user?.role === 'admin' ? 'admin-dashboard' : 'student-dashboard';

  return (
    <div className="h-screen flex flex-col bg-[#F8FAFC] dark:bg-[#0B0F19] transition-colors duration-300">
      <PageHeader
        navigate={navigate} user={user} title="Code Playground"
        subtitle="Practice coding algorithms & data structures"
        maxWidth="max-w-[1600px]"
        rightContent={
          <>
            <button
              onClick={() => setShowInsightsModal(true)}
              className="hidden lg:flex bg-white hover:bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 !px-4 !py-2.5 text-sm font-semibold rounded-xl transition-all shadow-sm items-center gap-2"
            >
              <ChartBar size={16} weight="duotone" />
              Insights
            </button>
            <button
              data-testid="challenges-button"
              onClick={() => setShowChallengesModal(true)}
              className="hidden lg:flex btn-primary !px-4 !py-2.5 text-sm items-center gap-2"
            >
              <Lightning size={16} weight="duotone" />
              Problem List
            </button>
          </>
        }
      />

      {/* Main Layout Area */}
      {activeChallenge ? (
        // Split-pane layout for selected challenge
        <div className="flex-1 overflow-y-auto lg:overflow-hidden p-4 lg:p-6 flex flex-col lg:flex-row" ref={containerRef}>
          {/* Left Side: Question Description (Hidden on mobile) */}
          <div style={{ width: window.innerWidth >= 1024 ? `calc(${leftWidth}% - 12px)` : '100%' }} className="hidden lg:flex flex-col h-full bg-white rounded-2xl dark:bg-[#1A202C] shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden relative">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 line-clamp-1 flex-1 mr-4">{activeChallenge.title}</h2>
              <div className="flex items-center gap-3 shrink-0">
                <span className={`text-xs px-2.5 py-1 rounded-xl border font-bold ${activeChallenge.difficulty === 'Easy' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/25' : activeChallenge.difficulty === 'Medium' ? 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/25' : 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-500/15 dark:text-rose-400 dark:border-rose-500/25'}`}>
                  {activeChallenge.difficulty}
                </span>
                <button onClick={() => { setActiveChallenge(null); setShowCoach(false); }} className="text-sm font-bold text-slate-400 hover:text-slate-600 dark:text-slate-400" title="Exit Challenge">
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="p-6 flex-1 overflow-y-auto custom-scrollbar text-slate-700 dark:text-slate-300 space-y-8">
              {/* Markdown Description */}
              <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:font-bold prose-h1:text-xl prose-h2:text-lg prose-p:leading-relaxed prose-a:text-indigo-500">
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h2: ({node, ...props}) => <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-6 mb-3" {...props} />,
                    h3: ({node, ...props}) => <h3 className="text-[16px] font-bold text-slate-900 dark:text-slate-100 mt-6 mb-2 border-b border-slate-200 dark:border-slate-700 pb-1" {...props} />,
                    hr: ({node, ...props}) => <hr className="border-slate-200 dark:border-slate-700 my-4" {...props} />,
                    pre: ({node, ...props}) => (
                      <pre className="bg-[#F9FAFB] dark:bg-[#1A1D24] border-l-[3px] border-[#F59E0B] dark:border-amber-500 pl-4 pr-4 py-3 rounded-r-lg overflow-x-auto text-[14px] my-5 font-sans whitespace-pre-wrap text-slate-700 dark:text-slate-300" {...props} />
                    ),
                    code: ({node, inline, children, ...props}) => {
                      if (inline) {
                        return <code className="bg-slate-100 dark:bg-white/10 px-1.5 py-0.5 rounded text-rose-600 dark:text-rose-400 font-mono text-[13px]" {...props}>{children}</code>;
                      }
                      const raw = String(Array.isArray(children) ? children.join('') : children || '');
                      if (/(Input|Output|Explanation)\s*:/i.test(raw)) {
                        const cleaned = raw.replace(/\n{2,}/g, '\n');
                        const parts = cleaned.split(/((?:Input|Output|Explanation)\s*:)/gi);
                        return (
                          <code className="font-mono text-[14px] block whitespace-pre-wrap" {...props}>
                            {parts.map((part, i) => {
                              if (/^(Input|Output|Explanation)\s*:$/i.test(part)) {
                                return <strong key={i} className="font-bold text-slate-900 dark:text-slate-100">{part}</strong>;
                              }
                              // Semibold for Option X:, Step X:, Slot X:, Case X: labels
                              const labeled = (part as string).replace(
                                /^((?:Option|Step|Slot|Case)\s*\d+[^:\n]*:)/gim,
                                '|||SEMI|||$1|||/SEMI|||'
                              );
                              if (labeled.includes('|||SEMI|||')) {
                                return <span key={i}>{labeled.split(/(\|\|\|SEMI\|\|\||\|\|\|\/SEMI\|\|\|)/).map((seg, j) => {
                                  if (seg === '|||SEMI|||' || seg === '|||/SEMI|||') return null;
                                  // Check if previous delimiter was |||SEMI|||
                                  const prevIdx = labeled.split(/(\|\|\|SEMI\|\|\||\|\|\|\/SEMI\|\|\|)/).indexOf(seg);
                                  const isSemi = prevIdx > 0 && labeled.split(/(\|\|\|SEMI\|\|\||\|\|\|\/SEMI\|\|\|)/)[prevIdx - 1] === '|||SEMI|||';
                                  return isSemi ? <strong key={j} className="font-semibold text-slate-500 dark:text-slate-400">{seg}</strong> : <span key={j}>{seg}</span>;
                                })}</span>;
                              }
                              return <span key={i}>{part}</span>;
                            })}
                          </code>
                        );
                      }
                      return <code className="font-mono text-[14px]" {...props}>{children}</code>;
                    },
                    strong: ({node, ...props}) => <strong className="font-bold text-slate-900 dark:text-slate-100" {...props} />,
                  }}
                >
                  {activeChallenge.description}
                </ReactMarkdown>
              </div>

              {/* Real World Applications */}
              {activeChallenge.problem_ai_context && (
                <div className="pt-2">
                  <h3 className="text-[16px] font-bold text-slate-900 dark:text-slate-100 mb-3 tracking-wide">Real-World Use Cases</h3>
                  <div className="bg-[#F8F9FA] dark:bg-[#1E232D] rounded-xl overflow-hidden shadow-sm">
                    {['real_world_applications'].map((key, idx) => {
                      let value = activeChallenge.problem_ai_context[key] || "The underlying algorithms and mathematical principles tested in this problem are foundational structures commonly deployed in distributed systems, cryptography, memory-allocation constraints, and real-time load balancing architecture across scalable B2B architecture.";
                      value = value.replace(/^\s*\*\*\s*$/gm, '').replace(/\*\*\s*\*\*/g, '').trim();
                      
                      const title = 'Real-Time Use Cases & Applications';
                      return (
                        <details key={idx} className="group border-b border-white outline-none dark:border-slate-800/50 last:border-0 [&_summary::-webkit-details-marker]:hidden">
                          <summary className="flex items-center justify-between px-5 py-4 cursor-pointer select-none outline-none hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors">
                            <span className="text-[14px] text-slate-600 dark:text-slate-300 font-medium">{title}</span>
                            <CaretDown size={14} className="text-slate-400 transition-transform duration-200 group-open:rotate-180" weight="bold" />
                          </summary>
                          <div className="px-5 pb-5 pt-2 text-[14px] text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-200 dark:border-slate-700/50 mx-0 mt-0 text-start bg-transparent">
                             <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
                               p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                               strong: ({node, ...props}) => <strong className="font-semibold text-slate-700 dark:text-slate-200" {...props} />,
                             }}>{value}</ReactMarkdown>
                          </div>
                        </details>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Splitter / Resizer (Hidden on mobile) */}
          <div 
            className="hidden lg:flex w-6 shrink-0 flex-col justify-center items-center cursor-col-resize group z-10"
            onMouseDown={(e) => { e.preventDefault(); setIsDragging(true); }}
            title="Drag to resize panels"
          >
            <div className={`h-16 w-1 rounded-full transition-colors ${isDragging ? 'bg-indigo-50 dark:bg-indigo-500/150' : 'bg-slate-200 group-hover:bg-indigo-300'}`}></div>
          </div>

          {/* Right Side: Code Editor (Top) & Output (Bottom) */}
          <div style={{ width: window.innerWidth >= 1024 ? `calc(${100 - leftWidth}% - 12px)` : '100%' }} className="flex flex-col lg:h-full gap-4 lg:gap-0 relative min-h-[600px] lg:min-h-0" ref={rightPaneRef}>
            {/* Editor Container */}
            <div style={{ height: window.innerWidth >= 1024 ? `calc(${topHeight}% - 12px)` : 'auto' }} className="flex-1 lg:flex-none flex flex-col bg-white rounded-2xl dark:bg-[#1A202C] shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden min-h-[400px] lg:min-h-0">
              <div className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700 px-4 py-2 flex items-center justify-between">
                <div className="relative" ref={langMenuRef}>
                  <button onClick={() => setShowLangMenu(!showLangMenu)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-white/10 transition-colors font-semibold text-sm text-slate-700 dark:text-slate-300">
                    <span className="text-lg leading-none">{currentLang?.icon}</span>
                    {currentLang?.label}
                    <CaretDown size={14} weight="bold" />
                  </button>
                  {showLangMenu && (
                    <div className="absolute top-full left-0 mt-2 bg-white rounded-xl dark:bg-[#151B2B] shadow-xl border border-slate-100 dark:border-white/10 p-1 z-50 min-w-[160px]">
                      {LANGUAGES.map(lang => (
                        <button key={lang.id} onClick={() => handleLanguageChange(lang.id)}
                          className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center gap-3 transition-colors text-sm font-medium ${language === lang.id ? 'bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300' : 'hover:bg-slate-50 dark:hover:bg-white/[0.06] text-slate-700 dark:text-slate-300'}`}>
                          <span className="text-lg leading-none">{lang.icon}</span>
                          {lang.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => { setCode(DEFAULT_TEMPLATES[language] || ''); setOutput(null); }} className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 dark:text-slate-400 transition-colors mr-2" title="Reset Code">
                    <ArrowCounterClockwise size={18} weight="duotone" />
                  </button>

                  <button onClick={handleRun} disabled={running} className="bg-slate-100 dark:bg-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 !px-4 !py-1.5 text-sm flex items-center gap-2 font-bold rounded-xl disabled:opacity-60 transition-colors">
                    {running ? <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div> : <Play size={16} weight="fill" className="text-slate-500 dark:text-slate-400" />}
                    Run
                  </button>
                  {activeChallenge && (
                    <button onClick={handleSubmit} disabled={running} className="bg-indigo-500 hover:bg-indigo-600 text-white !px-4 !py-1.5 text-sm flex items-center gap-2 font-bold rounded-xl disabled:opacity-60 transition-colors shadow-sm shadow-indigo-500/20">
                      {running ? <div className="w-4 h-4 border-2 border-white/50 border-t-transparent rounded-full animate-spin"></div> : <CheckCircle size={16} weight="bold" />}
                      Submit
                    </button>
                  )}
                </div>
              </div>
              <div className="flex-1" onCopyCapture={handleCopyOrCut} onCutCapture={handleCopyOrCut} onPasteCapture={handlePasteCapture}>
                <Editor
                  height="100%"
                  language={language}
                  value={code}
                  onChange={(val) => setCode(val || '')}
                  onMount={handleEditorMount}
                  theme={isDark ? 'vs-dark' : 'vs-light'}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    lineNumbers: 'on',
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    padding: { top: 16, bottom: 16 },
                    tabSize: language === 'python' ? 4 : 2,
                    wordWrap: 'on'
                  }}
                />
              </div>
            </div>

            {/* Horizontal Splitter / Resizer (Hidden on mobile) */}
            <div 
              className="hidden lg:flex h-6 shrink-0 flex-row justify-center items-center cursor-row-resize group z-10"
              onMouseDown={(e) => { e.preventDefault(); setIsDraggingH(true); }}
              title="Drag to resize panes"
            >
              <div className={`w-16 h-1 rounded-full transition-colors ${isDraggingH ? 'bg-indigo-50 dark:bg-indigo-500/150' : 'bg-slate-200 group-hover:bg-indigo-300'}`}></div>
            </div>

            {/* Output Container */}
            <div style={{ height: window.innerWidth >= 1024 ? `calc(${100 - topHeight}% - 12px)` : 'auto' }} className="h-1/3 lg:h-auto min-h-[220px] lg:flex-none shrink-0 flex flex-col bg-slate-900 rounded-2xl shadow-sm overflow-hidden border border-slate-700/50">
              <div className="bg-slate-800/80 px-4 py-2 flex items-center justify-between border-b border-slate-700/50">
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => setActiveConsoleTab('test_cases')}
                    className={`px-4 py-1.5 flex items-center gap-2 rounded-xl text-sm font-bold transition-all ${activeConsoleTab === 'test_cases' ? 'bg-indigo-500/15 text-indigo-400' : 'text-slate-400 hover:text-slate-300 hover:bg-slate-700/50'}`}
                  >
                    <CheckSquareOffset size={16} weight={activeConsoleTab === 'test_cases' ? 'fill' : 'duotone'} />
                    Testcases
                  </button>
                  <button 
                    onClick={() => setActiveConsoleTab('results')}
                    className={`px-4 py-1.5 flex items-center gap-2 rounded-xl text-sm font-bold transition-all ${activeConsoleTab === 'results' ? 'bg-emerald-500/15 text-emerald-400' : 'text-slate-400 hover:text-slate-300 hover:bg-slate-700/50'}`}
                  >
                    <Terminal size={16} weight={activeConsoleTab === 'results' ? 'fill' : 'duotone'} />
                    Test Results
                  </button>
                </div>
                 <div className="flex items-center gap-2 text-slate-400">
                   {execTime && <span className="text-xs mr-2 border-r border-slate-700 pr-4">{execTime}ms</span>}
                   {output && (
                     <button onClick={handleClearOutput} className="hover:text-white transition-colors" title="Clear console">
                       <span className="text-xs uppercase font-bold tracking-wider">Clear</span>
                     </button>
                   )}
                 </div>
              </div>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar relative bg-slate-900">
                {activeConsoleTab === 'test_cases' ? (
                  <div className="p-4 flex flex-col h-full">
                    <div className="flex items-center gap-2 mb-4 shrink-0 overflow-x-auto custom-scrollbar pb-1">
                      {userTestCases.map((tc, idx) => {
                        const tr = testResults[idx];
                        let pillClass = activeTestCaseIdx === idx ? 'bg-slate-700/80 text-white shadow-sm' : 'bg-slate-800 text-slate-400 hover:bg-slate-700/50';
                        if (tr && tr.passed === true) pillClass = activeTestCaseIdx === idx ? 'bg-emerald-500 text-white shadow-sm' : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30';
                        if (tr && tr.passed === false) pillClass = activeTestCaseIdx === idx ? 'bg-rose-500 text-white shadow-sm' : 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30';
                        return (
                        <button
                          key={idx}
                          onClick={() => setActiveTestCaseIdx(idx)}
                          className={`px-4 py-1.5 rounded-full text-sm font-bold transition-colors whitespace-nowrap ${pillClass}`}
                        >
                          Case {idx + 1}
                        </button>
                        );
                      })}
                      <button 
                        onClick={() => {
                          setUserTestCases([...userTestCases, { input_data: '', expected_output: '' }]);
                          setActiveTestCaseIdx(userTestCases.length);
                        }}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors flex-shrink-0" 
                        title="Add Custom Test Case"
                      >
                        <Plus size={16} weight="bold" />
                      </button>
                    </div>
                    {userTestCases[activeTestCaseIdx] && (
                      <div className="flex flex-col gap-4 flex-1 pb-6">
                        <div className="flex flex-col">
                          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Input Data</label>
                          <textarea 
                            value={userTestCases[activeTestCaseIdx].input_data || ''}
                            onChange={(e) => {
                               const arr = [...userTestCases];
                               arr[activeTestCaseIdx].input_data = e.target.value;
                               setUserTestCases(arr);
                            }}
                            className="bg-slate-800 border border-slate-700/50 outline-none font-mono text-[13px] text-slate-300 rounded-xl px-4 py-3 focus:ring-1 focus:ring-indigo-500/50 min-h-[100px] resize-y custom-scrollbar"
                            placeholder="e.g. build_tree([1, 2, 3])"
                          />
                        </div>
                        <div className="flex flex-col">
                          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Expected Output (Optional)</label>
                          <input 
                            value={userTestCases[activeTestCaseIdx].expected_output || ''}
                            onChange={(e) => {
                               const arr = [...userTestCases];
                               arr[activeTestCaseIdx].expected_output = e.target.value;
                               setUserTestCases(arr);
                            }}
                            className="bg-slate-800 border border-slate-700/50 outline-none font-mono text-sm text-slate-300 rounded-xl px-4 py-2.5 focus:ring-1 focus:ring-indigo-500/50"
                            placeholder="Optional expected answer"
                          />
                        </div>
                        {testResults[activeTestCaseIdx] && (
                          <div className="flex flex-col pt-2 pb-2">
                            <label className={`text-[11px] font-bold ${testResults[activeTestCaseIdx].passed === false ? 'text-rose-400' : 'text-indigo-400'} uppercase tracking-wider mb-1 flex items-center gap-2`}>
                              Actual Output
                            </label>
                            <div className={`bg-slate-950 border ${testResults[activeTestCaseIdx].passed === false ? 'border-rose-500/30 text-rose-400' : 'border-indigo-500/30 text-slate-300'} outline-none font-mono text-sm rounded-xl px-4 py-3 min-h-[60px] whitespace-pre-wrap flex items-center overflow-x-auto overflow-y-auto max-h-[160px] custom-scrollbar`}>
                               {testResults[activeTestCaseIdx].actual_output || '(no output)'}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-5 font-mono text-sm layout-console text-slate-300">
                     {running ? (
                        <div className="flex items-center gap-3 animate-pulse">
                           <div className="w-2 h-4 bg-indigo-50 dark:bg-indigo-500/150 animate-bounce"></div>
                           <span className="text-slate-400">Evaluating your solution against test cases...</span>
                        </div>
                     ) : output !== null ? (
                    <pre className="whitespace-pre-wrap">{output}</pre>
                 ) : (
                    <div className="text-slate-500 dark:text-slate-400 italic">Code output will appear here.</div>
                 )}
              </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Original layout (Grid) for ad-hoc coding (No challenge active)
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-[1600px] mx-auto px-4 lg:px-6 py-6 lg:h-full">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:h-full">
              {/* Left Column: Editor Panel */}
              <div className="lg:col-span-2 flex flex-col space-y-4">
                <div className="soft-card p-3 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="relative" ref={langMenuRef}>
                      <button data-testid="language-selector" onClick={() => setShowLangMenu(!showLangMenu)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors font-bold text-sm text-slate-700 dark:text-slate-300">
                        <span className="text-base">{currentLang?.icon}</span>
                        {currentLang?.label}
                        <CaretDown size={14} weight="bold" />
                      </button>
                      {showLangMenu && (
                        <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 dark:bg-[#151B2B] dark:border-white/10 p-1 z-50 min-w-[180px]">
                          {LANGUAGES.map(lang => (
                            <button key={lang.id} onClick={() => handleLanguageChange(lang.id)}
                              className={`w-full text-left px-4 py-2.5 rounded-xl flex items-center gap-3 transition-colors text-sm font-medium ${language === lang.id ? 'bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300' : 'hover:bg-slate-50 dark:hover:bg-white/[0.06] text-slate-700 dark:text-slate-300'}`}>
                              <span className="text-base">{lang.icon}</span>
                              {lang.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => { setCode(DEFAULT_TEMPLATES[language] || ''); setOutput(null); }}
                      className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 text-slate-500 dark:text-slate-400 transition-colors" title="Reset to template">
                      <ArrowCounterClockwise size={18} weight="duotone" />
                    </button>

                    <button onClick={handleRun} disabled={running}
                      className="btn-primary !px-5 !py-2.5 text-sm flex items-center gap-2 disabled:opacity-60">
                      {running ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Play size={16} weight="fill" />}
                      {running ? 'Running...' : 'Run Code'}
                    </button>
                  </div>
                </div>

                <div className="soft-card overflow-hidden flex-1 min-h-[400px]" onCopyCapture={handleCopyOrCut} onCutCapture={handleCopyOrCut} onPasteCapture={handlePasteCapture}>
                  <Editor
                    height="100%"
                    language={language}
                    value={code}
                    onChange={(val) => setCode(val || '')}
                    onMount={handleEditorMount}
                    theme={isDark ? 'vs-dark' : 'vs-light'}
                    options={{
                      minimap: { enabled: false },
                      fontSize: 14,
                      lineNumbers: 'on',
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                      padding: { top: 16, bottom: 16 },
                      tabSize: language === 'python' ? 4 : 2,
                      wordWrap: 'on',
                      smoothScrolling: true,
                    }}
                  />
                </div>

                <div className="soft-card p-4 shrink-0">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 block">Standard Input (stdin)</label>
                  <textarea value={stdin} onChange={(e) => setStdin(e.target.value)}
                    placeholder="Enter input for your program here..."
                    rows="3" className="soft-input w-full resize-none text-sm font-mono" />
                </div>
              </div>

              {/* Right Column: Output & History Panel */}
              <div className="space-y-4 flex flex-col lg:h-full lg:overflow-hidden pb-10 lg:pb-0">
                <div className="soft-card flex flex-col flex-1 min-h-[300px]">
                  <div className="p-5 pb-3 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                      <Terminal size={18} weight="duotone" className="text-slate-500 dark:text-slate-400" />
                      <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Output</h3>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {output && (
                        <>
                          <button onClick={handleCopyOutput} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors" title="Copy output">
                            <Copy size={16} weight="duotone" />
                          </button>
                          <button onClick={handleClearOutput} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors" title="Clear output">
                            <Trash size={16} weight="duotone" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="px-5 pb-5 flex-1 overflow-hidden flex flex-col">
                    <div className="bg-slate-900 rounded-2xl p-4 flex-1 overflow-y-auto">
                      {running ? (
                        <div className="flex items-center gap-3 text-slate-400">
                          <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-sm font-medium">Executing code...</span>
                        </div>
                      ) : output !== null ? (
                        <pre className="text-sm text-slate-200 font-mono whitespace-pre-wrap">{output}</pre>
                      ) : (
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Click "Run Code" to see output here</p>
                      )}
                    </div>
                    {execTime !== null && (
                      <div className="flex items-center gap-2 mt-3 text-xs font-medium text-slate-400">
                        <Clock size={14} weight="duotone" />
                        <span>Executed in {execTime}ms</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="soft-card flex flex-col h-[280px] shrink-0">
                  <div className="p-5 pb-3 shrink-0">
                     <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Run History</h3>
                  </div>
                  <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-2 custom-scrollbar">
                    {history.length === 0 ? (
                      <p className="text-sm text-slate-400 font-medium py-2">No runs yet. Start coding!</p>
                    ) : (
                      <div className="overflow-x-auto w-full border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-[#1A202C]">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                          <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold text-[11px]">
                            <tr>
                              <th className="px-4 py-3">No.</th>
                              <th className="px-4 py-3">Status</th>
                              <th className="px-4 py-3 text-center">Language</th>
                              <th className="px-4 py-3 text-center">Code</th>
                              <th className="px-4 py-3 text-center">Analysis</th>
                              <th className="px-4 py-3 text-center">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                            {history.map((h, i) => (
                              <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                                <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">{i + 1}</td>
                                <td className="px-4 py-3">
                                  <div className="flex flex-col">
                                    <span className={`font-bold ${h.success ? 'text-emerald-500' : 'text-red-500'}`}>
                                      {h.success ? 'Accepted' : 'Failed'}
                                    </span>
                                    <span className="text-[11px] text-slate-400">{h.timestamp}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex justify-center items-center w-full" title={LANGUAGES.find(l => l.id === h.language)?.label || 'Lang'}>
                                    {LANGUAGES.find(l => l.id === h.language)?.icon || <Terminal size={18} className="text-slate-400" />}
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <button onClick={() => setCode(h.rawCode || '')} className="text-slate-400 hover:text-indigo-500 transition-colors" title="Load this code">
                                    <Eye size={18} weight="duotone" />
                                  </button>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <button onClick={() => handleAnalysis(h)} className="text-slate-400 hover:text-indigo-500 transition-colors" title="Run AI Analysis">
                                    <ChartLineUp size={18} weight="bold" />
                                  </button>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <button onClick={() => setHistory(history.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-500 transition-colors" title="Delete run">
                                    <Trash size={18} weight="duotone" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals Code Omitted for brevity: Challenges Modal & Insights Modal ... */}
      {/* Constraints & Modals */}

      {/* Challenges Modal */}
      {showChallengesModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-[2px] animate-fade-in" onClick={() => setShowChallengesModal(false)}>
          <div className="w-full max-w-4xl max-h-[85vh] bg-white rounded-3xl dark:bg-[#1A202C] shadow-2xl flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-800/80">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center">
                   <Lightning size={20} weight="fill" />
                 </div>
                 <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Problem List</h2>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-white dark:bg-[#1A202C] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-400/50 transition-all">
                  <MagnifyingGlass size={16} className="text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Search problems or topics..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-transparent border-0 border-transparent focus:border-transparent outline-none focus:ring-0 text-sm font-semibold text-slate-700 dark:text-slate-300 placeholder-slate-400 w-48 sm:w-64 p-0"
                  />
                </div>
                <div className="flex items-center gap-2 bg-white dark:bg-[#1A202C] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
                   <Funnel size={16} className="text-slate-400" />
                   <select className="bg-transparent border-0 border-transparent focus:border-transparent outline-none focus:ring-0 text-sm font-semibold text-slate-700 dark:text-slate-300 cursor-pointer p-0"
                     value={difficultyFilter} onChange={e => setDifficultyFilter(e.target.value)}>
                     <option value="">All Difficulties</option>
                     <option value="Easy">Easy</option>
                     <option value="Medium">Medium</option>
                     <option value="Hard">Hard</option>
                   </select>
                </div>
                <button onClick={() => setShowChallengesModal(false)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-colors shrink-0">
                  <X size={24} />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2 min-h-[300px]">
               {isChallengesLoading ? (
                 <div className="py-20 text-center text-slate-500 dark:text-slate-400">
                    Loading problems...
                 </div>
               ) : filteredChallenges.length === 0 ? (
                 <div className="py-20 text-center text-slate-500 dark:text-slate-400">
                    No problems found.
                 </div>
               ) : (
                 <div className="divide-y divide-slate-100 dark:divide-white/[0.06]">
                   {filteredChallenges.map((ch, i) => (
                     <div key={i} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors group cursor-pointer" onClick={() => handleLoadChallenge(ch)}>
                        <div className="flex-1 pr-6">
                           <div className="flex items-center gap-3 mb-2">
                             <h4 className="text-[15px] font-bold text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{ch.title}</h4>
                             <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-xl ${ch.difficulty === 'Easy' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400' : ch.difficulty === 'Medium' ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400'}`}>
                               {ch.difficulty}
                             </span>
                           </div>
                           <div className="flex gap-2 text-xs text-slate-400 mt-2 truncate">
                              {ch.topics?.slice(0, 3).map(t => <span key={t} className="bg-slate-100 dark:bg-white/[0.06] dark:text-slate-400 px-2.5 py-1 rounded-xl font-medium">{t}</span>)}
                           </div>
                        </div>
                        <button className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300 font-bold text-sm group-hover:bg-indigo-600 group-hover:text-white dark:group-hover:bg-indigo-500 transition-all shadow-sm">
                           Solve
                        </button>
                     </div>
                   ))}
                 </div>
               )}
            </div>
          </div>
        </div>
      )}

      {/* Insights Modal */}
      {showInsightsModal && stats && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-[2px] animate-fade-in" onClick={() => setShowInsightsModal(false)}>
           <div className="w-full max-w-3xl bg-white rounded-3xl dark:bg-[#1A202C] shadow-2xl flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
             <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-800/80">
               <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-3">
                 <ChartBar className="text-indigo-500 text-2xl" weight="duotone" />
                 My Insights
               </h2>
               <button onClick={() => setShowInsightsModal(false)} className="p-2 text-slate-400 hover:text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
                 <X size={24} />
               </button>
             </div>
             <div className="p-8 flex flex-col md:flex-row gap-8">
               <div className="flex-1">
                 <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
                   <CheckCircle size={20} weight="fill" className="text-emerald-500" />
                   Overall Progress
                 </h3>
                 <div className="flex items-center gap-6">
                   <div className="relative w-28 h-28 flex items-center justify-center bg-white dark:bg-[#1A202C] rounded-full border-8 border-slate-50 shadow-inner">
                     <div className="text-center">
                       <span className="block text-2xl font-black text-indigo-600">{stats.total_solved}</span>
                       <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Solved</span>
                     </div>
                     <svg className="absolute inset-0 w-full h-full -rotate-90">
                       <circle cx="56" cy="56" r="48" fill="transparent" stroke="currentColor" strokeWidth="8" className="text-emerald-500" strokeDasharray="301" strokeDashoffset={301 - (stats.total_solved * 3)} />
                     </svg>
                   </div>
                   <div className="flex-1 space-y-4">
                     {['Easy', 'Medium', 'Hard'].map(diff => (
                       <div key={diff}>
                         <div className="flex justify-between text-xs mb-1 font-bold">
                           <span className={diff === 'Easy' ? 'text-emerald-500' : diff === 'Medium' ? 'text-amber-500' : 'text-rose-500'}>{diff}</span>
                           <span className="text-slate-500 dark:text-slate-400">{stats.difficulty[diff] || 0}</span>
                         </div>
                         <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                           <div className={`h-full rounded-full ${diff === 'Easy' ? 'bg-emerald-500' : diff === 'Medium' ? 'bg-amber-500' : 'bg-rose-500'}`} style={{width: `${Math.min(((stats.difficulty[diff] || 0) / 20) * 100, 100)}%`}}></div>
                         </div>
                       </div>
                     ))}
                   </div>
                 </div>
               </div>
               {stats.topics && Object.keys(stats.topics).length > 0 && (
                 <div className="w-[250px] border-l border-slate-100 dark:border-slate-700 pl-8">
                   <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Strong Topics</h3>
                   <div className="flex flex-col gap-2">
                     {Object.entries(stats.topics).map(([topic, count]) => (
                       <div key={topic} className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 rounded-lg px-3 py-2">
                         <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{topic}</span>
                         <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-0.5 rounded-full">{count}</span>
                       </div>
                     ))}
                   </div>
                 </div>
               )}
             </div>
           </div>
         </div>
      )}
       {/* AI Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-[2px] animate-fade-in" onClick={() => setShowReviewModal(false)}>
          <div className="w-full max-w-3xl max-h-[85vh] bg-white rounded-3xl dark:bg-[#1A202C] shadow-2xl flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-800/80">
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-3">
                <Sparkle className="text-indigo-500 text-2xl" weight="fill" />
                Code Review by Ami
              </h2>
              <button onClick={() => setShowReviewModal(false)} className="p-2 text-slate-400 hover:text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
              {reviewing ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-500 dark:text-slate-400">
                  <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                  <p className="font-semibold">Analyzing your code...</p>
                </div>
              ) : aiReview ? (
                typeof aiReview === 'object' ? (
                  <div className="flex flex-col gap-5">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Time Complexity</h3>
                        <p className="font-semibold text-slate-800 dark:text-slate-100 text-[15px]">{aiReview.time_complexity}</p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Space Complexity</h3>
                        <p className="font-semibold text-slate-800 dark:text-slate-100 text-[15px]">{aiReview.space_complexity}</p>
                      </div>
                    </div>
                    <div className="bg-indigo-50 dark:bg-indigo-500/10 p-5 rounded-2xl border border-indigo-100 dark:border-indigo-500/30">
                      <h3 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Sparkle weight="fill" />
                        Logic Summary
                      </h3>
                      <p className="font-medium text-slate-700 dark:text-slate-300 leading-relaxed text-[15px]">{aiReview.logic_summary}</p>
                    </div>
                    {aiReview.suggested_improvements && (
                      <div className="bg-white dark:bg-[#1A202C] p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 mb-3 tracking-widest uppercase flex items-center gap-2">
                          <CheckCircle weight="fill" className="text-emerald-500 text-base" />
                          Suggested Improvements
                        </h3>
                        {aiReview.suggested_improvements.length > 0 ? (
                          <ul className="space-y-2.5">
                            {aiReview.suggested_improvements.map((imp, idx) => (
                              <li key={idx} className="flex gap-3 items-start text-[14px] font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
                                <span className="text-indigo-500 mt-1 font-black">→</span>
                                {imp}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-[14px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed flex items-center gap-2">
                            <Sparkle weight="duotone" className="text-emerald-500" />
                            No major improvements needed! Your code looks solid.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="prose prose-sm dark:prose-invert max-w-none prose-pre:bg-slate-900 prose-pre:text-slate-100 prose-a:text-indigo-500">
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      components={{
                        table: ({node, ...props}) => <div className="overflow-x-auto my-6"><table className="w-full text-left border-collapse" {...props} /></div>,
                        th: ({node, ...props}) => <th className="bg-slate-50 dark:bg-slate-800/80 py-3 px-4 font-bold text-slate-800 dark:text-slate-200 border-b-2 border-slate-200 dark:border-slate-700 whitespace-nowrap" {...props} />,
                        td: ({node, ...props}) => <td className="py-4 px-4 border-b border-slate-100 dark:border-slate-700/60 align-top text-slate-700 dark:text-slate-300" {...props} />,
                        tr: ({node, ...props}) => <tr className="transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/30" {...props} />
                      }}
                    >
                      {aiReview}
                    </ReactMarkdown>
                  </div>
                )
              ) : (
                <div className="text-center py-10 text-slate-500">No review generated.</div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Floating Action Button (FAB) for AI Coach */}
      {!showCoach && activeChallenge && (
        <button 
          onClick={() => setShowCoach(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg shadow-indigo-500/30 flex items-center justify-center z-[90] transition-transform hover:scale-110 active:scale-95 group"
          title="Chat with Ami"
        >
          <Sparkle size={24} weight="fill" className="text-amber-300 group-hover:animate-pulse" />
        </button>
      )}

      {/* AI Coach Floating Window */}
      {showCoach && activeChallenge && (
        <div className="fixed bottom-6 right-6 w-[400px] max-h-[600px] h-[75vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col z-[100] animate-fade-in overflow-hidden">
          <div className="px-5 py-4 border-b border-indigo-600 bg-indigo-600 flex justify-between items-center text-white">
            <div className="flex items-center gap-3">
              <Sparkle weight="fill" size={20} className="text-amber-300" />
              <h3 className="font-bold text-lg">Ami</h3>
            </div>
            <button onClick={() => setShowCoach(false)} className="hover:bg-white/20 p-2 rounded-full transition-colors flex items-center justify-center">
              <X size={18} weight="bold" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50 dark:bg-slate-800/20">
            {coachMessages.length === 0 && (
              <div className="text-center text-slate-500 dark:text-slate-400 py-10 px-4 text-[13px] font-medium leading-relaxed bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 mx-2">
                <span className="text-2xl block mb-3">👋</span>
                Hi! I'm Ami — your partner in crime for coding 😜.<br/>
                {activeChallenge ? (
                  <span>I see you're working on <span className="font-bold text-indigo-500 dark:text-indigo-400">{activeChallenge.title}</span>. Ask for a hint if you're stuck!</span>
                ) : (
                  <span>Describe what you're trying to build, or ask for a hint if you're stuck!</span>
                )}
                <br/><br/><span className="text-indigo-500 dark:text-indigo-400 font-bold">I can automatically see your code and output.</span>
              </div>
            )}
            {coachMessages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-5 py-3 text-[14px] ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-br-sm shadow-md' : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-100 dark:border-slate-700/60 rounded-bl-sm shadow-sm'}`}>
                  {msg.role === 'user' ? (
                     msg.content
                  ) : (
                     <div className="prose prose-sm prose-slate dark:prose-invert max-w-none prose-p:my-1 prose-pre:my-2 prose-pre:bg-slate-100 dark:prose-pre:bg-slate-900 prose-pre:text-slate-800 dark:prose-pre:text-slate-200">
                       <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {msg.content}
                       </ReactMarkdown>
                     </div>
                  )}
                </div>
              </div>
            ))}
            {isCoachTyping && (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-2xl px-5 py-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 rounded-bl-sm shadow-sm flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-[bounce_1s_infinite]"></div>
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-[bounce_1s_infinite]" style={{animationDelay: '150ms'}}></div>
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-[bounce_1s_infinite]" style={{animationDelay: '300ms'}}></div>
                </div>
              </div>
            )}
            <div ref={endOfMessagesRef} />
          </div>
          
          <form onSubmit={handleCoachSubmit} className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2 rounded-[20px] focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all shadow-sm">
              <input 
                type="text" 
                value={coachInput} 
                onChange={(e) => setCoachInput(e.target.value)} 
                placeholder="Ask for a hint..." 
                className="flex-1 bg-transparent px-3 py-1.5 text-[15px] border-transparent focus:border-transparent focus:ring-0 outline-none shadow-none text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
                style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
                disabled={isCoachTyping}
              />
              <button 
                type="submit" 
                disabled={!coachInput.trim() || isCoachTyping}
                className="bg-indigo-600 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:text-white/60 text-white p-2.5 rounded-2xl transition-colors hover:bg-indigo-700 shadow-sm"
              >
                {isCoachTyping ? <ArrowCounterClockwise size={18} weight="bold" className="animate-spin" /> : <Play size={18} weight="fill" />}
              </button>
            </div>
            <div className="text-center mt-2 text-[11px] text-slate-400 dark:text-slate-500 font-medium tracking-wide">
              Ami sees your code automatically
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default CodePlayground;
