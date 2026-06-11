import { Suspense, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Billboard, Sparkles, Text } from '@react-three/drei';
import * as THREE from 'three';
import { motion } from 'framer-motion';
import { useStoryStore } from '../../stores/storyStore';
import { DialogueScene, type DialogueLine } from './DialogueScene';
import { useAmbient } from './AmbientBubble';
import { ChapterTitle } from './ChapterTitle';
import { ChapterComplete } from './ChapterComplete';
import { collatzSequence, collatzStep } from './storyLogic';
import { LOW_PERF } from '../../utils/perf';
import {
  useMovementRefs, useKeyboardMovement, isTouchDevice,
  PlayerMover, VirtualJoystick, StoryFollowCamera, StoryPawn, ZeroFollower,
  type ClampResult,
} from './movement';

// ============================================================
//  Chapter 4 — The Hailstone Caverns.
//  Pick a number, board the cart. Odd numbers climb (3n+1),
//  even numbers plunge (n/2). Everything comes home to 1 —
//  probably. Nobody has ever proven it.
// ============================================================

const GROUND_Y = 0.3;
const PLATFORM_C = new THREE.Vector3(0, 0, 0);
const PLATFORM_R = 8;

// Track geometry: stations at log-height so 9232 stays on screen
const STEP_X = 3.4;
const stationPos = (i: number, n: number): THREE.Vector3 =>
  new THREE.Vector3(12 + i * STEP_X, Math.log2(Math.max(1, n)) * 1.35 + 1.2, Math.sin(i * 0.55) * 5.5);

const PEDESTALS: { n: number; x: number; z: number; blurb: string }[] = [
  { n: 6, x: -3.6, z: -3.4, blurb: 'a gentle stroll' },
  { n: 7, x: 0, z: -4.6, blurb: 'a respectable tumble' },
  { n: 27, x: 3.6, z: -3.4, blurb: 'THE LEGEND' },
];

// --- Twenty-Seven: a goggled comet -------------------------------------------------
function TwentySeven3D({ position }: { position: [number, number, number] }) {
  const group = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!group.current) return;
    const t = state.clock.elapsedTime;
    group.current.position.set(
      position[0] + Math.sin(t * 0.9) * 1.4,
      position[1] + Math.sin(t * 1.7) * 0.5,
      position[2] + Math.cos(t * 0.7) * 1.1
    );
    group.current.rotation.y = Math.sin(t * 0.9) * 0.6;
  });
  return (
    <group ref={group}>
      <mesh castShadow>
        <sphereGeometry args={[0.42, 18, 18]} />
        <meshStandardMaterial color="#F9A03F" roughness={0.35} emissive="#F9A03F" emissiveIntensity={0.3} />
      </mesh>
      {/* goggles */}
      <mesh position={[-0.14, 0.1, 0.36]}>
        <torusGeometry args={[0.11, 0.035, 8, 16]} />
        <meshStandardMaterial color="#5b4632" roughness={0.6} />
      </mesh>
      <mesh position={[0.14, 0.1, 0.36]}>
        <torusGeometry args={[0.11, 0.035, 8, 16]} />
        <meshStandardMaterial color="#5b4632" roughness={0.6} />
      </mesh>
      <mesh position={[-0.14, 0.1, 0.39]}>
        <circleGeometry args={[0.085, 12]} />
        <meshStandardMaterial color="#FFE66D" emissive="#FFE66D" emissiveIntensity={0.9} toneMapped={false} />
      </mesh>
      <mesh position={[0.14, 0.1, 0.39]}>
        <circleGeometry args={[0.085, 12]} />
        <meshStandardMaterial color="#FFE66D" emissive="#FFE66D" emissiveIntensity={0.9} toneMapped={false} />
      </mesh>
      {/* little flame trail */}
      <mesh position={[-0.5, -0.05, -0.1]} rotation={[0, 0, Math.PI / 2]}>
        <coneGeometry args={[0.16, 0.5, 8]} />
        <meshStandardMaterial color="#FFE66D" emissive="#F9A03F" emissiveIntensity={1} transparent opacity={0.8} toneMapped={false} />
      </mesh>
      <pointLight color="#F9A03F" intensity={1.2} distance={7} decay={2} />
    </group>
  );
}

