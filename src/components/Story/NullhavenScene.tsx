import { Suspense, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerspectiveCamera, Stars, Sparkles, Text, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { motion } from 'framer-motion';
import { useStoryStore } from '../../stores/storyStore';
import { DialogueScene, type DialogueLine } from './DialogueScene';
import { LOW_PERF } from '../../utils/perf';

// ============================================================
//  Chapter 1 — Nullhaven, the Mirror Marsh.
//  Cross the marsh on numbered stepping stones; the marsh only
//  holds a traveler whose running sum is exactly zero.
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

// --- The puzzle layout -----------------------------------------------------
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

// --- Zero, in the flesh (such as it is) ------------------------------------
function Zero3D({ position }: { position: [number, number, number] }) {
  const group = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!group.current) return;
    const t = state.clock.elapsedTime;
    group.current.position.y = position[1] + Math.sin(t * 1.2) * 0.12;
    group.current.rotation.y = Math.sin(t * 0.4) * 0.25;
  });
  return (
    <group ref={group} position={position}>
      {/* the ring */}
      <mesh rotation={[0, 0, 0]} castShadow>
        <torusGeometry args={[0.55, 0.21, 16, 36]} />
        <meshStandardMaterial color="#2d2d5a" roughness={0.4} metalness={0.3} emissive="#4ECDC4" emissiveIntensity={0.22} />
      </mesh>
      {/* rim glow */}
      <mesh>
        <torusGeometry args={[0.55, 0.26, 12, 36]} />
        <meshBasicMaterial color="#4ECDC4" transparent opacity={0.12} />
      </mesh>
      {/* eyes floating in the hole */}
      <mesh position={[-0.16, 0.06, 0]}>
        <sphereGeometry args={[0.07, 10, 10]} />
        <meshStandardMaterial color="#eafffd" emissive="#eafffd" emissiveIntensity={1.6} toneMapped={false} />
      </mesh>
      <mesh position={[0.16, 0.06, 0]}>
        <sphereGeometry args={[0.07, 10, 10]} />
        <meshStandardMaterial color="#eafffd" emissive="#eafffd" emissiveIntensity={1.6} toneMapped={false} />
      </mesh>
      {/* soft light he carries with him */}
      <pointLight color="#4ECDC4" intensity={1.4} distance={7} decay={2} />
    </group>
  );
}

