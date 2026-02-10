import { useMemo } from 'react';
import type { Vector3Tuple } from 'three';
import type { Player } from '../../types/game';
import { ZONES } from '../Board3D/zoneConfig';

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

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{
        background: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        width: MAP_WIDTH,
        height: MAP_HEIGHT,
      }}
    >
      <svg width={MAP_WIDTH} height={MAP_HEIGHT} viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}>
        {/* Zone path segments */}
        {zonePaths.map((zp) => {
          if (!zp) return null;
          return (
            <path
              key={zp.name}
              d={zp.d}
              stroke={zp.color}
              strokeWidth={2}
              fill="none"
              opacity={0.7}
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
          >
            {idx === currentPlayerIndex && (
              <animate
                attributeName="r"
                values="4;5;4"
                dur="1s"
                repeatCount="indefinite"
              />
            )}
          </circle>
        ))}
      </svg>
    </div>
  );
}
