// ============================================================
// useLogs.ts — Custom hook encapsulating log read/write logic.
// Separates data-access concerns from UI components cleanly.
// ============================================================
import { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { calculateFootprint, toComparisons } from '../lib/calculateFootprint';
import { toLocalDateStr } from '../lib/streaks';
import type { LogEntry } from '../types';

export type TimeRange = 'today' | 'week' | 'month';

function getWindowStart(range: TimeRange): Date {
  const now = new Date();
  if (range === 'today') {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
  if (range === 'week') {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d;
  }
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d;
}

/** Returns logs scoped to the given time window, memoised. */
export function useFilteredLogs(range: TimeRange): LogEntry[] {
  const { logs } = useApp();
  return useMemo(() => {
    const start = getWindowStart(range);
    return logs.filter((l) => new Date(l.logged_at) >= start);
  }, [logs, range]);
}

/** Returns footprint totals + comparisons for the given time window. */
export function useFootprintSummary(range: TimeRange) {
  const filtered = useFilteredLogs(range);
  return useMemo(() => {
    const totals = calculateFootprint(filtered);
    const comparisons = toComparisons(totals.total_co2e_kg);
    const totalCostInr = filtered.reduce(
      (sum, l) => sum + (Number(l.cost_estimate_inr) || 0),
      0
    );
    return { totals, comparisons, totalCostInr, logCount: filtered.length };
  }, [filtered]);
}

/** Returns per-subcategory count for today — drives tile counter badges. */
export function useTodayCounts(): Record<string, number> {
  const { logs } = useApp();
  return useMemo(() => {
    const todayStr = toLocalDateStr(new Date().toISOString());
    return logs.reduce<Record<string, number>>((acc, log) => {
      if (toLocalDateStr(log.logged_at) === todayStr) {
        acc[log.subcategory] = (acc[log.subcategory] ?? 0) + 1;
      }
      return acc;
    }, {});
  }, [logs]);
}

/** Returns logs from the last N days. */
export function useRecentLogs(days = 14): LogEntry[] {
  const { logs } = useApp();
  return useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return logs.filter((l) => new Date(l.logged_at) >= cutoff);
  }, [logs, days]);
}
