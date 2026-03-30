import React, { useState } from 'react';
import { Clock, Warning, Camera, CheckCircle, XCircle } from '@phosphor-icons/react';

const QuizAttempt = ({ quiz, navigate }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeRemaining] = useState(3600);
  const [violations, setViolations] = useState(0);
  const [showWarning, setShowWarning] = useState(false);

  const questions = [
    { id: 1, type: 'mcq', question: 'What is the time complexity of searching in a balanced Binary Search Tree?', options: ['O(n)', 'O(log n)', 'O(n\u00b2)', 'O(1)'], marks: 2 },
    { id: 2, type: 'mcq', question: 'Which data structure uses LIFO (Last In First Out) principle?', options: ['Queue', 'Stack', 'Array', 'Linked List'], marks: 2 },
    { id: 3, type: 'multiple', question: 'Which of the following are linear data structures? (Select all that apply)', options: ['Array', 'Tree', 'Linked List', 'Graph', 'Queue'], marks: 3 },
    { id: 4, type: 'boolean', question: 'A hash table provides O(1) average-case time complexity for search operations.', marks: 1 },
    { id: 5, type: 'short', question: 'Explain the difference between a stack and a queue in 2-3 sentences.', marks: 4 },
  ];

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswer = (questionId, answer) => {
    setAnswers({ ...answers, [questionId]: answer });
  };

  const handleSubmit = () => {
    if (window.confirm('Are you sure you want to submit your quiz?')) {
      navigate('quiz-results');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Warning Banner */}
      {showWarning && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-red-500 p-4 rounded-b-2xl" data-testid="violation-warning">
          <div className="max-w-7xl mx-auto flex items-center gap-3">
            <Warning size={24} weight="duotone" className="text-white" />
            <p className="text-white font-bold">Tab Switch Detected! This action has been logged. ({violations} violations)</p>
          </div>
        </div>
      )}

      {/* Quiz Header */}
      <header className="glass-header">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900">Data Structures - Arrays & Linked Lists</h1>
              <p className="text-sm font-medium text-slate-400">Computer Science &bull; 50 marks</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-amber-50 px-4 py-2 rounded-2xl flex items-center gap-2" data-testid="quiz-timer">
                <Clock size={22} weight="duotone" className="text-amber-500" />
                <span className="text-xl font-extrabold text-amber-600">{formatTime(timeRemaining)}</span>
              </div>
              <div className="bg-red-50 px-4 py-2 rounded-2xl flex items-center gap-2" data-testid="violation-counter">
                <Warning size={22} weight="duotone" className="text-red-500" />
                <span className="text-xl font-extrabold text-red-600">{violations}</span>
              </div>
              <div className="bg-emerald-50 px-4 py-2 rounded-2xl flex items-center gap-2" data-testid="proctoring-status">
                <Camera size={22} weight="duotone" className="text-emerald-500" />
                <span className="text-sm font-bold text-emerald-600">Recording</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Question Navigation */}
          <div className="lg:col-span-1">
            <div className="soft-card p-6 sticky top-24">
              <h3 className="text-lg font-bold text-slate-800 mb-4">Questions</h3>
              <div className="grid grid-cols-5 lg:grid-cols-3 gap-2">
                {questions.map((q, index) => (
                  <button key={q.id} data-testid={`question-nav-${index + 1}`} onClick={() => setCurrentQuestion(index)}
                    className={`aspect-square rounded-xl font-bold text-sm transition-all duration-200 ${
                      currentQuestion === index ? 'bg-indigo-500 text-white shadow-md' :
                      answers[q.id] !== undefined ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}>{index + 1}</button>
                ))}
              </div>
              <div className="mt-6 space-y-2.5 text-sm">
                <div className="flex items-center gap-2.5">
                  <div className="w-4 h-4 bg-indigo-500 rounded-md"></div>
                  <span className="font-medium text-slate-500">Current</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-4 h-4 bg-emerald-100 rounded-md"></div>
                  <span className="font-medium text-slate-500">Answered</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-4 h-4 bg-slate-100 rounded-md"></div>
                  <span className="font-medium text-slate-500">Not Answered</span>
                </div>
              </div>
              <button data-testid="submit-quiz-button" onClick={handleSubmit} className="btn-primary w-full mt-6 text-sm">
                Submit Quiz
              </button>
            </div>
          </div>

          {/* Question Display */}
          <div className="lg:col-span-3">
            <div className="soft-card p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
                    Question {currentQuestion + 1} of {questions.length}
                  </span>
                  <h2 className="text-lg font-bold text-slate-800 mt-1">
                    {questions[currentQuestion].type === 'mcq' && 'Multiple Choice'}
                    {questions[currentQuestion].type === 'multiple' && 'Multiple Select'}
                    {questions[currentQuestion].type === 'boolean' && 'True / False'}
                    {questions[currentQuestion].type === 'short' && 'Short Answer'}
                  </h2>
                </div>
                <span className="soft-badge bg-amber-50 text-amber-600">{questions[currentQuestion].marks} marks</span>
              </div>

              <div className="mb-8">
                <p className="text-lg font-medium text-slate-700 leading-relaxed select-none">{questions[currentQuestion].question}</p>
              </div>

              {(questions[currentQuestion].type === 'mcq' || questions[currentQuestion].type === 'multiple') && (
                <div className="space-y-3">
                  {questions[currentQuestion].options.map((option, index) => (
                    <button key={index} data-testid={`option-${index}`} onClick={() => handleAnswer(questions[currentQuestion].id, index)}
                      className={`w-full text-left p-4 rounded-2xl font-medium transition-all duration-200 select-none ${
                        answers[questions[currentQuestion].id] === index
                          ? 'bg-indigo-50 text-indigo-700 ring-2 ring-indigo-500'
                          : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}>
                      <span className="font-bold mr-3 text-sm">{String.fromCharCode(65 + index)}.</span>{option}
                    </button>
                  ))}
                </div>
              )}

              {questions[currentQuestion].type === 'boolean' && (
                <div className="flex gap-4">
                  <button data-testid="true-button" onClick={() => handleAnswer(questions[currentQuestion].id, true)}
                    className={`flex-1 p-6 rounded-2xl font-bold text-lg transition-all duration-200 ${
                      answers[questions[currentQuestion].id] === true ? 'bg-emerald-50 text-emerald-700 ring-2 ring-emerald-500' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}>
                    <CheckCircle size={32} weight="duotone" className="mx-auto mb-2" />TRUE
                  </button>
                  <button data-testid="false-button" onClick={() => handleAnswer(questions[currentQuestion].id, false)}
                    className={`flex-1 p-6 rounded-2xl font-bold text-lg transition-all duration-200 ${
                      answers[questions[currentQuestion].id] === false ? 'bg-rose-50 text-rose-700 ring-2 ring-rose-500' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}>
                    <XCircle size={32} weight="duotone" className="mx-auto mb-2" />FALSE
                  </button>
                </div>
              )}

              {questions[currentQuestion].type === 'short' && (
                <textarea data-testid="short-answer-input" value={answers[questions[currentQuestion].id] || ''}
                  onChange={(e) => handleAnswer(questions[currentQuestion].id, e.target.value)}
                  placeholder="Type your answer here..." rows="8"
                  className="soft-input w-full resize-none" />
              )}

              <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-100">
                <button data-testid="previous-question-button" onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                  disabled={currentQuestion === 0}
                  className={`btn-ghost !px-6 !py-2.5 text-sm ${currentQuestion === 0 ? 'opacity-40 cursor-not-allowed' : ''}`}>
                  Previous
                </button>
                <span className="text-sm font-medium text-slate-400">{Object.keys(answers).length} of {questions.length} answered</span>
                <button data-testid="next-question-button" onClick={() => setCurrentQuestion(Math.min(questions.length - 1, currentQuestion + 1))}
                  disabled={currentQuestion === questions.length - 1}
                  className={`btn-primary !px-6 !py-2.5 text-sm ${currentQuestion === questions.length - 1 ? 'opacity-40 cursor-not-allowed' : ''}`}>
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizAttempt;
