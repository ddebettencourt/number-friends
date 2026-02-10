import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import type { Mesh } from 'three';
import type { Vector3Tuple } from 'three';
import { getZoneForSquare, getZoneIndex } from '../Board3D/zoneConfig';
import { getImmersiveSquareColor } from './immersivePathUtils';

interface ImmersiveTileProps {
  position: Vector3Tuple;
  squareNumber: number;
  isHighlighted?: boolean;
  isInPath?: boolean;
  isPathEnd?: boolean;
  onClick?: () => void;
}

export function ImmersiveTile({
  position,
  squareNumber,
  isHighlighted = false,
  isInPath = false,
  isPathEnd = false,
  onClick,
}: ImmersiveTileProps) {
  const meshRef = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const zone = getZoneForSquare(squareNumber);
  const zoneIdx = getZoneIndex(squareNumber);
  const baseColor = getImmersiveSquareColor(squareNumber);
  const isStartOrEnd = squareNumber === 1 || squareNumber === 100;
  const tileScale = isStartOrEnd ? 1.4 : 1;
  const isSkyIsland = zoneIdx === 3;

  // Animated properties (relative to group, so base is 0)
  const targetY = useRef(0);

  useFrame((state) => {
    if (!meshRef.current) return;

    // Hover / path lift (relative to group position)
    let liftTarget = 0;
    if (hovered || isInPath) liftTarget = 0.4;

    targetY.current += (liftTarget - targetY.current) * 0.1;
    meshRef.current.position.y = targetY.current;

    // Path end pulsing
    if (isPathEnd) {
      const pulse = Math.sin(state.clock.elapsedTime * 4) * 0.15;
      meshRef.current.scale.setScalar(tileScale + pulse);
    }
  });

  // Determine display color
  let displayColor = baseColor;
  if (isInPath) displayColor = '#56d4c8';
  if (isHighlighted) displayColor = '#98ec65';

  // Emissive settings
  let emissiveColor = zone.emissiveColor;
  let emissiveIntensity = zone.emissiveIntensity;
  if (isInPath) {
    emissiveColor = '#56d4c8';
    emissiveIntensity = 0.3;
  }
  if (isHighlighted) {
    emissiveColor = '#98ec65';
    emissiveIntensity = 0.4;
  }

  return (
    <group position={[position[0], position[1], position[2]]}>
      {/* Main hexagonal tile */}
      <mesh
        ref={meshRef}
        castShadow
        receiveShadow
        scale={tileScale}
        onClick={(e) => {
          e.stopPropagation();
          onClick?.();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = 'default';
        }}
      >
        {/* Hexagonal prism */}
        <cylinderGeometry args={[1.0, 1.1, 0.4, 6]} />
        <meshStandardMaterial
          color={displayColor}
          emissive={emissiveColor}
          emissiveIntensity={emissiveIntensity}
          roughness={zone.tileRoughness}
          metalness={zone.tileMetalness}
          transparent={isSkyIsland}
          opacity={isSkyIsland ? 0.92 : 1}
        />
      </mesh>

      {/* Invisible larger hit target for easier clicking */}
      <mesh
        position={[0, 0.2, 0]}
        visible={false}
        onClick={(e) => {
          e.stopPropagation();
          onClick?.();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = 'default';
        }}
      >
        <cylinderGeometry args={[1.3, 1.3, 1, 6]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {/* Square number label */}
      <Text
        position={[0, 0.25, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={isStartOrEnd ? 0.7 : 0.45}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.04}
        outlineColor="#000000"
      >
        {squareNumber}
      </Text>

      {/* START label */}
      {squareNumber === 1 && (
        <Text
          position={[0, 0.26, 0.6]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.3}
          color="#5FAD56"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.03}
          outlineColor="#000000"
        >
          START
        </Text>
      )}

      {/* End marker - gold rotating star */}
      {squareNumber === 100 && (
        <mesh position={[0, 1.5, 0]} rotation={[0, 0, 0]}>
          <octahedronGeometry args={[0.5]} />
          <meshStandardMaterial
            color="#FFD93D"
            emissive="#FFD93D"
            emissiveIntensity={0.8}
            roughness={0.1}
            metalness={0.9}
          />
        </mesh>
      )}

      {/* Highlight glow ring */}
      {(isHighlighted || isInPath) && (
        <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.0, 1.2, 6]} />
          <meshBasicMaterial
            color={isHighlighted ? '#98ec65' : '#56d4c8'}
            transparent
            opacity={0.5}
          />
        </mesh>
      )}
    </group>
  );
}
