import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Buildings, ArrowLeft, Star, FileText, ChatCenteredDots,
  Clock, Check, X, SealCheck, Trophy, Sparkle
} from '@phosphor-icons/react';
import api from '../services/api';
import PageHeader from '../components/PageHeader';
import AlertModal from '../components/AlertModal';

interface Question {
  id: string;
  question_text: string;
  options: Record<string, string>;
  correct_option: string;
  section: string;
  explanation: string;
}

interface CompanyBank {
  id: string;
  company_name: string;
  exam_name: string;
  exam_pattern: {
    sections: string[];
    total_questions: number;
    duration_minutes: number;
  };
  questions: Question[];
}

interface Experience {
  id: string;
  company_name: string;
  target_role: string;
  year: number;
  difficulty_rating: number;
  rounds: {
    round: number;
    type: string;
    details: string;
  }[];
}

const COMPANIES = [
  { id: 'TCS', name: 'Tata Consultancy Services', logoText: 'TCS', color: 'from-blue-500 to-indigo-600', role: 'Ninja / Digital Engineer' },
  { id: 'Infosys', name: 'Infosys', logoText: 'INFY', color: 'from-orange-500 to-amber-600', role: 'Specialist Programmer / DSE' },
  { id: 'Amazon', name: 'Amazon', logoText: 'AMZN', color: 'from-slate-800 to-slate-950', role: 'Software Dev Engineer (SDE)' }
];

