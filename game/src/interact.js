// interact.js — apa yang terjadi saat pemain menekan E / spasi / klik di dekat
// sebuah stasiun: ambil bahan, potong, masak, rakit piring, antar, buang.
// Juga memajukan proses potong dan masak yang sedang berjalan.

import { INGREDIENTS, isFullyPrepared, nextPrepState, plateMatchesRecipe, recipeById, recipeStillPossible } from './items.js';
import { activeOrders, serveValue } from './orders.js';
import { stationById } from './world.js';

export const TRAY_MAX = 3;
export const CHOP_SECONDS = 1.6;
export const COOK_SECONDS = 6;
export const BURN_AFTER_SECONDS = 5;

export function trayHasRoom(player) {
  return player.tray.length < TRAY_MAX;
}

export function addToast(state, text, kind = 'info') {
  state.toasts.push({ text, kind, ttl: 2.2 });
  if (state.toasts.length > 3) state.toasts.shift();
}

export function spawnParticles(state, x, y, color, count = 10) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 40 + Math.random() * 90;
    state.particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 30,
      ttl: 0.6 + Math.random() * 0.4,
      maxTtl: 1,
      color,
      size: 3 + Math.random() * 3,
    });
  }
}

function takeFromCrate(state, station, audio) {
  if (!trayHasRoom(state.player)) {
    addToast(state, 'Baki penuh! Antar atau buang dulu.', 'bad');
    audio.denied();
    return;
  }
  const kind = station.gives;
  const startState = INGREDIENTS[kind].needsChop || INGREDIENTS[kind].needsCook ? 'raw' : 'ready';
  state.player.tray.push({ kind, state: startState });
  audio.pickup();
}

function useBoard(state, audio) {
  const board = state.board;
  const player = state.player;
  if (!board.item) {
    const idx = player.tray.findIndex(
      (it) => it.state === 'raw' && INGREDIENTS[it.kind].needsChop,
    );
    if (idx < 0) {
      addToast(state, 'Talenan: butuh bahan mentah yang harus dipotong.', 'bad');
      audio.denied();
      return;
    }
    board.item = player.tray.splice(idx, 1)[0];
    board.progress = 0;
    board.done = false;
    audio.putDown();
    return;
  }
  if (board.done) {
    if (!trayHasRoom(player)) {
      addToast(state, 'Baki penuh! Kosongkan satu slot dulu.', 'bad');
      audio.denied();
      return;
    }
    player.tray.push(board.item);
    board.item = null;
    board.progress = 0;
    board.done = false;
    audio.pickup();
    return;
  }
  addToast(state, 'Masih dipotong… tetap di dekat talenan.', 'info');
}

function useStove(state, audio) {
  const player = state.player;
  // Ambil dulu yang sudah matang / gosong dari tungku mana pun.
  const doneIdx = state.burners.findIndex((b) => b.item && (b.done || b.burnt));
  if (doneIdx >= 0) {
    if (!trayHasRoom(player)) {
      addToast(state, 'Baki penuh! Kosongkan satu slot dulu.', 'bad');
      audio.denied();
      return;
    }
    const burner = state.burners[doneIdx];
    player.tray.push(burner.item);
    burner.item = null;
    burner.progress = 0;
    burner.done = false;
    burner.burnt = false;
    burner.over = 0;
    audio.pickup();
    return;
  }
  const freeIdx = state.burners.findIndex((b) => !b.item);
  if (freeIdx < 0) {
    addToast(state, 'Kompor penuh — tunggu satu tungku kosong.', 'bad');
    audio.denied();
    return;
  }
  const idx = player.tray.findIndex((it) => {
    if (it.kind === 'plate') return false;
    if (it.state === 'raw' && !INGREDIENTS[it.kind].needsChop && INGREDIENTS[it.kind].needsCook) return true;
    if (it.state === 'chopped' && INGREDIENTS[it.kind].needsCook) return true;
    return false;
  });
  if (idx < 0) {
    addToast(state, 'Kompor: butuh bahan yang siap dimasak.', 'bad');
    audio.denied();
    return;
  }
  const burner = state.burners[freeIdx];
  burner.item = player.tray.splice(idx, 1)[0];
  burner.progress = 0;
  burner.done = false;
  burner.burnt = false;
  burner.over = 0;
  audio.sizzleStart();
}

