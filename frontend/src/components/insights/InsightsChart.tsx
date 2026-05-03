import { useMemo, useState } from 'react';
import {
    Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart,
    Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const RAINBOW = [
  '#6366f1', '#f97316', '#8b5cf6', '#ec4899', '#14b8a6',
  '#f59e0b', '#ef4444', '#10b981', '#3b82f6', '#a855f7',
  '#06b6d4', '#e11d48'
];

/** Semantic colors for known group values — case-insensitive lookup */
const SEMANTIC_COLORS: Record<string, string> = {
  male: '#6366f1', m: '#6366f1', boys: '#6366f1', boy: '#6366f1',
  female: '#ec4899', f: '#ec4899', girls: '#ec4899', girl: '#ec4899',
  pass: '#22c55e', passed: '#22c55e', present: '#22c55e', yes: '#22c55e',
  paid: '#22c55e', active: '#22c55e', approved: '#22c55e', occupied: '#22c55e',
  fail: '#ef4444', failed: '#ef4444', absent: '#ef4444', no: '#ef4444',
  unpaid: '#ef4444', inactive: '#ef4444', rejected: '#ef4444', vacant: '#ef4444',
  pending: '#f59e0b', partial: '#f59e0b', overdue: '#f59e0b',
};

function getSeriesColor(value: string, index: number): string {
  const lower = value.toLowerCase().trim();
  // Exact match first
  if (SEMANTIC_COLORS[lower]) return SEMANTIC_COLORS[lower];
  // Partial word match: "male_students" → check "male", "students"
  const words = lower.split(/[_\s-]+/);
  for (const word of words) {
    if (SEMANTIC_COLORS[word]) return SEMANTIC_COLORS[word];
  }
  return RAINBOW[index % RAINBOW.length];
}

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

/** avg_cgpa → "Avg CGPA", total_students → "Total Students" */
function formatColName(key: string): string {
  if (!key) return '';
  return key
    .replace(/__composite_label__/g, 'Label')
    .replace(/[-_]/g, ' ')
    .replace(/\b(cgpa|sgpa|id|hod|it|ece|cse|aiml)\b/gi, m => m.toUpperCase())
    .replace(/\bpct\b/gi, '%')
    .replace(/\b\w/g, c => c.toUpperCase());
}

/** 187200 → "187.2K" */
function fmtTick(value: number): string {
  if (typeof value !== 'number') return String(value);
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(value >= 10_000 ? 0 : 1)}K`;
  return value.toLocaleString();
}

/** Detect if a column is a percentage based on name */
function isPctCol(name: string): boolean {
  return /pct|percent|rate|ratio/i.test(name);
}

/** Format tick for percentage columns */
function fmtPctTick(value: number): string {
  if (typeof value !== 'number') return String(value);
  return `${value}%`;
}

/** Pivot long-format grouped data to wide format for Recharts */
function pivotData(
  data: Record<string, any>[],
  xCol: string,
  groupCol: string,
  yCol: string
): { pivoted: Record<string, any>[]; seriesKeys: string[] } {
  const xMap = new Map<string, Record<string, any>>();
  const seriesSet = new Set<string>();

  for (const row of data) {
    const xVal = String(row[xCol] ?? '');
    const gVal = String(row[groupCol] ?? '');
    const yVal = row[yCol];
    seriesSet.add(gVal);
    if (!xMap.has(xVal)) xMap.set(xVal, { [xCol]: xVal });
    xMap.get(xVal)![gVal] = yVal;
  }

  return { pivoted: Array.from(xMap.values()), seriesKeys: Array.from(seriesSet) };
}

// ═══════════════════════════════════════════════════════════════════════════════
// COLUMN RESOLUTION
// ═══════════════════════════════════════════════════════════════════════════════

interface ResolvedCols {
  xCol: string;
  yCol: string;
  groupCol: string | null;
  allMetrics: string[];
}

function resolveColumns(
  data: Record<string, any>[],
  columns: string[],
  xColumn?: string, yColumn?: string, groupColumn?: string, allMetrics?: string[]
): ResolvedCols {
  if (!data.length) return { xCol: columns[0], yCol: columns[1] || columns[0], groupCol: null, allMetrics: [] };

  const row = data[0];
  const strCols: string[] = [];
  const numCols: string[] = [];

  // Scan up to 10 rows to determine column types (handles null in first row)
  for (const col of columns) {
    let foundStr = false;
    let foundNum = false;
    for (let i = 0; i < Math.min(data.length, 10); i++) {
      const val = data[i][col];
      if (typeof val === 'string') { foundStr = true; break; }
      if (typeof val === 'number') { foundNum = true; break; }
    }
    if (foundStr) strCols.push(col);
    else if (foundNum) numCols.push(col);
  }

  // Trust LLM columns if they exist in the data
  const xValid = xColumn && row[xColumn] !== undefined;
  const yValid = yColumn && row[yColumn] !== undefined;
  const gValid = groupColumn && row[groupColumn] !== undefined;

  let resolvedX = xValid ? xColumn! : strCols[0] || columns[0];
  let resolvedY = yValid ? yColumn! : numCols[numCols.length - 1] || columns[1] || columns[0];

  // ── Axis swap guard ──
  // If LLM put a numeric column on X and a string/categorical on Y, swap them
  if (typeof row[resolvedY] === 'string' && typeof row[resolvedX] === 'number') {
    [resolvedX, resolvedY] = [resolvedY, resolvedX];
  }
  // If X is numeric but we have string columns available, prefer a string column for X
  if (typeof row[resolvedX] === 'number' && strCols.length > 0) {
    resolvedX = strCols[0];
  }

  // ── Temporal/index column detection for all-numeric data ──
  // When both X and Y are numeric, detect which one is the sequential index (e.g., semester 1-6)
  // vs the metric (e.g., pass_rate 96.43). The index column has small sequential integers.
  if (typeof row[resolvedX] === 'number' && typeof row[resolvedY] === 'number') {
    const temporalPattern = /semester|sem|month|year|week|quarter|period|batch|term/i;
    const xIsTemporal = temporalPattern.test(resolvedX);
    const yIsTemporal = temporalPattern.test(resolvedY);
    
    if (yIsTemporal && !xIsTemporal) {
      // Y has the temporal name but is on the wrong axis
      [resolvedX, resolvedY] = [resolvedY, resolvedX];
    } else if (!xIsTemporal && !yIsTemporal) {
      // Neither has a temporal name — use heuristic: the column with smaller, 
      // sequential integer values is likely the index
      const xVals = data.map(r => Number(r[resolvedX]));
      const yVals = data.map(r => Number(r[resolvedY]));
      const xIsIndex = xVals.every(v => Number.isInteger(v)) && Math.max(...xVals) <= data.length * 3;
      const yIsIndex = yVals.every(v => Number.isInteger(v)) && Math.max(...yVals) <= data.length * 3;
      
      if (!xIsIndex && yIsIndex) {
        [resolvedX, resolvedY] = [resolvedY, resolvedX];
      }
    }
  }

  let resolvedG: string | null = gValid ? groupColumn! : null;

  // ── Cardinality-based X/Group override ──
  // When we have 2+ string columns, use cardinality to assign:
  // X = highest cardinality (more categories, e.g., department with 11 values)
  // Group = lowest cardinality (fewer groups, e.g., gender with 3 values)
  // This overrides bad LLM assignments (e.g., gender on X-axis)
  if (strCols.length >= 2) {
    const cards = strCols.map(col => ({
      col,
      uniques: new Set(data.map(r => r[col]).filter(v => v != null)).size
    }));
    cards.sort((a, b) => b.uniques - a.uniques); // highest cardinality first

    const highCard = cards[0]; // e.g., department (11 values)
    const lowCard = cards[1];  // e.g., gender (3 values)

    // Override if LLM put low-cardinality on X-axis
    if (resolvedX === lowCard.col && lowCard.uniques <= 5 && highCard.uniques > lowCard.uniques) {
      resolvedX = highCard.col;
      resolvedG = lowCard.col;
    }

    // Auto-detect group even if LLM didn't set one
    if (!resolvedG && lowCard.uniques >= 2 && lowCard.uniques <= 10) {
      const xValues = data.map(r => r[highCard.col]);
      const xUniques = new Set(xValues);
      if (xUniques.size < data.length) {
        // X has repeated values → this IS grouped data
        resolvedX = highCard.col;
        resolvedG = lowCard.col;
      }
    }
  }
  // Fallback: single string column, try to find a group from remaining columns
  else if (!resolvedG && strCols.length === 1) {
    // No second string column — no group possible
  }

  // Build all_metrics
  const metrics = allMetrics?.length ? allMetrics.filter(m => row[m] !== undefined) : numCols;

  return { xCol: resolvedX, yCol: resolvedY, groupCol: resolvedG, allMetrics: metrics };
}

// ═══════════════════════════════════════════════════════════════════════════════
// DATA SHAPE DETECTION
// ═══════════════════════════════════════════════════════════════════════════════

type ChartMode = 'kpi' | 'bar' | 'grouped_bar' | 'stacked_bar' | 'line' | 'multi_line' | 'pie';

function detectShape(
  data: Record<string, any>[],
  resolved: ResolvedCols,
  chartSuggestion?: string,
): ChartMode {
  const n = data.length;

  // ── Wide-format detection (runs FIRST, overrides everything) ──
  // If multiple metric columns have semantic names (male/female, paid/unpaid), 
  // this is ALWAYS a grouped bar chart regardless of what LLM suggested
  if (resolved.allMetrics.length >= 2) {
    const semanticPairs = resolved.allMetrics.filter(m => /male|female|boy|girl|pass|fail|paid|unpaid|present|absent/i.test(m));
    if (semanticPairs.length >= 2) return 'grouped_bar';
  }

  // ── LLM suggestion ──
  const llmMap: Record<string, ChartMode> = {
    kpi_card: 'kpi', grouped_bar: 'grouped_bar', stacked_bar: 'stacked_bar',
    multi_line: 'multi_line', line_chart: 'line', pie_chart: 'pie', bar_chart: 'bar',
  };
  if (chartSuggestion && llmMap[chartSuggestion]) {
    const suggested = llmMap[chartSuggestion];
    // Validate: grouped/stacked needs either a group column OR multiple metrics (wide format)
    if ((suggested === 'grouped_bar' || suggested === 'stacked_bar') && !resolved.groupCol && resolved.allMetrics.length < 2) {
      // Fall through to auto-detection
    } else if (suggested === 'multi_line' && !resolved.groupCol) {
      // Fall through to auto-detection
    } else {
      return suggested;
    }
  }

  // ── Auto-detection ──
  if (n <= 2 && resolved.allMetrics.length <= 3) return 'kpi';
  if (resolved.groupCol) {
    const isTemporalX = /semester|month|year|week|quarter|period/i.test(resolved.xCol);
    return isTemporalX ? 'multi_line' : 'grouped_bar';
  }
  if (/semester|month|year|week|quarter|period/i.test(resolved.xCol)) return 'line';
  if (n <= 5 && resolved.allMetrics.length === 1) return 'pie';
  return 'bar';
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUBCOMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

function KpiCard({ data, allMetrics, xCol }: { data: Record<string, any>[]; allMetrics: string[]; xCol: string }) {
  if (!data.length) return null;
  const row = data[0];

  if (data.length === 1) {
    // Single value or profile
    const metrics = allMetrics.length ? allMetrics : Object.keys(row).filter(k => typeof row[k] === 'number');
    return (
      <div className="flex flex-wrap gap-4 justify-center py-6">
        {metrics.map(m => (
          <div key={m} className="flex flex-col items-center px-8 py-6 rounded-2xl"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <span className="text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
              {formatColName(m)}
            </span>
            <span className="text-4xl font-bold" style={{ color: 'var(--color-primary)' }}>
              {typeof row[m] === 'number' ? (isPctCol(m) ? `${row[m]}%` : row[m].toLocaleString()) : row[m]}
            </span>
          </div>
        ))}
      </div>
    );
  }

  // 2 rows = comparison
  return (
    <div className="flex flex-wrap gap-6 justify-center py-6">
      {data.map((r, i) => (
        <div key={i} className="flex flex-col items-center px-8 py-6 rounded-2xl min-w-[180px]"
          style={{ background: 'var(--color-surface)', border: `2px solid ${RAINBOW[i]}` }}>
          <span className="text-sm font-semibold mb-2" style={{ color: RAINBOW[i] }}>
            {r[xCol] || `Group ${i + 1}`}
          </span>
          {allMetrics.slice(0, 3).map(m => (
            <div key={m} className="text-center mt-2">
              <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{formatColName(m)}</span>
              <div className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                {typeof r[m] === 'number' ? (isPctCol(m) ? `${r[m]}%` : r[m].toLocaleString()) : r[m]}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function MetricDropdown({ metrics, active, onChange }: { metrics: string[]; active: string; onChange: (m: string) => void }) {
  if (metrics.length < 2) return null;
  return (
    <div className="flex items-center gap-2 mb-3 px-1">
      <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>Metric:</span>
      <select
        value={active}
        onChange={e => onChange(e.target.value)}
        className="text-xs font-semibold px-2 py-1 rounded-lg border-none outline-none cursor-pointer"
        style={{
          background: 'var(--color-surface)',
          color: 'var(--color-primary)',
          border: '1px solid var(--color-border)',
        }}
      >
        {metrics.map(m => <option key={m} value={m}>{formatColName(m)}</option>)}
      </select>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SHARED CHART ELEMENTS
// ═══════════════════════════════════════════════════════════════════════════════

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-3 rounded-xl shadow-2xl shadow-black/10 backdrop-blur-sm"
      style={{ pointerEvents: 'none' }}>
      <p className="text-slate-900 dark:text-white font-bold text-sm mb-1.5 border-b border-slate-100 dark:border-slate-700 pb-1.5">
        {label || payload[0]?.name}
      </p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-sm flex items-center gap-2 mt-1">
          <span className="w-2.5 h-2.5 rounded-full inline-block flex-shrink-0" style={{ backgroundColor: entry.color || entry.fill }} />
          <span className="text-slate-500 dark:text-slate-400">{formatColName(entry.name || entry.dataKey)}:</span>
          <span className="font-bold text-slate-900 dark:text-white ml-auto pl-3">
            {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
          </span>
        </p>
      ))}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

interface InsightsChartProps {
  data: Record<string, any>[];
  columns: string[];
  chartType?: string;
  chartSuggestion?: string;
  xColumn?: string;
  yColumn?: string;
  groupColumn?: string;
  allMetrics?: string[];
}

export default function InsightsChart({
  data, columns, chartType, chartSuggestion, xColumn, yColumn, groupColumn, allMetrics: allMetricsProp
}: InsightsChartProps) {
  const resolved = useMemo(
    () => resolveColumns(data, columns, xColumn, yColumn, groupColumn, allMetricsProp),
    [data, columns, xColumn, yColumn, groupColumn, allMetricsProp]
  );

  const [activeMetric, setActiveMetric] = useState<string | null>(null);
  const yCol = activeMetric && data[0]?.[activeMetric] !== undefined ? activeMetric : resolved.yCol;

  const mode = useMemo(
    () => detectShape(data, resolved, chartSuggestion),
    [data, resolved, chartSuggestion]
  );

  // Override mode if user manually selected a chart type from the sidebar
  const effectiveMode = useMemo((): ChartMode => {
    if (chartType === 'pie_chart') return 'pie';
    if (chartType === 'line_chart') return mode === 'multi_line' ? 'multi_line' : 'line';
    if (chartType === 'bar_chart') return mode === 'grouped_bar' ? 'grouped_bar' : mode === 'stacked_bar' ? 'stacked_bar' : 'bar';
    return mode;
  }, [chartType, mode]);

  // Pivot data for grouped/stacked modes
  const { pivotedData, seriesKeys } = useMemo(() => {
    if ((effectiveMode === 'grouped_bar' || effectiveMode === 'stacked_bar' || effectiveMode === 'multi_line') && resolved.groupCol) {
      // Long format → pivot to wide
      const { pivoted, seriesKeys } = pivotData(data, resolved.xCol, resolved.groupCol, yCol);
      return { pivotedData: pivoted, seriesKeys };
    }
    // Wide format: data already has multiple numeric columns (e.g., male_students, female_students)
    // Use allMetrics as series keys (excluding total/summary columns)
    if ((effectiveMode === 'grouped_bar' || effectiveMode === 'stacked_bar') && !resolved.groupCol && resolved.allMetrics.length >= 2) {
      // Keep only core count columns — exclude totals, percentages, and rates
      const series = resolved.allMetrics.filter(m => 
        !/total|sum|count_all|grand/i.test(m) && 
        !/pct|percent|percentage|rate|ratio/i.test(m)
      );
      if (series.length >= 2) {
        return { pivotedData: data, seriesKeys: series };
      }
    }
    return { pivotedData: data, seriesKeys: [] as string[] };
  }, [data, effectiveMode, resolved.xCol, resolved.groupCol, yCol, resolved.allMetrics]);

  // Truncate large datasets for chart (table shows all)
  const chartData = useMemo(() => {
    const maxBars = 30;
    const src = seriesKeys.length ? pivotedData : data;
    return src.length > maxBars ? src.slice(0, maxBars) : src;
  }, [data, pivotedData, seriesKeys]);
  const isTruncated = (seriesKeys.length ? pivotedData : data).length > chartData.length;

  // ── Empty State ──
  if (!data || !data.length) {
    return (
      <div className="flex items-center justify-center h-48 text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
        No data to chart.
      </div>
    );
  }

  // ── KPI Card ──
  if (effectiveMode === 'kpi') {
    return <KpiCard data={data} allMetrics={resolved.allMetrics} xCol={resolved.xCol} />;
  }

  // ── Shared config ──
  const usePct = isPctCol(yCol);
  const tickFn = usePct ? fmtPctTick : fmtTick;
  const maxY = Math.max(...chartData.map(r => {
    if (seriesKeys.length) return Math.max(...seriesKeys.map(k => Number(r[k]) || 0));
    return Number(r[yCol]) || 0;
  }));
  const leftMargin = maxY >= 1_000_000 ? 20 : maxY >= 10_000 ? 15 : 10;
  const needsAngle = chartData.length > 8;
  const maxBarSize = chartData.length <= 3 ? 80 : chartData.length <= 6 ? 60 : undefined;

  const xAxisProps = {
    dataKey: resolved.xCol,
    stroke: 'var(--color-text-secondary)',
    tick: { fill: 'var(--color-text-secondary)', fontSize: 12, fontWeight: 500 },
    tickLine: false,
    axisLine: { stroke: 'var(--color-border)' },
    interval: 0 as any,
    angle: needsAngle ? -35 : 0,
    textAnchor: (needsAngle ? 'end' : 'middle') as any,
    height: needsAngle ? 70 : 30,
  };

  const yAxisProps = {
    stroke: 'var(--color-text-secondary)',
    tick: { fill: 'var(--color-text-secondary)', fontSize: 12 },
    tickFormatter: tickFn,
    tickLine: false,
    axisLine: false as any,
    width: 65,
  };

  // ── Render ──
  const renderChart = () => {
    // PIE
    if (effectiveMode === 'pie') {
      return (
        <PieChart>
          <Pie data={chartData} dataKey={yCol} nameKey={resolved.xCol} cx="50%" cy="50%"
            outerRadius={120} innerRadius={60} paddingAngle={2} strokeWidth={2}
            stroke="var(--color-background)"
            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={getSeriesColor(String(entry[resolved.xCol] || ''), i)} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend iconType="circle" iconSize={10}
            formatter={(v: string) => <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{formatColName(v)}</span>} />
        </PieChart>
      );
    }

    // LINE / MULTI-LINE
    if (effectiveMode === 'line' || effectiveMode === 'multi_line') {
      const lineData = seriesKeys.length ? pivotedData : chartData;
      return (
        <LineChart data={lineData} margin={{ top: 10, right: 30, left: leftMargin, bottom: needsAngle ? 50 : 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} opacity={0.5} />
          <XAxis {...xAxisProps} />
          <YAxis {...yAxisProps} />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--color-primary)', strokeWidth: 1, strokeDasharray: '4 4' }} />
          {seriesKeys.length ? (
            <>
              {seriesKeys.map((sk, i) => (
                <Line key={sk} type="monotone" dataKey={sk} name={sk}
                  stroke={getSeriesColor(sk, i)} strokeWidth={3}
                  dot={{ r: 4, fill: getSeriesColor(sk, i), strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6, strokeWidth: 0 }} />
              ))}
              <Legend iconType="circle" iconSize={10}
                formatter={(v: string) => <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{v}</span>} />
            </>
          ) : (
            <Line type="monotone" dataKey={yCol} stroke={RAINBOW[0]} strokeWidth={3}
              dot={{ r: 5, fill: RAINBOW[0], strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 7, strokeWidth: 0, fill: RAINBOW[0] }} />
          )}
        </LineChart>
      );
    }

    // GROUPED BAR
    if (effectiveMode === 'grouped_bar' && seriesKeys.length) {
      return (
        <BarChart data={chartData} margin={{ top: 10, right: 30, left: leftMargin, bottom: needsAngle ? 50 : 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} opacity={0.5} />
          <XAxis {...xAxisProps} />
          <YAxis {...yAxisProps} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--color-primary)', opacity: 0.06 }} />
          {seriesKeys.map((sk, i) => (
            <Bar key={sk} dataKey={sk} name={sk} fill={getSeriesColor(sk, i)}
              radius={[4, 4, 0, 0]} maxBarSize={maxBarSize} animationDuration={800} />
          ))}
          <Legend iconType="circle" iconSize={10}
            formatter={(v: string) => <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{formatColName(v)}</span>} />
        </BarChart>
      );
    }

    // STACKED BAR
    if (effectiveMode === 'stacked_bar' && seriesKeys.length) {
      return (
        <BarChart data={chartData} margin={{ top: 10, right: 30, left: leftMargin, bottom: needsAngle ? 50 : 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} opacity={0.5} />
          <XAxis {...xAxisProps} />
          <YAxis {...yAxisProps} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--color-primary)', opacity: 0.06 }} />
          {seriesKeys.map((sk, i) => (
            <Bar key={sk} dataKey={sk} name={sk} fill={getSeriesColor(sk, i)}
              stackId="stack" maxBarSize={maxBarSize} animationDuration={800} />
          ))}
          <Legend iconType="circle" iconSize={10}
            formatter={(v: string) => <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{v}</span>} />
        </BarChart>
      );
    }

    // DEFAULT: Simple Bar
    return (
      <BarChart data={chartData} margin={{ top: 10, right: 30, left: leftMargin, bottom: needsAngle ? 50 : 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} opacity={0.5} />
        <XAxis {...xAxisProps} />
        <YAxis {...yAxisProps} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--color-primary)', opacity: 0.06 }} />
        <Bar dataKey={yCol} radius={[6, 6, 0, 0]} maxBarSize={maxBarSize} animationDuration={800} animationEasing="ease-out">
          {chartData.map((_e, i) => <Cell key={i} fill={RAINBOW[i % RAINBOW.length]} />)}
        </Bar>
      </BarChart>
    );
  };

  return (
    <div className="w-full">
      <MetricDropdown metrics={resolved.allMetrics} active={yCol} onChange={setActiveMetric} />
      <div className="w-full h-80 min-h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>
      {isTruncated && (
        <p className="text-xs mt-2 px-1 italic" style={{ color: 'var(--color-text-secondary)' }}>
          Showing top {chartData.length} of {(seriesKeys.length ? pivotedData : data).length} items. Switch to table view for full data.
        </p>
      )}
    </div>
  );
}
