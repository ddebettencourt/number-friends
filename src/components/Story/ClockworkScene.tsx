import { Suspense, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Text, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { motion } from 'framer-motion';
import { useStoryStore } from '../../stores/storyStore';
import { DialogueScene, type DialogueLine } from './DialogueScene';
import { LOW_PERF } from '../../utils/perf';
import {
  useMovementRefs, useKeyboardMovement, isTouchDevice,
  PlayerMover, VirtualJoystick, StoryFollowCamera, StoryPawn, ZeroFollower,
  type ClampResult,
} from './movement';
import { clockAnswer, caesarEncode, caesarDecode, houseAt } from './storyLogic';

// ============================================================
//  Chapter 2 — The Clockwork Commons.
//  A town that loops: twelve houses on a circle, one for each
//  hour. Modular arithmetic as geography — the answer to
//  "9 + 6 o'clock" is a place, and you walk there.
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

// --- Layout -------------------------------------------------------------------
const PLAZA_R = 14.4;     // walkable radius
const HOUSE_R = 12.2;     // house centers
const DOOR_R = 10.7;      // standing-zone reaches from the ring road to the facade
const GATE_POS = new THREE.Vector3(0, 0, -17.2);
const GROUND_Y = 0.02;

/** Hour h (1..12) → angle clockwise from north */
const hourAngle = (h: number) => ((h % 12) / 12) * Math.PI * 2;
const hourPos = (h: number, r: number) =>
  new THREE.Vector3(Math.sin(hourAngle(h)) * r, 0, -Math.cos(hourAngle(h)) * r);

// --- Quest rounds ---------------------------------------------------------------
const ROUNDS = [
  { start: 9, add: 6 },   // → 3
  { start: 11, add: 5 },  // → 4
  { start: 8, add: 12 },  // → 8 (adding a full turn changes nothing)
];
const answerOf = (r: { start: number; add: number }) => clockAnswer(r.start, r.add);

// --- Caesar gate ------------------------------------------------------------------
const PLAINTEXT = 'THE HOURS TURN';
const SHIFT = 3;
const CIPHERTEXT = caesarEncode(PLAINTEXT, SHIFT);
const decode = caesarDecode;

// --- An hour-house assembled from kit walls -----------------------------------------
const WALL = 2.3; // kit wall panels are ~1 unit; we scale by this

function HourHouse({ hour, flash }: { hour: number; flash: 'gold' | 'red' | null }) {
  const pos = hourPos(hour, HOUSE_R);
  const faceCenter = hourAngle(hour) + Math.PI; // door looks at the plaza center
  const glow = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!glow.current) return;
    const m = glow.current.material as THREE.MeshBasicMaterial;
    const base = flash === 'gold' ? 0.55 : flash === 'red' ? 0.5 : 0;
    m.opacity = base > 0 ? base + Math.sin(state.clock.elapsedTime * 8) * 0.18 : 0;
    m.color.set(flash === 'red' ? '#E84855' : '#FFE66D');
  });
  const h = WALL / 2;
  return (
    <group position={[pos.x, GROUND_Y, pos.z]} rotation={[0, faceCenter, 0]}>
      {/* four walls — door faces the plaza */}
      <Model url={M('wall-wood-door')} position={[0, 0, h]} scale={WALL} />
      <Model url={M('wall-wood-window-shutters')} position={[-h, 0, 0]} rotation={[0, Math.PI / 2, 0]} scale={WALL} />
      <Model url={M('wall-wood-window-shutters')} position={[h, 0, 0]} rotation={[0, -Math.PI / 2, 0]} scale={WALL} />
      <Model url={M('wall-wood')} position={[0, 0, -h]} rotation={[0, Math.PI, 0]} scale={WALL} />
      {/* pointed roof */}
      <Model url={M('roof-point')} position={[0, WALL, 0]} scale={WALL} />
      {/* hour number above the door */}
      <Text
        position={[0, WALL * 1.42, h + 0.25]}
        fontSize={0.78}
        color="#FFE66D"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.05}
        outlineColor="#1a1208"
      >
        {hour}
      </Text>
      {/* warm doorlight */}
      <pointLight position={[0, 1.2, h + 0.9]} color="#ffb35c" intensity={0.85} distance={6} decay={2} />
      {/* event glow ring at the doorstep */}
      <mesh ref={glow} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, h + 1.6]}>
        <ringGeometry args={[1.05, 1.45, 28]} />
        <meshBasicMaterial color="#FFE66D" transparent opacity={0} />
      </mesh>
    </group>
  );
}

