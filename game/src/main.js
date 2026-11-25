// main.js — titik masuk game: keadaan permainan, loop utama, gerak koki,
// kemunculan order, dan akhir shift. Menghubungkan input, interaksi,
// stasiun, order, audio, dan render.

import { createAudio } from './audio.js';
import { createInput } from './input.js';
import { clearPlate, interact, updateStations } from './interact.js';
import { activeOrders, createOrder, spawnIntervalAt, tickOrders } from './orders.js';
import { render } from './render.js';
import { applyPose, poseFromUrl } from './shots.js';
import { VIEW_H, VIEW_W, nearestStationInRange, resolvePlayerCollision, spawnPoint } from './world.js';

const SHIFT_LENGTH = 180;
const PLAYER_SPEED = 230;
const PLAYER_RADIUS = 16;

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const input = createInput(canvas);
const audio = createAudio();

function createFreshState() {
  const spawn = spawnPoint();
  return {
    mode: 'menu',
    time: 0,
    shiftLength: SHIFT_LENGTH,
    score: 0,
    coins: 0,
    served: 0,
    missed: 0,
    streak: 0,
    player: { x: spawn.x, y: spawn.y, radius: PLAYER_RADIUS, moving: false, tray: [] },
    board: { item: null, progress: 0, done: false },
    burners: [
      { item: null, progress: 0, done: false, burnt: false, over: 0 },
      { item: null, progress: 0, done: false, burnt: false, over: 0 },
    ],
    plate: { components: [] },
    orders: [],
    spawnTimer: 12,
    particles: [],
    toasts: [],
    nearStation: null,
  };
}

let state = createFreshState();

function startShift() {
  state = createFreshState();
  state.mode = 'playing';
  state.orders.push(createOrder(0, Math.random));
  state.spawnTimer = spawnIntervalAt(0);
  audio.unlock();
  audio.newOrder();
}

function updateParticles(dt) {
  for (const pt of state.particles) {
    pt.ttl -= dt;
    pt.x += pt.vx * dt;
    pt.y += pt.vy * dt;
    pt.vy += 60 * dt;
  }
  state.particles = state.particles.filter((pt) => pt.ttl > 0);
}

function updateToasts(dt) {
  for (const toast of state.toasts) toast.ttl -= dt;
  state.toasts = state.toasts.filter((t) => t.ttl > 0);
}

function updatePlaying(dt) {
  state.time += dt;

  // Gerak koki.
  const mv = input.moveVector();
  const p = state.player;
  p.moving = mv.x !== 0 || mv.y !== 0;
  p.x += mv.x * PLAYER_SPEED * dt;
  p.y += mv.y * PLAYER_SPEED * dt;
  resolvePlayerCollision(p);

  state.nearStation = nearestStationInRange(p.x, p.y, p.radius);

  // Interaksi: E / spasi / klik.
  if (input.wasPressed('e') || input.wasPressed(' ') || input.mouse.clicked) {
    audio.unlock();
    if (state.nearStation) interact(state, state.nearStation, audio);
  }
  if (input.wasPressed('q') && state.nearStation && state.nearStation.kind === 'plate') {
    clearPlate(state, audio);
  }

  updateStations(state, dt, audio);

  // Order baru muncul makin cepat seiring shift berjalan.
  state.spawnTimer -= dt;
  if (state.spawnTimer <= 0) {
    if (activeOrders(state.orders).length < 4) {
      state.orders.push(createOrder(state.time, Math.random));
      audio.newOrder();
    }
    state.spawnTimer = spawnIntervalAt(state.time);
  }

  // Kesabaran pelanggan menipis; yang habis dianggap lewat.
  const expired = tickOrders(state.orders, dt);
  for (const order of expired) {
    state.missed += 1;
    state.streak = 0;
    state.score = Math.max(0, state.score - 5);
    state.toasts.push({ text: `Order ${order.recipeId} lewat! −5 poin`, kind: 'bad', ttl: 2.2 });
    audio.miss();
  }
  state.orders = state.orders.filter((o) => o.state === 'active');

  updateParticles(dt);
  updateToasts(dt);

  if (state.time >= state.shiftLength) {
    state.mode = 'over';
    state.orders = [];
    audio.ding();
  }
}

let lastTime = performance.now();

function frame(now) {
  const dt = Math.min(0.05, Math.max(0, (now - lastTime) / 1000));
  lastTime = now;

  if (input.wasPressed('m')) {
    const muted = audio.toggleMute();
    state.toasts.push({ text: muted ? 'Suara dimatikan.' : 'Suara dinyalakan.', kind: 'info', ttl: 1.5 });
  }

  if (state.mode === 'menu') {
    if (input.wasPressed('Enter') || input.mouse.clicked) {
      audio.click();
      startShift();
    }
  } else if (state.mode === 'playing') {
    if (input.wasPressed('p')) {
      state.mode = 'paused';
    } else {
      updatePlaying(dt);
    }
  } else if (state.mode === 'paused') {
    if (input.wasPressed('p')) {
      state.mode = 'playing';
    }
  } else if (state.mode === 'over') {
    if (input.wasPressed('r') || input.wasPressed('Enter') || input.mouse.clicked) {
      audio.click();
      startShift();
    }
  }

  render(ctx, state, now / 1000);
  input.endFrame();
  requestAnimationFrame(frame);
}

// Pose screenshot (?pose=cover|play|serve|rush): tata panggung lalu main.
const pose = poseFromUrl();
if (pose) {
  state = createFreshState();
  state.mode = 'playing';
  applyPose(state, pose);
}

// Hook baca-saja untuk alat uji otomatis (tidak mengubah game).
window.__warung = { state: () => state };

requestAnimationFrame(frame);