// --- One stepping stone -----------------------------------------------------
function Stone({ value, position, reachable, stepped, onStep }: {
  value: number;
  position: [number, number, number];
  reachable: boolean;
  stepped: boolean;
  onStep: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const bob = Math.sin(state.clock.elapsedTime * 0.9 + position[0] * 2 + position[2]) * 0.04;
    ref.current.position.y = position[1] + bob + (hovered && reachable ? 0.12 : 0);
  });

  const warm = value > 0;
  const labelColor = value === 0 ? '#eafffd' : warm ? '#FFE66D' : '#7FDBFF';

  return (
    <group
      ref={ref}
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        if (reachable) onStep();
      }}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <Model url={M('path_stoneCircle')} position={[0, 0, 0]} scale={[1.7, 1.4, 1.7]} />
      {/* reachable halo */}
      {reachable && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.16, 0]}>
          <ringGeometry args={[0.78, 0.95, 28]} />
          <meshBasicMaterial color="#4ECDC4" transparent opacity={hovered ? 0.85 : 0.4} />
        </mesh>
      )}
      {stepped && (
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

// --- The player's marble ----------------------------------------------------
function PlayerMarble({ target }: { target: [number, number, number] }) {
  const ref = useRef<THREE.Mesh>(null);
  const pos = useRef(new THREE.Vector3(...target));
  useFrame((state, delta) => {
    if (!ref.current) return;
    const t = new THREE.Vector3(...target);
    pos.current.lerp(t, Math.min(1, delta * 5));
    // little hop arc while traveling
    const dist = pos.current.distanceTo(t);
    ref.current.position.copy(pos.current);
    ref.current.position.y += Math.min(0.6, dist * 0.8) * Math.abs(Math.sin(state.clock.elapsedTime * 9));
  });
  return (
    <mesh ref={ref} castShadow>
      <sphereGeometry args={[0.3, 20, 20]} />
      <meshStandardMaterial color="#E84855" roughness={0.25} metalness={0.2} emissive="#E84855" emissiveIntensity={0.15} />
    </mesh>
  );
}

// --- Water ----------------------------------------------------------------
function MarshWater() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (ref.current) {
      const m = ref.current.material as THREE.MeshStandardMaterial;
      m.emissiveIntensity = 0.16 + Math.sin(state.clock.elapsedTime * 0.6) * 0.05;
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

// --- Set dressing -----------------------------------------------------------
function MarshDressing() {
  return (
    <group>
      {/* start bank (south) and Zero's island (north) */}
      <mesh position={[0, -0.12, START_Z + 3.4]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[7.5, 28]} />
        <meshStandardMaterial color="#36474f" roughness={0.95} />
      </mesh>
      <mesh position={[0, -0.1, BANK_Z - 3.2]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[7, 28]} />
        <meshStandardMaterial color="#3a4d56" roughness={0.95} />
      </mesh>

      {/* dark trees ringing the marsh */}
      <Model url={M('tree_default_dark')} position={[-6.5, -0.3, START_Z + 4]} scale={2.6} />
      <Model url={M('tree_thin_dark')} position={[5.8, -0.3, START_Z + 5]} scale={2.4} rotation={[0, 1.2, 0]} />
      <Model url={M('tree_oak_dark')} position={[-7, -0.3, BANK_Z - 4]} scale={2.8} rotation={[0, 2.4, 0]} />
      <Model url={M('tree_default_dark')} position={[6.6, -0.3, BANK_Z - 5]} scale={2.2} rotation={[0, 0.7, 0]} />
      <Model url={M('pine-crooked')} position={[8.4, -0.3, 0]} scale={3.2} rotation={[0, 2, 0]} />
      <Model url={M('pine-crooked')} position={[-8.8, -0.3, -1.5]} scale={2.8} rotation={[0, 4.1, 0]} />

      {/* lanterns marking the crossing */}
      <group position={[-3.6, -0.25, START_Z + 1.2]}>
        <Model url={M('lightpost-single')} position={[0, 0, 0]} scale={1.6} />
        <pointLight position={[0, 2.4, 0]} color="#FFE66D" intensity={1.1} distance={6} decay={2} />
      </group>
      <group position={[3.8, -0.25, BANK_Z + 1]}>
        <Model url={M('lightpost-single')} position={[0, 0, 0]} scale={1.6} rotation={[0, Math.PI, 0]} />
        <pointLight position={[0, 2.4, 0]} color="#FFE66D" intensity={1.1} distance={6} decay={2} />
      </group>

      {/* Zero's canoe, moored at his island */}
      <Model url={M('canoe')} position={[2.8, -0.12, BANK_Z - 1.6]} scale={1.8} rotation={[0, 0.5, 0]} />

      {/* lilies + reeds + mushrooms scattered in the shallows */}
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

// --- Dialogue ---------------------------------------------------------------
const INTRO: DialogueLine[] = [
  { speaker: 'zero', text: 'Welcome to Nullhaven. My home — the Mirror Marsh, where everything cancels.' },
  { speaker: 'zero', text: 'Every number here has a twin across the water. Four and minus-four. Seven and minus-seven. Equal. Opposite. Inseparable.' },
  { speaker: 'zero', text: 'The stones will carry you across — but this marsh only holds a traveler whose steps balance. Step on a +4, and you owe the water a −4.' },
  { speaker: 'zero', text: 'Reach my island carrying exactly nothing. I know how that sounds. Carrying nothing is my entire life.' },
];

const OUTRO: DialogueLine[] = [
  { speaker: 'zero', text: 'Perfectly balanced. You felt it, didn’t you? Adding and subtracting are the same walk — in opposite directions.' },
  { speaker: 'zero', text: 'The Devil believes people forgot that. Forgot all of it. Maybe he’s not entirely wrong. But locking the numbers away won’t make anyone remember.' },
  { speaker: 'zero', text: 'I’m coming with you. A journey to the Hundredth Square needs someone who knows the value of nothing.' },
  { speaker: 'narrator', text: 'Zero joined your party. — End of Chapter One. The Clockwork Commons lies ahead… (coming soon).' },
];

const FAIL_LINES = [
  'The marsh shivers — you’re carrying weight. Balance it out and try again.',
  'Still heavy. Remember: every step you take, the water remembers its mirror.',
];

// --- Main scene ---------------------------------------------------------------
type ScenePhase = 'intro' | 'puzzle' | 'outro';

export function NullhavenScene() {
  const [phase, setPhase] = useState<ScenePhase>('intro');
  // player location: col -1 = start bank; 0..4 = stone columns; 5 = arrived
  const [col, setCol] = useState(-1);
  const [stoneIdx, setStoneIdx] = useState(1);
  const [sum, setSum] = useState(0);
  const [fails, setFails] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const completeChapter = useStoryStore((s) => s.completeChapter);
  const exitStory = useStoryStore((s) => s.exitStory);

  const playerTarget: [number, number, number] =
    col === -1
      ? [0, 0.45, START_Z + 1.2]
      : col >= STONE_COLS.length
        ? [0, 0.45, BANK_Z - 1.8]
        : [stoneX(stoneIdx), 0.65, colZ(col)];

  const stepToStone = (c: number, idx: number) => {
    const value = STONE_COLS[c][idx];
    setCol(c);
    setStoneIdx(idx);
    setSum((s) => s + value);
    setToast(null);
  };

  const stepToBank = () => {
    if (sum === 0) {
      setCol(STONE_COLS.length);
      setTimeout(() => setPhase('outro'), 900);
    } else {
      const f = fails + 1;
      setFails(f);
      setToast(
        `${FAIL_LINES[Math.min(f - 1, FAIL_LINES.length - 1)]} (You’re carrying ${sum > 0 ? '+' : ''}${sum}.)`
      );
      setCol(-1);
      setStoneIdx(1);
      setSum(0);
    }
  };

  const showHint = fails >= 2;

  return (
    <div className="fixed inset-0 z-40" style={{ background: '#0a0918' }}>
      <Canvas shadows={!LOW_PERF} dpr={LOW_PERF ? [0.7, 1] : [1, 1.5]}>
        <Suspense fallback={null}>
          <PerspectiveCamera makeDefault position={[0, 7.5, START_Z + 7.5]} fov={55} rotation={[-0.52, 0, 0]} />
          <color attach="background" args={['#0a0918']} />
          <fog attach="fog" args={['#0e1426', 14, 42]} />

          <ambientLight intensity={0.5} color="#8a9cc9" />
          <directionalLight position={[6, 12, 4]} intensity={0.7} color="#a8bdec" castShadow={!LOW_PERF} />
          {/* moon glow on the water */}
          <pointLight position={[0, 6, -2]} intensity={0.8} color="#7fb0d8" distance={26} decay={2} />

          <Stars radius={50} depth={30} count={LOW_PERF ? 300 : 800} factor={2.5} saturation={0} fade speed={0.4} />
          <Sparkles position={[0, 1.5, 0]} count={LOW_PERF ? 14 : 36} scale={[18, 4, 16]} size={2} speed={0.18} opacity={0.5} color="#9fe8df" />

          <MarshWater />
          <MarshDressing />

          {/* the stones */}
          {STONE_COLS.map((colStones, c) =>
            colStones.map((value, idx) => (
              <Stone
                key={`${c}-${idx}`}
                value={value}
                position={[stoneX(idx), 0.05, colZ(c)]}
                reachable={phase === 'puzzle' && c === col + 1}
                stepped={c === col && idx === stoneIdx}
                onStep={() => stepToStone(c, idx)}
              />
            ))
          )}

          {/* far bank step target */}
          {phase === 'puzzle' && col === STONE_COLS.length - 1 && (
            <group position={[0, 0.05, BANK_Z - 1]} onClick={stepToBank}>
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1, 0]}>
                <ringGeometry args={[1, 1.3, 32]} />
                <meshBasicMaterial color="#FFE66D" transparent opacity={0.7} />
              </mesh>
              <Text position={[0, 0.7, 0]} fontSize={0.4} color="#FFE66D" anchorX="center" outlineWidth={0.02} outlineColor="#0a0918">
                step ashore
              </Text>
            </group>
          )}

          <PlayerMarble target={playerTarget} />
          <group scale={1.45}>
            <Zero3D position={[0, 0.85, (BANK_Z - 2.6) / 1.45]} />
          </group>
        </Suspense>
      </Canvas>

      {/* HUD: running balance */}
      {phase === 'puzzle' && (
        <div className="absolute top-0 left-0 right-0 flex flex-col items-center pt-4 hud-safe-top pointer-events-none">
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
            <div className="hud-panel mt-2 px-4 py-2 text-sm" style={{ fontFamily: 'var(--font-body)', color: 'var(--color-text-secondary)' }}>
              Zero whispers: “try +4, then −7, then +5, then −2… then the stone that adds nothing.”
            </div>
          )}
          {toast && (
            <motion.div
              key={toast}
              className="hud-panel mt-2 px-4 py-2 text-sm max-w-md text-center"
              style={{ fontFamily: 'var(--font-body)', color: '#FFE66D' }}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {toast}
            </motion.div>
          )}
        </div>
      )}

      {phase === 'intro' && (
        <DialogueScene lines={INTRO} onComplete={() => setPhase('puzzle')} skipLabel="Skip" />
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
