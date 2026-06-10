import { useMemo } from 'react';
import * as THREE from 'three';
import type { Vector3Tuple } from 'three';
import { ZONES } from '../Board3D/zoneConfig';

interface ImmersivePathProps {
  positions: Vector3Tuple[];
}

export function ImmersivePath({ positions }: ImmersivePathProps) {
  const zoneTubes = useMemo(() => {
    return ZONES.map((zone) => {
      const startIdx = zone.startSquare - 1;
      const endIdx = Math.min(zone.endSquare, positions.length);

      // Extend slightly into adjacent zones for smooth connections
      const extStart = Math.max(0, startIdx - 1);
      const extEnd = Math.min(positions.length, endIdx + 1);

      const segPositions = positions.slice(extStart, extEnd);
      if (segPositions.length < 2) return null;

      const points = segPositions.map(
        ([x, y, z]) => new THREE.Vector3(x, y - 0.5, z)
      );

      const curve = new THREE.CatmullRomCurve3(points);
      const segments = Math.max(8, segPositions.length * 8);
      const tubeGeometry = new THREE.TubeGeometry(curve, segments, 0.42, 10, false);

      return {
        geometry: tubeGeometry,
        color: zone.pathColor,
        emissive: zone.emissiveColor,
        key: zone.name,
      };
    });
  }, [positions]);

  return (
    <>
      {zoneTubes.map((tube) => {
        if (!tube) return null;
        return (
          <mesh key={tube.key} geometry={tube.geometry} receiveShadow>
            <meshStandardMaterial
              color={tube.color}
              emissive={tube.emissive}
              emissiveIntensity={0.12}
              roughness={0.7}
              metalness={0.2}
            />
          </mesh>
        );
      })}
    </>
  );
}
