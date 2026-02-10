import { Suspense, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import type { Player } from '../../types/game';
import { ZONES, getZoneIndex } from '../Board3D/zoneConfig';
import { PlayerPawn } from '../Board3D/PlayerPawn';
import { generateImmersivePath } from './immersivePathUtils';
import { ImmersiveCamera } from './ImmersiveCamera';
import { ImmersiveTile } from './ImmersiveTile';
import { ImmersivePath } from './ImmersivePath';
import { ImmersiveGround } from './ImmersiveGround';
import { ImmersiveDecorations } from './ImmersiveDecorations';
import { ImmersiveMinimap } from './ImmersiveMinimap';

interface ImmersiveBoardProps {
  players: Player[];
  currentPlayerIndex: number;
  onSquareClick?: (position: number) => void;
  highlightedSquare?: number;
  movePath?: number[];
  children?: React.ReactNode;
  boardMode?: string;
  onBoardModeChange?: (mode: string) => void;
  soundEnabled?: boolean;
  onSoundToggle?: () => void;
  onRulesOpen?: () => void;
  onMoveAnimationComplete?: () => void;
}

// Stable Canvas config to prevent context recreation on re-render
const GL_CONFIG = { antialias: true, powerPreference: 'high-performance' as const };
const DPR: [number, number] = [1, 1.5];

export function ImmersiveBoard({
  players,
  currentPlayerIndex,
  onSquareClick,
  highlightedSquare,
  movePath = [],
  children,
  boardMode,
  onBoardModeChange,
  soundEnabled,
  onSoundToggle,
  onRulesOpen,
  onMoveAnimationComplete,
}: ImmersiveBoardProps) {
  const pathPositions = useMemo(() => generateImmersivePath(100), []);
  const activePlayer = players[currentPlayerIndex] || players[0];

  // Only render tiles within visible range (~50 units) to reduce draw calls
  const TILE_RENDER_DISTANCE = 50;
  const visibleTileIndices = useMemo(() => {
    const activeIdx = (activePlayer?.position ?? 1) - 1;
    const ax = pathPositions[activeIdx]?.[0] ?? 0;
    const az = pathPositions[activeIdx]?.[2] ?? 0;
    const indices: number[] = [];
    for (let i = 0; i < pathPositions.length; i++) {
      const dx = pathPositions[i][0] - ax;
      const dz = pathPositions[i][2] - az;
      if (dx * dx + dz * dz < TILE_RENDER_DISTANCE * TILE_RENDER_DISTANCE) {
        indices.push(i);
      }
    }
    return indices;
  }, [pathPositions, activePlayer?.position]);
  const activePos = activePlayer
    ? pathPositions[activePlayer.position - 1] || pathPositions[0]
    : pathPositions[0];

  const activeZoneIdx = activePlayer ? getZoneIndex(activePlayer.position) : 0;
  const activeZone = ZONES[activeZoneIdx];

  return (
    <div className="fixed inset-0 z-40">
      {/* Full-screen 3D Canvas */}
      <Canvas shadows dpr={DPR} gl={GL_CONFIG}>
        <Suspense fallback={null}>
          {/* Camera */}
          <PerspectiveCamera
            makeDefault
            position={[activePos[0], activePos[1] + 3, activePos[2] + 7]}
            fov={65}
          />
          <ImmersiveCamera
            target={activePos}
            pathPositions={pathPositions}
            playerPosition={activePlayer?.position || 1}
            movePath={movePath}
          />

          {/* Lighting */}
          <ambientLight intensity={0.35} />
          <directionalLight
            position={[activePos[0] + 10, activePos[1] + 20, activePos[2] + 10]}
            intensity={1.0}
            castShadow
            shadow-mapSize={[2048, 2048]}
            shadow-camera-far={80}
            shadow-camera-left={-30}
            shadow-camera-right={30}
            shadow-camera-top={30}
            shadow-camera-bottom={-30}
          />
          <hemisphereLight args={['#87CEEB', '#3d5c3d', 0.3]} />

          {/* Zone accent lights - only current +/- 1 */}
          {ZONES.map((zone, idx) => {
            if (Math.abs(idx - activeZoneIdx) > 1) return null;

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
                position={[cx, cy + 6, cz]}
                color={zone.accentLightColor}
                intensity={1.5}
                distance={40}
                decay={2}
              />
            );
          })}

          {/* Background & Fog - zone aware */}
          <color attach="background" args={[activeZone.fogColor]} />
          <fog attach="fog" args={[activeZone.fogColor, 20, 70]} />

          {/* Ground */}
          <ImmersiveGround positions={pathPositions} activeZone={activeZoneIdx} />

          {/* Board tiles - only render nearby ones */}
          {visibleTileIndices.map((index) => (
            <ImmersiveTile
              key={index}
              position={pathPositions[index]}
              squareNumber={index + 1}
              isHighlighted={highlightedSquare === index + 1}
              isInPath={movePath.includes(index + 1)}
              isPathEnd={movePath[movePath.length - 1] === index + 1}
              onClick={() => onSquareClick?.(index + 1)}
            />
          ))}

          {/* Path connections */}
          <ImmersivePath positions={pathPositions} />

          {/* Player pawns - reuse existing with immersive scale */}
          {players.map((player, index) => (
            <PlayerPawn
              key={player.id}
              player={player}
              position={pathPositions[player.position - 1] || pathPositions[0]}
              playerIndex={index}
              totalPlayers={players.length}
              movePath={index === currentPlayerIndex ? movePath : undefined}
              pathPositions={pathPositions}
              pawnScale={2.5}
              hopDuration={0.35}
              hopHeight={1.8}
              onHopComplete={index === currentPlayerIndex ? onMoveAnimationComplete : undefined}
            />
          ))}

          {/* Decorations */}
          <ImmersiveDecorations positions={pathPositions} activeZone={activeZoneIdx} />
        </Suspense>
      </Canvas>

      {/* HTML Overlay UI */}
      <div className="absolute inset-0 pointer-events-none z-10">
        {/* Top bar */}
        <div className="pointer-events-auto flex items-center justify-between p-3">
          <div className="flex gap-2">
            {/* Board mode toggle */}
            <button
              onClick={() => {
                const modes = ['2d', '3d', 'immersive'] as const;
                const currentIdx = modes.indexOf(boardMode as '2d' | '3d' | 'immersive');
                const nextIdx = (currentIdx + 1) % modes.length;
                onBoardModeChange?.(modes[nextIdx]);
              }}
              className="px-3 py-1.5 rounded-full text-xs font-bold transition-all"
              style={{
                background: 'rgba(0, 0, 0, 0.5)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#fff',
              }}
            >
              {boardMode === 'immersive' ? '🌍 Immersive' : boardMode === '3d' ? '🎮 3D' : '📋 2D'} — Click to switch
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onSoundToggle}
              className="p-2 rounded-xl transition-all hover:scale-110"
              style={{
                background: 'rgba(0, 0, 0, 0.5)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/70">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                {soundEnabled ? (
                  <>
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                  </>
                ) : (
                  <line x1="23" y1="9" x2="17" y2="15" />
                )}
              </svg>
            </button>
            <button
              onClick={onRulesOpen}
              className="p-2 rounded-xl transition-all hover:scale-110"
              style={{
                background: 'rgba(0, 0, 0, 0.5)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
              }}
            >
              <span className="text-lg">📖</span>
            </button>
          </div>
        </div>

        {/* Bottom area - dice controls + player info */}
        <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between p-3 gap-3">
          {/* Current player info - bottom left */}
          {activePlayer && (
            <div
              className="pointer-events-auto flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{
                background: 'rgba(0, 0, 0, 0.5)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: `1px solid ${activePlayer.color}40`,
              }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-base"
                style={{
                  background: `linear-gradient(135deg, ${activePlayer.color}, ${activePlayer.color}cc)`,
                }}
              >
                {activePlayer.avatar}
              </div>
              <div className="text-left">
                <div className="font-bold text-sm text-white/90" style={{ fontFamily: 'var(--font-display)' }}>
                  {activePlayer.name}
                </div>
                <div className="text-[11px] text-white/50" style={{ fontFamily: 'var(--font-body)' }}>
                  Square {activePlayer.position}
                </div>
              </div>
            </div>
          )}

          {/* Dice controls - bottom center */}
          <div className="pointer-events-auto flex flex-col items-center gap-2 flex-1 max-w-sm mx-auto">
            {children}
          </div>

          {/* Minimap - bottom right */}
          <div className="pointer-events-auto">
            <ImmersiveMinimap
              positions={pathPositions}
              players={players}
              currentPlayerIndex={currentPlayerIndex}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
