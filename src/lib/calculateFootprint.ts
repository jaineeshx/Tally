// ============================================================
// calculateFootprint.ts
// Pure function: LogEntry[] → FootprintTotals
// No network, no DOM, no Supabase. Fully unit-testable.
// ============================================================
import type { LogEntry, FootprintTotals, RelatableComparison, LogCategory } from '../types';
import factors from '../data/emissionFactors.json';

const COMPARISONS = factors.comparisons;

/** Sum up CO2e totals from a list of log entries, broken down by category. */
export function calculateFootprint(logs: LogEntry[]): FootprintTotals {
  const by_category: Record<LogCategory, number> = {
    transport: 0,
    food: 0,
    home: 0,
    shopping: 0,
  };

  let total_co2e_kg = 0;

  for (const log of logs) {
    const kg = Number(log.co2e_kg) || 0;
    total_co2e_kg += kg;

    const cat = log.category as LogCategory;
    if (cat in by_category) {
      by_category[cat] += kg;
    }
    // Unknown categories are counted in total but not broken down.
  }

  return {
    total_co2e_kg: Math.round(total_co2e_kg * 1000) / 1000,
    by_category: {
      transport: Math.round(by_category.transport * 1000) / 1000,
      food: Math.round(by_category.food * 1000) / 1000,
      home: Math.round(by_category.home * 1000) / 1000,
      shopping: Math.round(by_category.shopping * 1000) / 1000,
    },
    log_count: logs.length,
  };
}

/** Convert a CO2e kg total into relatable comparison figures. */
export function toComparisons(co2e_kg: number): RelatableComparison {
  return {
    km_driven: Math.round(co2e_kg * COMPARISONS.km_driven_per_kg_co2e * 10) / 10,
    phone_charges: Math.round(co2e_kg * COMPARISONS.phone_charges_per_kg_co2e),
    tree_months: Math.round(co2e_kg * COMPARISONS.tree_months_per_kg_co2e * 1000) / 1000,
  };
}

/**
 * Format a toast message for a single log entry.
 * Replaces {phone_charges}, {km_driven}, {tree_months} tokens.
 */
export function formatToast(template: string, co2e_kg: number): string {
  const c = toComparisons(co2e_kg);
  return template
    .replace('{phone_charges}', `${c.phone_charges}`)
    .replace('{km_driven}', `${c.km_driven}`)
    .replace('{tree_months}', `${c.tree_months}`);
}

/**
 * Compute a baseline weekly CO2e estimate from onboarding inputs alone.
 * Used for the "your starting number" screen before any logging.
 */
export function computeBaselineWeekly(params: {
  commute_mode: string;
  household_size: string;
}): number {
  const f = factors.factors;

  // Commute: 5 working days × 2 trips (round trip)
  const commuteMap: Record<string, number> = {
    walk_cycle: 0,
    bus: f.transport.bus.kg_co2e * (f.transport.bus.default_km_per_trip ?? 8),
    metro: f.transport.metro.kg_co2e * (f.transport.metro.default_km_per_trip ?? 12),
    two_wheeler: f.transport.two_wheeler.kg_co2e * (f.transport.two_wheeler.default_km_per_trip ?? 8),
    car_solo: f.transport.car_solo.kg_co2e * (f.transport.car_solo.default_km_per_trip ?? 10),
    car_shared_2: f.transport.car_shared_2.kg_co2e * (f.transport.car_shared_2.default_km_per_trip ?? 10),
  };

  const commutePerTrip = commuteMap[params.commute_mode] ?? commuteMap['bus'];
  const commuteWeekly = commutePerTrip * 2 * 5; // round trip × 5 days

  // Home energy: scale by household size
  const householdMultiplier: Record<string, number> = {
    '1': 0.7,
    '2-3': 1.0,
    '4+': 1.5,
  };
  const hm = householdMultiplier[params.household_size] ?? 1.0;

  // Average Indian household: ~250 kWh/month electricity → ~58 kWh/week
  const electricityWeekly = 58 * hm * f.home.electricity_unit.kg_co2e;

  // Food: assume 3 meals/day, mix of veg/meat
  const foodWeekly = 7 * (2 * f.food.veg_meal.kg_co2e + 1 * f.food.meat_meal.kg_co2e);

  const total = commuteWeekly + electricityWeekly + foodWeekly;
  return Math.round(total * 100) / 100;
}
