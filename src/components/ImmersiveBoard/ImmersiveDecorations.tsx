import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Group, Mesh } from 'three';
import type { Vector3Tuple } from 'three';
import { ZONES } from '../Board3D/zoneConfig';

interface ImmersiveDecorationsProps {
  positions: Vector3Tuple[];
  activeZone: number;
}

const seededRandom = (seed: number) => {
  const x = Math.sin(seed * 127.1) * 43758.5453;
  return x - Math.floor(x);
};

// --- Meadow ---

function MeadowTree({ position }: { position: [number, number, number] }) {
  const treeRef = useRef<Group>(null);

  useFrame((state) => {
    if (!treeRef.current) return;
    treeRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.4 + position[0]) * 0.02;
  });

  return (
    <group ref={treeRef} position={position}>
      <mesh position={[0, 2, 0]} castShadow>
        <cylinderGeometry args={[0.4, 0.6, 4, 8]} />
        <meshStandardMaterial color="#6B4226" roughness={0.9} />
      </mesh>
      <mesh position={[0, 4.5, 0]} castShadow>
        <coneGeometry args={[2.5, 3, 8]} />
        <meshStandardMaterial color="#2d5a27" roughness={0.8} />
      </mesh>
      <mesh position={[0, 6, 0]} castShadow>
        <coneGeometry args={[1.8, 2.5, 8]} />
        <meshStandardMaterial color="#3d7a37" roughness={0.8} />
      </mesh>
      <mesh position={[0, 7.2, 0]} castShadow>
        <coneGeometry args={[1, 2, 8]} />
        <meshStandardMaterial color="#4d9a47" roughness={0.8} />
      </mesh>
    </group>
  );
}

function HedgeWall({ position, length = 8 }: { position: [number, number, number]; length?: number }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.8, 0]} castShadow>
        <boxGeometry args={[length, 1.6, 1]} />
        <meshStandardMaterial color="#3a6b2a" roughness={0.95} />
      </mesh>
      <mesh position={[0, 1.6, 0]} castShadow>
        <boxGeometry args={[length, 0.5, 0.8]} />
        <meshStandardMaterial color="#4a8c39" roughness={0.9} />
      </mesh>
    </group>
  );
}

