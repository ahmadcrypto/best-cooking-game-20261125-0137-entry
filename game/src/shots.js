// shots.js — pose panggung untuk screenshot: menata keadaan game (order,
// bahan di meja, piring setengah rakit, timer) lalu game merender dirinya
// sendiri seperti biasa. Semua screenshot adalah render asli kode game.

import { recipeById } from './items.js';
import { resetOrderIds } from './orders.js';

function placeOrder(state, recipeId, patience, maxPatience) {
  state.orders.push({ id: state.orders.length + 1, recipeId, patience, maxPatience, state: 'active' });
}

// ?pose=cover — kondisi terbaik dan paling lengkap: dapur + papan order +
// bahan di counter + hidangan setengah dirakit + timer + piring siap saji.
export function applyPose(state, pose) {
  resetOrderIds();
  state.orders = [];
  state.particles = [];
  state.toasts = [];
  state.player.tray = [];
  state.plate.components = [];
  state.board.item = null;
  state.board.progress = 0;
  state.board.done = false;
  for (const burner of state.burners) {
    burner.item = null;
    burner.progress = 0;
    burner.done = false;
    burner.burnt = false;
    burner.over = 0;
  }
  state.mode = 'playing';
  state.paused = false;

  if (pose === 'cover') {
    state.time = 88;
    state.score = 86;
    state.coins = 86;
    state.served = 6;
    state.missed = 1;
    state.streak = 3;
    placeOrder(state, 'nasi-goreng', 34, 55);
    placeOrder(state, 'ayam-geprek', 22, 48);
    placeOrder(state, 'sup-sayur', 41, 55);
    // Hidangan setengah dirakit di meja plating: 2 dari 3 komponen nasi goreng.
    state.plate.components = [
      { kind: 'nasi', state: 'cooked' },
      { kind: 'telur', state: 'cooked' },
    ];
    // Ayam sedang dimasak di tungku pertama, sayur dipotong di talenan.
    state.burners[0].item = { kind: 'ayam', state: 'chopped' };
    state.burners[0].progress = 0.62;
    state.board.item = { kind: 'sayur', state: 'raw' };
    state.board.progress = 0.55;
    // Koki membawa piring Ayam Geprek yang sudah lengkap (siap antar) plus
    // sambal, berdiri di dekat kompor.
    state.player.tray = [
      { kind: 'plate', state: 'ready', dish: 'ayam-geprek' },
      { kind: 'sambal', state: 'ready' },
    ];
    state.player.x = 560;
    state.player.y = 250;
    state.spawnTimer = 6;
    return;
  }

  if (pose === 'play') {
    state.time = 24;
    state.score = 22;
    state.coins = 22;
    state.served = 2;
    state.missed = 0;
    state.streak = 2;
    placeOrder(state, 'nasi-ayam', 40, 55);
    placeOrder(state, 'telur-sambal', 30, 55);
    state.burners[0].item = { kind: 'nasi', state: 'raw' };
    state.burners[0].progress = 0.4;
    state.player.tray = [{ kind: 'ayam', state: 'raw' }];
    state.player.x = 200;
    state.player.y = 300;
    state.spawnTimer = 8;
    return;
  }

  if (pose === 'serve') {
    state.time = 132;
    state.score = 148;
    state.coins = 148;
    state.served = 11;
    state.missed = 2;
    state.streak = 5;
    placeOrder(state, 'ayam-geprek', 18, 42);
    placeOrder(state, 'nasi-sayur', 30, 48);
    // Piring lengkap siap diantar di tangan koki, dekat jendela antar.
    state.player.tray = [{ kind: 'plate', state: 'ready', dish: 'ayam-geprek' }];
    state.player.x = 800;
    state.player.y = 310;
    state.spawnTimer = 5;
    return;
  }

  if (pose === 'rush') {
    state.time = 158;
    state.score = 172;
    state.coins = 172;
    state.served = 13;
    state.missed = 3;
    state.streak = 1;
    placeOrder(state, 'nasi-goreng', 9, 36);
    placeOrder(state, 'ayam-geprek', 14, 36);
    placeOrder(state, 'sup-sayur', 21, 42);
    placeOrder(state, 'telur-sambal', 27, 42);
    state.burners[0].item = { kind: 'telur', state: 'raw' };
    state.burners[0].progress = 0.9;
    state.burners[1].item = { kind: 'ayam', state: 'chopped' };
    state.burners[1].progress = 0.35;
    state.board.item = { kind: 'sayur', state: 'raw' };
    state.board.progress = 0.8;
    state.plate.components = [{ kind: 'nasi', state: 'cooked' }];
    state.player.tray = [
      { kind: 'sayur', state: 'chopped' },
      { kind: 'sambal', state: 'ready' },
    ];
    state.player.x = 470;
    state.player.y = 330;
    state.spawnTimer = 4;
    return;
  }
}

export function poseFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('pose') || null;
}
