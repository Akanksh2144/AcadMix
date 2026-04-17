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

const COLORS = ['#6366f1', '#ec4899', '#14b8a6', '#f59e0b', '#8b5cf6', '#ef4444']; // Modern vibrant colors

export default function InsightsChart({ data, columns, chartType = 'bar_chart' }) {
  // Try to find a good X and Y axis.
  // X = first string column, Y = first number column
  const { xAxisCol, yAxisCol } = useMemo(() => {
    let xCol = null;
    let yCol = null;

    if (data.length > 0) {
      for (const col of columns) {
        if (typeof data[0][col] === 'number') {
          if (!yCol) yCol = col;
        } else if (typeof data[0][col] === 'string') {
          if (!xCol) xCol = col;
        }
      }
    }
    
    // Fallbacks
    if (!xCol) xCol = columns[0];
    if (!yCol) yCol = columns[1] || columns[0];

    return { xAxisCol: xCol, yAxisCol: yCol };
  }, [data, columns]);

  if (!data || data.length === 0) return <div>No data to chart.</div>;

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-3 rounded-lg shadow-lg">
          <p className="text-[var(--color-text)] font-medium mb-1">{label || payload[0]?.name}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color || entry.fill }}>
              {entry.name}: <span className="font-bold">{entry.value}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

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
            innerRadius={60} // Donut style
            paddingAngle={2}
            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend />
        </PieChart>
      );
    } else if (chartType === 'line_chart') {
      return (
        <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
          <XAxis dataKey={xAxisCol} stroke="var(--color-text-secondary)" tick={{ fill: 'var(--color-text-secondary)' }} />
          <YAxis stroke="var(--color-text-secondary)" tick={{ fill: 'var(--color-text-secondary)' }} />
          <Tooltip content={<CustomTooltip />} />
          <Line type="monotone" dataKey={yAxisCol} stroke={COLORS[0]} strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6, strokeWidth: 0 }} />
        </LineChart>
      );
    } else {
      // Default to bar chart
      return (
        <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
          <XAxis dataKey={xAxisCol} stroke="var(--color-text-secondary)" tick={{ fill: 'var(--color-text-secondary)' }} />
          <YAxis stroke="var(--color-text-secondary)" tick={{ fill: 'var(--color-text-secondary)' }} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey={yAxisCol} fill={COLORS[0]} radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
               <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      );
    }
  };

  return (
    <div className="w-full h-80 min-h-[320px]">
      <ResponsiveContainer width="100%" height="100%">
        {renderChart()}
      </ResponsiveContainer>
    </div>
  );
}
