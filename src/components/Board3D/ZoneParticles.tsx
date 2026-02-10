import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Mesh } from 'three';
import { ZONES } from './zoneConfig';
import type { Vector3Tuple } from 'three';

interface ZoneParticlesProps {
  positions: Vector3Tuple[];
}

// Individual animated particle
function Particle({
  position,
  color,
  size = 0.04,
  emissive = false,
  speed = 1,
  axis = 'y' as 'x' | 'y' | 'z',
  range = 1,
  fadeRange = 0,
}: {
  position: [number, number, number];
  color: string;
  size?: number;
  emissive?: boolean;
  speed?: number;
  axis?: 'x' | 'y' | 'z';
  range?: number;
  fadeRange?: number;
}) {
  const ref = useRef<Mesh>(null);
  const seed = position[0] * 17 + position[2] * 31;

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime * speed + seed;

    if (axis === 'y') {
      ref.current.position.y = position[1] + (t % range);
    } else if (axis === 'x') {
      ref.current.position.x = position[0] + Math.sin(t) * range;
    }

    // Fade effect
    if (fadeRange > 0) {
      const mat = ref.current.material as THREE.MeshStandardMaterial;
      if (mat.opacity !== undefined) {
        const cycle = (t % fadeRange) / fadeRange;
        mat.opacity = Math.sin(cycle * Math.PI) * 0.6;
      }
    }
  });

  return (
    <mesh ref={ref} position={position}>
      <sphereGeometry args={[size, 6, 6]} />
      <meshStandardMaterial
        color={color}
        emissive={emissive ? color : '#000000'}
        emissiveIntensity={emissive ? 0.5 : 0}
        transparent
        opacity={0.6}
        roughness={1}
      />
    </mesh>
  );
}

// Wind streak for Sky Islands
function WindStreak({ position, speed = 1 }: { position: [number, number, number]; speed?: number }) {
  const ref = useRef<Mesh>(null);
  const seed = position[0] * 23 + position[2] * 41;

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime * speed + seed;
    ref.current.position.x = position[0] + ((t * 2) % 8) - 4;
    const mat = ref.current.material as THREE.MeshStandardMaterial;
    if (mat.opacity !== undefined) {
      const progress = ((t * 2) % 8) / 8;
      mat.opacity = Math.sin(progress * Math.PI) * 0.3;
    }
  });

  return (
    <mesh ref={ref} position={position} rotation={[0, 0, Math.PI / 2]}>
      <cylinderGeometry args={[0.01, 0.01, 0.8, 4]} />
      <meshStandardMaterial color="#ffffff" transparent opacity={0.2} roughness={1} />
    </mesh>
  );
}

// Orbiting sparkle for Summit
function OrbitSparkle({ center, radius, speed, offset }: { center: [number, number, number]; radius: number; speed: number; offset: number }) {
  const ref = useRef<Mesh>(null);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime * speed + offset;
    ref.current.position.x = center[0] + Math.cos(t) * radius;
    ref.current.position.y = center[1] + Math.sin(t * 1.5) * 0.3;
    ref.current.position.z = center[2] + Math.sin(t) * radius;
  });

  return (
    <mesh ref={ref} position={center}>
      <sphereGeometry args={[0.04, 6, 6]} />
      <meshStandardMaterial
        color="#ffd700"
        emissive="#ffd700"
        emissiveIntensity={0.8}
        roughness={0.1}
      />
    </mesh>
  );
}

import * as THREE from 'three';

