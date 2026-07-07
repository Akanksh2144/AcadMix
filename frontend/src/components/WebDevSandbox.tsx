import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { 
  Code, Palette, FileCode, ArrowCounterClockwise, 
  CornersOut, CornersIn, Trash, Terminal, Sparkle, 
  UploadSimple, Plus, MagnifyingGlass, Globe, Info,
  Sun, Moon, DownloadSimple, Gear, Rows, Columns, Square
} from '@phosphor-icons/react';
import AlertModal from './AlertModal';

// Pre-defined templates for instant sandbox initialization
const TEMPLATES = {
  blank: {
    html: '<!-- Write your HTML code here -->\n<div class="hero">\n  <div class="badge">VITE + ESBUILD</div>\n  <h1>Build Something <span class="gradient-text">Exceptional</span></h1>\n  <p>A premium sandbox equipped with runtime compilers, console log capture, and styling utilities.</p>\n  <div class="actions">\n    <a href="#" class="btn btn-primary">Get Started</a>\n    <a href="#" class="btn btn-secondary">Documentation</a>\n  </div>\n</div>',
    css: '/* Write your CSS styling here */\nbody {\n  margin: 0;\n  font-family: \'Outfit\', system-ui, sans-serif;\n  background: #090d16;\n  color: #f8fafc;\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  min-height: 100vh;\n}\n.hero {\n  text-align: center;\n  max-width: 600px;\n  padding: 3rem;\n  background: #111827;\n  border: 1px solid #1f2937;\n  border-radius: 24px;\n  box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5);\n}\n.badge {\n  display: inline-block;\n  padding: 0.25rem 0.75rem;\n  font-size: 0.7rem;\n  font-weight: 800;\n  color: #6366f1;\n  background: rgba(99, 102, 241, 0.1);\n  border: 1px solid rgba(99, 102, 241, 0.2);\n  border-radius: 9999px;\n  letter-spacing: 0.05em;\n  margin-bottom: 1.5rem;\n}\nh1 {\n  font-size: 2.5rem;\n  font-weight: 850;\n  margin: 0 0 1rem 0;\n  letter-spacing: -0.02em;\n  line-height: 1.2;\n}\n.gradient-text {\n  background: linear-gradient(to right, #6366f1, #a855f7);\n  -webkit-background-clip: text;\n  -webkit-text-fill-color: transparent;\n}\np {\n  font-size: 0.95rem;\n  color: #94a3b8;\n  line-height: 1.6;\n  margin: 0 0 2rem 0;\n}\n.actions {\n  display: flex;\n  gap: 1rem;\n  justify-content: center;\n}\n.btn {\n  padding: 0.75rem 1.5rem;\n  font-size: 0.85rem;\n  font-weight: 700;\n  text-decoration: none;\n  border-radius: 12px;\n  transition: all 0.2s;\n}\n.btn-primary {\n  background: #6366f1;\n  color: white;\n  box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);\n}\n.btn-primary:hover {\n  background: #4f46e5;\n  transform: translateY(-2px);\n}\n.btn-secondary {\n  border: 1px solid #1f2937;\n  color: #e2e8f0;\n  background: rgba(255,255,255,0.02);\n}\n.btn-secondary:hover {\n  background: rgba(255,255,255,0.05);\n  border-color: #374151;\n}',
    js: 'console.log("Welcome to your clean slate. Let\'s build!");'
  },
  animation: {
    html: '<div class="dashboard">\n  <div class="card">\n    <div class="card-header">\n      <h3>System Metrics</h3>\n      <span class="status-pulse"></span>\n    </div>\n    \n    <div class="radial-progress">\n      <svg class="progress-svg" viewBox="0 0 100 100">\n        <circle class="track" cx="50" cy="50" r="40"></circle>\n        <circle class="bar" id="cpu-bar" cx="50" cy="50" r="40" style="stroke-dashoffset: 251.2;"></circle>\n      </svg>\n      <div class="percentage" id="cpu-val">0%</div>\n    </div>\n    \n    <div class="stat-grid">\n      <div class="stat-box">\n        <span class="stat-label">Memory</span>\n        <span class="stat-value" id="mem-val">4.2 GB</span>\n      </div>\n      <div class="stat-box">\n        <span class="stat-label">Network</span>\n        <span class="stat-value" id="net-val">120 MB/s</span>\n      </div>\n    </div>\n    \n    <button class="action-btn" id="scan-btn">Initiate Diagnostics</button>\n  </div>\n</div>',
    css: 'body {\n  margin: 0;\n  background: #020617;\n  color: #f8fafc;\n  font-family: \'Outfit\', sans-serif;\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  min-height: 100vh;\n}\n.dashboard {\n  width: 100%;\n  max-width: 380px;\n  padding: 1rem;\n}\n.card {\n  background: #0b0f19;\n  border: 1px solid #1e293b;\n  border-radius: 28px;\n  padding: 2rem;\n  box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);\n  text-align: center;\n  position: relative;\n  overflow: hidden;\n}\n.card-header {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  margin-bottom: 1.5rem;\n}\n.card-header h3 {\n  margin: 0;\n  font-size: 1.1rem;\n  font-weight: 800;\n  letter-spacing: -0.01em;\n  color: #94a3b8;\n}\n.status-pulse {\n  width: 8px;\n  height: 8px;\n  background: #10b981;\n  border-radius: 50%;\n  box-shadow: 0 0 8px #10b981;\n  animation: pulse 1.5s infinite alternate;\n}\n.radial-progress {\n  position: relative;\n  width: 160px;\n  height: 160px;\n  margin: 0 auto 2rem auto;\n}\n.progress-svg {\n  transform: rotate(-90deg);\n}\n.track {\n  fill: none;\n  stroke: #1e293b;\n  stroke-width: 8;\n}\n.bar {\n  fill: none;\n  stroke: #6366f1;\n  stroke-width: 8;\n  stroke-linecap: round;\n  stroke-dasharray: 251.2;\n  transition: stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1);\n}\n.percentage {\n  position: absolute;\n  top: 50%;\n  left: 50%;\n  transform: translate(-50%, -50%);\n  font-size: 2rem;\n  font-weight: 850;\n  letter-spacing: -0.03em;\n}\n.stat-grid {\n  display: grid;\n  grid-template-columns: repeat(2, 1fr);\n  gap: 1rem;\n  margin-bottom: 1.5rem;\n}\n.stat-box {\n  background: #111827;\n  border: 1px solid #1e293b;\n  padding: 1rem;\n  border-radius: 16px;\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n}\n.stat-label {\n  font-size: 0.7rem;\n  font-weight: 700;\n  color: #64748b;\n  text-transform: uppercase;\n  letter-spacing: 0.05em;\n  margin-bottom: 0.25rem;\n}\n.stat-value {\n  font-size: 1rem;\n  font-weight: 800;\n  color: #e2e8f0;\n}\n.action-btn {\n  width: 100%;\n  padding: 1rem;\n  background: linear-gradient(135deg, #6366f1, #a855f7);\n  color: white;\n  font-family: inherit;\n  font-weight: 700;\n  border: none;\n  border-radius: 14px;\n  cursor: pointer;\n  box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);\n  transition: all 0.2s;\n}\n.action-btn:hover {\n  transform: translateY(-2px);\n  box-shadow: 0 6px 20px rgba(168, 85, 247, 0.5);\n}\n@keyframes pulse {\n  0% { opacity: 0.4; }\n  100% { opacity: 1; }\n}',
    js: 'const scanBtn = document.getElementById(\'scan-btn\');\nconst cpuBar = document.getElementById(\'cpu-bar\');\nconst cpuVal = document.getElementById(\'cpu-val\');\nconst memVal = document.getElementById(\'mem-val\');\nconst netVal = document.getElementById(\'net-val\');\n\nlet active = false;\n\nscanBtn.addEventListener(\'click\', () => {\n  if (active) return;\n  active = true;\n  scanBtn.textContent = \'Running Diagnostics...\';\n  console.log("Diagnostics scan initiated...");\n\n  let progress = 0;\n  const interval = setInterval(() => {\n    progress += Math.floor(Math.random() * 15) + 5;\n    if (progress >= 100) {\n      progress = 100;\n      clearInterval(interval);\n      scanBtn.textContent = \'Scan Completed\';\n      active = false;\n      console.log("Diagnostics scan completed: All systems normal!");\n    }\n\n    // Update Circle\n    const offset = 251.2 - (251.2 * progress) / 100;\n    cpuBar.style.strokeDashoffset = offset;\n    cpuVal.textContent = progress + \'%\';\n\n    // Update simulated stats\n    memVal.textContent = (3.5 + (progress / 150)).toFixed(1) + \' GB\';\n    netVal.textContent = (50 + progress * 2.5).toFixed(0) + \' MB/s\';\n    console.log(\'System Check - Progress: \' + progress + \'%\');\n  }, 300);\n});'
  },
  react: {
    html: '<div id="root"></div>\n\n<!-- React and ReactDOM CDNs -->\n<script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script>\n<script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script>\n<script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>\n<!-- Tailwind CSS runtime CDN -->\n<script src="https://cdn.tailwindcss.com"></script>\n<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800&display=swap" rel="stylesheet">\n<script>\n  tailwind.config = {\n    theme: {\n      extend: {\n        fontFamily: {\n          sans: [\'Outfit\', \'sans-serif\'],\n        }\n      }\n    }\n  }\n</script>',
    css: '/* Custom scrollbars and transition timings */\n.custom-scroll::-webkit-scrollbar {\n  width: 4px;\n}\n.custom-scroll::-webkit-scrollbar-track {\n  background: transparent;\n}\n.custom-scroll::-webkit-scrollbar-thumb {\n  background: #374151;\n  border-radius: 9999px;\n}',
    js: 'const { useState } = React;\n\nfunction KanbanBoard() {\n  const [tasks, setTasks] = useState([\n    { id: 1, text: \'Design database schema\', column: \'todo\' },\n    { id: 2, text: \'Integrate authentication logic\', column: \'in_progress\' },\n    { id: 3, text: \'Build responsive landing page\', column: \'done\' }\n  ]);\n  const [inputVal, setInputVal] = useState(\'\');\n\n  const addTask = () => {\n    if (!inputVal.trim()) return;\n    setTasks([...tasks, { id: Date.now(), text: inputVal, column: \'todo\' }]);\n    setInputVal(\'\');\n    console.log("Added new task:", inputVal);\n  };\n\n  const deleteTask = (id) => {\n    setTasks(tasks.filter(t => t.id !== id));\n    console.log("Deleted task ID:", id);\n  };\n\n  const moveTask = (id, targetCol) => {\n    setTasks(tasks.map(t => t.id === id ? { ...t, column: targetCol } : t));\n    console.log("Moved task ID " + id + " to " + targetCol);\n  };\n\n  const renderColumn = (colName, colTitle) => {\n    const colTasks = tasks.filter(t => t.column === colName);\n    return (\n      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex-1 flex flex-col min-h-[300px]">\n        <div className="flex justify-between items-center mb-4">\n          <h3 className="font-extrabold text-xs tracking-wide uppercase text-slate-400">{colTitle}</h3>\n          <span className="px-2 py-0.5 bg-slate-800 text-[10px] font-extrabold rounded-full text-slate-400">\n            {colTasks.length}\n          </span>\n        </div>\n        <div className="space-y-3 flex-1 overflow-y-auto custom-scroll">\n          {colTasks.map(task => (\n            <div key={task.id} className="bg-slate-800 border border-slate-700/60 p-3.5 rounded-xl flex flex-col gap-2 group transition-all hover:border-slate-500">\n              <p className="text-xs text-slate-200 font-semibold leading-relaxed">{task.text}</p>\n              <div className="flex justify-between items-center border-t border-slate-700/40 pt-2 mt-1">\n                <div className="flex gap-2">\n                  {colName !== \'todo\' && (\n                    <button onClick={() => moveTask(task.id, colName === \'done\' ? \'in_progress\' : \'todo\')} className="text-[10px] font-bold text-indigo-400 hover:underline">← Back</button>\n                  )}\n                  {colName !== \'done\' && (\n                    <button onClick={() => moveTask(task.id, colName === \'todo\' ? \'in_progress\' : \'done\')} className="text-[10px] font-bold text-emerald-400 hover:underline">Move →</button>\n                  )}\n                </div>\n                <button onClick={() => deleteTask(task.id)} className="text-[10px] font-bold text-rose-500 hover:underline opacity-0 group-hover:opacity-100 transition-opacity">Delete</button>\n              </div>\n            </div>\n          ))}\n          {colTasks.length === 0 && (\n            <div className="h-full flex items-center justify-center border border-dashed border-slate-800 rounded-xl p-4">\n              <span className="text-[10px] text-slate-500 italic">No tasks</span>\n            </div>\n          )}\n        </div>\n      </div>\n    );\n  };\n\n  return (\n    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 font-sans">\n      <div className="max-w-4xl mx-auto">\n        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">\n          <div>\n            <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">React Kanban Board</h1>\n            <p className="text-xs text-slate-500 mt-1">Manage project tasks interactively in-browser.</p>\n          </div>\n          \n          <div className="flex gap-2">\n            <input \n              type="text" \n              placeholder="New task..."\n              value={inputVal}\n              onChange={(e) => setInputVal(e.target.value)}\n              onKeyDown={(e) => e.key === \'Enter\' && addTask()}\n              className="bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-indigo-500 text-slate-200"\n            />\n            <button onClick={addTask} className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl text-xs shadow-lg shadow-indigo-500/20 transition-all">Add</button>\n          </div>\n        </div>\n\n        <div className="flex flex-col md:flex-row gap-4">\n          {renderColumn(\'todo\', \'To Do\')}\n          {renderColumn(\'in_progress\', \'In Progress\')}\n          {renderColumn(\'done\', \'Completed\')}\n        </div>\n      </div>\n    </div>\n  );\n}\n\nconst root = ReactDOM.createRoot(document.getElementById("root"));\nroot.render(<KanbanBoard />);'
  },
  vue: {
    html: '<div id="app"></div>\n\n<!-- Vue 3 CDN -->\n<script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>\n<!-- Tailwind CSS runtime CDN -->\n<script src="https://cdn.tailwindcss.com"></script>\n<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800&display=swap" rel="stylesheet">\n<script>\n  tailwind.config = {\n    theme: {\n      extend: {\n        fontFamily: {\n          sans: [\'Outfit\', \'sans-serif\'],\n        }\n      }\n    }\n  }\n</script>',
    css: '/* Custom Vue transition animations */',
    js: 'const { createApp, ref, computed } = Vue;\n\nconst App = {\n  template: `\n    <div class="min-h-screen bg-slate-950 text-slate-100 p-6 font-sans flex items-center justify-center">\n      <div class="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">\n        <div class="flex justify-between items-start mb-6">\n          <div>\n            <h1 class="text-xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">Crypto Portfolio</h1>\n            <p class="text-[10px] text-slate-500 mt-0.5">Vue 3 dynamic state & computed properties</p>\n          </div>\n          <div class="text-right">\n            <div class="text-xs text-slate-400 uppercase font-bold tracking-wider">Total Value</div>\n            <div class="text-xl font-black text-white">$ {{ formatPrice(totalValue) }}</div>\n          </div>\n        </div>\n\n        <div class="mb-5">\n          <input \n            v-model="search"\n            type="text" \n            placeholder="Search coin..."\n            class="w-full bg-slate-850 border border-slate-800 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-emerald-500 text-slate-200"\n          />\n        </div>\n\n        <div class="space-y-3 mb-6">\n          <div v-for="coin in filteredCoins" :key="coin.id" class="bg-slate-850 border border-slate-800 p-3.5 rounded-xl flex items-center justify-between transition-all hover:border-slate-700">\n            <div>\n              <div class="flex items-center gap-2">\n                <span class="text-xs font-black text-white">{{ coin.symbol }}</span>\n                <span class="text-[10px] text-slate-505 font-bold uppercase">{{ coin.name }}</span>\n              </div>\n              <div class="text-[10px] text-slate-400 font-medium mt-1">Holding: {{ coin.holdings }}</div>\n            </div>\n            <div class="text-right">\n              <div class="text-xs font-bold text-white">$ {{ formatPrice(coin.price) }}</div>\n              <button \n                @click="buyCoin(coin.id)" \n                class="mt-1 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-white font-bold rounded-lg text-[9px] uppercase tracking-wider transition-all"\n              >\n                + Buy 0.1\n              </button>\n            </div>\n          </div>\n          <div v-if="filteredCoins.length === 0" class="text-center py-4 text-slate-500 text-xs italic">No matching coins</div>\n        </div>\n\n        <div class="text-[10px] text-slate-500 leading-relaxed border-t border-slate-800/60 pt-4 text-center">\n          Click "+ Buy" to add holdings. Total value is computed reactively.\n        </div>\n      </div>\n    </div>\n  `,\n  setup() {\n    const search = ref(\'\');\n    const coins = ref([\n      { id: \'btc\', name: \'Bitcoin\', symbol: \'BTC\', price: 68250, holdings: 0.15 },\n      { id: \'eth\', name: \'Ethereum\', symbol: \'ETH\', price: 3450, holdings: 1.2 },\n      { id: \'sol\', name: \'Solana\', symbol: \'SOL\', price: 142, holdings: 8.5 },\n      { id: \'ada\', name: \'Cardano\', symbol: \'ADA\', price: 0.45, holdings: 500 }\n    ]);\n\n    const filteredCoins = computed(() => {\n      if (!search.value.trim()) return coins.value;\n      return coins.value.filter(c => \n        c.name.toLowerCase().includes(search.value.toLowerCase()) || \n        c.symbol.toLowerCase().includes(search.value.toLowerCase())\n      );\n    });\n\n    const totalValue = computed(() => {\n      return coins.value.reduce((acc, c) => acc + (c.price * c.holdings), 0);\n    });\n\n    const buyCoin = (id) => {\n      const coin = coins.value.find(c => c.id === id);\n      if (coin) {\n        coin.holdings = parseFloat((coin.holdings + 0.1).toFixed(4));\n        console.log("Bought 0.1 " + coin.symbol + ". New holdings: " + coin.holdings);\n      }\n    };\n\n    const formatPrice = (val) => {\n      return val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });\n    };\n\n    return { search, filteredCoins, totalValue, buyCoin, formatPrice };\n  }\n};\n\ncreateApp(App).mount(\'#app\');\nconsole.log("Vue Crypto Portfolio Tracker mounted successfully!");'
  }
};

