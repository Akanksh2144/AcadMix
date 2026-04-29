import React, { useState } from 'react';
import { Table as TableIcon, BarChart2, PieChart as PieChartIcon, LineChart as LineChartIcon, Download, Pin, PinOff, Loader2 } from 'lucide-react';
import InsightsTable from './InsightsTable';
import InsightsChart from './InsightsChart';
import * as XLSX from 'xlsx';

export default function InsightsCanvas({ result, onPin, onUnpin }) {
  // result = { data, columns, summary, chart_suggestion, generated_sql }
  const defaultView = result.chart_suggestion ? result.chart_suggestion : 'table';
  const [view, setView] = useState(defaultView);
  const [pinState, setPinState] = useState('idle'); // 'idle' | 'pinned'
  const [pinnedId, setPinnedId] = useState(null);

  if (!result || !result.data) return null;

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(result.data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Insights");
    XLSX.writeFile(wb, "Insights_Export.xlsx");
  };

  const handlePinToggle = () => {
    if (pinState === 'pinned' && pinnedId && onUnpin) {
      // Optimistic unpin — revert to idle immediately
      const prevId = pinnedId;
      setPinState('idle');
      setPinnedId(null);
      onUnpin(prevId).catch(() => {
        // Revert on failure
        setPinnedId(prevId);
        setPinState('pinned');
      });
    } else if (pinState === 'idle' && onPin) {
      // Optimistic pin — show pinned immediately
      setPinState('pinned');
      onPin().then((id) => {
        setPinnedId(id);
      }).catch(() => {
        // Revert on failure
        setPinState('idle');
        setPinnedId(null);
      });
    }
  };

  return (
    <div className="flex items-start gap-2 animation-fade-in w-full">
      {/* Card Content */}
      <div className="flex-1 min-w-0 bg-white dark:bg-[#1A202C] border border-slate-200 dark:border-slate-800 rounded-3xl rounded-tl-sm shadow-sm overflow-hidden">
        {/* Summary Header */}
        <div className="p-4">
          <h3 className="text-lg font-semibold text-[var(--color-text)]">
            {result.summary || "Here are your insights"}
          </h3>
        </div>

        {/* Canvas Area */}
        <div className="p-4 pt-0">
          {view === 'table' ? (
            <InsightsTable data={result.data} columns={result.columns} />
          ) : (
            <InsightsChart data={result.data} columns={result.columns} chartType={view} />
          )}
        </div>
      </div>

      {/* External Vertical Icon Toolbar */}
      <div className="flex flex-col gap-1 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-xl border border-slate-200 dark:border-slate-700 p-1 shadow-sm shrink-0">
        {[
          { id: 'table', icon: TableIcon, label: 'Table View' },
          { id: 'bar_chart', icon: BarChart2, label: 'Bar Chart' },
          { id: 'pie_chart', icon: PieChartIcon, label: 'Pie Chart' },
          { id: 'line_chart', icon: LineChartIcon, label: 'Line Chart' },
        ].map(item => (
          <button
            type="button"
            key={item.id}
            onClick={() => setView(item.id)}
            className={`p-1.5 rounded-xl transition-colors ${view === item.id ? 'bg-indigo-600 text-white' : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
            title={item.label}
          >
            <item.icon size={16} />
          </button>
        ))}

        <div className="border-t border-slate-200 dark:border-slate-700 my-0.5" />

        <button
          type="button"
          onClick={handleExport}
          className="p-1.5 rounded-xl text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          title="Export"
        >
          <Download size={16} />
        </button>

        {onPin && (
          <button
            type="button"
            onClick={handlePinToggle}
            className={`p-1.5 rounded-xl transition-all duration-200 ${
              pinState === 'pinned'
                ? 'bg-emerald-500 text-white hover:bg-rose-500'
                : 'text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10'
            }`}
            title={pinState === 'pinned' ? 'Unpin from Dashboard' : 'Pin to Dashboard'}
          >
            {pinState === 'pinned' ? <PinOff size={16} /> : <Pin size={16} />}
          </button>
        )}
      </div>
    </div>
  );
}