export function ZoneParticles({ positions }: ZoneParticlesProps) {
  const seededRandom = (seed: number) => {
    const x = Math.sin(seed * 127.1) * 43758.5453;
    return x - Math.floor(x);
  };

  // Pre-calculate zone bounds once
  const zoneBounds = useMemo(() => {
    return ZONES.map((zone) => {
      const startIdx = zone.startSquare - 1;
      const endIdx = Math.min(zone.endSquare, positions.length);
      const zonePositions = positions.slice(startIdx, endIdx);

      if (zonePositions.length === 0) return null;

      let minX = Infinity, maxX = -Infinity;
      let minZ = Infinity, maxZ = -Infinity;
      let avgY = 0;
      for (const [x, y, z] of zonePositions) {
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minZ = Math.min(minZ, z);
        maxZ = Math.max(maxZ, z);
        avgY += y;
      }
      avgY /= zonePositions.length;

      return {
        centerX: (minX + maxX) / 2,
        centerZ: (minZ + maxZ) / 2,
        avgY,
        rangeX: maxX - minX,
        rangeZ: maxZ - minZ,
      };
    });
  }, [positions]);

  return (
    <>
      {ZONES.map((zone, zoneIdx) => {
        const bounds = zoneBounds[zoneIdx];
        if (!bounds) return null;
        const { centerX, centerZ, avgY, rangeX, rangeZ } = bounds;

        switch (zoneIdx) {
          case 0: // Meadow - floating pollen
            return (
              <group key={zone.name}>
                {Array.from({ length: 20 }).map((_, i) => (
                  <Particle
                    key={`pollen-${i}`}
                    position={[
                      centerX + (seededRandom(i * 3 + 200) - 0.5) * rangeX,
                      avgY + 0.3 + seededRandom(i * 3 + 201) * 0.5,
                      centerZ + (seededRandom(i * 3 + 202) - 0.5) * rangeZ,
                    ]}
                    color="#ffd93d"
                    size={0.03}
                    speed={0.3}
                    range={2}
                    emissive
                  />
                ))}
              </group>
            );

          case 1: // Crystal Caves - sparkle motes
            return (
              <group key={zone.name}>
                {Array.from({ length: 20 }).map((_, i) => (
                  <Particle
                    key={`mote-${i}`}
                    position={[
                      centerX + (seededRandom(i * 3 + 210) - 0.5) * rangeX,
                      avgY + seededRandom(i * 3 + 211) * 2,
                      centerZ + (seededRandom(i * 3 + 212) - 0.5) * rangeZ,
                    ]}
                    color="#e0e0ff"
                    size={0.03}
                    emissive
                    speed={0.5}
                    range={1}
                    fadeRange={3}
                  />
                ))}
              </group>
            );

          case 2: // Volcanic Ridge - ember particles
            return (
              <group key={zone.name}>
                {Array.from({ length: 18 }).map((_, i) => (
                  <Particle
                    key={`ember-${i}`}
                    position={[
                      centerX + (seededRandom(i * 3 + 220) - 0.5) * rangeX,
                      avgY + 0.2,
                      centerZ + (seededRandom(i * 3 + 222) - 0.5) * rangeZ,
                    ]}
                    color="#ff6a00"
                    size={0.04}
                    emissive
                    speed={0.6}
                    range={3}
                    fadeRange={4}
                  />
                ))}
              </group>
            );

          case 3: // Sky Islands - wind streaks
            return (
              <group key={zone.name}>
                {Array.from({ length: 15 }).map((_, i) => (
                  <WindStreak
                    key={`wind-${i}`}
                    position={[
                      centerX + (seededRandom(i * 3 + 230) - 0.5) * (rangeX + 4),
                      avgY - 1 + seededRandom(i * 3 + 231) * 3,
                      centerZ + (seededRandom(i * 3 + 232) - 0.5) * rangeZ,
                    ]}
                    speed={0.5 + seededRandom(i * 3 + 233) * 0.5}
                  />
                ))}
              </group>
            );

          case 4: // Summit - gold sparkles orbiting
            return (
              <group key={zone.name}>
                {Array.from({ length: 20 }).map((_, i) => (
                  <OrbitSparkle
                    key={`sparkle-${i}`}
                    center={[
                      centerX + (seededRandom(i * 4 + 240) - 0.5) * rangeX,
                      avgY + 0.5 + seededRandom(i * 4 + 241) * 1.5,
                      centerZ + (seededRandom(i * 4 + 242) - 0.5) * rangeZ,
                    ]}
                    radius={0.3 + seededRandom(i * 4 + 243) * 0.5}
                    speed={0.8 + seededRandom(i * 4 + 244) * 0.8}
                    offset={i * 1.5}
                  />
                ))}
              </group>
            );

          default:
            return null;
        }
      })}
    </>
  );
}
