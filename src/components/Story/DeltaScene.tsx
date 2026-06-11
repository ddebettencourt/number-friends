import { Suspense, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Billboard, Text, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useStoryStore } from '../../stores/storyStore';
import { DialogueScene, type DialogueLine } from './DialogueScene';
import { useAmbient } from './AmbientBubble';
import { ChapterTitle } from './ChapterTitle';
import { LOW_PERF } from '../../utils/perf';
import {
  useMovementRefs, useKeyboardMovement, isTouchDevice,
  PlayerMover, VirtualJoystick, StoryFollowCamera, StoryPawn, ZeroFollower,
  type ClampResult,
} from './movement';

// ============================================================
//  Chapter 3 — The Doubling Delta.
//  Binary made physical: power cells worth 1, 2, 4, 8, 16 orbit
//  you as you carry them, and each bridge-gate demands an exact
//  total. Every number has exactly one spelling in powers of two.
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

// --- Layout: four islands south → north, three gates between ---------------------
const GROUND_Y = 0.3;
interface Island { c: THREE.Vector3; r: number }
const ISLANDS: Island[] = [
  { c: new THREE.Vector3(0, 0, 14), r: 7.2 },    // A — start, Two's home
  { c: new THREE.Vector3(-3, 0, -2.5), r: 7.6 }, // B — the rice row
  { c: new THREE.Vector3(3.5, 0, -19), r: 6.6 }, // C
  { c: new THREE.Vector3(0, 0, -33.5), r: 6 },   // D — far shore
];

interface Stage {
  target: number;
  cells: number[];
  /** cell field positions on the stage's island */
  cellSpots: [number, number][];
  gate: { pos: THREE.Vector3; yaw: number };
  /** bridge walk-strip between islands (a, b are strip endpoints) */
  bridge: { a: THREE.Vector3; b: THREE.Vector3 };
}

const STAGES: Stage[] = [
  {
    target: 5,
    cells: [1, 2, 4],
    cellSpots: [[-3.4, 12.2], [2.8, 16.4], [3.6, 11.6]],
    gate: { pos: new THREE.Vector3(-1.6, 0, 7.6), yaw: 0.22 },
    bridge: { a: new THREE.Vector3(-1.6, 0, 7.6), b: new THREE.Vector3(-2.6, 0, 4.4) },
  },
  {
    target: 13,
    cells: [1, 2, 4, 8],
    cellSpots: [[-7.6, -1], [-5.4, -6.4], [1.6, -5.8], [-0.4, 1.6]],
    gate: { pos: new THREE.Vector3(0.4, 0, -8.9), yaw: -0.32 },
    bridge: { a: new THREE.Vector3(0.4, 0, -8.9), b: new THREE.Vector3(2, 0, -12.6) },
  },
  {
    target: 22,
    cells: [1, 2, 4, 8, 16],
    cellSpots: [[7.6, -17], [0.2, -15.4], [-0.6, -21.6], [6.4, -22.8], [3.5, -14.2]],
    gate: { pos: new THREE.Vector3(1.8, 0, -25), yaw: 0.18 },
    bridge: { a: new THREE.Vector3(1.8, 0, -25), b: new THREE.Vector3(0.8, 0, -28.2) },
  },
];

const GATE_DWELL = 0.85;

// --- Two: a binary star ------------------------------------------------------------
function Two3D({ position }: { position: [number, number, number] }) {
  const group = useRef<THREE.Group>(null);
  const a = useRef<THREE.Group>(null);
  const b = useRef<THREE.Group>(null);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (group.current) group.current.position.y = position[1] + Math.sin(t * 1.1) * 0.12;
    if (a.current && b.current) {
      const o = t * 1.4;
      a.current.position.set(Math.cos(o) * 0.55, 0, Math.sin(o) * 0.35);
      b.current.position.set(-Math.cos(o) * 0.75, Math.sin(o * 2) * 0.1, -Math.sin(o) * 0.5);
    }
  });
  return (
    <group ref={group} position={position}>
      <group ref={a}>
        <mesh castShadow>
          <sphereGeometry args={[0.5, 20, 20]} />
          <meshStandardMaterial color="#3185FC" roughness={0.3} metalness={0.2} emissive="#3185FC" emissiveIntensity={0.25} />
        </mesh>
        {/* eyes */}
        <mesh position={[-0.15, 0.12, 0.44]}>
          <sphereGeometry args={[0.07, 8, 8]} />
          <meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={1.2} toneMapped={false} />
        </mesh>
        <mesh position={[0.15, 0.12, 0.44]}>
          <sphereGeometry args={[0.07, 8, 8]} />
          <meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={1.2} toneMapped={false} />
        </mesh>
      </group>
      <group ref={b}>
        <mesh castShadow>
          <sphereGeometry args={[0.3, 16, 16]} />
          <meshStandardMaterial color="#5BA3FC" roughness={0.3} metalness={0.2} emissive="#5BA3FC" emissiveIntensity={0.3} />
        </mesh>
      </group>
      <pointLight color="#5BA3FC" intensity={1.3} distance={8} decay={2} />
    </group>
  );
}

