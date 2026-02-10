import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import { Suspense, useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { Player } from '../../types/game';
import { BoardPath } from './BoardPath';
import { BoardTile } from './BoardTile';
import { PlayerPawn } from './PlayerPawn';
import { ZoneGround } from './ZoneGround';
import { ZoneDecorations } from './ZoneDecorations';
import { ZoneParticles } from './ZoneParticles';
import { generateBoardPath } from './boardPathUtils';
import { ZONES, getZoneIndex } from './zoneConfig';
import type { Vector3Tuple } from 'three';

interface GameBoard3DProps {
  players: Player[];
  currentPlayerIndex?: number;
  onSquareClick?: (position: number) => void;
  highlightedSquare?: number;
  movePath?: number[];
}

// Follow camera that stays close behind the active player
function FollowCamera({ target, pathPositions, playerPosition }: {
  target: Vector3Tuple;
  pathPositions: Vector3Tuple[];
  playerPosition: number;
}) {
  const { camera } = useThree();
  const currentTarget = useRef(new THREE.Vector3(target[0], target[1], target[2]));
  const currentCamPos = useRef(new THREE.Vector3(target[0], target[1] + 5, target[2] + 6));

  useFrame(() => {
    const tx = target[0];
    const ty = target[1];
    const tz = target[2];

    // Figure out the direction the player is "facing" by looking at nearby path points
    const idx = Math.max(0, playerPosition - 1);
    const nextIdx = Math.min(pathPositions.length - 1, idx + 3);
    const prevIdx = Math.max(0, idx - 3);

    const next = pathPositions[nextIdx];
    const prev = pathPositions[prevIdx];

    // Direction of travel
    const dirX = next[0] - prev[0];
    const dirZ = next[2] - prev[2];
    const len = Math.sqrt(dirX * dirX + dirZ * dirZ) || 1;

    // Camera positioned behind the player (opposite travel direction), above and back
    const camOffsetX = -(dirX / len) * 5;
    const camOffsetZ = -(dirZ / len) * 5;

    const desiredCamX = tx + camOffsetX;
    const desiredCamY = ty + 4;
    const desiredCamZ = tz + camOffsetZ + 2; // slight bias toward viewer

    // Smooth lerp for camera position and target
    currentTarget.current.lerp(new THREE.Vector3(tx, ty + 0.5, tz), 0.04);
    currentCamPos.current.lerp(new THREE.Vector3(desiredCamX, desiredCamY, desiredCamZ), 0.04);

    camera.position.copy(currentCamPos.current);
    camera.lookAt(currentTarget.current);
  });

  return null;
}

export function GameBoard3D({ players, currentPlayerIndex = 0, onSquareClick, highlightedSquare, movePath = [] }: GameBoard3DProps) {
  // Generate the winding path for 100 squares
  const pathPositions = useMemo(() => generateBoardPath(100), []);

  // Current player position for camera tracking
  const activePlayer = players[currentPlayerIndex] || players[0];
  const activePos = activePlayer ? (pathPositions[activePlayer.position - 1] || pathPositions[0]) : pathPositions[0];

  // Zone-aware fog color
  const activeZoneIdx = activePlayer ? getZoneIndex(activePlayer.position) : 0;
  const activeZone = ZONES[activeZoneIdx];

  return (
    <div className="w-full aspect-square max-w-2xl mx-auto rounded-3xl overflow-hidden" style={{
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
    }}>
      <Canvas shadows dpr={[1, 2]}>
        <Suspense fallback={null}>
          {/* Camera */}
          <PerspectiveCamera makeDefault position={[activePos[0], activePos[1] + 5, activePos[2] + 6]} fov={55} />
          <FollowCamera
            target={activePos}
            pathPositions={pathPositions}
            playerPosition={activePlayer?.position || 1}
          />

          {/* Lighting */}
          <ambientLight intensity={0.4} />
          <directionalLight
            position={[10, 25, 10]}
            intensity={1.0}
            castShadow
            shadow-mapSize={[2048, 2048]}
            shadow-camera-far={60}
            shadow-camera-left={-25}
            shadow-camera-right={25}
            shadow-camera-top={25}
            shadow-camera-bottom={-25}
          />
          <hemisphereLight args={['#87CEEB', '#3d5c3d', 0.3]} />

          {/* Zone accent lights */}
          {ZONES.map((zone) => {
            const startIdx = zone.startSquare - 1;
            const endIdx = Math.min(zone.endSquare, pathPositions.length);
            const zonePos = pathPositions.slice(startIdx, endIdx);
            if (zonePos.length === 0) return null;

            let cx = 0, cy = 0, cz = 0;
            for (const [x, y, z] of zonePos) {
              cx += x; cy += y; cz += z;
            }
            cx /= zonePos.length;
            cy /= zonePos.length;
            cz /= zonePos.length;

            return (
              <pointLight
                key={zone.name}
                position={[cx, cy + 5, cz]}
                color={zone.accentLightColor}
                intensity={1.2}
                distance={20}
                decay={2}
              />
            );
          })}

          {/* Background - zone aware */}
          <color attach="background" args={[activeZone.fogColor]} />

          {/* Fog for depth - close fog to hide distant zones and add atmosphere */}
          <fog attach="fog" args={[activeZone.fogColor, 8, 30]} />

          {/* Zone ground planes */}
          <ZoneGround positions={pathPositions} />

          {/* Board tiles */}
          {pathPositions.map((pos, index) => (
            <BoardTile
              key={index}
              position={pos}
              squareNumber={index + 1}
              isHighlighted={highlightedSquare === index + 1}
              isInPath={movePath.includes(index + 1)}
              isPathEnd={movePath[movePath.length - 1] === index + 1}
              onClick={() => onSquareClick?.(index + 1)}
            />
          ))}

          {/* Path connections */}
          <BoardPath positions={pathPositions} />

          {/* Player pawns */}
          {players.map((player, index) => (
            <PlayerPawn
              key={player.id}
              player={player}
              position={pathPositions[player.position - 1] || pathPositions[0]}
              playerIndex={index}
              totalPlayers={players.length}
              movePath={index === currentPlayerIndex ? movePath : undefined}
              pathPositions={pathPositions}
            />
          ))}

          {/* Zone decorations */}
          <ZoneDecorations positions={pathPositions} />

          {/* Zone particles */}
          <ZoneParticles positions={pathPositions} />
        </Suspense>
      </Canvas>
    </div>
  );
}
