import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Sparkles, Text, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { motion } from 'framer-motion';
import { useStoryStore } from '../../stores/storyStore';
import { DialogueScene, type DialogueLine } from './DialogueScene';
import { useAmbient } from './AmbientBubble';
import { ChapterTitle } from './ChapterTitle';
import { makeCloudTexture } from '../ImmersiveBoard/proceduralTextures';
import { LOW_PERF } from '../../utils/perf';
import {
  useMovementRefs, useKeyboardMovement, isTouchDevice,
  PlayerMover, VirtualJoystick, StoryFollowCamera, StoryPawn, HopButton,
  type ClampResult, type HopResult,
} from './movement';

// ============================================================
//  Chapter 1 — Nullhaven, the Mirror Marsh.
//  Free movement + deliberate hops: face a stone and press Space
//  (or HOP, or tap it). Forward hops add the stone's value;
//  backward hops take it back — subtraction is walking home.
// ============================================================

const M = (name: string) => `/models/kenney/${name}.glb`;

function Model({ url, position, rotation = [0, 0, 0], scale = 1 }: {
  url: string;
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: number | [number, number, number];
}) {
  const { scene } = useGLTF(url);
  const cloned = useMemo(() => scene.clone(), [scene]);
  return <primitive object={cloned} position={position} rotation={rotation} scale={scale} />;
}

// --- Puzzle layout ----------------------------------------------------------
const STONE_COLS: number[][] = [
  [4, 1, -2],
  [-7, 3, -1],
  [5, -3, 2],
  [-2, 6, -4],
  [0, 1, -1],
];

const COL_SPACING = 2.6;
const STONE_GAP = 2.5;
const START_Z = 6.5;
const colZ = (col: number) => START_Z - (col + 1) * COL_SPACING;
const stoneX = (idx: number) => (idx - 1) * STONE_GAP;
const BANK_Z = colZ(STONE_COLS.length);
const SOUTH_C = new THREE.Vector3(0, 0, START_Z + 3.4);
const NORTH_C = new THREE.Vector3(0, 0, BANK_Z - 3.2);
// Walkable radii sit just short of the first/last stone columns so a push
// off the bank always has a hop candidate ahead.
const SOUTH_R = 5.4;
const NORTH_R = 6.4;
const STONE_R = 1.0;
const BANK_Y = 0.32;
const STONE_Y = 0.52;
const HOP_RANGE = 3.6;

type Region = { kind: 'south' } | { kind: 'north' } | { kind: 'stone'; col: number; idx: number };

function stoneCenter(col: number, idx: number): THREE.Vector3 {
  return new THREE.Vector3(stoneX(idx), STONE_Y, colZ(col));
}

interface HopCandidate extends HopResult {
  key: string;
}

// --- Zero (stationary host on his island) ------------------------------------
function Zero3D({ position }: { position: [number, number, number] }) {
  const group = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!group.current) return;
    const t = state.clock.elapsedTime;
    group.current.position.y = position[1] + Math.sin(t * 1.2) * 0.12;
    group.current.rotation.y = Math.sin(t * 0.4) * 0.25;
  });
  return (
    <group ref={group} position={position} scale={1.45}>
      <mesh castShadow>
        <torusGeometry args={[0.55, 0.21, 16, 36]} />
        <meshStandardMaterial color="#2d2d5a" roughness={0.4} metalness={0.3} emissive="#4ECDC4" emissiveIntensity={0.22} />
      </mesh>
      <mesh>
        <torusGeometry args={[0.55, 0.26, 12, 36]} />
        <meshBasicMaterial color="#4ECDC4" transparent opacity={0.12} />
      </mesh>
      <mesh position={[-0.16, 0.06, 0]}>
        <sphereGeometry args={[0.07, 10, 10]} />
        <meshStandardMaterial color="#eafffd" emissive="#eafffd" emissiveIntensity={1.6} toneMapped={false} />
      </mesh>
      <mesh position={[0.16, 0.06, 0]}>
        <sphereGeometry args={[0.07, 10, 10]} />
        <meshStandardMaterial color="#eafffd" emissive="#eafffd" emissiveIntensity={1.6} toneMapped={false} />
      </mesh>
      <pointLight color="#4ECDC4" intensity={1.6} distance={8} decay={2} />
    </group>
  );
}

