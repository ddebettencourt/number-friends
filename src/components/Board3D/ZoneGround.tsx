import { useMemo } from 'react';
import { ZONES } from './zoneConfig';
import type { Vector3Tuple } from 'three';

interface ZoneGroundProps {
  positions: Vector3Tuple[];
}

export function ZoneGround({ positions }: ZoneGroundProps) {
  const zoneGrounds = useMemo(() => {
    return ZONES.map((zone, zoneIdx) => {
      const startIdx = zone.startSquare - 1;
      const endIdx = Math.min(zone.endSquare, positions.length);
      const zonePositions = positions.slice(startIdx, endIdx);

      if (zonePositions.length === 0) return null;

      let minX = Infinity, maxX = -Infinity;
      let minY = Infinity, maxY = -Infinity;
      let minZ = Infinity, maxZ = -Infinity;

      for (const [x, y, z] of zonePositions) {
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
        minZ = Math.min(minZ, z);
        maxZ = Math.max(maxZ, z);
      }

      const centerX = (minX + maxX) / 2;
      const centerZ = (minZ + maxZ) / 2;
      const avgY = (minY + maxY) / 2;
      // Much wider ground planes for immersion - extend far beyond the path
      const width = maxX - minX + 16;
      const depth = maxZ - minZ + 12;

      return {
        zone,
        zoneIdx,
        centerX,
        centerZ,
        avgY,
        width,
        depth,
        positions: zonePositions,
      };
    }).filter(Boolean) as {
      zone: typeof ZONES[0];
      zoneIdx: number;
      centerX: number;
      centerZ: number;
      avgY: number;
      width: number;
      depth: number;
      positions: Vector3Tuple[];
    }[];
  }, [positions]);

  return (
    <>
      {zoneGrounds.map(({ zone, zoneIdx, centerX, centerZ, avgY, width, depth, positions: zonePos }) => {
        // Sky Islands: floating cloud platforms under each tile
        if (zoneIdx === 3) {
          return (
            <group key={zone.name}>
              {zonePos.map(([x, y, z], i) => (
                <group key={i} position={[x, y - 0.8, z]}>
                  <mesh>
                    <sphereGeometry args={[0.7, 12, 12]} />
                    <meshStandardMaterial color="#ffffff" transparent opacity={0.7} roughness={1} />
                  </mesh>
                  <mesh position={[0.4, -0.1, 0.2]}>
                    <sphereGeometry args={[0.4, 10, 10]} />
                    <meshStandardMaterial color="#f0f4ff" transparent opacity={0.6} roughness={1} />
                  </mesh>
                  <mesh position={[-0.3, -0.15, -0.2]}>
                    <sphereGeometry args={[0.35, 10, 10]} />
                    <meshStandardMaterial color="#f0f4ff" transparent opacity={0.6} roughness={1} />
                  </mesh>
                </group>
              ))}
            </group>
          );
        }

        return (
          <group key={zone.name}>
            {/* Large ground plane */}
            <mesh
              rotation={[-Math.PI / 2, 0, 0]}
              position={[centerX, avgY - 0.35, centerZ]}
              receiveShadow
            >
              <planeGeometry args={[width, depth]} />
              <meshStandardMaterial
                color={zone.groundColor}
                roughness={0.9}
                metalness={0.05}
              />
            </mesh>

            {/* Crystal Caves: dark ceiling above to feel enclosed */}
            {zoneIdx === 1 && (
              <mesh
                rotation={[Math.PI / 2, 0, 0]}
                position={[centerX, avgY + 6, centerZ]}
              >
                <planeGeometry args={[width, depth]} />
                <meshStandardMaterial color="#15152a" roughness={1} />
              </mesh>
            )}

            {/* Volcanic Ridge: scattered lava patches */}
            {zoneIdx === 2 && (
              <>
                {Array.from({ length: 12 }).map((_, i) => {
                  const spotX = centerX + (Math.sin(i * 2.3) * width * 0.35);
                  const spotZ = centerZ + (Math.cos(i * 1.7) * depth * 0.3);
                  return (
                    <mesh
                      key={`lava-spot-${i}`}
                      rotation={[-Math.PI / 2, 0, 0]}
                      position={[spotX, avgY - 0.3, spotZ]}
                    >
                      <circleGeometry args={[0.5 + Math.sin(i) * 0.25, 12]} />
                      <meshStandardMaterial
                        color="#ff4500"
                        emissive="#ff4500"
                        emissiveIntensity={0.6}
                        roughness={0.5}
                      />
                    </mesh>
                  );
                })}
              </>
            )}

            {/* Summit: golden glow platform */}
            {zoneIdx === 4 && (
              <mesh
                rotation={[-Math.PI / 2, 0, 0]}
                position={[centerX, avgY - 0.32, centerZ]}
              >
                <planeGeometry args={[width + 1, depth + 1]} />
                <meshStandardMaterial
                  color="#d4aa50"
                  emissive="#ffd700"
                  emissiveIntensity={0.08}
                  roughness={0.15}
                  metalness={0.5}
                />
              </mesh>
            )}
          </group>
        );
      })}
    </>
  );
}
