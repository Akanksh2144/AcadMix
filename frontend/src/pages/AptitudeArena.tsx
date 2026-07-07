import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, ArrowLeft, Hourglass, Check, X, 
  Lightbulb, Trophy, Sparkle, SealCheck
} from '@phosphor-icons/react';
import api from '../services/api';
import PageHeader from '../components/PageHeader';
import AlertModal from '../components/AlertModal';

interface Question {
  id: string;
  category: string;
  subcategory: string;
  difficulty: string;
  question_text: string;
  options: Record<string, string>;
  correct_option: string;
  explanation: string;
}

const CATEGORIES = [
  { id: 'Quantitative', name: 'Quantitative Ability', color: 'from-amber-500 to-orange-600' },
  { id: 'Logical', name: 'Logical Reasoning', color: 'from-purple-500 to-indigo-600' },
  { id: 'Verbal', name: 'Verbal Ability', color: 'from-teal-500 to-emerald-600' }
];

const DIFFICULTIES = ['easy', 'medium', 'hard'];

const AptitudeArena = ({ navigate, user }: any) => {
  const [activeCategory, setActiveCategory] = useState('Quantitative');
  const [difficulty, setDifficulty] = useState('medium');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [quizState, setQuizState] = useState<'idle' | 'playing' | 'completed'>('idle');
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [answerSubmitted, setAnswerSubmitted] = useState<Record<number, boolean>>({});
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [timerInterval, setTimerInterval] = useState<any>(null);
  const [showExplanation, setShowExplanation] = useState<Record<number, boolean>>({});
  
  // Alert state
  const [alert, setAlert] = useState({ open: false, title: '', message: '', type: 'info' as any });

  // Load questions from API
  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/placement-prep/aptitude`, {
        params: { category: activeCategory, difficulty, limit: 10 }
      });
      setQuestions(res.data || []);
      setCurrentIdx(0);
      setSelectedAnswers({});
      setAnswerSubmitted({});
      setShowExplanation({});
    } catch (err: any) {
      setAlert({
        open: true,
        title: 'Error',
        message: err.response?.data?.detail || 'Failed to load aptitude questions.',
        type: 'danger'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (quizState === 'idle') {
      fetchQuestions();
    }
  }, [activeCategory, difficulty, quizState]);

  // Quiz timer
  useEffect(() => {
    if (quizState === 'playing') {
      const interval = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
      setTimerInterval(interval);
      return () => clearInterval(interval);
    } else {
      if (timerInterval) clearInterval(timerInterval);
    }
  }, [quizState]);

  const handleSelectOption = (optKey: string) => {
    if (answerSubmitted[currentIdx]) return; // locked
    setSelectedAnswers(prev => ({ ...prev, [currentIdx]: optKey }));
  };

  const handleSubmitAnswer = async () => {
    const userAns = selectedAnswers[currentIdx];
    if (!userAns) return;

    const currentQ = questions[currentIdx];
    const isCorrect = userAns === currentQ.correct_option;

    setAnswerSubmitted(prev => ({ ...prev, [currentIdx]: true }));

    // Log attempt to backend asynchronously
    try {
      await api.post(`/placement-prep/aptitude/attempt`, {
        question_id: currentQ.id,
        is_correct: isCorrect,
        time_taken_sec: 15 // average placeholder or calculated per question
      });
    } catch (err) {
      console.error('Failed to log attempt:', err);
    }
  };

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(prev => prev + 1);
    } else {
      setQuizState('completed');
    }
  };

  const startQuiz = () => {
    if (questions.length === 0) {
      setAlert({
        open: true,
        title: 'No Questions',
        message: 'No questions found for this category and difficulty combination. Seeding database...',
        type: 'warning'
      });
      return;
    }
    setQuizState('playing');
    setTimeElapsed(0);
  };

  const resetQuiz = () => {
    setQuizState('idle');
    fetchQuestions();
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}:${remainingSecs < 10 ? '0' : ''}${remainingSecs}`;
  };

  // Calculate results
  const correctCount = questions.reduce((acc, q, idx) => {
    return acc + (selectedAnswers[idx] === q.correct_option ? 1 : 0);
  }, 0);

  const activeColor = CATEGORIES.find(c => c.id === activeCategory)?.color || 'from-amber-500 to-orange-600';

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F19] transition-colors duration-300">
      <PageHeader 
        navigate={navigate} 
        user={user} 
        title="Aptitude Arena" 
        subtitle="Test your Quantitative, Logical & Verbal skills"
        maxWidth="max-w-4xl"
      />

      <div className="max-w-4xl mx-auto px-4 py-6">
        
        {/* Back Link */}
        <button 
          onClick={() => navigate('placement-prep')}
          className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white mb-6 group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Back to Placement Hub
        </button>

        {quizState === 'idle' && (
          <div className="space-y-6">
            
            {/* Category Pills Menu */}
            <div className="flex justify-center">
              <div className="bg-slate-200/50 dark:bg-slate-900/60 p-1.5 rounded-full border border-slate-300/40 dark:border-white/5 flex gap-1">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all duration-300 ${
                      activeCategory === cat.id
                        ? `bg-gradient-to-r ${cat.color} text-white shadow-md`
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty Control Panel */}
            <div className="flex justify-center">
              <div className="bg-slate-200/30 dark:bg-slate-900/40 p-1 rounded-full border border-slate-300/20 dark:border-white/5 flex gap-0.5">
                {DIFFICULTIES.map(diff => (
                  <button
                    key={diff}
                    onClick={() => setDifficulty(diff)}
                    className={`px-4 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider transition-all duration-300 ${
                      difficulty === diff
                        ? `bg-slate-800 dark:bg-white text-white dark:text-slate-950 shadow-sm`
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {diff}
                  </button>
                ))}
              </div>
            </div>

            {/* Hub Welcome/Intro Card */}
            <div className="soft-card p-8 text-center bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-white/5 rounded-3xl shadow-xl max-w-xl mx-auto">
              <div className="w-16 h-16 rounded-3xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto mb-5 border border-amber-500/20">
                <Brain size={32} weight="duotone" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Practice & Timed Drills</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-6">
                Test your conceptual clarity with our diagnostic quizzes. Each test consists of 10 curated questions with detailed step-by-step solutions to build your speed.
              </p>

              {loading ? (
                <div className="flex justify-center items-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
                </div>
              ) : (
                <button
                  onClick={startQuiz}
                  className={`w-full py-4 bg-gradient-to-r ${activeColor} text-white font-bold rounded-2xl shadow-lg transition-all hover:scale-[1.02]`}
                >
                  Start Timed Test (10 Questions)
                </button>
              )}
            </div>
          </div>
        )}

        {quizState === 'playing' && questions.length > 0 && (
          <div className="space-y-6">
            
            {/* Header / Timer info bar */}
            <div className="flex justify-between items-center bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-white/5 rounded-2xl p-4 shrink-0 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400">Question {currentIdx + 1} of {questions.length}</span>
                <div className="h-1.5 w-24 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full bg-gradient-to-r ${activeColor}`} 
                    style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
                  />
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold">
                <Hourglass size={14} weight="bold" />
                {formatTime(timeElapsed)}
              </div>
            </div>

            {/* Question Card */}
            <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-white/5 rounded-3xl p-6 sm:p-8 shadow-xl">
              <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/[0.04] text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 border border-slate-200/50 dark:border-white/5 mb-4 inline-block">
                {questions[currentIdx].subcategory || 'Reasoning'}
              </span>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mb-6 leading-relaxed select-text whitespace-pre-wrap">
                {questions[currentIdx].question_text}
              </h3>

              {/* Options list */}
              <div className="space-y-3 mb-6">
                {Object.entries(questions[currentIdx].options).map(([key, val]) => {
                  const isSelected = selectedAnswers[currentIdx] === key;
                  const isSubmitted = answerSubmitted[currentIdx];
                  const isCorrect = key === questions[currentIdx].correct_option;

                  let borderClass = 'border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-900/20';
                  let iconElement = null;

                  if (isSelected && !isSubmitted) {
                    borderClass = 'border-slate-900 dark:border-slate-100 bg-slate-50 dark:bg-slate-900/50';
                  } else if (isSubmitted) {
                    if (isCorrect) {
                      borderClass = 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300';
                      iconElement = <Check size={16} weight="bold" className="text-emerald-500 shrink-0" />;
                    } else if (isSelected) {
                      borderClass = 'border-rose-500 bg-rose-50/50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300';
                      iconElement = <X size={16} weight="bold" className="text-rose-500 shrink-0" />;
                    }
                  }

                  return (
                    <button
                      key={key}
                      onClick={() => handleSelectOption(key)}
                      disabled={isSubmitted}
                      className={`w-full flex items-center justify-between p-4 rounded-2xl border text-left text-sm transition-all ${borderClass}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                          isSelected ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950' : 'bg-slate-200/50 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}>
                          {key}
                        </span>
                        <span className="font-semibold text-slate-700 dark:text-slate-350">{val}</span>
                      </div>
                      {iconElement}
                    </button>
                  );
                })}
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 justify-end items-center border-t border-slate-100 dark:border-white/5 pt-5">
                {!answerSubmitted[currentIdx] ? (
                  <button
                    onClick={handleSubmitAnswer}
                    disabled={!selectedAnswers[currentIdx]}
                    className="px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-950 text-xs font-extrabold uppercase tracking-wider rounded-xl transition-all disabled:opacity-50"
                  >
                    Submit Answer
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => setShowExplanation(prev => ({ ...prev, [currentIdx]: !prev[currentIdx] }))}
                      className="px-5 py-3 border border-slate-200 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
                    >
                      <Lightbulb size={16} weight="duotone" className="text-amber-500" />
                      {showExplanation[currentIdx] ? 'Hide Explanation' : 'View Explanation'}
                    </button>
                    <button
                      onClick={handleNext}
                      className={`px-6 py-3 bg-gradient-to-r ${activeColor} text-white text-xs font-extrabold uppercase tracking-wider rounded-xl transition-all hover:opacity-90`}
                    >
                      {currentIdx === questions.length - 1 ? 'Finish Quiz' : 'Next Question'}
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Explanation Expandable Box */}
            <AnimatePresence>
              {answerSubmitted[currentIdx] && showExplanation[currentIdx] && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-6 shadow-sm"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkle size={18} weight="fill" className="text-amber-500" />
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">Solution Walkthrough</h4>
                  </div>
                  <p className="text-slate-600 dark:text-slate-350 text-sm leading-relaxed select-text whitespace-pre-wrap">
                    {questions[currentIdx].explanation}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {quizState === 'completed' && (
          <div className="max-w-xl mx-auto space-y-6">
            
            {/* Score Summary Card */}
            <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-white/5 rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-emerald-500 to-teal-500" />
              
              <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto mb-5 border border-emerald-500/20">
                <Trophy size={32} weight="duotone" />
              </div>

              <h2 className="text-3xl font-black text-slate-900 dark:text-white">Quiz Completed!</h2>
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">
                Category: {activeCategory} ({difficulty})
              </p>

              {/* Score grid */}
              <div className="grid grid-cols-3 gap-4 my-8">
                <div className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-200/50 dark:border-white/5">
                  <div className="text-2xl font-black text-slate-950 dark:text-white">
                    {correctCount}/{questions.length}
                  </div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Score</div>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-200/50 dark:border-white/5">
                  <div className="text-2xl font-black text-slate-950 dark:text-white">
                    {Math.round((correctCount / questions.length) * 100)}%
                  </div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Accuracy</div>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-200/50 dark:border-white/5">
                  <div className="text-2xl font-black text-slate-950 dark:text-white">
                    {formatTime(timeElapsed)}
                  </div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Time Taken</div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={resetQuiz}
                  className="flex-1 py-3.5 border border-slate-200 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-slate-900/50 text-slate-700 dark:text-slate-300 font-bold text-sm rounded-xl transition-all"
                >
                  Practice Again
                </button>
                <button
                  onClick={() => navigate('placement-prep')}
                  className={`flex-1 py-3.5 bg-gradient-to-r ${activeColor} text-white font-bold text-sm rounded-xl transition-all shadow-md`}
                >
                  Return to Hub
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

      <AlertModal
        open={alert.open}
        title={alert.title}
        message={alert.message}
        type={alert.type}
        onConfirm={() => setAlert(prev => ({ ...prev, open: false }))}
      />
    </div>
  );
};

export default AptitudeArena;