// --- Stones --------------------------------------------------------------------
function Stone({ value, position, reachable, faced, occupied, onTap }: {
  value: number;
  position: [number, number, number];
  reachable: boolean;
  faced: boolean;
  occupied: boolean;
  onTap: () => void;
}) {
  const ref = useRef<THREE.Group>(null);
  const facedRing = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (ref.current) {
      const bob = Math.sin(state.clock.elapsedTime * 0.9 + position[0] * 2 + position[2]) * 0.04;
      ref.current.position.y = position[1] + bob;
    }
    if (facedRing.current) {
      const m = facedRing.current.material as THREE.MeshBasicMaterial;
      m.opacity = faced ? 0.75 + Math.sin(state.clock.elapsedTime * 6) * 0.22 : 0;
    }
  });
  const labelColor = value === 0 ? '#eafffd' : value > 0 ? '#FFE66D' : '#7FDBFF';
  return (
    <group
      ref={ref}
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        if (e.delta > 6) return; // it was a camera drag, not a tap
        onTap();
      }}
    >
      <Model url={M('path_stoneCircle')} position={[0, 0, 0]} scale={[1.7, 1.4, 1.7]} />
      {reachable && !faced && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.16, 0]}>
          <ringGeometry args={[0.78, 0.95, 28]} />
          <meshBasicMaterial color="#4ECDC4" transparent opacity={0.35} />
        </mesh>
      )}
      {/* faced highlight: the stone Space will hop to */}
      <mesh ref={facedRing} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.18, 0]}>
        <ringGeometry args={[0.72, 1.02, 28]} />
        <meshBasicMaterial color="#FFE66D" transparent opacity={0} />
      </mesh>
      {occupied && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.16, 0]}>
          <ringGeometry args={[0.78, 0.92, 28]} />
          <meshBasicMaterial color="#5FAD56" transparent opacity={0.5} />
        </mesh>
      )}
      <Text
        position={[0, 0.55, 0]}
        fontSize={0.52}
        color={labelColor}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.025}
        outlineColor="#0a0918"
      >
        {value > 0 ? `+${value}` : `${value}`}
      </Text>
    </group>
  );
}

// --- Water, splash, dressing -----------------------------------------------------
function MarshWater() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (ref.current) {
      const m = ref.current.material as THREE.MeshStandardMaterial;
      m.emissiveIntensity = 0.28 + Math.sin(state.clock.elapsedTime * 0.6) * 0.06;
    }
  });
  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.18, 0]}>
      <planeGeometry args={[70, 60]} />
      <meshStandardMaterial
        color="#16263e"
        emissive="#27506e"
        emissiveIntensity={0.3}
        roughness={0.12}
        metalness={0.6}
        transparent
        opacity={0.95}
      />
    </mesh>
  );
}

function SplashRing({ at }: { at: THREE.Vector3 | null }) {
  const ref = useRef<THREE.Mesh>(null);
  const t = useRef(0);
  useFrame((_, delta) => {
    if (!ref.current || !at) return;
    t.current += delta;
    const s = 0.4 + t.current * 3;
    ref.current.scale.setScalar(s);
    (ref.current.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.7 - t.current * 1.1);
  });
  if (!at) return null;
  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[at.x, -0.1, at.z]}>
      <ringGeometry args={[0.5, 0.62, 28]} />
      <meshBasicMaterial color="#9fe8df" transparent opacity={0.7} />
    </mesh>
  );
}


