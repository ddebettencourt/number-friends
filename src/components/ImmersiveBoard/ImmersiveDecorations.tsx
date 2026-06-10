import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import type { Group, Mesh } from 'three';
import type { Vector3Tuple } from 'three';
import { ZONES } from '../Board3D/zoneConfig';
import { LOW_PERF, qty } from '../../utils/perf';

interface ImmersiveDecorationsProps {
  positions: Vector3Tuple[];
  activeZone: number;
}

type Vec3 = [number, number, number];

const seededRandom = (seed: number) => {
  const x = Math.sin(seed * 127.1) * 43758.5453;
  return x - Math.floor(x);
};

// ============================================================
//  MEADOW
// ============================================================

function ConiferTree({ position, scale = 1 }: { position: Vec3; scale?: number }) {
  const ref = useRef<Group>(null);
  useFrame((state) => {
    if (ref.current) ref.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.5 + position[0]) * 0.018;
  });
  return (
    <group ref={ref} position={position} scale={scale}>
      <mesh position={[0, 1.6, 0]} castShadow>
        <cylinderGeometry args={[0.28, 0.42, 3.2, 12]} />
        <meshStandardMaterial color="#5b3a22" roughness={0.95} />
      </mesh>
      {[
        { y: 3.2, r: 2.2, h: 2.6, c: '#2c6b2c' },
        { y: 4.6, r: 1.7, h: 2.3, c: '#347a32' },
        { y: 5.9, r: 1.1, h: 1.9, c: '#3f8c3a' },
      ].map((t, i) => (
        <mesh key={i} position={[0, t.y, 0]} castShadow>
          <coneGeometry args={[t.r, t.h, 16]} />
          <meshStandardMaterial color={t.c} roughness={0.85} />
        </mesh>
      ))}
    </group>
  );
}

function RoundTree({ position, scale = 1 }: { position: Vec3; scale?: number }) {
  const ref = useRef<Group>(null);
  useFrame((state) => {
    if (ref.current) ref.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.45 + position[0]) * 0.02;
  });
  return (
    <group ref={ref} position={position} scale={scale}>
      <mesh position={[0, 1.8, 0]} castShadow>
        <cylinderGeometry args={[0.32, 0.5, 3.6, 12]} />
        <meshStandardMaterial color="#6B4226" roughness={0.95} />
      </mesh>
      <mesh position={[0, 4.6, 0]} castShadow>
        <sphereGeometry args={[2.2, 20, 16]} />
        <meshStandardMaterial color="#2f6b2c" roughness={0.85} />
      </mesh>
      <mesh position={[1.3, 4.0, 0.4]} castShadow>
        <sphereGeometry args={[1.5, 16, 14]} />
        <meshStandardMaterial color="#3d7a37" roughness={0.85} />
      </mesh>
      <mesh position={[-1.1, 4.2, -0.5]} castShadow>
        <sphereGeometry args={[1.4, 16, 14]} />
        <meshStandardMaterial color="#357032" roughness={0.85} />
      </mesh>
      <mesh position={[0.2, 6.0, 0]} castShadow>
        <sphereGeometry args={[1.4, 16, 14]} />
        <meshStandardMaterial color="#4d9a47" roughness={0.85} />
      </mesh>
    </group>
  );
}

function BirchTree({ position, scale = 1 }: { position: Vec3; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 2.4, 0]} castShadow>
        <cylinderGeometry args={[0.16, 0.22, 5, 10]} />
        <meshStandardMaterial color="#e8e6df" roughness={0.7} />
      </mesh>
      <mesh position={[0, 5.4, 0]} castShadow>
        <sphereGeometry args={[1.4, 16, 14]} />
        <meshStandardMaterial color="#6fae3e" roughness={0.85} />
      </mesh>
      <mesh position={[0.7, 4.7, 0.3]} castShadow>
        <sphereGeometry args={[1.0, 14, 12]} />
        <meshStandardMaterial color="#7cbd47" roughness={0.85} />
      </mesh>
    </group>
  );
}

function Bush({ position, color = '#3a7a35' }: { position: Vec3; color?: string }) {
  return (
    <group position={position}>
      <mesh castShadow position={[0, 0.4, 0]}>
        <sphereGeometry args={[0.7, 14, 12]} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
      <mesh castShadow position={[0.5, 0.3, 0.2]}>
        <sphereGeometry args={[0.5, 12, 10]} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
      <mesh castShadow position={[-0.45, 0.32, -0.1]}>
        <sphereGeometry args={[0.45, 12, 10]} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
    </group>
  );
}

function Rock({ position, scale = 1, color = '#8a8a90' }: { position: Vec3; scale?: number; color?: string }) {
  const rot = useMemo<Vec3>(() => [seededRandom(position[0] * 3) * 3, seededRandom(position[2] * 5) * 3, 0], [position]);
  return (
    <mesh position={position} rotation={rot} scale={[scale, scale * 0.8, scale]} castShadow receiveShadow>
      <dodecahedronGeometry args={[0.7, 1]} />
      <meshStandardMaterial color={color} roughness={0.95} flatShading />
    </mesh>
  );
}

function Mushroom({ position, cap = '#d6453f' }: { position: Vec3; cap?: string }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.18, 0]}>
        <cylinderGeometry args={[0.06, 0.08, 0.36, 8]} />
        <meshStandardMaterial color="#f3ece0" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.38, 0]} castShadow>
        <sphereGeometry args={[0.2, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={cap} roughness={0.6} />
      </mesh>
    </group>
  );
}

function GrassTufts({ count, centerX, centerZ, rangeX, rangeZ, avgY, seed }: { count: number; centerX: number; centerZ: number; rangeX: number; rangeZ: number; avgY: number; seed: number }) {
  const blades = useMemo(() => {
    const arr: { p: Vec3; c: string; s: number }[] = [];
    for (let i = 0; i < count; i++) {
      const x = centerX + (seededRandom(seed + i * 1.7) - 0.5) * rangeX * 1.3;
      const z = centerZ + (seededRandom(seed + i * 2.3) - 0.5) * (rangeZ + 14);
      const greens = ['#4a8c3a', '#3f7d33', '#57a043'];
      arr.push({ p: [x, avgY, z], c: greens[i % 3], s: 0.7 + seededRandom(seed + i * 3.1) * 0.6 });
    }
    return arr;
  }, [count, centerX, centerZ, rangeX, rangeZ, avgY, seed]);
  return (
    <>
      {blades.map((b, i) => (
        <mesh key={i} position={[b.p[0], b.p[1] + 0.25 * b.s, b.p[2]]} scale={b.s}>
          <coneGeometry args={[0.12, 0.5, 5]} />
          <meshStandardMaterial color={b.c} roughness={0.9} />
        </mesh>
      ))}
    </>
  );
}

