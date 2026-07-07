import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { 
  Code, Palette, FileCode, ArrowCounterClockwise, 
  CornersOut, CornersIn, Trash, Terminal, Sparkle, 
  UploadSimple, Plus, MagnifyingGlass, Globe, Info
} from '@phosphor-icons/react';
import AlertModal from './AlertModal';

// Pre-defined templates for instant sandbox initialization
const TEMPLATES = {
  blank: {
    html: '<!-- Write your HTML code here -->\n<div class="app">\n  <h1>Hello, World!</h1>\n  <p>Start editing index.html, style.css, and script.js to see live changes.</p>\n</div>',
    css: '/* Write your CSS styling here */\nbody {\n  font-family: system-ui, sans-serif;\n  background: #0f172a;\n  color: #f8fafc;\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  min-h: 100vh;\n  margin: 0;\n}\n\n.app {\n  text-align: center;\n  padding: 2rem;\n  border-radius: 1rem;\n  background: #1e293b;\n  border: 1px solid #334155;\n  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);\n}',
    js: '// Write your JavaScript logic here\nconsole.log("Web Sandbox Ready!");'
  },
  animation: {
    html: '<div class="container">\n  <div class="glow-orb"></div>\n  <div class="card">\n    <h2>Glassmorphism Card</h2>\n    <p>Hover to see the premium card elevation and subtle glow animation.</p>\n  </div>\n</div>',
    css: 'body {\n  margin: 0;\n  background: #090b0f;\n  font-family: "Outfit", sans-serif;\n  min-height: 100vh;\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  overflow: hidden;\n}\n\n.container {\n  position: relative;\n  display: flex;\n  justify-content: center;\n  align-items: center;\n}\n\n.glow-orb {\n  position: absolute;\n  width: 250px;\n  height: 250px;\n  background: linear-gradient(135deg, #6366f1, #a855f7);\n  border-radius: 50%;\n  filter: blur(80px);\n  opacity: 0.6;\n  animation: rotateOrb 10s linear infinite;\n}\n\n.card {\n  backdrop-filter: blur(16px);\n  background: rgba(255, 255, 255, 0.03);\n  border: 1px solid rgba(255, 255, 255, 0.08);\n  border-radius: 24px;\n  padding: 3rem 2rem;\n  max-width: 320px;\n  text-align: center;\n  color: #ffffff;\n  box-shadow: 0 20px 40px rgba(0,0,0,0.5);\n  transition: all 0.3s ease;\n}\n\n.card:hover {\n  transform: translateY(-8px);\n  border-color: rgba(99, 102, 241, 0.4);\n  box-shadow: 0 30px 60px rgba(99, 102, 241, 0.15);\n}\n\n.card h2 {\n  margin: 0 0 1rem 0;\n  font-weight: 800;\n  background: linear-gradient(to right, #a5b4fc, #e879f9);\n  -webkit-background-clip: text;\n  -webkit-text-fill-color: transparent;\n}\n\n.card p {\n  margin: 0;\n  font-size: 0.95rem;\n  line-height: 1.6;\n  color: #94a3b8;\n}\n\n@keyframes rotateOrb {\n  0% { transform: translate(0, 0) scale(1); }\n  50% { transform: translate(20px, -20px) scale(1.1); }\n  100% { transform: translate(0, 0) scale(1); }\n}',
    js: '// Console log to verify initialization\nconsole.log("Glow Animation Template Loaded successfully!");'
  },
  react: {
    html: '<div id="root"></div>\n\n<!-- React and ReactDOM CDNs -->\n<script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script>\n<script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script>\n<script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>\n<!-- Tailwind CSS runtime CDN -->\n<script src="https://cdn.tailwindcss.com"></script>\n<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800&display=swap" rel="stylesheet">\n<script>\n  tailwind.config = {\n    theme: {\n      extend: {\n        fontFamily: {\n          sans: [\'Outfit\', \'sans-serif\'],\n        }\n      }\n    }\n  }\n</script>',
    css: '/* Custom styles */\n.fade-in {\n  animation: fadeIn 0.4s ease-out;\n}\n@keyframes fadeIn {\n  from { opacity: 0; transform: translateY(10px); }\n  to { opacity: 1; transform: translateY(0); }\n}',
    js: 'const { useState } = React;\n\nfunction App() {\n  const [count, setCount] = useState(0);\n  return (\n    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-100 p-4">\n      <div className="max-w-md w-full bg-slate-800/60 backdrop-blur-md rounded-3xl border border-slate-700/50 p-8 shadow-2xl text-center fade-in">\n        <div className="flex justify-center mb-6">\n          <span className="p-4 bg-indigo-500/10 text-indigo-400 rounded-2xl border border-indigo-500/20">\n            <svg className="w-8 h-8 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">\n              <circle cx="12" cy="12" r="10" strokeDasharray="30 30" />\n            </svg>\n          </span>\n        </div>\n        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">\n          React + Tailwind\n        </h1>\n        <p className="text-slate-400 text-sm mt-2 leading-relaxed">\n          A fully reactive stateful Sandbox environment running in-browser. No bundler required!\n        </p>\n        \n        <div className="my-8">\n          <div className="text-5xl font-extrabold text-white transition-all select-none">\n            {count}\n          </div>\n          <div className="text-xs text-slate-500 mt-1">State Count</div>\n        </div>\n\n        <div className="flex gap-3 justify-center">\n          <button \n            onClick={() => setCount(count + 1)}\n            className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 active:scale-95 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition-all text-sm"\n          >\n            Increment\n          </button>\n          <button \n            onClick={() => setCount(0)}\n            className="px-6 py-3 bg-slate-700 hover:bg-slate-600 active:scale-95 text-slate-200 font-bold rounded-xl transition-all text-sm"\n          >\n            Reset\n          </button>\n        </div>\n      </div>\n    </div>\n  );\n}\n\nconst root = ReactDOM.createRoot(document.getElementById("root"));\nroot.render(<App />);\nconsole.log("React app initialized successfully with Tailwind CSS");'
  },
  vue: {
    html: '<div id="app"></div>\n\n<!-- Vue 3 CDN -->\n<script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>\n<!-- Tailwind CSS runtime CDN -->\n<script src="https://cdn.tailwindcss.com"></script>\n<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800&display=swap" rel="stylesheet">\n<script>\n  tailwind.config = {\n    theme: {\n      extend: {\n        fontFamily: {\n          sans: [\'Outfit\', \'sans-serif\'],\n        }\n      }\n    }\n  }\n</script>',
    css: '/* Custom transitions */\n.scale-up {\n  transition: transform 0.2s ease;\n}\n.scale-up:hover {\n  transform: scale(1.02);\n}',
    js: 'const { createApp, ref } = Vue;\n\nconst App = {\n  template: `\n    <div class="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 p-4">\n      <div class="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl text-center scale-up">\n        <div class="flex justify-center mb-6">\n          <span class="p-4 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20">\n            <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">\n              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />\n            </svg>\n          </span>\n        </div>\n        <h1 class="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">\n          Vue 3 Sandbox\n        </h1>\n        <p class="text-slate-400 text-xs mt-2">\n          Vue 3 running natively using templates. Try changing input text to see reactive binding!\n        </p>\n\n        <div class="my-6">\n          <input \n            v-model="name"\n            type="text" \n            placeholder="Enter name"\n            class="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-center text-sm focus:outline-none focus:border-emerald-500 text-slate-200"\n          />\n          <div class="text-base font-bold text-white mt-4 h-6">\n            Hello, {{ name || \'Developer\' }}!\n          </div>\n        </div>\n\n        <button \n          @click="likes++"\n          class="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all text-sm"\n        >\n          👍 {{ likes }} Likes\n        </button>\n      </div>\n    </div>\n  `,\n  setup() {\n    const name = ref(\'\');\n    const likes = ref(0);\n    return { name, likes };\n  }\n};\n\ncreateApp(App).mount(\'#app\');\nconsole.log("Vue 3 App initialized and mounted on #app");'
  }
};

