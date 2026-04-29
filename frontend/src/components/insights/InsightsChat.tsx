import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Send, Loader2, Database, Brain, ArrowRight, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { insightsAPI } from '../../services/api';
import InsightsCanvas from './InsightsCanvas';
import { toast } from 'sonner';

export default function InsightsChat({ user, activeCollegeId }) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [history, loading]);

  const handleQuery = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    const userMessage = { role: 'user', content: query };
    const newHistory = [...history, userMessage];
    setHistory(newHistory);
    setQuery('');
    setLoading(true);

    try {
      // Pass only text messages for context, not the huge result objects
      const sessionHistory = history.map(msg => ({
        role: msg.role,
        content: msg.role === 'assistant' ? msg.result.summary : msg.content
      }));

      const response = await insightsAPI.query({
        message: userMessage.content,
        session_history: sessionHistory,
        active_college_id: activeCollegeId
      });

      setHistory([...newHistory, { role: 'assistant', result: response.data }]);
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to fetch insights");
      setHistory([...newHistory, { role: 'assistant', error: true, content: "Sorry, I had trouble processing that request." }]);
    } finally {
      setLoading(false);
    }
  };

  const handlePin = async (result, queryText) => {
    try {
      const res = await insightsAPI.createPin({
        title: queryText || result.summary || "Saved Insight",
        nl_query: queryText || result.summary || "Untitled query",
        cached_sql: result.generated_sql || "",
        chart_suggestion: result.chart_suggestion || null,
        active_college_id: activeCollegeId
      });
      toast.success("Pinned to your dashboard!");
      return res.data?.id || res.data; // return pin ID for unpin toggle
    } catch (error) {
      const detail = error.response?.data?.detail || error.message || "Unknown error";
      toast.error(`Failed to pin: ${typeof detail === 'string' ? detail : JSON.stringify(detail)}`);
      throw error; // re-throw so canvas knows it failed
    }
  };

  const handleUnpin = async (pinId) => {
    try {
      await insightsAPI.deletePin(pinId);
      toast.success("Unpinned from dashboard");
    } catch (error) {
      toast.error("Failed to unpin");
      throw error;
    }
  };

  return (
    <div className="relative bg-transparent flex flex-col h-[calc(100vh-160px)] w-full transition-colors duration-300">

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto w-full p-2 sm:p-4 space-y-6 hide-scrollbar relative">
        
        {/* Empty State / Suggestions */}
        {history.length === 0 && (
          <motion.div 
             initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
             className="flex flex-col items-center justify-center pt-16 sm:pt-24 text-center"
          >
            <div className="w-24 h-24 mb-6 rounded-full bg-indigo-50 dark:bg-indigo-500/5 flex items-center justify-center relative inner-shadow">
               <div className="absolute inset-0 rounded-full border border-indigo-100 dark:border-indigo-500/20 animate-spin-slow"></div>
               <Sparkles className="text-indigo-500 animate-pulse" size={40} weight="duotone" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mb-3">
              What would you like to know?
            </h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-lg mx-auto mb-10 text-sm sm:text-base">
              The AI connects directly to your secure ERP database. Ask about attendance, fee collections, faculty loads, or academic performance.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-3xl">
              {[
                  { text: 'Show me students with attendance below 50%', icon: Database, color: 'text-rose-500' },
                  { text: 'What is the fee collection status by department?', icon: Sparkles, color: 'text-emerald-500' },
                  { text: 'List the top 10 performing students in CSE', icon: Brain, color: 'text-blue-500' },
                  { text: 'Compare pass rates across all semesters', icon: ArrowRight, color: 'text-purple-500' }
              ].map((suggestion, idx) => (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  key={idx}
                  onClick={() => setQuery(suggestion.text)}
                  className="flex items-center gap-4 bg-white dark:bg-[#1A202C] border border-slate-200 dark:border-slate-800 p-4 rounded-2xl hover:border-indigo-500 hover:shadow-lg hover:shadow-indigo-500/10 transition-all text-left group"
                >
                  <div className={`p-2 rounded-xl bg-slate-50 dark:bg-slate-800 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-500/10 transition-colors ${suggestion.color}`}>
                     <suggestion.icon size={20} />
                  </div>
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                    "{suggestion.text}"
                  </span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Chat History */}
        <AnimatePresence>
          {history.map((msg, idx) => (
            <motion.div 
               key={idx} 
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} w-full`}
            >
              {msg.role === 'user' ? (
                <div className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-6 py-4 rounded-3xl rounded-tr-sm max-w-2xl shadow-xl shadow-slate-900/10">
                  <p className="font-medium text-[15px]">{msg.content}</p>
                </div>
              ) : (
                <div className="w-full max-w-full">
                  {msg.error ? (
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-500/20 flex items-center justify-center flex-shrink-0">
                           <Brain className="text-rose-500" size={20} />
                        </div>
                        <div className="bg-white dark:bg-slate-800 border border-rose-100 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 px-6 py-4 rounded-3xl rounded-tl-sm shadow-sm inline-block">
                          <p className="font-semibold">{msg.content}</p>
                        </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3 sm:gap-4 w-full">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex flex-shrink-0 items-center justify-center shadow-md">
                           <Brain className="text-white" size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <InsightsCanvas 
                              result={msg.result} 
                              onPin={async () => {
                                const prevUserMsg = history[idx - 1];
                                return handlePin(msg.result, prevUserMsg?.content);
                              }}
                              onUnpin={handleUnpin}
                            />
                        </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          ))}
          
          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
               <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                     <Loader2 className="text-indigo-600 animate-spin" size={20} />
                  </div>
                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-6 py-4 rounded-3xl rounded-tl-sm shadow-sm inline-block">
                     <p className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-2">
                        Querying database securely <span className="animate-pulse">...</span>
                     </p>
                  </div>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <div ref={messagesEndRef} />
      </div>

      {/* Blur fade between chat and input */}
      <div className="shrink-0 w-full h-10 -mb-10 z-20 pointer-events-none bg-gradient-to-t from-[var(--color-bg)] via-[var(--color-bg)]/60 to-transparent" />

      {/* Input Form at the bottom strictly */}
      <div className="shrink-0 w-full pt-2 pb-1 mt-auto z-30 flex justify-center backdrop-blur-sm bg-[var(--color-bg)]/70">
        <form onSubmit={handleQuery} className="w-full max-w-3xl relative shadow-md rounded-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl p-[1.5px] opacity-20 disabled:opacity-10"></div>
          <div className="relative bg-white dark:bg-[#1A202C] rounded-2xl flex items-center p-1.5 border border-slate-100 dark:border-slate-800 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all duration-300">
             <div className="pl-3 text-slate-400">
                <Sparkles size={18} className="text-indigo-500" />
             </div>
             <input
               type="text"
               value={query}
               onChange={(e) => setQuery(e.target.value)}
               disabled={loading}
               placeholder="Ask about attendance, grades, fees, etc..."
               className="flex-1 bg-transparent border-none focus:ring-0 focus:outline-none text-slate-900 dark:text-white px-3 py-2.5 outline-none font-semibold text-sm w-full disabled:opacity-50 placeholder:font-medium placeholder:text-slate-400"
             />
             <motion.button
               whileHover={{ scale: 1.05 }}
               whileTap={{ scale: 0.95 }}
               type="submit"
               disabled={loading || !query.trim()}
               className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white rounded-xl w-10 h-10 flex items-center justify-center transition-all disabled:opacity-50 mr-0.5 shadow-sm"
             >
               {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
             </motion.button>
          </div>
        </form>
      </div>
    </div>
  );
}
