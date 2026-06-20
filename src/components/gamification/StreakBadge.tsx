import React from 'react';
import type { StreakInfo } from '../../types';

interface StreakBadgeProps {
  streakInfo: StreakInfo;
}

export default function StreakBadge({ streakInfo }: StreakBadgeProps) {
  const { current_streak, longest_streak } = streakInfo;

  return (
    <div className="card-flat p-4 flex items-center justify-between border-gold-200 bg-gold-50/50">
      <div className="flex items-center gap-3">
        <div className="text-3xl animate-bounce-gentle" role="img" aria-label="Fire emoji">
          🔥
        </div>
        <div>
          <div className="text-xl font-display font-extrabold text-charcoal-900">
            {current_streak} {current_streak === 1 ? 'Day' : 'Days'}
          </div>
          <div className="text-xs text-charcoal-500 font-semibold uppercase tracking-wider">
            Current Log Streak
          </div>
        </div>
      </div>

      <div className="text-right">
        <div className="text-sm font-bold text-charcoal-800">
          🏆 {longest_streak}
        </div>
        <div className="text-[10px] text-charcoal-400 font-bold uppercase tracking-wider">
          Best Record
        </div>
      </div>
    </div>
  );
}
