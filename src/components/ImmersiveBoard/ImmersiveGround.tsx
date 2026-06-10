import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Vector3Tuple } from 'three';
import { ZONES } from '../Board3D/zoneConfig';
import { makeBumpTexture, makeCloudTexture } from './proceduralTextures';
import { fbm2, ridged2 } from './worldNoise';
import { LOW_PERF } from '../../utils/perf';

// ============================================================
//  Sculpted terrain — displaced, vertex-colored heightfields that
//  follow the path's elevation and flatten beneath it. Replaces the
//  old flat ground planes.
// ============================================================

interface ImmersiveGroundProps {
  positions: Vector3Tuple[];
  activeZone: number;
}

interface ZoneData {
  cx: number;
  cz: number;
  minY: number;
  rangeX: number;
  rangeZ: number;
  /** Path points for this zone padded with a couple of neighbors for seamless joins */
  path: Vector3Tuple[];
}

const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

interface TerrainOpts {
  data: ZoneData;
  padX?: number;
  padZ?: number;
  segs?: number;
  /** Noise height (world x,z) relative to base elevation */
  height: (x: number, z: number) => number;
  /** Vertex color from world x,z and final world y */
  color: (x: number, z: number, y: number) => [number, number, number];
  /** Distance from path at which terrain is fully flattened / fully free */
  flatR?: number;
  blendR?: number;
  /** How far below the path surface the flattened ground sits */
  pathDrop?: number;
  /** How far the outer edges sink (hides seams between zone terrains) */
  edgeSink?: number;
}

function buildTerrain(opts: TerrainOpts): THREE.BufferGeometry {
  const {
    data,
    padX = 32,
    padZ = 32,
    segs = LOW_PERF ? 64 : 110,
    height,
    color,
    flatR = 2.2,
    blendR = 7,
    pathDrop = 0.55,
    edgeSink = 13,
  } = opts;

  const width = data.rangeX + padX;
  const depth = data.rangeZ + padZ;
  const baseY = data.minY - 0.4;

  const geo = new THREE.PlaneGeometry(width, depth, segs, Math.round(segs * (depth / width)));
  geo.rotateX(-Math.PI / 2);

  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);

  for (let i = 0; i < pos.count; i++) {
    const lx = pos.getX(i);
    const lz = pos.getZ(i);
    const x = lx + data.cx;
    const z = lz + data.cz;

    let y = baseY + height(x, z);

    // Sink the outer edges so adjacent zone terrains never poke through
    // each other — fog + the drop swallow the seam.
    const ex = Math.abs(lx) / (width / 2);
    const ez = Math.abs(lz) / (depth / 2);
    y -= smoothstep(0.58, 1.0, Math.max(ex, ez)) * edgeSink;

    // Flatten toward the nearest path point's elevation
    let bestD2 = Infinity;
    let bestY = baseY;
    for (const [px, py, pz] of data.path) {
      const dx = px - x;
      const dz = pz - z;
      const d2 = dx * dx + dz * dz;
      if (d2 < bestD2) {
        bestD2 = d2;
        bestY = py;
      }
    }
    const d = Math.sqrt(bestD2);
    const free = smoothstep(flatR, blendR, d); // 0 on path → 1 far away
    y = lerp(bestY - pathDrop, y, free);

    pos.setY(i, y);

    const [r, g, b] = color(x, z, y);
    colors[i * 3] = r;
    colors[i * 3 + 1] = g;
    colors[i * 3 + 2] = b;
  }

  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  return geo;
}

// Shared bump map for micro surface detail
let _bump: THREE.CanvasTexture | null = null;
function bumpTex(): THREE.CanvasTexture {
  if (!_bump) {
    _bump = makeBumpTexture({ seed: 17 });
    _bump.repeat.set(10, 10);
  }
  return _bump;
}

const c = new THREE.Color();
function rgb(hex: string): [number, number, number] {
  c.set(hex);
  return [c.r, c.g, c.b];
}
function mix3(a: [number, number, number], b: [number, number, number], t: number): [number, number, number] {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
}

// ---------------- MEADOW ----------------

const MEADOW = {
  dark: rgb('#3e7a45'),
  mid: rgb('#549a52'),
  light: rgb('#6fb45e'),
  sunny: rgb('#8cc46a'),
  dirt: rgb('#7d6a48'),
};

function MeadowTerrain({ data }: { data: ZoneData }) {
  const geometry = useMemo(
    () =>
      buildTerrain({
        data,
        height: (x, z) =>
          fbm2(x * 0.055, z * 0.055, 4, 11) * 2.4 +
          (fbm2(x * 0.013, z * 0.013, 3, 12) - 0.5) * 5.5,
        color: (x, z, y) => {
          const n = fbm2(x * 0.16, z * 0.16, 3, 13);
          const patch = fbm2(x * 0.05, z * 0.05, 2, 14);
          let col = mix3(MEADOW.dark, MEADOW.mid, smoothstep(0.3, 0.6, n));
          col = mix3(col, MEADOW.light, smoothstep(0.55, 0.85, n));
          // sun-bleached patches
          col = mix3(col, MEADOW.sunny, smoothstep(0.62, 0.8, patch) * 0.6);
          // dirt shows on higher knolls
          col = mix3(col, MEADOW.dirt, smoothstep(2.1, 3.2, y) * 0.5);
          return col;
        },
      }),
    [data]
  );
  return (
    <mesh geometry={geometry} receiveShadow>
      <meshStandardMaterial vertexColors bumpMap={bumpTex()} bumpScale={0.35} roughness={0.95} metalness={0.02} />
    </mesh>
  );
}

