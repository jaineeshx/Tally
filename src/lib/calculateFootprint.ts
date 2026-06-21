// ============================================================
// calculateFootprint.ts
// Pure functions: LogEntry[] → footprint totals & comparisons.
// No network, no DOM, no Supabase. Fully unit-testable.
// ============================================================
import type { LogEntry, FootprintTotals, RelatableComparison, LogCategory } from '../types';
import factors from '../data/emissionFactors.json';

const COMPARISONS = factors.comparisons;

/**
 * Aggregate CO₂e totals from a list of log entries.
 *
 * @param logs - Array of log entries to sum. May be empty.
 * @returns Totals broken down by category, with the grand total
 *          and log count. All values rounded to 3 decimal places.
 *
 * @example
 * const totals = calculateFootprint(logs);
 * // totals.total_co2e_kg  → 6.91
 * // totals.by_category.transport → 1.71
 */
export function calculateFootprint(logs: LogEntry[]): FootprintTotals {
  const by_category: Record<LogCategory, number> = {
    transport: 0,
    food: 0,
    home: 0,
    shopping: 0,
  };

  let total_co2e_kg = 0;

  for (const log of logs) {
    // Coerce to number in case of corrupted localStorage data
    const kg = Number(log.co2e_kg) || 0;
    total_co2e_kg += kg;

    const cat = log.category as LogCategory;
    if (cat in by_category) {
      by_category[cat] = (by_category[cat] ?? 0) + kg;
    }
    // Unknown categories are counted in total but not broken down.
  }

  return {
    total_co2e_kg: Math.round(total_co2e_kg * 1000) / 1000,
    by_category: {
      transport: Math.round((by_category['transport'] ?? 0) * 1000) / 1000,
      food:      Math.round((by_category['food']      ?? 0) * 1000) / 1000,
      home:      Math.round((by_category['home']      ?? 0) * 1000) / 1000,
      shopping:  Math.round((by_category['shopping']  ?? 0) * 1000) / 1000,
    },
    log_count: logs.length,
  };
}

/**
 * Convert a CO₂e total in kg to relatable real-world comparisons.
 *
 * All factors sourced from:
 * - US EPA GHG equivalencies calculator (phone charges, tree months)
 * - DEFRA 2025 (km driven)
 * Scaled to India grid intensity where applicable.
 *
 * @param co2e_kg - Non-negative CO₂e value in kilograms.
 * @returns Object with `km_driven` (1 dp), `phone_charges` (integer),
 *          and `tree_months` (3 dp).
 */
export function toComparisons(co2e_kg: number): RelatableComparison {
  return {
    km_driven:     Math.round(co2e_kg * COMPARISONS.km_driven_per_kg_co2e * 10) / 10,
    phone_charges: Math.round(co2e_kg * COMPARISONS.phone_charges_per_kg_co2e),
    tree_months:   Math.round(co2e_kg * COMPARISONS.tree_months_per_kg_co2e * 1000) / 1000,
  };
}

/**
 * Format a toast notification template string by replacing named
 * tokens with computed comparison values.
 *
 * Supported tokens:
 * - `{phone_charges}` → integer count
 * - `{km_driven}`     → value with 1 decimal place
 * - `{tree_months}`   → value with 3 decimal places
 *
 * @param template - Template string containing zero or more tokens.
 * @param co2e_kg  - CO₂e value used to compute token replacements.
 * @returns Formatted string with all tokens replaced.
 *
 * @example
 * formatToast('Like driving {km_driven} km', 1)
 * // → 'Like driving 5.9 km'
 */
export function formatToast(template: string, co2e_kg: number): string {
  const c = toComparisons(co2e_kg);
  return template
    .replace('{phone_charges}', String(c.phone_charges))
    .replace('{km_driven}',     String(c.km_driven))
    .replace('{tree_months}',   String(c.tree_months));
}

/**
 * Compute an estimated weekly CO₂e baseline from two onboarding
 * answers alone — before the user has logged anything.
 *
 * Methodology:
 * - Commute: 5 working days × 2 trips (round trip) at mode's
 *   kg/km factor × default distance per trip.
 * - Home energy: Indian average ~250 kWh/month electricity,
 *   scaled by household size multiplier.
 * - Food: 3 meals/day, assumed 2 veg + 1 meat average.
 *
 * @param params.commute_mode   - Selected commute mode. Falls back
 *                                to 'bus' if unrecognised.
 * @param params.household_size - Household bracket. Falls back to
 *                                1.0× multiplier if unrecognised.
 * @returns Estimated weekly CO₂e in kg, rounded to 2 dp.
 */
export function computeBaselineWeekly(params: {
  commute_mode: string;
  household_size: string;
}): number {
  const f = factors.factors;

  // Commute: 5 working days × 2 trips (round trip)
  const commuteMap: Record<string, number> = {
    walk_cycle:  0,
    bus:         f.transport.bus.kg_co2e       * (f.transport.bus.default_km_per_trip        ?? 8),
    metro:       f.transport.metro.kg_co2e     * (f.transport.metro.default_km_per_trip      ?? 12),
    two_wheeler: f.transport.two_wheeler.kg_co2e * (f.transport.two_wheeler.default_km_per_trip ?? 8),
    car_solo:    f.transport.car_solo.kg_co2e  * (f.transport.car_solo.default_km_per_trip   ?? 10),
    car_shared_2:f.transport.car_shared_2.kg_co2e * (f.transport.car_shared_2.default_km_per_trip ?? 10),
  };

  const commutePerTrip = commuteMap[params.commute_mode] ?? commuteMap['bus'] ?? 0;
  const commuteWeekly  = commutePerTrip * 2 * 5; // round trip × 5 working days

  // Home energy: scaled by household size bracket
  const householdMultiplier: Record<string, number> = {
    '1':   0.7,
    '2-3': 1.0,
    '4+':  1.5,
  };
  const hm = householdMultiplier[params.household_size] ?? 1.0;

  // Indian average ~250 kWh/month → ~58 kWh/week
  const electricityWeekly = 58 * hm * f.home.electricity_unit.kg_co2e;

  // Food: 3 meals/day at mixed veg/meat average
  const foodWeekly = 7 * (2 * f.food.veg_meal.kg_co2e + 1 * f.food.meat_meal.kg_co2e);

  const total = commuteWeekly + electricityWeekly + foodWeekly;
  return Math.round(total * 100) / 100;
}
