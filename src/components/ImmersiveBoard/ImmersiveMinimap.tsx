import { useMemo } from 'react';
import type { Vector3Tuple } from 'three';
import type { Player } from '../../types/game';
import { ZONES } from '../Board3D/zoneConfig';
import { useStoryStore } from '../../stores/storyStore';

interface ImmersiveMinimapProps {
  positions: Vector3Tuple[];
  players: Player[];
  currentPlayerIndex: number;
}

const MAP_WIDTH = 150;
const MAP_HEIGHT = 80;
const PADDING = 8;

export function ImmersiveMinimap({ positions, players, currentPlayerIndex }: ImmersiveMinimapProps) {
  // Project 3D positions to 2D (using X and Z, ignoring Y)
  const { points2D, playerDots } = useMemo(() => {
    if (positions.length === 0) return { points2D: [], playerDots: [] };

    // Find bounds
    let minX = Infinity, maxX = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;
    for (const [x, , z] of positions) {
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minZ = Math.min(minZ, z);
      maxZ = Math.max(maxZ, z);
    }

    const rangeX = maxX - minX || 1;
    const rangeZ = maxZ - minZ || 1;
    const drawW = MAP_WIDTH - PADDING * 2;
    const drawH = MAP_HEIGHT - PADDING * 2;

    // Map 3D → 2D
    const pts = positions.map(([x, , z]) => ({
      x: PADDING + ((x - minX) / rangeX) * drawW,
      y: PADDING + ((z - minZ) / rangeZ) * drawH,
    }));

    // Player positions
    const dots = players.map((player) => {
      const idx = Math.max(0, Math.min(positions.length - 1, player.position - 1));
      return {
        x: pts[idx].x,
        y: pts[idx].y,
        color: player.color,
        id: player.id,
      };
    });

    return { points2D: pts, playerDots: dots };
  }, [positions, players]);

  // Build SVG path segments per zone
  const zonePaths = useMemo(() => {
    return ZONES.map((zone) => {
      const startIdx = zone.startSquare - 1;
      const endIdx = Math.min(zone.endSquare, points2D.length);
      const pts = points2D.slice(startIdx, endIdx);
      if (pts.length < 2) return null;

      const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
      return { d, color: zone.pathColor, name: zone.name };
    });
  }, [points2D]);

  const activePlayer = players[currentPlayerIndex];
  const progress = activePlayer ? Math.min(100, Math.max(0, activePlayer.position)) : 0;
  // Story prologue: the numbers are gone — even from the map
  const hollow = useStoryStore((s) => s.active && s.chapter === 'prologue');

  return (
    <div
      className="hud-panel overflow-hidden"
      style={{ width: MAP_WIDTH }}
    >
      <svg width={MAP_WIDTH} height={MAP_HEIGHT} viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}>
        <defs>
          <filter id="minimap-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Zone path segments */}
        {zonePaths.map((zp) => {
          if (!zp) return null;
          return (
            <path
              key={zp.name}
              d={zp.d}
              stroke={zp.color}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              opacity={0.75}
            />
          );
        })}

        {/* Player dots */}
        {playerDots.map((dot, idx) => (
          <circle
            key={dot.id}
            cx={dot.x}
            cy={dot.y}
            r={idx === currentPlayerIndex ? 4 : 3}
            fill={dot.color}
            stroke="#fff"
            strokeWidth={1}
            opacity={idx === currentPlayerIndex ? 1 : 0.7}
            filter={idx === currentPlayerIndex ? 'url(#minimap-glow)' : undefined}
          >
            {idx === currentPlayerIndex && (
              <animate
                attributeName="r"
                values="4;5.5;4"
                dur="1.4s"
                repeatCount="indefinite"
              />
            )}
          </circle>
        ))}
      </svg>

      {/* Progress to 100 */}
      <div className="px-2 pb-2">
        <div className="flex items-center justify-between text-[10px] text-white/50 mb-1" style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}>
          <span>{hollow ? '—' : 1}</span>
          <span className="text-white/80 font-bold">{hollow ? '—/—' : `${progress}/100`}</span>
          <span>{hollow ? '—' : 100}</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.12)' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: hollow ? '0%' : `${progress}%`,
              background: 'linear-gradient(90deg, var(--color-aurora-green), var(--color-aurora-cyan), var(--color-aurora-orange), var(--color-aurora-yellow))',
            }}
          />
        </div>
      </div>
    </div>
  );
}
