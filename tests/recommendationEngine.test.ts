// ============================================================
// recommendationEngine.test.ts — EXPANDED
// Tests all 5 rules, the fallback, priority ordering, the
// top-3 cap, and countSubcategories edge cases.
// ============================================================
import { describe, it, expect } from 'vitest';
import { getRecommendations, countSubcategories } from '../src/lib/recommendationEngine';
import type { LogEntry } from '../src/types';

const makeLog = (subcategory: string, category = 'transport', daysAgo = 0): LogEntry => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return {
    category: category as LogEntry['category'],
    subcategory: subcategory as LogEntry['subcategory'],
    co2e_kg: 1,
    cost_estimate_inr: 50,
    logged_at: d.toISOString(),
  };
};

// ── countSubcategories ───────────────────────────────────────
describe('countSubcategories', () => {
  it('returns empty object for empty log array', () => {
    expect(countSubcategories([])).toEqual({});
  });

  it('counts a single subcategory', () => {
    const logs = [makeLog('bus'), makeLog('bus'), makeLog('bus')];
    expect(countSubcategories(logs).bus).toBe(3);
  });

  it('counts multiple different subcategories', () => {
    const logs = [
      makeLog('bus'), makeLog('bus'),
      makeLog('car_solo'),
      makeLog('meat_meal', 'food'),
    ];
    const counts = countSubcategories(logs);
    expect(counts.bus).toBe(2);
    expect(counts.car_solo).toBe(1);
    expect(counts.meat_meal).toBe(1);
  });

  it('returns exact count for large input', () => {
    const logs = Array.from({ length: 100 }, () => makeLog('bus'));
    expect(countSubcategories(logs).bus).toBe(100);
  });
});

// ── getRecommendations — Rule 1: food delivery ──────────────
describe('Rule 1 — food delivery', () => {
  it('does NOT trigger below threshold (3 orders)', () => {
    const logs = Array.from({ length: 3 }, () => makeLog('food_delivery_avg', 'food'));
    const recs = getRecommendations(logs);
    expect(recs.some(r => r.id === 'reduce_food_delivery')).toBe(false);
  });

  it('triggers at exactly 4 orders', () => {
    const logs = Array.from({ length: 4 }, () => makeLog('food_delivery_avg', 'food'));
    const recs = getRecommendations(logs);
    expect(recs.some(r => r.id === 'reduce_food_delivery')).toBe(true);
  });

  it('money_saved_inr_week is a positive number', () => {
    const logs = Array.from({ length: 6 }, () => makeLog('food_delivery_avg', 'food'));
    const recs = getRecommendations(logs);
    const rec = recs.find(r => r.id === 'reduce_food_delivery');
    expect(rec?.money_saved_inr_week).toBeGreaterThan(0);
  });
});

// ── getRecommendations — Rule 2: solo driving ──────────────
describe('Rule 2 — solo driving', () => {
  it('does NOT trigger when transit use is high', () => {
    const logs = [
      ...Array.from({ length: 8 }, () => makeLog('car_solo')),
      ...Array.from({ length: 5 }, () => makeLog('bus')),
    ];
    const recs = getRecommendations(logs);
    expect(recs.some(r => r.id === 'switch_to_transit')).toBe(false);
  });

  it('triggers when solo drives >= 6 and transit < 3', () => {
    const logs = [
      ...Array.from({ length: 7 }, () => makeLog('car_solo')),
      makeLog('bus'),
    ];
    const recs = getRecommendations(logs);
    expect(recs.some(r => r.id === 'switch_to_transit')).toBe(true);
  });

  it('co2_saved_kg_week is positive', () => {
    const logs = Array.from({ length: 8 }, () => makeLog('car_solo'));
    const recs = getRecommendations(logs);
    const rec = recs.find(r => r.id === 'switch_to_transit');
    if (rec) {
      expect(rec.co2_saved_kg_week).toBeGreaterThan(0);
    }
  });
});