// --- Power cells -------------------------------------------------------------------
function FieldCell({ value, position, onPick }: {
  value: number;
  position: [number, number, number];
  onPick: () => void;
}) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime + position[0];
    ref.current.position.y = position[1] + 0.75 + Math.sin(t * 1.6) * 0.14;
    ref.current.rotation.y = t * 0.8;
  });
  return (
    <group position={position}>
      <group ref={ref}>
        <mesh
          onClick={(e) => {
            e.stopPropagation();
            if (e.delta <= 6) onPick();
          }}
        >
          <octahedronGeometry args={[0.42]} />
          <meshStandardMaterial color="#5BA3FC" emissive="#3185FC" emissiveIntensity={0.7} roughness={0.15} metalness={0.6} toneMapped={false} />
        </mesh>
        <Billboard position={[0, 0.72, 0]}>
          <Text fontSize={0.36} color="#ffffff" anchorX="center" anchorY="middle" outlineWidth={0.03} outlineColor="#0D2F5E">
            {value}
          </Text>
        </Billboard>
      </group>
      {/* landing shadow ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
        <ringGeometry args={[0.3, 0.42, 20]} />
        <meshBasicMaterial color="#3185FC" transparent opacity={0.3} />
      </mesh>
    </group>
  );
}

/** Cells you carry orbit the pawn. Tap one to drop it at your feet. */
function CarriedCells({ refs, cells, onDrop }: {
  refs: ReturnType<typeof useMovementRefs>;
  cells: number[];
  onDrop: (v: number) => void;
}) {
  const group = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!group.current) return;
    const t = state.clock.elapsedTime;
    const p = refs.pos.current;
    group.current.position.set(p.x, p.y + 1.15, p.z);
    group.current.children.forEach((c, i) => {
      const o = t * 1.5 + (i / Math.max(1, cells.length)) * Math.PI * 2;
      c.position.set(Math.cos(o) * 0.85, Math.sin(t * 2 + i) * 0.1, Math.sin(o) * 0.85);
      c.rotation.y = t;
    });
  });
  return (
    <group ref={group}>
      {cells.map((v) => (
        <group key={v}>
          <mesh
            onClick={(e) => {
              e.stopPropagation();
              if (e.delta <= 6) onDrop(v);
            }}
          >
            <octahedronGeometry args={[0.26]} />
            <meshStandardMaterial color="#7FDBFF" emissive="#3185FC" emissiveIntensity={0.9} roughness={0.1} metalness={0.6} toneMapped={false} />
          </mesh>
          <Billboard position={[0, 0.42, 0]}>
            <Text fontSize={0.22} color="#fff" anchorX="center" anchorY="middle" outlineWidth={0.02} outlineColor="#0D2F5E">
              {v}
            </Text>
          </Billboard>
        </group>
      ))}
    </group>
  );
}