// ---------------- CRYSTAL CAVES ----------------

const CAVES = {
  floor: rgb('#221f38'),
  raise: rgb('#363055'),
  vein: rgb('#5b4a8e'),
  glowVein: rgb('#4ECDC4'),
};

function CavesTerrain({ data }: { data: ZoneData }) {
  const floorGeo = useMemo(
    () =>
      buildTerrain({
        data,
        padX: 40,
        padZ: 38,
        height: (x, z) => ridged2(x * 0.07, z * 0.07, 4, 21) * 2.2 + fbm2(x * 0.02, z * 0.02, 3, 22) * 2,
        color: (x, z) => {
          const n = fbm2(x * 0.14, z * 0.14, 3, 23);
          const vein = fbm2(x * 0.3, z * 0.3, 2, 24);
          let col = mix3(CAVES.floor, CAVES.raise, smoothstep(0.35, 0.7, n));
          col = mix3(col, CAVES.vein, smoothstep(0.68, 0.78, vein) * 0.8);
          // faint cyan mineral veins
          col = mix3(col, CAVES.glowVein, smoothstep(0.8, 0.88, vein) * 0.35);
          return col;
        },
        edgeSink: 5,
      }),
    [data]
  );

  // Hanging rocky ceiling — inverted heightfield with stalactite ridges,
  // vaulted high enough that the camera never meets it.
  const ceilGeo = useMemo(() => {
    const width = data.rangeX + 44;
    const depth = data.rangeZ + 40;
    const segs = LOW_PERF ? 48 : 84;
    const geo = new THREE.PlaneGeometry(width, depth, segs, Math.round(segs * (depth / width)));
    geo.rotateX(Math.PI / 2); // faces downward
    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const base = data.minY + 19;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i) + data.cx;
      const z = pos.getZ(i) + data.cz;
      const spike = ridged2(x * 0.09, z * 0.09, 4, 31);
      const y = base - spike * 3.5 - fbm2(x * 0.03, z * 0.03, 2, 32) * 1.5;
      pos.setY(i, y);
      const n = fbm2(x * 0.2, z * 0.2, 2, 33);
      const col = mix3(rgb('#191630'), rgb('#2c2548'), n);
      colors[i * 3] = col[0];
      colors[i * 3 + 1] = col[1];
      colors[i * 3 + 2] = col[2];
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    return geo;
  }, [data]);

  return (
    <group>
      <mesh geometry={floorGeo} receiveShadow>
        <meshStandardMaterial
          vertexColors
          bumpMap={bumpTex()}
          bumpScale={0.5}
          roughness={0.8}
          metalness={0.18}
          emissive="#221d3e"
          emissiveIntensity={0.3}
        />
      </mesh>
      <mesh geometry={ceilGeo}>
        <meshStandardMaterial vertexColors roughness={0.9} metalness={0.1} />
      </mesh>
    </group>
  );
}

// ---------------- VOLCANIC RIDGE ----------------

const VOLCANO = {
  basalt: rgb('#171411'),
  rock: rgb('#2b2521'),
  ash: rgb('#3d3833'),
  ember: rgb('#5a230d'),
};

function VolcanoTerrain({ data }: { data: ZoneData }) {
  const geometry = useMemo(
    () =>
      buildTerrain({
        data,
        padX: 36,
        padZ: 34,
        height: (x, z) =>
          ridged2(x * 0.045, z * 0.045, 4, 41) * 4.2 +
          (fbm2(x * 0.015, z * 0.015, 3, 42) - 0.4) * 4,
        color: (x, z, y) => {
          const n = fbm2(x * 0.13, z * 0.13, 3, 43);
          const crack = ridged2(x * 0.2, z * 0.2, 2, 44);
          let col = mix3(VOLCANO.basalt, VOLCANO.rock, smoothstep(0.3, 0.7, n));
          // ash dusting on ridge tops
          col = mix3(col, VOLCANO.ash, smoothstep(2.6, 4.4, y) * 0.7);
          // smoldering undertone in the deepest cracks
          col = mix3(col, VOLCANO.ember, smoothstep(0.82, 0.95, crack) * 0.8);
          return col;
        },
        blendR: 8,
        edgeSink: 7,
      }),
    [data]
  );
  return (
    <mesh geometry={geometry} receiveShadow>
      <meshStandardMaterial vertexColors bumpMap={bumpTex()} bumpScale={0.6} roughness={0.96} metalness={0.06} />
    </mesh>
  );
}