const WebDevSandbox = ({ isDark }: { isDark: boolean }) => {
  const [htmlCode, setHtmlCode] = useState(() => localStorage.getItem('webdev_html') || TEMPLATES.blank.html);
  const [cssCode, setCssCode] = useState(() => localStorage.getItem('webdev_css') || TEMPLATES.blank.css);
  const [jsCode, setJsCode] = useState(() => localStorage.getItem('webdev_js') || TEMPLATES.blank.js);
  
  const [activeFile, setActiveFile] = useState<'html' | 'css' | 'js'>('html');
  const [searchQuery, setSearchQuery] = useState('');
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);
  const [consoleLogs, setConsoleLogs] = useState<Array<{ level: 'log' | 'warn' | 'error' | 'info'; text: string; timestamp: string }>>([]);
  const [isPreviewFullScreen, setIsPreviewFullScreen] = useState(false);
  const [iframeSrcDoc, setIframeSrcDoc] = useState('');
  const [layout, setLayout] = useState<'vertical' | 'horizontal'>('vertical');
  const [externalCDNs, setExternalCDNs] = useState<{ css: string[]; js: string[] }>(() => {
    const saved = localStorage.getItem('webdev_cdns');
    return saved ? JSON.parse(saved) : { css: [], js: [] };
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [cdnInput, setCdnInput] = useState({ css: '', js: '' });
  const [consoleFilter, setConsoleFilter] = useState<'all' | 'error' | 'warn' | 'info'>('all');
  
  const [previewWidth, setPreviewWidth] = useState(550);
  const [previewHeight, setPreviewHeight] = useState(380);
  const [isResizing, setIsResizing] = useState(false);
  const workspaceRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    title: string;
    message: string;
    type: 'warning' | 'danger' | 'info';
    confirmText: string;
    cancelText: string;
    onConfirm: () => void;
  }>({
    open: false,
    title: '',
    message: '',
    type: 'warning',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    onConfirm: () => {},
  });

  const [sandboxTheme, setSandboxTheme] = useState<'dark' | 'light'>(() => {
    return isDark ? 'dark' : 'light';
  });

  // Debounced live preview compiler
  useEffect(() => {
    const handler = setTimeout(() => {
      // Is React? Look for React scripts in HTML to append type="text/babel"
      const isReactTemplate = htmlCode.includes('babel.min.js') || htmlCode.includes('react.development.js');
      const scriptTagType = isReactTemplate ? 'type="text/babel"' : 'type="text/javascript"';

      const cssCDNtags = externalCDNs.css.map(url => `<link rel="stylesheet" href="${url}">`).join('\n');
      const jsCDNtags = externalCDNs.js.map(url => `<script src="${url}"></script>`).join('\n');

      const compiled = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          ${cssCDNtags}
          <style>
            ${cssCode}
          </style>
        </head>
        <body>
          ${htmlCode}
          ${jsCDNtags}
          <script>
            // Capture client logs with levels
            (function() {
              const _log = console.log;
              const _warn = console.warn;
              const _error = console.error;
              const _info = console.info;

              function formatArg(arg) {
                if (arg === null) return "null";
                if (arg === undefined) return "undefined";
                if (typeof arg === "object") {
                  try {
                    return JSON.stringify(arg, null, 2);
                  } catch (e) {
                    return "[Circular Object]";
                  }
                }
                return String(arg);
              }

              console.log = function(...args) {
                _log.apply(console, args);
                window.parent.postMessage({ type: 'CONSOLE_MSG', level: 'log', data: args.map(formatArg).join(' ') }, '*');
              };
              console.warn = function(...args) {
                _warn.apply(console, args);
                window.parent.postMessage({ type: 'CONSOLE_MSG', level: 'warn', data: args.map(formatArg).join(' ') }, '*');
              };
              console.error = function(...args) {
                _error.apply(console, args);
                window.parent.postMessage({ type: 'CONSOLE_MSG', level: 'error', data: args.map(formatArg).join(' ') }, '*');
              };
              console.info = function(...args) {
                _info.apply(console, args);
                window.parent.postMessage({ type: 'CONSOLE_MSG', level: 'info', data: args.map(formatArg).join(' ') }, '*');
              };
            })();
          </script>
          <script ${scriptTagType}>
            try {
              ${jsCode}
            } catch (e) {
              console.error(e.message);
            }
          </script>
        </body>
        </html>
      `;
      setIframeSrcDoc(compiled);
    }, 500);

    return () => clearTimeout(handler);
  }, [htmlCode, cssCode, jsCode, externalCDNs]);

  // Persist code & CDNs in localStorage
  useEffect(() => {
    localStorage.setItem('webdev_html', htmlCode);
    localStorage.setItem('webdev_css', cssCode);
    localStorage.setItem('webdev_js', jsCode);
  }, [htmlCode, cssCode, jsCode]);

  useEffect(() => {
    localStorage.setItem('webdev_cdns', JSON.stringify(externalCDNs));
  }, [externalCDNs]);

  // Listen to message logs from the sandbox iframe
  useEffect(() => {
    const handleIframeMessage = (e: MessageEvent) => {
      if (e.data && e.data.type === 'CONSOLE_MSG') {
        const newLog = {
          level: e.data.level || 'log',
          text: e.data.data,
          timestamp: new Date().toLocaleTimeString()
        };
        setConsoleLogs(prev => [...prev.slice(-99), newLog]);
      } else if (e.data && e.data.type === 'CONSOLE_LOG') {
        // Fallback compatibility
        const newLog = {
          level: 'log',
          text: e.data.data,
          timestamp: new Date().toLocaleTimeString()
        };
        setConsoleLogs(prev => [...prev.slice(-99), newLog]);
      }
    };
    window.addEventListener('message', handleIframeMessage);
    return () => window.removeEventListener('message', handleIframeMessage);
  }, []);

  // Update iframe srcdoc directly on DOM node to prevent React prop re-writes and reloads during state re-renders
  useEffect(() => {
    if (iframeRef.current) {
      iframeRef.current.srcdoc = iframeSrcDoc;
    }
  }, [iframeSrcDoc]);

  const startResize = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!workspaceRef.current) return;
      const rect = workspaceRef.current.getBoundingClientRect();
      
      if (layout === 'vertical') {
        const newWidth = rect.right - e.clientX;
        if (newWidth > 150 && newWidth < rect.width - 150) {
          setPreviewWidth(newWidth);
        }
      } else {
        const newHeight = rect.bottom - e.clientY;
        if (newHeight > 100 && newHeight < rect.height - 100) {
          setPreviewHeight(newHeight);
        }
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, layout]);

  const handleTemplateLoad = (templateKey: keyof typeof TEMPLATES) => {
    setConfirmModal({
      open: true,
      title: 'Load Template',
      message: 'Are you sure you want to load this template? This will replace your current sandbox code.',
      type: 'warning',
      confirmText: 'Load Template',
      cancelText: 'Cancel',
      onConfirm: () => {
        setHtmlCode(TEMPLATES[templateKey].html);
        setCssCode(TEMPLATES[templateKey].css);
        setJsCode(TEMPLATES[templateKey].js);
        setConsoleLogs([]);
        setConfirmModal(prev => ({ ...prev, open: false }));
      }
    });
  };

  const handleExportZip = async () => {
    try {
      setConsoleLogs(prev => [...prev, { level: 'info', text: 'Initializing export, loading compiler tools...', timestamp: new Date().toLocaleTimeString() }]);
      
      // Load JSZip dynamically
      const jszip: any = await new Promise((resolve, reject) => {
        if ((window as any).JSZip) {
          resolve((window as any).JSZip);
          return;
        }
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
        script.async = true;
        script.onload = () => resolve((window as any).JSZip);
        script.onerror = () => reject(new Error('Failed to load zip compiler tool. Please check your internet connection.'));
        document.body.appendChild(script);
      });

      const zip = new jszip();
      zip.file('index.html', htmlCode);
      zip.file('style.css', cssCode);
      zip.file('script.js', jsCode);
      
      // Add README
      zip.file('README.md', `# Web Dev Sandbox Export\n\nGenerated automatically from AcadMix WebDev Sandbox.\n\n### How to Run Locally\n1. Extract the zip archive.\n2. Open \`index.html\` directly in any browser.`);

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = `acadmix_webdev_${Date.now()}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setConsoleLogs(prev => [...prev, { level: 'info', text: 'Project exported and downloaded successfully!', timestamp: new Date().toLocaleTimeString() }]);
    } catch (err: any) {
      console.error(err.message);
      setConsoleLogs(prev => [...prev, { level: 'error', text: `Export failed: ${err.message}`, timestamp: new Date().toLocaleTimeString() }]);
    }
  };

  const getCodeForActiveFile = () => {
    if (activeFile === 'html') return htmlCode;
    if (activeFile === 'css') return cssCode;
    return jsCode;
  };

  const setCodeForActiveFile = (val: string | undefined) => {
    const value = val || '';
    if (activeFile === 'html') setHtmlCode(value);
    else if (activeFile === 'css') setCssCode(value);
    else setJsCode(value);
  };

  const files = [
    { key: 'html', name: 'index.html', icon: <Code size={14} className="text-orange-500 shrink-0" /> },
    { key: 'css', name: 'style.css', icon: <Palette size={14} className="text-blue-500 shrink-0" /> },
    { key: 'js', name: 'script.js', icon: <FileCode size={14} className="text-yellow-500 shrink-0" /> }
  ];

  const filteredFiles = files.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredLogs = consoleLogs.filter(log => {
    if (consoleFilter === 'all') return true;
    return log.level === consoleFilter;
  });

  return (
    <div className={`flex-1 flex flex-col overflow-hidden min-h-0 h-full transition-colors ${
      sandboxTheme === 'dark' ? 'bg-[#0B0F19] text-slate-100' : 'bg-[#F9FAFB] text-slate-900'
    }`}>
      {/* Sandbox Header / Info Panel */}
      <div className={`px-4 py-2.5 flex items-center justify-between shrink-0 border-b transition-colors ${
        sandboxTheme === 'dark' ? 'bg-[#0B0F19] border-[#1F2937]/80' : 'bg-white border-slate-250/70 shadow-sm'
      }`}>
        <div className="flex items-center gap-2">
          <Globe size={18} className="text-teal-400 shrink-0" />
          <span className="font-extrabold text-sm tracking-wider uppercase">Web Development Sandbox</span>
          <span className="px-2 py-0.5 bg-teal-500/10 text-teal-400 rounded-full text-[10px] font-bold border border-teal-500/20">LIVE</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Layout Switcher */}
          <div className={`flex rounded-lg overflow-hidden border ${
            sandboxTheme === 'dark' ? 'border-slate-800 bg-slate-900' : 'border-slate-250 bg-slate-100'
          }`}>
            <button 
              onClick={() => setLayout('vertical')}
              className={`p-1.5 transition-all ${
                layout === 'vertical'
                  ? (sandboxTheme === 'dark' ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-600 shadow-sm')
                  : (sandboxTheme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-550 hover:text-slate-900')
              }`}
              title="Side-by-Side Split Layout"
            >
              <Columns size={13} weight="bold" />
            </button>
            <button 
              onClick={() => setLayout('horizontal')}
              className={`p-1.5 transition-all ${
                layout === 'horizontal'
                  ? (sandboxTheme === 'dark' ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-600 shadow-sm')
                  : (sandboxTheme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-550 hover:text-slate-900')
              }`}
              title="Top-and-Bottom Split Layout"
            >
              <Rows size={13} weight="bold" />
            </button>
          </div>

          {/* CDN Settings Trigger */}
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className={`p-1.5 rounded-lg border transition-all ${
              sandboxTheme === 'dark' 
                ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800' 
                : 'bg-white border-slate-250 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
            title="External CDN Libraries"
          >
            <Gear size={14} weight="bold" />
          </button>

          {/* Theme Switcher Button */}
          <button
            onClick={() => setSandboxTheme(prev => prev === 'dark' ? 'light' : 'dark')}
            className={`p-1.5 rounded-lg border transition-all ${
              sandboxTheme === 'dark'
                ? 'bg-slate-900 border-slate-800 text-amber-400 hover:text-amber-300'
                : 'bg-slate-100 border-slate-250 text-indigo-600 hover:text-indigo-700 hover:bg-slate-200/50'
            }`}
            title={sandboxTheme === 'dark' ? "Switch to Light Theme" : "Switch to Dark Theme"}
          >
            {sandboxTheme === 'dark' ? <Sun size={14} weight="bold" /> : <Moon size={14} weight="bold" />}
          </button>
          
          {/* Export Zip Button */}
          <button 
            onClick={handleExportZip}
            className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-lg border transition-all ${
              sandboxTheme === 'dark' 
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white border-transparent shadow-lg shadow-indigo-600/10' 
                : 'bg-indigo-600 hover:bg-indigo-700 text-white border-transparent shadow-lg shadow-indigo-600/10'
            }`}
            title="Export project files to local ZIP archive"
          >
            <DownloadSimple size={14} weight="bold" /> Export Zip
          </button>

          {/* Clear All Button */}
          <button 
            onClick={() => {
              setConfirmModal({
                open: true,
                title: 'Nuke Code',
                message: 'Are you sure you want to nuke all code and reset to a blank slate?',
                type: 'danger',
                confirmText: 'Yes, Clear All',
                cancelText: 'Cancel',
                onConfirm: () => {
                  setHtmlCode(TEMPLATES.blank.html);
                  setCssCode(TEMPLATES.blank.css);
                  setJsCode(TEMPLATES.blank.js);
                  setConsoleLogs([]);
                  setConfirmModal(prev => ({ ...prev, open: false }));
                }
              });
            }} 
            className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-lg transition-all border ${
              sandboxTheme === 'dark' 
                ? 'text-slate-400 hover:text-rose-400 bg-slate-900 border-slate-800' 
                : 'text-slate-600 hover:text-rose-600 bg-white border-slate-250 hover:bg-slate-50'
            }`}
          >
            <Trash size={14} /> Clear All
          </button>
        </div>
      </div>

      {/* Main Workspace Area */}
      <div className="flex-1 flex min-h-0 relative">
        {/* Left Side: Mock File Explorer & Templates */}
        <div className={`w-64 flex flex-col shrink-0 border-r transition-colors ${
          sandboxTheme === 'dark' ? 'bg-[#111827]/90 border-[#1F2937]/85' : 'bg-slate-50 border-slate-250/70'
        }`}>
          <div className={`p-3 flex items-center justify-between shrink-0 border-b ${
            sandboxTheme === 'dark' ? 'border-[#1F2937]/85' : 'border-slate-250/70'
          }`}>
            <span className={`text-[10px] font-extrabold tracking-widest uppercase ${
              sandboxTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'
            }`}>Files</span>
            <div className="flex gap-1.5">
              <button className={`p-1 rounded transition-colors ${sandboxTheme === 'dark' ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-550 hover:text-slate-900 hover:bg-slate-200/50'}`} title="Add File (Mock)"><Plus size={14} /></button>
              <button className={`p-1 rounded transition-colors ${sandboxTheme === 'dark' ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-550 hover:text-slate-900 hover:bg-slate-200/50'}`} title="Upload File (Mock)"><UploadSimple size={14} /></button>
            </div>
          </div>

          {/* File Search */}
          <div className={`p-2 border-b shrink-0 relative ${
            sandboxTheme === 'dark' ? 'border-[#1F2937]/85' : 'border-slate-250/70'
          }`}>
            <input 
              type="text" 
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border focus:outline-none focus:border-indigo-500 transition-colors ${
                sandboxTheme === 'dark' 
                  ? 'bg-slate-900 text-slate-350 border-slate-800' 
                  : 'bg-white text-slate-800 border-slate-250 shadow-sm'
              }`}
            />
            <MagnifyingGlass size={12} className="absolute left-4.5 top-1/2 -translate-y-1/2 text-slate-500" />
          </div>

          {/* File Tree List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-0.5 custom-scrollbar min-h-0">
            {filteredFiles.map(file => (
              <button 
                key={file.key}
                onClick={() => setActiveFile(file.key as any)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold transition-all border ${
                  activeFile === file.key 
                    ? (sandboxTheme === 'dark' 
                        ? 'bg-slate-800 text-white border-slate-700' 
                        : 'bg-white text-slate-900 border-slate-250 shadow-sm')
                    : (sandboxTheme === 'dark'
                        ? 'text-slate-400 hover:bg-slate-900/60 hover:text-slate-200 border-transparent'
                        : 'text-slate-600 hover:bg-slate-200/50 hover:text-slate-900 border-transparent')
                }`}
              >
                {file.icon}
                <span className="flex-1 text-left">{file.name}</span>
              </button>
            ))}
          </div>

          {/* Templates Section */}
          <div className={`p-3 border-t shrink-0 ${
            sandboxTheme === 'dark' ? 'border-[#1F2937]/85' : 'border-slate-250/70'
          }`}>
            <span className={`text-[10px] font-extrabold tracking-widest uppercase block mb-3 ${
              sandboxTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'
            }`}>Templates</span>
            <div className="space-y-2">
              <button 
                onClick={() => handleTemplateLoad('blank')}
                className={`w-full text-left p-2.5 rounded-xl border transition-all ${
                  sandboxTheme === 'dark'
                    ? 'border-slate-850 hover:border-slate-700 bg-slate-900/40 hover:bg-slate-900'
                    : 'border-slate-200 hover:border-slate-350 bg-white hover:bg-slate-50'
                }`}
              >
                <div className={`text-xs font-bold ${sandboxTheme === 'dark' ? 'text-slate-200' : 'text-slate-850'}`}>Blank Slate</div>
                <div className={`text-[10px] mt-0.5 ${sandboxTheme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>Empty HTML / CSS starter</div>
              </button>
              <button 
                onClick={() => handleTemplateLoad('animation')}
                className={`w-full text-left p-2.5 rounded-xl border transition-all ${
                  sandboxTheme === 'dark'
                    ? 'border-slate-850 hover:border-slate-700 bg-slate-900/40 hover:bg-slate-900'
                    : 'border-slate-200 hover:border-slate-350 bg-white hover:bg-slate-50'
                }`}
              >
                <div className={`text-xs font-bold ${sandboxTheme === 'dark' ? 'text-slate-200' : 'text-slate-850'}`}>Neon Glow Dashboard</div>
                <div className={`text-[10px] mt-0.5 ${sandboxTheme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>Dynamic border animation & flat design</div>
              </button>
              <button 
                onClick={() => handleTemplateLoad('react')}
                className={`w-full text-left p-2.5 rounded-xl border transition-all ${
                  sandboxTheme === 'dark'
                    ? 'border-slate-850 hover:border-slate-700 bg-slate-900/40 hover:bg-slate-900'
                    : 'border-slate-200 hover:border-slate-350 bg-white hover:bg-slate-50'
                }`}
              >
                <div className={`text-xs font-bold ${sandboxTheme === 'dark' ? 'text-slate-200' : 'text-slate-850'}`}>React + Tailwind</div>
                <div className={`text-[10px] mt-0.5 ${sandboxTheme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>Interactive React Counter</div>
              </button>
              <button 
                onClick={() => handleTemplateLoad('vue')}
                className={`w-full text-left p-2.5 rounded-xl border transition-all ${
                  sandboxTheme === 'dark'
                    ? 'border-slate-850 hover:border-slate-700 bg-slate-900/40 hover:bg-slate-900'
                    : 'border-slate-200 hover:border-slate-350 bg-white hover:bg-slate-50'
                }`}
              >
                <div className={`text-xs font-bold ${sandboxTheme === 'dark' ? 'text-slate-200' : 'text-slate-850'}`}>Vue 3 App</div>
                <div className={`text-[10px] mt-0.5 ${sandboxTheme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>Interactive Vue 3 Template</div>
              </button>
            </div>
          </div>
        </div>

        {/* Workspace Panels Container (Editor + Preview) */}
        <div 
          ref={workspaceRef}
          className={`flex-1 flex min-h-0 ${
            layout === 'vertical' ? 'flex-row' : 'flex-col'
          } ${isResizing ? (layout === 'vertical' ? 'cursor-col-resize select-none' : 'cursor-row-resize select-none') : ''}`}
        >
          {/* Center: Monaco Editor Panel */}
          <div className={`flex-1 flex flex-col min-h-0 min-w-0 border-r transition-colors ${
            sandboxTheme === 'dark' ? 'bg-slate-950 border-[#1F2937]/85' : 'bg-[#f3f4f6] border-slate-250/70'
          }`}>
          {/* File Tabs */}
          <div className={`flex items-center justify-between border-b shrink-0 px-2.5 transition-colors ${
            sandboxTheme === 'dark' ? 'border-[#1F2937]/85 bg-[#0B0F19]' : 'border-slate-250/70 bg-slate-100/70'
          }`}>
            <div className="flex gap-1 overflow-x-auto py-1.5">
              {files.map(file => (
                <button
                  key={file.key}
                  onClick={() => setActiveFile(file.key as any)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                    activeFile === file.key 
                      ? (sandboxTheme === 'dark' 
                          ? 'bg-slate-900 text-white border-slate-700 shadow-inner' 
                          : 'bg-white text-slate-900 border-slate-250 shadow-sm')
                      : (sandboxTheme === 'dark'
                          ? 'bg-transparent text-slate-500 border-transparent hover:text-slate-350'
                          : 'bg-transparent text-slate-500 border-transparent hover:text-slate-800 hover:bg-slate-200/30')
                  }`}
                >
                  {file.icon}
                  {file.name}
                </button>
              ))}
            </div>
            
            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold shrink-0 pr-1.5">
              <Sparkle size={10} className="text-teal-400 shrink-0 animate-pulse" />
              <span>Autosaved</span>
            </div>
          </div>

          {/* Monaco Editor Container */}
          <div className="flex-1 min-h-0 relative">
            <Editor
              height="100%"
              theme={sandboxTheme === 'dark' ? 'vs-dark' : 'light'}
              language={activeFile === 'html' ? 'html' : activeFile === 'css' ? 'css' : 'javascript'}
              value={getCodeForActiveFile()}
              onChange={setCodeForActiveFile}
              loading={<div className="p-4 text-xs font-bold text-slate-400">Loading editor assets...</div>}
              options={{
                fontSize: 14,
                fontFamily: "'Fira Code', 'Cascadia Code', Consolas, monospace",
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                lineNumbers: "on",
                cursorBlinking: "smooth",
                smoothScrolling: true,
                padding: { top: 12 },
                automaticLayout: true
              }}
            />
          </div>
        </div>

        {/* Vertical Dragger Bar */}
        {layout === 'vertical' && !isPreviewFullScreen && (
          <div 
            onMouseDown={startResize}
            className={`w-3 shrink-0 flex flex-col justify-center items-center cursor-col-resize group z-20 self-stretch transition-colors ${
              sandboxTheme === 'dark' ? 'bg-[#0B0F19]' : 'bg-[#F9FAFB]'
            }`}
            title="Drag horizontally to resize panels"
          >
            <div className={`h-16 w-1 rounded-full transition-colors ${
              isResizing 
                ? 'bg-indigo-500' 
                : (sandboxTheme === 'dark' ? 'bg-slate-800 group-hover:bg-indigo-400' : 'bg-slate-200 group-hover:bg-indigo-500')
            }`} />
          </div>
        )}

        {/* Horizontal Dragger Bar */}
        {layout === 'horizontal' && !isPreviewFullScreen && (
          <div 
            onMouseDown={startResize}
            className={`h-3 shrink-0 flex flex-row justify-center items-center cursor-row-resize group z-20 w-full transition-colors ${
              sandboxTheme === 'dark' ? 'bg-[#0B0F19]' : 'bg-[#F9FAFB]'
            }`}
            title="Drag vertically to resize panels"
          >
            <div className={`w-16 h-1 rounded-full transition-colors ${
              isResizing 
                ? 'bg-indigo-500' 
                : (sandboxTheme === 'dark' ? 'bg-slate-800 group-hover:bg-indigo-400' : 'bg-slate-200 group-hover:bg-indigo-500')
            }`} />
          </div>
        )}

        {/* Right Pane: Live Preview Frame & Console */}
        <div 
          style={{
            width: isPreviewFullScreen ? '100vw' : (layout === 'vertical' ? `${previewWidth}px` : undefined),
            height: isPreviewFullScreen ? '100vh' : (layout === 'horizontal' ? `${previewHeight}px` : undefined)
          }}
          className={`flex flex-col shrink-0 min-w-0 min-h-0 ${
            isPreviewFullScreen 
              ? 'fixed inset-0 z-50 w-screen h-screen' 
              : (layout === 'vertical' 
                  ? 'border-l' 
                  : 'border-t')
          } ${
            sandboxTheme === 'dark'
              ? 'border-[#1F2937]/80 bg-[#111827]'
              : 'border-slate-250 bg-white'
          }`}
        >
          {/* Preview Navigation Header */}
          <div className={`border-b px-4 py-2.5 flex items-center justify-between shrink-0 transition-colors ${
            sandboxTheme === 'dark'
              ? 'bg-[#0B0F19] border-[#1F2937]/80'
              : 'bg-slate-100/90 border-slate-200'
          }`}>
            <div className="flex items-center gap-2 flex-1 max-w-[280px]">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
              <div className={`h-6 w-px mx-1 shrink-0 ${sandboxTheme === 'dark' ? 'bg-[#1F2937]' : 'bg-slate-250'}`} />
              <div className={`text-[10px] font-extrabold uppercase tracking-widest truncate ${
                sandboxTheme === 'dark' ? 'text-slate-400' : 'text-slate-550'
              }`}>Preview</div>
            </div>

            {/* Address Bar */}
            <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-lg border text-[10.5px] font-bold max-w-sm truncate flex-1 mx-4 transition-colors ${
              sandboxTheme === 'dark'
                ? 'bg-[#1F2937]/50 border-[#1F2937]/80 text-slate-400'
                : 'bg-white border-slate-250 text-slate-655'
            }`}>
              <Globe size={11} className="text-slate-500 shrink-0" />
              <span>Preview: /</span>
            </div>

            {/* Panel Actions */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button 
                onClick={() => {
                  // Reload iframe
                  if (iframeRef.current) {
                    const src = iframeRef.current.srcdoc;
                    iframeRef.current.srcdoc = '';
                    setTimeout(() => { if (iframeRef.current) iframeRef.current.srcdoc = src; }, 50);
                  }
                  setConsoleLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Reloading Preview...`]);
                }} 
                className={`p-1.5 rounded-lg transition-colors ${
                  sandboxTheme === 'dark'
                    ? 'hover:bg-slate-800 text-slate-400 hover:text-white'
                    : 'hover:bg-slate-200 text-slate-550 hover:text-slate-900'
                }`}
                title="Refresh Preview"
              >
                <ArrowCounterClockwise size={14} weight="bold" />
              </button>
              <button 
                onClick={() => setIsPreviewFullScreen(!isPreviewFullScreen)} 
                className={`p-1.5 rounded-lg transition-colors ${
                  sandboxTheme === 'dark'
                    ? 'hover:bg-slate-800 text-slate-400 hover:text-white'
                    : 'hover:bg-slate-200 text-slate-550 hover:text-slate-900'
                }`}
                title={isPreviewFullScreen ? "Exit Full Screen" : "Full Screen Preview"}
              >
                {isPreviewFullScreen ? <CornersIn size={14} weight="bold" /> : <CornersOut size={14} weight="bold" />}
              </button>
            </div>
          </div>

          {/* Iframe View */}
          <div className="flex-1 bg-white relative min-h-0">
            <iframe 
              ref={iframeRef}
              title="Live Sandboxed Preview"
              className={`w-full h-full border-0 bg-white ${isResizing ? 'pointer-events-none' : ''}`}
              sandbox="allow-scripts allow-modals allow-same-origin allow-forms"
            />
          </div>

          {/* Console / Build Output Bar */}
          <div className={`flex flex-col shrink-0 min-h-[40px] max-h-[220px] transition-colors border-t ${
            sandboxTheme === 'dark'
              ? 'bg-[#0B0F19] border-[#1F2937]/80'
              : 'bg-slate-100/90 border-slate-200'
          }`}>
            <button 
              onClick={() => setIsConsoleOpen(!isConsoleOpen)}
              className={`px-4 py-2.5 flex items-center justify-between transition-colors w-full text-left ${
                sandboxTheme === 'dark' ? 'hover:bg-[#1F2937]/45' : 'hover:bg-slate-200/40'
              }`}
            >
              <div className="flex items-center gap-2">
                <Terminal size={14} className="text-teal-400 shrink-0" />
                <span className={`text-[10px] font-extrabold uppercase tracking-widest ${
                  sandboxTheme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                }`}>Console Logs</span>
                {consoleLogs.length > 0 && (
                  <span className="px-1.5 py-0.5 bg-indigo-500 text-white text-[9px] font-extrabold rounded-full">{consoleLogs.length}</span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className={`text-[10px] font-bold ${sandboxTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Build Success</span>
              </div>
            </button>

            {/* Console Log Panel */}
            {isConsoleOpen && (
              <div className={`flex flex-col flex-1 min-h-[160px] max-h-[220px] border-t overflow-hidden ${
                sandboxTheme === 'dark'
                  ? 'bg-[#0c1017] border-[#1F2937]/80'
                  : 'bg-slate-50 border-slate-200'
              }`}>
                {/* Console Actions / Filter Header */}
                <div className={`flex items-center justify-between px-3 py-1.5 shrink-0 border-b ${
                  sandboxTheme === 'dark'
                    ? 'bg-slate-950 border-[#1F2937]/50'
                    : 'bg-slate-100 border-slate-250/60'
                }`}>
                  <div className="flex items-center gap-3">
                    <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500">Captured Output</span>
                    {/* Log Filter Selector */}
                    <div className="flex gap-1">
                      {(['all', 'error', 'warn', 'info'] as const).map(lvl => (
                        <button
                          key={lvl}
                          onClick={(e) => { e.stopPropagation(); setConsoleFilter(lvl); }}
                          className={`text-[8px] px-1.5 py-0.5 rounded font-extrabold uppercase tracking-wide transition-all ${
                            consoleFilter === lvl
                              ? 'bg-indigo-600 text-white'
                              : (sandboxTheme === 'dark' 
                                  ? 'text-slate-450 hover:bg-slate-900 hover:text-slate-200' 
                                  : 'text-slate-650 hover:bg-slate-200 hover:text-slate-900')
                          }`}
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setConsoleLogs([]); }} 
                    className={`text-[9px] font-bold hover:underline ${
                      sandboxTheme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Clear Logs
                  </button>
                </div>

                {/* Console Log list */}
                <div className="flex-1 p-2 overflow-y-auto custom-scrollbar font-mono text-[10.5px] space-y-1 select-text">
                  {filteredLogs.length === 0 ? (
                    <div className="text-slate-500 italic text-[10px] text-center py-4">
                      {consoleLogs.length === 0 ? "No logs captured yet." : "No logs matching active level."}
                    </div>
                  ) : (
                    filteredLogs.map((log, idx) => {
                      let levelColor = '';
                      let label = '';
                      
                      if (log.level === 'error') {
                        levelColor = sandboxTheme === 'dark' ? 'text-rose-400 bg-rose-950/20 border-rose-900/30' : 'text-rose-700 bg-rose-50 border-rose-200';
                        label = '✕ ';
                      } else if (log.level === 'warn') {
                        levelColor = sandboxTheme === 'dark' ? 'text-amber-400 bg-amber-950/20 border-amber-900/30' : 'text-amber-700 bg-amber-50 border-amber-200';
                        label = '⚠ ';
                      } else if (log.level === 'info') {
                        levelColor = sandboxTheme === 'dark' ? 'text-sky-400 bg-sky-950/20 border-sky-900/30' : 'text-sky-700 bg-sky-50 border-sky-200';
                        label = 'ℹ ';
                      } else {
                        levelColor = sandboxTheme === 'dark' ? 'text-teal-400/90' : 'text-slate-800';
                      }

                      return (
                        <div 
                          key={idx} 
                          className={`px-2 py-1 rounded-lg border border-transparent leading-relaxed break-all flex items-start gap-1 ${levelColor}`}
                        >
                          <span className="text-[9px] font-bold text-slate-500 shrink-0 mt-0.5 select-none">{log.timestamp}</span>
                          <span className="shrink-0 font-bold select-none">{label}</span>
                          <pre className="flex-1 whitespace-pre-wrap font-mono text-[10.5px] leading-relaxed m-0 p-0 select-text">{log.text}</pre>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        </div>
      </div>
      <AlertModal
        open={confirmModal.open}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        confirmText={confirmModal.confirmText}
        cancelText={confirmModal.cancelText}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, open: false }))}
      />

      {/* External CDN Manager Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className={`w-full max-w-lg rounded-2xl border p-6 shadow-2xl transition-all ${
            sandboxTheme === 'dark' ? 'bg-[#0f172a] border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex justify-between items-center mb-5 border-b pb-3 border-slate-850/20">
              <h2 className="text-sm font-extrabold tracking-wider uppercase flex items-center gap-2">
                <Gear size={16} className="text-indigo-500 animate-spin-slow" /> External Libraries & CDNs
              </h2>
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="text-xs font-bold text-slate-450 hover:text-indigo-500 transition-colors"
              >
                Close
              </button>
            </div>

            {/* Quick Presets */}
            <div className="mb-5">
              <span className="text-[10px] font-extrabold tracking-widest text-slate-500 uppercase block mb-2">Quick Presets</span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    const url = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css';
                    if (!externalCDNs.css.includes(url)) {
                      setExternalCDNs(prev => ({ ...prev, css: [...prev.css, url] }));
                    }
                  }}
                  className={`text-[9.5px] font-bold px-2.5 py-1.5 rounded-lg border transition-all ${
                    sandboxTheme === 'dark' ? 'bg-slate-900 border-slate-800 text-indigo-400 hover:bg-slate-850' : 'bg-slate-50 border-slate-250 text-indigo-600 hover:bg-slate-100'
                  }`}
                >
                  + FontAwesome CSS
                </button>
                <button
                  onClick={() => {
                    const url = 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css';
                    if (!externalCDNs.css.includes(url)) {
                      setExternalCDNs(prev => ({ ...prev, css: [...prev.css, url] }));
                    }
                  }}
                  className={`text-[9.5px] font-bold px-2.5 py-1.5 rounded-lg border transition-all ${
                    sandboxTheme === 'dark' ? 'bg-slate-900 border-slate-800 text-indigo-400 hover:bg-slate-850' : 'bg-slate-50 border-slate-250 text-indigo-600 hover:bg-slate-100'
                  }`}
                >
                  + Bootstrap 5 CSS
                </button>
                <button
                  onClick={() => {
                    const url = 'https://code.jquery.com/jquery-3.7.1.min.js';
                    if (!externalCDNs.js.includes(url)) {
                      setExternalCDNs(prev => ({ ...prev, js: [...prev.js, url] }));
                    }
                  }}
                  className={`text-[9.5px] font-bold px-2.5 py-1.5 rounded-lg border transition-all ${
                    sandboxTheme === 'dark' ? 'bg-slate-900 border-slate-800 text-indigo-400 hover:bg-slate-850' : 'bg-slate-50 border-slate-250 text-indigo-600 hover:bg-slate-100'
                  }`}
                >
                  + jQuery JS
                </button>
                <button
                  onClick={() => {
                    const url = 'https://cdn.jsdelivr.net/npm/chart.js';
                    if (!externalCDNs.js.includes(url)) {
                      setExternalCDNs(prev => ({ ...prev, js: [...prev.js, url] }));
                    }
                  }}
                  className={`text-[9.5px] font-bold px-2.5 py-1.5 rounded-lg border transition-all ${
                    sandboxTheme === 'dark' ? 'bg-slate-900 border-slate-800 text-indigo-400 hover:bg-slate-850' : 'bg-slate-50 border-slate-250 text-indigo-600 hover:bg-slate-100'
                  }`}
                >
                  + Chart.js JS
                </button>
              </div>
            </div>

            {/* CSS CDNs Section */}
            <div className="mb-4">
              <span className="text-[10px] font-extrabold tracking-widest text-slate-500 uppercase block mb-2">CSS Stylesheets</span>
              <div className="flex gap-2 mb-2">
                <input 
                  type="text" 
                  placeholder="https://cdn.example.com/library.css"
                  value={cdnInput.css}
                  onChange={(e) => setCdnInput(prev => ({ ...prev, css: e.target.value }))}
                  className={`flex-1 text-xs px-3.5 py-2 rounded-xl border focus:outline-none focus:border-indigo-500 transition-colors ${
                    sandboxTheme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-250 text-slate-800'
                  }`}
                />
                <button
                  onClick={() => {
                    if (cdnInput.css.trim()) {
                      setExternalCDNs(prev => ({ ...prev, css: [...prev.css, cdnInput.css.trim()] }));
                      setCdnInput(prev => ({ ...prev, css: '' }));
                    }
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs"
                >
                  Add
                </button>
              </div>
              <div className="max-h-[80px] overflow-y-auto space-y-1.5 custom-scrollbar">
                {externalCDNs.css.map((url, i) => (
                  <div key={i} className="flex justify-between items-center bg-slate-500/5 px-2.5 py-1.5 rounded-lg border border-slate-550/10">
                    <span className="text-[10.5px] truncate font-medium text-slate-400 max-w-[340px]">{url}</span>
                    <button 
                      onClick={() => setExternalCDNs(prev => ({ ...prev, css: prev.css.filter((_, idx) => idx !== i) }))}
                      className="text-[9px] font-bold text-rose-500 hover:underline shrink-0"
                    >
                      Delete
                    </button>
                  </div>
                ))}
                {externalCDNs.css.length === 0 && (
                  <div className="text-[10.5px] text-slate-500 italic">No external styles loaded.</div>
                )}
              </div>
            </div>

            {/* JS CDNs Section */}
            <div className="mb-6">
              <span className="text-[10px] font-extrabold tracking-widest text-slate-500 uppercase block mb-2">JavaScript Scripts</span>
              <div className="flex gap-2 mb-2">
                <input 
                  type="text" 
                  placeholder="https://cdn.example.com/library.js"
                  value={cdnInput.js}
                  onChange={(e) => setCdnInput(prev => ({ ...prev, js: e.target.value }))}
                  className={`flex-1 text-xs px-3.5 py-2 rounded-xl border focus:outline-none focus:border-indigo-500 transition-colors ${
                    sandboxTheme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-250 text-slate-800'
                  }`}
                />
                <button
                  onClick={() => {
                    if (cdnInput.js.trim()) {
                      setExternalCDNs(prev => ({ ...prev, js: [...prev.js, cdnInput.js.trim()] }));
                      setCdnInput(prev => ({ ...prev, js: '' }));
                    }
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs"
                >
                  Add
                </button>
              </div>
              <div className="max-h-[80px] overflow-y-auto space-y-1.5 custom-scrollbar">
                {externalCDNs.js.map((url, i) => (
                  <div key={i} className="flex justify-between items-center bg-slate-500/5 px-2.5 py-1.5 rounded-lg border border-slate-550/10">
                    <span className="text-[10.5px] truncate font-medium text-slate-400 max-w-[340px]">{url}</span>
                    <button 
                      onClick={() => setExternalCDNs(prev => ({ ...prev, js: prev.js.filter((_, idx) => idx !== i) }))}
                      className="text-[9px] font-bold text-rose-500 hover:underline shrink-0"
                    >
                      Delete
                    </button>
                  </div>
                ))}
                {externalCDNs.js.length === 0 && (
                  <div className="text-[10.5px] text-slate-500 italic">No external scripts loaded.</div>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-850/20">
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-lg shadow-indigo-600/10"
              >
                Apply changes & Reload
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WebDevSandbox;