// --- Bridge gate ------------------------------------------------------------------
function BridgeGate({ stage, open, depositGlow }: {
  stage: Stage;
  open: boolean;
  depositGlow: boolean;
}) {
  const sealRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!sealRef.current) return;
    const m = sealRef.current.material as THREE.MeshBasicMaterial;
    m.opacity = open ? 0 : 0.28 + Math.sin(state.clock.elapsedTime * 1.6) * 0.1;
  });
  const { pos, yaw } = stage.gate;
  return (
    <group position={[pos.x, GROUND_Y, pos.z]} rotation={[0, yaw, 0]}>
      {/* twin posts */}
      {[-1.3, 1.3].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <mesh position={[0, 1.1, 0]} castShadow>
            <cylinderGeometry args={[0.18, 0.24, 2.2, 10]} />
            <meshStandardMaterial color="#8a6a3f" roughness={0.85} />
          </mesh>
          <mesh position={[0, 2.32, 0]}>
            <sphereGeometry args={[0.26, 12, 12]} />
            <meshStandardMaterial
              color={open ? '#FFE66D' : '#3185FC'}
              emissive={open ? '#FFE66D' : '#3185FC'}
              emissiveIntensity={open ? 1 : 0.5}
              toneMapped={false}
            />
          </mesh>
        </group>
      ))}
      {/* target plaque */}
      <group position={[0, 2.5, 0]}>
        <mesh>
          <boxGeometry args={[1.5, 0.95, 0.14]} />
          <meshStandardMaterial color="#1d3a5f" roughness={0.5} metalness={0.3} />
        </mesh>
        <Text position={[0, 0.13, 0.09]} fontSize={0.5} color="#FFE66D" anchorX="center" anchorY="middle" outlineWidth={0.03} outlineColor="#0D2F5E">
          {String(stage.target)}
        </Text>
        <Text position={[0, -0.32, 0.09]} fontSize={0.14} color="#9fc6e8" anchorX="center" anchorY="middle">
          exact total to open
        </Text>
      </group>
      {/* seal between the posts */}
      <mesh ref={sealRef} position={[0, 1.1, 0]}>
        <planeGeometry args={[2.4, 2.1]} />
        <meshBasicMaterial color="#E84855" transparent opacity={0.3} side={THREE.DoubleSide} />
      </mesh>
      {/* deposit ring in front of the gate */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 1.5]}>
        <ringGeometry args={[0.85, 1.15, 28]} />
        <meshBasicMaterial color={depositGlow ? '#FFE66D' : '#3185FC'} transparent opacity={depositGlow ? 0.8 : 0.4} />
      </mesh>
      <pointLight position={[0, 2.4, 0.6]} color={open ? '#FFE66D' : '#5BA3FC'} intensity={1} distance={7} decay={2} />
    </group>
  );
}

/** Plank bridge that extends when its gate opens. */
function Bridge({ stage, open }: { stage: Stage; open: boolean }) {
  const grow = useRef(0);
  const group = useRef<THREE.Group>(null);
  const { a, b } = stage.bridge;
  const dir = b.clone().sub(a);
  const len = dir.length();
  const yaw = Math.atan2(dir.x, dir.z);
  const planks = Math.ceil(len / 0.62);
  useFrame((_, delta) => {
    grow.current = THREE.MathUtils.clamp(grow.current + (open ? delta * 1.6 : -delta * 2), 0, 1);
    if (!group.current) return;
    group.current.children.forEach((c, i) => {
      const reveal = THREE.MathUtils.clamp(grow.current * planks - i, 0, 1);
      c.scale.setScalar(reveal);
      c.position.y = (1 - reveal) * -0.4;
    });
  });
  return (
    <group position={[a.x, GROUND_Y - 0.06, a.z]} rotation={[0, yaw, 0]} ref={group}>
      {Array.from({ length: planks }).map((_, i) => (
        <mesh key={i} position={[0, 0, (i + 0.5) * 0.62]} castShadow>
          <boxGeometry args={[1.6, 0.12, 0.5]} />
          <meshStandardMaterial color={i % 2 ? '#a8814f' : '#96703f'} roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

// --- The rice chessboard (set piece on island B) ------------------------------------
function RiceRow() {
  // 8 visible squares, mounds doubling: by square 8 it's a small mountain
  return (
    <group position={[-6.6, GROUND_Y, -3.4]} rotation={[0, 1.35, 0]}>
      {Array.from({ length: 8 }).map((_, i) => {
        const r = 0.09 * Math.pow(1.62, i);
        const h = Math.min(2.1, 0.12 * Math.pow(1.7, i));
        return (
          <group key={i} position={[0, 0, i * 1.05]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}>
              <planeGeometry args={[0.95, 0.95]} />
              <meshStandardMaterial color={i % 2 ? '#caa86a' : '#b8945a'} roughness={0.9} />
            </mesh>
            <mesh position={[0, h / 2 + 0.02, 0]} castShadow>
              <coneGeometry args={[Math.min(r, 0.85), h, 12]} />
              <meshStandardMaterial color="#f2e3bb" roughness={0.95} />
            </mesh>
            <Text position={[0.62, 0.16, 0]} fontSize={0.16} color="#6b4f2a" anchorX="center" rotation={[0, Math.PI / 2, 0]}>
              {String(Math.pow(2, i))}
            </Text>
          </group>
        );
      })}
    </group>
  );
}

// --- Water + islands ------------------------------------------------------------------
function DeltaWater() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (ref.current) {
      const m = ref.current.material as THREE.MeshStandardMaterial;
      m.emissiveIntensity = 0.22 + Math.sin(state.clock.elapsedTime * 0.5) * 0.05;
    }
  });
  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.16, -10]}>
      <planeGeometry args={[110, 110]} />
      <meshStandardMaterial
        color="#1d6f78"
        emissive="#2fa3a0"
        emissiveIntensity={0.25}
        roughness={0.15}
        metalness={0.4}
        transparent
        opacity={0.96}
      />
    </mesh>
  );
}

