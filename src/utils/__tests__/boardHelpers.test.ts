import { describe, it, expect } from 'vitest';
import {
  positionToCoords,
  coordsToPosition,
  getSquareCenter,
  getConnectionDestination,
  getPath,
  calculateFinalPosition,
  DEFAULT_CONNECTIONS,
} from '../boardHelpers';

describe('positionToCoords', () => {
  it('maps position 1 to bottom-left', () => {
    expect(positionToCoords(1)).toEqual({ row: 9, col: 0 });
  });

  it('maps position 10 to bottom-right', () => {
    expect(positionToCoords(10)).toEqual({ row: 9, col: 9 });
  });

  it('maps position 11 to second row right (snake reversal)', () => {
    expect(positionToCoords(11)).toEqual({ row: 8, col: 9 });
  });

  it('maps position 20 to second row left', () => {
    expect(positionToCoords(20)).toEqual({ row: 8, col: 0 });
  });

  it('maps position 100 to top-left', () => {
    expect(positionToCoords(100)).toEqual({ row: 0, col: 0 });
  });

  it('maps position 91 to top-right (top row is odd, reversed)', () => {
    expect(positionToCoords(91)).toEqual({ row: 0, col: 9 });
  });

  it('handles middle of board', () => {
    // Position 50: row = floor(49/10) = 4 (odd, so reversed), col = 9 - (49 % 10) = 9 - 9 = 0
    // Wait: 49 % 10 = 9, row 4 is even, so col = 9. Display row = 9 - 4 = 5
    // Actually row 4 is even (0-indexed), so col = colInRow = 9
    expect(positionToCoords(50)).toEqual({ row: 5, col: 9 });
  });
});

describe('coordsToPosition', () => {
  it('is inverse of positionToCoords for all positions', () => {
    for (let pos = 1; pos <= 100; pos++) {
      const { row, col } = positionToCoords(pos);
      expect(coordsToPosition(row, col)).toBe(pos);
    }
  });
});

describe('getSquareCenter', () => {
  it('returns percentage-based center for position 1', () => {
    const center = getSquareCenter(1);
    expect(center.x).toBe(5);
    expect(center.y).toBe(95);
  });

  it('returns percentage-based center for position 100', () => {
    const center = getSquareCenter(100);
    expect(center.x).toBe(5);
    expect(center.y).toBe(5);
  });
});

describe('getConnectionDestination', () => {
  it('returns destination for a ladder', () => {
    expect(getConnectionDestination(4)).toBe(14);
  });

  it('returns destination for a chute', () => {
    expect(getConnectionDestination(95)).toBe(78);
  });

  it('returns null for position without connection', () => {
    expect(getConnectionDestination(1)).toBeNull();
    expect(getConnectionDestination(50)).toBeNull();
  });

  it('uses custom connections when provided', () => {
    const custom = [{ from: 5, to: 50, type: 'ladder' as const }];
    expect(getConnectionDestination(5, custom)).toBe(50);
    expect(getConnectionDestination(4, custom)).toBeNull();
  });

  it('has ladder and chute connections defined', () => {
    const ladders = DEFAULT_CONNECTIONS.filter(c => c.type === 'ladder');
    const chutes = DEFAULT_CONNECTIONS.filter(c => c.type === 'chute');
    expect(ladders.length).toBeGreaterThan(0);
    expect(chutes.length).toBeGreaterThan(0);
    // Ladders go up
    ladders.forEach(l => expect(l.to).toBeGreaterThan(l.from));
    // Chutes go down
    chutes.forEach(c => expect(c.to).toBeLessThan(c.from));
  });
});

describe('getPath', () => {
  it('returns ascending path', () => {
    expect(getPath(1, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it('returns descending path', () => {
    expect(getPath(5, 1)).toEqual([5, 4, 3, 2, 1]);
  });

  it('returns single-element path when from equals to', () => {
    expect(getPath(3, 3)).toEqual([3]);
  });
});

describe('calculateFinalPosition', () => {
  it('moves forward normally', () => {
    expect(calculateFinalPosition(1, 6)).toBe(7);
    expect(calculateFinalPosition(50, 3)).toBe(53);
  });

  it('bounces back when roll would exceed 100', () => {
    expect(calculateFinalPosition(98, 5)).toBe(97); // 103 → bounces to 97
    expect(calculateFinalPosition(99, 3)).toBe(98); // 102 → bounces to 98
    expect(calculateFinalPosition(97, 6)).toBe(97); // 103 → bounces to 97
  });

  it('allows landing exactly on 100', () => {
    expect(calculateFinalPosition(95, 5)).toBe(100);
    expect(calculateFinalPosition(99, 1)).toBe(100);
  });

  it('handles roll of 0', () => {
    expect(calculateFinalPosition(50, 0)).toBe(50);
  });

  it('floors at position 1 for negative rolls (Gaussian die)', () => {
    expect(calculateFinalPosition(3, -5)).toBe(1);
    expect(calculateFinalPosition(1, -6)).toBe(1);
  });
});