// --- Center: fountain + the great clock pillar ----------------------------------------
function PlazaCenter({ questHour }: { questHour: number | null }) {
  const ringRef = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (ringRef.current) ringRef.current.rotation.y = state.clock.elapsedTime * 0.12;
  });
  return (
    <group>
      <Model url={M('fountain-round-detail')} position={[0, GROUND_Y, 0]} scale={2.6} />
      <Model url={M('fountain-center')} position={[0, GROUND_Y + 0.3, 0]} scale={2.2} />
      {/* slowly turning ring of glow-ticks above the fountain */}
      <group ref={ringRef} position={[0, 3.6, 0]}>
        {Array.from({ length: 12 }).map((_, i) => {
          const p = hourPos(i + 1, 1.7);
          return (
            <mesh key={i} position={[p.x, 0, p.z]}>
              <boxGeometry args={[0.1, 0.34, 0.1]} />
              <meshStandardMaterial color="#FFE66D" emissive="#FFE66D" emissiveIntensity={0.8} toneMapped={false} />
            </mesh>
          );
        })}
      </group>
      {/* the plaza clock reading (story prop) */}
      {questHour !== null && (
        <Text
          position={[0, 4.7, 0]}
          fontSize={1.1}
          color="#FFE66D"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.06}
          outlineColor="#1a1208"
        >
          {`${questHour}`}
        </Text>
      )}
    </group>
  );
}

// --- The locked gate -----------------------------------------------------------------
function NorthGate({ open }: { open: boolean }) {
  const glowRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!glowRef.current) return;
    const m = glowRef.current.material as THREE.MeshBasicMaterial;
    m.opacity = open
      ? 0.5 + Math.sin(state.clock.elapsedTime * 2) * 0.2
      : 0.12 + Math.sin(state.clock.elapsedTime * 1.2) * 0.05;
    m.color.set(open ? '#FFE66D' : '#E84855');
  });
  return (
    <group position={[GATE_POS.x, GROUND_Y, GATE_POS.z]}>
      <Model url={M('pillar-stone')} position={[-2.2, 0, 0]} scale={2.6} />
      <Model url={M('pillar-stone')} position={[2.2, 0, 0]} scale={2.6} />
      <Model url={M('wall-arch-top-detail')} position={[0, 2.6, 0]} scale={[4.4, 2.6, 2.6]} />
      {/* the seal */}
      <mesh ref={glowRef} position={[0, 1.7, 0]}>
        <planeGeometry args={[3.6, 3]} />
        <meshBasicMaterial color="#E84855" transparent opacity={0.15} side={THREE.DoubleSide} />
      </mesh>
      <Model url={M('lantern')} position={[-2.2, 2.9, 0.4]} scale={1.8} />
      <Model url={M('lantern')} position={[2.2, 2.9, 0.4]} scale={1.8} />
      <pointLight position={[0, 2.4, 1]} color={open ? '#FFE66D' : '#ff7a6a'} intensity={1.2} distance={9} decay={2} />
    </group>
  );
}

