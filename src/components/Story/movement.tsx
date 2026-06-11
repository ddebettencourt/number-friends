/* eslint-disable react-refresh/only-export-components --
   Movement toolkit: the hooks (useMovementRefs, useKeyboardMovement) and the
   components that consume them are one cohesive module; story scenes import
   both together. Full-reload-on-edit is an acceptable trade here. */
/* eslint-disable react-hooks/immutability --
   This module IS the imperative animation layer: PlayerMover, the joystick,
   and the follow camera mutate the real useRefs inside the MovementRefs
   bundle every frame by design. Scenes never mutate directly — they use the
   bundle's setTarget/teleport methods defined here. */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

// ============================================================
//  Shared story-mode character controller.
//  Desktop: WASD / arrow keys (camera-relative).
//  Mobile:  virtual joystick (left thumb).
//  Both:    tap-to-move as a fallback; key/stick input cancels it.
//  Scenes provide a `clamp` that constrains positions to walkable
//  space and may convert a blocked push into a hop (stones, ledges).
// ============================================================

export interface MovementRefs {
  pos: React.MutableRefObject<THREE.Vector3>;
  facing: React.MutableRefObject<number>;
  moving: React.MutableRefObject<boolean>;
  hopping: React.MutableRefObject<boolean>;
  /** raw input vector: x = strafe right, y = forward (range -1..1) */
  input: React.MutableRefObject<{ x: number; y: number }>;
  /** tap-to-move target (cleared by stick/key input or on arrival) */
  target: React.MutableRefObject<THREE.Vector3 | null>;
  /** scene-facing mutators — use these instead of writing .current directly */
  setTarget: (v: THREE.Vector3) => void;
  teleport: (x: number, y: number, z: number) => void;
}

export function useMovementRefs(start: [number, number, number]): MovementRefs {
  // Real refs (mutable by design); the wrapper object is memoized so it can
  // be passed around as a stable identity.
  const pos = useRef(new THREE.Vector3(...start));
  const facing = useRef(0);
  const moving = useRef(false);
  const hopping = useRef(false);
  const input = useRef({ x: 0, y: 0 });
  const target = useRef<THREE.Vector3 | null>(null);
  return useMemo(
    () => ({
      pos, facing, moving, hopping, input, target,
      setTarget: (v: THREE.Vector3) => { target.current = v.clone(); },
      teleport: (x: number, y: number, z: number) => {
        pos.current.set(x, y, z);
        target.current = null;
      },
    }),
    []
  );
}

/** A hop result: glide-arc the pawn to `to`, then invoke commit. */
export interface HopResult {
  to: THREE.Vector3;
  commit?: () => void;
}

export interface ClampResult {
  position: THREE.Vector3;
  hop?: HopResult;
}

interface PlayerMoverProps {
  refs: MovementRefs;
  speed?: number;
  /**
   * Constrain `next` to walkable space. `dir` is the normalized push
   * direction. Return the corrected position, and optionally a hop if the
   * push should launch the pawn across a gap.
   */
  clamp: (next: THREE.Vector3, current: THREE.Vector3, dir: THREE.Vector3) => ClampResult;
  /** Disable all input (during dialogue) */
  frozen?: boolean;
}

const HOP_DURATION = 0.42;

