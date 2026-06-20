import { describe, it, expect } from 'vitest';
import { getRecommendations, countSubcategories } from '../src/lib/recommendationEngine';
import type { LogEntry } from '../src/types';

const makeLog = (subcategory: string, category: string, daysAgo = 0): LogEntry => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return {
    category: category as LogEntry['category'],
    subcategory: subcategory as LogEntry['subcategory'],
    co2e_kg: 1.0,
    cost_estimate_inr: 100,
    logged_at: d.toISOString(),
  };
};

describe('countSubcategories', () => {
  it('returns empty object for no logs', () => {
    expect(countSubcategories([])).toEqual({});
  });

  it('correctly counts multiple subcategories', () => {
    const logs = [
      makeLog('bus', 'transport'),
      makeLog('bus', 'transport'),
      makeLog('meat_meal', 'food'),
    ];
    const counts = countSubcategories(logs);
    expect(counts['bus']).toBe(2);
    expect(counts['meat_meal']).toBe(1);
    expect(counts['car_solo']).toBeUndefined();
  });
});

describe('getRecommendations', () => {
  it('returns fallback recommendation for empty logs', () => {
    const recs = getRecommendations([]);
    expect(recs.length).toBeGreaterThan(0);
    expect(recs[0].id).toBe('start_logging');
  });

  it('triggers food delivery rule when >= 4 orders in window', () => {
    const logs = Array.from({ length: 5 }, () => makeLog('food_delivery_avg', 'food'));
    const recs = getRecommendations(logs);
    expect(recs.some((r) => r.id === 'reduce_food_delivery')).toBe(true);
  });

  it('does NOT trigger food delivery rule at 3 orders', () => {
    const logs = Array.from({ length: 3 }, () => makeLog('food_delivery_avg', 'food'));
    const recs = getRecommendations(logs);
    expect(recs.some((r) => r.id === 'reduce_food_delivery')).toBe(false);
  });

  it('triggers transit rule when solo drives >= 6 and low transit', () => {
    const logs = [
      ...Array.from({ length: 7 }, () => makeLog('car_solo', 'transport')),
      makeLog('bus', 'transport'), // only 1 transit trip — still low
    ];
    const recs = getRecommendations(logs);
    expect(recs.some((r) => r.id === 'switch_to_transit')).toBe(true);
  });

  it('does NOT trigger transit rule when transit use is adequate', () => {
    const logs = [
      ...Array.from({ length: 6 }, () => makeLog('car_solo', 'transport')),
      ...Array.from({ length: 5 }, () => makeLog('metro', 'transport')),
    ];
    const recs = getRecommendations(logs);
    expect(recs.some((r) => r.id === 'switch_to_transit')).toBe(false);
  });

  it('triggers AC rule when >= 10 ac_hour logs', () => {
    const logs = Array.from({ length: 12 }, () => makeLog('ac_hour', 'home'));
    const recs = getRecommendations(logs);
    expect(recs.some((r) => r.id === 'reduce_ac')).toBe(true);
  });

  it('triggers meat reduction rule when >= 8 meat meals', () => {
    const logs = Array.from({ length: 9 }, () => makeLog('meat_meal', 'food'));
    const recs = getRecommendations(logs);
    expect(recs.some((r) => r.id === 'reduce_meat')).toBe(true);
  });

  it('returns at most 3 recommendations', () => {
    const logs = [
      ...Array.from({ length: 6 }, () => makeLog('food_delivery_avg', 'food')),
      ...Array.from({ length: 8 }, () => makeLog('car_solo', 'transport')),
      ...Array.from({ length: 15 }, () => makeLog('ac_hour', 'home')),
      ...Array.from({ length: 10 }, () => makeLog('meat_meal', 'food')),
    ];
    const recs = getRecommendations(logs);
    expect(recs.length).toBeLessThanOrEqual(3);
  });

  it('each recommendation has a money_saved_inr_week and co2_saved_kg_week', () => {
    const logs = Array.from({ length: 5 }, () => makeLog('food_delivery_avg', 'food'));
    const recs = getRecommendations(logs);
    for (const rec of recs) {
      expect(typeof rec.money_saved_inr_week).toBe('number');
      expect(typeof rec.co2_saved_kg_week).toBe('number');
    }
  });
});
