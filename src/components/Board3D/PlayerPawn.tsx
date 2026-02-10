import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import type { Group } from 'three';
import type { Vector3Tuple } from 'three';
import type { Player } from '../../types/game';

interface PlayerPawnProps {
  player: Player;
  position: Vector3Tuple;
  playerIndex: number;
  totalPlayers: number;
  movePath?: number[];
  pathPositions?: Vector3Tuple[];
  hopDuration?: number;
  hopHeight?: number;
  pawnScale?: number;
  onHopComplete?: () => void;
}

const HOP_DURATION = 0.25; // seconds per hop
const HOP_HEIGHT = 0.8; // how high each hop goes

export function PlayerPawn({ player, position, playerIndex, totalPlayers, movePath = [], pathPositions = [], hopDuration, hopHeight, pawnScale = 1, onHopComplete }: PlayerPawnProps) {
  const groupRef = useRef<Group>(null);
  const targetPosition = useRef(position);

  // Hop animation state
  const hopQueue = useRef<Vector3Tuple[]>([]); // queue of positions to hop to
  const hopFrom = useRef<Vector3Tuple>(position); // where current hop started
  const hopTo = useRef<Vector3Tuple>(position); // where current hop is going
  const hopProgress = useRef(1); // 0 to 1, 1 = done
  const isHopping = useRef(false);
  const squishAmount = useRef(0); // landing squish effect
  // Prevents the idle lerp from snapping back to the store position
  // while hopping or waiting for the store to catch up after hop finishes
  const postHopHold = useRef(false);

  // Calculate offset so multiple players on same tile don't overlap
  const angleOffset = (playerIndex / totalPlayers) * Math.PI * 2;
  const spreadRadius = totalPlayers > 1 ? 0.3 * pawnScale : 0;
  const offsetX = Math.cos(angleOffset) * spreadRadius;
  const offsetZ = Math.sin(angleOffset) * spreadRadius;

  // Scale-adjusted vertical offset (pawn sits on top of tile)
  const yOffset = 0.6 * pawnScale;

  // Only update target from position prop when not in a hop sequence
  if (!postHopHold.current) {
    targetPosition.current = position;
  }

  // When movePath changes, build a hop queue from the path positions
  useEffect(() => {
    if (movePath.length > 1 && pathPositions.length > 0) {
      postHopHold.current = true;
      // Build waypoints from movePath (skip first since that's where we already are)
      const waypoints: Vector3Tuple[] = [];
      for (let i = 1; i < movePath.length; i++) {
        const idx = movePath[i] - 1;
        if (idx >= 0 && idx < pathPositions.length) {
          waypoints.push(pathPositions[idx]);
        }
      }
      if (waypoints.length > 0) {
        hopQueue.current = waypoints;
        // Start the first hop
        const firstTarget = hopQueue.current.shift()!;
        hopFrom.current = groupRef.current
          ? [
              groupRef.current.position.x - offsetX,
              groupRef.current.position.y - yOffset,
              groupRef.current.position.z - offsetZ,
            ]
          : position;
        hopTo.current = firstTarget;
        hopProgress.current = 0;
        isHopping.current = true;
      }
    } else {
      // movePath cleared (turn ended) — release the hold
      postHopHold.current = false;
    }
  }, [movePath, pathPositions]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    if (isHopping.current) {
      // Advance hop progress
      hopProgress.current += delta / (hopDuration ?? HOP_DURATION);

      if (hopProgress.current >= 1) {
        hopProgress.current = 1;
        // Trigger landing squish
        squishAmount.current = 0.3;

        // Move to next hop in queue, or finish
        if (hopQueue.current.length > 0) {
          const nextTarget = hopQueue.current.shift()!;
          hopFrom.current = hopTo.current;
          hopTo.current = nextTarget;
          hopProgress.current = 0;
        } else {
          isHopping.current = false;
          // Keep pawn at hop destination so idle lerp doesn't snap back
          // (store position hasn't updated yet)
          targetPosition.current = hopTo.current;
          onHopComplete?.();
        }
      }

      // Interpolate X/Z linearly, Y with parabolic arc
      const t = hopProgress.current;
      const fromX = hopFrom.current[0] + offsetX;
      const fromZ = hopFrom.current[2] + offsetZ;
      const fromY = hopFrom.current[1] + yOffset;
      const toX = hopTo.current[0] + offsetX;
      const toZ = hopTo.current[2] + offsetZ;
      const toY = hopTo.current[1] + yOffset;

      groupRef.current.position.x = fromX + (toX - fromX) * t;
      groupRef.current.position.z = fromZ + (toZ - fromZ) * t;

      // Parabolic arc: y = base_lerp + height * 4t(1-t)
      const baseY = fromY + (toY - fromY) * t;
      const arc = (hopHeight ?? HOP_HEIGHT) * 4 * t * (1 - t);
      groupRef.current.position.y = baseY + arc;

      // Tilt forward slightly during hop
      groupRef.current.rotation.x = -Math.sin(t * Math.PI) * 0.15;

    } else {
      // Normal idle state - smooth lerp to target + gentle bounce
      const targetX = targetPosition.current[0] + offsetX;
      const targetY = targetPosition.current[1] + yOffset;
      const targetZ = targetPosition.current[2] + offsetZ;

      groupRef.current.position.x += (targetX - groupRef.current.position.x) * 0.08;
      groupRef.current.position.z += (targetZ - groupRef.current.position.z) * 0.08;

      const bounce = Math.sin(state.clock.elapsedTime * 3 + playerIndex) * 0.05;
      const baseY = targetY + bounce;
      groupRef.current.position.y += (baseY - groupRef.current.position.y) * 0.08;

      // Ease rotation back to neutral
      groupRef.current.rotation.x += (0 - groupRef.current.rotation.x) * 0.1;
    }

    // Landing squish effect (scale Y down briefly, X/Z out)
    if (squishAmount.current > 0.01) {
      squishAmount.current *= 0.85; // decay
      groupRef.current.scale.set(
        1 + squishAmount.current * 0.5,
        1 - squishAmount.current,
        1 + squishAmount.current * 0.5
      );
    } else {
      squishAmount.current = 0;
      // Lerp scale back to 1
      groupRef.current.scale.x += (1 - groupRef.current.scale.x) * 0.15;
      groupRef.current.scale.y += (1 - groupRef.current.scale.y) * 0.15;
      groupRef.current.scale.z += (1 - groupRef.current.scale.z) * 0.15;
    }

    // Gentle Y rotation
    groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5 + playerIndex) * 0.1;
  });

  return (
    <group
      ref={groupRef}
      position={[position[0] + offsetX, position[1] + yOffset, position[2] + offsetZ]}
      scale={pawnScale}
    >
      {/* Pawn body - rounded capsule shape */}
      <mesh castShadow>
        <capsuleGeometry args={[0.2, 0.3, 8, 16]} />
        <meshStandardMaterial
          color={player.color}
          roughness={0.3}
          metalness={0.2}
        />
      </mesh>

      {/* Pawn head */}
      <mesh position={[0, 0.4, 0]} castShadow>
        <sphereGeometry args={[0.18, 16, 16]} />
        <meshStandardMaterial
          color={player.color}
          roughness={0.3}
          metalness={0.2}
        />
      </mesh>

      {/* Avatar emoji floating above */}
      <Text
        position={[0, 0.8, 0]}
        fontSize={0.3}
        anchorX="center"
        anchorY="middle"
      >
        {player.avatar}
      </Text>

      {/* Shadow blob under pawn */}
      <mesh position={[0, -0.45, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.25, 16]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.3} />
      </mesh>

      {/* Glowing base ring */}
      <mesh position={[0, -0.35, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.2, 0.28, 16]} />
        <meshBasicMaterial
          color={player.color}
          transparent
          opacity={0.8}
        />
      </mesh>
    </group>
  );
}
