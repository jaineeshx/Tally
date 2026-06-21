// ============================================================
// recommendationEngine.ts
// Pure function: recent log history → ranked habit suggestions.
// Deterministic rule table — no LLM, no network calls.
// Works fully offline and is unit-testable.
// ============================================================
import type { LogEntry, Recommendation, LogSubcategory } from '../types';

/**
 * Count how many times each subcategory appears in a log array.
 *
 * @param logs - Logs to count over (typically the last 14 days).
 * @returns Map of subcategory string → occurrence count.
 *          Returns an empty object for an empty log array.
 */
export function countSubcategories(logs: LogEntry[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const log of logs) {
    counts[log.subcategory] = (counts[log.subcategory] ?? 0) + 1;
  }
  return counts;
}

/**
 * Generate a ranked list of up to 3 personalised recommendations
 * based on the user's recent log patterns.
 *
 * Rules are applied in priority order (1 = most important).
 * A deterministic fallback is returned if no rules match.
 *
 * Rule thresholds (evaluated over the last 14 days):
 * - Rule 1: food_delivery_avg ≥ 4 → suggest cooking at home
 * - Rule 2: car_solo ≥ 6 AND (bus + metro + car_shared_2) < 3 → suggest transit
 * - Rule 3: ac_hour ≥ 10 → suggest 24°C thermostat
 * - Rule 4: meat_meal ≥ 8 → suggest 3 veggie swaps
 * - Rule 5: online_order_avg ≥ 5 → suggest batching orders
 *
 * @param logs - All log entries from the last 14 days.
 * @returns Array of 1–3 recommendations sorted by priority ascending.
 */
export function getRecommendations(logs: LogEntry[]): Recommendation[] {
  const counts = countSubcategories(logs);
  const matched: Recommendation[] = [];

  // ── Rule 1: High food delivery usage ──────────────────────
  const deliveryCount = counts['food_delivery_avg'] ?? 0;
  if (deliveryCount >= 4) {
    const extraOrders = deliveryCount - 2;
    matched.push({
      id: 'reduce_food_delivery',
      title: 'Cook at home 3× this week',
      description:
        `You ordered food ${deliveryCount} times in the last 2 weeks. ` +
        `Swapping ${extraOrders} of those for home cooking saves real money — and the packaging adds up.`,
      money_saved_inr_week: extraOrders * (350 - 80), // avg delivery vs home-cooked veg
      co2_saved_kg_week: Math.round(extraOrders * (1.4 - 0.9) * 10) / 10,
      priority: 1,
      trigger_subcategory: 'food_delivery_avg',
    });
  }

  // ── Rule 2: High solo driving, low carpool/transit ─────────
  const soloDrives  = counts['car_solo']      ?? 0;
  const transitUse  = (counts['bus']          ?? 0)
                    + (counts['metro']         ?? 0)
                    + (counts['car_shared_2']  ?? 0);
  if (soloDrives >= 6 && transitUse < 3) {
    const switchTrips = Math.floor(soloDrives / 2);
    matched.push({
      id: 'switch_to_transit',
      title: 'Try transit for half your drives',
      description:
        `You drove alone ${soloDrives} times recently with barely any transit or carpooling. ` +
        `Swapping ~${switchTrips} trips to bus/metro saves about ₹${switchTrips * 60}/week in fuel.`,
      money_saved_inr_week: switchTrips * 60,
      co2_saved_kg_week: Math.round(switchTrips * (0.171 - 0.105) * 10 * 10) / 10,
      priority: 2,
      trigger_subcategory: 'car_solo',
    });
  }

  // ── Rule 3: High AC usage ──────────────────────────────────
  const acHours = counts['ac_hour'] ?? 0;
  if (acHours >= 10) {
    const hoursPerWeek = Math.round(acHours / 2);
    const saveHours    = Math.floor(hoursPerWeek * 0.25); // 25% reduction target
    matched.push({
      id: 'reduce_ac',
      title: 'Set AC to 24°C, save 25%',
      description:
        `You logged ${acHours} AC hours in 2 weeks. ` +
        `Bumping from 18°C to 24°C cuts consumption ~25%. That's ₹${saveHours * 9}/week back in your pocket.`,
      money_saved_inr_week: saveHours * 9,
      co2_saved_kg_week: Math.round(saveHours * 0.9 * 10) / 10,
      priority: 3,
      trigger_subcategory: 'ac_hour',
    });
  }

  // ── Rule 4: High meat consumption ─────────────────────────
  const meatMeals = counts['meat_meal'] ?? 0;
  if (meatMeals >= 8) {
    const swapMeals = 3;
    matched.push({
      id: 'reduce_meat',
      title: 'Try 3 veggie meals this week',
      description:
        `You had meat ${meatMeals} times in 2 weeks. ` +
        `Swapping just 3 to vegetarian cuts ₹${swapMeals * 120} and is surprisingly filling.`,
      money_saved_inr_week: swapMeals * 120,
      co2_saved_kg_week: Math.round(swapMeals * (3.3 - 0.9) * 10) / 10,
      priority: 4,
      trigger_subcategory: 'meat_meal',
    });
  }

  // ── Rule 5: High online shopping ──────────────────────────
  const orderCount = counts['online_order_avg'] ?? 0;
  if (orderCount >= 5) {
    const reduceBy = 2;
    matched.push({
      id: 'batch_orders',
      title: 'Batch your online orders',
      description:
        `${orderCount} orders in 2 weeks is a lot of packaging. ` +
        `Consolidating to 1–2 orders/week saves ₹${reduceBy * 600} and cuts delivery runs.`,
      money_saved_inr_week: reduceBy * 600,
      co2_saved_kg_week: Math.round(reduceBy * 1.0 * 10) / 10,
      priority: 5,
      trigger_subcategory: 'online_order_avg',
    });
  }

  // ── Fallback — default tip if no rules triggered ───────────
  if (matched.length === 0) {
    matched.push({
      id: 'start_logging',
      title: 'Keep logging for 2 more days',
      description:
        'Once you have a week of data, we\'ll spot patterns and show you the easiest wins. Takes 30 seconds a day.',
      money_saved_inr_week: 0,
      co2_saved_kg_week: 0,
      priority: 99,
      trigger_subcategory: 'bus' as LogSubcategory,
    });
  }

  // Return top 3 by priority (lower number = more important)
  return matched.sort((a, b) => a.priority - b.priority).slice(0, 3);
}