// --- Cavern dressing -----------------------------------------------------------------
function Cavern({ trackLen }: { trackLen: number }) {
  const crystals = useMemo(() => {
    const out: { p: [number, number, number]; s: number; c: string }[] = [];
    const cols = ['#9B59B6', '#4ECDC4', '#5BA3FC'];
    for (let i = 0; i < Math.min(60, 10 + trackLen / 2); i++) {
      const x = -10 + i * ((trackLen * STEP_X + 40) / 60);
      out.push({
        p: [x, GROUND_Y - 0.2, (i % 2 ? 11 : -11) + Math.sin(i * 3.7) * 3],
        s: 0.7 + ((i * 37) % 10) / 7,
        c: cols[i % 3],
      });
    }
    return out;
  }, [trackLen]);
  return (
    <group>
      {/* cave floor — a long dark ribbon under everything */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[trackLen * STEP_X * 0.5, -0.4, 0]}>
        <planeGeometry args={[trackLen * STEP_X + 80, 60]} />
        <meshStandardMaterial color="#171429" roughness={0.95} />
      </mesh>
      {/* arrival platform */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[PLATFORM_C.x, GROUND_Y - 0.12, PLATFORM_C.z]} receiveShadow>
        <circleGeometry args={[PLATFORM_R + 0.6, 32]} />
        <meshStandardMaterial color="#2c2745" roughness={0.9} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[PLATFORM_C.x, GROUND_Y - 0.1, PLATFORM_C.z]}>
        <ringGeometry args={[PLATFORM_R - 0.4, PLATFORM_R + 0.1, 32]} />
        <meshStandardMaterial color="#4ECDC4" emissive="#4ECDC4" emissiveIntensity={0.4} toneMapped={false} />
      </mesh>
      {/* crystals along the gallery */}
      {crystals.map((c, i) => (
        <group key={i} position={c.p}>
          <mesh rotation={[0.15, i, 0.1]} castShadow>
            <octahedronGeometry args={[c.s]} />
            <meshStandardMaterial color={c.c} emissive={c.c} emissiveIntensity={0.85} roughness={0.1} metalness={0.5} transparent opacity={0.92} toneMapped={false} />
          </mesh>
          {!LOW_PERF && i % 4 === 0 && <pointLight color={c.c} intensity={0.8} distance={9} decay={2} position={[0, 1.4, 0]} />}
        </group>
      ))}
      {/* stalactites overhead */}
      {Array.from({ length: Math.min(40, 8 + trackLen / 3) }).map((_, i) => {
        const x = -8 + i * ((trackLen * STEP_X + 60) / 40);
        const h = 2 + ((i * 53) % 17) / 4;
        return (
          <mesh key={i} position={[x, 17 + ((i * 29) % 7), Math.sin(i * 2.4) * 9]} rotation={[Math.PI, 0, Math.sin(i) * 0.12]}>
            <coneGeometry args={[0.5 + ((i * 13) % 5) / 6, h, 7]} />
            <meshStandardMaterial color="#241f3d" roughness={0.9} />
          </mesh>
        );
      })}
    </group>
  );
}

// --- Track + stations -------------------------------------------------------------------
function RideTrack({ seq, currentIdx }: { seq: number[]; currentIdx: number }) {
  const curve = useMemo(() => {
    const pts = seq.map((n, i) => stationPos(i, n));
    // lead-in from the platform
    pts.unshift(new THREE.Vector3(4, GROUND_Y + 1.2, 0));
    return new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.3);
  }, [seq]);

  const railGeo = useMemo(
    () => new THREE.TubeGeometry(curve, Math.min(900, seq.length * 9), 0.11, 8, false),
    [curve, seq.length]
  );

  return (
    <group>
      <mesh geometry={railGeo}>
        <meshStandardMaterial color="#b8b2c8" roughness={0.35} metalness={0.7} emissive="#564a7a" emissiveIntensity={0.35} />
      </mesh>
      {/* stations: pads + numbers (windowed around the cart to keep draw calls sane) */}
      {seq.map((n, i) => {
        if (Math.abs(i - currentIdx) > 13) return null;
        const p = stationPos(i, n);
        const odd = n % 2 === 1 && n !== 1;
        const color = n === 1 ? '#FFE66D' : odd ? '#F9A03F' : '#4ECDC4';
        return (
          <group key={i} position={[p.x, p.y, p.z]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.25, 0]}>
              <cylinderGeometry args={[0.7, 0.8, 0.16, 12]} />
              <meshStandardMaterial color="#453d6e" roughness={0.6} emissive="#564a7a" emissiveIntensity={0.4} />
            </mesh>
            <Billboard position={[0, 1.25, 0]}>
              <Text
                fontSize={i === currentIdx ? 0.78 : 0.5}
                color={color}
                anchorX="center"
                anchorY="middle"
                outlineWidth={0.04}
                outlineColor="#120e24"
              >
                {String(n)}
              </Text>
            </Billboard>
          </group>
        );
      })}
    </group>
  );
}