// --- Set dressing ------------------------------------------------------------------------
function PlazaDressing() {
  return (
    <group>
      {/* cobbled plaza */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <circleGeometry args={[PLAZA_R + 3.4, 48]} />
        <meshStandardMaterial color="#3d3a4e" roughness={0.92} metalness={0.05} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.06, 0]}>
        <circleGeometry args={[60, 48]} />
        <meshStandardMaterial color="#23202f" roughness={1} />
      </mesh>
      {/* ring road */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}>
        <ringGeometry args={[DOOR_R - 0.8, DOOR_R + 0.8, 64]} />
        <meshStandardMaterial color="#4a4660" roughness={0.85} />
      </mesh>

      {/* lanterns between every third house */}
      {[1.5, 4.5, 7.5, 10.5].map((h) => {
        const p = hourPos(h, HOUSE_R - 1);
        return (
          <group key={h} position={[p.x, GROUND_Y, p.z]}>
            <Model url={M('lightpost-single')} position={[0, 0, 0]} scale={1.7} rotation={[0, -hourAngle(h), 0]} />
            <pointLight position={[0, 2.6, 0]} color="#ffd27a" intensity={1} distance={7} decay={2} />
          </group>
        );
      })}

      {/* market stalls + greenery for life */}
      <Model url={M('stall')} position={[hourPos(5.2, 7.2).x, GROUND_Y, hourPos(5.2, 7.2).z]} scale={1.9} rotation={[0, -hourAngle(5.2) + Math.PI, 0]} />
      <Model url={M('hedge')} position={[hourPos(6.8, 7.4).x, GROUND_Y, hourPos(6.8, 7.4).z]} scale={2} rotation={[0, 0.5, 0]} />
      <Model url={M('tree-crooked')} position={[hourPos(2.5, 16.4).x, GROUND_Y, hourPos(2.5, 16.4).z]} scale={3} />
      <Model url={M('tree-crooked')} position={[hourPos(9.6, 16.8).x, GROUND_Y, hourPos(9.6, 16.8).z]} scale={2.6} rotation={[0, 2.1, 0]} />
      <Model url={M('banner-red')} position={[hourPos(0.5, 11.4).x, GROUND_Y + 1.8, hourPos(0.5, 11.4).z]} scale={2} rotation={[0, hourAngle(0.5) + Math.PI, 0]} />
      <Model url={M('banner-green')} position={[hourPos(3.5, 11.4).x, GROUND_Y + 1.8, hourPos(3.5, 11.4).z]} scale={2} rotation={[0, hourAngle(3.5) + Math.PI, 0]} />
    </group>
  );
}

// --- Door dwell detection -------------------------------------------------------------------
function DoorWatcher({ refs, active, answer, onCorrect, onWrong }: {
  refs: ReturnType<typeof useMovementRefs>;
  active: boolean;
  answer: number;
  onCorrect: (h: number) => void;
  onWrong: (h: number) => void;
}) {
  const dwell = useRef(0);
  const lastHouse = useRef(-1);
  const fired = useRef(false);
  useFrame((_, delta) => {
    if (!active) return;
    const p = refs.pos.current;
    // "Standing at a house" = anywhere in its 30° wedge, outside the ring road.
    const h = houseAt(p.x, p.z) ?? -1;
    if (import.meta.env.DEV) {
      (window as unknown as Record<string, unknown>).nfDoor = {
        h, answer, dwell: dwell.current, x: p.x.toFixed(1), z: p.z.toFixed(1),
      };
    }
    if (h !== lastHouse.current) {
      lastHouse.current = h;
      dwell.current = 0;
      fired.current = false; // re-arm whenever the player moves to a different house
    } else if (h !== -1 && !fired.current) {
      dwell.current += delta;
      if (dwell.current > 0.85) {
        fired.current = true;
        if (h === answer) onCorrect(h); else onWrong(h);
      }
    }
  });
  return null;
}

// --- Gate proximity ----------------------------------------------------------------------------
function GateWatcher({ refs, active, onNear }: {
  refs: ReturnType<typeof useMovementRefs>;
  active: boolean;
  onNear: (near: boolean) => void;
}) {
  const near = useRef(false);
  useFrame(() => {
    if (!active) return;
    const p = refs.pos.current;
    const d = Math.hypot(p.x - GATE_POS.x, p.z - (GATE_POS.z + 2.4));
    const n = d < 4.4;
    if (n !== near.current) {
      near.current = n;
      onNear(n);
    }
  });
  return null;
}

// --- Dialogue -----------------------------------------------------------------------------------
const INTRO: DialogueLine[] = [
  { speaker: 'narrator', text: 'Past the marsh, the land curls into a town — and the town curls into itself. Twelve houses on one round street. You have the feeling that if you walked far enough, you would meet your own footprints.' },
  { speaker: 'hours', text: 'A visitor! And Zero — Zero, it’s been an age! We are the Hours. Twelve of us, twelve houses, one circle.' },
  { speaker: 'hours', text: 'We count to twelve and then we begin again. The Devil called it a defect. “You never get anywhere,” he said. Then he locked our gate — so now nobody does.' },
  { speaker: 'zero', text: 'Counting in circles is still counting, friends. Show this one how the town works. We need that gate.' },
  { speaker: 'hours', text: 'Then play the oldest game in the Commons! The plaza clock will speak. Walk to the house where the time truly lands — and remember: past twelve, we begin again.' },
];

const CIPHER_INTRO: DialogueLine[] = [
  { speaker: 'hours', text: 'You hear it too, yes? The town believes you. Now — the gate. He sealed it with turned letters.' },
  { speaker: 'hours', text: 'Every letter walked three houses clockwise from where it lived. Letters keep a circle just like ours, you know. Twenty-six houses, A through Z.' },
  { speaker: 'zero', text: 'A circle is a circle. Turn it back.' },
];

