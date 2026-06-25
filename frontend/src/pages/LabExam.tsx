import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, Terminal, Copy, Clock, CheckCircle, Warning, X, ArrowLeft,
  CircleNotch, LockSimple, ShieldAlert, Cpu
} from '@phosphor-icons/react';
import PageHeader from '../components/PageHeader';
import { labAPI } from '../services/api';
import { useWebSocket } from '../hooks/useWebSocket';
import { useTheme } from '../contexts/ThemeContext';
import { toast } from 'sonner';
import Editor from '@monaco-editor/react';

const LabExam: React.FC<{ navigate: (path: string, state?: any) => void; user: any }> = ({ navigate, user }) => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { isDark } = useTheme();
  
  const [loading, setLoading] = useState(true);
  const [examState, setExamState] = useState<any>(null);
  const [activeQIndex, setActiveQIndex] = useState(0);
  const [codeMap, setCodeMap] = useState<{ [qId: string]: string }>({});
  const [outputMap, setOutputMap] = useState<{ [qId: string]: { success?: boolean; stdout?: string; stderr?: string } }>({});
  const [attemptsMap, setAttemptsMap] = useState<{ [qId: string]: number }>({});
  const [lockedMap, setLockedMap] = useState<{ [qId: string]: boolean }>({});
  const [submitting, setSubmitting] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [examForceEnded, setExamForceEnded] = useState(false);

  const editorRef = useRef<any>(null);

  // Fetch student state (reconnect state)
  const fetchState = useCallback(async () => {
    if (!sessionId) return;
    try {
      const res = await labAPI.myState(sessionId);
      const data = res.data || res;
      setExamState(data);
      
      // Initialize code, output, and locked maps
      const newCodes: any = {};
      const newAttempts: any = {};
      const newLocked: any = {};
      
      data.questions.forEach((q: any) => {
        newCodes[q.question_id] = q.last_code || q.starter_code || '';
        newAttempts[q.question_id] = q.attempt_count || 0;
        newLocked[q.question_id] = q.is_locked || false;
      });
      
      setCodeMap(newCodes);
      setAttemptsMap(newAttempts);
      setLockedMap(newLocked);
      
      if (data.status === 'ended') {
        setExamForceEnded(true);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load lab exam workspace');
      navigate('student-dashboard');
    } finally {
      setLoading(false);
    }
  }, [sessionId, navigate]);

  useEffect(() => {
    fetchState();
  }, [fetchState]);

  // Timer
  useEffect(() => {
    if (examState?.status === 'active' && !examForceEnded) {
      const interval = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [examState?.status, examForceEnded]);

  // WebSocket for force-ending the exam
  const { data: wsMessage } = useWebSocket(`/ws/lab/${sessionId}/student`, {
    enabled: !!sessionId && !examForceEnded
  });

  useEffect(() => {
    if (wsMessage && wsMessage.type === 'exam_ended') {
      setExamForceEnded(true);
      toast.error('🛑 The exam session has been closed by the faculty.');
    }
  }, [wsMessage]);

  const activeQuestion = examState?.questions[activeQIndex];
  const activeCode = activeQuestion ? (codeMap[activeQuestion.question_id] || '') : '';
  const activeOutput = activeQuestion ? outputMap[activeQuestion.question_id] : null;
  const isQuestionLocked = activeQuestion ? (lockedMap[activeQuestion.question_id] || false) : false;

  const handleEditorMount = (editor: any) => {
    editorRef.current = editor;
    
    // Hard block paste inside editor instance
    editor.onDidPaste((e: any) => {
      // Immediately undo the paste
      editor.trigger('keyboard', 'undo', null);
      toast.error('🛡️ Security Lock: Copy-paste is disabled during this exam session.', { duration: 4000 });
    });
  };

  const handlePasteCapture = (e: React.ClipboardEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toast.error('🛡️ Security Lock: Copy-paste is disabled during this exam session.', { duration: 4000 });
  };

  const handleRunAndSubmit = async () => {
    if (!activeQuestion || submitting || isQuestionLocked || examForceEnded) return;
    
    setSubmitting(true);
    const qId = activeQuestion.question_id;
    const code = codeMap[qId] || '';
    const lang = activeQuestion.language;

    try {
      const res = await labAPI.submitCode(sessionId!, qId, code, lang);
      const data = res.data || res;
      
      // Update attempts and lock state
      setAttemptsMap(prev => ({ ...prev, [qId]: data.attempt_count }));
      setLockedMap(prev => ({ ...prev, [qId]: data.is_locked }));
      
      setOutputMap(prev => ({
        ...prev,
        [qId]: {
          success: data.is_passed,
          stdout: data.output || '',
          stderr: data.error || ''
        }
      }));

      if (data.is_passed) {
        toast.success('🎉 Test case passed successfully! Question locked.');
      } else {
        toast.error('❌ Test case failed. Check output and try again.');
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'Failed to submit code');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return [
      hrs > 0 ? String(hrs).padStart(2, '0') : null,
      String(mins).padStart(2, '0'),
      String(secs).padStart(2, '0')
    ].filter(Boolean).join(':');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F19] flex items-center justify-center">
        <div className="text-center">
          <CircleNotch size={40} className="animate-spin text-indigo-500 mx-auto mb-4" />
          <p className="text-slate-500 dark:text-slate-400 font-medium">Initializing secure environment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F19] transition-colors duration-300 flex flex-col h-screen overflow-hidden">
      {/* Block paste globally in window wrapper */}
      <div className="flex-grow flex flex-col min-h-0" onPasteCapture={handlePasteCapture}>
        
        {/* Exam Header */}
        <div className="bg-white dark:bg-[#111625] border-b border-slate-100 dark:border-white/[0.04] px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('student-dashboard')}
              className="p-2 hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
            >
              <ArrowLeft size={20} weight="bold" />
            </button>
            <div>
              <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Practical Exam</span>
              <h2 className="text-lg font-black text-slate-800 dark:text-white leading-tight">{examState?.title}</h2>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-white/[0.04] px-4 py-2 rounded-2xl flex items-center gap-2">
              <Clock size={16} weight="duotone" className="text-slate-500" />
              <span className="font-bold text-sm text-slate-700 dark:text-slate-300">Elapsed: {formatTime(elapsedSeconds)}</span>
            </div>
            
            <div className="hidden md:block text-right">
              <p className="text-xs font-bold text-slate-400">Student Roll</p>
              <p className="text-sm font-black text-slate-700 dark:text-white">{user?.roll_number}</p>
            </div>
          </div>
        </div>

        {/* Locked/Force Ended Notice */}
        {examForceEnded && (
          <div className="bg-red-500 text-white px-6 py-3.5 flex items-center gap-3 shrink-0">
            <ShieldAlert size={20} weight="fill" />
            <span className="font-bold text-sm">Exam session has ended. Submissions are now closed. Your code and progress have been saved.</span>
          </div>
        )}

        {/* Main Split Layout */}
        <div className="flex-1 min-h-0 flex flex-col lg:flex-row">
          
          {/* Left Pane: Question Details */}
          <div className="w-full lg:w-1/3 border-r border-slate-100 dark:border-white/[0.04] bg-white dark:bg-[#111625] flex flex-col min-h-0">
            
            {/* Question Tabs (if multiple questions) */}
            {examState?.questions && examState.questions.length > 1 && (
              <div className="flex bg-slate-50 dark:bg-slate-900/60 p-1.5 gap-1 shrink-0 border-b border-slate-100 dark:border-white/[0.04]">
                {examState.questions.map((q: any, idx: number) => {
                  const isQPassed = lockedMap[q.question_id];
                  return (
                    <button
                      key={q.question_id}
                      onClick={() => setActiveQIndex(idx)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                        activeQIndex === idx 
                          ? 'bg-white dark:bg-[#151B2B] text-indigo-500 shadow-sm border border-slate-100 dark:border-white/[0.04]' 
                          : 'text-slate-400 hover:text-slate-600 dark:hover:text-white'
                      }`}
                    >
                      <span>Task {idx + 1}</span>
                      {isQPassed && <CheckCircle size={14} weight="fill" className="text-emerald-500" />}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Question Description */}
            <div className="flex-grow overflow-y-auto p-6 space-y-6">
              <div>
                <span className="soft-badge bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 font-bold uppercase tracking-wider text-[9px]">
                  Language: {activeQuestion?.language?.toUpperCase()}
                </span>
                <h3 className="text-xl font-black text-slate-800 dark:text-white mt-2 leading-tight">
                  {activeQuestion?.title}
                </h3>
              </div>

              <div className="prose prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-line font-medium">
                {activeQuestion?.description}
              </div>

              {/* Sample Test Case */}
              {activeQuestion?.test_input && (
                <div className="space-y-2 pt-4 border-t border-slate-50 dark:border-white/[0.04]">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">Sample Test Input</h4>
                  <pre className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl text-xs font-mono border border-slate-100 dark:border-white/[0.04] text-slate-800 dark:text-slate-200">
                    {activeQuestion.test_input}
                  </pre>
                </div>
              )}
            </div>
          </div>

          {/* Right Pane: IDE and Console */}
          <div className="flex-1 flex flex-col bg-slate-50 dark:bg-[#0B0F19] min-h-0">
            
            {/* Editor Container */}
            <div className="flex-grow flex flex-col min-h-0 bg-white dark:bg-[#111625] relative">
              
              {/* Editor Header */}
              <div className="bg-slate-50 dark:bg-slate-900/30 px-6 py-3 border-b border-slate-100 dark:border-white/[0.04] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Main.{activeQuestion?.language === 'python' ? 'py' : activeQuestion?.language === 'java' ? 'java' : 'c'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-400">Attempts: {attemptsMap[activeQuestion?.question_id] || 0}</span>
                  {isQuestionLocked && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-100 dark:border-emerald-500/20">
                      <LockSimple size={12} weight="fill" /> Passed & Locked
                    </span>
                  )}
                </div>
              </div>

              {/* Monaco Editor */}
              <div className="flex-1 min-h-0 relative">
                <Editor
                  height="100%"
                  language={activeQuestion?.language === 'python' ? 'python' : activeQuestion?.language === 'java' ? 'java' : 'cpp'}
                  value={activeCode}
                  onChange={(val) => {
                    if (!isQuestionLocked && !examForceEnded) {
                      setCodeMap(prev => ({ ...prev, [activeQuestion.question_id]: val || '' }));
                    }
                  }}
                  onMount={handleEditorMount}
                  theme={isDark ? 'vs-dark' : 'vs-light'}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    lineNumbers: 'on',
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    readOnly: isQuestionLocked || examForceEnded,
                    padding: { top: 16, bottom: 16 },
                    tabSize: activeQuestion?.language === 'python' ? 4 : 2,
                    wordWrap: 'on'
                  }}
                />
              </div>

              {/* Floating Action Button */}
              <div className="absolute bottom-6 right-6 z-10">
                <button
                  onClick={handleRunAndSubmit}
                  disabled={submitting || isQuestionLocked || examForceEnded || !activeCode.trim()}
                  className="btn-primary !px-6 !py-3 flex items-center gap-2 font-bold shadow-xl shadow-indigo-500/20 disabled:opacity-60 transition-colors bg-gradient-to-r from-indigo-500 to-purple-600 hover:opacity-90"
                >
                  {submitting ? (
                    <>
                      <CircleNotch size={18} className="animate-spin" />
                      Evaluating...
                    </>
                  ) : isQuestionLocked ? (
                    <>
                      <LockSimple size={18} weight="fill" />
                      Locked
                    </>
                  ) : (
                    <>
                      <Play size={18} weight="fill" />
                      Run & Submit Code
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Console Output (Bottom 1/3) */}
            <div className="h-1/3 min-h-[200px] bg-slate-950 border-t border-slate-800 flex flex-col shrink-0">
              <div className="bg-slate-900 px-6 py-3 flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-2 text-slate-400">
                  <Terminal size={16} weight="bold" />
                  <span className="text-xs font-bold uppercase tracking-widest">Execution Console</span>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-6 font-mono text-xs text-slate-300 leading-relaxed custom-scrollbar selection:bg-slate-700">
                {submitting ? (
                  <div className="flex items-center gap-2 text-indigo-400">
                    <CircleNotch size={14} className="animate-spin" />
                    <span>Executing test cases on sandbox environment...</span>
                  </div>
                ) : activeOutput ? (
                  <div className="space-y-4">
                    {activeOutput.success ? (
                      <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                        <CheckCircle size={16} weight="fill" />
                        <span>All test cases passed successfully! Code locked.</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
                        <Warning size={16} weight="fill" />
                        <span>Verification failed. Output did not match expected output.</span>
                      </div>
                    )}
                    
                    {activeOutput.stdout && (
                      <div className="space-y-1">
                        <span className="text-slate-500 font-bold">Standard Output:</span>
                        <pre className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 text-slate-200 overflow-x-auto select-all max-h-40">{activeOutput.stdout}</pre>
                      </div>
                    )}

                    {activeOutput.stderr && (
                      <div className="space-y-1">
                        <span className="text-red-400 font-bold">Compiler / Runtime Error:</span>
                        <pre className="bg-red-950/20 p-4 rounded-xl border border-red-900/30 text-red-200 overflow-x-auto max-h-40">{activeOutput.stderr}</pre>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-slate-500 font-medium">
                    Console ready. Write code and click "Run & Submit Code" to execute.
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

export default LabExam;
