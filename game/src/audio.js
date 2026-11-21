// audio.js — all sound is synthesized live with WebAudio. No audio files.
let ctx = null;
let muted = false;
let humNodes = null;

export function ensureAudio() {
  if (!ctx) {
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ctx = null; }
  }
  if (ctx && ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export function toggleMute() {
  muted = !muted;
  if (humNodes) { try { humNodes.gain.gain.value = muted ? 0 : 0.015; } catch (e) {} }
  return muted;
}
export function isMuted() { return muted; }

function tone(freq, dur, type, vol, slideTo) {
  if (muted) return;
  const c = ensureAudio();
  if (!c) return;
  const t = c.currentTime;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type || 'sine';
  o.frequency.setValueAtTime(freq, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  g.gain.setValueAtTime(vol || 0.08, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(c.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

function noiseBurst(dur, vol, lowpass) {
  if (muted) return;
  const c = ensureAudio();
  if (!c) return;
  const len = Math.floor(c.sampleRate * dur);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = c.createBufferSource();
  src.buffer = buf;
  const f = c.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.value = lowpass || 1200;
  const g = c.createGain();
  g.gain.value = vol || 0.1;
  src.connect(f).connect(g).connect(c.destination);
  src.start();
}

export const sfx = {
  step(quiet) { tone(90 + Math.random() * 30, 0.06, 'triangle', quiet ? 0.015 : 0.035); },
  coin() { tone(1320, 0.09, 'sine', 0.09); setTimeout(() => tone(1760, 0.14, 'sine', 0.09), 70); },
  coinLand() { tone(2200, 0.05, 'square', 0.05); noiseBurst(0.05, 0.05, 3000); },
  smoke() { noiseBurst(0.5, 0.16, 900); },
  whistle() { tone(2400, 0.12, 'sine', 0.09, 1800); setTimeout(() => tone(2400, 0.12, 'sine', 0.09, 1800), 160); },
  pickup() { tone(660, 0.08, 'sine', 0.1); setTimeout(() => tone(990, 0.12, 'sine', 0.1), 80); setTimeout(() => tone(1320, 0.16, 'sine', 0.09), 160); },
  alert() { tone(520, 0.18, 'sawtooth', 0.09, 780); setTimeout(() => tone(780, 0.22, 'sawtooth', 0.09, 520), 170); },
  spotted() { tone(180, 0.4, 'sawtooth', 0.12, 90); },
  laser() { tone(1400, 0.15, 'square', 0.06, 700); },
  unlock() { tone(440, 0.1, 'sine', 0.1); setTimeout(() => tone(554, 0.1, 'sine', 0.1), 100); setTimeout(() => tone(659, 0.1, 'sine', 0.1), 200); setTimeout(() => tone(880, 0.25, 'sine', 0.1), 300); },
  win() { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, 0.3, 'triangle', 0.1), i * 130)); },
  lose() { [392, 330, 262, 196].forEach((f, i) => setTimeout(() => tone(f, 0.3, 'triangle', 0.09), i * 150)); },
  click() { tone(800, 0.05, 'square', 0.05); },
  camera() { tone(1200, 0.04, 'square', 0.03); },
};

export function startHum() {
  const c = ensureAudio();
  if (!c || humNodes) return;
  const o = c.createOscillator();
  o.type = 'sine';
  o.frequency.value = 55;
  const g = c.createGain();
  g.gain.value = muted ? 0 : 0.015;
  o.connect(g).connect(c.destination);
  o.start();
  humNodes = { osc: o, gain: g };
}
