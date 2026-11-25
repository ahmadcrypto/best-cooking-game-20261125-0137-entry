// world.js — denah dapur: lantai, meja, dan semua stasiun kerja.
// Satu-satunya tempat yang tahu di mana letak peti bahan, talenan, kompor,
// meja plating, jendela antar, dan tempat sampah.

export const VIEW_W = 960;
export const VIEW_H = 600;
export const HUD_H = 104;
export const FLOOR_TOP = HUD_H + 8;
export const FLOOR_BOTTOM = VIEW_H - 8;
export const FLOOR_LEFT = 8;
export const FLOOR_RIGHT = VIEW_W - 8;

// Setiap stasiun: persegi panjang penghalang + titik interaksi di tepinya.
export const STATIONS = [
  { id: 'crate-nasi',   kind: 'crate',  label: 'Nasi',   icon: '🍚', x: 16,  y: 128, w: 76, h: 62, gives: 'nasi' },
  { id: 'crate-ayam',   kind: 'crate',  label: 'Ayam',   icon: '🍗', x: 16,  y: 198, w: 76, h: 62, gives: 'ayam' },
  { id: 'crate-sayur',  kind: 'crate',  label: 'Sayur',  icon: '🥬', x: 16,  y: 268, w: 76, h: 62, gives: 'sayur' },
  { id: 'crate-telur',  kind: 'crate',  label: 'Telur',  icon: '🥚', x: 16,  y: 338, w: 76, h: 62, gives: 'telur' },
  { id: 'crate-sambal', kind: 'crate',  label: 'Sambal', icon: '🌶️', x: 16,  y: 408, w: 76, h: 62, gives: 'sambal' },

  { id: 'board', kind: 'board', label: 'Talenan', icon: '🔪', x: 300, y: 128, w: 150, h: 76 },
  { id: 'stove', kind: 'stove', label: 'Kompor',  icon: '🔥', x: 480, y: 128, w: 170, h: 76 },
  { id: 'plate', kind: 'plate', label: 'Meja Plating', icon: '🍽️', x: 680, y: 128, w: 150, h: 76 },

  { id: 'serve', kind: 'serve', label: 'Jendela Antar', icon: '🛎️', x: 868, y: 250, w: 76, h: 120 },
  { id: 'trash', kind: 'trash', label: 'Sampah', icon: '🗑️', x: 868, y: 480, w: 76, h: 62 },
];

export function stationById(id) {
  return STATIONS.find((s) => s.id === id) || null;
}

export function stationCenter(st) {
  return { x: st.x + st.w / 2, y: st.y + st.h / 2 };
}

// Jarak dari pemain (lingkaran) ke tepi stasiun; 0 bila bersentuhan.
export function distanceToStation(px, py, radius, st) {
  const cx = Math.max(st.x, Math.min(px, st.x + st.w));
  const cy = Math.max(st.y, Math.min(py, st.y + st.h));
  const dx = px - cx;
  const dy = py - cy;
  return Math.max(0, Math.hypot(dx, dy) - radius);
}

export const INTERACT_RANGE = 46;

export function nearestStationInRange(px, py, radius) {
  let best = null;
  let bestDist = Infinity;
  for (const st of STATIONS) {
    const d = distanceToStation(px, py, radius, st);
    if (d <= INTERACT_RANGE && d < bestDist) {
      best = st;
      bestDist = d;
    }
  }
  return best;
}

// Dorong pemain keluar dari semua stasiun (penghalang) dan batas lantai.
export function resolvePlayerCollision(player) {
  const r = player.radius;
  player.x = Math.max(FLOOR_LEFT + r, Math.min(FLOOR_RIGHT - r, player.x));
  player.y = Math.max(FLOOR_TOP + r, Math.min(FLOOR_BOTTOM - r, player.y));
  for (const st of STATIONS) {
    const nearestX = Math.max(st.x, Math.min(player.x, st.x + st.w));
    const nearestY = Math.max(st.y, Math.min(player.y, st.y + st.h));
    const dx = player.x - nearestX;
    const dy = player.y - nearestY;
    const distSq = dx * dx + dy * dy;
    if (distSq < r * r) {
      if (distSq === 0) {
        player.y = st.y + st.h + r;
      } else {
        const dist = Math.sqrt(distSq);
        player.x = nearestX + (dx / dist) * r;
        player.y = nearestY + (dy / dist) * r;
      }
    }
  }
}

// Titik awal pemain di tengah dapur.
export function spawnPoint() {
  return { x: VIEW_W / 2, y: 400 };
}