function Pond({ position, radius = 4 }: { position: Vec3; radius?: number }) {
  const ref = useRef<Mesh>(null);
  useFrame((state) => {
    if (ref.current) {
      const m = ref.current.material as THREE.MeshStandardMaterial;
      m.opacity = 0.72 + Math.sin(state.clock.elapsedTime * 0.8) * 0.05;
    }
  });
  return (
    <group position={position}>
      <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <circleGeometry args={[radius, 40]} />
        <meshStandardMaterial color="#2f7fb0" roughness={0.15} metalness={0.5} transparent opacity={0.75} />
      </mesh>
      {/* muddy bank */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <ringGeometry args={[radius, radius + 0.6, 40]} />
        <meshStandardMaterial color="#6b5a3a" roughness={1} />
      </mesh>
      {/* lily pads */}
      {Array.from({ length: 5 }).map((_, i) => {
        const a = (i / 5) * Math.PI * 2;
        const r = radius * 0.55;
        return (
          <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[Math.cos(a) * r, 0.06, Math.sin(a) * r]}>
            <circleGeometry args={[0.4, 12]} />
            <meshStandardMaterial color="#3f8c4a" roughness={0.7} side={THREE.DoubleSide} />
          </mesh>
        );
      })}
      {/* reeds */}
      {Array.from({ length: 8 }).map((_, i) => {
        const a = (i / 8) * Math.PI * 2 + 0.3;
        const r = radius * 0.95;
        return (
          <mesh key={`r${i}`} position={[Math.cos(a) * r, 0.7, Math.sin(a) * r]}>
            <cylinderGeometry args={[0.03, 0.04, 1.4, 5]} />
            <meshStandardMaterial color="#5a7d3a" roughness={0.9} />
          </mesh>
        );
      })}
    </group>
  );
}

function Fence({ position, length = 6, rotationY = 0 }: { position: Vec3; length?: number; rotationY?: number }) {
  const posts = Math.max(2, Math.round(length / 1.5));
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {Array.from({ length: posts }).map((_, i) => {
        const x = -length / 2 + (i / (posts - 1)) * length;
        return (
          <mesh key={i} position={[x, 0.5, 0]} castShadow>
            <boxGeometry args={[0.16, 1.1, 0.16]} />
            <meshStandardMaterial color="#7a5836" roughness={0.9} />
          </mesh>
        );
      })}
      <mesh position={[0, 0.75, 0]}>
        <boxGeometry args={[length, 0.1, 0.08]} />
        <meshStandardMaterial color="#8a663f" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.4, 0]}>
        <boxGeometry args={[length, 0.1, 0.08]} />
        <meshStandardMaterial color="#8a663f" roughness={0.9} />
      </mesh>
    </group>
  );
}

function Butterfly({ position, color = '#ff9f43' }: { position: Vec3; color?: string }) {
  const ref = useRef<Group>(null);
  const lw = useRef<Mesh>(null);
  const rw = useRef<Mesh>(null);
  useFrame((state) => {
    const t = state.clock.elapsedTime + position[0] * 4;
    if (ref.current) {
      ref.current.position.x = position[0] + Math.sin(t * 0.6) * 2.5;
      ref.current.position.y = position[1] + Math.sin(t * 1.3) * 0.8;
      ref.current.position.z = position[2] + Math.cos(t * 0.5) * 2.5;
      ref.current.rotation.y = t * 0.5;
    }
    const flap = Math.sin(t * 12) * 0.7;
    if (lw.current) lw.current.rotation.y = flap;
    if (rw.current) rw.current.rotation.y = -flap;
  });
  return (
    <group ref={ref} position={position}>
      <mesh ref={lw} position={[-0.02, 0, 0]}>
        <planeGeometry args={[0.3, 0.4]} />
        <meshStandardMaterial color={color} side={THREE.DoubleSide} emissive={color} emissiveIntensity={0.2} roughness={0.6} />
      </mesh>
      <mesh ref={rw} position={[0.02, 0, 0]}>
        <planeGeometry args={[0.3, 0.4]} />
        <meshStandardMaterial color={color} side={THREE.DoubleSide} emissive={color} emissiveIntensity={0.2} roughness={0.6} />
      </mesh>
    </group>
  );
}

// ============================================================
//  CRYSTAL CAVES
// ============================================================

function CrystalCluster({ position, height = 3, color = '#7b68ee' }: { position: Vec3; height?: number; color?: string }) {
  const ref = useRef<Group>(null);
  useFrame((state) => {
    if (!ref.current) return;
    ref.current.children.forEach((child, i) => {
      const mat = (child as Mesh).material as THREE.MeshStandardMaterial;
      if (mat?.emissiveIntensity !== undefined) {
        mat.emissiveIntensity = 0.45 + Math.sin(state.clock.elapsedTime * 1.5 + i + position[0]) * 0.25;
      }
    });
  });
  return (
    <group ref={ref} position={position}>
      {Array.from({ length: 5 }).map((_, i) => {
        const ox = Math.sin(i * 2.5 + position[0]) * 0.6;
        const oz = Math.cos(i * 3.1 + position[2]) * 0.5;
        const h = height * (0.4 + Math.sin(i * 1.7) * 0.5);
        return (
          <mesh key={i} position={[ox, h / 2, oz]} rotation={[Math.sin(i) * 0.2, i * 0.8, Math.cos(i) * 0.15]}>
            <octahedronGeometry args={[0.5]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} roughness={0.05} metalness={0.7} envMapIntensity={1.8} transparent opacity={0.85} />
          </mesh>
        );
      })}
      <mesh position={[0, height * 0.7, 0]} rotation={[0.1, 0, 0.05]} scale={[0.5, height * 0.4, 0.5]} castShadow>
        <octahedronGeometry args={[1]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} roughness={0.02} metalness={0.8} envMapIntensity={1.8} transparent opacity={0.9} />
      </mesh>
    </group>
  );
}