const CompanyPrepHub = ({ navigate, user }: any) => {
  const [selectedCompany, setSelectedCompany] = useState('TCS');
  const [activeTab, setActiveTab] = useState<'pattern' | 'experiences'>('pattern');
  const [bank, setBank] = useState<CompanyBank | null>(null);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  
  const [loading, setLoading] = useState(false);
  
  // Interactive mock test quiz state
  const [quizState, setQuizState] = useState<'idle' | 'playing' | 'completed'>('idle');
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [answerSubmitted, setAnswerSubmitted] = useState<Record<number, boolean>>({});
  const [showExplanation, setShowExplanation] = useState<Record<number, boolean>>({});

  const [alert, setAlert] = useState({ open: false, title: '', message: '', type: 'info' as any });

  // Fetch company data
  const fetchData = async () => {
    setLoading(true);
    setQuizState('idle');
    try {
      // 1. Fetch Question Bank
      const bankRes = await api.get(`/placement-prep/company`, {
        params: { company_name: selectedCompany }
      });
      setBank(bankRes.data);

      // 2. Fetch Experiences
      const expRes = await api.get(`/placement-prep/experiences`, {
        params: { company_name: selectedCompany }
      });
      setExperiences(expRes.data || []);
    } catch (err: any) {
      console.error(err);
      setBank(null);
      setExperiences([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedCompany]);

  const handleSelectOption = (optKey: string) => {
    if (answerSubmitted[currentIdx]) return;
    setSelectedAnswers(prev => ({ ...prev, [currentIdx]: optKey }));
  };

  const handleSubmitAnswer = () => {
    setAnswerSubmitted(prev => ({ ...prev, [currentIdx]: true }));
  };

  const handleNext = () => {
    if (bank && currentIdx < bank.questions.length - 1) {
      setCurrentIdx(prev => prev + 1);
    } else {
      setQuizState('completed');
    }
  };

  const startTest = () => {
    if (!bank || !bank.questions || bank.questions.length === 0) {
      setAlert({
        open: true,
        title: 'No Questions',
        message: 'No questions loaded for this company.',
        type: 'warning'
      });
      return;
    }
    setQuizState('playing');
    setCurrentIdx(0);
    setSelectedAnswers({});
    setAnswerSubmitted({});
    setShowExplanation({});
  };

  const correctCount = bank?.questions.reduce((acc, q, idx) => {
    return acc + (selectedAnswers[idx] === q.correct_option ? 1 : 0);
  }, 0) || 0;

  const currentCompany = COMPANIES.find(c => c.id === selectedCompany) || COMPANIES[0];

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F19] transition-colors duration-300">
      <PageHeader 
        navigate={navigate} 
        user={user} 
        title="Target Company Prep" 
        subtitle="Crack company-specific placement patterns"
        maxWidth="max-w-5xl"
      />

      <div className="max-w-5xl mx-auto px-4 py-6">
        
        {/* Back Link */}
        <button 
          onClick={() => navigate('placement-prep')}
          className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white mb-6 group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Back to Placement Hub
        </button>

        {/* Company Selector Grid */}
        {quizState === 'idle' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {COMPANIES.map(company => {
              const isSelected = selectedCompany === company.id;
              return (
                <button
                  key={company.id}
                  onClick={() => {
                    setSelectedCompany(company.id);
                    setActiveTab('pattern');
                  }}
                  className={`group relative text-left p-6 rounded-2xl border transition-all duration-300 ${
                    isSelected 
                      ? 'border-slate-800 dark:border-slate-100 bg-slate-900 text-white dark:bg-slate-800 shadow-lg' 
                      : 'border-slate-200 dark:border-white/5 bg-white dark:bg-[#1E293B] hover:border-slate-400 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <span className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-sm uppercase ${
                      isSelected ? 'bg-white/10 text-white border border-white/20' : 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-350'
                    }`}>
                      {company.logoText}
                    </span>
                    <Buildings size={20} className={isSelected ? 'text-white/40' : 'text-slate-400'} />
                  </div>
                  <h3 className={`text-base font-extrabold leading-tight ${isSelected ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                    {company.name}
                  </h3>
                  <p className={`text-xs mt-1.5 font-bold ${isSelected ? 'text-white/60' : 'text-slate-400'}`}>
                    Target Role: {company.role}
                  </p>
                </button>
              );
            })}
          </div>
        )}

        {/* Tab Controls & Content Panel */}
        {quizState === 'idle' && (
          <div className="space-y-6">
            
            {/* Pill Tabs Menu */}
            <div className="flex justify-center">
              <div className="bg-slate-200/50 dark:bg-slate-900/60 p-1.5 rounded-full border border-slate-300/40 dark:border-white/5 flex gap-1">
                <button
                  onClick={() => setActiveTab('pattern')}
                  className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all duration-300 flex items-center gap-1.5 ${
                    activeTab === 'pattern'
                      ? `bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 shadow-md`
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <FileText size={16} /> Pattern & Mock Test
                </button>
                <button
                  onClick={() => setActiveTab('experiences')}
                  className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all duration-300 flex items-center gap-1.5 ${
                    activeTab === 'experiences'
                      ? `bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 shadow-md`
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <ChatCenteredDots size={16} /> Interview Experiences
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-slate-800 dark:border-white"></div>
              </div>
            ) : activeTab === 'pattern' ? (
              bank ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                  
                  {/* Pattern Info Card */}
                  <div className="soft-card bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-white/5 rounded-3xl p-6 shadow-md lg:col-span-1">
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white mb-4">Exam Pattern</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500">Exam Name</span>
                        <span className="font-extrabold text-slate-850 dark:text-slate-200">{bank.exam_name}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500">Duration</span>
                        <span className="font-extrabold text-slate-850 dark:text-slate-200 flex items-center gap-1">
                          <Clock size={14} /> {bank.exam_pattern?.duration_minutes} mins
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500">Total Questions</span>
                        <span className="font-extrabold text-slate-850 dark:text-slate-200">{bank.exam_pattern?.total_questions}</span>
                      </div>
                      <div className="border-t border-slate-100 dark:border-white/5 pt-4">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-2">Sections Covered</span>
                        <div className="flex flex-wrap gap-1.5">
                          {bank.exam_pattern?.sections?.map(sec => (
                            <span key={sec} className="px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-white/[0.04] text-[10px] font-bold text-slate-500 dark:text-slate-400 border border-slate-250/20">
                              {sec}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Start Test Card */}
                  <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-white/5 rounded-3xl p-8 text-center shadow-md lg:col-span-2">
                    <div className="w-14 h-14 rounded-3xl bg-slate-900/5 dark:bg-white/5 flex items-center justify-center mx-auto mb-5">
                      <Trophy size={28} className="text-slate-700 dark:text-white" />
                    </div>
                    <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-2">Pattern-Specific Mock Test</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md mx-auto leading-relaxed mb-6">
                      Practice standard question bank patterns designed after previous year hiring trends for {selectedCompany}.
                    </p>
                    <button
                      onClick={startTest}
                      className="px-8 py-3.5 bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-bold rounded-xl shadow-lg transition-all hover:scale-[1.01]"
                    >
                      Start Mock Test
                    </button>
                  </div>

                </div>
              ) : (
                <div className="soft-card p-12 text-center text-slate-500">
                  No question bank modules available for {selectedCompany}.
                </div>
              )
            ) : (
              // Experiences Timeline
              <div className="space-y-4">
                {experiences.length > 0 ? (
                  experiences.map((exp, idx) => (
                    <div 
                      key={exp.id} 
                      className="soft-card bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-white/5 rounded-3xl p-6 sm:p-8 shadow-sm transition-all"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                        <div>
                          <h4 className="text-base font-extrabold text-slate-900 dark:text-white">{exp.target_role}</h4>
                          <p className="text-xs text-slate-450 mt-0.5">Academic Year: {exp.year}</p>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200/50 dark:border-white/5 text-[10px] font-bold text-slate-500">
                          Difficulty:
                          <div className="flex gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star 
                                key={i} 
                                size={12} 
                                weight={i < exp.difficulty_rating ? 'fill' : 'bold'} 
                                className={i < exp.difficulty_rating ? 'text-amber-400' : 'text-slate-300 dark:text-slate-700'} 
                              />
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Rounds details */}
                      <div className="space-y-4 border-l-2 border-slate-200 dark:border-slate-800 pl-4 ml-2">
                        {exp.rounds?.map((round, rIdx) => (
                          <div key={rIdx} className="relative select-text">
                            <span className="absolute -left-[23px] top-1.5 w-2.5 h-2.5 rounded-full bg-slate-800 dark:bg-white border-2 border-white dark:border-slate-800" />
                            <h5 className="text-xs font-bold text-slate-900 dark:text-white">Round {round.round}: {round.type}</h5>
                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-1">{round.details}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="soft-card p-12 text-center text-slate-500">
                    No interview experiences found for {selectedCompany}.
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Mock Test Active View */}
        {quizState === 'playing' && bank && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-white/5 rounded-2xl p-4 shrink-0 shadow-sm">
              <span className="text-xs font-bold text-slate-400">Section: {bank.questions[currentIdx].section}</span>
              <span className="text-xs font-bold text-slate-500">Question {currentIdx + 1} of {bank.questions.length}</span>
            </div>

            {/* Question Box */}
            <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-white/5 rounded-3xl p-6 sm:p-8 shadow-xl">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white mb-6 leading-relaxed select-text whitespace-pre-wrap">
                {bank.questions[currentIdx].question_text}
              </h3>

              {/* Options */}
              <div className="space-y-3 mb-6">
                {Object.entries(bank.questions[currentIdx].options).map(([key, val]) => {
                  const isSelected = selectedAnswers[currentIdx] === key;
                  const isSubmitted = answerSubmitted[currentIdx];
                  const isCorrect = key === bank.questions[currentIdx].correct_option;

                  let borderClass = 'border-slate-200 dark:border-white/5 hover:border-slate-350 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-900/20';
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

              {/* Action Toolbar */}
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
                      className="px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-950 text-xs font-extrabold uppercase tracking-wider rounded-xl transition-all hover:opacity-90"
                    >
                      {currentIdx === bank.questions.length - 1 ? 'Finish Quiz' : 'Next Question'}
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Explanation panel */}
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
                    {bank.questions[currentIdx].explanation}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Mock Test Result Summary */}
        {quizState === 'completed' && bank && (
          <div className="max-w-xl mx-auto space-y-6">
            <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-white/5 rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-emerald-500 to-teal-500" />
              
              <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto mb-5 border border-emerald-500/20">
                <Trophy size={32} weight="duotone" />
              </div>

              <h2 className="text-3xl font-black text-slate-900 dark:text-white">Mock Test Finished!</h2>
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">
                Company: {selectedCompany} ({bank.exam_name})
              </p>

              <div className="grid grid-cols-2 gap-4 my-8">
                <div className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-200/50 dark:border-white/5">
                  <div className="text-2xl font-black text-slate-950 dark:text-white">
                    {correctCount}/{bank.questions.length}
                  </div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Score</div>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-200/50 dark:border-white/5">
                  <div className="text-2xl font-black text-slate-950 dark:text-white">
                    {Math.round((correctCount / bank.questions.length) * 100)}%
                  </div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Accuracy</div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={startTest}
                  className="flex-1 py-3.5 border border-slate-200 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-slate-900/50 text-slate-700 dark:text-slate-300 font-bold text-sm rounded-xl transition-all"
                >
                  Retake Test
                </button>
                <button
                  onClick={() => setQuizState('idle')}
                  className="flex-1 py-3.5 bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-bold text-sm rounded-xl transition-all shadow-md"
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

export default CompanyPrepHub;
