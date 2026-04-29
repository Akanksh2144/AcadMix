import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from 'recharts';

const COLORS = [
  '#6366f1', '#f97316', '#8b5cf6', '#ec4899', '#14b8a6',
  '#f59e0b', '#ef4444', '#10b981', '#3b82f6', '#a855f7',
  '#06b6d4', '#e11d48'
];

/** Format large numbers: 187200 → "187.2K", 1500000 → "1.5M" */
function formatAxisTick(value: number): string {
  if (typeof value !== 'number') return String(value);
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(value >= 10_000 ? 0 : 1)}K`;
  return value.toLocaleString();
}

/** Format tooltip values with full comma-separated numbers */
function formatTooltipValue(value: number): string {
  if (typeof value !== 'number') return String(value);
  return value.toLocaleString();
}

interface InsightsChartProps {
  data: Record<string, any>[];
  columns: string[];
  chartType?: string;
}

export default function InsightsChart({ data, columns, chartType = 'bar_chart' }: InsightsChartProps) {
  const { xAxisCol, yAxisCol } = useMemo(() => {
    let xCol: string | null = null;
    let yCol: string | null = null;

    if (data.length > 0) {
      for (const col of columns) {
        if (typeof data[0][col] === 'number') {
          if (!yCol) yCol = col;
        } else if (typeof data[0][col] === 'string') {
          if (!xCol) xCol = col;
        }
      }
    }

    if (!xCol) xCol = columns[0];
    if (!yCol) yCol = columns[1] || columns[0];

    return { xAxisCol: xCol!, yAxisCol: yCol! };
  }, [data, columns]);

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-[var(--color-text-secondary)] font-medium text-sm">
        No data to chart.
      </div>
    );
  }

  /** Pretty-print column names: total_students → Total Students */
  const formatLabel = (key: string) =>
    key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div
          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-3 rounded-xl shadow-2xl shadow-black/10 backdrop-blur-sm"
          style={{ pointerEvents: 'none' }}
        >
          <p className="text-slate-900 dark:text-white font-bold text-sm mb-1.5 border-b border-slate-100 dark:border-slate-700 pb-1.5">
            {label || payload[0]?.name}
          </p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm flex items-center gap-2 mt-1">
              <span
                className="w-2.5 h-2.5 rounded-full inline-block flex-shrink-0"
                style={{ backgroundColor: entry.color || entry.fill }}
              />
              <span className="text-slate-500 dark:text-slate-400">{formatLabel(entry.name)}:</span>
              <span className="font-bold text-slate-900 dark:text-white ml-auto pl-3">
                {formatTooltipValue(entry.value)}
              </span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Compute dynamic left margin based on the largest Y value
  const maxYValue = useMemo(() => {
    let max = 0;
    for (const row of data) {
      const val = Number(row[yAxisCol]) || 0;
      if (val > max) max = val;
    }
    return max;
  }, [data, yAxisCol]);

  const leftMargin = maxYValue >= 1_000_000 ? 20 : maxYValue >= 10_000 ? 15 : 10;

  // Cap bar width for small datasets — prevents a single bar from filling the entire chart
  const maxBarSize = data.length <= 3 ? 80 : data.length <= 6 ? 60 : undefined;

  const renderChart = () => {
    if (chartType === 'pie_chart') {
      return (
        <PieChart>
          <Pie
            data={data}
            dataKey={yAxisCol}
            nameKey={xAxisCol}
            cx="50%"
            cy="50%"
            outerRadius={120}
            innerRadius={60}
            paddingAngle={2}
            strokeWidth={2}
            stroke="var(--color-background)"
            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
          >
            {data.map((_entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            iconType="circle"
            iconSize={10}
            formatter={(value: string) => (
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{formatLabel(value)}</span>
            )}
          />
        </PieChart>
      );
    }

    if (chartType === 'line_chart') {
      return (
        <LineChart data={data} margin={{ top: 10, right: 30, left: leftMargin, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} opacity={0.5} />
          <XAxis
            dataKey={xAxisCol}
            stroke="var(--color-text-secondary)"
            tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: 'var(--color-border)' }}
          />
          <YAxis
            stroke="var(--color-text-secondary)"
            tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }}
            tickFormatter={formatAxisTick}
            tickLine={false}
            axisLine={false}
            width={65}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ stroke: 'var(--color-primary)', strokeWidth: 1, strokeDasharray: '4 4' }}
          />
          <Line
            type="monotone"
            dataKey={yAxisCol}
            stroke={COLORS[0]}
            strokeWidth={3}
            dot={{ r: 5, fill: COLORS[0], strokeWidth: 2, stroke: '#fff' }}
            activeDot={{ r: 7, strokeWidth: 0, fill: COLORS[0] }}
          />
        </LineChart>
      );
    }

    // Default: Bar Chart
    return (
      <BarChart data={data} margin={{ top: 10, right: 30, left: leftMargin, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} opacity={0.5} />
        <XAxis
          dataKey={xAxisCol}
          stroke="var(--color-text-secondary)"
          tick={{ fill: 'var(--color-text-secondary)', fontSize: 12, fontWeight: 500 }}
          tickLine={false}
          axisLine={{ stroke: 'var(--color-border)' }}
          interval={0}
          angle={data.length > 8 ? -35 : 0}
          textAnchor={data.length > 8 ? 'end' : 'middle'}
          height={data.length > 8 ? 60 : 30}
        />
        <YAxis
          stroke="var(--color-text-secondary)"
          tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }}
          tickFormatter={formatAxisTick}
          tickLine={false}
          axisLine={false}
          width={65}
        />
        <Tooltip
          content={<CustomTooltip />}
          cursor={{ fill: 'var(--color-primary)', opacity: 0.06 }}
        />
        <Bar
          dataKey={yAxisCol}
          radius={[6, 6, 0, 0]}
          maxBarSize={maxBarSize}
          animationDuration={800}
          animationEasing="ease-out"
        >
          {data.map((_entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    );
  };

  return (
    <div className="w-full h-80 min-h-[320px]">
      <ResponsiveContainer width="100%" height="100%">
        {renderChart()}
      </ResponsiveContainer>
    </div>
  );
}