function Stalagmite({ position, height = 2, color = '#3a3a5e' }: { position: Vec3; height?: number; color?: string }) {
  return (
    <mesh position={[position[0], position[1] + height / 2, position[2]]} castShadow>
      <coneGeometry args={[0.4 + height * 0.08, height, 10]} />
      <meshStandardMaterial color={color} roughness={0.8} metalness={0.2} />
    </mesh>
  );
}

function Stalactites({ position, width = 10 }: { position: Vec3; width?: number }) {
  return (
    <group position={position}>
      {Array.from({ length: 8 }).map((_, i) => {
        const sx = (i - 3.5) * (width / 7);
        const sz = Math.sin(i * 3 + position[0]) * 2;
        const h = 1.5 + Math.sin(i * 2.3) * 0.7;
        return (
          <mesh key={i} position={[sx, 0, sz]} rotation={[Math.PI, 0, Math.sin(i) * 0.15]}>
            <coneGeometry args={[0.25 + Math.sin(i) * 0.12, h, 14]} />
            <meshStandardMaterial color="#3a3a5e" roughness={0.7} metalness={0.3} />
          </mesh>
        );
      })}
    </group>
  );
}

function GlowMushroom({ position, color = '#56d4c8', scale = 1 }: { position: Vec3; color?: string; scale?: number }) {
  const ref = useRef<Mesh>(null);
  useFrame((state) => {
    if (ref.current) {
      const m = ref.current.material as THREE.MeshStandardMaterial;
      m.emissiveIntensity = 0.8 + Math.sin(state.clock.elapsedTime * 2 + position[0]) * 0.4;
    }
  });
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.07, 0.1, 0.6, 8]} />
        <meshStandardMaterial color="#cfe8e2" emissive={color} emissiveIntensity={0.3} roughness={0.6} />
      </mesh>
      <mesh ref={ref} position={[0, 0.62, 0]} castShadow={!LOW_PERF}>
        <sphereGeometry args={[0.26, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.1} roughness={0.3} toneMapped={false} />
      </mesh>
    </group>
  );
}

function CavePool({ position, radius = 3.5 }: { position: Vec3; radius?: number }) {
  const ref = useRef<Mesh>(null);
  useFrame((state) => {
    if (ref.current) {
      const m = ref.current.material as THREE.MeshStandardMaterial;
      m.emissiveIntensity = 0.5 + Math.sin(state.clock.elapsedTime * 0.9) * 0.2;
    }
  });
  return (
    <group position={position}>
      <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <circleGeometry args={[radius, 40]} />
        <meshStandardMaterial color="#1b3a6b" emissive="#2f7fb0" emissiveIntensity={0.5} roughness={0.1} metalness={0.6} transparent opacity={0.85} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
        <ringGeometry args={[radius, radius + 0.4, 40]} />
        <meshStandardMaterial color="#56d4c8" emissive="#56d4c8" emissiveIntensity={0.6} transparent opacity={0.5} />
      </mesh>
    </group>
  );
}

function Firefly({ position, color = '#aef3e0' }: { position: Vec3; color?: string }) {
  const ref = useRef<Group>(null);
  useFrame((state) => {
    const t = state.clock.elapsedTime + position[0] * 3;
    if (ref.current) {
      ref.current.position.x = position[0] + Math.sin(t * 0.7) * 1.8;
      ref.current.position.y = position[1] + Math.sin(t * 1.1) * 1.0;
      ref.current.position.z = position[2] + Math.cos(t * 0.6) * 1.8;
    }
  });
  return (
    <group ref={ref} position={position}>
      <mesh>
        <sphereGeometry args={[0.09, 8, 8]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2.4} toneMapped={false} />
      </mesh>
    </group>
  );
}

// ============================================================
//  VOLCANIC RIDGE
// ============================================================

function LavaRiver({ position, length = 8 }: { position: Vec3; length?: number }) {
  const ref = useRef<Mesh>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const m = ref.current.material as THREE.MeshStandardMaterial;
    m.emissiveIntensity = 0.7 + Math.sin(state.clock.elapsedTime * 2 + position[0]) * 0.35;
  });
  return (
    <mesh ref={ref} position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[length, 1.8]} />
      <meshStandardMaterial color="#ff4500" emissive="#ff6a00" emissiveIntensity={0.7} roughness={0.3} />
    </mesh>
  );
}

function LavaPool({ position, radius = 2.4 }: { position: Vec3; radius?: number }) {
  const ref = useRef<Mesh>(null);
  useFrame((state) => {
    if (ref.current) {
      const m = ref.current.material as THREE.MeshStandardMaterial;
      m.emissiveIntensity = 0.8 + Math.sin(state.clock.elapsedTime * 1.6 + position[2]) * 0.4;
    }
  });
  return (
    <group position={position}>
      <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
        <circleGeometry args={[radius, 32]} />
        <meshStandardMaterial color="#ff5510" emissive="#ff7a1a" emissiveIntensity={0.9} roughness={0.4} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[radius, radius + 0.5, 32]} />
        <meshStandardMaterial color="#2a1410" roughness={1} />
      </mesh>
      {!LOW_PERF && <pointLight position={[0, 1, 0]} color="#ff6a1a" intensity={1.6} distance={10} decay={2} />}
    </group>
  );
}

function BasaltColumns({ position, count = 5 }: { position: Vec3; count?: number }) {
  return (
    <group position={position}>
      {Array.from({ length: count }).map((_, i) => {
        const ox = (seededRandom(i * 7 + position[0]) - 0.5) * 2.2;
        const oz = (seededRandom(i * 9 + position[2]) - 0.5) * 2.2;
        const h = 2.5 + seededRandom(i * 5 + 3) * 4;
        return (
          <mesh key={i} position={[ox, h / 2, oz]} castShadow>
            <cylinderGeometry args={[0.55, 0.6, h, 6]} />
            <meshStandardMaterial color="#1c1c20" roughness={0.85} metalness={0.25} />
          </mesh>
        );
      })}
    </group>
  );
}