// Low mist drifting over the water
function MarshMist() {
  const tex = useMemo(() => {
    const t = makeCloudTexture({ seed: 91, count: 180 });
    t.repeat.set(2.5, 2.5);
    return t;
  }, []);
  const m1 = useRef<THREE.MeshStandardMaterial>(null);
  const m2 = useRef<THREE.MeshStandardMaterial>(null);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (m1.current?.map) m1.current.map.offset.set(t * 0.006, t * 0.0025);
    if (m2.current?.map) m2.current.map.offset.set(-t * 0.004, t * 0.0018);
  });
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.55, -1]}>
        <planeGeometry args={[42, 30]} />
        <meshStandardMaterial ref={m1} map={tex} transparent opacity={0.16} depthWrite={false} color="#bfe3de" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[3, 1.05, 1]}>
        <planeGeometry args={[40, 26]} />
        <meshStandardMaterial ref={m2} map={tex} transparent opacity={0.1} depthWrite={false} color="#9fc6d8" />
      </mesh>
    </group>
  );
}

// Drifting marsh-lights
function Fireflies({ count = 9 }: { count?: number }) {
  const group = useRef<THREE.Group>(null);
  const seeds = useMemo(() => Array.from({ length: count }, (_, i) => ({
    x: (Math.sin(i * 12.9898) * 43758.5453) % 1 * 16 - 8,
    z: (Math.sin(i * 78.233) * 12543.123) % 1 * 14 - 7,
    p: i * 1.7,
  })), [count]);
  useFrame((state) => {
    if (!group.current) return;
    const t = state.clock.elapsedTime;
    group.current.children.forEach((c, i) => {
      const s2 = seeds[i];
      c.position.set(
        s2.x + Math.sin(t * 0.5 + s2.p) * 1.6,
        1 + Math.sin(t * 0.9 + s2.p * 2) * 0.7,
        s2.z + Math.cos(t * 0.4 + s2.p) * 1.6
      );
      const m = (c as THREE.Mesh).material as THREE.MeshStandardMaterial;
      m.emissiveIntensity = 1.4 + Math.sin(t * 2.2 + s2.p * 3) * 0.9;
    });
  });
  return (
    <group ref={group}>
      {seeds.map((_, i) => (
        <mesh key={i}>
          <sphereGeometry args={[0.055, 8, 8]} />
          <meshStandardMaterial color="#d8ffe8" emissive="#aef3d0" emissiveIntensity={1.6} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

function MarshDressing() {
  return (
    <group>
      <mesh position={[SOUTH_C.x, -0.12, SOUTH_C.z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[7.5, 28]} />
        <meshStandardMaterial color="#36474f" roughness={0.95} />
      </mesh>
      <mesh position={[NORTH_C.x, -0.1, NORTH_C.z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[7, 28]} />
        <meshStandardMaterial color="#3a4d56" roughness={0.95} />
      </mesh>

      <Model url={M('tree_default_dark')} position={[-6.5, -0.3, START_Z + 4]} scale={2.6} />
      <Model url={M('tree_thin_dark')} position={[5.8, -0.3, START_Z + 5]} scale={2.4} rotation={[0, 1.2, 0]} />
      <Model url={M('tree_oak_dark')} position={[-7, -0.3, BANK_Z - 4]} scale={2.8} rotation={[0, 2.4, 0]} />
      <Model url={M('tree_default_dark')} position={[6.6, -0.3, BANK_Z - 5]} scale={2.2} rotation={[0, 0.7, 0]} />
      <Model url={M('pine-crooked')} position={[8.4, -0.3, 0]} scale={3.2} rotation={[0, 2, 0]} />
      <Model url={M('pine-crooked')} position={[-8.8, -0.3, -1.5]} scale={2.8} rotation={[0, 4.1, 0]} />

      <group position={[-3.6, -0.25, START_Z + 1.2]}>
        <Model url={M('lightpost-single')} position={[0, 0, 0]} scale={1.6} />
        <pointLight position={[0, 2.4, 0]} color="#FFE66D" intensity={1.1} distance={6} decay={2} />
      </group>
      <group position={[3.8, -0.25, BANK_Z - 1]}>
        <Model url={M('lightpost-single')} position={[0, 0, 0]} scale={1.6} rotation={[0, Math.PI, 0]} />
        <pointLight position={[0, 2.4, 0]} color="#FFE66D" intensity={1.1} distance={6} decay={2} />
      </group>

      <Model url={M('canoe')} position={[2.8, -0.12, BANK_Z - 1.6]} scale={1.8} rotation={[0, 0.5, 0]} />

      <Model url={M('lily_large')} position={[-4.5, -0.13, 2]} scale={1.6} />
      <Model url={M('lily_small')} position={[4.8, -0.13, 0.5]} scale={1.6} rotation={[0, 1, 0]} />
      <Model url={M('lily_large')} position={[5.4, -0.13, -4.5]} scale={1.4} rotation={[0, 2.2, 0]} />
      <Model url={M('lily_small')} position={[-5.6, -0.13, -3]} scale={1.7} />
      <Model url={M('grass_leafsLarge')} position={[-4.2, -0.2, START_Z - 0.5]} scale={2} />
      <Model url={M('grass_leafsLarge')} position={[4.4, -0.2, START_Z - 1.5]} scale={1.7} rotation={[0, 0.8, 0]} />
      <Model url={M('grass_leafs')} position={[-5, -0.2, BANK_Z + 0.6]} scale={2} rotation={[0, 1.9, 0]} />
      <Model url={M('mushroom_redGroup')} position={[-2.6, -0.28, BANK_Z - 2.4]} scale={1.8} />
      <Model url={M('mushroom_tanGroup')} position={[1.8, -0.3, START_Z + 2.2]} scale={1.7} />
      <Model url={M('rock_largeB')} position={[7.2, -0.3, 3.4]} scale={1.5} rotation={[0, 0.6, 0]} />
      <Model url={M('rock_tallA')} position={[-7.6, -0.3, 4.5]} scale={1.3} rotation={[0, 1.4, 0]} />
      <Model url={M('hanging_moss')} position={[-6.5, 2.6, START_Z + 4]} scale={2.2} />
      <Model url={M('lily_large')} position={[-2.2, -0.13, -1.8]} scale={1.3} rotation={[0, 0.7, 0]} />
      <Model url={M('lily_small')} position={[2.4, -0.13, -3.6]} scale={1.5} rotation={[0, 2.8, 0]} />
      <Model url={M('grass_leafs')} position={[6.2, -0.2, -1.2]} scale={1.8} rotation={[0, 0.4, 0]} />
      <Model url={M('grass_leafs')} position={[-6.4, -0.2, 1.8]} scale={1.6} rotation={[0, 2.2, 0]} />
      <Model url={M('mushroom_red')} position={[4.4, -0.26, START_Z + 3]} scale={1.6} />
      <Model url={M('stump_old')} position={[-2.4, -0.3, START_Z + 4.6]} scale={1.8} rotation={[0, 1.1, 0]} />
      <Model url={M('rock_smallFlatB')} position={[1.4, -0.25, BANK_Z - 4.6]} scale={1.6} />
      <Model url={M('flower_purpleA')} position={[-4.8, -0.26, BANK_Z - 1.8]} scale={1.7} />
    </group>
  );
}

// --- Dialogue (short — the marsh does the teaching) -----------------------------
const INTRO: DialogueLine[] = [
  { speaker: 'zero', text: 'Easy now. You fell into Nullhaven — the Mirror Marsh, where everything cancels. I’m Zero. I caught you. It’s what nothing does best.' },
  { speaker: 'zero', text: 'The Devil locked every number away — your board up there is empty because of him. If you want them back, start by crossing my marsh.' },
  { speaker: 'zero', text: 'One rule: the water only holds a traveler whose steps balance. Reach me carrying exactly nothing.' },
];

const OUTRO: DialogueLine[] = [
  { speaker: 'zero', text: 'Perfectly balanced. Adding and subtracting are the same walk — in opposite directions. You just proved it with your feet.' },
  { speaker: 'zero', text: 'I’m coming with you. A journey to the Hundredth Square needs someone who knows the value of nothing.' },
  { speaker: 'narrator', text: 'Zero joined your party. — Next: The Clockwork Commons.' },
];

const FAIL_LINES = [
  'The marsh shivers — you’re carrying weight. It sets you back ashore.',
  'Still unbalanced. Every step you take, the water remembers its mirror.',
];

// --- Facing watcher: which stone would Space hop to right now? -------------------
function FacingWatcher({ refs, active, getCandidates, onFaced }: {
  refs: ReturnType<typeof useMovementRefs>;
  active: boolean;
  getCandidates: () => HopCandidate[];
  onFaced: (c: HopCandidate | null) => void;
}) {
  const lastKey = useRef<string | null>(null);
  useFrame(() => {
    if (!active || refs.hopping.current) return;
    const dir = new THREE.Vector3(Math.sin(refs.facing.current), 0, Math.cos(refs.facing.current));
    let best: HopCandidate | null = null;
    let bestDot = 0.45;
    for (const c of getCandidates()) {
      const to = c.to.clone().sub(refs.pos.current);
      to.y = 0;
      const dist = to.length();
      if (dist > HOP_RANGE || dist < 0.05) continue;
      const d = to.normalize().dot(dir);
      if (d > bestDot) {
        bestDot = d;
        best = c;
      }
    }
    const key = best?.key ?? null;
    if (key !== lastKey.current) {
      lastKey.current = key;
      onFaced(best);
    }
  });
  return null;
}

// --- Main scene -----------------------------------------------------------------------
type ScenePhase = 'title' | 'intro' | 'explore' | 'outro';

export function NullhavenScene() {
  const [phase, setPhase] = useState<ScenePhase>('title');
  const [sum, setSum] = useState(0);
  const [fails, setFails] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [splash, setSplash] = useState<THREE.Vector3 | null>(null);
  const [regionState, setRegionState] = useState<Region>({ kind: 'south' });
  const [faced, setFaced] = useState<HopCandidate | null>(null);
  const completeChapter = useStoryStore((s) => s.completeChapter);
  const ambient = useAmbient();

  const refs = useMovementRefs([0, BANK_Y, START_Z + 1.6]);
  useKeyboardMovement(refs, phase === 'explore');
  const touch = useMemo(() => isTouchDevice(), []);

  // Logic-side mirrors (clamp runs every frame; React state is for rendering)
  const regionRef = useRef<Region>({ kind: 'south' });
  const sumRef = useRef(0);
  const failsRef = useRef(0);
  const saidForward = useRef(false);
  const saidBackward = useRef(false);

  const setRegion = (r: Region) => {
    regionRef.current = r;
    setRegionState(r);
  };

  const addSum = (d: number) => {
    sumRef.current += d;
    setSum(sumRef.current);
  };

  const washBack = () => {
    setSplash(refs.pos.current.clone());
    failsRef.current += 1;
    setFails(failsRef.current);
    setToast(
      `${FAIL_LINES[Math.min(failsRef.current - 1, FAIL_LINES.length - 1)]} (You were carrying ${sumRef.current > 0 ? '+' : ''}${sumRef.current}.)`
    );
    sumRef.current = 0;
    setSum(0);
    setRegion({ kind: 'south' });
    refs.teleport(0, BANK_Y, START_Z + 1.6);
    setTimeout(() => setSplash(null), 900);
  };

  const arriveNorth = () => {
    if (sumRef.current === 0) {
      setRegion({ kind: 'north' });
      setTimeout(() => setPhase('outro'), 1100);
    } else {
      washBack();
    }
  };

  // All legal hops from the current footing — shared by push-assist (clamp),
  // the facing highlight, Space/HOP, and stone taps.
  const candidatesFor = (current: THREE.Vector3): HopCandidate[] => {
    const r = regionRef.current;
    const out: HopCandidate[] = [];
    const forward = (col: number, idx: number, v: number) => ({
      key: `s${col}-${idx}`,
      to: stoneCenter(col, idx),
      commit: () => {
        addSum(v);
        setRegion({ kind: 'stone', col, idx });
        if (!saidForward.current) {
          saidForward.current = true;
          ambient.say('zero', `${v > 0 ? '+' : ''}${v}. The water felt that. Keep your total in mind.`);
        }
      },
    });

    if (r.kind === 'south') {
      STONE_COLS[0].forEach((v, idx) => out.push(forward(0, idx, v)));
    } else if (r.kind === 'stone') {
      const { col, idx } = r;
      const departed = STONE_COLS[col][idx];
      if (col + 1 < STONE_COLS.length) {
        STONE_COLS[col + 1].forEach((v, i2) => out.push(forward(col + 1, i2, v)));
      } else {
        out.push({
          key: 'north',
          to: new THREE.Vector3(current.x * 0.4, BANK_Y, BANK_Z + 1.5),
          commit: arriveNorth,
        });
      }
      const undoSay = () => {
        if (!saidBackward.current) {
          saidBackward.current = true;
          ambient.say('zero', 'And back — the marsh gives it back. A step undone is a number subtracted.');
        }
      };
      if (col === 0) {
        out.push({
          key: 'south',
          to: new THREE.Vector3(current.x * 0.4, BANK_Y, START_Z - 1.6),
          commit: () => { addSum(-departed); setRegion({ kind: 'south' }); undoSay(); },
        });
      } else {
        STONE_COLS[col - 1].forEach((_, i2) => {
          out.push({
            key: `s${col - 1}-${i2}`,
            to: stoneCenter(col - 1, i2),
            commit: () => { addSum(-departed); setRegion({ kind: 'stone', col: col - 1, idx: i2 }); undoSay(); },
          });
        });
      }
      STONE_COLS[col].forEach((v, i2) => {
        if (i2 === idx) return;
        out.push({
          key: `s${col}-${i2}`,
          to: stoneCenter(col, i2),
          commit: () => { addSum(v - departed); setRegion({ kind: 'stone', col, idx: i2 }); },
        });
      });
    } else {
      STONE_COLS[STONE_COLS.length - 1].forEach((v, i2) =>
        out.push(forward(STONE_COLS.length - 1, i2, v))
      );
    }
    return out;
  };

  // --- the walkable-space clamp + push-out hop assist ---
  const clamp = (next: THREE.Vector3, current: THREE.Vector3, dir: THREE.Vector3): ClampResult => {
    const r = regionRef.current;

    const inSouth = (p: THREE.Vector3) => Math.hypot(p.x - SOUTH_C.x, p.z - SOUTH_C.z) < SOUTH_R;
    const inNorth = (p: THREE.Vector3) => Math.hypot(p.x - NORTH_C.x, p.z - NORTH_C.z) < NORTH_R;
    const inStone = (p: THREE.Vector3, col: number, idx: number) =>
      Math.hypot(p.x - stoneX(idx), p.z - colZ(col)) < STONE_R;

    const stays =
      r.kind === 'south' ? inSouth(next) :
      r.kind === 'north' ? inNorth(next) :
      inStone(next, r.col, r.idx);

    if (stays) {
      next.y = r.kind === 'stone' ? STONE_Y : BANK_Y;
      return { position: next };
    }

    let best: HopCandidate | null = null;
    let bestDot = 0.55;
    for (const c of candidatesFor(current)) {
      const to = c.to.clone().sub(current);
      to.y = 0;
      const dist = to.length();
      if (dist > HOP_RANGE || dist < 0.05) continue;
      const d = to.normalize().dot(dir);
      if (d > bestDot) {
        bestDot = d;
        best = c;
      }
    }
    if (best) return { position: current, hop: { to: best.to, commit: best.commit } };

    const slideX = new THREE.Vector3(next.x, current.y, current.z);
    const slideZ = new THREE.Vector3(current.x, current.y, next.z);
    const ok = (p: THREE.Vector3) =>
      r.kind === 'south' ? inSouth(p) : r.kind === 'north' ? inNorth(p) : inStone(p, r.col, r.idx);
    if (ok(slideX)) return { position: slideX };
    if (ok(slideZ)) return { position: slideZ };
    return { position: current };
  };

  // Space = hop to the faced stone
  useEffect(() => {
    if (phase !== 'explore') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return;
      e.preventDefault();
      if (faced) refs.requestHop(faced);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, faced, refs]);

  const tapStone = (c: number, idx: number) => {
    if (phase !== 'explore') return;
    const candidate = candidatesFor(refs.pos.current).find((x) => x.key === `s${c}-${idx}`);
    if (candidate) refs.requestHop(candidate);
  };

  const currentCol = regionState.kind === 'stone' ? regionState.col : regionState.kind === 'south' ? -1 : STONE_COLS.length;

  return (
    <div className="fixed inset-0 z-40" style={{ background: '#0a0918' }}>
      <Canvas shadows={!LOW_PERF} dpr={LOW_PERF ? [0.7, 1] : [1, 1.5]} camera={{ position: [0, 5.5, START_Z + 8], fov: 55 }}>
        <Suspense fallback={null}>
          <color attach="background" args={['#0a0918']} />
          <fog attach="fog" args={['#0e1426', 16, 46]} />

          <ambientLight intensity={0.5} color="#8a9cc9" />
          <directionalLight position={[6, 12, 4]} intensity={0.7} color="#a8bdec" castShadow={!LOW_PERF} />
          <pointLight position={[0, 6, -2]} intensity={0.8} color="#7fb0d8" distance={26} decay={2} />

          <Stars radius={50} depth={30} count={LOW_PERF ? 300 : 800} factor={2.5} saturation={0} fade speed={0.4} />
          <Sparkles position={[0, 1.5, 0]} count={LOW_PERF ? 14 : 36} scale={[18, 4, 16]} size={2} speed={0.18} opacity={0.5} color="#9fe8df" />

          <MarshWater />
          <MarshMist />
          {!LOW_PERF && <Fireflies />}
          <MarshDressing />
          <SplashRing at={splash} />

          {/* tap-to-move on the banks (works alongside WASD/joystick) */}
          <mesh
            position={[SOUTH_C.x, -0.08, SOUTH_C.z]}
            rotation={[-Math.PI / 2, 0, 0]}
            visible={false}
            onClick={(e) => {
              e.stopPropagation();
              if (e.delta > 6) return;
              if (phase === 'explore') refs.setTarget(e.point);
            }}
          >
            <circleGeometry args={[7.5, 28]} />
            <meshBasicMaterial />
          </mesh>
          <mesh
            position={[NORTH_C.x, -0.06, NORTH_C.z]}
            rotation={[-Math.PI / 2, 0, 0]}
            visible={false}
            onClick={(e) => {
              e.stopPropagation();
              if (e.delta > 6) return;
              if (phase === 'explore') refs.setTarget(e.point);
            }}
          >
            <circleGeometry args={[7, 28]} />
            <meshBasicMaterial />
          </mesh>

          {/* shore glow when the final step is available */}
          {phase === 'explore' && currentCol === STONE_COLS.length - 1 && (
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, BANK_Z - 1.2]}>
              <ringGeometry args={[1, 1.3, 32]} />
              <meshBasicMaterial color="#FFE66D" transparent opacity={0.6} />
            </mesh>
          )}

          {STONE_COLS.map((colStones, c) =>
            colStones.map((value, idx) => (
              <Stone
                key={`${c}-${idx}`}
                value={value}
                position={[stoneX(idx), 0.05, colZ(c)]}
                reachable={phase === 'explore' && Math.abs(c - currentCol) === 1}
                faced={faced?.key === `s${c}-${idx}`}
                occupied={regionState.kind === 'stone' && regionState.col === c && regionState.idx === idx}
                onTap={() => tapStone(c, idx)}
              />
            ))
          )}

          <FacingWatcher
            refs={refs}
            active={phase === 'explore'}
            getCandidates={() => candidatesFor(refs.pos.current)}
            onFaced={setFaced}
          />
          <PlayerMover refs={refs} clamp={clamp} frozen={phase !== 'explore'} />
          <StoryPawn refs={refs} />
          <Zero3D position={[0, 1.15, BANK_Z - 2.6]} />
          <StoryFollowCamera refs={refs} />
        </Suspense>
      </Canvas>

      {ambient.node}

      {/* HUD: running balance (left side, below the ambient strip) */}
      {phase === 'explore' && (
        <div className="absolute top-16 left-0 flex flex-col items-start gap-2 p-4 pointer-events-none">
          <div className="hud-panel px-6 py-3 text-center">
            <div className="label-caps mb-0.5">Your balance</div>
            <div
              className="big-number"
              style={{
                fontSize: 'clamp(1.8rem, 5vw, 2.6rem)',
                color: sum === 0 ? '#4ECDC4' : sum > 0 ? '#FFE66D' : '#7FDBFF',
              }}
            >
              {sum > 0 ? `+${sum}` : sum}
            </div>
          </div>
          {fails >= 2 && (
            <div className="hud-panel px-4 py-2 text-sm max-w-xs" style={{ fontFamily: 'var(--font-body)', color: 'var(--color-text-secondary)' }}>
              Zero whispers: “try +4, then −7, then +5, then −2… then the stone that adds nothing.”
            </div>
          )}
          {toast && (
            <motion.div
              key={toast}
              className="hud-panel px-4 py-2 text-sm max-w-xs"
              style={{ fontFamily: 'var(--font-body)', color: '#FFE66D' }}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {toast}
            </motion.div>
          )}
          <div
            className="text-[11px]"
            style={{ fontFamily: 'var(--font-body)', color: 'rgba(255,255,255,0.35)' }}
          >
            {touch
              ? 'joystick to walk · drag to look · HOP to jump'
              : 'WASD to walk · drag to look · Space to hop'}
          </div>
        </div>
      )}

      {phase === 'explore' && touch && <VirtualJoystick refs={refs} />}
      {phase === 'explore' && touch && (
        <HopButton visible={!!faced} onHop={() => { if (faced) refs.requestHop(faced); }} />
      )}

      {phase === 'title' && (
        <ChapterTitle eyebrow="Chapter One" title="Nullhaven, the Mirror Marsh" accent="#4ECDC4" onDone={() => setPhase('intro')} />
      )}
      {phase === 'intro' && (
        <DialogueScene lines={INTRO} onComplete={() => setPhase('explore')} skipLabel="Skip" />
      )}
      {phase === 'outro' && (
        <DialogueScene
          lines={OUTRO}
          onComplete={() => {
            completeChapter('nullhaven', { companion: 'zero', flawless: fails === 0 });
            useStoryStore.getState().goToChapter('clockwork');
          }}
        />
      )}
    </div>
  );
}

// Preload the marsh models so the scene pops in whole
[
  'path_stoneCircle', 'tree_default_dark', 'tree_thin_dark', 'tree_oak_dark',
  'pine-crooked', 'lightpost-single', 'canoe', 'lily_large', 'lily_small',
  'grass_leafs', 'grass_leafsLarge', 'mushroom_redGroup', 'mushroom_tanGroup',
  'rock_largeB', 'rock_tallA', 'hanging_moss',
].forEach((m) => useGLTF.preload(M(m)));