function FlowerPatch({ position }: { position: [number, number, number] }) {
  const colors = ['#ff6b9d', '#ff9f43', '#ffd93d', '#ee5a24', '#c678dd'];
  return (
    <group position={position}>
      {Array.from({ length: 6 }).map((_, i) => {
        const angle = (i / 6) * Math.PI * 2;
        const r = 0.4 + Math.sin(i * 2) * 0.2;
        return (
          <group key={i} position={[Math.cos(angle) * r, 0, Math.sin(angle) * r]}>
            <mesh position={[0, 0.3, 0]}>
              <cylinderGeometry args={[0.03, 0.04, 0.6, 4]} />
              <meshStandardMaterial color="#3d7a37" roughness={0.8} />
            </mesh>
            <mesh position={[0, 0.65, 0]}>
              <coneGeometry args={[0.18, 0.25, 6]} />
              <meshStandardMaterial color={colors[i % 5]} roughness={0.5} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

// --- Crystal Caves ---

function CrystalCluster({ position, height = 3, color = '#7b68ee' }: { position: [number, number, number]; height?: number; color?: string }) {
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
      {Array.from({ length: 5 }).map((_, i) => {
        const ox = Math.sin(i * 2.5 + position[0]) * 0.6;
        const oz = Math.cos(i * 3.1 + position[2]) * 0.5;
        const h = height * (0.4 + Math.sin(i * 1.7) * 0.5);
        return (
          <mesh key={i} position={[ox, h / 2, oz]} rotation={[Math.sin(i) * 0.2, i * 0.8, Math.cos(i) * 0.15]}>
            <octahedronGeometry args={[0.5]} />
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
      <mesh position={[0, height * 0.7, 0]} rotation={[0.1, 0, 0.05]} scale={[0.5, height * 0.4, 0.5]} castShadow>
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

function Stalactites({ position, width = 10 }: { position: [number, number, number]; width?: number }) {
  return (
    <group position={position}>
      {Array.from({ length: 8 }).map((_, i) => {
        const sx = (i - 3.5) * (width / 7);
        const sz = Math.sin(i * 3 + position[0]) * 2;
        const h = 1.5 + Math.sin(i * 2.3) * 0.7;
        return (
          <mesh key={i} position={[sx, 0, sz]} rotation={[Math.PI, 0, Math.sin(i) * 0.15]}>
            <coneGeometry args={[0.25 + Math.sin(i) * 0.12, h, 6]} />
            <meshStandardMaterial color="#3a3a5e" roughness={0.7} metalness={0.3} />
          </mesh>
        );
      })}
    </group>
  );
}

// --- Volcanic ---

function LavaRiver({ position, length = 8 }: { position: [number, number, number]; length?: number }) {
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
      <planeGeometry args={[length, 1.8]} />
      <meshStandardMaterial color="#ff4500" emissive="#ff6a00" emissiveIntensity={0.6} roughness={0.3} />
    </mesh>
  );
}

function VolcanicRock({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position}>
      <mesh castShadow scale={[scale, scale * 1.5, scale]}>
        <dodecahedronGeometry args={[1]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.95} />
      </mesh>
      <mesh position={[0, scale * 0.4, scale * 0.6]} scale={[scale, 0.12, 0.12]}>
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
      const phase = (t * 0.4 + i * 0.5) % 5;
      mesh.position.y = phase;
      mesh.scale.setScalar(0.4 + phase * 0.25);
      const mat = mesh.material as THREE.MeshStandardMaterial;
      if (mat.opacity !== undefined) {
        mat.opacity = Math.max(0, 0.35 - phase * 0.07);
      }
    });
  });

  return (
    <group ref={ref} position={position}>
      {Array.from({ length: 5 }).map((_, i) => (
        <mesh key={i}>
          <sphereGeometry args={[0.6, 8, 8]} />
          <meshStandardMaterial color="#555555" transparent opacity={0.3} roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

// --- Sky Islands ---

function BigCloud({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  const ref = useRef<Group>(null);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.position.x = position[0] + Math.sin(state.clock.elapsedTime * 0.06 + position[2]) * 2;
    ref.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.12 + position[0]) * 0.4;
  });

  return (
    <group ref={ref} position={position} scale={scale}>
      <mesh>
        <sphereGeometry args={[2, 12, 12]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.7} roughness={1} />
      </mesh>
      <mesh position={[1.5, -0.2, 0]}>
        <sphereGeometry args={[1.3, 10, 10]} />
        <meshStandardMaterial color="#f5f8ff" transparent opacity={0.65} roughness={1} />
      </mesh>
      <mesh position={[-1.2, 0.1, 0.5]}>
        <sphereGeometry args={[1.1, 10, 10]} />
        <meshStandardMaterial color="#f5f8ff" transparent opacity={0.6} roughness={1} />
      </mesh>
    </group>
  );
}

function RainbowArc({ position }: { position: [number, number, number] }) {
  const colors = ['#ff0000', '#ff8800', '#ffff00', '#00ff00', '#0088ff', '#8800ff'];
  return (
    <group position={position} rotation={[0, position[0] * 0.3, 0]}>
      {colors.map((color, i) => (
        <mesh key={i}>
          <torusGeometry args={[4 + i * 0.2, 0.08, 8, 32, Math.PI]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} transparent opacity={0.5} />
        </mesh>
      ))}
    </group>
  );
}

// --- Summit ---

function GoldenPillar({ position, height = 4 }: { position: [number, number, number]; height?: number }) {
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
        <cylinderGeometry args={[0.25, 0.35, height, 8]} />
        <meshStandardMaterial
          color="#d4aa50"
          emissive="#ffd700"
          emissiveIntensity={0.2}
          roughness={0.1}
          metalness={0.8}
        />
      </mesh>
      <mesh position={[0, height + 0.4, 0]}>
        <octahedronGeometry args={[0.3]} />
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
    <mesh position={[position[0], position[1] + 5, position[2]]}>
      <cylinderGeometry args={[0.1, 0.3, 10, 8]} />
      <meshStandardMaterial
        color="#ffeedd"
        emissive="#ffd700"
        emissiveIntensity={0.4}
        transparent
        opacity={0.1}
      />
    </mesh>
  );
}

function FloatingGem({ position }: { position: [number, number, number] }) {
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
      const rangeX = maxX - minX;
      const rangeZ = maxZ - minZ;

      return { minX, maxX, minZ, maxZ, avgY, centerX, centerZ, rangeX, rangeZ };
    });
  }, [positions]);

  return (
    <>
      {ZONES.map((zone, zoneIdx) => {
        // Only render current zone +/- 1
        if (Math.abs(zoneIdx - activeZone) > 1) return null;

        const data = zoneData[zoneIdx];
        if (!data) return null;

        const { centerX, centerZ, avgY, rangeX, rangeZ } = data;

        switch (zoneIdx) {
          case 0: // Meadow
            return (
              <group key={zone.name}>
                {Array.from({ length: 20 }).map((_, i) => {
                  const side = i % 2 === 0 ? 1 : -1;
                  const tx = centerX + (seededRandom(i * 3 + 1) - 0.5) * rangeX * 1.2;
                  const tz = centerZ + side * (rangeZ * 0.5 + 3 + seededRandom(i * 3 + 2) * 4);
                  return <MeadowTree key={`tree-${i}`} position={[tx, avgY, tz]} />;
                })}
                {Array.from({ length: 4 }).map((_, i) => {
                  const hx = data.minX + (i + 0.5) * (rangeX / 4);
                  return (
                    <group key={`hedge-${i}`}>
                      <HedgeWall position={[hx, avgY, centerZ + rangeZ * 0.5 + 2]} length={rangeX / 4} />
                      <HedgeWall position={[hx, avgY, centerZ - rangeZ * 0.5 - 2]} length={rangeX / 4} />
                    </group>
                  );
                })}
                {Array.from({ length: 12 }).map((_, i) => {
                  const fx = centerX + (seededRandom(i * 3 + 10) - 0.5) * rangeX;
                  const side = i % 2 === 0 ? 1 : -1;
                  const fz = centerZ + side * (rangeZ * 0.3 + seededRandom(i * 3 + 11) * 2);
                  return <FlowerPatch key={`flower-${i}`} position={[fx, avgY, fz]} />;
                })}
              </group>
            );

          case 1: // Crystal Caves
            return (
              <group key={zone.name}>
                {Array.from({ length: 20 }).map((_, i) => {
                  const side = i % 2 === 0 ? 1 : -1;
                  const cx = centerX + (seededRandom(i * 4 + 30) - 0.5) * rangeX * 1.2;
                  const cz = centerZ + side * (rangeZ * 0.4 + 2 + seededRandom(i * 4 + 31) * 2);
                  const colors = ['#7b68ee', '#9370db', '#6a5acd', '#8a2be2'];
                  const color = colors[i % colors.length];
                  const h = 2.5 + seededRandom(i * 4 + 32) * 4;
                  return <CrystalCluster key={`crystal-${i}`} position={[cx, avgY, cz]} height={h} color={color} />;
                })}
                {Array.from({ length: 4 }).map((_, i) => {
                  const rx = data.minX + (i + 0.5) * (rangeX / 4);
                  return <Stalactites key={`roof-${i}`} position={[rx, avgY + 7, centerZ]} width={rangeX / 4} />;
                })}
              </group>
            );

          case 2: // Volcanic
            return (
              <group key={zone.name}>
                {Array.from({ length: 3 }).map((_, i) => {
                  const lx = data.minX + (i + 0.5) * (rangeX / 3);
                  const side = i % 2 === 0 ? 1 : -1;
                  const lz = centerZ + side * (rangeZ * 0.4 + 1.5);
                  return <LavaRiver key={`lava-${i}`} position={[lx, avgY - 0.2, lz]} length={rangeX / 3} />;
                })}
                {Array.from({ length: 12 }).map((_, i) => {
                  const side = i % 2 === 0 ? 1 : -1;
                  const rx = centerX + (seededRandom(i * 5 + 70) - 0.5) * rangeX * 1.1;
                  const rz = centerZ + side * (rangeZ * 0.5 + 2 + seededRandom(i * 5 + 71) * 3);
                  const s = 1.2 + seededRandom(i * 5 + 72) * 2;
                  return <VolcanicRock key={`rock-${i}`} position={[rx, avgY, rz]} scale={s} />;
                })}
                {Array.from({ length: 5 }).map((_, i) => {
                  const sx = centerX + (seededRandom(i * 4 + 80) - 0.5) * rangeX * 0.8;
                  const sz = centerZ + (seededRandom(i * 4 + 81) - 0.5) * rangeZ;
                  return <SmokePlume key={`smoke-${i}`} position={[sx, avgY, sz]} />;
                })}
              </group>
            );

          case 3: // Sky Islands
            return (
              <group key={zone.name}>
                {Array.from({ length: 12 }).map((_, i) => {
                  const cx = centerX + (seededRandom(i * 3 + 90) - 0.5) * (rangeX + 15);
                  const cz = centerZ + (seededRandom(i * 3 + 91) - 0.5) * (rangeZ + 12);
                  const cy = avgY - 4 + seededRandom(i * 3 + 92) * 6;
                  const s = 1 + seededRandom(i * 3 + 93) * 1.5;
                  return <BigCloud key={`cloud-${i}`} position={[cx, cy, cz]} scale={s} />;
                })}
                <RainbowArc position={[centerX + 4, avgY + 3, centerZ - 6]} />
              </group>
            );

          case 4: // Summit
            return (
              <group key={zone.name}>
                {Array.from({ length: 8 }).map((_, i) => {
                  const side = i % 2 === 0 ? 1 : -1;
                  const px = centerX + (seededRandom(i * 4 + 110) - 0.5) * rangeX * 1.1;
                  const pz = centerZ + side * (rangeZ * 0.4 + 2);
                  const h = 3 + seededRandom(i * 4 + 112) * 3;
                  return <GoldenPillar key={`pillar-${i}`} position={[px, avgY, pz]} height={h} />;
                })}
                {Array.from({ length: 5 }).map((_, i) => {
                  const bx = centerX + (seededRandom(i * 5 + 120) - 0.5) * rangeX;
                  const bz = centerZ + (seededRandom(i * 5 + 121) - 0.5) * rangeZ;
                  return <LightBeam key={`beam-${i}`} position={[bx, avgY, bz]} />;
                })}
                {Array.from({ length: 8 }).map((_, i) => {
                  const gx = centerX + (seededRandom(i * 4 + 130) - 0.5) * (rangeX + 4);
                  const gz = centerZ + (seededRandom(i * 4 + 131) - 0.5) * (rangeZ + 4);
                  const gy = avgY + 1.5 + seededRandom(i * 4 + 132) * 3;
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
