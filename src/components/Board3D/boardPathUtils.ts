import type { Vector3Tuple } from 'three';
import { getZoneForSquare, getElevationForSquare } from './zoneConfig';

// Generate a serpentine/switchback path that climbs through 5 zones
// Path goes left-to-right for 20 squares, curves back right-to-left, repeats
export function generateBoardPath(numSquares: number): Vector3Tuple[] {
  const positions: Vector3Tuple[] = [];

  const boardWidth = 18; // total X extent
  const rowDepth = 5; // Z spacing between rows

  for (let i = 0; i < numSquares; i++) {
    const zoneIndex = Math.floor(i / 20);
    const posInZone = i % 20;
    const zoneProgress = posInZone / 19; // 0 to 1 within the zone

    // Serpentine: even zones go left-to-right, odd zones go right-to-left
    const goingRight = zoneIndex % 2 === 0;
    const xProgress = goingRight ? zoneProgress : 1 - zoneProgress;

    // X position: -halfWidth to +halfWidth with sine wobble
    const halfWidth = boardWidth / 2;
    const wobble = Math.sin(zoneProgress * Math.PI * 3) * 0.4;
    const x = -halfWidth + xProgress * boardWidth + wobble;

    // Z position: each zone is one row, going forward (negative Z)
    const baseZ = -zoneIndex * rowDepth;
    // Slight sine wave for organic feel within the row
    const zWobble = Math.sin(zoneProgress * Math.PI * 2) * 0.6;
    const z = baseZ + zWobble;

    // Y position: follows zone elevation with smooth interpolation
    const y = getElevationForSquare(i + 1);

    positions.push([x, y, z]);
  }

  return positions;
}

// Get color for a square based on its number - now zone-aware
export function getSquareColor(squareNumber: number): string {
  // Special squares get special colors
  if (squareNumber === 1) return '#5FAD56'; // Start - green
  if (squareNumber === 100) return '#FFD93D'; // End - gold

  // Check for special math properties
  if (isPrime(squareNumber)) return '#61dafb'; // Prime - cyan
  if (isPerfectSquare(squareNumber)) return '#c678dd'; // Perfect square - purple
  if (isFibonacci(squareNumber)) return '#98ec65'; // Fibonacci - lime
  if (squareNumber % 10 === 0) return '#ff9f43'; // Multiple of 10 - orange

  // Use zone tile color as base, with hue variation
  const zone = getZoneForSquare(squareNumber);
  return zone.tileColor;
}

// Math helper functions
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
