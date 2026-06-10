import * as THREE from 'three';

// Canvas-generated noise/speckle textures — no asset files, no network.
// Used to break up flat solid-color ground planes with organic variation
// (color map) and subtle surface relief (bump map).

export interface NoiseTextureOpts {
  size?: number;
  count?: number;
  minR?: number;
  maxR?: number;
  minAlpha?: number;
  maxAlpha?: number;
  seed?: number;
}

// Deterministic PRNG so textures look identical across reloads.
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function makeNoiseTexture(base: string, specks: string[], opts: NoiseTextureOpts = {}): THREE.CanvasTexture {
  const size = opts.size ?? 256;
  const count = opts.count ?? 1600;
  const rnd = mulberry32(opts.seed ?? 1337);

  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);

  const minR = opts.minR ?? 1;
  const maxR = opts.maxR ?? 6;
  const minA = opts.minAlpha ?? 0.04;
  const maxA = opts.maxAlpha ?? 0.16;

  for (let i = 0; i < count; i++) {
    ctx.fillStyle = specks[i % specks.length];
    ctx.globalAlpha = minA + rnd() * (maxA - minA);
    const r = minR + rnd() * (maxR - minR);
    ctx.beginPath();
    ctx.arc(rnd() * size, rnd() * size, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

// A grayscale version of the same speckle, usable as a bump map for relief.
export function makeBumpTexture(opts: NoiseTextureOpts = {}): THREE.CanvasTexture {
  const size = opts.size ?? 256;
  const count = opts.count ?? 2200;
  const rnd = mulberry32(opts.seed ?? 99);

  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < count; i++) {
    const light = rnd() > 0.5;
    ctx.fillStyle = light ? '#ffffff' : '#000000';
    ctx.globalAlpha = 0.05 + rnd() * 0.12;
    const r = 1 + rnd() * 4;
    ctx.beginPath();
    ctx.arc(rnd() * size, rnd() * size, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}
