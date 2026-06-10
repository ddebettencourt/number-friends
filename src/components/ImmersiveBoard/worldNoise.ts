// Seeded 2D value noise + fbm used to sculpt terrain heightfields and
// scatter decorations deterministically (same world every load, no assets).

function hash2(x: number, y: number, seed: number): number {
  let h = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(seed, 2147483647);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

function smooth(t: number): number {
  return t * t * (3 - 2 * t);
}

/** Smooth value noise in [0, 1]. */
export function valueNoise2(x: number, y: number, seed = 0): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const a = hash2(xi, yi, seed);
  const b = hash2(xi + 1, yi, seed);
  const c = hash2(xi, yi + 1, seed);
  const d = hash2(xi + 1, yi + 1, seed);
  const u = smooth(xf);
  const v = smooth(yf);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

/** Fractal Brownian motion in [0, 1] — `octaves` layered value noises. */
export function fbm2(x: number, y: number, octaves = 4, seed = 0): number {
  let total = 0;
  let amplitude = 1;
  let frequency = 1;
  let max = 0;
  for (let i = 0; i < octaves; i++) {
    total += valueNoise2(x * frequency, y * frequency, seed + i * 101) * amplitude;
    max += amplitude;
    amplitude *= 0.5;
    frequency *= 2;
  }
  return total / max;
}

/** Ridged noise in [0, 1] — sharp crests, good for rocky/volcanic relief. */
export function ridged2(x: number, y: number, octaves = 4, seed = 0): number {
  let total = 0;
  let amplitude = 0.6;
  let frequency = 1;
  let max = 0;
  for (let i = 0; i < octaves; i++) {
    const n = valueNoise2(x * frequency, y * frequency, seed + i * 131);
    total += (1 - Math.abs(n * 2 - 1)) * amplitude;
    max += amplitude;
    amplitude *= 0.55;
    frequency *= 2.1;
  }
  return total / max;
}

/** Deterministic scalar PRNG stream (mulberry32). */
export function prng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