export function PlayerMover({ refs, speed = 4.4, clamp, frozen = false }: PlayerMoverProps) {
  const { camera } = useThree();
  const hop = useRef<{ from: THREE.Vector3; to: THREE.Vector3; t: number; commit?: () => void } | null>(null);

  // Dev-only test seam: lets E2E checks teleport the pawn instead of
  // walking it in real time. `window.nfPawn.pos.current.set(x, y, z)`.
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const w = window as unknown as Record<string, unknown>;
    w.nfPawn = refs;
    return () => {
      if (w.nfPawn === refs) delete w.nfPawn;
    };
  }, [refs]);

  useFrame((_, delta) => {
    const { pos, facing, moving, hopping, input, target } = refs;

    // --- hop in flight: arc and land ---
    if (hop.current) {
      hop.current.t += delta / HOP_DURATION;
      const t = Math.min(1, hop.current.t);
      const p = hop.current.from.clone().lerp(hop.current.to, t);
      p.y += Math.sin(t * Math.PI) * 0.85; // arc
      pos.current.copy(p);
      moving.current = true;
      hopping.current = true;
      if (t >= 1) {
        pos.current.copy(hop.current.to);
        hop.current.commit?.();
        hop.current = null;
        hopping.current = false;
      }
      return;
    }

    if (frozen) {
      moving.current = false;
      return;
    }

    // --- input vector (stick/keys beat tap target) ---
    const inp = input.current;
    let dir: THREE.Vector3 | null = null;
    if (Math.abs(inp.x) > 0.12 || Math.abs(inp.y) > 0.12) {
      target.current = null;
      // camera-relative: forward = camera's -z on the ground plane
      const fwd = new THREE.Vector3();
      camera.getWorldDirection(fwd);
      fwd.y = 0;
      fwd.normalize();
      const right = new THREE.Vector3(fwd.z, 0, -fwd.x).negate();
      dir = fwd.multiplyScalar(inp.y).add(right.multiplyScalar(inp.x));
      if (dir.lengthSq() > 1) dir.normalize();
    } else if (target.current) {
      const to = target.current.clone().sub(pos.current);
      to.y = 0;
      if (to.length() < 0.12) {
        target.current = null;
      } else {
        dir = to.normalize();
      }
    }

    if (!dir || dir.lengthSq() < 0.0001) {
      moving.current = false;
      return;
    }

    const step = dir.clone().multiplyScalar(speed * delta);
    const next = pos.current.clone().add(step);
    const result = clamp(next, pos.current, dir);

    if (result.hop) {
      hop.current = { from: pos.current.clone(), to: result.hop.to.clone(), t: 0, commit: result.hop.commit };
      target.current = null;
      return;
    }

    const moved = result.position.distanceTo(pos.current) > 0.001;
    moving.current = moved;
    if (moved) {
      pos.current.copy(result.position);
      facing.current = Math.atan2(dir.x, dir.z);
    } else if (target.current) {
      // seeking a tap target but blocked — give up
      target.current = null;
    }
  });

  return null;
}

/** WASD / arrow keys → refs.input. Mount once per scene (outside the canvas is fine). */
export function useKeyboardMovement(refs: MovementRefs, enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    const held = new Set<string>();
    const KEYMAP: Record<string, [number, number]> = {
      KeyW: [0, 1], ArrowUp: [0, 1],
      KeyS: [0, -1], ArrowDown: [0, -1],
      KeyA: [-1, 0], ArrowLeft: [-1, 0],
      KeyD: [1, 0], ArrowRight: [1, 0],
    };
    const recompute = () => {
      let x = 0, y = 0;
      for (const code of held) {
        const v = KEYMAP[code];
        if (v) { x += v[0]; y += v[1]; }
      }
      const len = Math.hypot(x, y) || 1;
      refs.input.current = { x: x / Math.max(1, len), y: y / Math.max(1, len) };
    };
    const down = (e: KeyboardEvent) => {
      if (!(e.code in KEYMAP)) return;
      // don't steal keys from inputs
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
      e.preventDefault();
      held.add(e.code);
      recompute();
    };
    const up = (e: KeyboardEvent) => {
      if (!(e.code in KEYMAP)) return;
      held.delete(e.code);
      recompute();
    };
    const blur = () => { held.clear(); recompute(); };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', blur);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', blur);
      refs.input.current = { x: 0, y: 0 };
    };
  }, [refs, enabled]);
}

/** True on coarse-pointer (touch) devices. */
export function isTouchDevice(): boolean {
  return typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(pointer: coarse)').matches;
}