function usePlateCounter(state, audio) {
  const player = state.player;
  const plate = state.plate;
  const orders = activeOrders(state.orders);
  // Piring yang sudah lengkap: angkat untuk diantar.
  const readyRecipe = orders.find((o) => plateMatchesRecipe(plate.components, recipeById(o.recipeId)));
  if (readyRecipe) {
    if (!trayHasRoom(player)) {
      addToast(state, 'Baki penuh! Kosongkan satu slot dulu.', 'bad');
      audio.denied();
      return;
    }
    player.tray.push({ kind: 'plate', state: 'ready', dish: readyRecipe.recipeId });
    plate.components = [];
    audio.pickup();
    addToast(state, `${recipeById(readyRecipe.recipeId).name} siap diantar!`, 'good');
    return;
  }
  // Tambah satu komponen yang masih dibutuhkan salah satu order.
  const idx = player.tray.findIndex((it) => {
    if (it.kind === 'plate') return false;
    if (!isFullyPrepared(it.kind, it.state)) return false;
    return orders.some((o) => {
      const recipe = recipeById(o.recipeId);
      if (!recipeStillPossible([...plate.components, it], recipe)) return false;
      return recipe.needs.some((n) => n.kind === it.kind && n.state === it.state);
    });
  });
  if (idx < 0) {
    if (plate.components.length > 0) {
      addToast(state, 'Tidak ada bahan di bakimu yang cocok untuk order yang buka. Tekan Q untuk mengosongkan piring.', 'bad');
    } else {
      addToast(state, 'Meja plating: butuh bahan yang sudah diolah sesuai order.', 'bad');
    }
    audio.denied();
    return;
  }
  plate.components.push(player.tray.splice(idx, 1)[0]);
  audio.putDown();
  const doneNow = orders.find((o) => plateMatchesRecipe(plate.components, recipeById(o.recipeId)));
  if (doneNow) {
    audio.ding();
    addToast(state, `${recipeById(doneNow.recipeId).name} lengkap! Angkat piringnya.`, 'good');
  }
}

function useServeWindow(state, audio) {
  const player = state.player;
  const plateIdx = player.tray.findIndex((it) => it.kind === 'plate');
  if (plateIdx < 0) {
    addToast(state, 'Jendela antar: bawa piring hidangan yang sudah lengkap.', 'bad');
    audio.denied();
    return;
  }
  const plateItem = player.tray[plateIdx];
  const order = activeOrders(state.orders)
    .filter((o) => o.recipeId === plateItem.dish)
    .sort((a, b) => a.patience - b.patience)[0];
  if (!order) {
    addToast(state, 'Order hidangan itu sudah tidak ada.', 'bad');
    audio.denied();
    return;
  }
  const value = serveValue(order, state.streak);
  state.score += value;
  state.coins += value;
  state.served += 1;
  state.streak += 1;
  order.state = 'served';
  player.tray.splice(plateIdx, 1);
  const center = { x: 906, y: 310 };
  spawnParticles(state, center.x, center.y, '#ffd76a', 16);
  audio.serve();
  addToast(state, `Terantar! +${value} koin (beruntun x${state.streak})`, 'good');
}

function useTrash(state, audio) {
  const player = state.player;
  if (player.tray.length === 0) {
    addToast(state, 'Bakimu kosong, tidak ada yang dibuang.', 'bad');
    audio.denied();
    return;
  }
  const dropped = player.tray.pop();
  if (dropped.kind === 'plate') {
    addToast(state, 'Piring dibuang. Sayang sekali!', 'bad');
  } else {
    addToast(state, `${INGREDIENTS[dropped.kind].name} dibuang.`, 'info');
  }
  audio.putDown();
}

// Dipanggil saat pemain menekan tombol interaksi di dekat sebuah stasiun.
export function interact(state, station, audio) {
  if (!station) return;
  switch (station.kind) {
    case 'crate': takeFromCrate(state, station, audio); break;
    case 'board': useBoard(state, audio); break;
    case 'stove': useStove(state, audio); break;
    case 'plate': usePlateCounter(state, audio); break;
    case 'serve': useServeWindow(state, audio); break;
    case 'trash': useTrash(state, audio); break;
    default: break;
  }
}

// Kosongkan isi piring (tombol Q di dekat meja plating).
export function clearPlate(state, audio) {
  if (state.plate.components.length === 0) return;
  state.plate.components = [];
  addToast(state, 'Piring dikosongkan.', 'info');
  audio.putDown();
}

// Memajukan potongan di talenan dan masakan di kompor setiap frame.
export function updateStations(state, dt, audio) {
  const board = state.board;
  if (board.item && !board.done) {
    const near = stationById('board');
    const dx = state.player.x - (near.x + near.w / 2);
    const dy = state.player.y - (near.y + near.h / 2);
    if (Math.hypot(dx, dy) < 120) {
      board.progress += dt / CHOP_SECONDS;
      if (Math.random() < dt * 3) audio.chop();
      if (board.progress >= 1) {
        board.progress = 1;
        board.done = true;
        board.item.state = nextPrepState(board.item.kind, board.item.state);
        audio.chopDone();
      }
    }
  }
  for (const burner of state.burners) {
    if (!burner.item) continue;
    if (!burner.done) {
      burner.progress += dt / COOK_SECONDS;
      if (burner.progress >= 1) {
        burner.progress = 1;
        burner.done = true;
        burner.item.state = nextPrepState(burner.item.kind, burner.item.state);
        burner.over = 0;
        audio.ding();
      }
    } else if (!burner.burnt) {
      burner.over += dt;
      if (burner.over >= BURN_AFTER_SECONDS) {
        burner.burnt = true;
        burner.item.state = 'burnt';
        addToast(state, 'Gosong! Angkat dan buang ke tempat sampah.', 'bad');
        audio.miss();
      }
    }
  }
}
