import { Suspense, useMemo, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera, Sparkles, Stars, Environment, Lightformer } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, ToneMapping } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import { AnimatePresence, motion } from 'framer-motion';
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
import { ImmersiveSky } from './ImmersiveSky';
import { LOW_PERF } from '../../utils/perf';

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

// Stable Canvas config to prevent context recreation on re-render.
// On low-power devices we drop antialiasing and render resolution to cut fill cost.
const GL_CONFIG = { antialias: !LOW_PERF, powerPreference: 'high-performance' as const };
const DPR: [number, number] = LOW_PERF ? [0.7, 1] : [1, 1.5];

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

  // Zone-transition banner: fades in briefly when the active player enters a new zone
  const [bannerZone, setBannerZone] = useState<number | null>(null);
  useEffect(() => {
    setBannerZone(activeZoneIdx);
    const t = setTimeout(() => setBannerZone(null), 2600);
    return () => clearTimeout(t);
  }, [activeZoneIdx]);

  // Dark zones look great with a starfield; bright zones don't need it
  const showStars = activeZoneIdx === 1 || activeZoneIdx === 4;

  return (
    <div className="fixed inset-0 z-40">
      {/* Full-screen 3D Canvas (shadows are expensive — desktop only) */}
      <Canvas shadows={!LOW_PERF} dpr={DPR} gl={GL_CONFIG}>
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
          <ambientLight intensity={0.4} />
          <directionalLight
            position={[activePos[0] + 10, activePos[1] + 20, activePos[2] + 10]}
            intensity={1.1}
            castShadow={!LOW_PERF}
            shadow-mapSize={[1024, 1024]}
            shadow-bias={-0.0004}
            shadow-camera-far={80}
            shadow-camera-left={-30}
            shadow-camera-right={30}
            shadow-camera-top={30}
            shadow-camera-bottom={-30}
          />
          {/* Soft fill light from the opposite side to lift shadows */}
          <directionalLight
            position={[activePos[0] - 12, activePos[1] + 8, activePos[2] - 8]}
            intensity={0.3}
            color={activeZone.accentLightColor}
          />
          <hemisphereLight args={['#87CEEB', '#3d5c3d', 0.35]} />

          {/* Procedural environment — gives metallic crystals/gold/water real
              reflections + soft image-based ambient. Baked once (cheap). */}
          <Environment resolution={64} frames={1}>
            <color attach="background" args={['#10101a']} />
            <Lightformer intensity={2.2} position={[0, 6, 0]} scale={[12, 12, 1]} color="#fff4e6" />
            <Lightformer intensity={1.1} position={[6, 2, 4]} scale={[6, 6, 1]} color="#9bd0ff" />
            <Lightformer intensity={1.0} position={[-6, 1, -4]} scale={[6, 6, 1]} color="#ffb38a" />
            <Lightformer intensity={0.7} position={[0, -4, 0]} scale={[10, 10, 1]} color="#3a3a55" />
          </Environment>

          {/* Zone accent lights - current +/- 1 on desktop, current-only on mobile */}
          {ZONES.map((zone, idx) => {
            if (Math.abs(idx - activeZoneIdx) > (LOW_PERF ? 0 : 1)) return null;

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

          {/* Polished gradient sky — owns scene background + fog and cross-fades between zones */}
          <ImmersiveSky activeZone={activeZoneIdx} center={activePos} />

          {/* Starfield for dark zones (caves, summit) — follows the player */}
          {showStars && (
            <group position={[activePos[0], activePos[1], activePos[2]]}>
              <Stars radius={60} depth={40} count={LOW_PERF ? 450 : 1200} factor={3} saturation={0} fade speed={0.6} />
            </group>
          )}

          {/* Ambient floating sparkles tinted to the active zone */}
          <Sparkles
            position={[activePos[0], activePos[1] + 3, activePos[2]]}
            count={LOW_PERF ? 18 : 50}
            scale={[34, 12, 34]}
            size={3}
            speed={0.3}
            opacity={0.6}
            color={activeZone.accentLightColor}
          />

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
              glow={index === currentPlayerIndex}
              onHopComplete={index === currentPlayerIndex ? onMoveAnimationComplete : undefined}
            />
          ))}

          {/* Decorations */}
          <ImmersiveDecorations positions={pathPositions} activeZone={activeZoneIdx} />

          {/* Post-processing — desktop only (bloom makes emissive crystals/lava/gems/sky glow) */}
          {!LOW_PERF && (
            <EffectComposer multisampling={4} enableNormalPass={false}>
              <Bloom
                mipmapBlur
                luminanceThreshold={0.62}
                luminanceSmoothing={0.3}
                intensity={0.85}
                radius={0.7}
              />
              <Vignette eskil={false} offset={0.25} darkness={0.55} />
              <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
            </EffectComposer>
          )}
        </Suspense>
      </Canvas>

      {/* HTML Overlay UI */}
      <div className="absolute inset-0 pointer-events-none z-10">
        {/* Zone transition banner */}
        <AnimatePresence>
          {bannerZone !== null && (
            <motion.div
              key={bannerZone}
              className="absolute left-1/2 top-[18%] -translate-x-1/2 text-center"
              initial={{ opacity: 0, y: -16, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.96 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            >
              <div
                className="label-caps mb-1"
                style={{ color: ZONES[bannerZone].accentLightColor }}
              >
                Entering
              </div>
              <div
                className="text-3xl sm:text-4xl"
                style={{
                  fontFamily: 'var(--font-title)',
                  color: '#fff',
                  textShadow: `0 0 24px ${ZONES[bannerZone].accentLightColor}, 0 2px 8px rgba(0,0,0,0.6)`,
                }}
              >
                {ZONES[bannerZone].name}
              </div>
              <div
                className="mx-auto mt-2 h-[3px] rounded-full"
                style={{
                  width: 80,
                  background: `linear-gradient(90deg, transparent, ${ZONES[bannerZone].accentLightColor}, transparent)`,
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Top bar */}
        <div className="pointer-events-auto flex items-center justify-between p-3 hud-safe-top">
          <div className="flex gap-2">
            {/* Board mode toggle */}
            <button
              onClick={() => {
                const modes = ['2d', '3d', 'immersive'] as const;
                const currentIdx = modes.indexOf(boardMode as '2d' | '3d' | 'immersive');
                const nextIdx = (currentIdx + 1) % modes.length;
                onBoardModeChange?.(modes[nextIdx]);
              }}
              className="hud-panel flex items-center gap-2 px-3.5 rounded-full text-xs font-bold min-h-[44px] transition-transform hover:scale-[1.04] active:scale-95"
              style={{ color: '#fff', fontFamily: 'var(--font-body)' }}
              title="Switch board view"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/70">
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 17 12 22 22 17" />
                <polyline points="2 12 12 17 22 12" />
              </svg>
              {boardMode === 'immersive' ? 'Immersive' : boardMode === '3d' ? '3D' : '2D'}
              <span className="text-white/40">· switch</span>
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onSoundToggle}
              className="btn-icon"
              title={soundEnabled ? 'Mute sounds' : 'Unmute sounds'}
              aria-label={soundEnabled ? 'Mute sounds' : 'Unmute sounds'}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
              className="btn-icon"
              title="How to play"
              aria-label="How to play"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile standings strip — players + positions (desktop shows the rail instead) */}
        <div className="sm:hidden absolute top-16 left-1/2 -translate-x-1/2 flex gap-1.5">
          {players.map((player, index) => {
            const isActive = index === currentPlayerIndex;
            return (
              <div
                key={player.id}
                className="flex items-center gap-1 pl-1 pr-2 py-1 rounded-full"
                style={{
                  background: 'rgba(15, 12, 35, 0.75)',
                  border: `1.5px solid ${isActive ? player.color : 'rgba(255,255,255,0.12)'}`,
                  boxShadow: isActive ? `0 0 12px ${player.color}50` : 'none',
                  opacity: isActive ? 1 : 0.75,
                }}
              >
                <span
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[13px]"
                  style={{ background: `linear-gradient(135deg, ${player.color}, ${player.color}99)` }}
                >
                  {player.avatar}
                </span>
                <span className="text-[11px] font-bold text-white/90" style={{ fontFamily: 'var(--font-body)' }}>
                  {player.position}
                </span>
              </div>
            );
          })}
        </div>

        {/* Bottom area - dice controls + standings + minimap */}
        <div className="absolute bottom-0 left-0 right-0 flex items-end justify-center sm:justify-between p-3 gap-3 hud-safe-bottom">
          {/* Standings rail - bottom left (desktop): every player, active one lit up */}
          <div className="pointer-events-auto hidden sm:flex flex-col gap-1.5">
            {players.map((player, index) => {
              const isActive = index === currentPlayerIndex;
              return (
                <div
                  key={player.id}
                  className="hud-panel flex items-center gap-2 px-2.5 py-1.5 transition-all duration-300"
                  style={{
                    borderColor: isActive ? `${player.color}90` : undefined,
                    boxShadow: isActive ? `0 0 16px ${player.color}40, 0 8px 28px rgba(0,0,0,0.35)` : undefined,
                    opacity: isActive ? 1 : 0.7,
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0"
                    style={{
                      background: `linear-gradient(135deg, ${player.color}, ${player.color}cc)`,
                    }}
                  >
                    {player.avatar}
                  </div>
                  <div className="text-left min-w-[96px]">
                    <div className="font-bold text-sm text-white/90 leading-tight" style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.03em' }}>
                      {player.name}
                    </div>
                    <div className="text-[11px] flex items-center gap-1.5" style={{ fontFamily: 'var(--font-body)' }}>
                      <span className="text-white/50">Square {player.position}</span>
                      {isActive && (
                        <>
                          <span className="w-1 h-1 rounded-full" style={{ background: activeZone.accentLightColor }} />
                          <span style={{ color: activeZone.accentLightColor }}>{activeZone.name}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Dice controls - bottom center */}
          <div className="pointer-events-auto flex flex-col items-center gap-2 flex-1 max-w-sm mx-auto">
            {children}
          </div>

          {/* Minimap - bottom right (hidden on mobile) */}
          <div className="pointer-events-auto hidden sm:block">
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