function CharredTree({ position, scale = 1 }: { position: Vec3; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 2, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.32, 4, 8]} />
        <meshStandardMaterial color="#141210" roughness={1} />
      </mesh>
      <mesh position={[0.5, 3.4, 0]} rotation={[0, 0, -0.7]} castShadow>
        <cylinderGeometry args={[0.07, 0.13, 1.6, 6]} />
        <meshStandardMaterial color="#16110f" roughness={1} />
      </mesh>
      <mesh position={[-0.45, 3.0, 0.2]} rotation={[0, 0, 0.8]} castShadow>
        <cylinderGeometry args={[0.06, 0.12, 1.3, 6]} />
        <meshStandardMaterial color="#16110f" roughness={1} />
      </mesh>
      {/* faint embers in the trunk cracks */}
      <mesh position={[0, 1.5, 0.3]} scale={[0.06, 0.5, 0.06]}>
        <boxGeometry />
        <meshStandardMaterial color="#ff5510" emissive="#ff6a1a" emissiveIntensity={1} />
      </mesh>
    </group>
  );
}

function VolcanicRock({ position, scale = 1 }: { position: Vec3; scale?: number }) {
  return (
    <group position={position}>
      <mesh castShadow scale={[scale, scale * 1.4, scale]}>
        <dodecahedronGeometry args={[1, 1]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.95} flatShading />
      </mesh>
      <mesh position={[0, scale * 0.4, scale * 0.6]} scale={[scale, 0.12, 0.12]}>
        <boxGeometry />
        <meshStandardMaterial color="#ff4500" emissive="#ff6a00" emissiveIntensity={0.9} />
      </mesh>
    </group>
  );
}

