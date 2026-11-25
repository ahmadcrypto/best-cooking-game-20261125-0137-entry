// render.js — menggambar semuanya di canvas: lantai dapur, stasiun, bahan,
// koki, papan order, timer, baki, dan layar menu / akhir shift.

import { INGREDIENTS, recipeById } from './items.js';
import { FLOOR_BOTTOM, FLOOR_LEFT, FLOOR_RIGHT, FLOOR_TOP, HUD_H, STATIONS, VIEW_H, VIEW_W, stationCenter } from './world.js';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawProgressBar(ctx, x, y, w, h, frac, color) {
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  roundRect(ctx, x, y, w, h, h / 2);
  ctx.fill();
  ctx.fillStyle = color;
  const inner = Math.max(0, Math.min(1, frac));
  if (inner > 0) {
    roundRect(ctx, x + 1, y + 1, (w - 2) * inner, h - 2, (h - 2) / 2);
    ctx.fill();
  }
}

function drawIngredientIcon(ctx, kind, state, x, y, size) {
  const def = INGREDIENTS[kind];
  ctx.font = `${size}px "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(def.icon, x, y);
  if (state === 'burnt') {
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.beginPath();
    ctx.arc(x, y, size * 0.42, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${Math.round(size * 0.42)}px sans-serif`;
    ctx.fillText('✕', x, y);
  }
}

function drawFloor(ctx) {
  ctx.fillStyle = '#3a2417';
  ctx.fillRect(0, HUD_H, VIEW_W, VIEW_H - HUD_H);
  const tile = 48;
  for (let ty = FLOOR_TOP; ty < FLOOR_BOTTOM; ty += tile) {
    for (let tx = FLOOR_LEFT; tx < FLOOR_RIGHT; tx += tile) {
      const even = ((tx / tile) + (ty / tile)) % 2 === 0;
      ctx.fillStyle = even ? '#4a2f1d' : '#43301f';
      ctx.fillRect(tx, ty, tile - 1, tile - 1);
    }
  }
  // Karpet lorong tengah tempat koki mondar-mandir.
  ctx.fillStyle = 'rgba(214, 164, 90, 0.16)';
  roundRect(ctx, 120, 300, VIEW_W - 240, 130, 12);
  ctx.fill();
}

const STATION_COLORS = {
  crate: '#7a5230',
  board: '#a9805a',
  stove: '#5d5d6e',
  plate: '#e8e0cc',
  serve: '#c98f2d',
  trash: '#4c4c55',
};

