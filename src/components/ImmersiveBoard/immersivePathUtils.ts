import type { Vector3Tuple } from 'three';
import { getZoneForSquare } from '../Board3D/zoneConfig';

// Zone center positions in world space
const ZONE_CENTERS: Vector3Tuple[] = [
  [0, 0, 0],         // Green Meadow
  [55, -2, -12],     // Crystal Caves
  [115, 3, 5],       // Volcanic Ridge
  [170, 12, -8],     // Sky Islands
  [220, 18, 0],      // The Summit
];

// Generate a tile position within a specific zone
function generateZoneTilePosition(
  zoneIdx: number,
  tileInZone: number,
  totalInZone: number,
  center: Vector3Tuple
): Vector3Tuple {
  const progress = tileInZone / (totalInZone - 1); // 0 to 1

  switch (zoneIdx) {
    case 0: {
      // Meadow: gentle winding S-curve path
      const x = center[0] + (progress * 40) - 20;
      const y = center[1] + Math.sin(progress * Math.PI) * 0.8 + progress * 0.5;
      const z = center[2] + Math.sin(progress * Math.PI * 2.5) * 8;
      return [x, y, z];
    }

    case 1: {
      // Caves: inward spiral descent
      const angle = progress * Math.PI * 1.8 + Math.PI * 0.3;
      const radius = 14 - progress * 8;
      const x = center[0] + Math.cos(angle) * radius;
      const y = center[1] - progress * 4;
      const z = center[2] + Math.sin(angle) * radius;
      return [x, y, z];
    }

    case 2: {
      // Volcanic: zigzag ridge climb
      const x = center[0] + (progress * 38) - 19;
      const y = center[1] + progress * 6 + Math.sin(progress * Math.PI * 4) * 1.2;
      const z = center[2] + Math.sin(progress * Math.PI * 5) * 7;
      return [x, y, z];
    }

    case 3: {
      // Sky Islands: island hopping with dramatic Y variation
      const x = center[0] + (progress * 35) - 17;
      const y = center[1] + Math.sin(progress * Math.PI * 3) * 4 + progress * 3;
      const z = center[2] + Math.cos(progress * Math.PI * 3.5) * 9;
      return [x, y, z];
    }

    case 4: {
      // Summit: spiral ascent to peak (wider spiral so end tiles aren't bunched)
      const angle = progress * Math.PI * 1.8;
      const radius = 12 * (1 - progress * 0.55);
      const x = center[0] + Math.cos(angle) * radius;
      const y = center[1] + progress * 10;
      const z = center[2] + Math.sin(angle) * radius;
      return [x, y, z];
    }

    default:
      return center;
  }
}

// Generate the full immersive board path
export function generateImmersivePath(numSquares: number): Vector3Tuple[] {
  const positions: Vector3Tuple[] = [];
  const squaresPerZone = numSquares / 5;

  for (let i = 0; i < numSquares; i++) {
    const zoneIdx = Math.min(4, Math.floor(i / squaresPerZone));
    const tileInZone = i % squaresPerZone;
    const center = ZONE_CENTERS[zoneIdx];

    positions.push(
      generateZoneTilePosition(zoneIdx, tileInZone, squaresPerZone, center)
    );
  }

  return positions;
}

// Square color based on math properties - reuses zone config
export function getImmersiveSquareColor(squareNumber: number): string {
  if (squareNumber === 1) return '#5FAD56';
  if (squareNumber === 100) return '#FFD93D';

  if (isPrime(squareNumber)) return '#61dafb';
  if (isPerfectSquare(squareNumber)) return '#c678dd';
  if (isFibonacci(squareNumber)) return '#98ec65';
  if (squareNumber % 10 === 0) return '#ff9f43';

  const zone = getZoneForSquare(squareNumber);
  return zone.tileColor;
}

function isPrime(n: number): boolean {
  if (n < 2) return false;
  if (n === 2) return true;
  if (n % 2 === 0) return false;
  for (let i = 3; i <= Math.sqrt(n); i += 2) {
    if (n % i === 0) return false;
  }
  return true;
}

function isPerfectSquare(n: number): boolean {
  const sqrt = Math.sqrt(n);
  return sqrt === Math.floor(sqrt);
}

function isFibonacci(n: number): boolean {
  const fibs = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89];
  return fibs.includes(n);
}
