// orders.js — papan order: resep yang dipesan pelanggan, kesabaran mereka,
// dan skor yang didapat saat hidangan diantar tepat waktu.

import { RECIPES } from './items.js';

export const MAX_ACTIVE_ORDERS = 4;

// Jeda antar order menyusut dan kesabaran memendek seiring shift berjalan.
export function spawnIntervalAt(elapsedSeconds) {
  if (elapsedSeconds < 45) return 15;
  if (elapsedSeconds < 90) return 12;
  if (elapsedSeconds < 135) return 10;
  return 8;
}

export function patienceAt(elapsedSeconds) {
  if (elapsedSeconds < 45) return 55;
  if (elapsedSeconds < 90) return 48;
  if (elapsedSeconds < 135) return 42;
  return 36;
}

let nextOrderId = 1;

export function createOrder(elapsedSeconds, rng) {
  const recipe = RECIPES[Math.floor(rng() * RECIPES.length)];
  const patience = patienceAt(elapsedSeconds);
  return {
    id: nextOrderId++,
    recipeId: recipe.id,
    patience,
    maxPatience: patience,
    state: 'active',
  };
}

export function resetOrderIds() {
  nextOrderId = 1;
}

// Turunkan kesabaran semua order aktif; kembalikan order yang habis waktunya.
export function tickOrders(orders, dt) {
  const expired = [];
  for (const order of orders) {
    if (order.state !== 'active') continue;
    order.patience -= dt;
    if (order.patience <= 0) {
      order.patience = 0;
      order.state = 'missed';
      expired.push(order);
    }
  }
  return expired;
}

// Nilai hidangan: 10 koin dasar + tip dari sisa kesabaran + bonus beruntun.
export function serveValue(order, streak) {
  const tip = Math.round((order.patience / order.maxPatience) * 8);
  const streakBonus = Math.min(streak, 5) * 2;
  return 10 + tip + streakBonus;
}

export function activeOrders(orders) {
  return orders.filter((o) => o.state === 'active');
}
