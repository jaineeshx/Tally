// ============================================================
// calculateFootprint.test.ts — EXPANDED
// Full coverage: edge cases, boundary values, large datasets,
// formatToast token replacement, and all computeBaselineWeekly
// commute modes.
// ============================================================
import { describe, it, expect } from 'vitest';
import {
  calculateFootprint,
  toComparisons,
  computeBaselineWeekly,
  formatToast,
} from '../src/lib/calculateFootprint';
import type { LogEntry } from '../src/types';

const makeLog = (category: string, subcategory: string, co2e_kg: number, cost = 0): LogEntry => ({
  category: category as LogEntry['category'],
  subcategory: subcategory as LogEntry['subcategory'],
  co2e_kg,
  cost_estimate_inr: cost,
  logged_at: new Date().toISOString(),
});

// ── calculateFootprint ───────────────────────────────────────
describe('calculateFootprint — basics', () => {
  it('returns zero totals for empty log array', () => {
    const result = calculateFootprint([]);
    expect(result.total_co2e_kg).toBe(0);
    expect(result.log_count).toBe(0);
    expect(result.by_category.transport).toBe(0);
    expect(result.by_category.food).toBe(0);
  });

  it('handles a single transport log correctly', () => {
    const logs = [makeLog('transport', 'bus', 0.84)];
    const result = calculateFootprint(logs);
    expect(result.total_co2e_kg).toBe(0.84);
    expect(result.by_category.transport).toBe(0.84);
    expect(result.by_category.food).toBe(0);
    expect(result.log_count).toBe(1);
  });

  it('correctly sums mixed category logs', () => {
    const logs = [
      makeLog('transport', 'car_solo', 1.71),
      makeLog('food', 'meat_meal', 3.3),
      makeLog('home', 'ac_hour', 0.9),
      makeLog('shopping', 'online_order_avg', 1.0),
    ];
    const result = calculateFootprint(logs);
    expect(result.total_co2e_kg).toBeCloseTo(6.91, 2);
    expect(result.by_category.transport).toBe(1.71);
    expect(result.by_category.food).toBe(3.3);
    expect(result.by_category.home).toBe(0.9);
    expect(result.by_category.shopping).toBe(1.0);
  });

  it('handles unknown category without crashing (adds to total only)', () => {
    const logs = [makeLog('unknown_cat' as any, 'some_sub', 2.0)];
    const result = calculateFootprint(logs);
    expect(result.total_co2e_kg).toBe(2.0);
    expect(result.log_count).toBe(1);
    // Unknown category should not appear in by_category breakdown
    expect(Object.keys(result.by_category)).toEqual(['transport', 'food', 'home', 'shopping']);
  });

  it('handles zero co2e entries (walk/cycle)', () => {
    const logs = [makeLog('transport', 'walk_cycle', 0)];
    const result = calculateFootprint(logs);
    expect(result.total_co2e_kg).toBe(0);
  });

  it('rounds to 3 decimal places', () => {
    const logs = [
      makeLog('food', 'veg_meal', 0.3333),
      makeLog('food', 'veg_meal', 0.3333),
      makeLog('food', 'veg_meal', 0.3333),
    ];
    const result = calculateFootprint(logs);
    // 0.9999 rounds to 1.000 at 3dp
    expect(result.total_co2e_kg).toBe(1.0);
  });

  it('log_count reflects exact array length including duplicates', () => {
    const logs = Array.from({ length: 7 }, () => makeLog('food', 'veg_meal', 0.9));
    const result = calculateFootprint(logs);
    expect(result.log_count).toBe(7);
  });
});

describe('calculateFootprint — edge cases', () => {
  it('handles co2e_kg as string-coerced number gracefully', () => {
    // This can happen if log data is loaded from corrupted localStorage
    const log = { ...makeLog('food', 'veg_meal', 0.9), co2e_kg: '0.9' as unknown as number };
    const result = calculateFootprint([log]);
    expect(result.total_co2e_kg).toBe(0.9);
  });

  it('handles large dataset (500 logs) without overflow', () => {
    const logs = Array.from({ length: 500 }, () => makeLog('transport', 'car_solo', 1.71));
    const result = calculateFootprint(logs);
    expect(result.total_co2e_kg).toBeCloseTo(855, 0); // 500 × 1.71
    expect(result.log_count).toBe(500);
    expect(Number.isFinite(result.total_co2e_kg)).toBe(true);
  });

  it('all four categories are always present in by_category even with no matching logs', () => {
    const logs = [makeLog('food', 'veg_meal', 0.9)];
    const result = calculateFootprint(logs);
    expect(result.by_category).toHaveProperty('transport');
    expect(result.by_category).toHaveProperty('food');
    expect(result.by_category).toHaveProperty('home');
    expect(result.by_category).toHaveProperty('shopping');
  });

  it('sums multiple logs in same category correctly', () => {
    const logs = [
      makeLog('home', 'electricity_unit', 0.82),
      makeLog('home', 'laundry_load', 0.6),
      makeLog('home', 'ac_hour', 0.9),
    ];
    const result = calculateFootprint(logs);
    expect(result.by_category.home).toBeCloseTo(2.32, 2);
    expect(result.total_co2e_kg).toBeCloseTo(2.32, 2);
  });
});