function Volcano({ position }: { position: Vec3 }) {
  const smoke = useRef<Group>(null);
  useFrame((state) => {
    if (!smoke.current) return;
    const t = state.clock.elapsedTime;
    smoke.current.children.forEach((c, i) => {
      const m = c as Mesh;
      const phase = (t * 0.5 + i * 1.2) % 6;
      m.position.y = 9 + phase * 1.5;
      m.scale.setScalar(1 + phase * 0.5);
      const mat = m.material as THREE.MeshStandardMaterial;
      mat.opacity = Math.max(0, 0.4 - phase * 0.06);
    });
  });
  return (
    <group position={position}>
      <mesh position={[0, 4, 0]} castShadow>
        <coneGeometry args={[8, 9, 24, 1, true]} />
        <meshStandardMaterial color="#241a16" roughness={1} side={THREE.DoubleSide} />
      </mesh>
      {/* glowing crater */}
      <mesh position={[0, 8.4, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[2.4, 24]} />
        <meshStandardMaterial color="#ff5510" emissive="#ff7a1a" emissiveIntensity={1.3} />
      </mesh>
      {!LOW_PERF && <pointLight position={[0, 9, 0]} color="#ff6a1a" intensity={2} distance={25} decay={2} />}
      <group ref={smoke}>
        {Array.from({ length: 5 }).map((_, i) => (
          <mesh key={i}>
            <sphereGeometry args={[1.4, 12, 12]} />
            <meshStandardMaterial color="#3a3330" transparent opacity={0.35} roughness={1} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function SmokePlume({ position }: { position: Vec3 }) {
  const ref = useRef<Group>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime + position[0] * 5;
    ref.current.children.forEach((child, i) => {
      const m = child as Mesh;
      const phase = (t * 0.4 + i * 0.5) % 5;
      m.position.y = phase;
      m.scale.setScalar(0.4 + phase * 0.25);
      const mat = m.material as THREE.MeshStandardMaterial;
      mat.opacity = Math.max(0, 0.35 - phase * 0.07);
    });
  });
  return (
    <group ref={ref} position={position}>
      {Array.from({ length: 5 }).map((_, i) => (
        <mesh key={i}>
          <sphereGeometry args={[0.6, 16, 16]} />
          <meshStandardMaterial color="#555555" transparent opacity={0.3} roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

// ============================================================
//  SKY ISLANDS
// ============================================================

function FloatingIsland({ position, scale = 1, grassy = true }: { position: Vec3; scale?: number; grassy?: boolean }) {
  const ref = useRef<Group>(null);
  useFrame((state) => {
    if (ref.current) ref.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.4 + position[0]) * 0.4;
  });
  return (
    <group ref={ref} position={position} scale={scale}>
      {/* rocky underside */}
      <mesh position={[0, -1.4, 0]} castShadow>
        <coneGeometry args={[2.2, 3.2, 10]} />
        <meshStandardMaterial color="#7a6b8a" roughness={0.95} flatShading />
      </mesh>
      {/* grass / stone top */}
      <mesh position={[0, 0, 0]} receiveShadow>
        <cylinderGeometry args={[2.4, 2.2, 0.8, 12]} />
        <meshStandardMaterial color={grassy ? '#5aa84a' : '#cdbf9a'} roughness={0.85} />
      </mesh>
      {grassy && (
        <>
          <mesh position={[0.8, 0.7, 0.3]} castShadow>
            <sphereGeometry args={[0.8, 14, 12]} />
            <meshStandardMaterial color="#3f8c3a" roughness={0.85} />
          </mesh>
          <mesh position={[-0.7, 0.55, -0.4]} castShadow>
            <sphereGeometry args={[0.55, 12, 10]} />
            <meshStandardMaterial color="#4d9a47" roughness={0.85} />
          </mesh>
        </>
      )}
    </group>
  );
}

function Waterfall({ position, height = 6 }: { position: Vec3; height?: number }) {
  const ref = useRef<Mesh>(null);
  useFrame((state) => {
    if (ref.current) {
      const m = ref.current.material as THREE.MeshStandardMaterial;
      if (m.map) {
        m.map.offset.y = (state.clock.elapsedTime * 0.9) % 1;
      } else {
        // animate opacity shimmer if no texture
        m.opacity = 0.5 + Math.sin(state.clock.elapsedTime * 6 + position[0]) * 0.08;
      }
    }
  });
  return (
    <group position={position}>
      <mesh ref={ref} position={[0, -height / 2, 0]}>
        <planeGeometry args={[1.4, height]} />
        <meshStandardMaterial color="#bfe6ff" emissive="#9fd6ff" emissiveIntensity={0.3} transparent opacity={0.55} roughness={0.2} side={THREE.DoubleSide} />
      </mesh>
      {/* mist at base */}
      <mesh position={[0, -height, 0]}>
        <sphereGeometry args={[1, 14, 12]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.4} roughness={1} />
      </mesh>
    </group>
  );
}

function Bird({ position, color = '#2c2c3a' }: { position: Vec3; color?: string }) {
  const ref = useRef<Group>(null);
  const lw = useRef<Mesh>(null);
  const rw = useRef<Mesh>(null);
  useFrame((state) => {
    const t = state.clock.elapsedTime * 0.5 + position[0];
    if (ref.current) {
      ref.current.position.x = position[0] + Math.cos(t) * 8;
      ref.current.position.z = position[2] + Math.sin(t) * 8;
      ref.current.position.y = position[1] + Math.sin(t * 2) * 1.2;
      ref.current.rotation.y = -t + Math.PI / 2;
    }
    const flap = Math.sin(state.clock.elapsedTime * 8 + position[0]) * 0.6;
    if (lw.current) lw.current.rotation.z = 0.3 + flap;
    if (rw.current) rw.current.rotation.z = -0.3 - flap;
  });
  return (
    <group ref={ref} position={position} scale={0.6}>
      <mesh ref={lw} position={[-0.05, 0, 0]}>
        <planeGeometry args={[0.9, 0.25]} />
        <meshStandardMaterial color={color} side={THREE.DoubleSide} roughness={0.8} />
      </mesh>
      <mesh ref={rw} position={[0.05, 0, 0]}>
        <planeGeometry args={[0.9, 0.25]} />
        <meshStandardMaterial color={color} side={THREE.DoubleSide} roughness={0.8} />
      </mesh>
    </group>
  );
}

function BigCloud({ position, scale = 1 }: { position: Vec3; scale?: number }) {
  const ref = useRef<Group>(null);
  useFrame((state) => {
    if (!ref.current) return;
    ref.current.position.x = position[0] + Math.sin(state.clock.elapsedTime * 0.06 + position[2]) * 2;
    ref.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.12 + position[0]) * 0.4;
  });
  return (
    <group ref={ref} position={position} scale={scale}>
      <mesh>
        <sphereGeometry args={[2, 28, 22]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.75} roughness={1} />
      </mesh>
      <mesh position={[1.5, -0.2, 0]}>
        <sphereGeometry args={[1.3, 24, 18]} />
        <meshStandardMaterial color="#f5f8ff" transparent opacity={0.7} roughness={1} />
      </mesh>
      <mesh position={[-1.2, 0.1, 0.5]}>
        <sphereGeometry args={[1.1, 24, 18]} />
        <meshStandardMaterial color="#f5f8ff" transparent opacity={0.65} roughness={1} />
      </mesh>
      <mesh position={[0.2, 0.5, -0.5]}>
        <sphereGeometry args={[1.2, 24, 18]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.65} roughness={1} />
      </mesh>
    </group>
  );
}

function RainbowArc({ position }: { position: Vec3 }) {
  const colors = ['#ff5b5b', '#ff9f43', '#ffe66d', '#5fd36a', '#4aa3f0', '#9b6bff'];
  return (
    <group position={position} rotation={[0, position[0] * 0.3, 0]}>
      {colors.map((color, i) => (
        <mesh key={i}>
          <torusGeometry args={[4 + i * 0.22, 0.1, 8, 40, Math.PI]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.35} transparent opacity={0.55} />
        </mesh>
      ))}
    </group>
  );
}

// ============================================================
//  THE SUMMIT
// ============================================================

function SnowPeak({ position, scale = 1 }: { position: Vec3; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 6, 0]} castShadow>
        <coneGeometry args={[6, 12, 8]} />
        <meshStandardMaterial color="#5a5470" roughness={0.9} flatShading />
      </mesh>
      <mesh position={[0, 10.2, 0]}>
        <coneGeometry args={[2.6, 3.8, 8]} />
        <meshStandardMaterial color="#f4f6ff" roughness={0.7} />
      </mesh>
    </group>
  );
}

function GoldenPillar({ position, height = 4, broken = false }: { position: Vec3; height?: number; broken?: boolean }) {
  const ref = useRef<Mesh>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const m = ref.current.material as THREE.MeshStandardMaterial;
    m.emissiveIntensity = 0.2 + Math.sin(state.clock.elapsedTime + position[0]) * 0.1;
  });
  return (
    <group position={position}>
      <mesh position={[0, 0.2, 0]}>
        <boxGeometry args={[1.1, 0.4, 1.1]} />
        <meshStandardMaterial color="#caa84e" roughness={0.3} metalness={0.7} />
      </mesh>
      <mesh ref={ref} position={[0, height / 2, 0]} castShadow rotation={[0, 0, broken ? 0.12 : 0]}>
        <cylinderGeometry args={[0.3, 0.38, height, 12]} />
        <meshStandardMaterial color="#d4aa50" emissive="#ffd700" emissiveIntensity={0.2} roughness={0.15} metalness={0.85} />
      </mesh>
      {!broken && (
        <mesh position={[0, height + 0.3, 0]}>
          <boxGeometry args={[1.0, 0.35, 1.0]} />
          <meshStandardMaterial color="#e8c45e" roughness={0.2} metalness={0.8} />
        </mesh>
      )}
    </group>
  );
}

function Brazier({ position }: { position: Vec3 }) {
  const flame = useRef<Mesh>(null);
  useFrame((state) => {
    if (flame.current) {
      const t = state.clock.elapsedTime * 6 + position[0];
      flame.current.scale.set(1 + Math.sin(t) * 0.15, 1.2 + Math.sin(t * 1.3) * 0.25, 1 + Math.cos(t) * 0.15);
      const m = flame.current.material as THREE.MeshStandardMaterial;
      m.emissiveIntensity = 1.4 + Math.sin(t) * 0.4;
    }
  });
  return (
    <group position={position}>
      <mesh position={[0, 1, 0]} castShadow>
        <cylinderGeometry args={[0.4, 0.25, 0.5, 12]} />
        <meshStandardMaterial color="#b58a3a" roughness={0.3} metalness={0.7} />
      </mesh>
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.08, 0.12, 1, 8]} />
        <meshStandardMaterial color="#8a6a2a" roughness={0.4} metalness={0.6} />
      </mesh>
      <mesh ref={flame} position={[0, 1.5, 0]}>
        <coneGeometry args={[0.3, 0.8, 10]} />
        <meshStandardMaterial color="#ffb030" emissive="#ff8a1a" emissiveIntensity={1.5} transparent opacity={0.9} />
      </mesh>
      {!LOW_PERF && <pointLight position={[0, 1.7, 0]} color="#ffaa44" intensity={1.4} distance={9} decay={2} />}
    </group>
  );
}

function PrayerFlags({ position, length = 8 }: { position: Vec3; length?: number }) {
  const colors = ['#ff5b5b', '#ffe66d', '#5fd36a', '#4aa3f0', '#9b6bff'];
  const n = 10;
  return (
    <group position={position}>
      {/* posts */}
      <mesh position={[-length / 2, 1, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 2, 6]} />
        <meshStandardMaterial color="#8a6a3a" roughness={0.8} />
      </mesh>
      <mesh position={[length / 2, 1, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 2, 6]} />
        <meshStandardMaterial color="#8a6a3a" roughness={0.8} />
      </mesh>
      {Array.from({ length: n }).map((_, i) => {
        const x = -length / 2 + ((i + 0.5) / n) * length;
        const sag = Math.sin((i / n) * Math.PI) * 0.4;
        return (
          <Flag key={i} position={[x, 1.85 - sag, 0]} color={colors[i % colors.length]} phase={i} />
        );
      })}
    </group>
  );
}

function Flag({ position, color, phase }: { position: Vec3; color: string; phase: number }) {
  const ref = useRef<Mesh>(null);
  useFrame((state) => {
    if (ref.current) ref.current.rotation.y = Math.sin(state.clock.elapsedTime * 3 + phase) * 0.4;
  });
  return (
    <mesh ref={ref} position={position}>
      <planeGeometry args={[0.5, 0.6]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.2} side={THREE.DoubleSide} roughness={0.7} />
    </mesh>
  );
}

function Aurora({ position }: { position: Vec3 }) {
  const ref = useRef<Group>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.children.forEach((c, i) => {
      const m = c as Mesh;
      const mat = m.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.12 + Math.sin(t * 0.6 + i) * 0.08;
      m.position.x = Math.sin(t * 0.2 + i * 1.5) * 4;
    });
  });
  const colors = ['#5fffc8', '#56b0ff', '#9b6bff'];
  return (
    <group ref={ref} position={position}>
      {colors.map((c, i) => (
        <mesh key={i} position={[0, i * 2, -i * 2]} rotation={[0, 0, 0.1 * i]}>
          <planeGeometry args={[30, 8, 20, 1]} />
          <meshBasicMaterial color={c} transparent opacity={0.15} side={THREE.DoubleSide} depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>
      ))}
    </group>
  );
}

