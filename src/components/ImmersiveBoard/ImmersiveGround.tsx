import { useMemo } from 'react';
import type { Vector3Tuple } from 'three';
import { ZONES } from '../Board3D/zoneConfig';

interface ImmersiveGroundProps {
  positions: Vector3Tuple[];
  activeZone: number;
}

function getZoneBounds(positions: Vector3Tuple[], startSquare: number, endSquare: number) {
  const startIdx = startSquare - 1;
  const endIdx = Math.min(endSquare, positions.length);
  const zonePos = positions.slice(startIdx, endIdx);

  if (zonePos.length === 0) return null;

  let minX = Infinity, maxX = -Infinity;
  let minZ = Infinity, maxZ = -Infinity;
  let minY = Infinity;

  for (const [x, y, z] of zonePos) {
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minZ = Math.min(minZ, z);
    maxZ = Math.max(maxZ, z);
    minY = Math.min(minY, y);
  }

  return { minX, maxX, minZ, maxZ, minY, positions: zonePos };
}

function MeadowGround({ bounds }: { bounds: ReturnType<typeof getZoneBounds> }) {
  if (!bounds) return null;
  const width = (bounds.maxX - bounds.minX) + 40;
  const depth = (bounds.maxZ - bounds.minZ) + 30;
  const cx = (bounds.minX + bounds.maxX) / 2;
  const cz = (bounds.minZ + bounds.maxZ) / 2;

  return (
    <mesh position={[cx, bounds.minY - 0.4, cz]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[width, depth]} />
      <meshStandardMaterial color="#4a7c59" roughness={0.9} metalness={0.05} />
    </mesh>
  );
}

function CavesGround({ bounds }: { bounds: ReturnType<typeof getZoneBounds> }) {
  if (!bounds) return null;
  const width = (bounds.maxX - bounds.minX) + 40;
  const depth = (bounds.maxZ - bounds.minZ) + 30;
  const cx = (bounds.minX + bounds.maxX) / 2;
  const cz = (bounds.minZ + bounds.maxZ) / 2;

  return (
    <group>
      {/* Floor */}
      <mesh position={[cx, bounds.minY - 0.4, cz]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color="#2a2a3e" roughness={0.85} metalness={0.1} />
      </mesh>
      {/* Cave ceiling */}
      <mesh position={[cx, bounds.minY + 8, cz]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color="#1a1a2e" roughness={0.95} metalness={0.05} />
      </mesh>
    </group>
  );
}

function VolcanicGround({ bounds }: { bounds: ReturnType<typeof getZoneBounds> }) {
  if (!bounds) return null;
  const width = (bounds.maxX - bounds.minX) + 40;
  const depth = (bounds.maxZ - bounds.minZ) + 30;
  const cx = (bounds.minX + bounds.maxX) / 2;
  const cz = (bounds.minZ + bounds.maxZ) / 2;

  // Seeded random for lava patches
  const seeded = (seed: number) => {
    const x = Math.sin(seed * 127.1) * 43758.5453;
    return x - Math.floor(x);
  };

  return (
    <group>
      <mesh position={[cx, bounds.minY - 0.4, cz]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.95} metalness={0.1} />
      </mesh>
      {/* Lava patches */}
      {Array.from({ length: 12 }).map((_, i) => {
        const lx = cx + (seeded(i * 7 + 1) - 0.5) * width * 0.7;
        const lz = cz + (seeded(i * 7 + 2) - 0.5) * depth * 0.7;
        const lr = 1 + seeded(i * 7 + 3) * 2;
        return (
          <mesh key={i} position={[lx, bounds.minY - 0.35, lz]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[lr, 16]} />
            <meshStandardMaterial
              color="#ff4500"
              emissive="#ff6a00"
              emissiveIntensity={0.5}
              roughness={0.3}
            />
          </mesh>
        );
      })}
    </group>
  );
}

function SkyIslandsGround({ bounds }: { bounds: ReturnType<typeof getZoneBounds> }) {
  if (!bounds) return null;

  // Individual cloud platforms under groups of tiles
  return (
    <group>
      {bounds.positions.map((pos, i) => {
        if (i % 3 !== 0) return null; // Platform every 3 tiles
        return (
          <group key={i} position={[pos[0], pos[1] - 1.2, pos[2]]}>
            <mesh>
              <sphereGeometry args={[2.5, 12, 12]} />
              <meshStandardMaterial color="#ffffff" transparent opacity={0.6} roughness={1} />
            </mesh>
            <mesh position={[1.5, -0.3, 0.5]}>
              <sphereGeometry args={[1.8, 10, 10]} />
              <meshStandardMaterial color="#f0f5ff" transparent opacity={0.5} roughness={1} />
            </mesh>
            <mesh position={[-1.2, 0.2, -0.3]}>
              <sphereGeometry args={[1.5, 10, 10]} />
              <meshStandardMaterial color="#f5f8ff" transparent opacity={0.5} roughness={1} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function SummitGround({ bounds }: { bounds: ReturnType<typeof getZoneBounds> }) {
  if (!bounds) return null;
  const width = (bounds.maxX - bounds.minX) + 40;
  const depth = (bounds.maxZ - bounds.minZ) + 30;
  const cx = (bounds.minX + bounds.maxX) / 2;
  const cz = (bounds.minZ + bounds.maxZ) / 2;

  return (
    <mesh position={[cx, bounds.minY - 0.4, cz]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[width, depth]} />
      <meshStandardMaterial
        color="#c8a84e"
        emissive="#ffd700"
        emissiveIntensity={0.08}
        roughness={0.2}
        metalness={0.5}
      />
    </mesh>
  );
}

export function ImmersiveGround({ positions, activeZone }: ImmersiveGroundProps) {
  const zoneBounds = useMemo(() => {
    return ZONES.map((zone) =>
      getZoneBounds(positions, zone.startSquare, zone.endSquare)
    );
  }, [positions]);

  const GroundComponents = [
    MeadowGround,
    CavesGround,
    VolcanicGround,
    SkyIslandsGround,
    SummitGround,
  ];

  return (
    <>
      {ZONES.map((_, idx) => {
        // Only render current zone +/- 1
        if (Math.abs(idx - activeZone) > 1) return null;

        const bounds = zoneBounds[idx];
        if (!bounds) return null;

        const GroundComponent = GroundComponents[idx];
        return <GroundComponent key={idx} bounds={bounds} />;
      })}
    </>
  );
}
