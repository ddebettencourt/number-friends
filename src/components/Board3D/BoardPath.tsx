import { useMemo } from 'react';
import { CatmullRomCurve3, Vector3, TubeGeometry } from 'three';
import type { Vector3Tuple } from 'three';
import { ZONES } from './zoneConfig';

interface BoardPathProps {
  positions: Vector3Tuple[];
}

export function BoardPath({ positions }: BoardPathProps) {
  // Create one tube segment per zone with zone-specific colors and radii
  const segments = useMemo(() => {
    if (positions.length < 2) return [];

    return ZONES.map((zone) => {
      const startIdx = zone.startSquare - 1;
      const endIdx = Math.min(zone.endSquare, positions.length);

      // Include one extra point on each side for smooth transitions
      const extStart = Math.max(0, startIdx - 1);
      const extEnd = Math.min(positions.length, endIdx + 1);

      const segPositions = positions.slice(extStart, extEnd);
      if (segPositions.length < 2) return null;

      // Convert positions to Vector3, offset Y slightly below tiles
      const points = segPositions.map(([x, y, z]) => new Vector3(x, y - 0.1, z));
      const curve = new CatmullRomCurve3(points, false, 'catmullrom', 0.5);
      const geometry = new TubeGeometry(curve, segPositions.length * 4, zone.pathRadius, 8, false);

      return {
        geometry,
        color: zone.pathColor,
        name: zone.name,
      };
    }).filter(Boolean) as { geometry: TubeGeometry; color: string; name: string }[];
  }, [positions]);

  return (
    <>
      {segments.map((seg) => (
        <mesh key={seg.name} geometry={seg.geometry} receiveShadow>
          <meshStandardMaterial
            color={seg.color}
            roughness={0.8}
            metalness={0.1}
          />
        </mesh>
      ))}
    </>
  );
}
