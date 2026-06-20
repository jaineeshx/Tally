// ============================================================
// streaks.ts
// Pure functions: log dates → streak info + badge eligibility
// Timezone-safe: works on YYYY-MM-DD date strings only.
// ============================================================
import type { StreakInfo, Badge, LogEntry } from '../types';

// ── Badge definitions ──────────────────────────────────────
export const ALL_BADGES: Badge[] = [
  {
    id: 'streak_3',
    name: '3-Day Run',
    description: 'Logged 3 days in a row',
    icon: '🔥',
  },
  {
    id: 'streak_7',
    name: 'Week Warrior',
    description: 'Logged 7 days in a row',
    icon: '⚡',
  },
  {
    id: 'streak_30',
    name: 'Month Machine',
    description: 'Logged 30 days in a row',
    icon: '💎',
  },
  {
    id: 'first_carpool',
    name: 'Social Commuter',
    description: 'First time carpooling logged',
    icon: '🤝',
  },
  {
    id: 'veg_week',
    name: 'Plant Curious',
    description: 'No meat logged for 7 days',
    icon: '🌱',
  },
  {
    id: 'first_walk',
    name: 'Own Two Feet',
    description: 'First walk or cycle logged',
    icon: '👟',
  },
  {
    id: 'top_10_pct',
    name: 'Top 10%',
    description: 'In the top 10% of the leaderboard this week',
    icon: '🏆',
  },
];

/** Convert an ISO timestamp or date string to a YYYY-MM-DD string in local time. */
export function toLocalDateStr(isoString: string): string {
  const d = new Date(isoString);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculate streak info from a list of log entries.
 * Multiple logs on the same day count as one logged day.
 * A "streak" is consecutive calendar days ending today or yesterday.
 */
export function calculateStreak(logs: LogEntry[], today?: string): StreakInfo {
  if (logs.length === 0) {
    return { current_streak: 0, longest_streak: 0, last_log_date: null };
  }

  // Normalise to YYYY-MM-DD and deduplicate
  const uniqueDates = Array.from(
    new Set(logs.map((l) => toLocalDateStr(l.logged_at)))
  ).sort(); // ascending

  const todayStr = today ?? toLocalDateStr(new Date().toISOString());

  // Calculate longest streak
  let longestStreak = 1;
  let runLength = 1;
  for (let i = 1; i < uniqueDates.length; i++) {
    const prev = new Date(uniqueDates[i - 1]);
    const curr = new Date(uniqueDates[i]);
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / 86_400_000);
    if (diffDays === 1) {
      runLength++;
      longestStreak = Math.max(longestStreak, runLength);
    } else {
      runLength = 1;
    }
  }

  // Calculate current streak (must include today or yesterday to be "live")
  const lastDate = uniqueDates[uniqueDates.length - 1];
  const todayDate = new Date(todayStr);
  const lastDateTime = new Date(lastDate);
  const diffFromToday = Math.round(
    (todayDate.getTime() - lastDateTime.getTime()) / 86_400_000
  );

  // Streak is broken if the last log was more than 1 day ago
  if (diffFromToday > 1) {
    return {
      current_streak: 0,
      longest_streak: longestStreak,
      last_log_date: lastDate,
    };
  }

  // Walk back from the last date to count the current run
  let currentStreak = 1;
  for (let i = uniqueDates.length - 2; i >= 0; i--) {
    const curr = new Date(uniqueDates[i + 1]);
    const prev = new Date(uniqueDates[i]);
    const diff = Math.round((curr.getTime() - prev.getTime()) / 86_400_000);
    if (diff === 1) {
      currentStreak++;
    } else {
      break;
    }
  }

  return {
    current_streak: currentStreak,
    longest_streak: Math.max(longestStreak, currentStreak),
    last_log_date: lastDate,
  };
}

/**
 * Determine which badges have been newly earned.
 * Returns only newly earned badges (not already in earnedBadgeIds).
 */
export function checkNewBadges(
  logs: LogEntry[],
  streakInfo: StreakInfo,
  earnedBadgeIds: string[]
): Badge[] {
  const newBadges: Badge[] = [];
  const earned = new Set(earnedBadgeIds);

  const addIfNew = (id: string) => {
    if (!earned.has(id)) {
      const badge = ALL_BADGES.find((b) => b.id === id);
      if (badge) newBadges.push(badge);
    }
  };

  // Streak badges
  if (streakInfo.current_streak >= 3) addIfNew('streak_3');
  if (streakInfo.current_streak >= 7) addIfNew('streak_7');
  if (streakInfo.current_streak >= 30) addIfNew('streak_30');

  // First carpool
  if (logs.some((l) => l.subcategory === 'car_shared_2')) addIfNew('first_carpool');

  // First walk/cycle
  if (logs.some((l) => l.subcategory === 'walk_cycle')) addIfNew('first_walk');

  // Veg week: no meat in last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recent = logs.filter((l) => new Date(l.logged_at) >= sevenDaysAgo);
  const hasMeatRecently = recent.some((l) => l.subcategory === 'meat_meal');
  if (!hasMeatRecently && recent.length >= 7) addIfNew('veg_week');

  return newBadges;
}