// ---------------- SKY ISLANDS ----------------

// No solid ground — an endless drifting cloud sea far below the path.
function CloudSea({ data }: { data: ZoneData }) {
  const tex = useMemo(() => {
    const t = makeCloudTexture({ seed: 51 });
    t.repeat.set(3, 3);
    return t;
  }, []);
  const tex2 = useMemo(() => {
    const t = makeCloudTexture({ seed: 77, count: 200 });
    t.repeat.set(2, 2);
    return t;
  }, []);
  const m1 = useRef<THREE.MeshStandardMaterial>(null);
  const m2 = useRef<THREE.MeshStandardMaterial>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (m1.current?.map) m1.current.map.offset.set(t * 0.004, t * 0.0016);
    if (m2.current?.map) m2.current.map.offset.set(-t * 0.0025, t * 0.001);
  });

  // Sized to blanket the islands without bleeding under the neighboring
  // volcano/summit zones (they render simultaneously during transitions).
  const w = data.rangeX + 28;
  const d = data.rangeZ + 60;
  return (
    <group>
      <mesh position={[data.cx, data.minY - 12, data.cz]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial
          ref={m1}
          map={tex}
          transparent
          opacity={0.85}
          roughness={1}
          depthWrite={false}
          color="#ffffff"
        />
      </mesh>
      <mesh position={[data.cx + 8, data.minY - 16, data.cz - 6]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial
          ref={m2}
          map={tex2}
          transparent
          opacity={0.6}
          roughness={1}
          depthWrite={false}
          color="#b9d4ea"
        />
      </mesh>
    </group>
  );
}

// ---------------- THE SUMMIT ----------------

const SUMMIT = {
  rock: rgb('#8a7345'),
  gold: rgb('#c9a64e'),
  bright: rgb('#e3c468'),
  snow: rgb('#f2f5fc'),
};

function SummitTerrain({ data }: { data: ZoneData }) {
  const geometry = useMemo(
    () =>
      buildTerrain({
        data,
        padX: 38,
        padZ: 36,
        height: (x, z) =>
          fbm2(x * 0.05, z * 0.05, 4, 61) * 2.6 +
          (fbm2(x * 0.014, z * 0.014, 3, 62) - 0.35) * 6,
        color: (x, z, y) => {
          const n = fbm2(x * 0.15, z * 0.15, 3, 63);
          const snowJitter = fbm2(x * 0.09, z * 0.09, 2, 64) * 2.5;
          let col = mix3(SUMMIT.rock, SUMMIT.gold, smoothstep(0.3, 0.65, n));
          col = mix3(col, SUMMIT.bright, smoothstep(0.7, 0.9, n) * 0.7);
          // snow accumulates with altitude (the spiral climbs ~10 units)
          const snowline = data.minY + 4.5 + snowJitter;
          col = mix3(col, SUMMIT.snow, smoothstep(snowline, snowline + 2.2, y));
          return col;
        },
        blendR: 7,
        edgeSink: 10,
      }),
    [data]
  );
  return (
    <mesh geometry={geometry} receiveShadow>
      <meshStandardMaterial vertexColors bumpMap={bumpTex()} bumpScale={0.3} roughness={0.55} metalness={0.3} />
    </mesh>
  );
}

// ---------------- assembly ----------------

export function ImmersiveGround({ positions, activeZone }: ImmersiveGroundProps) {
  const zoneData = useMemo<(ZoneData | null)[]>(() => {
    return ZONES.map((zone) => {
      const startIdx = zone.startSquare - 1;
      const endIdx = Math.min(zone.endSquare, positions.length);
      const zonePos = positions.slice(startIdx, endIdx);
      if (zonePos.length === 0) return null;

      let minX = Infinity, maxX = -Infinity;
      let minZ = Infinity, maxZ = -Infinity;
      let minY = Infinity;
      for (const [x, y, z] of zonePos) {
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minZ = Math.min(minZ, z);
        maxZ = Math.max(maxZ, z);
        minY = Math.min(minY, y);
      }

      // Pad the flattening path with a couple of neighbor-zone points so the
      // road stays seated through zone transitions.
      const path = positions.slice(Math.max(0, startIdx - 2), Math.min(positions.length, endIdx + 2));

      return {
        cx: (minX + maxX) / 2,
        cz: (minZ + maxZ) / 2,
        minY,
        rangeX: maxX - minX,
        rangeZ: maxZ - minZ,
        path,
      };
    });
  }, [positions]);

  const components = [MeadowTerrain, CavesTerrain, VolcanoTerrain, CloudSea, SummitTerrain];

  return (
    <>
      {ZONES.map((_, idx) => {
        if (Math.abs(idx - activeZone) > 1) return null;
        const data = zoneData[idx];
        if (!data) return null;
        const Terrain = components[idx];
        return <Terrain key={idx} data={data} />;
      })}
    </>
  );
}
