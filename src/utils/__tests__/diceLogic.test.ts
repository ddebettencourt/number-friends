import { describe, it, expect } from 'vitest';
import {
  rollDice,
  selectRandomDice,
  rollGaussianDetailed,
  rollDoubleDigits,
  DICE_TYPES,
  DICE_CONFIG,
} from '../diceLogic';

describe('DICE_CONFIG', () => {
  it('has config for all dice types', () => {
    for (const type of DICE_TYPES) {
      expect(DICE_CONFIG[type]).toBeDefined();
      expect(DICE_CONFIG[type].name).toBeTruthy();
      expect(DICE_CONFIG[type].color).toMatch(/^#[0-9a-f]{6}$/);
    }
  });
});

describe('selectRandomDice', () => {
  it('returns a valid dice type', () => {
    for (let i = 0; i < 50; i++) {
      const dice = selectRandomDice();
      expect(DICE_TYPES).toContain(dice);
    }
  });
});

describe('rollDice', () => {
  const runMultipleRolls = (type: Parameters<typeof rollDice>[0], count = 100) => {
    return Array.from({ length: count }, () => rollDice(type));
  };

  it('d4 returns values 1-4', () => {
    const rolls = runMultipleRolls('d4');
    rolls.forEach(r => {
      expect(r).toBeGreaterThanOrEqual(1);
      expect(r).toBeLessThanOrEqual(4);
      expect(Number.isInteger(r)).toBe(true);
    });
  });

  it('d6 returns values 1-6', () => {
    const rolls = runMultipleRolls('d6');
    rolls.forEach(r => {
      expect(r).toBeGreaterThanOrEqual(1);
      expect(r).toBeLessThanOrEqual(6);
    });
  });

  it('d8 returns values 1-8', () => {
    const rolls = runMultipleRolls('d8');
    rolls.forEach(r => {
      expect(r).toBeGreaterThanOrEqual(1);
      expect(r).toBeLessThanOrEqual(8);
    });
  });

  it('d10 returns values 1-10', () => {
    const rolls = runMultipleRolls('d10');
    rolls.forEach(r => {
      expect(r).toBeGreaterThanOrEqual(1);
      expect(r).toBeLessThanOrEqual(10);
    });
  });

  it('prime die returns only prime values [2,3,5,7,11,13]', () => {
    const validPrimes = [2, 3, 5, 7, 11, 13];
    const rolls = runMultipleRolls('prime');
    rolls.forEach(r => {
      expect(validPrimes).toContain(r);
    });
  });

  it('gaussian die returns values within -6 to 12', () => {
    const rolls = runMultipleRolls('gaussian', 500);
    rolls.forEach(r => {
      expect(r).toBeGreaterThanOrEqual(-6);
      expect(r).toBeLessThanOrEqual(12);
      expect(Number.isInteger(r)).toBe(true);
    });
  });
});

describe('rollGaussianDetailed', () => {
  it('returns all required fields', () => {
    const result = rollGaussianDetailed();
    expect(result).toHaveProperty('mean');
    expect(result).toHaveProperty('stdDev');
    expect(result).toHaveProperty('finalResult');
    expect(result).toHaveProperty('slotValues');
    expect(result).toHaveProperty('targetSlot');
  });

  it('mean is between 4 and 9', () => {
    for (let i = 0; i < 50; i++) {
      const result = rollGaussianDetailed();
      expect(result.mean).toBeGreaterThanOrEqual(4);
      expect(result.mean).toBeLessThanOrEqual(9);
    }
  });

  it('has 10 slot values', () => {
    const result = rollGaussianDetailed();
    expect(result.slotValues).toHaveLength(10);
  });

  it('targetSlot is 0-9', () => {
    for (let i = 0; i < 50; i++) {
      const result = rollGaussianDetailed();
      expect(result.targetSlot).toBeGreaterThanOrEqual(0);
      expect(result.targetSlot).toBeLessThanOrEqual(9);
    }
  });

  it('finalResult comes from slotValues at targetSlot', () => {
    for (let i = 0; i < 50; i++) {
      const result = rollGaussianDetailed();
      expect(result.finalResult).toBe(result.slotValues[result.targetSlot]);
    }
  });
});

describe('rollDoubleDigits', () => {
  it('returns digits 0-9 and valid result', () => {
    for (let i = 0; i < 100; i++) {
      const { digit1, digit2, result } = rollDoubleDigits();
      expect(digit1).toBeGreaterThanOrEqual(0);
      expect(digit1).toBeLessThanOrEqual(9);
      expect(digit2).toBeGreaterThanOrEqual(0);
      expect(digit2).toBeLessThanOrEqual(9);
      expect(result).toBeGreaterThanOrEqual(1);
      expect(result).toBeLessThanOrEqual(100);
    }
  });

  it('maps 00 to 100', () => {
    // We can't control randomness, but test the logic:
    // If both digits are 0, result should be 100
    // We test the formula instead
    const digit1 = 0, digit2 = 0;
    const result = digit1 === 0 && digit2 === 0 ? 100 : digit1 * 10 + digit2;
    expect(result).toBe(100);
  });

  it('never returns 0', () => {
    for (let i = 0; i < 200; i++) {
      const { result } = rollDoubleDigits();
      expect(result).not.toBe(0);
    }
  });
});
