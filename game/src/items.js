// items.js — bahan, rantai olah (mentah -> potong -> masak) dan resep hidangan.
// Satu-satunya tempat yang tahu apa yang bisa diolah jadi apa.

export const INGREDIENTS = {
  nasi:   { name: 'Nasi',   icon: '🍚', color: '#f5f0dc', needsChop: false, needsCook: true },
  ayam:   { name: 'Ayam',   icon: '🍗', color: '#e8a06a', needsChop: true,  needsCook: true },
  sayur:  { name: 'Sayur',  icon: '🥬', color: '#7dc383', needsChop: true,  needsCook: false },
  telur:  { name: 'Telur',  icon: '🥚', color: '#f7e8b0', needsChop: false, needsCook: true },
  sambal: { name: 'Sambal', icon: '🌶️', color: '#d94f3d', needsChop: false, needsCook: false },
};

// Keadaan olahan sebuah bahan: 'raw' -> 'chopped' -> 'cooked'.
// 'ready' dipakai untuk bahan yang tidak butuh olahan sama sekali (sambal).
export function nextPrepState(kind, state) {
  const def = INGREDIENTS[kind];
  if (state === 'raw' && def.needsChop) return 'chopped';
  if ((state === 'raw' && !def.needsChop && def.needsCook) || (state === 'chopped' && def.needsCook)) return 'cooked';
  if (state === 'raw' && !def.needsChop && !def.needsCook) return 'ready';
  return state;
}

export function isFullyPrepared(kind, state) {
  const def = INGREDIENTS[kind];
  if (!def.needsChop && !def.needsCook) return state === 'ready' || state === 'raw';
  if (def.needsChop && def.needsCook) return state === 'cooked';
  if (def.needsChop) return state === 'chopped';
  return state === 'cooked';
}

// Label singkat keadaan olahan untuk digambar di atas bahan.
export function prepLabel(kind, state) {
  if (state === 'raw') return INGREDIENTS[kind].needsChop ? 'mentah' : 'mentah';
  if (state === 'chopped') return 'potong';
  if (state === 'cooked') return 'masak';
  return 'siap';
}

export const RECIPES = [
  {
    id: 'nasi-goreng',
    name: 'Nasi Goreng',
    icon: '🍛',
    color: '#e0a458',
    needs: [
      { kind: 'nasi', state: 'cooked' },
      { kind: 'telur', state: 'cooked' },
      { kind: 'sayur', state: 'chopped' },
    ],
  },
  {
    id: 'ayam-geprek',
    name: 'Ayam Geprek',
    icon: '🍗',
    color: '#d97b4f',
    needs: [
      { kind: 'ayam', state: 'cooked' },
      { kind: 'sambal', state: 'ready' },
    ],
  },
  {
    id: 'sup-sayur',
    name: 'Sup Sayur',
    icon: '🍲',
    color: '#8fbf7f',
    needs: [
      { kind: 'sayur', state: 'chopped' },
      { kind: 'telur', state: 'cooked' },
    ],
  },
  {
    id: 'nasi-ayam',
    name: 'Nasi Ayam Bakar',
    icon: '🍽️',
    color: '#e8b04b',
    needs: [
      { kind: 'nasi', state: 'cooked' },
      { kind: 'ayam', state: 'cooked' },
    ],
  },
  {
    id: 'telur-sambal',
    name: 'Telur Sambal',
    icon: '🍳',
    color: '#e07840',
    needs: [
      { kind: 'telur', state: 'cooked' },
      { kind: 'sambal', state: 'ready' },
    ],
  },
  {
    id: 'nasi-sayur',
    name: 'Nasi Sayur',
    icon: '🥗',
    color: '#a8c686',
    needs: [
      { kind: 'nasi', state: 'cooked' },
      { kind: 'sayur', state: 'chopped' },
    ],
  },
];

export function recipeById(id) {
  return RECIPES.find((r) => r.id === id) || null;
}

// Apakah komponen piring ini persis sama (multiset) dengan resep?
export function plateMatchesRecipe(plateComponents, recipe) {
  if (plateComponents.length !== recipe.needs.length) return false;
  const wanted = recipe.needs.map((n) => `${n.kind}:${n.state}`).sort().join('|');
  const got = plateComponents.map((c) => `${c.kind}:${c.state}`).sort().join('|');
  return wanted === got;
}

// Resep mana saja yang masih mungkin dilengkapi dari komponen piring ini?
export function recipeStillPossible(plateComponents, recipe) {
  const pool = recipe.needs.map((n) => `${n.kind}:${n.state}`);
  for (const c of plateComponents) {
    const key = `${c.kind}:${c.state}`;
    const i = pool.indexOf(key);
    if (i < 0) return false;
    pool.splice(i, 1);
  }
  return true;
}
