// Warung Senja — Dapur Kilat: program penyerahan entry (Node 22, standard library saja).
// Menyalin game/ dan screenshots/ dari samping file ini ke /output (atau
// MAKEFUN_OUTPUT_DIR di luar grader) lalu menulis /output/dossier.json dengan
// buildDossier dari vendor/makefun-game.ts. Dua kali jalan harus byte-identik.
//
// Uji lokal: mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Gagal dengan jelas bila salah satu masukan hilang, supaya dua run tidak
// pernah menghasilkan /output yang diam-diam tidak lengkap.
for (const needed of ['game', 'screenshots']) {
  if (!existsSync(join(here, needed))) {
    throw new Error(`folder ${needed}/ tidak ditemukan di samping main.ts`);
  }
}

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// Batas yang dipakai scorer: teks dossier maks 160 KiB, maks 4 screenshot @256 KiB,
// game/ maks 993 file dan 48 MiB, tiap path maks 1000 byte.
const dossier = buildDossier(out, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(out, 'dossier.json'), dossier);

// Ringkasan deterministik (tanpa waktu): satu baris yang sama di tiap run.
console.log(`warung-senja: dossier ${dossier.length} byte ditulis ke ${out}`);
