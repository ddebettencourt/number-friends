import type { BoardConnection } from '../types/game';

// Convert board position (1-100) to row and column
// Board snakes: row 1 is left-to-right, row 2 right-to-left, etc.
export function positionToCoords(position: number): { row: number; col: number } {
  const adjustedPos = position - 1; // 0-indexed
  const row = Math.floor(adjustedPos / 10);
  const colInRow = adjustedPos % 10;

  // Even rows (0, 2, 4...) go left-to-right
  // Odd rows (1, 3, 5...) go right-to-left
  const col = row % 2 === 0 ? colInRow : 9 - colInRow;

  // Flip rows so 100 is at top (row 0 in display is row 9 in our calculation)
  const displayRow = 9 - row;

  return { row: displayRow, col };
}

// Convert grid coordinates to board position
export function coordsToPosition(row: number, col: number): number {
  const actualRow = 9 - row; // Flip back
  const colInRow = actualRow % 2 === 0 ? col : 9 - col;
  return actualRow * 10 + colInRow + 1;
}

// Get visual coordinates for rendering (percentage-based)
export function getSquareCenter(position: number): { x: number; y: number } {
  const { row, col } = positionToCoords(position);
  // Each cell is 10% of the board
  const x = col * 10 + 5; // Center of cell
  const y = row * 10 + 5;
  return { x, y };
}

// Default chutes and ladders configuration
export const DEFAULT_CONNECTIONS: BoardConnection[] = [
  // Ladders (go up)
  { from: 4, to: 14, type: 'ladder' },
  { from: 12, to: 46, type: 'ladder' },
  { from: 24, to: 44, type: 'ladder' },
  { from: 38, to: 57, type: 'ladder' },
  { from: 52, to: 72, type: 'ladder' },
  { from: 76, to: 94, type: 'ladder' },

  // Chutes (go down)
  { from: 15, to: 3, type: 'chute' },
  { from: 35, to: 22, type: 'chute' },
  { from: 48, to: 26, type: 'chute' },
  { from: 63, to: 45, type: 'chute' },
  { from: 88, to: 69, type: 'chute' },
  { from: 95, to: 78, type: 'chute' },
];

// Check if a position has a connection and return destination
export function getConnectionDestination(
  position: number,
  connections: BoardConnection[] = DEFAULT_CONNECTIONS
): number | null {
  const connection = connections.find(c => c.from === position);
  return connection ? connection.to : null;
}

// Get path between two positions for animation
export function getPath(from: number, to: number): number[] {
  const path: number[] = [];
  if (from < to) {
    for (let i = from; i <= to; i++) {
      path.push(i);
    }
  } else {
    for (let i = from; i >= to; i--) {
      path.push(i);
    }
  }
  return path;
}

// Check if movement would exceed 100 - must land exactly on 100
export function calculateFinalPosition(current: number, roll: number): number {
  const destination = current + roll;
  if (destination > 100) {
    // Bounce back from 100 (e.g., 98 + 5 = 103 → bounces to 97)
    return 100 - (destination - 100);
  }
  if (destination < 1) {
    // Floor at position 1 (Gaussian die can roll negative)
    return 1;
  }
  return destination;
}
