import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { Vector3Tuple } from 'three';
import { getZoneIndex } from '../Board3D/zoneConfig';

interface ImmersiveCameraProps {
  target: Vector3Tuple;
  pathPositions: Vector3Tuple[];
  playerPosition: number;
  movePath?: number[];
}

// Reusable vectors to avoid GC pressure
const _desiredCam = new THREE.Vector3();
const _desiredTarget = new THREE.Vector3();

const HOP_DURATION = 0.35; // must match PlayerPawn's immersive hopDuration

export function ImmersiveCamera({ target, pathPositions, playerPosition, movePath = [] }: ImmersiveCameraProps) {
  const { camera } = useThree();
  const currentTarget = useRef(new THREE.Vector3(target[0], target[1] + 0.8, target[2]));
  const currentCamPos = useRef(new THREE.Vector3(target[0], target[1] + 3, target[2] + 7));

  // Zone transition state
  const prevZone = useRef(getZoneIndex(playerPosition));
  const zoneTransitionTimer = useRef(0);

  // Move path tracking — camera follows the pawn along the hop path
  const prevMovePathLen = useRef(0);
  const moveStartTime = useRef(0);

  useFrame((state, delta) => {
    // Detect new move path
    if (movePath.length > 1 && prevMovePathLen.current !== movePath.length) {
      moveStartTime.current = state.clock.elapsedTime;
      prevMovePathLen.current = movePath.length;
    } else if (movePath.length <= 1) {
      prevMovePathLen.current = 0;
    }

    // Compute effective target: either the hop-interpolated position or the static target
    let tx: number, ty: number, tz: number;
    let effectivePlayerPos = playerPosition;

    if (movePath.length > 1 && moveStartTime.current > 0) {
      // Camera tracks along the hop path based on elapsed time
      const elapsed = state.clock.elapsedTime - moveStartTime.current;
      const totalHops = movePath.length - 1;
      const currentHopFloat = elapsed / HOP_DURATION;
      const hopIdx = Math.min(Math.floor(currentHopFloat), totalHops - 1);
      const hopFrac = Math.min(currentHopFloat - hopIdx, 1);

      const fromSquare = movePath[Math.min(hopIdx, totalHops)];
      const toSquare = movePath[Math.min(hopIdx + 1, totalHops)];
      const fromPos = pathPositions[fromSquare - 1] || target;
      const toPos = pathPositions[toSquare - 1] || target;

      tx = fromPos[0] + (toPos[0] - fromPos[0]) * hopFrac;
      ty = fromPos[1] + (toPos[1] - fromPos[1]) * hopFrac;
      tz = fromPos[2] + (toPos[2] - fromPos[2]) * hopFrac;
      effectivePlayerPos = toSquare;
    } else {
      tx = target[0];
      ty = target[1];
      tz = target[2];
    }

    // Detect zone transitions
    const currentZone = getZoneIndex(effectivePlayerPos);
    if (currentZone !== prevZone.current) {
      zoneTransitionTimer.current = 2.0; // 2-second pull-out reveal
      prevZone.current = currentZone;
    }

    // Decay transition timer
    if (zoneTransitionTimer.current > 0) {
      zoneTransitionTimer.current = Math.max(0, zoneTransitionTimer.current - delta);
    }

    // Compute travel direction from nearby path points
    const idx = Math.max(0, effectivePlayerPos - 1);
    const lookAheadIdx = Math.min(pathPositions.length - 1, idx + 4);
    const lookBehindIdx = Math.max(0, idx - 4);

    const ahead = pathPositions[lookAheadIdx];
    const behind = pathPositions[lookBehindIdx];

    let dirX = ahead[0] - behind[0];
    let dirZ = ahead[2] - behind[2];
    const len = Math.sqrt(dirX * dirX + dirZ * dirZ) || 1;
    dirX /= len;
    dirZ /= len;

    // Zone transition: pull camera back further for reveal effect
    const transitionFactor = zoneTransitionTimer.current / 2.0;
    const transitionBonus = transitionFactor * 5; // up to +5 distance
    const transitionHeight = transitionFactor * 1.5; // up to +1.5 height

    // Camera positioned behind player (opposite travel direction), high enough to clear obstacles
    const baseDistance = 7;
    const distance = baseDistance + transitionBonus;

    _desiredCam.set(
      tx - dirX * distance,
      ty + 5 + transitionHeight,
      tz - dirZ * distance + 1.5
    );

    // Look slightly ahead of the player
    _desiredTarget.set(
      tx + dirX * 1.5,
      ty + 0.8,
      tz + dirZ * 1.5
    );

    // Ensure camera is never below the player
    _desiredCam.y = Math.max(_desiredCam.y, ty + 3);

    // Smooth lerp — faster during movement for better tracking
    const isMoving = movePath.length > 1;
    const posLerp = isMoving ? 0.06 : 0.035;
    const targetLerp = isMoving ? 0.09 : 0.06;

    currentCamPos.current.lerp(_desiredCam, posLerp);
    currentTarget.current.lerp(_desiredTarget, targetLerp);

    camera.position.copy(currentCamPos.current);
    camera.lookAt(currentTarget.current);
  });

  return null;
}