const OUTRO: DialogueLine[] = [
  { speaker: 'hours', text: 'The gate turns! Oh, it’s been years. YEARS!' },
  { speaker: 'hours', text: 'Take this with you, traveler: remainders are not leftovers. A remainder is where you land on the circle.' },
  { speaker: 'zero', text: 'Your board’s bounce-back at the hundredth square… that’s a circle too, you know. You’ve been playing with remainders all along.' },
  { speaker: 'narrator', text: 'The Hours joined your party. — Next: The Doubling Delta.' },
];

// --- Main scene -------------------------------------------------------------------------------------
type Phase = 'intro' | 'quest' | 'cipherIntro' | 'cipher' | 'outro';

export function ClockworkScene() {
  const [phase, setPhase] = useState<Phase>('intro');
  const [round, setRound] = useState(0);
  const [flash, setFlash] = useState<{ hour: number; kind: 'gold' | 'red' } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [nearGate, setNearGate] = useState(false);
  const [shift, setShift] = useState(0);
  const [cipherTries, setCipherTries] = useState(0);
  const [gateOpen, setGateOpen] = useState(false);
  const completeChapter = useStoryStore((s) => s.completeChapter);

  const refs = useMovementRefs([0, 0.3, 6]);
  useKeyboardMovement(refs, phase === 'quest' || phase === 'cipher');
  const touch = useMemo(() => isTouchDevice(), []);

  const clamp = (next: THREE.Vector3): ClampResult => {
    const d = Math.hypot(next.x, next.z);
    if (d > PLAZA_R) {
      const s = PLAZA_R / d;
      next.x *= s;
      next.z *= s;
    }
    next.y = 0.3;
    return { position: next };
  };

  const r = ROUNDS[round];
  const questActive = phase === 'quest' && !!r;

  const onCorrect = (h: number) => {
    setFlash({ hour: h, kind: 'gold' });
    setToast(null);
    setTimeout(() => setFlash(null), 1400);
    if (round + 1 < ROUNDS.length) {
      setTimeout(() => setRound(round + 1), 1200);
    } else {
      setTimeout(() => setPhase('cipherIntro'), 1200);
    }
  };

  const onWrong = (h: number) => {
    setFlash({ hour: h, kind: 'red' });
    setTimeout(() => setFlash(null), 1100);
    setToast('The Hours hum politely: “past twelve, we begin again — count round the circle.”');
  };

  const tryUnlock = () => {
    if (decode(CIPHERTEXT, shift) === PLAINTEXT) {
      setGateOpen(true);
      setTimeout(() => setPhase('outro'), 1300);
    } else {
      setCipherTries((t) => t + 1);
    }
  };

  const decoded = decode(CIPHERTEXT, shift);

  return (
    <div className="fixed inset-0 z-40" style={{ background: '#171426' }}>
      <Canvas shadows={!LOW_PERF} dpr={LOW_PERF ? [0.7, 1] : [1, 1.5]} camera={{ position: [0, 6, 13], fov: 55 }}>
        <Suspense fallback={null}>
          <color attach="background" args={['#171426']} />
          <fog attach="fog" args={['#1f1a33', 18, 52]} />

          <ambientLight intensity={0.62} color="#b3a6d4" />
          <directionalLight position={[8, 14, 6]} intensity={0.75} color="#d8ccf7" castShadow={!LOW_PERF} />
          <hemisphereLight args={['#6f63a8', '#3a3047', 0.5]} />
          <Stars radius={55} depth={30} count={LOW_PERF ? 250 : 700} factor={2.4} saturation={0} fade speed={0.3} />

          <PlazaDressing />
          <PlazaCenter questHour={questActive ? r.start : null} />
          {Array.from({ length: 12 }).map((_, i) => (
            <HourHouse key={i + 1} hour={i + 1} flash={flash?.hour === i + 1 ? flash.kind : null} />
          ))}
          <NorthGate open={gateOpen} />

          {/* tap-to-move on the plaza */}
          <mesh
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, 0.005, 0]}
            visible={false}
            onClick={(e) => {
              e.stopPropagation();
              if (phase === 'quest' || phase === 'cipher') refs.setTarget(e.point);
            }}
          >
            <circleGeometry args={[PLAZA_R, 40]} />
            <meshBasicMaterial />
          </mesh>

          <DoorWatcher refs={refs} active={questActive} answer={r ? answerOf(r) : -1} onCorrect={onCorrect} onWrong={onWrong} />
          <GateWatcher refs={refs} active={phase === 'cipher'} onNear={setNearGate} />

          <PlayerMover refs={refs} clamp={clamp} frozen={phase !== 'quest' && phase !== 'cipher'} />
          <StoryPawn refs={refs} />
          <ZeroFollower refs={refs} />
          <StoryFollowCamera refs={refs} height={5.6} distance={7.4} />
        </Suspense>
      </Canvas>

      {/* Quest HUD */}
      {questActive && (
        <div className="absolute top-0 left-0 flex flex-col items-start gap-2 p-4 hud-safe-top pointer-events-none">
          <div className="hud-panel px-5 py-3 max-w-xs">
            <div className="label-caps mb-1">The Hours ask · {round + 1} of {ROUNDS.length}</div>
            <div className="text-base" style={{ fontFamily: 'var(--font-body)', color: 'var(--color-text-primary)' }}>
              “The plaza clock reads <b style={{ color: '#FFE66D' }}>{r.start}</b>. Let <b style={{ color: '#FFE66D' }}>{r.add} hours</b> pass…
              stand at the door of the true hour.”
            </div>
          </div>
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
          <div className="text-[11px]" style={{ fontFamily: 'var(--font-body)', color: 'rgba(255,255,255,0.35)' }}>
            {touch ? 'joystick to walk · stand at a door to answer' : 'WASD to walk · stand at a door to answer'}
          </div>
        </div>
      )}

      {/* Cipher HUD */}
      {phase === 'cipher' && (
        <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center gap-2 p-4 hud-safe-bottom pointer-events-none">
          {!nearGate && (
            <div className="hud-panel px-4 py-2 text-sm" style={{ fontFamily: 'var(--font-body)', color: 'var(--color-text-secondary)' }}>
              The sealed gate stands at the top of the town — walk to it.
            </div>
          )}
          {nearGate && (
            <motion.div
              className="hud-panel px-5 py-4 pointer-events-auto text-center"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="label-caps mb-2">The Devil’s seal — letters walked off their houses</div>
              <div className="font-display text-2xl mb-3 tracking-[0.2em]" style={{ color: decoded === PLAINTEXT ? '#FFE66D' : '#cfc2f5' }}>
                {decoded}
              </div>
              <div className="flex items-center justify-center gap-3">
                <button className="btn btn-ghost btn-sm" onClick={() => setShift((s) => (s + 25) % 26)} aria-label="Turn letters back">
                  −
                </button>
                <div className="label-caps min-w-[88px]">turn: {shift}</div>
                <button className="btn btn-ghost btn-sm" onClick={() => setShift((s) => (s + 1) % 26)} aria-label="Turn letters forward">
                  +
                </button>
                <button className="btn btn-yellow btn-sm ml-2" onClick={tryUnlock}>
                  Unlock
                </button>
              </div>
              {cipherTries >= 3 && (
                <div className="mt-2 text-xs" style={{ fontFamily: 'var(--font-body)', color: 'var(--color-text-secondary)' }}>
                  The Hours whisper: “his favorite shift was always three.”
                </div>
              )}
            </motion.div>
          )}
        </div>
      )}

      {phase === 'cipher' && touch && <VirtualJoystick refs={refs} />}
      {questActive && touch && <VirtualJoystick refs={refs} />}

      {phase === 'intro' && <DialogueScene lines={INTRO} onComplete={() => setPhase('quest')} skipLabel="Skip" />}
      {phase === 'cipherIntro' && <DialogueScene lines={CIPHER_INTRO} onComplete={() => setPhase('cipher')} />}
      {phase === 'outro' && (
        <DialogueScene
          lines={OUTRO}
          onComplete={() => {
            completeChapter('clockwork', { companion: 'hours' });
            useStoryStore.getState().goToChapter('delta');
          }}
        />
      )}
    </div>
  );
}

[
  'wall-wood-door', 'wall-wood-window-shutters', 'wall-wood', 'roof-point',
  'fountain-round-detail', 'fountain-center', 'lightpost-single', 'lantern',
  'pillar-stone', 'wall-arch-top-detail', 'stall', 'hedge', 'tree-crooked',
  'banner-red', 'banner-green',
].forEach((m) => useGLTF.preload(M(m)));
