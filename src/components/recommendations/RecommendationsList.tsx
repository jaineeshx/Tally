import React from 'react';
import { useApp } from '../../context/AppContext';
import { getRecommendations } from '../../lib/recommendationEngine';
import { TrendingDown, Sparkles } from 'lucide-react';

export default function RecommendationsList() {
  const { logs } = useApp();

  // Get logs from the last 14 days
  const recentLogs = React.useMemo(() => {
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    return logs.filter((log) => new Date(log.logged_at) >= fourteenDaysAgo);
  }, [logs]);

  // Compute recommendations
  const recommendations = React.useMemo(() => {
    return getRecommendations(recentLogs);
  }, [recentLogs]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-charcoal-600 uppercase tracking-wider">
          Suggested improvements
        </h3>
        <span className="flex items-center gap-1 text-[10px] font-bold text-gold-600 uppercase">
          <Sparkles size={10} /> Smart suggestions
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {recommendations.map((rec) => {
          const hasSavings = rec.money_saved_inr_week > 0;
          return (
            <div
              key={rec.id}
              className="card-flat p-4 flex flex-col gap-2 bg-cream-50 hover:bg-cream-100/50 transition-all border border-cream-300"
            >
              <div className="flex justify-between items-start gap-2">
                <h4 className="text-sm font-bold text-charcoal-800 leading-tight">
                  {rec.title}
                </h4>
                {hasSavings && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gold-100 text-gold-700 text-xs font-extrabold whitespace-nowrap">
                    Save ₹{rec.money_saved_inr_week}
                  </span>
                )}
              </div>

              <p className="text-xs text-charcoal-500 leading-relaxed">
                {rec.description}
              </p>

              {rec.co2_saved_kg_week > 0 && (
                <div className="flex items-center gap-1 text-[10px] font-bold text-charcoal-400 uppercase tracking-wider mt-1">
                  <TrendingDown size={12} className="text-gold-500" />
                  CO₂ impact: -{rec.co2_saved_kg_week} kg/week
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