const WebDevSandbox = ({ isDark }: { isDark: boolean }) => {
  const [htmlCode, setHtmlCode] = useState(() => localStorage.getItem('webdev_html') || TEMPLATES.blank.html);
  const [cssCode, setCssCode] = useState(() => localStorage.getItem('webdev_css') || TEMPLATES.blank.css);
  const [jsCode, setJsCode] = useState(() => localStorage.getItem('webdev_js') || TEMPLATES.blank.js);
  
  const [activeFile, setActiveFile] = useState<'html' | 'css' | 'js'>('html');
  const [searchQuery, setSearchQuery] = useState('');
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
  const [isPreviewFullScreen, setIsPreviewFullScreen] = useState(false);
  const [iframeSrcDoc, setIframeSrcDoc] = useState('');
  
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

  // Debounced live preview compiler
  useEffect(() => {
    const handler = setTimeout(() => {
      // Is React? Look for React scripts in HTML to append type="text/babel"
      const isReactTemplate = htmlCode.includes('babel.min.js') || htmlCode.includes('react.development.js');
      const scriptTagType = isReactTemplate ? 'type="text/babel"' : 'type="text/javascript"';

      const compiled = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            ${cssCode}
          </style>
        </head>
        <body>
          ${htmlCode}
          <script>
            // Capture client logs
            (function() {
              const _log = console.log;
              const _error = console.error;
              
              console.log = function(...args) {
                _log.apply(console, args);
                window.parent.postMessage({ type: 'CONSOLE_LOG', data: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ') }, '*');
              };
              
              console.error = function(...args) {
                _error.apply(console, args);
                window.parent.postMessage({ type: 'CONSOLE_LOG', data: 'Error: ' + args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ') }, '*');
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
  }, [htmlCode, cssCode, jsCode]);

  // Persist code in localStorage
  useEffect(() => {
    localStorage.setItem('webdev_html', htmlCode);
    localStorage.setItem('webdev_css', cssCode);
    localStorage.setItem('webdev_js', jsCode);
  }, [htmlCode, cssCode, jsCode]);

  // Listen to message logs from the sandbox iframe
  useEffect(() => {
    const handleIframeMessage = (e: MessageEvent) => {
      if (e.data && e.data.type === 'CONSOLE_LOG') {
        setConsoleLogs(prev => [...prev.slice(-99), `[${new Date().toLocaleTimeString()}] ${e.data.data}`]);
      }
    };
    window.addEventListener('message', handleIframeMessage);
    return () => window.removeEventListener('message', handleIframeMessage);
  }, []);

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

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-900 text-slate-100 min-h-0 h-full">
      {/* Sandbox Header / Info Panel */}
      <div className="bg-slate-950 border-b border-slate-800 px-4 py-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Globe size={18} className="text-teal-400 shrink-0" />
          <span className="font-extrabold text-sm tracking-wider uppercase">Web Development Sandbox</span>
          <span className="px-2 py-0.5 bg-teal-500/10 text-teal-400 rounded-full text-[10px] font-bold border border-teal-500/20">LIVE</span>
        </div>
        <div className="flex items-center gap-2">
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
            className="flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-rose-400 bg-slate-900 border border-slate-800 px-2.5 py-1.5 rounded-lg transition-all"
          >
            <Trash size={14} /> Clear All
          </button>
        </div>
      </div>

      {/* Main Workspace Area */}
      <div className="flex-1 flex min-h-0 relative">
        {/* Left Side: Mock File Explorer & Templates */}
        <div className="w-64 bg-slate-950/70 border-r border-slate-800 flex flex-col shrink-0">
          <div className="p-3 border-b border-slate-800 flex items-center justify-between shrink-0">
            <span className="text-[10px] font-extrabold tracking-widest text-slate-400 uppercase">Files</span>
            <div className="flex gap-1.5">
              <button className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800" title="Add File (Mock)"><Plus size={14} /></button>
              <button className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800" title="Upload File (Mock)"><UploadSimple size={14} /></button>
            </div>
          </div>

          {/* File Search */}
          <div className="p-2 border-b border-slate-800 shrink-0 relative">
            <input 
              type="text" 
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 text-xs text-slate-300 pl-8 pr-3 py-1.5 rounded-lg border border-slate-800 focus:outline-none focus:border-indigo-500"
            />
            <MagnifyingGlass size={12} className="absolute left-4.5 top-1/2 -translate-y-1/2 text-slate-500" />
          </div>

          {/* File Tree List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-0.5 custom-scrollbar min-h-0">
            {filteredFiles.map(file => (
              <button 
                key={file.key}
                onClick={() => setActiveFile(file.key as any)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeFile === file.key 
                    ? 'bg-slate-800 text-white border border-slate-700' 
                    : 'text-slate-400 hover:bg-slate-900/60 hover:text-slate-200'
                }`}
              >
                {file.icon}
                <span className="flex-1 text-left">{file.name}</span>
              </button>
            ))}
          </div>

          {/* Templates Section */}
          <div className="p-3 border-t border-slate-800 shrink-0">
            <span className="text-[10px] font-extrabold tracking-widest text-slate-400 uppercase block mb-3">Templates</span>
            <div className="space-y-2">
              <button 
                onClick={() => handleTemplateLoad('blank')}
                className="w-full text-left p-2.5 rounded-xl border border-slate-850 hover:border-slate-700 bg-slate-900/40 hover:bg-slate-900 transition-all"
              >
                <div className="text-xs font-bold text-slate-200">Blank Slate</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Empty HTML / CSS starter</div>
              </button>
              <button 
                onClick={() => handleTemplateLoad('animation')}
                className="w-full text-left p-2.5 rounded-xl border border-slate-850 hover:border-slate-700 bg-slate-900/40 hover:bg-slate-900 transition-all"
              >
                <div className="text-xs font-bold text-slate-200">Glow Orb Animation</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Custom CSS shadows & keyframes</div>
              </button>
              <button 
                onClick={() => handleTemplateLoad('react')}
                className="w-full text-left p-2.5 rounded-xl border border-slate-850 hover:border-slate-700 bg-slate-900/40 hover:bg-slate-900 transition-all"
              >
                <div className="text-xs font-bold text-slate-200">React + Tailwind</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Interactive React Counter</div>
              </button>
              <button 
                onClick={() => handleTemplateLoad('vue')}
                className="w-full text-left p-2.5 rounded-xl border border-slate-850 hover:border-slate-700 bg-slate-900/40 hover:bg-slate-900 transition-all"
              >
                <div className="text-xs font-bold text-slate-200">Vue 3 App</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Interactive Vue 3 Template</div>
              </button>
            </div>
          </div>
        </div>

        {/* Center: Monaco Editor Panel */}
        <div className="flex-1 flex flex-col min-h-0 bg-slate-950 border-r border-slate-800">
          {/* File Tabs */}
          <div className="flex items-center justify-between border-b border-slate-850 bg-slate-950 shrink-0 px-2.5">
            <div className="flex gap-1 overflow-x-auto py-1.5">
              {files.map(file => (
                <button
                  key={file.key}
                  onClick={() => setActiveFile(file.key as any)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                    activeFile === file.key 
                      ? 'bg-slate-900 text-white border-slate-700 shadow-inner' 
                      : 'bg-transparent text-slate-500 border-transparent hover:text-slate-300'
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
              theme="vs-dark"
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
                padding: { top: 12 }
              }}
            />
          </div>
        </div>

        {/* Right Pane: Live Preview Frame & Console */}
        <div className={`flex flex-col border-slate-800 bg-white shrink-0 transition-all duration-300 ${
          isPreviewFullScreen 
            ? 'fixed inset-0 z-50 w-screen h-screen' 
            : 'w-[480px] lg:w-[600px] border-l'
        }`}>
          {/* Preview Navigation Header */}
          <div className="bg-slate-950 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 flex-1 max-w-[280px]">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
              <div className="h-6 w-px bg-slate-800 mx-1 shrink-0" />
              <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest truncate">Preview</div>
            </div>

            {/* Address Bar */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900 border border-slate-850 text-[10.5px] font-bold text-slate-500 max-w-sm truncate flex-1 mx-4">
              <Globe size={11} className="text-slate-600 shrink-0" />
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
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                title="Refresh Preview"
              >
                <ArrowCounterClockwise size={14} weight="bold" />
              </button>
              <button 
                onClick={() => setIsPreviewFullScreen(!isPreviewFullScreen)} 
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
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
              srcDoc={iframeSrcDoc}
              className="w-full h-full border-0 bg-white"
              sandbox="allow-scripts allow-modals allow-same-origin allow-forms"
            />
          </div>

          {/* Console / Build Output Bar */}
          <div className="bg-slate-950 border-t border-slate-800 flex flex-col shrink-0 min-h-[40px] max-h-[220px]">
            <button 
              onClick={() => setIsConsoleOpen(!isConsoleOpen)}
              className="px-4 py-2.5 flex items-center justify-between hover:bg-slate-900 transition-colors w-full text-left"
            >
              <div className="flex items-center gap-2">
                <Terminal size={14} className="text-teal-400 shrink-0" />
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-300">Console Logs</span>
                {consoleLogs.length > 0 && (
                  <span className="px-1.5 py-0.5 bg-indigo-500 text-white text-[9px] font-extrabold rounded-full">{consoleLogs.length}</span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[10px] font-bold text-slate-400">Build Success</span>
              </div>
            </button>

            {/* Console Log Panel */}
            {isConsoleOpen && (
              <div className="flex flex-col flex-1 min-h-[140px] max-h-[180px] bg-[#0c1017] border-t border-slate-900 overflow-hidden">
                <div className="flex items-center justify-between px-3 py-1 bg-slate-950 shrink-0 border-b border-slate-900">
                  <span className="text-[9px] font-bold text-slate-500">Captured Output</span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setConsoleLogs([]); }} 
                    className="text-[9px] font-bold text-slate-400 hover:text-white hover:underline"
                  >
                    Clear Logs
                  </button>
                </div>
                <div className="flex-1 p-3 overflow-y-auto custom-scrollbar font-mono text-[11px] text-teal-400/90 space-y-1 select-text">
                  {consoleLogs.length === 0 ? (
                    <div className="text-slate-500 italic text-[10px]">No logs captured yet. Try adding console.log() in script.js</div>
                  ) : (
                    consoleLogs.map((log, idx) => (
                      <div key={idx} className="border-b border-slate-900/50 pb-1 last:border-0 leading-relaxed break-all">
                        {log}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
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
    </div>
  );
};

export default WebDevSandbox;
