import { describe, it, expect } from 'vitest';
import {
  getSpecialTypes,
  getPrimarySpecialType,
  PRIMES,
  FIBONACCI,
  PERFECT_SQUARES,
  PERFECT_CUBES,
  MULTIPLES_OF_10,
  PERFECT_NUMBERS,
  ABUNDANT_NUMBERS,
} from '../game';

describe('getSpecialTypes', () => {
  it('identifies 6 as perfect_number', () => {
    const types = getSpecialTypes(6);
    expect(types).toContain('perfect_number');
  });

  it('identifies 28 as perfect_number', () => {
    const types = getSpecialTypes(28);
    expect(types).toContain('perfect_number');
  });

  it('identifies 5 as twin_prime, prime, and fibonacci', () => {
    const types = getSpecialTypes(5);
    expect(types).toContain('twin_prime');
    expect(types).toContain('prime');
    expect(types).toContain('fibonacci');
  });

  it('identifies 64 as perfect_square and perfect_cube', () => {
    const types = getSpecialTypes(64);
    expect(types).toContain('perfect_square');
    expect(types).toContain('perfect_cube');
  });

  it('identifies 100 as perfect_square and multiple_of_10', () => {
    const types = getSpecialTypes(100);
    expect(types).toContain('perfect_square');
    expect(types).toContain('multiple_of_10');
  });

  it('identifies 12 as abundant', () => {
    const types = getSpecialTypes(12);
    expect(types).toContain('abundant');
  });

  it('returns empty array for plain numbers', () => {
    // 14 is not prime, not fibonacci, not a perfect square/cube, not a multiple of 10
    // not a perfect number, not abundant
    expect(getSpecialTypes(14)).toEqual([]);
    expect(getSpecialTypes(15)).toEqual([]);
  });

  it('all primes are classified', () => {
    PRIMES.forEach(p => {
      const types = getSpecialTypes(p);
      expect(types.includes('prime') || types.includes('twin_prime')).toBe(true);
    });
  });

  it('all fibonacci numbers are classified', () => {
    FIBONACCI.forEach(f => {
      expect(getSpecialTypes(f)).toContain('fibonacci');
    });
  });

  it('all perfect squares are classified', () => {
    PERFECT_SQUARES.forEach(ps => {
      expect(getSpecialTypes(ps)).toContain('perfect_square');
    });
  });

  it('all perfect cubes are classified', () => {
    PERFECT_CUBES.forEach(pc => {
      expect(getSpecialTypes(pc)).toContain('perfect_cube');
    });
  });

  it('all multiples of 10 are classified', () => {
    MULTIPLES_OF_10.forEach(m => {
      expect(getSpecialTypes(m)).toContain('multiple_of_10');
    });
  });

  it('all perfect numbers are classified', () => {
    PERFECT_NUMBERS.forEach(pn => {
      expect(getSpecialTypes(pn)).toContain('perfect_number');
    });
  });

  it('all abundant numbers are classified', () => {
    ABUNDANT_NUMBERS.forEach(an => {
      expect(getSpecialTypes(an)).toContain('abundant');
    });
  });
});

describe('getPrimarySpecialType', () => {
  it('returns first special type for multi-type squares', () => {
    // 6 is perfect_number (checked first in priority order)
    expect(getPrimarySpecialType(6)).toBe('perfect_number');
  });

  it('returns null for plain squares', () => {
    expect(getPrimarySpecialType(14)).toBeNull();
    expect(getPrimarySpecialType(15)).toBeNull();
  });

  it('returns a type for every special square', () => {
    for (let i = 1; i <= 100; i++) {
      const types = getSpecialTypes(i);
      const primary = getPrimarySpecialType(i);
      if (types.length > 0) {
        expect(primary).toBe(types[0]);
      } else {
        expect(primary).toBeNull();
      }
    }
  });
});
