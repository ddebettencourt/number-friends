import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group, Mesh } from 'three';
import * as THREE from 'three';
import { ZONES } from './zoneConfig';
import type { Vector3Tuple } from 'three';

interface ZoneDecorationsProps {
  positions: Vector3Tuple[];
}

// --- Meadow Decorations ---

function BigTree({ position }: { position: [number, number, number] }) {
  const treeRef = useRef<Group>(null);

  useFrame((state) => {
    if (!treeRef.current) return;
    treeRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.5 + position[0]) * 0.02;
  });

  return (
    <group ref={treeRef} position={position}>
      {/* Thick trunk */}
      <mesh position={[0, 1.5, 0]} castShadow>
        <cylinderGeometry args={[0.3, 0.5, 3, 8]} />
        <meshStandardMaterial color="#6B4226" roughness={0.9} />
      </mesh>
      {/* Large foliage layers */}
      <mesh position={[0, 3.5, 0]} castShadow>
        <coneGeometry args={[2, 2.5, 8]} />
        <meshStandardMaterial color="#2d5a27" roughness={0.8} />
      </mesh>
      <mesh position={[0, 4.8, 0]} castShadow>
        <coneGeometry args={[1.5, 2, 8]} />
        <meshStandardMaterial color="#3d7a37" roughness={0.8} />
      </mesh>
      <mesh position={[0, 5.8, 0]} castShadow>
        <coneGeometry args={[0.8, 1.5, 8]} />
        <meshStandardMaterial color="#4d9a47" roughness={0.8} />
      </mesh>
    </group>
  );
}