/** On-screen thumbstick for touch devices → refs.input. Renders bottom-left. */
export function VirtualJoystick({ refs, disabled = false }: { refs: MovementRefs; disabled?: boolean }) {
  const baseRef = useRef<HTMLDivElement>(null);
  const [knob, setKnob] = useState<{ x: number; y: number } | null>(null);
  const activeId = useRef<number | null>(null);

  const RADIUS = 52;

  const setFromPointer = (clientX: number, clientY: number) => {
    const base = baseRef.current;
    if (!base) return;
    const rect = base.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let dx = clientX - cx;
    let dy = clientY - cy;
    const len = Math.hypot(dx, dy);
    if (len > RADIUS) {
      dx = (dx / len) * RADIUS;
      dy = (dy / len) * RADIUS;
    }
    setKnob({ x: dx, y: dy });
    // screen up = forward
    refs.input.current = { x: dx / RADIUS, y: -dy / RADIUS };
  };

  const release = () => {
    activeId.current = null;
    setKnob(null);
    refs.input.current = { x: 0, y: 0 };
  };

  useEffect(() => () => release(), []); // eslint-disable-line react-hooks/exhaustive-deps

  if (disabled) return null;

  return (
    <div
      ref={baseRef}
      className="absolute bottom-6 left-6 rounded-full select-none"
      style={{
        width: RADIUS * 2 + 28,
        height: RADIUS * 2 + 28,
        background: 'rgba(15, 12, 35, 0.4)',
        border: '1.5px solid rgba(255,255,255,0.18)',
        touchAction: 'none',
        zIndex: 45,
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
      onPointerDown={(e) => {
        activeId.current = e.pointerId;
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        setFromPointer(e.clientX, e.clientY);
      }}
      onPointerMove={(e) => {
        if (activeId.current === e.pointerId) setFromPointer(e.clientX, e.clientY);
      }}
      onPointerUp={release}
      onPointerCancel={release}
    >
      <div
        className="absolute rounded-full"
        style={{
          width: 56,
          height: 56,
          left: '50%',
          top: '50%',
          transform: `translate(calc(-50% + ${knob?.x ?? 0}px), calc(-50% + ${knob?.y ?? 0}px))`,
          background: 'rgba(78, 205, 196, 0.35)',
          border: '2px solid rgba(78, 205, 196, 0.7)',
          boxShadow: knob ? '0 0 16px rgba(78,205,196,0.4)' : 'none',
          transition: knob ? 'none' : 'transform 0.15s ease',
        }}
      />
    </div>
  );
}

/** Smooth third-person follow camera for any movement refs. */
export function StoryFollowCamera({ refs, height = 5.2, distance = 6.8, lookAhead = 1 }: {
  refs: MovementRefs;
  height?: number;
  distance?: number;
  lookAhead?: number;
}) {
  const { camera } = useThree();
  const look = useRef(new THREE.Vector3());
  useFrame((_, delta) => {
    const target = refs.pos.current;
    const desired = new THREE.Vector3(target.x * 0.6, target.y + height, target.z + distance);
    camera.position.lerp(desired, Math.min(1, delta * 2.2));
    look.current.lerp(new THREE.Vector3(target.x, target.y + 0.6, target.z - lookAhead), Math.min(1, delta * 2.6));
    camera.lookAt(look.current);
  });
  return null;
}

/** The player's pawn — the one that fell off the board. Shared by all chapters. */
export function StoryPawn({ refs }: { refs: MovementRefs }) {
  const group = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!group.current) return;
    group.current.position.copy(refs.pos.current);
    const t = state.clock.elapsedTime;
    if (refs.moving.current && !refs.hopping.current) {
      group.current.position.y += Math.abs(Math.sin(t * 10)) * 0.16;
      group.current.rotation.z = Math.sin(t * 10) * 0.06;
    } else if (!refs.hopping.current) {
      group.current.position.y += Math.sin(t * 2) * 0.03;
      group.current.rotation.z = 0;
    }
    group.current.rotation.y = refs.facing.current;
  });
  return (
    <group ref={group}>
      <mesh position={[0, 0.25, 0]} castShadow>
        <capsuleGeometry args={[0.2, 0.3, 8, 16]} />
        <meshStandardMaterial color="#E84855" roughness={0.3} metalness={0.15} />
      </mesh>
      <mesh position={[0, 0.62, 0]} castShadow>
        <sphereGeometry args={[0.205, 16, 16]} />
        <meshStandardMaterial color="#E84855" roughness={0.25} metalness={0.15} emissive="#E84855" emissiveIntensity={0.12} />
      </mesh>
      <mesh position={[-0.07, 0.66, 0.17]}>
        <sphereGeometry args={[0.035, 8, 8]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.8} />
      </mesh>
      <mesh position={[0.07, 0.66, 0.17]}>
        <sphereGeometry args={[0.035, 8, 8]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.8} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[0.26, 0.36, 20]} />
        <meshBasicMaterial color="#E84855" transparent opacity={0.35} />
      </mesh>
    </group>
  );
}

/** Zero, drifting along beside the pawn — companion presence in later chapters. */
export function ZeroFollower({ refs }: { refs: MovementRefs }) {
  const group = useRef<THREE.Group>(null);
  const pos = useRef(new THREE.Vector3());
  useFrame((state, delta) => {
    if (!group.current) return;
    const t = state.clock.elapsedTime;
    const side = new THREE.Vector3(Math.cos(refs.facing.current), 0, -Math.sin(refs.facing.current));
    const desired = refs.pos.current.clone()
      .add(side.multiplyScalar(-1.15))
      .add(new THREE.Vector3(0, 1.25 + Math.sin(t * 1.3) * 0.1, 0.4));
    pos.current.lerp(desired, Math.min(1, delta * 2.4));
    group.current.position.copy(pos.current);
    group.current.rotation.y = Math.sin(t * 0.5) * 0.3;
  });
  return (
    <group ref={group} scale={0.85}>
      <mesh>
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
      <pointLight color="#4ECDC4" intensity={1.1} distance={6} decay={2} />
    </group>
  );
}
