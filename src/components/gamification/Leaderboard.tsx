import React from 'react';
import { useApp } from '../../context/AppContext';
import { calculateFootprint } from '../../lib/calculateFootprint';

interface Participant {
  name: string;
  city: string;
  reduction_pct: number;
  isCurrentUser?: boolean;
}

export default function LeaderboardList() {
  const { profile, logs } = useApp();

  // Compute current user's reduction percentage this week
  const currentUserReduction = React.useMemo(() => {
    if (!profile || !profile.baseline_co2e_week) return 0;

    // Filter logs for this week
    const now = new Date();
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dayOfWeek = startOfWeek.getDay(); // 0 is Sunday
    const diff = startOfWeek.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // adjust to start on Monday
    const monday = new Date(startOfWeek.setDate(diff));

    const thisWeeksLogs = logs.filter((l) => new Date(l.logged_at) >= monday);
    const weeklyTotals = calculateFootprint(thisWeeksLogs);

    const diffCo2 = profile.baseline_co2e_week - weeklyTotals.total_co2e_kg;
    const pct = (diffCo2 / profile.baseline_co2e_week) * 100;
    return Math.round(pct * 10) / 10;
  }, [profile, logs]);

  // Seeded demo cohort (hackathon demo cohort)
  const cohort: Participant[] = React.useMemo(() => {
    const list: Participant[] = [
      { name: 'Aarav Mehta', city: 'Mumbai', reduction_pct: 22.4 },
      { name: 'Ishita Sharma', city: 'Delhi', reduction_pct: 18.1 },
      { name: 'Kabir Sen', city: 'Bengaluru', reduction_pct: 15.6 },
      { name: 'Neha Gupta', city: 'Hyderabad', reduction_pct: 12.0 },
      { name: 'Rohan Deshmukh', city: 'Pune', reduction_pct: 8.5 },
      { name: 'Ananya Nair', city: 'Kochi', reduction_pct: 5.2 },
      { name: 'Aditya Verma', city: 'Jaipur', reduction_pct: -2.1 },
      { name: 'Zoya Khan', city: 'Lucknow', reduction_pct: -6.4 },
    ];

    // Insert current user
    if (profile) {
      list.push({
        name: profile.display_name || 'You (Anonymous)',
        city: profile.city,
        reduction_pct: currentUserReduction,
        isCurrentUser: true,
      });
    }

    // Sort by reduction percentage (descending)
    return list.sort((a, b) => b.reduction_pct - a.reduction_pct);
  }, [profile, currentUserReduction]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-between items-center text-xs font-bold text-charcoal-400 uppercase tracking-widest px-2">
        <span>User & City</span>
        <span>Week Reduction %</span>
      </div>

      <div className="flex flex-col gap-2">
        {cohort.map((player, idx) => {
          const rank = idx + 1;
          const isNegative = player.reduction_pct < 0;

          return (
            <div
              key={player.name}
              className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                player.isCurrentUser
                  ? 'bg-gold-50 border-gold-300 ring-2 ring-gold-500/10'
                  : 'bg-white border-cream-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-extrabold ${
                    rank === 1
                      ? 'bg-gold-500 text-white'
                      : rank === 2
                      ? 'bg-cream-400 text-charcoal-800'
                      : rank === 3
                      ? 'bg-cream-300 text-charcoal-700'
                      : 'bg-cream-100 text-charcoal-500'
                  }`}
                >
                  {rank}
                </span>

                <div>
                  <div className="text-sm font-bold text-charcoal-800 flex items-center gap-1.5">
                    {player.name}
                    {player.isCurrentUser && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-gold-500 text-white font-extrabold uppercase">
                        YOU
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-charcoal-400 font-semibold uppercase">
                    {player.city}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span
                  className={`text-sm font-extrabold ${
                    isNegative ? 'text-rust-500' : player.reduction_pct > 0 ? 'text-sage-500' : 'text-charcoal-500'
                  }`}
                >
                  {player.reduction_pct > 0 ? '+' : ''}
                  {player.reduction_pct}%
                </span>
                <div className="text-[9px] text-charcoal-400 font-bold uppercase tracking-wider">
                  vs Baseline
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