function IslandMesh({ island, tone }: { island: Island; tone: string }) {
  return (
    <group position={[island.c.x, 0, island.c.z]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, GROUND_Y - 0.14, 0]} receiveShadow>
        <circleGeometry args={[island.r + 0.7, 32]} />
        <meshStandardMaterial color={tone} roughness={0.95} />
      </mesh>
      {/* sandy rim kissing the water */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, GROUND_Y - 0.22, 0]}>
        <circleGeometry args={[island.r + 1.6, 32]} />
        <meshStandardMaterial color="#d9bd84" roughness={1} />
      </mesh>
    </group>
  );
}

function DeltaDressing() {
  return (
    <group>
      <IslandMesh island={ISLANDS[0]} tone="#8fae62" />
      <IslandMesh island={ISLANDS[1]} tone="#97b368" />
      <IslandMesh island={ISLANDS[2]} tone="#8fae62" />
      <IslandMesh island={ISLANDS[3]} tone="#9cb96e" />

      {/* palms + beach dressing */}
      <Model url={M('tree_palm')} position={[5, GROUND_Y - 0.1, 16.6]} scale={2.6} rotation={[0, 0.6, 0]} />
      <Model url={M('tree_palmShort')} position={[-5.2, GROUND_Y - 0.1, 17]} scale={2.4} rotation={[0, 2.4, 0]} />
      <Model url={M('tree_palmBend')} position={[-8.6, GROUND_Y - 0.1, -0.2]} scale={2.6} rotation={[0, 1.2, 0]} />
      <Model url={M('tree_palm')} position={[2.4, GROUND_Y - 0.1, 0.8]} scale={2.2} rotation={[0, 4, 0]} />
      <Model url={M('tree_palmShort')} position={[8.2, GROUND_Y - 0.1, -16.4]} scale={2.5} rotation={[0, 1.8, 0]} />
      <Model url={M('tree_palmBend')} position={[-1.6, GROUND_Y - 0.1, -22.4]} scale={2.3} rotation={[0, 0.3, 0]} />
      <Model url={M('tree_palm')} position={[-3.2, GROUND_Y - 0.1, -35.6]} scale={2.7} rotation={[0, 2.1, 0]} />
      <Model url={M('plant_flatTall')} position={[3.2, GROUND_Y - 0.12, 12.4]} scale={1.8} />
      <Model url={M('plant_flatTall')} position={[-6.8, GROUND_Y - 0.12, -4.6]} scale={1.7} rotation={[0, 1, 0]} />
      <Model url={M('grass_leafsLarge')} position={[6.6, GROUND_Y - 0.14, -21]} scale={1.8} rotation={[0, 0.7, 0]} />
      <Model url={M('rock_largeC')} position={[-4.6, GROUND_Y - 0.14, 15.8]} scale={1.3} rotation={[0, 0.9, 0]} />
      <Model url={M('rock_smallFlatC')} position={[1.2, GROUND_Y - 0.14, -17.6]} scale={1.5} />
      <Model url={M('canoe')} position={[6.2, -0.05, 11]} scale={1.7} rotation={[0, 2.6, 0]} />
      <Model url={M('crops_wheatStageB')} position={[-2.8, GROUND_Y - 0.12, -6.8]} scale={1.8} rotation={[0, 0.4, 0]} />
      <Model url={M('crops_wheatStageB')} position={[-4.4, GROUND_Y - 0.12, -6.2]} scale={1.6} rotation={[0, 1.3, 0]} />
    </group>
  );
}

