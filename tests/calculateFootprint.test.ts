import { describe, it, expect } from 'vitest';
import { calculateFootprint, toComparisons, computeBaselineWeekly } from '../src/lib/calculateFootprint';
import type { LogEntry } from '../src/types';

const makeLog = (category: string, subcategory: string, co2e_kg: number): LogEntry => ({
  category: category as LogEntry['category'],
  subcategory: subcategory as LogEntry['subcategory'],
  co2e_kg,
  cost_estimate_inr: 0,
  logged_at: new Date().toISOString(),
});

describe('calculateFootprint', () => {
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
    expect(result.total_co2e_kg).toBe(1.0); // 0.9999 rounded = 1.000
  });
});

describe('toComparisons', () => {
  it('converts 1 kg CO2e to expected comparisons', () => {
    const c = toComparisons(1);
    expect(c.km_driven).toBeCloseTo(5.85, 0); // rounds to 5.9 at 1 decimal — acceptable
    expect(c.phone_charges).toBe(121);
    expect(c.tree_months).toBeCloseTo(0.067, 2);
  });

  it('returns zero comparisons for zero CO2e', () => {
    const c = toComparisons(0);
    expect(c.km_driven).toBe(0);
    expect(c.phone_charges).toBe(0);
    expect(c.tree_months).toBe(0);
  });
});

describe('computeBaselineWeekly', () => {
  it('returns a positive number for standard inputs', () => {
    const baseline = computeBaselineWeekly({ commute_mode: 'bus', household_size: '2-3' });
    expect(baseline).toBeGreaterThan(0);
  });

  it('walk_cycle commute gives lower baseline than car_solo', () => {
    const walkBaseline = computeBaselineWeekly({ commute_mode: 'walk_cycle', household_size: '2-3' });
    const carBaseline = computeBaselineWeekly({ commute_mode: 'car_solo', household_size: '2-3' });
    expect(walkBaseline).toBeLessThan(carBaseline);
  });

  it('larger household gives higher baseline', () => {
    const small = computeBaselineWeekly({ commute_mode: 'bus', household_size: '1' });
    const large = computeBaselineWeekly({ commute_mode: 'bus', household_size: '4+' });
    expect(large).toBeGreaterThan(small);
  });

  it('handles unknown commute mode gracefully (falls back to bus)', () => {
    const baseline = computeBaselineWeekly({ commute_mode: 'unicycle', household_size: '2-3' });
    const busBaseline = computeBaselineWeekly({ commute_mode: 'bus', household_size: '2-3' });
    expect(baseline).toBe(busBaseline);
  });
});