// ── getRecommendations — Rule 3: AC usage ──────────────────
describe('Rule 3 — AC usage', () => {
  it('does NOT trigger below 10 hours', () => {
    const logs = Array.from({ length: 9 }, () => makeLog('ac_hour', 'home'));
    const recs = getRecommendations(logs);
    expect(recs.some(r => r.id === 'reduce_ac')).toBe(false);
  });

  it('triggers at 10+ hours', () => {
    const logs = Array.from({ length: 10 }, () => makeLog('ac_hour', 'home'));
    const recs = getRecommendations(logs);
    expect(recs.some(r => r.id === 'reduce_ac')).toBe(true);
  });
});

// ── getRecommendations — Rule 4: meat consumption ──────────
describe('Rule 4 — meat consumption', () => {
  it('triggers at 8+ meat meals', () => {
    const logs = Array.from({ length: 8 }, () => makeLog('meat_meal', 'food'));
    const recs = getRecommendations(logs);
    expect(recs.some(r => r.id === 'reduce_meat')).toBe(true);
  });

  it('does NOT trigger at 7 meals', () => {
    const logs = Array.from({ length: 7 }, () => makeLog('meat_meal', 'food'));
    const recs = getRecommendations(logs);
    expect(recs.some(r => r.id === 'reduce_meat')).toBe(false);
  });
});

// ── getRecommendations — Rule 5: online shopping ──────────
describe('Rule 5 — online shopping', () => {
  it('triggers at 5+ orders', () => {
    const logs = Array.from({ length: 5 }, () => makeLog('online_order_avg', 'shopping'));
    const recs = getRecommendations(logs);
    expect(recs.some(r => r.id === 'batch_orders')).toBe(true);
  });

  it('does NOT trigger at 4 orders', () => {
    const logs = Array.from({ length: 4 }, () => makeLog('online_order_avg', 'shopping'));
    const recs = getRecommendations(logs);
    expect(recs.some(r => r.id === 'batch_orders')).toBe(false);
  });
});

// ── getRecommendations — Fallback and meta behaviour ────────
describe('getRecommendations — fallback and meta', () => {
  it('returns fallback recommendation when no rules trigger', () => {
    const recs = getRecommendations([]);
    expect(recs).toHaveLength(1);
    expect(recs[0].id).toBe('start_logging');
  });

  it('returns at most 3 recommendations even when all rules trigger', () => {
    const logs = [
      ...Array.from({ length: 5 }, () => makeLog('food_delivery_avg', 'food')),
      ...Array.from({ length: 8 }, () => makeLog('car_solo')),
      ...Array.from({ length: 12 }, () => makeLog('ac_hour', 'home')),
      ...Array.from({ length: 10 }, () => makeLog('meat_meal', 'food')),
      ...Array.from({ length: 6 }, () => makeLog('online_order_avg', 'shopping')),
    ];
    const recs = getRecommendations(logs);
    expect(recs.length).toBeLessThanOrEqual(3);
  });

  it('results are sorted by priority ascending', () => {
    const logs = [
      ...Array.from({ length: 5 }, () => makeLog('food_delivery_avg', 'food')),
      ...Array.from({ length: 8 }, () => makeLog('car_solo')),
      ...Array.from({ length: 12 }, () => makeLog('ac_hour', 'home')),
    ];
    const recs = getRecommendations(logs);
    for (let i = 1; i < recs.length; i++) {
      expect(recs[i].priority).toBeGreaterThanOrEqual(recs[i - 1].priority);
    }
  });

  it('all returned recommendations have required fields', () => {
    const logs = Array.from({ length: 6 }, () => makeLog('car_solo'));
    const recs = getRecommendations(logs);
    for (const rec of recs) {
      expect(rec).toHaveProperty('id');
      expect(rec).toHaveProperty('title');
      expect(rec).toHaveProperty('description');
      expect(rec).toHaveProperty('money_saved_inr_week');
      expect(rec).toHaveProperty('co2_saved_kg_week');
      expect(rec).toHaveProperty('priority');
    }
  });

  it('fallback has priority 99 (lowest)', () => {
    const recs = getRecommendations([]);
    expect(recs[0].priority).toBe(99);
  });
});
