import React, { useState } from 'react';
import { Table as TableIcon, BarChart2, PieChart as PieChartIcon, LineChart as LineChartIcon, Download, Pin, PinOff, Loader2 } from 'lucide-react';
import InsightsTable from './InsightsTable';
import InsightsChart from './InsightsChart';
import * as XLSX from 'xlsx';

export default function InsightsCanvas({ result, onPin, onUnpin }) {
  const defaultView = result.chart_suggestion ? result.chart_suggestion : 'table';
  const [view, setView] = useState(defaultView);
  const [pinState, setPinState] = useState('idle'); // 'idle' | 'syncing' | 'pinned' | 'unpinning'
  const [pinnedId, setPinnedId] = useState(null);

  if (!result || !result.data) return null;

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(result.data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Insights");
    XLSX.writeFile(wb, "Insights_Export.xlsx");
  };

  const isBusy = pinState === 'syncing' || pinState === 'unpinning';

  const handlePinToggle = async () => {
    if (isBusy) return;

    if (pinState === 'pinned' && pinnedId && onUnpin) {
      setPinState('unpinning');
      try {
        await onUnpin(pinnedId);
        setPinnedId(null);
        setPinState('idle');
      } catch {
        setPinState('pinned');
      }
    } else if (pinState === 'idle' && onPin) {
      setPinState('syncing');
      try {
        const id = await onPin();
        setPinnedId(id);
        setPinState('pinned');
      } catch {
        setPinState('idle');
      }
    }
  };

  const pinIcon = () => {
    if (pinState === 'syncing' || pinState === 'unpinning')
      return <Loader2 size={16} className="animate-spin" />;
    if (pinState === 'pinned') return <PinOff size={16} />;
    return <Pin size={16} />;
  };

  const pinTitle = () => {
    if (pinState === 'syncing') return 'Pinning...';
    if (pinState === 'unpinning') return 'Unpinning...';
    if (pinState === 'pinned') return 'Unpin from Dashboard';
    return 'Pin to Dashboard';
  };

  return (
    <div className="flex items-start gap-2 animation-fade-in w-full">
      {/* Card Content */}
      <div className="flex-1 min-w-0 bg-[#EAEAE8] dark:bg-[#1A202C] border border-slate-200 dark:border-slate-800 rounded-3xl rounded-tl-sm shadow-sm overflow-hidden">
        <div className="p-4">
          <h3 className="text-lg font-semibold text-[var(--color-text)]">
            {result.summary || "Here are your insights"}
          </h3>
        </div>
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
            disabled={isBusy}
            className={`p-1.5 rounded-xl transition-all duration-200 ${
              isBusy
                ? 'text-indigo-400 opacity-70 cursor-wait'
                : pinState === 'pinned'
                ? 'bg-emerald-500 text-white hover:bg-rose-500'
                : 'text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10'
            }`}
            title={pinTitle()}
          >
            {pinIcon()}
          </button>
        )}
      </div>
    </div>
  );
}
