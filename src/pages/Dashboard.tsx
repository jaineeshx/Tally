import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { calculateFootprint, toComparisons } from '../lib/calculateFootprint';
import { toLocalDateStr } from '../lib/streaks';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { LogEntry, LogCategory } from '../types';
import RecommendationsList from '../components/recommendations/RecommendationsList';

type TimeRange = 'today' | 'week' | 'month';

export default function Dashboard() {
  const { logs } = useApp();
  const [range, setRange] = useState<TimeRange>('week');

  // Filter logs based on selection
  const filteredLogs = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return logs.filter((log) => {
      const logDate = new Date(log.logged_at);
      if (range === 'today') {
        return logDate >= startOfToday;
      } else if (range === 'week') {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        return logDate >= sevenDaysAgo;
      } else {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return logDate >= thirtyDaysAgo;
      }
    });
  }, [logs, range]);

  // Compute totals
  const totals = useMemo(() => calculateFootprint(filteredLogs), [filteredLogs]);
  const comparisons = useMemo(() => toComparisons(totals.total_co2e_kg), [totals.total_co2e_kg]);

  // Compute total cost saved / spent
  const totalCost = useMemo(() => {
    return filteredLogs.reduce((sum, log) => sum + (log.cost_estimate_inr ?? 0), 0);
  }, [filteredLogs]);

  // Prepare chart data (group by date)
  const chartData = useMemo(() => {
    const daysToGenerate = range === 'today' ? 1 : range === 'week' ? 7 : 30;
    const dataMap: Record<string, number> = {};

    // Initialize all dates in the range with 0
    for (let i = daysToGenerate - 1; i >= 0; i--) {
      const d = new Date();
      if (range !== 'today') {
        d.setDate(d.getDate() - i);
      }
      const key = toLocalDateStr(d.toISOString());
      dataMap[key] = 0;
    }

    // Populate with actual log values
    filteredLogs.forEach((log) => {
      const key = toLocalDateStr(log.logged_at);
      if (key in dataMap) {
        dataMap[key] += log.co2e_kg;
      }
    });

    // Format for Recharts
    return Object.entries(dataMap).map(([date, value]) => {
      const [,, day] = date.split('-');
      // Format XAxis label
      let label = day;
      if (range === 'today') {
        label = 'Today';
      } else if (range === 'week') {
        const dateObj = new Date(date);
        label = dateObj.toLocaleDateString('en-IN', { weekday: 'short' });
      } else {
        label = day; // day of month
      }

      return {
        date,
        label,
        co2e: Math.round(value * 10) / 10,
      };
    });
  }, [filteredLogs, range]);

  const categoryLabels: Record<LogCategory, { label: string; color: string; bg: string }> = {
    transport: { label: 'Commute & Travel', color: '#D4A017', bg: 'bg-gold-100' },
    food: { label: 'Food & Meals', color: '#C75B3F', bg: 'bg-rust-400/20' },
    home: { label: 'Home Appliances', color: '#84A98C', bg: 'bg-sage-400/20' },
    shopping: { label: 'Shopping & Delivery', color: '#6B6558', bg: 'bg-charcoal-200' },
  };

  return (
    <div className="page py-6 flex flex-col gap-6 pb-24">
      {/* Page Title & Toggle */}
      <div className="flex justify-between items-center">
        <div className="flex flex-col gap-0.5">
          <span className="section-label">YOUR PROFILE</span>
          <h1 className="text-2xl font-display font-extrabold text-charcoal-900 leading-tight">
            Footprint Stats
          </h1>
        </div>

        <div className="flex bg-cream-200 p-1 rounded-xl border border-cream-300">
          {(['today', 'week', 'month'] as TimeRange[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${
                range === r
                  ? 'bg-white text-gold-500 shadow-warm-sm'
                  : 'text-charcoal-400 hover:text-charcoal-600'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Relatable Comparison Box */}
      <div
        aria-live="polite"
        className="card p-6 border-gold-200 bg-gradient-to-br from-gold-50 to-white flex flex-col gap-4"
      >
        <div className="flex flex-col gap-1">
          <span className="section-label text-gold-600">equivalent impact</span>
          <h2 className="text-3xl font-display font-extrabold text-charcoal-900">
            {comparisons.phone_charges.toLocaleString()} Charges
          </h2>
          <p className="text-xs text-charcoal-500 font-medium">
            Your choices count for roughly this many smartphone charges.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 border-t border-cream-300/60 pt-4">
          <div>
            <div className="text-sm font-extrabold text-charcoal-800">
              {totals.total_co2e_kg} kg
            </div>
            <div className="text-[10px] text-charcoal-400 font-bold uppercase tracking-wider">
              Total CO₂e
            </div>
          </div>
          <div>
            <div className="text-sm font-extrabold text-charcoal-800">
              ₹{totalCost.toLocaleString('en-IN')}
            </div>
            <div className="text-[10px] text-charcoal-400 font-bold uppercase tracking-wider">
              Estimated Spend
            </div>
          </div>
        </div>
      </div>

      {/* Recharts Chart */}
      <div className="card p-5 flex flex-col gap-3">
        <h3 className="text-xs font-bold text-charcoal-600 uppercase tracking-wider">
          Daily footprint trend
        </h3>
        <div className="h-48 w-full select-none">
          {filteredLogs.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-charcoal-400 font-medium">
              No logs in this period yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#6B6558', fontSize: 10, fontWeight: 'bold' }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#6B6558', fontSize: 10, fontWeight: 'bold' }}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(237,233,223,0.3)' }}
                  contentStyle={{
                    background: '#FFFFFF',
                    border: '1px solid #EDE9DF',
                    borderRadius: '0.75rem',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                  }}
                  labelStyle={{ display: 'none' }}
                />
                <Bar dataKey="co2e" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.co2e > 0 ? '#B8860B' : '#E8E4DA'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="card p-5 flex flex-col gap-4">
        <h3 className="text-xs font-bold text-charcoal-600 uppercase tracking-wider">
          Breakdown by category
        </h3>
        <div className="flex flex-col gap-3">
          {(Object.keys(categoryLabels) as LogCategory[]).map((cat) => {
            const val = totals.by_category[cat] ?? 0;
            const pct = totals.total_co2e_kg > 0 ? (val / totals.total_co2e_kg) * 100 : 0;
            const info = categoryLabels[cat];

            return (
              <div key={cat} className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-charcoal-800">{info.label}</span>
                  <span className="font-semibold text-charcoal-500">
                    {val.toFixed(1)} kg ({Math.round(pct)}%)
                  </span>
                </div>
                <div className="h-2 w-full bg-cream-200 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: info.color,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recommendations panel */}
      <RecommendationsList />
    </div>
  );
}
