import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MagnifyingGlass, Plus,
  CheckCircle, XCircle, UserCircle, BookOpen
} from '@phosphor-icons/react';
import PageHeader from '../components/PageHeader';
import { libraryAPI } from '../services/api';
import DashboardSkeleton from '../components/DashboardSkeleton';
import CampusMap from '../components/campus/CampusMap';


// ═══════════════════════════════════════════════════════════════════════════════
// LIBRARIAN DASHBOARD — Full library management interface
// ═══════════════════════════════════════════════════════════════════════════════

export default function LibrarianDashboard({ navigate, user, onLogout }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Search state
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);

  // Add book state
  const [showAddBook, setShowAddBook] = useState(false);
  const [bookForm, setBookForm] = useState({ title: '', author: '', isbn: '', publisher: '', publication_year: '', category: '', description: '' });
  const [saving, setSaving] = useState(false);

  // Checkout/Return state
  const [checkoutForm, setCheckoutForm] = useState({ barcode: '', user_id: '' });
  const [returnForm, setReturnForm] = useState({ barcode: '' });
  const [txnResult, setTxnResult] = useState(null);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await libraryAPI.dashboard();
      setStats(data.data);
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.error || 'Failed to load dashboard');
    }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    try {
      const { data } = await libraryAPI.search(query);
      setSearchResults(data.data);
    } catch (err) { console.error(err); }
    finally { setSearching(false); }
  };

  const handleAddBook = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...bookForm };
      if (payload.publication_year) payload.publication_year = parseInt(payload.publication_year);
      else delete payload.publication_year;
      await libraryAPI.addBook(payload);
      setBookForm({ title: '', author: '', isbn: '', publisher: '', publication_year: '', category: '', description: '' });
      setShowAddBook(false);
      fetchDashboard();
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.error || 'Failed to add book');
    }
    finally { setSaving(false); }
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    setTxnResult(null);
    try {
      const { data } = await libraryAPI.checkout(checkoutForm);
      setTxnResult({ type: 'checkout', ...data.data });
      setCheckoutForm({ barcode: '', user_id: '' });
      fetchDashboard();
    } catch (err) {
      setTxnResult({ type: 'error', message: err.response?.data?.error || err.response?.data?.detail || 'Checkout failed' });
    }
  };

  const handleReturn = async (e) => {
    e.preventDefault();
    setTxnResult(null);
    try {
      const { data } = await libraryAPI.returnBook(returnForm);
      setTxnResult({ type: 'return', ...data.data });
      setReturnForm({ barcode: '' });
      fetchDashboard();
    } catch (err) {
      setTxnResult({ type: 'error', message: err.response?.data?.error || err.response?.data?.detail || 'Return failed' });
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'catalog', label: 'Catalog' },
    { id: 'checkout', label: 'Issue Book' },
    { id: 'return', label: 'Return Book' },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F19] transition-colors">
      <PageHeader
        title="Library Management"
        subtitle="Catalog, checkouts & returns"
        navigate={navigate}
        user={user}
        onLogout={onLogout}
        rightContent={
          <div className="hidden sm:flex items-center gap-3 bg-slate-50 dark:bg-white/5 rounded-2xl px-4 py-2 border border-slate-100 dark:border-white/5">
            <div className="w-8 h-8 rounded-full bg-sky-50 dark:bg-sky-500/10 flex items-center justify-center">
              <BookOpen size={18} weight="duotone" className="text-sky-500" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-tight">{user?.name}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 leading-tight mt-0.5">Librarian</p>
            </div>
          </div>
        }
      />

      <div className="max-w-6xl mx-auto px-4 pb-12 pt-6">
        {/* ── Hero Greeting ───────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="mb-6 sm:mb-8"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-1">
            {(() => { const h = new Date().getHours(); return h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : 'Good Evening'; })()}, <span className="gradient-text">{user?.name}!</span>
          </h2>
          <p className="text-sm sm:text-base font-medium text-slate-500 dark:text-slate-400">
            Library Management System • Manage catalog, checkouts &amp; returns
          </p>
        </motion.div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-4 rounded-xl bg-red-50 dark:bg-red-900/15 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-medium">
            {error}
            <button onClick={() => setError('')} className="ml-3 font-bold text-red-500">✕</button>
          </div>
        )}

        {/* Tabs — matches WardenDashboard pill style */}
        <div className="flex overflow-x-auto gap-1 p-1.5 bg-slate-100 dark:bg-white/[0.04] rounded-xl mb-8 hide-scrollbar">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              id={`library-tab-${tab.id}`}
              className={`flex-1 justify-center flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap border border-transparent relative ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 shadow-sm dark:border-indigo-500/25'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-white/[0.04]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW TAB ── */}
        {activeTab === 'overview' && (
          <div className="animate-fade-in-up">
            {loading ? (
              <DashboardSkeleton variant="content-cards" />
            ) : stats ? (
              <>
                {/* Stat cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 stagger-children">
                  <div className="stat-card" style={{ '--stat-accent': '#0ea5e9', '--stat-accent-end': '#6366f1' }}>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Total Books</p>
                    <p className="text-3xl font-bold text-slate-800 dark:text-white mt-1">{stats.total_books}</p>
                  </div>
                  <div className="stat-card" style={{ '--stat-accent': '#6366f1', '--stat-accent-end': '#8b5cf6' }}>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Total Copies</p>
                    <p className="text-3xl font-bold text-slate-800 dark:text-white mt-1">{stats.total_copies}</p>
                  </div>
                  <div className="stat-card" style={{ '--stat-accent': '#10b981', '--stat-accent-end': '#06b6d4' }}>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Available</p>
                    <p className="text-3xl font-bold text-slate-800 dark:text-white mt-1">{stats.available}</p>
                  </div>
                  <div className="stat-card" style={{ '--stat-accent': '#f59e0b', '--stat-accent-end': '#ef4444' }}>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Checked Out</p>
                    <p className="text-3xl font-bold text-slate-800 dark:text-white mt-1">{stats.checked_out}</p>
                  </div>
                </div>

                {/* Second row */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 stagger-children">
                  <div className="stat-card" style={{ '--stat-accent': '#ef4444', '--stat-accent-end': '#f43f5e' }}>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Overdue</p>
                    <p className="text-3xl font-bold text-slate-800 dark:text-white mt-1">{stats.overdue_count}</p>
                  </div>
                  <div className="stat-card" style={{ '--stat-accent': '#f43f5e', '--stat-accent-end': '#e11d48' }}>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Unpaid Fines</p>
                    <p className="text-3xl font-bold text-slate-800 dark:text-white mt-1">₹{stats.unpaid_fines_total}</p>
                  </div>
                  <div className="stat-card" style={{ '--stat-accent': '#8b5cf6', '--stat-accent-end': '#a855f7' }}>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Reservations</p>
                    <p className="text-3xl font-bold text-slate-800 dark:text-white mt-1">{stats.pending_reservations}</p>
                  </div>
                  <div className="stat-card" style={{ '--stat-accent': '#06b6d4', '--stat-accent-end': '#0ea5e9' }}>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Active Checkouts</p>
                    <p className="text-3xl font-bold text-slate-800 dark:text-white mt-1">{stats.active_checkouts}</p>
                  </div>
                </div>

                {/* Categories */}
                {stats.categories?.length > 0 && (
                  <>
                    <h3 className="font-bold text-lg text-slate-700 dark:text-slate-200 mb-4">Top Categories</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 stagger-children">
                      {stats.categories.map(c => (
                        <div key={c.name} className="soft-card p-4 flex items-center gap-3">
                          <span className="text-xl">📁</span>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">{c.name}</p>
                            <p className="text-xs text-slate-400">{c.count} books</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="text-center py-16 soft-card">
                <p className="text-6xl mb-4">📚</p>
                <p className="text-slate-500 font-medium">Library dashboard is ready. Start adding books!</p>
              </div>
            )}
          </div>
        )}

        {/* ── CATALOG TAB ── */}
        {activeTab === 'catalog' && (
          <div className="animate-fade-in-up">
            <form onSubmit={handleSearch} className="flex gap-3 mb-6">
              <div className="flex-1 relative">
                <MagnifyingGlass size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" value={query} onChange={e => setQuery(e.target.value)}
                  placeholder="Search by title, author, publisher..."
                  className="soft-input w-full pl-12"
                  id="library-search-input"
                />
              </div>
              <button type="submit" disabled={searching} className="btn-primary px-6" id="library-search-btn">
                {searching ? 'Searching...' : 'Search'}
              </button>
              <button type="button" onClick={() => setShowAddBook(true)} className="px-4 py-2.5 rounded-xl bg-emerald-500 text-white font-bold text-sm hover:bg-emerald-600 transition-colors active:scale-95" id="library-add-book-btn">
                <Plus size={18} />
              </button>
            </form>

            {searchResults && (
              <div className="space-y-3">
                <p className="text-sm font-bold text-slate-500 mb-2">{searchResults.total} result{searchResults.total !== 1 ? 's' : ''} found</p>
                {searchResults.books?.map(book => (
                  <div key={book.id} className="soft-card p-5 flex items-start gap-4">
                    <div className="w-12 h-16 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-2xl">📖</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-800 dark:text-white">{book.title}</h4>
                      <p className="text-sm text-slate-500 font-medium">{book.author} {book.publisher && `• ${book.publisher}`}</p>
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        {book.isbn && <span className="soft-badge bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 font-mono text-xs">{book.isbn}</span>}
                        {book.category && <span className="soft-badge bg-indigo-100 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400 text-xs">{book.category}</span>}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`text-lg font-bold ${book.available_copies > 0 ? 'text-emerald-500' : 'text-red-500'}`}>{book.available_copies}</p>
                      <p className="text-xs text-slate-400 font-bold">of {book.total_copies}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── CHECKOUT TAB ── */}
        {activeTab === 'checkout' && (
          <div className="animate-fade-in-up max-w-xl">
            <div className="soft-card p-6">
              <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-4">📤 Issue Book to Student</h3>
              <form onSubmit={handleCheckout} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Student User ID</label>
                  <input type="text" value={checkoutForm.user_id} onChange={e => setCheckoutForm(p => ({...p, user_id: e.target.value}))}
                    placeholder="Enter student user ID"
                    className="soft-input w-full mt-1"
                    required id="checkout-user-id"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Book Barcode</label>
                  <input type="text" value={checkoutForm.barcode} onChange={e => setCheckoutForm(p => ({...p, barcode: e.target.value}))}
                    placeholder="Scan or type barcode"
                    className="soft-input w-full mt-1"
                    required id="checkout-barcode"
                  />
                </div>
                <button type="submit" className="btn-primary w-full" id="checkout-submit-btn">Issue Book</button>
              </form>
            </div>
            <TxnResultCard result={txnResult} />
          </div>
        )}

        {/* ── RETURN TAB ── */}
        {activeTab === 'return' && (
          <div className="animate-fade-in-up max-w-xl">
            <div className="soft-card p-6">
              <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-4">📥 Return Book</h3>
              <form onSubmit={handleReturn} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Book Barcode</label>
                  <input type="text" value={returnForm.barcode} onChange={e => setReturnForm({ barcode: e.target.value })}
                    placeholder="Scan or type barcode"
                    className="soft-input w-full mt-1"
                    required id="return-barcode"
                  />
                </div>
                <button type="submit" className="btn-primary w-full" id="return-submit-btn">Process Return</button>
              </form>
            </div>
            <TxnResultCard result={txnResult} />
          </div>
        )}
      </div>

      {/* Add Book Modal */}
      <AnimatePresence>
        {showAddBook && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowAddBook(false)}
          >
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="soft-card p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="font-bold text-xl text-slate-800 dark:text-white mb-4">Add New Book</h3>
              <form onSubmit={handleAddBook} className="space-y-3">
                {[
                  { key: 'title', label: 'Title', required: true },
                  { key: 'author', label: 'Author', required: true },
                  { key: 'isbn', label: 'ISBN' },
                  { key: 'publisher', label: 'Publisher' },
                  { key: 'publication_year', label: 'Year', type: 'number' },
                  { key: 'category', label: 'Category' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="text-xs font-bold text-slate-500 uppercase">{f.label}</label>
                    <input type={f.type || 'text'} value={bookForm[f.key]} onChange={e => setBookForm(p => ({...p, [f.key]: e.target.value}))}
                      required={f.required}
                      className="soft-input w-full mt-1"
                      id={`add-book-${f.key}`}
                    />
                  </div>
                ))}
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Description</label>
                  <textarea value={bookForm.description} onChange={e => setBookForm(p => ({...p, description: e.target.value}))} rows={3}
                    className="soft-input w-full mt-1 resize-none"
                    id="add-book-description"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowAddBook(false)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                  >Cancel</button>
                  <button type="submit" disabled={saving} className="btn-primary flex-1" id="add-book-submit">
                    {saving ? 'Saving...' : 'Add Book'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TxnResultCard({ result }) {
  if (!result) return null;
  const isError = result.type === 'error';
  return (
    <div className={`mt-4 p-5 rounded-xl border ${
      isError
        ? 'bg-red-50 dark:bg-red-900/15 border-red-200 dark:border-red-800'
        : 'bg-emerald-50 dark:bg-emerald-900/15 border-emerald-200 dark:border-emerald-800'
    }`}>
      <div className="flex items-center gap-2 mb-2">
        {isError ? <XCircle size={20} className="text-red-500" weight="duotone" /> : <CheckCircle size={20} className="text-emerald-500" weight="duotone" />}
        <p className={`font-bold text-sm ${isError ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
          {isError ? 'Error' : result.type === 'checkout' ? 'Book Issued Successfully' : 'Book Returned Successfully'}
        </p>
      </div>
      {isError ? (
        <p className="text-sm text-red-600 dark:text-red-300">{result.message}</p>
      ) : (
        <div className="space-y-1 text-sm text-slate-600 dark:text-slate-300">
          {result.book_title && <p><span className="font-bold">Book:</span> {result.book_title}</p>}
          {result.user_name && <p><span className="font-bold">Student:</span> {result.user_name}</p>}
          {result.copy_barcode && <p><span className="font-bold">Barcode:</span> {result.copy_barcode}</p>}
          {result.due_date && <p><span className="font-bold">Due:</span> {new Date(result.due_date).toLocaleDateString()}</p>}
          {result.fine_amount > 0 && <p className="text-red-500 font-bold">Fine: ₹{result.fine_amount}</p>}
          {result.message && <p className="text-emerald-500 font-medium mt-1">{result.message}</p>}
        </div>
      )}
    </div>
  );
}
