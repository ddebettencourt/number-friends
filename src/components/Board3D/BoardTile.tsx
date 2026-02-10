import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import type { Mesh } from 'three';
import type { Vector3Tuple } from 'three';
import { getSquareColor } from './boardPathUtils';
import { getZoneForSquare, getZoneIndex } from './zoneConfig';

interface BoardTileProps {
  position: Vector3Tuple;
  squareNumber: number;
  isHighlighted?: boolean;
  isInPath?: boolean;
  isPathEnd?: boolean;
  onClick?: () => void;
}

export function BoardTile({
  position,
  squareNumber,
  isHighlighted,
  isInPath,
  isPathEnd,
  onClick
}: BoardTileProps) {
  const meshRef = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const baseColor = getSquareColor(squareNumber);
  const zone = getZoneForSquare(squareNumber);
  const zoneIdx = getZoneIndex(squareNumber);
  const isStart = squareNumber === 1;
  const isEnd = squareNumber === 100;

  // Zone-specific material properties
  const zoneRoughness = zone.tileRoughness;
  const zoneMetalness = zone.tileMetalness;
  const zoneEmissive = zone.emissiveColor;
  const zoneEmissiveIntensity = zone.emissiveIntensity;

  // Sky Islands get slight transparency
  const isSkyIsland = zoneIdx === 3;

  // Animate highlighted/path tiles
  useFrame((state) => {
    if (!meshRef.current) return;

    const targetY = (isInPath || isHighlighted || hovered) ? 0.3 : 0;
    meshRef.current.position.y += (targetY - meshRef.current.position.y) * 0.1;

    // Pulse effect for path end
    if (isPathEnd) {
      const pulse = Math.sin(state.clock.elapsedTime * 4) * 0.1 + 0.4;
      meshRef.current.position.y = pulse;
    }
  });

  // Determine tile scale based on importance
  const scale = isStart || isEnd ? 1.3 : 1;

  // Compute emissive - path/highlight overrides zone emissive
  const activeEmissive = isInPath || isPathEnd ? '#98ec65' : isHighlighted ? '#FFE66D' : zoneEmissive;
  const activeEmissiveIntensity = isPathEnd ? 0.5 : isInPath ? 0.3 : isHighlighted ? 0.3 : zoneEmissiveIntensity;

  return (
    <group position={position}>
      {/* Main tile */}
      <mesh
        ref={meshRef}
        castShadow
        receiveShadow
        onClick={onClick}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        scale={[scale, 1, scale]}
      >
        {/* Hexagonal prism for tiles */}
        <cylinderGeometry args={[0.5, 0.55, 0.3, 6]} />
        <meshStandardMaterial
          color={isInPath ? '#98ec65' : isHighlighted ? '#FFE66D' : baseColor}
          emissive={activeEmissive}
          emissiveIntensity={activeEmissiveIntensity}
          roughness={zoneRoughness}
          metalness={zoneMetalness}
          transparent={isSkyIsland}
          opacity={isSkyIsland ? 0.95 : 1}
        />
      </mesh>

      {/* Number label */}
      <Text
        position={[0, 0.25, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={isStart || isEnd ? 0.35 : 0.25}
        color={isEnd ? '#1a1a2e' : '#ffffff'}
        fontWeight="bold"
        anchorX="center"
        anchorY="middle"
      >
        {squareNumber}
      </Text>

      {/* Special markers for start/end */}
      {isStart && (
        <Text
          position={[0, 0.5, 0]}
          fontSize={0.2}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
        >
          START
        </Text>
      )}

      {isEnd && (
        <>
          <Text
            position={[0, 0.6, 0]}
            fontSize={0.2}
            color="#1a1a2e"
            anchorX="center"
            anchorY="middle"
          >
            FINISH
          </Text>
          {/* Victory star */}
          <mesh position={[0, 1.2, 0]} rotation={[0, 0, Math.PI / 4]}>
            <octahedronGeometry args={[0.3]} />
            <meshStandardMaterial
              color="#FFD93D"
              emissive="#FFD93D"
              emissiveIntensity={0.5}
              roughness={0.2}
              metalness={0.8}
            />
          </mesh>
        </>
      )}

      {/* Glow ring for path tiles */}
      {isInPath && (
        <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.55, 0.7, 6]} />
          <meshBasicMaterial color="#98ec65" transparent opacity={0.6} />
        </mesh>
      )}
    </group>
  );
}
