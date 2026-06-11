import { Suspense, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Stars, Sparkles, Text, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { motion } from 'framer-motion';
import { useStoryStore } from '../../stores/storyStore';
import { DialogueScene, type DialogueLine } from './DialogueScene';
import { LOW_PERF } from '../../utils/perf';

// ============================================================
//  Chapter 1 — Nullhaven, the Mirror Marsh.
//  Fully walkable: tap anywhere on land to walk, hop the numbered
//  stones across the water. The marsh only holds a traveler whose
//  running sum is exactly zero.
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
// 5 columns of 3 stones. Intended zero path: +4, -7, +5, -2, 0.
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
const BANK_Z = colZ(STONE_COLS.length); // far bank
const SOUTH_BANK: [number, number, number] = [0, 0, START_Z + 3.4];
const NORTH_BANK: [number, number, number] = [0, 0, BANK_Z - 3.2];

// Where the pawn is allowed to stand, logically
type PawnSpot =
  | { kind: 'south'; point: THREE.Vector3 }
  | { kind: 'stone'; col: number; idx: number }
  | { kind: 'north'; point: THREE.Vector3 };

function spotPosition(spot: PawnSpot): THREE.Vector3 {
  if (spot.kind === 'stone') {
    return new THREE.Vector3(stoneX(spot.idx), 0.5, colZ(spot.col));
  }
  return spot.point.clone().setY(0.32);
}

// --- Your pawn — the one that fell off the board ----------------------------
function StoryPawn({ posRef, movingRef }: {
  posRef: React.MutableRefObject<THREE.Vector3>;
  movingRef: React.MutableRefObject<boolean>;
}) {
  const group = useRef<THREE.Group>(null);
  const facing = useRef(0);
  useFrame((state) => {
    if (!group.current) return;
    group.current.position.copy(posRef.current);
    // walk-bob while moving, gentle idle breathing otherwise
    const t = state.clock.elapsedTime;
    if (movingRef.current) {
      group.current.position.y += Math.abs(Math.sin(t * 10)) * 0.18;
      group.current.rotation.z = Math.sin(t * 10) * 0.06;
    } else {
      group.current.position.y += Math.sin(t * 2) * 0.03;
      group.current.rotation.z = 0;
    }
    group.current.rotation.y = facing.current;
  });
  // expose facing through the ref object (mutated by the controller)
  (posRef as unknown as { facing?: React.MutableRefObject<number> }).facing = facing;
  return (
    <group ref={group}>
      {/* body — same silhouette as the board pawns */}
      <mesh position={[0, 0.25, 0]} castShadow>
        <capsuleGeometry args={[0.2, 0.3, 8, 16]} />
        <meshStandardMaterial color="#E84855" roughness={0.3} metalness={0.15} />
      </mesh>
      <mesh position={[0, 0.62, 0]} castShadow>
        <sphereGeometry args={[0.205, 16, 16]} />
        <meshStandardMaterial color="#E84855" roughness={0.25} metalness={0.15} emissive="#E84855" emissiveIntensity={0.12} />
      </mesh>
      {/* little eyes so it reads as *you* out here in the dark */}
      <mesh position={[-0.07, 0.66, 0.17]}>
        <sphereGeometry args={[0.035, 8, 8]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.8} />
      </mesh>
      <mesh position={[0.07, 0.66, 0.17]}>
        <sphereGeometry args={[0.035, 8, 8]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.8} />
      </mesh>
      {/* soft ground ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[0.26, 0.36, 20]} />
        <meshBasicMaterial color="#E84855" transparent opacity={0.35} />
      </mesh>
    </group>
  );
}

// --- Follow camera -----------------------------------------------------------
function FollowCamera({ posRef }: { posRef: React.MutableRefObject<THREE.Vector3> }) {
  const { camera } = useThree();
  const look = useRef(new THREE.Vector3());
  useFrame((_, delta) => {
    const target = posRef.current;
    const desired = new THREE.Vector3(target.x * 0.6, target.y + 5.2, target.z + 6.8);
    camera.position.lerp(desired, Math.min(1, delta * 2.2));
    look.current.lerp(new THREE.Vector3(target.x, target.y + 0.6, target.z - 1), Math.min(1, delta * 2.6));
    camera.lookAt(look.current);
  });
  return null;
}

// --- Zero --------------------------------------------------------------------
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

// --- Stones ------------------------------------------------------------------
function Stone({ value, position, reachable, occupied, onStep }: {
  value: number;
  position: [number, number, number];
  reachable: boolean;
  occupied: boolean;
  onStep: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const bob = Math.sin(state.clock.elapsedTime * 0.9 + position[0] * 2 + position[2]) * 0.04;
    ref.current.position.y = position[1] + bob + (hovered && reachable ? 0.1 : 0);
  });

  const labelColor = value === 0 ? '#eafffd' : value > 0 ? '#FFE66D' : '#7FDBFF';

  return (
    <group
      ref={ref}
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        if (reachable) onStep();
      }}
      onPointerOver={() => reachable && setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <Model url={M('path_stoneCircle')} position={[0, 0, 0]} scale={[1.7, 1.4, 1.7]} />
      {reachable && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.16, 0]}>
          <ringGeometry args={[0.78, 0.95, 28]} />
          <meshBasicMaterial color="#4ECDC4" transparent opacity={hovered ? 0.9 : 0.45} />
        </mesh>
      )}
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

// --- Water & dressing ---------------------------------------------------------
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

function MarshDressing() {
  return (
    <group>
      {/* banks */}
      <mesh position={[SOUTH_BANK[0], -0.12, SOUTH_BANK[2]]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[7.5, 28]} />
        <meshStandardMaterial color="#36474f" roughness={0.95} />
      </mesh>
      <mesh position={[NORTH_BANK[0], -0.1, NORTH_BANK[2]]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
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
    </group>
  );
}

// --- Dialogue ------------------------------------------------------------------
const INTRO: DialogueLine[] = [
  { speaker: 'zero', text: 'Welcome to Nullhaven. My home — the Mirror Marsh, where everything cancels.' },
  { speaker: 'zero', text: 'Every number here has a twin across the water. Four and minus-four. Seven and minus-seven. Equal. Opposite. Inseparable.' },
  { speaker: 'zero', text: 'Come to me across the stones — but listen: the marsh only holds a traveler whose steps balance. Step on a +4, and you owe the water a −4.' },
  { speaker: 'zero', text: 'Reach my island carrying exactly nothing. I know how that sounds. Carrying nothing is my entire life.' },
];

const OUTRO: DialogueLine[] = [
  { speaker: 'zero', text: 'Perfectly balanced. You felt it, didn’t you? Adding and subtracting are the same walk — in opposite directions.' },
  { speaker: 'zero', text: 'The Devil believes people forgot that. Forgot all of it. Maybe he’s not entirely wrong. But locking the numbers away won’t make anyone remember.' },
  { speaker: 'zero', text: 'I’m coming with you. A journey to the Hundredth Square needs someone who knows the value of nothing.' },
  { speaker: 'narrator', text: 'Zero joined your party. — End of Chapter One. The Clockwork Commons lies ahead… (coming soon).' },
];

const FAIL_LINES = [
  'The marsh shivers — you’re carrying weight. It sets you back ashore.',
  'Still unbalanced. Every step you take, the water remembers its mirror.',
];

// --- Main scene -------------------------------------------------------------------
type ScenePhase = 'intro' | 'explore' | 'outro';

export function NullhavenScene() {
  const [phase, setPhase] = useState<ScenePhase>('intro');
  const [spot, setSpot] = useState<PawnSpot>({ kind: 'south', point: new THREE.Vector3(0, 0, START_Z + 1.6) });
  const [sum, setSum] = useState(0);
  const [fails, setFails] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [splash, setSplash] = useState<THREE.Vector3 | null>(null);
  const completeChapter = useStoryStore((s) => s.completeChapter);
  const exitStory = useStoryStore((s) => s.exitStory);

  // Pawn position is animated imperatively for smoothness
  const pawnPos = useRef(new THREE.Vector3(0, 0.32, START_Z + 1.6));
  const moving = useRef(false);
  const targetRef = useRef(spotPosition(spot));

  // Per-frame mover lives in a child of <Canvas>; declared here as a component
  function PawnMover() {
    useFrame((_, delta) => {
      const target = targetRef.current;
      const dist = pawnPos.current.distanceTo(target);
      moving.current = dist > 0.08;
      if (moving.current) {
        const step = Math.min(dist, delta * 4.2);
        const dir = target.clone().sub(pawnPos.current).normalize();
        pawnPos.current.add(dir.multiplyScalar(step));
        const f = (pawnPos as unknown as { facing?: React.MutableRefObject<number> }).facing;
        if (f) f.current = Math.atan2(dir.x, dir.z);
      }
    });
    return null;
  }

  const goTo = (next: PawnSpot) => {
    setSpot(next);
    targetRef.current = spotPosition(next);
    setToast(null);
  };

  const stepToStone = (c: number, idx: number) => {
    const value = STONE_COLS[c][idx];
    goTo({ kind: 'stone', col: c, idx });
    setSum((s) => s + value);
  };

  const arriveNorth = (point: THREE.Vector3) => {
    if (sum === 0) {
      goTo({ kind: 'north', point });
      setTimeout(() => setPhase('outro'), 1100);
    } else {
      // splash where the pawn stood, then wash back to the south bank
      setSplash(pawnPos.current.clone());
      const f = fails + 1;
      setFails(f);
      setToast(
        `${FAIL_LINES[Math.min(f - 1, FAIL_LINES.length - 1)]} (You were carrying ${sum > 0 ? '+' : ''}${sum}.)`
      );
      setSum(0);
      goTo({ kind: 'south', point: new THREE.Vector3(0, 0, START_Z + 1.6) });
      setTimeout(() => setSplash(null), 900);
    }
  };

  const currentCol = spot.kind === 'stone' ? spot.col : spot.kind === 'south' ? -1 : STONE_COLS.length;
  const showHint = fails >= 2;

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
          <MarshDressing />
          <SplashRing at={splash} />

          {/* walkable south bank: tap to walk anywhere on it */}
          <mesh
            position={[SOUTH_BANK[0], -0.08, SOUTH_BANK[2]]}
            rotation={[-Math.PI / 2, 0, 0]}
            visible={false}
            onClick={(e) => {
              e.stopPropagation();
              if (phase !== 'explore') return;
              if (currentCol !== -1) return; // can only stroll the bank you're on
              const p = e.point.clone();
              const d = Math.hypot(p.x - SOUTH_BANK[0], p.z - SOUTH_BANK[2]);
              if (d < 6.8) goTo({ kind: 'south', point: p });
            }}
          >
            <circleGeometry args={[7.5, 28]} />
            <meshBasicMaterial />
          </mesh>

          {/* north shore: stepping ashore checks your balance */}
          <mesh
            position={[NORTH_BANK[0], -0.06, NORTH_BANK[2]]}
            rotation={[-Math.PI / 2, 0, 0]}
            visible={false}
            onClick={(e) => {
              e.stopPropagation();
              if (phase !== 'explore') return;
              if (currentCol !== STONE_COLS.length - 1) return; // must be on the last column
              arriveNorth(e.point.clone());
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

          {/* the stones */}
          {STONE_COLS.map((colStones, c) =>
            colStones.map((value, idx) => (
              <Stone
                key={`${c}-${idx}`}
                value={value}
                position={[stoneX(idx), 0.05, colZ(c)]}
                reachable={phase === 'explore' && c === currentCol + 1}
                occupied={spot.kind === 'stone' && spot.col === c && spot.idx === idx}
                onStep={() => stepToStone(c, idx)}
              />
            ))
          )}

          <PawnMover />
          <StoryPawn posRef={pawnPos} movingRef={moving} />
          <Zero3D position={[0, 1.15, BANK_Z - 2.6]} />
          <FollowCamera posRef={pawnPos} />
        </Suspense>
      </Canvas>

      {/* HUD: running balance (top-left so it never covers Zero) */}
      {phase === 'explore' && (
        <div className="absolute top-0 left-0 flex flex-col items-start gap-2 p-4 hud-safe-top pointer-events-none">
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
          {showHint && (
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
            tap the land to walk · tap a glowing stone to hop
          </div>
        </div>
      )}

      {phase === 'intro' && (
        <DialogueScene lines={INTRO} onComplete={() => setPhase('explore')} skipLabel="Skip" />
      )}
      {phase === 'outro' && (
        <DialogueScene
          lines={OUTRO}
          onComplete={() => {
            completeChapter('nullhaven', { companion: 'zero', flawless: fails === 0 });
            exitStory();
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