function FlowerPatch({ position }: { position: [number, number, number] }) {
  const colors = ['#ff6b9d', '#ff9f43', '#ffd93d', '#ee5a24', '#c678dd'];

  return (
    <group position={position}>
      {Array.from({ length: 5 }).map((_, i) => {
        const angle = (i / 5) * Math.PI * 2;
        const r = 0.3 + Math.sin(i * 2) * 0.15;
        const fx = Math.cos(angle) * r;
        const fz = Math.sin(angle) * r;
        const color = colors[i % colors.length];
        return (
          <group key={i} position={[fx, 0, fz]}>
            <mesh position={[0, 0.25, 0]}>
              <cylinderGeometry args={[0.02, 0.03, 0.5, 4]} />
              <meshStandardMaterial color="#3d7a37" roughness={0.8} />
            </mesh>
            <mesh position={[0, 0.55, 0]}>
              <coneGeometry args={[0.15, 0.2, 6]} />
              <meshStandardMaterial color={color} roughness={0.5} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function GrassWall({ position, length = 6 }: { position: [number, number, number]; length?: number }) {
  return (
    <group position={position}>
      {/* Tall grass/hedge wall along the side of the path */}
      <mesh position={[0, 0.6, 0]} castShadow>
        <boxGeometry args={[length, 1.2, 0.8]} />
        <meshStandardMaterial color="#3a6b2a" roughness={0.95} />
      </mesh>
      {/* Round top */}
      <mesh position={[0, 1.2, 0]} castShadow>
        <boxGeometry args={[length, 0.4, 0.6]} />
        <meshStandardMaterial color="#4a8c39" roughness={0.9} />
      </mesh>
    </group>
  );
}

// --- Crystal Caves Decorations ---

function CrystalWall({ position, height = 3, color = '#7b68ee' }: { position: [number, number, number]; height?: number; color?: string }) {
  const ref = useRef<Group>(null);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.children.forEach((child, i) => {
      const mesh = child as Mesh;
      const mat = mesh.material as THREE.MeshStandardMaterial;
      if (mat?.emissiveIntensity !== undefined) {
        mat.emissiveIntensity = 0.4 + Math.sin(state.clock.elapsedTime * 1.5 + i + position[0]) * 0.2;
      }
    });
  });

  return (
    <group ref={ref} position={position}>
      {/* Cluster of tall crystal shards */}
      {Array.from({ length: 4 }).map((_, i) => {
        const ox = (Math.sin(i * 2.5 + position[0]) * 0.5);
        const oz = (Math.cos(i * 3.1 + position[2]) * 0.4);
        const h = height * (0.5 + Math.sin(i * 1.7) * 0.5);
        const tilt = Math.sin(i * 2 + position[0]) * 0.2;
        return (
          <mesh key={i} position={[ox, h / 2, oz]} rotation={[tilt, i * 0.8, tilt * 0.5]} castShadow>
            <octahedronGeometry args={[0.4]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={0.4}
              roughness={0.05}
              metalness={0.7}
              transparent
              opacity={0.85}
            />
          </mesh>
        );
      })}
      {/* Tall central shard */}
      <mesh position={[0, height * 0.6, 0]} rotation={[0.1, 0, 0.05]} scale={[0.4, height * 0.4, 0.4]} castShadow>
        <octahedronGeometry args={[1]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.5}
          roughness={0.02}
          metalness={0.8}
          transparent
          opacity={0.9}
        />
      </mesh>
    </group>
  );
}

function CaveRoof({ position, width = 8 }: { position: [number, number, number]; width?: number }) {
  return (
    <group position={position}>
      {/* Stalactites hanging from above */}
      {Array.from({ length: 6 }).map((_, i) => {
        const sx = (i - 2.5) * (width / 5);
        const sz = Math.sin(i * 3 + position[0]) * 1.5;
        const h = 1 + Math.sin(i * 2.3) * 0.5;
        return (
          <mesh key={i} position={[sx, 0, sz]} rotation={[Math.PI, 0, Math.sin(i) * 0.15]}>
            <coneGeometry args={[0.2 + Math.sin(i) * 0.1, h, 6]} />
            <meshStandardMaterial color="#3a3a5e" roughness={0.7} metalness={0.3} />
          </mesh>
        );
      })}
    </group>
  );
}

// --- Volcanic Decorations ---

function LavaRiver({ position, length = 5 }: { position: [number, number, number]; length?: number }) {
  const ref = useRef<Mesh>(null);

  useFrame((state) => {
    if (!ref.current) return;
    const mat = ref.current.material as THREE.MeshStandardMaterial;
    if (mat.emissiveIntensity !== undefined) {
      mat.emissiveIntensity = 0.6 + Math.sin(state.clock.elapsedTime * 2 + position[0]) * 0.3;
    }
  });

  return (
    <mesh ref={ref} position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[length, 1.2]} />
      <meshStandardMaterial
        color="#ff4500"
        emissive="#ff6a00"
        emissiveIntensity={0.6}
        roughness={0.3}
      />
    </mesh>
  );
}

function VolcanicRock({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position}>
      <mesh castShadow scale={[scale, scale * 1.5, scale]}>
        <dodecahedronGeometry args={[0.8]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.95} />
      </mesh>
      {/* Glowing crack */}
      <mesh position={[0, scale * 0.3, scale * 0.5]} scale={[scale * 0.8, 0.1, 0.1]}>
        <boxGeometry />
        <meshStandardMaterial color="#ff4500" emissive="#ff6a00" emissiveIntensity={0.8} />
      </mesh>
    </group>
  );
}

function SmokePlume({ position }: { position: [number, number, number] }) {
  const ref = useRef<Group>(null);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime + position[0] * 5;
    ref.current.children.forEach((child, i) => {
      const mesh = child as Mesh;
      const phase = (t * 0.4 + i * 0.5) % 4;
      mesh.position.y = phase;
      mesh.scale.setScalar(0.3 + phase * 0.2);
      const mat = mesh.material as THREE.MeshStandardMaterial;
      if (mat.opacity !== undefined) {
        mat.opacity = Math.max(0, 0.35 - phase * 0.08);
      }
    });
  });

  return (
    <group ref={ref} position={position}>
      {Array.from({ length: 4 }).map((_, i) => (
        <mesh key={i}>
          <sphereGeometry args={[0.5, 8, 8]} />
          <meshStandardMaterial color="#555555" transparent opacity={0.3} roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

// --- Sky Islands Decorations ---

function BigCloud({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  const ref = useRef<Group>(null);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.position.x = position[0] + Math.sin(state.clock.elapsedTime * 0.08 + position[2]) * 1.5;
    ref.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.15 + position[0]) * 0.3;
  });

  return (
    <group ref={ref} position={position} scale={scale}>
      <mesh>
        <sphereGeometry args={[1.5, 12, 12]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.75} roughness={1} />
      </mesh>
      <mesh position={[1.2, -0.2, 0]}>
        <sphereGeometry args={[1, 10, 10]} />
        <meshStandardMaterial color="#f5f8ff" transparent opacity={0.7} roughness={1} />
      </mesh>
      <mesh position={[-1, 0.1, 0.5]}>
        <sphereGeometry args={[0.9, 10, 10]} />
        <meshStandardMaterial color="#f5f8ff" transparent opacity={0.65} roughness={1} />
      </mesh>
      <mesh position={[0.5, 0.5, -0.4]}>
        <sphereGeometry args={[0.7, 10, 10]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.6} roughness={1} />
      </mesh>
    </group>
  );
}

function RainbowArc({ position }: { position: [number, number, number] }) {
  const colors = ['#ff0000', '#ff8800', '#ffff00', '#00ff00', '#0088ff', '#8800ff'];
  return (
    <group position={position} rotation={[0, position[0] * 0.5, 0]}>
      {colors.map((color, i) => (
        <mesh key={i}>
          <torusGeometry args={[3 + i * 0.15, 0.06, 8, 32, Math.PI]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} transparent opacity={0.5} />
        </mesh>
      ))}
    </group>
  );
}

// --- Summit Decorations ---

function GoldenPillar({ position, height = 3 }: { position: [number, number, number]; height?: number }) {
  const ref = useRef<Mesh>(null);

  useFrame((state) => {
    if (!ref.current) return;
    const mat = ref.current.material as THREE.MeshStandardMaterial;
    if (mat.emissiveIntensity !== undefined) {
      mat.emissiveIntensity = 0.2 + Math.sin(state.clock.elapsedTime + position[0]) * 0.1;
    }
  });

  return (
    <group position={position}>
      <mesh ref={ref} position={[0, height / 2, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.3, height, 8]} />
        <meshStandardMaterial
          color="#d4aa50"
          emissive="#ffd700"
          emissiveIntensity={0.2}
          roughness={0.1}
          metalness={0.8}
        />
      </mesh>
      {/* Gem on top */}
      <mesh position={[0, height + 0.3, 0]}>
        <octahedronGeometry args={[0.25]} />
        <meshStandardMaterial
          color="#ffd700"
          emissive="#ffd700"
          emissiveIntensity={0.6}
          roughness={0.05}
          metalness={0.9}
        />
      </mesh>
    </group>
  );
}

function LightBeam({ position }: { position: [number, number, number] }) {
  return (
    <mesh position={[position[0], position[1] + 4, position[2]]}>
      <cylinderGeometry args={[0.08, 0.25, 8, 8]} />
      <meshStandardMaterial
        color="#ffeedd"
        emissive="#ffd700"
        emissiveIntensity={0.4}
        transparent
        opacity={0.12}
      />
    </mesh>
  );
}

function FloatingGem({ position }: { position: [number, number, number] }) {
  const ref = useRef<Mesh>(null);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime + position[0] * 3;
    ref.current.position.y = position[1] + Math.sin(t * 1.5) * 0.4;
    ref.current.rotation.y = t * 0.8;
  });

  return (
    <mesh ref={ref} position={position}>
      <icosahedronGeometry args={[0.35]} />
      <meshStandardMaterial
        color="#ffd700"
        emissive="#ffd700"
        emissiveIntensity={0.5}
        roughness={0.05}
        metalness={0.9}
      />
    </mesh>
  );
}

// --- Main Component ---

export function ZoneDecorations({ positions }: ZoneDecorationsProps) {
  const seededRandom = (seed: number) => {
    const x = Math.sin(seed * 127.1) * 43758.5453;
    return x - Math.floor(x);
  };

  return (
    <>
      {ZONES.map((zone, zoneIdx) => {
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
        const centerX = (minX + maxX) / 2;
        const centerZ = (minZ + maxZ) / 2;
        const rangeX = maxX - minX;
        const rangeZ = maxZ - minZ;

        switch (zoneIdx) {
          case 0: // Green Meadow - tall trees and hedges lining the path
            return (
              <group key={zone.name}>
                {/* Trees along both sides of the path */}
                {Array.from({ length: 8 }).map((_, i) => {
                  const side = i % 2 === 0 ? 1 : -1;
                  const tx = centerX + (seededRandom(i * 3 + 1) - 0.5) * rangeX;
                  const tz = centerZ + side * (rangeZ * 0.5 + 2 + seededRandom(i * 3 + 2) * 2);
                  return <BigTree key={`tree-${i}`} position={[tx, avgY, tz]} />;
                })}
                {/* Hedge walls along path edges */}
                {Array.from({ length: 3 }).map((_, i) => {
                  const hx = minX + (i + 0.5) * (rangeX / 3);
                  return (
                    <group key={`hedge-${i}`}>
                      <GrassWall position={[hx, avgY, centerZ + rangeZ * 0.5 + 1.5]} length={rangeX / 3} />
                      <GrassWall position={[hx, avgY, centerZ - rangeZ * 0.5 - 1.5]} length={rangeX / 3} />
                    </group>
                  );
                })}
                {/* Flower patches near the path */}
                {Array.from({ length: 8 }).map((_, i) => {
                  const fx = centerX + (seededRandom(i * 3 + 10) - 0.5) * rangeX;
                  const side = i % 2 === 0 ? 1 : -1;
                  const fz = centerZ + side * (rangeZ * 0.3 + seededRandom(i * 3 + 11) * 1.5);
                  return <FlowerPatch key={`flower-${i}`} position={[fx, avgY, fz]} />;
                })}
              </group>
            );

          case 1: // Crystal Caves - towering crystal walls on both sides
            return (
              <group key={zone.name}>
                {/* Crystal walls lining the path */}
                {Array.from({ length: 8 }).map((_, i) => {
                  const side = i % 2 === 0 ? 1 : -1;
                  const cx = centerX + (seededRandom(i * 4 + 30) - 0.5) * rangeX;
                  const cz = centerZ + side * (rangeZ * 0.4 + 1.5 + seededRandom(i * 4 + 31) * 1.5);
                  const colors = ['#7b68ee', '#9370db', '#6a5acd', '#8a2be2'];
                  const color = colors[i % colors.length];
                  const h = 2 + seededRandom(i * 4 + 32) * 3;
                  return <CrystalWall key={`crystal-${i}`} position={[cx, avgY, cz]} height={h} color={color} />;
                })}
                {/* Cave roof stalactites above */}
                {Array.from({ length: 3 }).map((_, i) => {
                  const rx = minX + (i + 0.5) * (rangeX / 3);
                  return <CaveRoof key={`roof-${i}`} position={[rx, avgY + 5, centerZ]} width={rangeX / 3} />;
                })}
              </group>
            );

          case 2: // Volcanic Ridge - lava rivers, volcanic rocks, smoke
            return (
              <group key={zone.name}>
                {/* Lava rivers running alongside the path */}
                {Array.from({ length: 3 }).map((_, i) => {
                  const lx = minX + (i + 0.5) * (rangeX / 3);
                  const side = i % 2 === 0 ? 1 : -1;
                  const lz = centerZ + side * (rangeZ * 0.4 + 1);
                  return <LavaRiver key={`lava-${i}`} position={[lx, avgY - 0.2, lz]} length={rangeX / 3} />;
                })}
                {/* Large volcanic rocks */}
                {Array.from({ length: 6 }).map((_, i) => {
                  const side = i % 2 === 0 ? 1 : -1;
                  const rx = centerX + (seededRandom(i * 5 + 70) - 0.5) * rangeX;
                  const rz = centerZ + side * (rangeZ * 0.5 + 1.5 + seededRandom(i * 5 + 71) * 2);
                  const s = 1 + seededRandom(i * 5 + 72) * 1.5;
                  return <VolcanicRock key={`rock-${i}`} position={[rx, avgY, rz]} scale={s} />;
                })}
                {/* Smoke plumes */}
                {Array.from({ length: 4 }).map((_, i) => {
                  const sx = centerX + (seededRandom(i * 4 + 80) - 0.5) * rangeX * 0.8;
                  const sz = centerZ + (seededRandom(i * 4 + 81) - 0.5) * rangeZ;
                  return <SmokePlume key={`smoke-${i}`} position={[sx, avgY, sz]} />;
                })}
              </group>
            );

          case 3: // Sky Islands - big clouds all around and below, rainbow
            return (
              <group key={zone.name}>
                {/* Large clouds surrounding and below */}
                {Array.from({ length: 10 }).map((_, i) => {
                  const cx = centerX + (seededRandom(i * 3 + 90) - 0.5) * (rangeX + 10);
                  const cz = centerZ + (seededRandom(i * 3 + 91) - 0.5) * (rangeZ + 8);
                  const cy = avgY - 3 + seededRandom(i * 3 + 92) * 4;
                  const s = 0.8 + seededRandom(i * 3 + 93) * 1.2;
                  return <BigCloud key={`cloud-${i}`} position={[cx, cy, cz]} scale={s} />;
                })}
                {/* Rainbow arc in the distance */}
                <RainbowArc position={[centerX + 3, avgY + 2, centerZ - 4]} />
              </group>
            );

          case 4: // The Summit - golden pillars, light beams, floating gems
            return (
              <group key={zone.name}>
                {/* Golden pillars lining the path */}
                {Array.from({ length: 6 }).map((_, i) => {
                  const side = i % 2 === 0 ? 1 : -1;
                  const px = centerX + (seededRandom(i * 4 + 110) - 0.5) * rangeX;
                  const pz = centerZ + side * (rangeZ * 0.4 + 1.5);
                  const h = 2.5 + seededRandom(i * 4 + 112) * 2;
                  return <GoldenPillar key={`pillar-${i}`} position={[px, avgY, pz]} height={h} />;
                })}
                {/* Light beams */}
                {Array.from({ length: 4 }).map((_, i) => {
                  const bx = centerX + (seededRandom(i * 5 + 120) - 0.5) * rangeX;
                  const bz = centerZ + (seededRandom(i * 5 + 121) - 0.5) * rangeZ;
                  return <LightBeam key={`beam-${i}`} position={[bx, avgY, bz]} />;
                })}
                {/* Floating gems */}
                {Array.from({ length: 6 }).map((_, i) => {
                  const gx = centerX + (seededRandom(i * 4 + 130) - 0.5) * (rangeX + 2);
                  const gz = centerZ + (seededRandom(i * 4 + 131) - 0.5) * (rangeZ + 2);
                  const gy = avgY + 1 + seededRandom(i * 4 + 132) * 2;
                  return <FloatingGem key={`gem-${i}`} position={[gx, gy, gz]} />;
                })}
              </group>
            );

          default:
            return null;
        }
      })}
    </>
  );
}