function drawStation(ctx, st, state, now) {
  const highlighted = state.nearStation && state.nearStation.id === st.id;
  ctx.fillStyle = STATION_COLORS[st.kind] || '#666';
  roundRect(ctx, st.x, st.y, st.w, st.h, 8);
  ctx.fill();
  ctx.strokeStyle = highlighted ? '#ffd76a' : 'rgba(0,0,0,0.5)';
  ctx.lineWidth = highlighted ? 3 : 2;
  ctx.stroke();
  const c = stationCenter(st);
  // Ikon + label umum; kompor dan talenan yang sedang dipakai menggambar
  // isinya sendiri supaya tidak saling menumpuk.
  const busyBoard = st.kind === 'board' && state.board.item;
  if (st.kind === 'stove') {
    ctx.fillStyle = '#cfd2e0';
    ctx.font = 'bold 11px "Trebuchet MS", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🔥 ' + st.label, c.x, st.y + 9);
  } else if (busyBoard) {
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px "Trebuchet MS", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(st.label, c.x, st.y + 9);
  } else {
    ctx.font = '26px "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(st.icon, c.x, c.y - 8);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px "Trebuchet MS", sans-serif';
    ctx.fillText(st.label, c.x, c.y + 16);
  }

  if (st.kind === 'stove') {
    state.burners.forEach((burner, i) => {
      const bx = st.x + 34 + i * 100;
      const by = st.y + 48;
      ctx.fillStyle = burner.item ? '#222' : 'rgba(0,0,0,0.35)';
      ctx.beginPath();
      ctx.arc(bx, by, 22, 0, Math.PI * 2);
      ctx.fill();
      if (burner.item) {
        if (!burner.done) {
          ctx.fillStyle = '#ff9a3d';
          ctx.beginPath();
          ctx.arc(bx, by, 12 + Math.sin(now * 9 + i * 2) * 3, 0, Math.PI * 2);
          ctx.fill();
        }
        drawIngredientIcon(ctx, burner.item.kind, burner.item.state, bx, by - 2, 24);
        if (!burner.done) {
          drawProgressBar(ctx, bx - 20, by + 20, 40, 6, burner.progress, '#ff9a3d');
        } else {
          // Lencana status di sudut kanan atas tungku: ✓ matang, ✕ gosong.
          ctx.fillStyle = burner.burnt ? '#ff5a4d' : '#2f9e44';
          ctx.beginPath();
          ctx.arc(bx + 15, by - 15, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 10px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(burner.burnt ? '✕' : '✓', bx + 15, by - 15);
        }
      }
    });
  }

  if (st.kind === 'board' && state.board.item) {
    const bx = c.x;
    const by = c.y - 4;
    drawIngredientIcon(ctx, state.board.item.kind, state.board.item.state, bx, by, 30);
    if (!state.board.done) {
      drawProgressBar(ctx, bx - 32, by + 22, 64, 7, state.board.progress, '#ffd76a');
    } else {
      ctx.fillStyle = '#7dff8a';
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText('SIAP ✓', bx, by + 30);
    }
  }

  if (st.kind === 'plate') {
    const comps = state.plate.components;
    comps.forEach((comp, i) => {
      const px = st.x + 26 + i * 34;
      const py = c.y - 4;
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.beginPath();
      ctx.arc(px, py, 15, 0, Math.PI * 2);
      ctx.fill();
      drawIngredientIcon(ctx, comp.kind, comp.state, px, py, 20);
    });
    if (comps.length === 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.beginPath();
      ctx.arc(c.x, c.y - 4, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#8a7a5a';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('piring kosong', c.x, st.y + st.h - 8);
    }
  }
}

function drawPlayer(ctx, state, now) {
  const p = state.player;
  const bob = Math.sin(now * 10) * (p.moving ? 1.5 : 0);
  // Bayangan.
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(p.x, p.y + 14, 16, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  // Badan koki.
  ctx.fillStyle = '#f2f2f2';
  ctx.beginPath();
  ctx.arc(p.x, p.y + bob, p.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#c9c9c9';
  ctx.lineWidth = 2;
  ctx.stroke();
  // Topi koki.
  ctx.fillStyle = '#ffffff';
  roundRect(ctx, p.x - 13, p.y - 26 + bob, 26, 12, 6);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(p.x - 7, p.y - 24 + bob, 7, 0, Math.PI * 2);
  ctx.arc(p.x + 7, p.y - 24 + bob, 7, 0, Math.PI * 2);
  ctx.fill();
  // Wajah.
  ctx.fillStyle = '#2b2b2b';
  ctx.beginPath();
  ctx.arc(p.x - 5, p.y - 2 + bob, 2, 0, Math.PI * 2);
  ctx.arc(p.x + 5, p.y - 2 + bob, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#2b2b2b';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(p.x, p.y + 3 + bob, 5, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();
  // Baki yang dibawa: ikon bahan di atas kepala. Piring yang sudah lengkap
  // digambar lebih besar dengan cincin hijau supaya terbaca sebagai hidangan
  // siap antar.
  p.tray.forEach((item, i) => {
    const ix = p.x + (i - (p.tray.length - 1) / 2) * 22;
    const iy = p.y - 40 + bob;
    if (item.kind === 'plate') {
      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      ctx.beginPath();
      ctx.arc(ix, iy, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#7dff8a';
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.font = '20px "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🍽️', ix, iy);
      return;
    }
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.beginPath();
    ctx.arc(ix, iy, 11, 0, Math.PI * 2);
    ctx.fill();
    drawIngredientIcon(ctx, item.kind, item.state, ix, iy, 15);
  });
}

function drawParticles(ctx, state, dt) {
  for (const pt of state.particles) {
    ctx.globalAlpha = Math.max(0, pt.ttl / pt.maxTtl);
    ctx.fillStyle = pt.color;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawOrderBoard(ctx, state) {
  ctx.fillStyle = '#241407';
  ctx.fillRect(0, 0, VIEW_W, HUD_H);
  ctx.fillStyle = '#ffd76a';
  ctx.font = 'bold 13px "Trebuchet MS", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('📋 PAPAN ORDER', 14, 16);
  const orders = state.orders.filter((o) => o.state === 'active');
  orders.forEach((order, i) => {
    const recipe = recipeById(order.recipeId);
    const x = 14 + i * 196;
    const y = 28;
    const w = 186;
    const h = 64;
    const urgent = order.patience < 12;
    ctx.fillStyle = urgent && Math.floor(performance.now() / 300) % 2 === 0 ? '#5a1f16' : '#3d2a18';
    roundRect(ctx, x, y, w, h, 8);
    ctx.fill();
    ctx.strokeStyle = urgent ? '#ff5a4d' : '#8a6a3a';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.font = '22px "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(recipe.icon, x + 8, y + 20);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px "Trebuchet MS", sans-serif';
    ctx.fillText(recipe.name, x + 38, y + 12);
    ctx.font = '11px "Trebuchet MS", sans-serif';
    ctx.fillStyle = '#e8d9b0';
    const needText = recipe.needs.map((n) => INGREDIENTS[n.kind].icon).join(' + ');
    ctx.fillText(needText, x + 38, y + 30);
    const frac = order.patience / order.maxPatience;
    drawProgressBar(ctx, x + 8, y + 48, w - 16, 8, frac, frac > 0.5 ? '#7dc383' : frac > 0.25 ? '#ffb84d' : '#ff5a4d');
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`${Math.ceil(order.patience)} dtk`, x + w - 8, y + 52);
    ctx.textAlign = 'left';
  });
  if (orders.length === 0) {
    ctx.fillStyle = '#c9b48a';
    ctx.font = '13px "Trebuchet MS", sans-serif';
    ctx.fillText('Belum ada order — pelanggan pertama segera datang…', 150, 60);
  }
  // Timer shift + skor di kanan.
  const remaining = Math.max(0, state.shiftLength - state.time);
  const mm = Math.floor(remaining / 60);
  const ss = Math.floor(remaining % 60).toString().padStart(2, '0');
  ctx.textAlign = 'right';
  ctx.fillStyle = remaining < 30 ? '#ff8a7a' : '#fff';
  ctx.font = 'bold 26px "Trebuchet MS", sans-serif';
  ctx.fillText(`⏱ ${mm}:${ss}`, VIEW_W - 16, 26);
  ctx.fillStyle = '#ffd76a';
  ctx.font = 'bold 15px "Trebuchet MS", sans-serif';
  ctx.fillText(`🪙 ${state.coins}   ★ ${state.score}`, VIEW_W - 16, 54);
  ctx.fillStyle = '#c9b48a';
  ctx.font = '12px "Trebuchet MS", sans-serif';
  ctx.fillText(`Terantar ${state.served} • Lewat ${state.missed} • Beruntun x${state.streak}`, VIEW_W - 16, 96);
}

function drawTrayBar(ctx, state) {
  const y = VIEW_H - 34;
  ctx.fillStyle = 'rgba(20,10,5,0.72)';
  roundRect(ctx, 12, y, 300, 26, 8);
  ctx.fill();
  ctx.fillStyle = '#e8d9b0';
  ctx.font = 'bold 12px "Trebuchet MS", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('BAKI (maks 3):', 22, y + 13);
  for (let i = 0; i < 3; i++) {
    const sx = 130 + i * 44;
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 1.5;
    roundRect(ctx, sx, y + 3, 38, 20, 5);
    ctx.stroke();
    const item = state.player.tray[i];
    if (item) {
      if (item.kind === 'plate') {
        ctx.font = '15px "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🍽️', sx + 19, y + 13);
      } else {
        drawIngredientIcon(ctx, item.kind, item.state, sx + 19, y + 13, 15);
      }
    }
  }
  ctx.textAlign = 'right';
  ctx.fillStyle = '#c9b48a';
  ctx.font = '12px "Trebuchet MS", sans-serif';
  ctx.fillText('WASD/←↑→↓ gerak • E / klik: pakai stasiun • Q: kosongkan piring • P: jeda • M: bisu', VIEW_W - 14, y + 13);
  ctx.textAlign = 'left';
}

function drawToasts(ctx, state) {
  let y = HUD_H + 16;
  for (const toast of state.toasts) {
    ctx.globalAlpha = Math.min(1, toast.ttl);
    ctx.fillStyle = toast.kind === 'good' ? '#2f7a3d' : toast.kind === 'bad' ? '#8a2f24' : '#3d2a18';
    const w = Math.min(520, 14 + ctx.measureText(toast.text).width + 24);
    roundRect(ctx, (VIEW_W - w) / 2, y, w, 26, 8);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 13px "Trebuchet MS", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(toast.text, VIEW_W / 2, y + 13);
    y += 32;
  }
  ctx.globalAlpha = 1;
}

function drawInteractHint(ctx, state) {
  const st = state.nearStation;
  if (!st || state.mode !== 'playing') return;
  const c = stationCenter(st);
  ctx.fillStyle = 'rgba(20,10,5,0.85)';
  const label = `E: ${st.label}`;
  const w = 14 + ctx.measureText(label).width + 20;
  roundRect(ctx, c.x - w / 2, st.y - 30, w, 22, 7);
  ctx.fill();
  ctx.fillStyle = '#ffd76a';
  ctx.font = 'bold 12px "Trebuchet MS", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, c.x, st.y - 19);
}

function drawMenu(ctx, state) {
  ctx.fillStyle = 'rgba(15,8,3,0.78)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd76a';
  ctx.font = 'bold 44px "Trebuchet MS", sans-serif';
  ctx.fillText('🍳 WARUNG SENJA', VIEW_W / 2, 130);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 22px "Trebuchet MS", sans-serif';
  ctx.fillText('Dapur Kilat', VIEW_W / 2, 168);
  ctx.fillStyle = '#e8d9b0';
  ctx.font = '15px "Trebuchet MS", sans-serif';
  const lines = [
    'Kamu koki satu-satunya di warung senja. Pelanggan memesan, kamu yang meracik.',
    'Ambil bahan dari peti, potong di talenan, masak di kompor, rakit di meja plating,',
    'lalu antar ke jendela sebelum kesabaran pelanggan habis. Satu shift: 3 menit.',
    '',
    '🍚 Nasi dimasak • 🍗 Ayam dipotong lalu dimasak • 🥬 Sayur dipotong',
    '🥚 Telur dimasak • 🌶️ Sambal langsung siap • Awas gosong di kompor!',
    '',
    'Gerak: WASD / panah    •    Pakai stasiun: E / spasi / klik',
    'Kosongkan piring: Q    •    Jeda: P    •    Bisu: M',
  ];
  lines.forEach((line, i) => ctx.fillText(line, VIEW_W / 2, 210 + i * 24));
  const pulse = 0.6 + Math.sin(performance.now() / 300) * 0.4;
  ctx.globalAlpha = pulse;
  ctx.fillStyle = '#7dff8a';
  ctx.font = 'bold 20px "Trebuchet MS", sans-serif';
  ctx.fillText('▶  Klik atau tekan Enter untuk mulai masak', VIEW_W / 2, 500);
  ctx.globalAlpha = 1;
}

function drawPaused(ctx) {
  ctx.fillStyle = 'rgba(15,8,3,0.6)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 34px "Trebuchet MS", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('⏸ JEDA — tekan P untuk lanjut', VIEW_W / 2, VIEW_H / 2);
}

function drawGameOver(ctx, state) {
  ctx.fillStyle = 'rgba(15,8,3,0.82)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd76a';
  ctx.font = 'bold 38px "Trebuchet MS", sans-serif';
  ctx.fillText('🌇 Shift Selesai!', VIEW_W / 2, 150);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 24px "Trebuchet MS", sans-serif';
  ctx.fillText(`Skor akhir: ${state.score}  •  Koin: ${state.coins}`, VIEW_W / 2, 210);
  ctx.font = '18px "Trebuchet MS", sans-serif';
  ctx.fillStyle = '#e8d9b0';
  ctx.fillText(`Hidangan terantar: ${state.served}   •   Order lewat: ${state.missed}`, VIEW_W / 2, 250);
  const verdict = state.served >= 12
    ? '🏆 Koki Bintang Lima! Warungmu ramai sampai malam.'
    : state.served >= 7
      ? '👍 Lumayan! Dapurmu sudah panas, tinggal lebih cepat sedikit.'
      : '💪 Terus latihan — pelanggan senja tidak sabar menunggu.';
  ctx.fillText(verdict, VIEW_W / 2, 290);
  const pulse = 0.6 + Math.sin(performance.now() / 300) * 0.4;
  ctx.globalAlpha = pulse;
  ctx.fillStyle = '#7dff8a';
  ctx.font = 'bold 20px "Trebuchet MS", sans-serif';
  ctx.fillText('Tekan R atau klik untuk main lagi', VIEW_W / 2, 360);
  ctx.globalAlpha = 1;
}

export function render(ctx, state, now) {
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  drawOrderBoard(ctx, state);
  drawFloor(ctx);
  for (const st of STATIONS) drawStation(ctx, st, state, now);
  drawPlayer(ctx, state, now);
  drawParticles(ctx, state, 0);
  drawTrayBar(ctx, state);
  drawToasts(ctx, state);
  drawInteractHint(ctx, state);
  if (state.mode === 'menu') drawMenu(ctx, state);
  if (state.mode === 'paused') drawPaused(ctx);
  if (state.mode === 'over') drawGameOver(ctx, state);
}
