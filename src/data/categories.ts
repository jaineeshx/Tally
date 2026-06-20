// ============================================================
// categories.ts — Tile definitions for Quick-Log home screen
// Each tile corresponds to one LogSubcategory with defaults.
// ============================================================
import type { TileDefinition } from '../types';
import factors from './emissionFactors.json';

const f = factors.factors;
const c = factors.cost_estimates_inr;

export const TILES: TileDefinition[] = [
  {
    id: 'bus',
    label: 'Bus / Auto',
    category: 'transport',
    emoji: '🚌',
    toast_template: 'Logged. About {phone_charges} phone charges.',
    default_co2e_kg: f.transport.bus.kg_co2e * (f.transport.bus.default_km_per_trip ?? 8),
    default_cost_inr: c.bus.per_trip,
  },
  {
    id: 'metro',
    label: 'Train / Metro',
    category: 'transport',
    emoji: '🚇',
    toast_template: 'Logged. Barely a {km_driven} km drive equivalent.',
    default_co2e_kg: f.transport.metro.kg_co2e * (f.transport.metro.default_km_per_trip ?? 12),
    default_cost_inr: c.metro.per_trip,
  },
  {
    id: 'walk_cycle',
    label: 'Walked / Cycled',
    category: 'transport',
    emoji: '🚶',
    toast_template: 'Zero emissions. Your future self approves.',
    default_co2e_kg: 0,
    default_cost_inr: 0,
  },
  {
    id: 'car_solo',
    label: 'Drove Solo',
    category: 'transport',
    emoji: '🚗',
    toast_template: 'Logged. That\'s {km_driven} km driven equivalent.',
    default_co2e_kg: f.transport.car_solo.kg_co2e * (f.transport.car_solo.default_km_per_trip ?? 10),
    default_cost_inr: (c.car_solo.per_km ?? 8) * (f.transport.car_solo.default_km_per_trip ?? 10),
  },
  {
    id: 'car_shared_2',
    label: 'Carpooled',
    category: 'transport',
    emoji: '🚙',
    toast_template: 'Nice. Half the footprint of going solo.',
    default_co2e_kg: f.transport.car_shared_2.kg_co2e * (f.transport.car_shared_2.default_km_per_trip ?? 10),
    default_cost_inr: (c.car_shared_2.per_km ?? 4) * (f.transport.car_shared_2.default_km_per_trip ?? 10),
  },
  {
    id: 'food_delivery_avg',
    label: 'Food Delivery',
    category: 'food',
    emoji: '📦',
    toast_template: 'Logged. Packaging + delivery = {phone_charges} phone charges.',
    default_co2e_kg: f.food.food_delivery_avg.kg_co2e,
    default_cost_inr: c.food_delivery_avg.per_order,
  },
  {
    id: 'veg_meal',
    label: 'Cooked at Home',
    category: 'food',
    emoji: '🍳',
    toast_template: 'Logged. Way lighter on the wallet and the footprint.',
    default_co2e_kg: f.food.veg_meal.kg_co2e,
    default_cost_inr: c.veg_meal.per_meal,
  },
  {
    id: 'meat_meal',
    label: 'Ate Meat',
    category: 'food',
    emoji: '🍖',
    toast_template: 'Logged. That\'s {phone_charges} phone charges — meat is hungry.',
    default_co2e_kg: f.food.meat_meal.kg_co2e,
    default_cost_inr: c.meat_meal.per_meal,
  },
  {
    id: 'ac_hour',
    label: 'Ran AC',
    category: 'home',
    emoji: '❄️',
    toast_template: 'Logged. Each hour = {phone_charges} phone charges.',
    default_co2e_kg: f.home.ac_hour.kg_co2e,
    default_cost_inr: c.ac_hour.per_hour,
  },
  {
    id: 'laundry_load',
    label: 'Did Laundry',
    category: 'home',
    emoji: '🫧',
    toast_template: 'Logged. One load = {phone_charges} phone charges.',
    default_co2e_kg: f.home.laundry_load.kg_co2e,
    default_cost_inr: c.laundry_load.per_load,
  },
  {
    id: 'online_order_avg',
    label: 'Online Order',
    category: 'shopping',
    emoji: '🛍️',
    toast_template: 'Logged. Packaging + delivery adds up.',
    default_co2e_kg: f.shopping.online_order_avg.kg_co2e,
    default_cost_inr: c.online_order_avg.per_order,
  },
  {
    id: 'flight_domestic',
    label: 'Domestic Flight',
    category: 'transport',
    emoji: '✈️',
    toast_template: 'Big one. That\'s {km_driven} km driven worth.',
    default_co2e_kg: f.transport.flight_domestic.kg_co2e,
    default_cost_inr: c.flight_domestic.per_trip,
  },
];

export const TILE_MAP = Object.fromEntries(TILES.map((t) => [t.id, t])) as Record<string, TileDefinition>;