// ── toComparisons ────────────────────────────────────────────
describe('toComparisons', () => {
  it('converts 1 kg CO2e to expected comparisons', () => {
    const c = toComparisons(1);
    expect(c.km_driven).toBeCloseTo(5.85, 0);
    expect(c.phone_charges).toBe(121);
    expect(c.tree_months).toBeCloseTo(0.067, 2);
  });

  it('returns zero comparisons for zero CO2e', () => {
    const c = toComparisons(0);
    expect(c.km_driven).toBe(0);
    expect(c.phone_charges).toBe(0);
    expect(c.tree_months).toBe(0);
  });

  it('scales linearly with input', () => {
    const c1 = toComparisons(1);
    const c10 = toComparisons(10);
    // km_driven rounds to 1dp per call, so scale-and-round can differ by ≤0.5
    expect(Math.abs(c10.km_driven - c1.km_driven * 10)).toBeLessThanOrEqual(0.5);
    expect(c10.phone_charges).toBe(c1.phone_charges * 10);
  });

  it('phone_charges is always an integer', () => {
    for (const val of [0.3, 1.7, 5.0, 22.333]) {
      const c = toComparisons(val);
      expect(Number.isInteger(c.phone_charges)).toBe(true);
    }
  });

  it('km_driven has at most 1 decimal place', () => {
    for (const val of [0.5, 3.14, 7.77]) {
      const c = toComparisons(val);
      const parts = String(c.km_driven).split('.');
      expect((parts[1] ?? '').length).toBeLessThanOrEqual(1);
    }
  });
});

// ── formatToast ──────────────────────────────────────────────
describe('formatToast', () => {
  it('replaces {phone_charges} token', () => {
    const result = formatToast('= {phone_charges} phone charges', 1);
    expect(result).toMatch(/= \d+ phone charges/);
    expect(result).not.toContain('{phone_charges}');
  });

  it('replaces {km_driven} token', () => {
    const result = formatToast('like driving {km_driven} km', 1);
    expect(result).not.toContain('{km_driven}');
    expect(result).toMatch(/like driving [\d.]+ km/);
  });

  it('replaces {tree_months} token', () => {
    const result = formatToast('{tree_months} tree-months', 2);
    expect(result).not.toContain('{tree_months}');
  });

  it('handles template with no tokens (returns template unchanged)', () => {
    const result = formatToast('No tokens here', 5);
    expect(result).toBe('No tokens here');
  });

  it('handles zero co2e (all replacements become 0)', () => {
    const result = formatToast('{phone_charges} charges, {km_driven} km', 0);
    expect(result).toBe('0 charges, 0 km');
  });

  it('replaces all three tokens in a single template', () => {
    const template = '{phone_charges} charges | {km_driven} km | {tree_months} trees';
    const result = formatToast(template, 3);
    expect(result).not.toContain('{phone_charges}');
    expect(result).not.toContain('{km_driven}');
    expect(result).not.toContain('{tree_months}');
  });
});

// ── computeBaselineWeekly ────────────────────────────────────
describe('computeBaselineWeekly — all commute modes', () => {
  const allModes = ['walk_cycle', 'bus', 'metro', 'two_wheeler', 'car_solo', 'car_shared_2'];
  const households = ['1', '2-3', '4+'];

  it('returns a positive number for all valid input combinations', () => {
    for (const mode of allModes) {
      for (const hh of households) {
        const result = computeBaselineWeekly({ commute_mode: mode, household_size: hh });
        expect(result, `Expected positive for ${mode}/${hh}`).toBeGreaterThanOrEqual(0);
        expect(Number.isFinite(result)).toBe(true);
      }
    }
  });

  it('walk_cycle gives lower baseline than car_solo', () => {
    const walk = computeBaselineWeekly({ commute_mode: 'walk_cycle', household_size: '2-3' });
    const car = computeBaselineWeekly({ commute_mode: 'car_solo', household_size: '2-3' });
    expect(walk).toBeLessThan(car);
  });

  it('larger household gives higher baseline for same commute mode', () => {
    const small = computeBaselineWeekly({ commute_mode: 'bus', household_size: '1' });
    const large = computeBaselineWeekly({ commute_mode: 'bus', household_size: '4+' });
    expect(large).toBeGreaterThan(small);
  });

  it('handles unknown commute mode gracefully (falls back to bus)', () => {
    const baseline = computeBaselineWeekly({ commute_mode: 'unicycle', household_size: '2-3' });
    const busBaseline = computeBaselineWeekly({ commute_mode: 'bus', household_size: '2-3' });
    expect(baseline).toBe(busBaseline);
  });

  it('handles unknown household size gracefully (defaults to 1.0 multiplier)', () => {
    const result = computeBaselineWeekly({ commute_mode: 'bus', household_size: 'many' });
    const reference = computeBaselineWeekly({ commute_mode: 'bus', household_size: '2-3' });
    expect(Number.isFinite(result)).toBe(true);
    // Should use the 1.0 default multiplier (which is the '2-3' value)
    expect(result).toBe(reference);
  });

  it('metro commute gives lower baseline than two_wheeler', () => {
    const metro = computeBaselineWeekly({ commute_mode: 'metro', household_size: '1' });
    const tw = computeBaselineWeekly({ commute_mode: 'two_wheeler', household_size: '1' });
    expect(metro).toBeLessThan(tw);
  });

  it('car_shared_2 gives lower baseline than car_solo', () => {
    const shared = computeBaselineWeekly({ commute_mode: 'car_shared_2', household_size: '2-3' });
    const solo = computeBaselineWeekly({ commute_mode: 'car_solo', household_size: '2-3' });
    expect(shared).toBeLessThan(solo);
  });

  it('result is rounded to 2 decimal places', () => {
    for (const mode of allModes) {
      const result = computeBaselineWeekly({ commute_mode: mode, household_size: '1' });
      // Check not more than 2 dp
      const parts = String(result).split('.');
      expect((parts[1] ?? '').length).toBeLessThanOrEqual(2);
    }
  });
});