/** The mine cart, driven along the curve; the pawn rides inside. */
function Cart({ curveRef, tRef, refs }: {
  curveRef: React.MutableRefObject<THREE.CatmullRomCurve3 | null>;
  tRef: React.MutableRefObject<number>;
  refs: ReturnType<typeof useMovementRefs>;
}) {
  const group = useRef<THREE.Group>(null);
  useFrame(() => {
    const curve = curveRef.current;
    if (!curve || !group.current) return;
    const t = THREE.MathUtils.clamp(tRef.current, 0, 1);
    const p = curve.getPointAt(t);
    const tan = curve.getTangentAt(Math.min(0.999, t));
    group.current.position.copy(p);
    group.current.rotation.y = Math.atan2(tan.x, tan.z);
    group.current.rotation.z = -tan.y * 0.35; // bank into climbs/drops
    // the pawn (and the follow camera) ride along
    refs.pos.current.set(p.x, p.y + 0.45, p.z);
    refs.facing.current = Math.atan2(tan.x, tan.z);
  });
  return (
    <group ref={group}>
      <mesh position={[0, 0.32, 0]} castShadow>
        <boxGeometry args={[1.1, 0.55, 1.5]} />
        <meshStandardMaterial color="#7a4a2a" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.36, 0]}>
        <boxGeometry args={[0.92, 0.5, 1.32]} />
        <meshStandardMaterial color="#3a2414" roughness={0.85} />
      </mesh>
      {/* rim */}
      <mesh position={[0, 0.6, 0]}>
        <boxGeometry args={[1.16, 0.08, 1.56]} />
        <meshStandardMaterial color="#d4aa50" metalness={0.7} roughness={0.3} />
      </mesh>
      {[[-0.45, 0.55], [0.45, 0.55], [-0.45, -0.55], [0.45, -0.55]].map(([wx, wz], i) => (
        <mesh key={i} position={[wx, 0.06, wz]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.16, 0.16, 0.1, 12]} />
          <meshStandardMaterial color="#2a2438" roughness={0.5} metalness={0.6} />
        </mesh>
      ))}
    </group>
  );
}

// --- Dialogue -------------------------------------------------------------------------------
const INTRO: DialogueLine[] = [
  { speaker: 'twentyseven', text: 'WELCOME to the Hailstone Caverns! I’m Twenty-Seven. Down here every number rides the same rule: odd numbers TRIPLE-AND-ONE — up we go! — and evens get CHOPPED in half. Wheee.' },
  { speaker: 'twentyseven', text: 'Every cart ever launched has rattled its way home to 1. Probably always. NOBODY’S PROVEN IT — the Devil mines these caves for riddles like that. So: pick a number and ride it!' },
];

const OUTRO: DialogueLine[] = [
  { speaker: 'twentyseven', text: 'ONE HUNDRED AND ELEVEN STEPS! Up to nine thousand two hundred thirty-two and all the way home! THAT’S why 27 is the best number in these caves.' },
  { speaker: 'zero', text: 'Every cart comes home to 1… probably. “Probably” is the most dangerous word in mathematics. Hold onto it.' },
  { speaker: 'narrator', text: 'Twenty-Seven joined your party. — The delta, the commons, the marsh… and the road ahead keeps climbing.' },
];

