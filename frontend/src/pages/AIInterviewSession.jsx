import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Microphone, MicrophoneSlash, Clock, ArrowsOut, X, Brain, Warning, Sparkle, Stop, ChatCircleDots } from '@phosphor-icons/react';
import { interviewAPI } from '../services/api';
import { toast } from 'sonner';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { useTheme } from '../contexts/ThemeContext';

// ─── Orb State Colors ────────────────────────────────────────────────────────
const ORB_STATES = {
  idle:        { color1: '#14b8a6', color2: '#06b6d4', label: 'Ready', speed: 6 },
  thinking:    { color1: '#3b82f6', color2: '#8b5cf6', label: 'Thinking...', speed: 1.5 },
  speaking:    { color1: '#06b6d4', color2: '#14b8a6', label: 'Speaking', speed: 2 },
  listening:   { color1: '#10b981', color2: '#34d399', label: 'Listening', speed: 3 },
  interrupted: { color1: '#f59e0b', color2: '#10b981', label: 'Listening', speed: 2 },
  evaluating:  { color1: '#8b5cf6', color2: '#ec4899', label: 'Evaluating...', speed: 1 },
};

// ─── AI Orb Component ────────────────────────────────────────────────────────
const AIOrb = ({ state, audioLevel = 0 }) => {
  const orbState = ORB_STATES[state] || ORB_STATES.idle;
  const scale = state === 'speaking' ? 1 + audioLevel * 0.15 :
                state === 'listening' ? 1 + audioLevel * 0.1 :
                state === 'thinking' ? 1.05 : 1;

  return (
    <div className="relative w-48 h-48 sm:w-64 sm:h-64 mx-auto">
      {/* Outer glow */}
      <motion.div
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.3, 0.15, 0.3],
        }}
        transition={{ duration: orbState.speed * 1.5, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute inset-0 rounded-full blur-3xl"
        style={{ background: `radial-gradient(circle, ${orbState.color1}40, transparent 70%)` }}
      />
      {/* Middle glow layer */}
      <motion.div
        animate={{
          scale: [1, 1.08, 0.98, 1],
          rotate: [0, 180, 360],
        }}
        transition={{ duration: orbState.speed * 2, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute inset-4 rounded-full blur-2xl"
        style={{ background: `radial-gradient(circle, ${orbState.color2}50, transparent 70%)` }}
      />
      {/* Core orb */}
      <motion.div
        animate={{
          scale: scale,
          borderRadius: state === 'thinking'
            ? ['40% 60% 60% 40% / 60% 30% 70% 40%', '60% 40% 30% 70% / 40% 60% 70% 30%', '40% 60% 60% 40% / 60% 30% 70% 40%']
            : state === 'speaking'
            ? ['45% 55% 55% 45% / 55% 45% 55% 45%', '55% 45% 45% 55% / 45% 55% 45% 55%', '45% 55% 55% 45% / 55% 45% 55% 45%']
            : '50%',
        }}
        transition={{
          duration: orbState.speed,
          repeat: Infinity,
          ease: 'easeInOut',
          scale: { duration: 0.3 },
        }}
        className="absolute inset-8 sm:inset-10"
        style={{
          background: `radial-gradient(circle at 35% 35%, ${orbState.color1}, ${orbState.color2})`,
          boxShadow: `0 0 60px ${orbState.color1}60, 0 0 120px ${orbState.color1}20, inset 0 0 60px ${orbState.color2}30`,
        }}
      />
      {/* Inner highlight */}
      <motion.div
        animate={{ opacity: [0.6, 0.9, 0.6] }}
        transition={{ duration: orbState.speed * 0.8, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute inset-12 sm:inset-16 rounded-full"
        style={{
          background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4), transparent 60%)`,
        }}
      />
      {/* Floating particles (speaking/thinking) */}
      {(state === 'speaking' || state === 'thinking' || state === 'evaluating') && (
        <>
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              animate={{
                y: [0, -80 - i * 15, 0],
                x: [0, (i % 2 === 0 ? 20 : -20) * (i + 1) * 0.3, 0],
                opacity: [0, 0.8, 0],
                scale: [0.3, 1, 0.3],
              }}
              transition={{
                duration: 2 + i * 0.4,
                repeat: Infinity,
                delay: i * 0.3,
                ease: 'easeOut',
              }}
              className="absolute w-2 h-2 rounded-full"
              style={{
                background: orbState.color1,
                left: `${40 + i * 5}%`,
                top: '50%',
              }}
            />
          ))}
        </>
      )}
      {/* State label */}
      <div className="absolute -bottom-8 left-0 right-0 text-center">
        <span className="text-xs font-bold uppercase tracking-widest" style={{ color: orbState.color1 }}>
          {orbState.label}
        </span>
      </div>
    </div>
  );
};

// ─── Typewriter Text ─────────────────────────────────────────────────────────
const TypewriterText = ({ text, speed = 30 }) => {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed('');
    setDone(false);
    if (!text) return;
    let i = 0;
    const timer = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) { clearInterval(timer); setDone(true); }
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed]);

  return (
    <p className="text-lg sm:text-xl font-medium text-white/90 leading-relaxed max-w-2xl mx-auto">
      {displayed}
      {!done && <span className="inline-block w-0.5 h-5 bg-teal-400 ml-0.5 animate-pulse" />}
    </p>
  );
};

// ─── Scorecard Component ─────────────────────────────────────────────────────
const Scorecard = ({ feedback, onBack, onRetry }) => {
  const { isDark } = useTheme();
  if (!feedback) return null;

  const radarData = feedback.scores ? Object.entries(feedback.scores).map(([key, val]) => ({
    subject: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    score: val,
    fullMark: 100,
  })) : [];

  const ratingColors = { strong: 'text-emerald-500', average: 'text-amber-500', needs_work: 'text-red-500' };
  const ratingBgs = { strong: 'bg-emerald-50 dark:bg-emerald-500/15', average: 'bg-amber-50 dark:bg-amber-500/15', needs_work: 'bg-red-50 dark:bg-red-500/15' };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F19] p-4 sm:p-8 overflow-y-auto">
      <div className="max-w-3xl mx-auto">
        {/* Hero Score */}
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center mb-8">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Overall Score</p>
          <div className="relative inline-block">
            <span className="text-7xl sm:text-8xl font-extrabold bg-gradient-to-r from-teal-400 to-cyan-500 bg-clip-text text-transparent">
              {Math.round(feedback.overall_score || 0)}
            </span>
            <span className="text-2xl font-bold text-slate-400 ml-1">/100</span>
          </div>
          {feedback.overall_comment && (
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-3 max-w-md mx-auto">{feedback.overall_comment}</p>
          )}
        </motion.div>

        {/* Radar Chart */}
        {radarData.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="soft-card p-6 mb-6">
            <h3 className="text-sm font-extrabold text-slate-800 dark:text-white mb-4 text-center">Performance Dimensions</h3>
            <div className="h-64 sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke={isDark ? '#1e293b' : '#e2e8f0'} />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: isDark ? '#94a3b8' : '#64748b', fontWeight: 600 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="Score" dataKey="score" stroke="#14b8a6" fill="#14b8a6" fillOpacity={0.25} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}

        {/* Strengths & Weaknesses */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {feedback.strengths?.length > 0 && (
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
              className="soft-card p-5">
              <h4 className="font-extrabold text-sm text-emerald-600 dark:text-emerald-400 mb-3">💪 Strengths</h4>
              <ul className="space-y-2">{feedback.strengths.map((s, i) => <li key={i} className="text-sm text-slate-600 dark:text-slate-400 flex items-start gap-2"><span className="text-emerald-500 mt-0.5">✓</span>{s}</li>)}</ul>
            </motion.div>
          )}
          {feedback.weaknesses?.length > 0 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
              className="soft-card p-5">
              <h4 className="font-extrabold text-sm text-amber-600 dark:text-amber-400 mb-3">⚡ Areas to Improve</h4>
              <ul className="space-y-2">{feedback.weaknesses.map((w, i) => <li key={i} className="text-sm text-slate-600 dark:text-slate-400 flex items-start gap-2"><span className="text-amber-500 mt-0.5">→</span>{w}</li>)}</ul>
            </motion.div>
          )}
        </div>

        {/* Per-Question Breakdown */}
        {feedback.per_question?.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="soft-card p-5 mb-6">
            <h4 className="font-extrabold text-sm text-slate-800 dark:text-white mb-4">Question-by-Question Feedback</h4>
            <div className="space-y-3">
              {feedback.per_question.map((pq, i) => (
                <details key={i} className="group">
                  <summary className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-7 h-7 rounded-lg bg-teal-50 dark:bg-teal-500/15 flex items-center justify-center text-xs font-extrabold text-teal-600 dark:text-teal-400 shrink-0">{i + 1}</span>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300 truncate">{pq.question}</p>
                    </div>
                    <span className={`soft-badge text-xs ml-2 shrink-0 ${ratingBgs[pq.rating] || ''} ${ratingColors[pq.rating] || 'text-slate-500'}`}>
                      {(pq.rating || 'n/a').replace('_', ' ')}
                    </span>
                  </summary>
                  <div className="px-3 pb-3 pt-2 space-y-2">
                    {pq.student_answer_summary && <p className="text-xs text-slate-500"><span className="font-bold">Your answer: </span>{pq.student_answer_summary}</p>}
                    {pq.feedback && <p className="text-sm text-slate-600 dark:text-slate-400">{pq.feedback}</p>}
                    {pq.ideal_answer_hint && (
                      <div className="bg-teal-50/50 dark:bg-teal-500/5 rounded-xl p-3 border border-teal-100 dark:border-teal-500/20">
                        <p className="text-xs font-bold text-teal-600 dark:text-teal-400 mb-1">💡 Ideal Answer Should Include:</p>
                        <p className="text-xs text-teal-700 dark:text-teal-300/80">{pq.ideal_answer_hint}</p>
                      </div>
                    )}
                  </div>
                </details>
              ))}
            </div>
          </motion.div>
        )}

        {/* Improvement Tips */}
        {feedback.improvement_tips?.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            className="soft-card p-5 mb-6 bg-gradient-to-r from-teal-500/10 to-cyan-500/10 dark:from-teal-500/5 dark:to-cyan-500/5 border-teal-200/50 dark:border-teal-500/20">
            <h4 className="font-extrabold text-sm text-teal-700 dark:text-teal-400 mb-3">🎯 Coach Tips</h4>
            <ul className="space-y-2">{feedback.improvement_tips.map((t, i) => <li key={i} className="text-sm text-teal-800 dark:text-teal-300/80 flex items-start gap-2"><Sparkle size={14} weight="fill" className="text-teal-500 mt-0.5 shrink-0" />{t}</li>)}</ul>
          </motion.div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3">
          <button onClick={onBack} className="flex-1 py-3 rounded-2xl font-bold text-sm bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
            Back to War Room
          </button>
          <button onClick={onRetry} className="flex-1 py-3 rounded-2xl font-bold text-sm bg-gradient-to-r from-teal-500 to-cyan-600 text-white hover:from-teal-600 hover:to-cyan-700 transition-all">
            Practice Again
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Interview Session ──────────────────────────────────────────────────

const AIInterviewSession = ({ navigate, user, quizData: sessionConfig }) => {
  // If viewing a past interview
  const [viewMode, setViewMode] = useState(null);

  // Interview state
  const [phase, setPhase] = useState('setup'); // setup | active | ending | scorecard
  const [orbState, setOrbState] = useState('idle');
  const [interviewId, setInterviewId] = useState(null);
  const [questionNumber, setQuestionNumber] = useState(0);
  const [maxQuestions] = useState(10);
  const [elapsed, setElapsed] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [transcript, setTranscript] = useState('');
  const [conversation, setConversation] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Refs
  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);
  const silenceTimerRef = useRef(null);
  const timerRef = useRef(null);
  const transcriptRef = useRef('');
  const isSpeakingRef = useRef(false);
  const phaseRef = useRef('setup');

  const { isDark } = useTheme();

  // ── Load past interview if viewId ──
  useEffect(() => {
    if (sessionConfig?.viewId) {
      interviewAPI.get(sessionConfig.viewId).then(res => {
        setViewMode(res.data);
        if (res.data.ai_feedback) {
          setFeedback({ ...res.data.ai_feedback, overall_score: res.data.overall_score, scores: res.data.scores });
          setPhase('scorecard');
        }
      }).catch(() => navigate('interview-warroom'));
    }
  }, [sessionConfig, navigate]);

  // ── Timer ──
  useEffect(() => {
    if (phase === 'active') {
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
      return () => clearInterval(timerRef.current);
    }
  }, [phase]);

  const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  // Keep refs synced
  useEffect(() => { isSpeakingRef.current = isSpeaking; }, [isSpeaking]);
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  // ── Stop Listening (defined first — no deps) ──
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }
    setIsListening(false);
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
  }, []);

  // ── Speech Synthesis (AI speaks) ──
  const speakText = useCallback((text) => {
    return new Promise((resolve) => {
      if (!synthRef.current) { resolve(); return; }
      synthRef.current.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1;
      const voices = synthRef.current.getVoices();
      const preferred = voices.find(v => v.lang.startsWith('en') && v.name.includes('Google')) || voices.find(v => v.lang.startsWith('en'));
      if (preferred) utterance.voice = preferred;

      let resolved = false;
      const safeResolve = () => {
        if (!resolved) {
          resolved = true;
          setIsSpeaking(false);
          resolve();
        }
      };

      const fallbackMs = Math.max(3000, text.length * 80 + 2000);
      const tt = setTimeout(safeResolve, fallbackMs);

      utterance.onstart = () => { setIsSpeaking(true); setOrbState('speaking'); stopListening(); };
      utterance.onend = () => { clearTimeout(tt); safeResolve(); };
      utterance.onerror = () => { clearTimeout(tt); safeResolve(); };
      synthRef.current.speak(utterance);
    });
  }, [stopListening]);

  // ── Speech Recognition (Student speaks) — uses refs to avoid stale closures ──
  const startListening = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { toast.error('Speech recognition not supported in this browser. Please use Chrome.'); return; }

    if (recognitionRef.current) { try { recognitionRef.current.stop(); } catch {} }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => { setIsListening(true); setOrbState('listening'); };

    recognition.onresult = (event) => {
      // If AI is speaking and student starts talking, interrupt
      if (isSpeakingRef.current || synthRef.current?.speaking) {
        synthRef.current.cancel();
        setIsSpeaking(false);
        setOrbState('interrupted');
        setTimeout(() => setOrbState('listening'), 300);
      }

      let interim = '';
      let final = transcriptRef.current;
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += t + ' ';
        } else {
          interim = t;
        }
      }
      transcriptRef.current = final;
      setTranscript(final + interim);

      // Reset silence timer (3-second auto-submit)
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => {
        if (transcriptRef.current.trim()) {
          submitAnswer(transcriptRef.current.trim());
        }
      }, 3000);
    };

    recognition.onerror = (e) => {
      if (e.error !== 'no-speech' && e.error !== 'aborted') {
        console.error('Speech recognition error:', e.error);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      // Auto-restart if still in active phase and AI is not speaking
      if (phaseRef.current === 'active' && !isSpeakingRef.current) {
        try { recognition.start(); } catch {}
      }
    };

    recognitionRef.current = recognition;
    try { recognition.start(); } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── End Interview (defined before submitAnswer) ──
  const handleEndInterview = useCallback(async () => {
    stopListening();
    synthRef.current?.cancel();
    setPhase('ending');
    setOrbState('evaluating');

    try {
      const { data } = await interviewAPI.end(interviewId);
      setFeedback(data.feedback ? { ...data.feedback, overall_score: data.overall_score, scores: data.scores } : data);
      setPhase('scorecard');
      try { document.exitFullscreen(); } catch {}
    } catch (err) {
      toast.error('Failed to generate feedback');
      setPhase('active');
      setOrbState('listening');
      startListening();
    }
  }, [interviewId, stopListening, startListening]);

  // ── Submit answer to backend ──
  const submitAnswer = useCallback(async (answer) => {
    if (!interviewId || !answer.trim()) return;
    stopListening();
    setOrbState('thinking');
    setTranscript('');
    transcriptRef.current = '';

    try {
      const { data } = await interviewAPI.sendMessage(interviewId, { content: answer });
      setConversation(prev => [
        ...prev,
        { role: 'user', content: answer },
        { role: 'assistant', content: data.ai_response },
      ]);
      setQuestionNumber(data.question_number);
      setCurrentQuestion(data.ai_response);

      // AI speaks the response
      await speakText(data.ai_response);

      // If final question, auto-end
      if (data.is_final || data.question_number >= maxQuestions) {
        handleEndInterview();
        return;
      }

      // Start listening again
      setOrbState('listening');
      startListening();
    } catch (err) {
      toast.error('Failed to process response. Please try again.');
      setOrbState('listening');
      startListening();
    }
  }, [interviewId, stopListening, speakText, startListening, maxQuestions, handleEndInterview]);

  // ── Start Interview ──
  const handleStart = async () => {
    if (!sessionConfig?.interview_type) { navigate('interview-warroom'); return; }

    // Enter fullscreen
    try {
      await document.documentElement.requestFullscreen();
    } catch {}

    setPhase('active');
    setOrbState('thinking');

    try {
      const { data } = await interviewAPI.start({
        interview_type: sessionConfig.interview_type,
        target_role: sessionConfig.target_role,
        target_company: sessionConfig.target_company,
        difficulty: sessionConfig.difficulty,
      });

      setInterviewId(data.interview_id);
      setQuestionNumber(1);
      setCurrentQuestion(data.first_question);
      setConversation([{ role: 'assistant', content: data.first_question }]);

      // Speak the first question
      await speakText(data.first_question);

      // Start continuous listening
      setOrbState('listening');
      startListening();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to start interview');
      setPhase('setup');
      try { document.exitFullscreen(); } catch {}
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopListening();
      synthRef.current?.cancel();
      clearInterval(timerRef.current);
    };
  }, [stopListening]);

  // ── Scorecard View ──
  if (phase === 'scorecard' && feedback) {
    return (
      <Scorecard
        feedback={feedback}
        onBack={() => navigate('interview-warroom')}
        onRetry={() => navigate('interview-warroom')}
      />
    );
  }

  // ── Setup Screen (pre-fullscreen) ──
  if (phase === 'setup' && !sessionConfig?.viewId) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-[#0a0f1e] flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md w-full text-center">
          <AIOrb state="idle" />
          <div className="mt-12">
            <h2 className="text-2xl font-extrabold text-white mb-2">Ready for your interview?</h2>
            <p className="text-sm text-slate-400 mb-2">
              {sessionConfig?.interview_type?.charAt(0).toUpperCase() + sessionConfig?.interview_type?.slice(1)} Interview
              {sessionConfig?.target_company && ` @ ${sessionConfig.target_company}`}
              {' — '}{sessionConfig?.target_role}
            </p>
            <p className="text-xs text-slate-500 mb-8">
              The AI will ask you questions using voice. Speak your answers naturally.<br/>
              Your microphone will remain active throughout the session.
            </p>
            <button onClick={handleStart}
              className="w-full py-4 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-3">
              <ArrowsOut size={24} weight="bold" />
              Enter Fullscreen & Start
            </button>
            <button onClick={() => navigate('interview-warroom')} className="mt-4 text-sm font-bold text-slate-500 hover:text-slate-300 transition-colors">
              ← Back to War Room
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Active Interview / Ending ──
  return (
    <div className="fixed inset-0 bg-gradient-to-b from-slate-900 via-[#0d1321] to-[#0a0f1e] flex flex-col z-[9999]">
      {/* Minimal Header */}
      <div className="flex items-center justify-between px-4 sm:px-8 py-4">
        <div className="flex items-center gap-3">
          <Brain size={20} weight="duotone" className="text-teal-500" />
          <span className="text-sm font-bold text-slate-400">AcadMix Interview</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-xl">
            <Clock size={14} className="text-slate-400" />
            <span className="text-sm font-bold text-slate-300 tabular-nums">{formatTime(elapsed)}</span>
          </div>
          <div className="bg-teal-500/15 px-3 py-1.5 rounded-xl">
            <span className="text-sm font-bold text-teal-400">Q {questionNumber}/{maxQuestions}</span>
          </div>
          <button onClick={handleEndInterview} disabled={phase === 'ending'}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-red-500/15 text-red-400 text-sm font-bold hover:bg-red-500/25 transition-colors disabled:opacity-50">
            <Stop size={14} weight="fill" /> End
          </button>
        </div>
      </div>

      {/* Center content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {/* AI Orb */}
        <AIOrb state={orbState} />

        {/* Current question (typewriter) */}
        <div className="mt-16 mb-8 text-center px-4 min-h-[80px]">
          {currentQuestion && <TypewriterText text={currentQuestion} speed={orbState === 'speaking' ? 40 : 0} />}
        </div>

        {/* Student transcript (live) */}
        <AnimatePresence>
          {transcript && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-xl w-full bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 px-5 py-4 mb-4"
            >
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <ChatCircleDots size={12} className="text-emerald-400" />
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">{transcript}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom status bar */}
      <div className="px-8 py-5 flex items-center justify-center gap-6">
        <div className="flex items-center gap-2">
          {isListening ? (
            <>
              <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
              <Microphone size={18} className="text-emerald-400" />
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Listening</span>
            </>
          ) : isSpeaking ? (
            <>
              <div className="w-3 h-3 rounded-full bg-cyan-500 animate-pulse" />
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest">AI Speaking</span>
            </>
          ) : (
            <>
              <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">{phase === 'ending' ? 'Evaluating' : 'Processing'}</span>
            </>
          )}
        </div>
        {isListening && (
          <div className="flex gap-0.5">
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                animate={{ scaleY: [0.3, 1, 0.3] }}
                transition={{ duration: 0.6 + i * 0.05, repeat: Infinity, delay: i * 0.05 }}
                className="w-1 bg-emerald-500/60 rounded-full"
                style={{ height: 20 }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AIInterviewSession;
