// audio.js — semua bunyi game dari oscillator WebAudio saja, tanpa file.
// Bunyi dibuat saat pertama kali pemain berinteraksi (browser butuh gestur).

export function createAudio() {
  let ctx = null;
  let muted = false;

  function ensureContext() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  }

  function tone(freq, dur, type, vol, when = 0, slideTo = null) {
    if (muted) return;
    const ac = ensureContext();
    if (!ac) return;
    const t0 = ac.currentTime + when;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo !== null) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(ac.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  return {
    unlock() {
      ensureContext();
    },
    toggleMute() {
      muted = !muted;
      return muted;
    },
    isMuted() {
      return muted;
    },
    pickup() {
      tone(520, 0.09, 'sine', 0.12, 0, 760);
    },
    putDown() {
      tone(340, 0.08, 'sine', 0.1, 0, 240);
    },
    chop() {
      tone(190, 0.06, 'square', 0.07);
      tone(150, 0.05, 'square', 0.05, 0.07);
    },
    chopDone() {
      tone(660, 0.1, 'triangle', 0.12);
      tone(880, 0.12, 'triangle', 0.12, 0.09);
    },
    sizzleStart() {
      tone(1200, 0.25, 'sawtooth', 0.03, 0, 900);
    },
    ding() {
      tone(1180, 0.35, 'sine', 0.14);
      tone(1560, 0.3, 'sine', 0.1, 0.08);
    },
    serve() {
      tone(523, 0.12, 'triangle', 0.14);
      tone(659, 0.12, 'triangle', 0.14, 0.1);
      tone(784, 0.22, 'triangle', 0.16, 0.2);
    },
    miss() {
      tone(220, 0.3, 'sawtooth', 0.09, 0, 140);
    },
    newOrder() {
      tone(880, 0.08, 'sine', 0.08);
      tone(1108, 0.1, 'sine', 0.08, 0.08);
    },
    denied() {
      tone(160, 0.12, 'square', 0.06);
    },
    click() {
      tone(700, 0.05, 'sine', 0.08);
    },
  };
}