function LightBeam({ position }: { position: Vec3 }) {
  return (
    <mesh position={[position[0], position[1] + 5, position[2]]}>
      <cylinderGeometry args={[0.1, 0.4, 10, 8]} />
      <meshStandardMaterial color="#ffeedd" emissive="#ffd700" emissiveIntensity={0.4} transparent opacity={0.12} />
    </mesh>
  );
}

function FloatingGem({ position }: { position: Vec3 }) {
  const ref = useRef<Mesh>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime + position[0] * 3;
    ref.current.position.y = position[1] + Math.sin(t * 1.5) * 0.5;
    ref.current.rotation.y = t * 0.8;
  });
  return (
    <mesh ref={ref} position={position}>
      <icosahedronGeometry args={[0.4]} />
      <meshStandardMaterial color="#ffd700" emissive="#ffd700" emissiveIntensity={0.5} roughness={0.05} metalness={0.9} envMapIntensity={2} />
    </mesh>
  );
}

// ============================================================
//  Scatter helper — places items on both sides of the path
// ============================================================

function scatterSides(
  count: number,
  seed: number,
  data: { centerX: number; centerZ: number; avgY: number; rangeX: number; rangeZ: number },
  near: number,
  far: number,
): Vec3[] {
  const n = qty(count); // thin out decoration density on low-power devices
  const out: Vec3[] = [];
  for (let i = 0; i < n; i++) {
    const side = i % 2 === 0 ? 1 : -1;
    const x = data.centerX + (seededRandom(seed + i * 1.3) - 0.5) * data.rangeX * 1.25;
    const z = data.centerZ + side * (data.rangeZ * 0.45 + near + seededRandom(seed + i * 2.7) * (far - near));
    out.push([x, data.avgY, z]);
  }
  return out;
}

// ============================================================
//  Main component
// ============================================================

