import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Edges, Float } from '@react-three/drei';
import type { Group, Mesh, Object3D } from 'three';
import type { Vector3Tuple } from 'three';
import { getZoneForSquare, getZoneIndex } from '../Board3D/zoneConfig';
import { getImmersiveSquareColor, getSquareKind } from './immersivePathUtils';
import { useStoryStore } from '../../stores/storyStore';

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
  const groupRef = useRef<Group>(null);
  const numRef = useRef<Object3D>(null);
  const rimRef = useRef<Mesh>(null);
  const startRef = useRef<Object3D>(null);
  const [hovered, setHovered] = useState(false);

  const zone = getZoneForSquare(squareNumber);
  const zoneIdx = getZoneIndex(squareNumber);
  const baseColor = getImmersiveSquareColor(squareNumber);
  const isStartOrEnd = squareNumber === 1 || squareNumber === 100;
  const tileScale = isStartOrEnd ? 1.4 : 1;
  const isSkyIsland = zoneIdx === 3;
  const kind = getSquareKind(squareNumber);

  // Story prologue: the board renders numberless and gray ("hollow"), and
  // crumbles away when the roll lands on nothing.
  const hollow = useStoryStore((s) => s.active && s.chapter === 'prologue');
  const crumbling = useStoryStore(
    (s) => s.active && s.chapter === 'prologue' && s.prologuePhase !== 'fake_game'
  );
  const crumbleT = useRef(0);

  // Animated properties (relative to group, so base is 0)
  const targetY = useRef(0);
  // Entrance pop-in: tiles ease up from the ground + fade in as they appear
  const appear = useRef(0);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    // Crumble: tiles drop away in a stagger, tumbling as they go
    if (crumbling) {
      crumbleT.current += delta;
      const delay = (((squareNumber * 37) % 23) / 23) * 0.9;
      const t = Math.max(0, crumbleT.current - delay);
      if (groupRef.current && t > 0) {
        groupRef.current.position.y = position[1] - t * t * 7;
        groupRef.current.rotation.z = t * (squareNumber % 2 === 0 ? 0.7 : -0.6);
        groupRef.current.rotation.x = t * 0.4;
      }
      return;
    }

    // Entrance animation (runs once when the tile mounts into view):
    // tiles rise from below and scale up with a smooth easeOut.
    if (appear.current < 1) {
      appear.current = Math.min(1, appear.current + delta * 2.6);
    }
    const a = appear.current;
    const ease = 1 - Math.pow(1 - a, 3); // easeOutCubic
    if (groupRef.current) {
      groupRef.current.position.y = position[1] - (1 - ease) * 1.6;
    }

    // Hover / path lift (relative to group position)
    let liftTarget = 0;
    if (hovered) liftTarget = 0.5;
    if (isInPath) liftTarget = 0.4;

    targetY.current += (liftTarget - targetY.current) * 0.12;
    meshRef.current.position.y = targetY.current;

    // Scale: entrance ease blended with path-end pulse / hover bump
    let s = tileScale * (0.4 + 0.6 * ease);
    if (isPathEnd) {
      s += Math.sin(state.clock.elapsedTime * 4) * 0.12;
    } else if (hovered) {
      s += 0.06;
    }
    meshRef.current.scale.setScalar(s);

    // Keep the number + rim glued to the *actual* top of the tile so they
    // never sink below the shell as it lifts, scales, or (for start/end tiles)
    // grows taller. Cylinder half-height is 0.21, scaled by the live scale `s`.
    const topY = meshRef.current.position.y + 0.21 * s;
    if (numRef.current) numRef.current.position.y = topY + 0.06;
    if (rimRef.current) rimRef.current.position.y = topY + 0.01;
    if (startRef.current) startRef.current.position.y = topY + 0.06;
  });

  // Determine display color (bright variants of aurora-cyan/green — emissive needs extra luminance)
  let displayColor = baseColor;
  if (isInPath) displayColor = '#4ECDC4';
  if (isHighlighted) displayColor = '#7BC970';

  // Emissive settings
  let emissiveColor = zone.emissiveColor;
  let emissiveIntensity = zone.emissiveIntensity;
  if (kind) {
    emissiveColor = kind.color;
    emissiveIntensity = Math.max(emissiveIntensity, 0.22);
  }
  if (isInPath) {
    emissiveColor = '#4ECDC4';
    emissiveIntensity = 0.35;
  }
  if (isHighlighted) {
    emissiveColor = '#7BC970';
    emissiveIntensity = 0.55;
  }

  // Hollow board: drained of color and identity
  if (hollow) {
    displayColor = '#73737f';
    emissiveColor = '#23232c';
    emissiveIntensity = 0.05;
  }

  const showEdges = isHighlighted || isInPath || hovered || !!kind || isStartOrEnd;
  const edgeColor = isHighlighted
    ? '#a8e89c'
    : isInPath
      ? '#7fe3db'
      : kind
        ? kind.color
        : '#ffffff';

  return (
    <group ref={groupRef} position={[position[0], position[1], position[2]]}>
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
        {/* Hexagonal prism with a slightly tapered, polished profile */}
        <cylinderGeometry args={[1.0, 1.12, 0.42, 6]} />
        <meshStandardMaterial
          color={displayColor}
          emissive={emissiveColor}
          emissiveIntensity={emissiveIntensity}
          roughness={zone.tileRoughness}
          metalness={zone.tileMetalness}
          transparent={isSkyIsland}
          opacity={isSkyIsland ? 0.92 : 1}
        />
        {showEdges && (
          <Edges threshold={15} scale={1.005} color={edgeColor} />
        )}
      </mesh>

      {/* Polished inset rim on top for a beveled, premium feel */}
      <mesh ref={rimRef} position={[0, 0.22, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.82, 0.98, 6]} />
        <meshStandardMaterial
          color={displayColor}
          emissive={emissiveColor}
          emissiveIntensity={emissiveIntensity * 0.6 + 0.08}
          roughness={0.25}
          metalness={0.5}
          transparent
          opacity={0.55}
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

      {/* Square number label — sits on the tile top (Y tracked each frame so it
          never sinks below the shell). Tone-mapping off keeps the white crisp
          on bright gold tiles; rendered just over the surface. */}
      <Text
        ref={numRef}
        position={[0, 0.27, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={isStartOrEnd ? 0.8 : 0.56}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.07}
        outlineColor="#0b0a1a"
        outlineOpacity={0.95}
        material-toneMapped={false}
        renderOrder={3}
      >
        {hollow ? '' : squareNumber}
      </Text>

      {/* START label */}
      {squareNumber === 1 && !hollow && (
        <Text
          ref={startRef}
          position={[0, 0.26, 0.6]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.3}
          color="#5FAD56"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.03}
          outlineColor="#000000"
          material-toneMapped={false}
        >
          START
        </Text>
      )}

      {/* End marker - floating gold beacon with sparkle */}
      {squareNumber === 100 && !hollow && (
        <Float speed={3} rotationIntensity={1} floatIntensity={1} floatingRange={[0, 0.4]}>
          <mesh position={[0, 1.6, 0]}>
            <octahedronGeometry args={[0.55]} />
            <meshStandardMaterial
              color="#FFE66D"
              emissive="#FFE66D"
              emissiveIntensity={0.9}
              roughness={0.05}
              metalness={0.95}
            />
          </mesh>
        </Float>
      )}

      {/* Highlight glow ring */}
      {(isHighlighted || isInPath) && (
        <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.05, 1.35, 6]} />
          <meshBasicMaterial
            color={isHighlighted ? '#7BC970' : '#4ECDC4'}
            transparent
            opacity={0.55}
          />
        </mesh>
      )}
    </group>
  );
}
