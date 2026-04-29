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
    <div className="bg-[var(--color-background)] overflow-hidden flex flex-col animation-fade-in w-full">
      {/* Header and Controls */}
      <div className="bg-[var(--color-surface)] p-4 flex flex-wrap items-center justify-between gap-4">
        <h3 className="text-lg font-semibold text-[var(--color-text)] flex-1 min-w-[200px]">
          {result.summary || "Here are your insights"}
        </h3>
        
        <div className="flex items-center gap-2">
          <div className="flex bg-[var(--color-background)] rounded-lg p-1 border border-[var(--color-border)] h-9 items-center">
            <button
              onClick={() => setView('table')}
              className={`p-1.5 rounded-md transition-colors ${view === 'table' ? 'bg-[var(--color-primary)] text-white' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'}`}
              title="Table View"
            >
              <TableIcon size={18} />
            </button>
            <button
              onClick={() => setView('bar_chart')}
              className={`p-1.5 rounded-md transition-colors ${view === 'bar_chart' ? 'bg-[var(--color-primary)] text-white' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'}`}
              title="Bar Chart"
            >
              <BarChart2 size={18} />
            </button>
            <button
              onClick={() => setView('pie_chart')}
              className={`p-1.5 rounded-md transition-colors ${view === 'pie_chart' ? 'bg-[var(--color-primary)] text-white' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'}`}
              title="Pie Chart"
            >
              <PieChartIcon size={18} />
            </button>
            <button
              onClick={() => setView('line_chart')}
              className={`p-1.5 rounded-md transition-colors ${view === 'line_chart' ? 'bg-[var(--color-primary)] text-white' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'}`}
              title="Line Chart"
            >
              <LineChartIcon size={18} />
            </button>
          </div>

          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-3 h-9 text-sm font-medium bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] rounded-lg hover:bg-[var(--color-background)] transition-colors"
          >
            <Download size={16} /> Export
          </button>

          {onPin && (
            <button
              onClick={onPin}
              className="flex items-center gap-2 px-3 h-9 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors whitespace-nowrap shadow-sm"
            >
              <Pin size={16} fill="white" /> Pin to Dashboard
            </button>
          )}
        </div>
      </div>

      {/* Canvas Area */}
      <div className="p-4 bg-[var(--color-background)]">
        {view === 'table' ? (
          <InsightsTable data={result.data} columns={result.columns} />
        ) : (
          <InsightsChart data={result.data} columns={result.columns} chartType={view} />
        )}
      </div>
    </div>
  );
}
