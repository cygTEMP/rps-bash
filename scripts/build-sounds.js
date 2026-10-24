/**
 * Synthesizes the prototype's sound effects as small WAV files in
 * assets/sounds, so the repo needs no licensed sound pack yet. Re-run with
 * `npm run build:sounds` after changing a sound.
 */
const fs = require('fs');
const path = require('path');

const RATE = 44100;
const OUT = path.join(__dirname, '..', 'assets', 'sounds');

/** A deterministic noise source, so rebuilding gives identical files. */
let seed = 1;
function noise() {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return (seed / 0x7fffffff) * 2 - 1;
}

function render(seconds, sample) {
  const n = Math.round(seconds * RATE);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = sample(i / RATE, i / n);
  return out;
}

function mix(...tracks) {
  const n = Math.max(...tracks.map((t) => t.length));
  const out = new Float32Array(n);
  for (const t of tracks) for (let i = 0; i < t.length; i++) out[i] += t[i];
  return out;
}

function delay(track, seconds) {
  const pad = Math.round(seconds * RATE);
  const out = new Float32Array(track.length + pad);
  out.set(track, pad);
  return out;
}

const sine = (f, t) => Math.sin(2 * Math.PI * f * t);

/** A bell-like note: a few partials with an exponential decay. */
function bell(freq, seconds, decay = 6, gain = 0.5) {
  return render(seconds, (t) => {
    const env = Math.exp(-decay * t) * Math.min(1, t * 400);
    return gain * env * (sine(freq, t) + 0.4 * sine(freq * 2, t) + 0.15 * sine(freq * 3.01, t));
  });
}

/** Low-passed noise with an envelope, for whooshes and impacts. */
function noiseBurst(seconds, envelope, smoothing, gain) {
  let last = 0;
  return render(seconds, (t, p) => {
    last += smoothing * (noise() - last);
    return gain * envelope(t, p) * last;
  });
}

function writeWav(name, samples) {
  const peak = samples.reduce((m, s) => Math.max(m, Math.abs(s)), 0) || 1;
  const scale = Math.min(1, 0.9 / peak);
  const data = Buffer.alloc(samples.length * 2);
  samples.forEach((s, i) => data.writeInt16LE(Math.round(s * scale * 32767), i * 2));
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(RATE, 24);
  header.writeUInt32LE(RATE * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(data.length, 40);
  fs.writeFileSync(path.join(OUT, `${name}.wav`), Buffer.concat([header, data]));
}

fs.mkdirSync(OUT, { recursive: true });

// Loading a move into a slot: a short wooden tick.
writeWav('tap', render(0.06, (t) => Math.exp(-70 * t) * (sine(1400, t) + 0.5 * sine(2100, t)) * 0.6));

// Locking in a queue: two rising notes.
writeWav('lock', mix(bell(660, 0.25, 14), delay(bell(990, 0.35, 10), 0.08)));

// The two throws flying in.
writeWav('whoosh', noiseBurst(0.28, (t, p) => Math.sin(Math.PI * p) ** 2, 0.08, 1.2));

// The throws meeting: a noisy crack over a low thump.
writeWav(
  'clash',
  mix(
    noiseBurst(0.3, (t) => Math.exp(-22 * t), 0.6, 0.9),
    render(0.3, (t) => Math.exp(-14 * t) * sine(95 - 40 * t, t) * 0.9),
  ),
);

// A tied throw: a dull, short thud.
writeWav(
  'tie',
  mix(
    render(0.22, (t) => Math.exp(-20 * t) * sine(170, t) * 0.7),
    noiseBurst(0.12, (t) => Math.exp(-40 * t), 0.15, 0.4),
  ),
);

// A throw win, one file per streak level so the pitch climbs with the streak.
for (let level = 1; level <= 5; level++) {
  const base = 523.25 * 2 ** ((3 * (level - 1)) / 12); // C5, up three semitones a level
  writeWav(`win${level}`, mix(bell(base, 0.5, 7), delay(bell(base * 1.5, 0.45, 8, 0.35), 0.05)));
}

// A combo bonus: a quick sparkle running upwards.
writeWav(
  'combo',
  mix(...[0, 1, 2, 3, 4].map((k) => delay(bell(1046.5 * 2 ** ((k * 4) / 12), 0.25, 16, 0.3), k * 0.045))),
);

// The match winner: a short fanfare.
writeWav(
  'fanfare',
  mix(
    bell(523.25, 0.4, 6),
    delay(bell(659.25, 0.4, 6), 0.12),
    delay(bell(783.99, 0.4, 6), 0.24),
    delay(bell(1046.5, 0.9, 3.5, 0.6), 0.36),
  ),
);

console.log(`Wrote ${fs.readdirSync(OUT).length} sounds to ${path.relative(process.cwd(), OUT)}`);