// --- Dialogue ----------------------------------------------------------------------------
const INTRO: DialogueLine[] = [
  { speaker: 'two', text: 'Welcome to the Doubling Delta! I’m Two. The only even prime. Yes, it’s allowed. No, I won’t be taking questions.' },
  { speaker: 'two', text: 'My bridges only open for an exact total. Gather my power cells — 1, 2, 4, 8, 16 — and notice something: there’s only ever ONE way to build a number from us. Machines fell in love with that, you know.' },
];

const OUTRO: DialogueLine[] = [
  { speaker: 'two', text: 'Three gates, three numbers, and you never once needed the same cell twice. That’s binary, traveler — every number has exactly one name in my language.' },
  { speaker: 'zero', text: 'Hers is a very tidy language. It only has two words, and one of them is me.' },
  { speaker: 'narrator', text: 'Two joined your party. — Next: The Hailstone Caverns.' },
];

// --- Main scene ---------------------------------------------------------------------------
type Phase = 'title' | 'intro' | 'explore' | 'outro';

export function DeltaScene() {
  const [phase, setPhase] = useState<Phase>('title');
  const [stageIdx, setStageIdx] = useState(0);
  const [carried, setCarried] = useState<number[]>([]);
  const [field, setField] = useState<{ v: number; x: number; z: number }[]>(
    STAGES[0].cells.map((v, i) => ({ v, x: STAGES[0].cellSpots[i][0], z: STAGES[0].cellSpots[i][1] }))
  );
  const [opened, setOpened] = useState<boolean[]>([false, false, false]);
  const [depositGlow, setDepositGlow] = useState(false);
  const completeChapter = useStoryStore((s) => s.completeChapter);
  const ambient = useAmbient();

  const refs = useMovementRefs([0, GROUND_Y, 16.5]);
  useKeyboardMovement(refs, phase === 'explore');
  const touch = useMemo(() => isTouchDevice(), []);

  const carriedRef = useRef<number[]>([]);
  const stageRef = useRef(0);
  const openedRef = useRef([false, false, false]);
  const saidRice = useRef(false);

  const sum = carried.reduce((a, b) => a + b, 0);

  const pickCell = (v: number) => {
    setField((f) => f.filter((c) => c.v !== v));
    setCarried((c) => {
      const next = [...c, v].sort((a, b) => b - a);
      carriedRef.current = next;
      return next;
    });
  };

  const dropCell = (v: number) => {
    const p = refs.pos.current;
    setCarried((c) => {
      const next = c.filter((x) => x !== v);
      carriedRef.current = next;
      return next;
    });
    setField((f) => [...f, { v, x: p.x + 0.7, z: p.z + 0.4 }]);
  };

  const advanceStage = () => {
    const idx = stageRef.current;
    const nextIdx = idx + 1;
    setOpened((o) => {
      const n = [...o];
      n[idx] = true;
      openedRef.current = n;
      return n;
    });
    setCarried(() => {
      carriedRef.current = [];
      return [];
    });
    ambient.say('two', `Exactly ${STAGES[idx].target}! The cells return to the delta — they never stay spent for long.`);
    if (nextIdx < STAGES.length) {
      stageRef.current = nextIdx;
      setStageIdx(nextIdx);
      setField(STAGES[nextIdx].cells.map((v, i) => ({ v, x: STAGES[nextIdx].cellSpots[i][0], z: STAGES[nextIdx].cellSpots[i][1] })));
    } else {
      stageRef.current = nextIdx;
      setStageIdx(nextIdx);
      setField([]);
      setTimeout(() => setPhase('outro'), 1600);
    }
  };

  // gate deposit watcher
  const dwell = useRef(0);
  const firedAt = useRef(-1);
  function GateWatcher() {
    useFrame((_, delta) => {
      if (phase !== 'explore') return;
      const idx = stageRef.current;
      if (idx >= STAGES.length) return;
      const g = STAGES[idx].gate.pos;
      const ringWorld = new THREE.Vector3(g.x, 0, g.z).add(
        new THREE.Vector3(Math.sin(STAGES[idx].gate.yaw) * 1.5, 0, Math.cos(STAGES[idx].gate.yaw) * 1.5)
      );
      const p = refs.pos.current;
      const near = Math.hypot(p.x - ringWorld.x, p.z - ringWorld.z) < 1.35;
      setDepositGlow(near);
      if (!near) {
        dwell.current = 0;
        if (firedAt.current === idx) firedAt.current = -1;
        return;
      }
      if (firedAt.current === idx) return;
      dwell.current += delta;
      if (dwell.current >= GATE_DWELL) {
        firedAt.current = idx;
        const total = carriedRef.current.reduce((a, b) => a + b, 0);
        const target = STAGES[idx].target;
        if (total === target) {
          advanceStage();
        } else if (total < target) {
          ambient.say('two', `${total} won’t do — you’re ${target - total} short. And no, there is no ${target - total} cell unless you build it.`);
        } else {
          ambient.say('two', `Too heavy by ${total - target}. Drop something — tap a cell circling your head.`);
        }
      }
    });
    return null;
  }

  // rice row ambient trigger
  function RiceWatcher() {
    useFrame(() => {
      if (saidRice.current || phase !== 'explore') return;
      const p = refs.pos.current;
      if (stageRef.current >= 1 && Math.hypot(p.x + 6.6, p.z + 3.4) < 4.2) {
        saidRice.current = true;
        ambient.say('two', 'My rice row! One grain, then double each square. By square 64 you’d bury this whole delta. Doubling doesn’t walk — it leaps.');
      }
    });
    return null;
  }

  // walkable clamp: islands + opened bridges
  const clamp = (next: THREE.Vector3, current: THREE.Vector3): ClampResult => {
    const onIsland = (p: THREE.Vector3) =>
      ISLANDS.some((isl) => Math.hypot(p.x - isl.c.x, p.z - isl.c.z) < isl.r);
    const onBridge = (p: THREE.Vector3) => {
      for (let i = 0; i < STAGES.length; i++) {
        if (!openedRef.current[i]) continue;
        const { a, b } = STAGES[i].bridge;
        const ab = b.clone().sub(a);
        const len = ab.length();
        const t = THREE.MathUtils.clamp(p.clone().sub(a).dot(ab) / (len * len), 0, 1);
        const closest = a.clone().add(ab.multiplyScalar(t));
        if (Math.hypot(p.x - closest.x, p.z - closest.z) < 0.95) return true;
      }
      return false;
    };
    if (onIsland(next) || onBridge(next)) {
      next.y = GROUND_Y;
      return { position: next };
    }
    const slideX = new THREE.Vector3(next.x, current.y, current.z);
    if (onIsland(slideX) || onBridge(slideX)) return { position: slideX };
    const slideZ = new THREE.Vector3(current.x, current.y, next.z);
    if (onIsland(slideZ) || onBridge(slideZ)) return { position: slideZ };
    return { position: current };
  };

  // binary readout of the carried total
  const binSlots = [16, 8, 4, 2, 1].map((b) => ({ b, on: carried.includes(b) }));

  return (
    <div className="fixed inset-0 z-40" style={{ background: '#2a4358' }}>
      <Canvas shadows={!LOW_PERF} dpr={LOW_PERF ? [0.7, 1] : [1, 1.5]} camera={{ position: [0, 6, 24], fov: 55 }}>
        <Suspense fallback={null}>
          <color attach="background" args={['#7fb2c9']} />
          <fog attach="fog" args={['#a8cfd8', 26, 80]} />

          {/* golden dawn */}
          <ambientLight intensity={0.55} color="#ffe9c4" />
          <directionalLight position={[14, 10, 8]} intensity={1.15} color="#ffd9a0" castShadow={!LOW_PERF} />
          <hemisphereLight args={['#bfe3ef', '#5a7a52', 0.5]} />
          {/* low sun disc */}
          <group position={[44, 9, -48]}>
            <mesh>
              <circleGeometry args={[6, 36]} />
              <meshBasicMaterial color="#ffdf9e" toneMapped={false} />
            </mesh>
            <mesh position={[0, 0, -0.2]}>
              <circleGeometry args={[10, 36]} />
              <meshBasicMaterial color="#ffce7a" transparent opacity={0.22} />
            </mesh>
          </group>

          <DeltaWater />
          <DeltaDressing />
          <RiceRow />

          {STAGES.map((st, i) => (
            <group key={i}>
              <BridgeGate stage={st} open={opened[i]} depositGlow={depositGlow && stageIdx === i} />
              <Bridge stage={st} open={opened[i]} />
            </group>
          ))}

          {field.map((c) => (
            <FieldCell key={`${c.v}`} value={c.v} position={[c.x, GROUND_Y, c.z]} onPick={() => pickCell(c.v)} />
          ))}
          <CarriedCells refs={refs} cells={carried} onDrop={dropCell} />

          {/* tap-to-move on island ground */}
          {ISLANDS.map((isl, i) => (
            <mesh
              key={i}
              rotation={[-Math.PI / 2, 0, 0]}
              position={[isl.c.x, GROUND_Y - 0.1, isl.c.z]}
              visible={false}
              onClick={(e) => {
                e.stopPropagation();
                if (e.delta > 6) return;
                if (phase === 'explore') refs.setTarget(e.point);
              }}
            >
              <circleGeometry args={[isl.r, 28]} />
              <meshBasicMaterial />
            </mesh>
          ))}

          <GateWatcher />
          <RiceWatcher />
          <PlayerMover refs={refs} clamp={clamp} frozen={phase !== 'explore'} />
          <StoryPawn refs={refs} />
          <ZeroFollower refs={refs} />
          <Two3D position={[3.4, 1.5, 14.8]} />
          <StoryFollowCamera refs={refs} distance={8.8} />
        </Suspense>
      </Canvas>

      {ambient.node}

      {/* HUD: carried total as binary slots */}
      {phase === 'explore' && (
        <div className="absolute top-16 left-0 flex flex-col items-start gap-2 p-4 pointer-events-none">
          <div className="hud-panel px-5 py-3">
            <div className="label-caps mb-1.5">Carrying</div>
            <div className="flex items-end gap-2">
              <div className="big-number" style={{ fontSize: 'clamp(1.7rem, 4.5vw, 2.4rem)', color: '#FFE66D' }}>
                {sum}
              </div>
              <div className="flex gap-1 pb-1.5">
                {binSlots.map(({ b, on }) => (
                  <div
                    key={b}
                    className="rounded-sm flex items-end justify-center font-body font-bold"
                    style={{
                      width: 22,
                      height: 26,
                      fontSize: 9,
                      color: on ? '#0D2F5E' : 'rgba(255,255,255,0.35)',
                      background: on ? 'linear-gradient(180deg, #7FDBFF, #3185FC)' : 'rgba(255,255,255,0.08)',
                      border: '1px solid rgba(255,255,255,0.2)',
                    }}
                  >
                    {b}
                  </div>
                ))}
              </div>
            </div>
            {stageIdx < STAGES.length && (
              <div className="mt-1 text-xs" style={{ fontFamily: 'var(--font-body)', color: 'var(--color-text-secondary)' }}>
                gate wants <b style={{ color: '#FFE66D' }}>{STAGES[stageIdx].target}</b>
              </div>
            )}
          </div>
          <div className="text-[11px]" style={{ fontFamily: 'var(--font-body)', color: 'rgba(255,255,255,0.45)' }}>
            {touch
              ? 'walk over a cell to study it · tap to pick up · stand in the gate ring to offer'
              : 'tap a cell to pick it up · tap an orbiting cell to drop · stand in the gate ring to offer'}
          </div>
        </div>
      )}

      {phase === 'explore' && touch && <VirtualJoystick refs={refs} />}

      {phase === 'title' && (
        <ChapterTitle eyebrow="Chapter Three" title="The Doubling Delta" accent="#3185FC" onDone={() => setPhase('intro')} />
      )}
      {phase === 'intro' && <DialogueScene lines={INTRO} onComplete={() => setPhase('explore')} skipLabel="Skip" />}
      {phase === 'outro' && (
        <DialogueScene
          lines={OUTRO}
          onComplete={() => {
            completeChapter('delta', { companion: 'two' });
            useStoryStore.getState().goToChapter('hailstone');
          }}
        />
      )}
    </div>
  );
}

['tree_palm', 'tree_palmShort', 'tree_palmBend', 'plant_flatTall', 'grass_leafsLarge', 'rock_largeC', 'rock_smallFlatC', 'canoe', 'crops_wheatStageB'].forEach((m) =>
  useGLTF.preload(M(m))
);
