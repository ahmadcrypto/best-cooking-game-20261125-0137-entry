# Warung Senja — Dapur Kilat

[![bounty](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/ahmadcrypto/best-cooking-game-20261125-0137-entry/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/ahmadcrypto/best-cooking-game-20261125-0137-entry/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)

Game masak 2D orisinal yang jalan offline di desktop browser dari file statis.
Kamu koki satu-satunya di sebuah warung senja: pelanggan memesan lewat papan
order, kamu meracik hidangannya — ambil bahan, potong, masak, rakit di piring —
lalu antar sebelum kesabaran mereka habis. Satu shift berlangsung 3 menit;
order datang makin cepat dan makin kompleks.

## Cara main

- **Ambil bahan** dari peti di dinding kiri: nasi, ayam, sayur, telur, sambal.
- **Potong** bahan mentah di talenan (tetap di dekatnya sampai selesai).
- **Masak** di kompor (2 tungku). Angkat tepat waktu — kalau kelamaan, gosong!
- **Rakit** hidangan di meja plating sesuai resep order yang sedang buka.
- **Antar** piring yang lengkap ke jendela antar. Tip makin besar kalau cepat.
- Baki hanya muat 3 barang. Bahan yang salah bisa dibuang ke tempat sampah.

### Resep

| Hidangan | Bahan |
| --- | --- |
| Nasi Goreng | nasi masak + telur masak + sayur potong |
| Ayam Geprek | ayam masak + sambal |
| Sup Sayur | sayur potong + telur masak |
| Nasi Ayam Bakar | nasi masak + ayam masak |
| Telur Sambal | telur masak + sambal |
| Nasi Sayur | nasi masak + sayur potong |

## Kontrol

- **WASD / panah** — gerak
- **E / spasi / klik** — pakai stasiun terdekat
- **Q** — kosongkan piring (di dekat meja plating)
- **P** — jeda, **M** — bisu, **R** — main lagi setelah shift selesai

## Menjalankan

```sh
node serve.ts   # lalu buka http://localhost:8080
```

Game tidak butuh jaringan sama sekali: semua script, gambar (emoji sistem),
dan suara (oscillator WebAudio) berasal dari file di `game/` atau dibuat
di tempat. Pose `?pose=cover|play|serve|rush` menata panggung untuk screenshot.

## Struktur kode

- `game/index.html` — kanvas + pemuat modul
- `game/src/main.js` — loop utama, keadaan permainan, akhir shift
- `game/src/world.js` — denah dapur dan stasiun
- `game/src/items.js` — bahan, rantai olah, dan resep
- `game/src/orders.js` — papan order, kesabaran, dan skor
- `game/src/interact.js` — aksi di tiap stasiun + progres potong/masak
- `game/src/input.js` — keyboard dan mouse
- `game/src/render.js` — semua gambar di canvas
- `game/src/audio.js` — bunyi dari oscillator WebAudio
- `game/src/shots.js` — pose panggung untuk screenshot
