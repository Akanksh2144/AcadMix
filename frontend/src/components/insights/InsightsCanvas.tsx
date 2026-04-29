import React, { useState } from 'react';
import { Table as TableIcon, BarChart2, PieChart as PieChartIcon, LineChart as LineChartIcon, Download, Pin } from 'lucide-react';
import InsightsTable from './InsightsTable';
import InsightsChart from './InsightsChart';
import * as XLSX from 'xlsx';

export default function InsightsCanvas({ result, onPin }) {
  // result = { data, columns, summary, chart_suggestion, generated_sql }
  const defaultView = result.chart_suggestion ? result.chart_suggestion : 'table';
  const [view, setView] = useState(defaultView); // 'table', 'bar_chart', 'pie_chart', 'line_chart'

  if (!result || !result.data) return null;

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(result.data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Insights");
    XLSX.writeFile(wb, "Insights_Export.xlsx");
  };

  return (
    <div className="bg-[var(--color-background)] overflow-hidden flex flex-col animation-fade-in w-full relative">
      {/* Vertical Icon Toolbar - top right */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-1 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-xl border border-slate-200 dark:border-slate-700 p-1 shadow-lg">
        {[
          { id: 'table', icon: TableIcon, label: 'Table View' },
          { id: 'bar_chart', icon: BarChart2, label: 'Bar Chart' },
          { id: 'pie_chart', icon: PieChartIcon, label: 'Pie Chart' },
          { id: 'line_chart', icon: LineChartIcon, label: 'Line Chart' },
        ].map(item => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={`p-1.5 rounded-lg transition-colors ${view === item.id ? 'bg-indigo-600 text-white' : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
            title={item.label}
          >
            <item.icon size={16} />
          </button>
        ))}

        <div className="border-t border-slate-200 dark:border-slate-700 my-0.5" />

        <button
          onClick={handleExport}
          className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          title="Export"
        >
          <Download size={16} />
        </button>

        {onPin && (
          <button
            onClick={onPin}
            className="p-1.5 rounded-lg text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors"
            title="Pin to Dashboard"
          >
            <Pin size={16} />
          </button>
        )}
      </div>

      {/* Summary Header */}
      <div className="p-4 pr-14">
        <h3 className="text-lg font-semibold text-[var(--color-text)]">
          {result.summary || "Here are your insights"}
        </h3>
      </div>

      {/* Canvas Area */}
      <div className="p-4 pt-0 bg-[var(--color-background)]">
        {view === 'table' ? (
          <InsightsTable data={result.data} columns={result.columns} />
        ) : (
          <InsightsChart data={result.data} columns={result.columns} chartType={view} />
        )}
      </div>
    </div>
  );
}
