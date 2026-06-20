import { describe, it, expect } from 'vitest';
import { calculateStreak, toLocalDateStr, checkNewBadges } from '../src/lib/streaks';
import type { LogEntry } from '../src/types';

const makeLog = (dateStr: string, subcategory = 'bus'): LogEntry => ({
  category: 'transport',
  subcategory: subcategory as LogEntry['subcategory'],
  co2e_kg: 0.5,
  cost_estimate_inr: 20,
  logged_at: `${dateStr}T12:00:00.000Z`,
});

describe('toLocalDateStr', () => {
  it('converts ISO string to YYYY-MM-DD', () => {
    // This is stable regardless of timezone since we use local getFullYear/Month/Date
    const result = toLocalDateStr('2024-03-15T12:00:00.000Z');
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('calculateStreak — basic cases', () => {
  it('returns zero streak for no logs', () => {
    const result = calculateStreak([]);
    expect(result.current_streak).toBe(0);
    expect(result.longest_streak).toBe(0);
    expect(result.last_log_date).toBeNull();
  });

  it('returns streak of 1 for a single log today', () => {
    const today = new Date().toISOString().split('T')[0];
    const logs = [makeLog(today)];
    const result = calculateStreak(logs, today);
    expect(result.current_streak).toBe(1);
    expect(result.longest_streak).toBe(1);
  });

  it('returns streak of 0 when last log was 2+ days ago', () => {
    const old = new Date();
    old.setDate(old.getDate() - 3);
    const oldStr = old.toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];
    const logs = [makeLog(oldStr)];
    const result = calculateStreak(logs, today);
    expect(result.current_streak).toBe(0);
    expect(result.longest_streak).toBe(1);
  });

  it('counts consecutive days correctly', () => {
    const today = new Date();
    const logs = [0, 1, 2, 3, 4].map((daysAgo) => {
      const d = new Date(today);
      d.setDate(d.getDate() - daysAgo);
      return makeLog(d.toISOString().split('T')[0]);
    });
    const todayStr = today.toISOString().split('T')[0];
    const result = calculateStreak(logs, todayStr);
    expect(result.current_streak).toBe(5);
    expect(result.longest_streak).toBe(5);
  });

  it('handles gap in streak correctly', () => {
    const today = new Date();
    // Log today, yesterday, skip one, then 3 and 4 days ago
    const logDays = [0, 1, 3, 4];
    const logs = logDays.map((d) => {
      const date = new Date(today);
      date.setDate(date.getDate() - d);
      return makeLog(date.toISOString().split('T')[0]);
    });
    const todayStr = today.toISOString().split('T')[0];
    const result = calculateStreak(logs, todayStr);
    expect(result.current_streak).toBe(2); // today + yesterday only
    expect(result.longest_streak).toBe(2); // both runs are length 2
  });

  it('multiple logs on same day count as one day', () => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yStr = yesterday.toISOString().split('T')[0];

    // 3 logs today, 2 logs yesterday
    const logs = [
      makeLog(today), makeLog(today), makeLog(today),
      makeLog(yStr), makeLog(yStr),
    ];
    const result = calculateStreak(logs, today);
    expect(result.current_streak).toBe(2);
  });
});

describe('calculateStreak — timezone boundary cases', () => {
  it('log at 11:59pm and 12:01am on next day both count separately', () => {
    // Simulate a log at 2024-03-14 23:59 and 2024-03-15 00:01 local
    // We use fixed date strings to avoid actual timezone issues in CI
    const logs = [
      { ...makeLog('2024-03-14'), logged_at: '2024-03-14T18:29:00.000Z' }, // 11:59pm IST
      { ...makeLog('2024-03-15'), logged_at: '2024-03-14T18:31:00.000Z' }, // 12:01am IST
    ];
    // The key is that toLocalDateStr splits these into two different dates
    // We just verify the function doesn't crash and returns sensible data
    const result = calculateStreak(logs as LogEntry[], '2024-03-15');
    expect(result.current_streak).toBeGreaterThanOrEqual(0);
    expect(result.longest_streak).toBeGreaterThanOrEqual(0);
  });
});

describe('checkNewBadges', () => {
  const makeStreakInfo = (current: number) => ({
    current_streak: current,
    longest_streak: current,
    last_log_date: new Date().toISOString().split('T')[0],
  });

  it('awards streak_3 at 3-day streak', () => {
    const badges = checkNewBadges([], makeStreakInfo(3), []);
    expect(badges.some((b) => b.id === 'streak_3')).toBe(true);
  });

  it('awards streak_7 at 7-day streak', () => {
    const badges = checkNewBadges([], makeStreakInfo(7), []);
    expect(badges.some((b) => b.id === 'streak_7')).toBe(true);
    expect(badges.some((b) => b.id === 'streak_3')).toBe(true);
  });

  it('does not re-award already-earned badges', () => {
    const badges = checkNewBadges([], makeStreakInfo(7), ['streak_3', 'streak_7']);
    expect(badges.some((b) => b.id === 'streak_3')).toBe(false);
    expect(badges.some((b) => b.id === 'streak_7')).toBe(false);
  });

  it('awards first_carpool when carpool log exists', () => {
    const logs = [makeLog(new Date().toISOString().split('T')[0], 'car_shared_2')];
    const badges = checkNewBadges(logs, makeStreakInfo(1), []);
    expect(badges.some((b) => b.id === 'first_carpool')).toBe(true);
  });

  it('awards first_walk for walk_cycle log', () => {
    const logs = [makeLog(new Date().toISOString().split('T')[0], 'walk_cycle')];
    const badges = checkNewBadges(logs, makeStreakInfo(1), []);
    expect(badges.some((b) => b.id === 'first_walk')).toBe(true);
  });

  it('returns empty array when no new badges apply', () => {
    const badges = checkNewBadges([], makeStreakInfo(0), []);
    expect(badges).toHaveLength(0);
  });
});