export function ImmersiveDecorations({ positions, activeZone }: ImmersiveDecorationsProps) {
  const zoneData = useMemo(() => {
    return ZONES.map((zone) => {
      const startIdx = zone.startSquare - 1;
      const endIdx = Math.min(zone.endSquare, positions.length);
      const zonePos = positions.slice(startIdx, endIdx);
      if (zonePos.length === 0) return null;

      let minX = Infinity, maxX = -Infinity;
      let minZ = Infinity, maxZ = -Infinity;
      let avgY = 0;
      for (const [x, y, z] of zonePos) {
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minZ = Math.min(minZ, z);
        maxZ = Math.max(maxZ, z);
        avgY += y;
      }
      avgY /= zonePos.length;
      const centerX = (minX + maxX) / 2;
      const centerZ = (minZ + maxZ) / 2;
      return { minX, maxX, minZ, maxZ, avgY, centerX, centerZ, rangeX: maxX - minX, rangeZ: maxZ - minZ };
    });
  }, [positions]);

  return (
    <>
      {ZONES.map((zone, zoneIdx) => {
        if (Math.abs(zoneIdx - activeZone) > 1) return null;
        const data = zoneData[zoneIdx];
        if (!data) return null;
        const { centerX, centerZ, avgY, rangeX, rangeZ } = data;

        switch (zoneIdx) {
          // ---------------- MEADOW ----------------
          case 0:
            return (
              <group key={zone.name}>
                {/* trees — mixed species */}
                {scatterSides(22, 1, data, 3, 9).map((p, i) => {
                  const s = 0.8 + seededRandom(i * 3 + 5) * 0.6;
                  const kind = i % 3;
                  if (kind === 0) return <ConiferTree key={`t${i}`} position={p} scale={s} />;
                  if (kind === 1) return <RoundTree key={`t${i}`} position={p} scale={s} />;
                  return <BirchTree key={`t${i}`} position={p} scale={s} />;
                })}
                {/* bushes */}
                {scatterSides(16, 40, data, 1.5, 6).map((p, i) => (
                  <Bush key={`b${i}`} position={p} color={i % 2 ? '#3a7a35' : '#46913f'} />
                ))}
                {/* rocks */}
                {scatterSides(10, 80, data, 1, 7).map((p, i) => (
                  <Rock key={`r${i}`} position={p} scale={0.7 + seededRandom(i * 5 + 2) * 1.1} />
                ))}
                {/* mushrooms */}
                {scatterSides(10, 120, data, 1, 4).map((p, i) => (
                  <Mushroom key={`m${i}`} position={p} cap={i % 2 ? '#d6453f' : '#e88a2a'} />
                ))}
                {/* flowers */}
                {scatterSides(9, 160, data, 0.5, 3).map((p, i) => (
                  <FlowerPatch key={`f${i}`} position={p} />
                ))}
                {/* fences along the field edge */}
                {Array.from({ length: 3 }).map((_, i) => {
                  const fx = data.minX + (i + 0.5) * (rangeX / 3);
                  return (
                    <group key={`fence${i}`}>
                      <Fence position={[fx, avgY, centerZ + rangeZ * 0.5 + 3]} length={rangeX / 3} />
                      <Fence position={[fx, avgY, centerZ - rangeZ * 0.5 - 3]} length={rangeX / 3} />
                    </group>
                  );
                })}
                {/* a pond */}
                <Pond position={[centerX + rangeX * 0.2, avgY, centerZ + rangeZ * 0.55 + 4]} radius={4} />
                {/* grass detail */}
                <GrassTufts count={qty(70)} centerX={centerX} centerZ={centerZ} rangeX={rangeX} rangeZ={rangeZ} avgY={avgY} seed={200} />
                {/* butterflies */}
                {Array.from({ length: qty(6) }).map((_, i) => {
                  const cols = ['#ff9f43', '#ff6b9d', '#ffe66d', '#9b6bff'];
                  return <Butterfly key={`bf${i}`} position={[centerX + (seededRandom(i * 11) - 0.5) * rangeX, avgY + 1.5, centerZ + (seededRandom(i * 13) - 0.5) * rangeZ]} color={cols[i % 4]} />;
                })}
                {/* pollen / sun motes */}
                <Sparkles position={[centerX, avgY + 3, centerZ]} count={qty(30)} scale={[rangeX, 6, rangeZ + 10]} size={2} speed={0.2} opacity={0.4} color="#fff3b0" />
              </group>
            );

          // ---------------- CRYSTAL CAVES ----------------
          case 1:
            return (
              <group key={zone.name}>
                {/* crystal clusters */}
                {scatterSides(22, 30, data, 2, 7).map((p, i) => {
                  const cols = ['#7b68ee', '#9370db', '#6a5acd', '#8a2be2', '#5fd6e0'];
                  return <CrystalCluster key={`c${i}`} position={p} height={2.5 + seededRandom(i * 4 + 2) * 4} color={cols[i % cols.length]} />;
                })}
                {/* stalagmites rising from floor */}
                {scatterSides(16, 70, data, 1.5, 6).map((p, i) => (
                  <Stalagmite key={`sg${i}`} position={p} height={1.5 + seededRandom(i * 6 + 1) * 3} />
                ))}
                {/* ceiling stalactites */}
                {Array.from({ length: 4 }).map((_, i) => {
                  const rx = data.minX + (i + 0.5) * (rangeX / 4);
                  return <Stalactites key={`roof${i}`} position={[rx, avgY + 8, centerZ]} width={rangeX / 4} />;
                })}
                {/* glowing mushrooms */}
                {scatterSides(14, 110, data, 1, 5).map((p, i) => {
                  const cols = ['#56d4c8', '#98ec65', '#61dafb', '#c678dd'];
                  return <GlowMushroom key={`gm${i}`} position={p} color={cols[i % 4]} scale={0.8 + seededRandom(i * 7) * 0.8} />;
                })}
                {/* rock piles */}
                {scatterSides(8, 150, data, 1, 5).map((p, i) => (
                  <Rock key={`cr${i}`} position={p} scale={0.8 + seededRandom(i * 9) * 1} color="#3a3a4e" />
                ))}
                {/* underground pool */}
                <CavePool position={[centerX - rangeX * 0.15, avgY - 0.3, centerZ + rangeZ * 0.45 + 3]} radius={3.5} />
                {/* fireflies / motes */}
                {Array.from({ length: qty(12) }).map((_, i) => {
                  const cols = ['#aef3e0', '#98ec65', '#c8a8ff'];
                  return <Firefly key={`ff${i}`} position={[centerX + (seededRandom(i * 17) - 0.5) * rangeX, avgY + 2 + seededRandom(i * 19) * 4, centerZ + (seededRandom(i * 23) - 0.5) * rangeZ]} color={cols[i % 3]} />;
                })}
                <Sparkles position={[centerX, avgY + 4, centerZ]} count={qty(40)} scale={[rangeX, 8, rangeZ + 6]} size={2.5} speed={0.15} opacity={0.5} color="#9b8bff" />
              </group>
            );

          // ---------------- VOLCANIC RIDGE ----------------
          case 2:
            return (
              <group key={zone.name}>
                {/* distant volcano */}
                <Volcano position={[centerX - rangeX * 0.1, avgY - 2, centerZ - rangeZ * 0.5 - 18]} />
                {/* lava rivers */}
                {Array.from({ length: 3 }).map((_, i) => {
                  const lx = data.minX + (i + 0.5) * (rangeX / 3);
                  const side = i % 2 === 0 ? 1 : -1;
                  return <LavaRiver key={`lr${i}`} position={[lx, avgY - 0.2, centerZ + side * (rangeZ * 0.4 + 1.5)]} length={rangeX / 3} />;
                })}
                {/* lava pools */}
                {scatterSides(6, 60, data, 2, 7).map((p, i) => (
                  <LavaPool key={`lp${i}`} position={[p[0], p[1] - 0.2, p[2]]} radius={1.6 + seededRandom(i * 5) * 1.4} />
                ))}
                {/* basalt columns */}
                {scatterSides(8, 90, data, 2, 8).map((p, i) => (
                  <BasaltColumns key={`bc${i}`} position={p} count={3 + Math.floor(seededRandom(i * 3) * 3)} />
                ))}
                {/* volcanic rocks */}
                {scatterSides(12, 130, data, 1.5, 7).map((p, i) => (
                  <VolcanicRock key={`vr${i}`} position={p} scale={1 + seededRandom(i * 7) * 1.6} />
                ))}
                {/* charred trees */}
                {scatterSides(8, 170, data, 2, 7).map((p, i) => (
                  <CharredTree key={`ct${i}`} position={p} scale={0.8 + seededRandom(i * 11) * 0.7} />
                ))}
                {/* smoke */}
                {Array.from({ length: 5 }).map((_, i) => (
                  <SmokePlume key={`sm${i}`} position={[centerX + (seededRandom(i * 4 + 80) - 0.5) * rangeX * 0.8, avgY, centerZ + (seededRandom(i * 4 + 81) - 0.5) * rangeZ]} />
                ))}
                {/* rising embers */}
                <Sparkles position={[centerX, avgY + 3, centerZ]} count={qty(45)} scale={[rangeX, 8, rangeZ]} size={2.5} speed={0.5} opacity={0.7} color="#ff7a1a" />
              </group>
            );

          // ---------------- SKY ISLANDS ----------------
          case 3:
            return (
              <group key={zone.name}>
                {/* clouds */}
                {Array.from({ length: qty(14) }).map((_, i) => {
                  const cx = centerX + (seededRandom(i * 3 + 90) - 0.5) * (rangeX + 18);
                  const cz = centerZ + (seededRandom(i * 3 + 91) - 0.5) * (rangeZ + 14);
                  const cy = avgY - 4 + seededRandom(i * 3 + 92) * 8;
                  return <BigCloud key={`cl${i}`} position={[cx, cy, cz]} scale={1 + seededRandom(i * 3 + 93) * 1.6} />;
                })}
                {/* floating islands */}
                {scatterSides(10, 60, data, 4, 12).map((p, i) => (
                  <FloatingIsland key={`fi${i}`} position={[p[0], p[1] - 3 - seededRandom(i * 5) * 4, p[2]]} scale={1 + seededRandom(i * 7) * 1.2} grassy={i % 3 !== 0} />
                ))}
                {/* waterfalls off some islands */}
                {scatterSides(4, 100, data, 5, 10).map((p, i) => (
                  <Waterfall key={`wf${i}`} position={[p[0], p[1] - 3, p[2]]} height={5 + seededRandom(i * 3) * 4} />
                ))}
                {/* birds */}
                {Array.from({ length: qty(6) }).map((_, i) => (
                  <Bird key={`bd${i}`} position={[centerX + (seededRandom(i * 13) - 0.5) * rangeX, avgY + 4 + seededRandom(i * 17) * 5, centerZ + (seededRandom(i * 19) - 0.5) * rangeZ]} />
                ))}
                {/* floating gems */}
                {scatterSides(6, 140, data, 2, 6).map((p, i) => (
                  <FloatingGem key={`fg${i}`} position={[p[0], p[1] + 2 + seededRandom(i * 3) * 2, p[2]]} />
                ))}
                <RainbowArc position={[centerX + 4, avgY + 4, centerZ - 7]} />
                <Sparkles position={[centerX, avgY + 4, centerZ]} count={qty(30)} scale={[rangeX + 10, 10, rangeZ + 10]} size={2} speed={0.2} opacity={0.5} color="#eaf6ff" />
              </group>
            );

          // ---------------- THE SUMMIT ----------------
          case 4:
            return (
              <group key={zone.name}>
                {/* distant snow peaks */}
                {Array.from({ length: 5 }).map((_, i) => {
                  const a = (i / 5) * Math.PI * 2;
                  return <SnowPeak key={`pk${i}`} position={[centerX + Math.cos(a) * (rangeX * 0.7 + 16), avgY - 4, centerZ + Math.sin(a) * (rangeZ * 0.7 + 16)]} scale={1 + seededRandom(i * 3) * 0.8} />;
                })}
                {/* golden pillars (some broken ruins) */}
                {scatterSides(10, 110, data, 2, 7).map((p, i) => (
                  <GoldenPillar key={`gp${i}`} position={p} height={3 + seededRandom(i * 4) * 3} broken={i % 3 === 0} />
                ))}
                {/* braziers lighting the path */}
                {scatterSides(8, 60, data, 1.5, 3.5).map((p, i) => (
                  <Brazier key={`bz${i}`} position={p} />
                ))}
                {/* prayer flags strung across */}
                {Array.from({ length: 2 }).map((_, i) => (
                  <PrayerFlags key={`pf${i}`} position={[centerX + (i === 0 ? -rangeX * 0.2 : rangeX * 0.2), avgY + 2.5, centerZ + (i === 0 ? 3 : -3)]} length={7} />
                ))}
                {/* light beams + floating gems */}
                {scatterSides(5, 120, data, 1, 5).map((p, i) => (
                  <LightBeam key={`lb${i}`} position={p} />
                ))}
                {scatterSides(8, 130, data, 1, 5).map((p, i) => (
                  <FloatingGem key={`sg${i}`} position={[p[0], p[1] + 1.5 + seededRandom(i * 4) * 3, p[2]]} />
                ))}
                {/* aurora ribbons high above */}
                <Aurora position={[centerX, avgY + 16, centerZ - 10]} />
                {/* falling snow */}
                <Sparkles position={[centerX, avgY + 8, centerZ]} count={qty(50)} scale={[rangeX + 10, 14, rangeZ + 10]} size={2.5} speed={0.3} opacity={0.7} color="#ffffff" />
              </group>
            );

          default:
            return null;
        }
      })}
    </>
  );
}

// FlowerPatch kept from original (improved petals)
function FlowerPatch({ position }: { position: Vec3 }) {
  const colors = ['#ff6b9d', '#ff9f43', '#ffd93d', '#ee5a24', '#c678dd'];
  return (
    <group position={position}>
      {Array.from({ length: 6 }).map((_, i) => {
        const angle = (i / 6) * Math.PI * 2;
        const r = 0.4 + Math.sin(i * 2) * 0.2;
        return (
          <group key={i} position={[Math.cos(angle) * r, 0, Math.sin(angle) * r]}>
            <mesh position={[0, 0.3, 0]}>
              <cylinderGeometry args={[0.03, 0.04, 0.6, 8]} />
              <meshStandardMaterial color="#3d7a37" roughness={0.8} />
            </mesh>
            <mesh position={[0, 0.66, 0]}>
              <sphereGeometry args={[0.16, 16, 12]} />
              <meshStandardMaterial color={colors[i % 5]} emissive={colors[i % 5]} emissiveIntensity={0.15} roughness={0.5} />
            </mesh>
            <mesh position={[0, 0.66, 0]}>
              <sphereGeometry args={[0.06, 12, 10]} />
              <meshStandardMaterial color="#ffe66d" roughness={0.4} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