// --- Main scene ---------------------------------------------------------------------------------
type Phase = 'title' | 'intro' | 'platform' | 'riding' | 'outro' | 'complete';

interface Prompt {
  n: number;
  options: [number, number]; // shuffled [correct, distractor]
  correctFirst: boolean;
}

export function HailstoneScene() {
  const [phase, setPhase] = useState<Phase>('title');
  const [seq, setSeq] = useState<number[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [peak, setPeak] = useState(0);
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [ridesDone, setRidesDone] = useState<number[]>([]);
  const completeChapter = useStoryStore((s) => s.completeChapter);
  const ambient = useAmbient();

  const refs = useMovementRefs([0, GROUND_Y, 4.5]);
  useKeyboardMovement(refs, phase === 'platform');
  const touch = useMemo(() => isTouchDevice(), []);

  const curveRef = useRef<THREE.CatmullRomCurve3 | null>(null);
  const tRef = useRef(0);
  const speedRef = useRef(0);
  const promptsAsked = useRef(0);
  const stationIdxRef = useRef(0);
  const pausedRef = useRef(false);
  const seqRef = useRef<number[]>([]);
  const chosenRef = useRef(0);

  const boardRide = (n: number) => {
    const s = collatzSequence(n);
    seqRef.current = s;
    chosenRef.current = n;
    setSeq(s);
    setCurrentIdx(0);
    setPeak(n);
    stationIdxRef.current = 0;
    promptsAsked.current = 0;
    pausedRef.current = false;
    const pts = s.map((v, i) => stationPos(i, v));
    pts.unshift(new THREE.Vector3(4, GROUND_Y + 1.2, 0));
    curveRef.current = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.3);
    tRef.current = 0;
    speedRef.current = 0.018;
    setPhase('riding');
    ambient.say('twentyseven', n === 27 ? 'MY number! Goggles down. This one gets TALL.' : `Riding ${n}! A fine warm-up.`);
  };

  // pedestal boarding watcher (platform phase)
  const dwellRef = useRef(0);
  function PedestalWatcher() {
    useFrame((_, delta) => {
      if (phase !== 'platform') return;
      const p = refs.pos.current;
      const ped = PEDESTALS.find((pd) => Math.hypot(p.x - pd.x, p.z - pd.z) < 1.5);
      if (!ped) {
        dwellRef.current = 0;
        return;
      }
      dwellRef.current += delta;
      if (dwellRef.current > 0.7) {
        dwellRef.current = -999;
        boardRide(ped.n);
      }
    });
    return null;
  }

  // the ride driver
  function RideDriver() {
    useFrame((_, delta) => {
      if (phase !== 'riding' || pausedRef.current) return;
      const s = seqRef.current;
      const totalStations = s.length + 1; // includes lead-in point
      tRef.current += (speedRef.current * delta * 60) / totalStations;
      const stationFloat = tRef.current * totalStations - 1; // -1 = lead-in
      const idx = Math.floor(stationFloat);

      if (idx > stationIdxRef.current && idx < s.length) {
        stationIdxRef.current = idx;
        setCurrentIdx(idx);
        const n = s[idx];
        setPeak((pk) => Math.max(pk, n));
        const odd = n % 2 === 1 && n !== 1;
        if (odd && promptsAsked.current < 3) {
          // pause and quiz
          pausedRef.current = true;
          promptsAsked.current += 1;
          const correct = collatzStep(n);
          const distractor = n % 4 === 1 ? 3 * n - 1 : 2 * n;
          setPrompt({ n, options: [correct, distractor], correctFirst: (n * 7) % 2 === 0 });
          if (promptsAsked.current === 3) {
            // after this one we let it rip
            setTimeout(() => ambient.say('twentyseven', 'You’ve got the rule! BRAKES OFF —'), 1200);
          }
        } else if (promptsAsked.current >= 3) {
          speedRef.current = Math.min(0.13, speedRef.current * 1.06); // let it rip
        }
      }

      if (tRef.current >= 1) {
        // arrived at 1 — home station
        speedRef.current = 0;
        const n = chosenRef.current;
        if (n === 27) {
          setTimeout(() => setPhase('outro'), 900);
        } else {
          setRidesDone((r) => [...r, n]);
          ambient.say('twentyseven', `${n} came home to 1 — they ALL do. Probably. Now ride MY number. Ride 27.`);
          refs.teleport(0, GROUND_Y, 4.5);
          setPhase('platform');
        }
      }
    });
    return null;
  }

  const answerPrompt = (value: number) => {
    if (!prompt) return;
    const correct = collatzStep(prompt.n);
    if (value === correct) {
      setPrompt(null);
      pausedRef.current = false;
      speedRef.current = Math.max(speedRef.current, 0.028);
      ambient.say('twentyseven', `${prompt.n} is odd → triple it and one more → ${correct}. UP we go!`);
    } else {
      ambient.say('twentyseven', 'Nope! Odd numbers TRIPLE-and-add-one. Halving is for evens. Try again!');
    }
  };

  const clamp = (next: THREE.Vector3, current: THREE.Vector3): ClampResult => {
    const d = Math.hypot(next.x - PLATFORM_C.x, next.z - PLATFORM_C.z);
    if (d < PLATFORM_R) {
      next.y = GROUND_Y;
      return { position: next };
    }
    const slideX = new THREE.Vector3(next.x, current.y, current.z);
    if (Math.hypot(slideX.x, slideX.z) < PLATFORM_R) return { position: slideX };
    const slideZ = new THREE.Vector3(current.x, current.y, next.z);
    if (Math.hypot(slideZ.x, slideZ.z) < PLATFORM_R) return { position: slideZ };
    return { position: current };
  };

  const trackLen = seq.length || 20;
  const current = seq[currentIdx] ?? chosenRef.current;

  return (
    <div className="fixed inset-0 z-40" style={{ background: '#120e24' }}>
      <Canvas shadows={false} dpr={LOW_PERF ? [0.7, 1] : [1, 1.5]} camera={{ position: [0, 5, 12], fov: 58 }}>
        <Suspense fallback={null}>
          <color attach="background" args={['#120e24']} />
          <fog attach="fog" args={['#241c40', 24, 84]} />

          <ambientLight intensity={0.62} color="#9d8fd9" />
          <directionalLight position={[10, 18, 6]} intensity={0.7} color="#c8b8f8" />
          <hemisphereLight args={['#6f5fa8', '#241c38', 0.55]} />
          <Sparkles position={[20, 8, 0]} count={LOW_PERF ? 25 : 70} scale={[70, 18, 26]} size={2.2} speed={0.2} opacity={0.5} color="#9b8bff" />

          <Cavern trackLen={trackLen} />

          {/* pedestals */}
          {phase === 'platform' || phase === 'intro' || phase === 'title' ? (
            <group>
              {PEDESTALS.map((pd) => (
                <group key={pd.n} position={[pd.x, GROUND_Y, pd.z]}>
                  <mesh position={[0, 0.4, 0]} castShadow>
                    <cylinderGeometry args={[0.55, 0.7, 0.8, 10]} />
                    <meshStandardMaterial color="#332d52" roughness={0.7} />
                  </mesh>
                  <Billboard position={[0, 1.45, 0]}>
                    <Text fontSize={0.66} color={pd.n === 27 ? '#F9A03F' : '#4ECDC4'} anchorX="center" anchorY="middle" outlineWidth={0.04} outlineColor="#120e24">
                      {String(pd.n)}
                    </Text>
                  </Billboard>
                  <Billboard position={[0, 0.95, 0]}>
                    <Text fontSize={0.17} color="rgba(255,255,255,0.65)" anchorX="center" anchorY="middle">
                      {pd.blurb}
                    </Text>
                  </Billboard>
                  <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]}>
                    <ringGeometry args={[1.1, 1.4, 24]} />
                    <meshBasicMaterial
                      color={ridesDone.includes(pd.n) ? '#5FAD56' : pd.n === 27 ? '#F9A03F' : '#4ECDC4'}
                      transparent
                      opacity={0.5}
                    />
                  </mesh>
                </group>
              ))}
            </group>
          ) : null}

          {/* the ride */}
          {seq.length > 0 && phase === 'riding' && (
            <>
              <RideTrack seq={seq} currentIdx={currentIdx} />
              <Cart curveRef={curveRef} tRef={tRef} refs={refs} />
            </>
          )}

          {/* tap-to-move on the platform */}
          <mesh
            rotation={[-Math.PI / 2, 0, 0]}
            position={[PLATFORM_C.x, GROUND_Y - 0.05, PLATFORM_C.z]}
            visible={false}
            onClick={(e) => {
              e.stopPropagation();
              if (e.delta > 6) return;
              if (phase === 'platform') refs.setTarget(e.point);
            }}
          >
            <circleGeometry args={[PLATFORM_R, 28]} />
            <meshBasicMaterial />
          </mesh>

          <PedestalWatcher />
          <RideDriver />
          <PlayerMover refs={refs} clamp={clamp} frozen={phase !== 'platform'} />
          <StoryPawn refs={refs} />
          {phase === 'platform' && <ZeroFollower refs={refs} />}
          <TwentySeven3D position={[2.5, 2.2, 1.5]} />
          <StoryFollowCamera refs={refs} distance={phase === 'riding' ? 10.5 : 8.4} />
        </Suspense>
      </Canvas>

      {ambient.node}

      {/* Ride HUD */}
      {phase === 'riding' && (
        <div className="absolute top-16 left-0 flex flex-col items-start gap-2 p-4 pointer-events-none">
          <div className="hud-panel px-5 py-3">
            <div className="label-caps mb-0.5">Riding</div>
            <div className="big-number" style={{ fontSize: 'clamp(1.8rem, 5vw, 2.7rem)', color: current % 2 ? '#F9A03F' : '#4ECDC4' }}>
              {current}
            </div>
            <div className="text-xs mt-0.5" style={{ fontFamily: 'var(--font-body)', color: 'var(--color-text-secondary)' }}>
              step {Math.max(0, currentIdx)} · peak {peak}
            </div>
          </div>
        </div>
      )}

      {/* odd-step prompt */}
      {prompt && (
        <div className="absolute inset-0 z-45 flex items-end justify-center pb-24 pointer-events-none">
          <motion.div
            className="hud-panel px-6 py-5 text-center pointer-events-auto"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="label-caps mb-1" style={{ color: '#F9A03F' }}>
              {prompt.n} is odd
            </div>
            <div className="mb-3 text-base" style={{ fontFamily: 'var(--font-body)', color: 'var(--color-text-primary)' }}>
              Triple it and add one — where does the track go?
            </div>
            <div className="flex gap-3 justify-center">
              {(prompt.correctFirst
                ? prompt.options
                : ([prompt.options[1], prompt.options[0]] as [number, number])
              ).map((v) => (
                <button key={v} className="btn btn-orange btn-lg" onClick={() => answerPrompt(v)}>
                  {v}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      {phase === 'platform' && (
        <div className="absolute top-16 left-0 p-4 pointer-events-none">
          <div className="text-[11px]" style={{ fontFamily: 'var(--font-body)', color: 'rgba(255,255,255,0.45)' }}>
            {touch ? 'joystick to walk · stand on a pedestal ring to board' : 'WASD to walk · stand on a pedestal ring to board'}
          </div>
        </div>
      )}
      {phase === 'platform' && touch && <VirtualJoystick refs={refs} />}

      {phase === 'title' && (
        <ChapterTitle eyebrow="Chapter Four" title="The Hailstone Caverns" accent="#F9A03F" onDone={() => setPhase('intro')} />
      )}
      {phase === 'intro' && <DialogueScene lines={INTRO} onComplete={() => setPhase('platform')} skipLabel="Skip" />}
      {phase === 'outro' && (
        <DialogueScene
          lines={OUTRO}
          onComplete={() => {
            completeChapter('hailstone', { companion: 'twentyseven' });
            setPhase('complete');
          }}
        />
      )}
      {phase === 'complete' && (
        <ChapterComplete chapterTitle="The Hailstone Caverns" companion="twentyseven" onContinue={() => useStoryStore.getState().goToChapter('inn')} />
      )}
    </div>
  );
}
