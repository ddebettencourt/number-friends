import type { DiceType } from '../types/game';

export const DICE_TYPES: DiceType[] = ['d4', 'd6', 'd8', 'd10', 'prime', 'gaussian'];

export const DICE_CONFIG: Record<DiceType, { name: string; description: string; color: string }> = {
  d4: { name: 'D4', description: '4-sided die (1-4)', color: '#ef4444' },
  d6: { name: 'D6', description: 'Standard die (1-6)', color: '#3b82f6' },
  d8: { name: 'D8', description: '8-sided die (1-8)', color: '#22c55e' },
  d10: { name: 'D10', description: '10-sided die (1-10)', color: '#eab308' },
  prime: { name: 'Prime', description: 'Prime die (2,3,5,7,11,13)', color: '#a855f7' },
  gaussian: { name: 'Gaussian', description: 'Bell curve distribution', color: '#ec4899' },
};

export function selectRandomDice(): DiceType {
  return DICE_TYPES[Math.floor(Math.random() * DICE_TYPES.length)];
}

export function rollDice(type: DiceType): number {
  switch (type) {
    case 'd4':
      return Math.floor(Math.random() * 4) + 1;
    case 'd6':
      return Math.floor(Math.random() * 6) + 1;
    case 'd8':
      return Math.floor(Math.random() * 8) + 1;
    case 'd10':
      return Math.floor(Math.random() * 10) + 1;
    case 'prime':
      const primes = [2, 3, 5, 7, 11, 13];
      return primes[Math.floor(Math.random() * primes.length)];
    case 'gaussian':
      return rollGaussian();
    default:
      return 1;
  }
}

function rollGaussian(): number {
  // Generate Gaussian params matching GaussianRoller component
  const mean = Math.floor(Math.random() * 6) + 4; // 4-9
  const stdDev = 2 + Math.random() * 2; // 2-4

  // Calculate slot values (10 slots) - matching GaussianRoller
  const slotValues: number[] = [];
  for (let i = 0; i < 10; i++) {
    const zScore = (i - 4.5) / 2;
    const value = Math.round(mean + zScore * stdDev);
    slotValues.push(Math.max(-6, Math.min(12, value)));
  }

  // Use Box-Muller to pick a slot (biased towards center like plinko)
  const random1 = Math.random();
  const random2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(random1)) * Math.cos(2 * Math.PI * random2);
  const targetSlot = Math.max(0, Math.min(9, Math.round(4.5 + z * 1.5)));

  return slotValues[targetSlot];
}

export function rollGaussianDetailed(): {
  meanRoll1: number;
  meanRoll2: number;
  stdDevRoll: number;
  mean: number;
  stdDev: number;
  finalResult: number;
  slotValues: number[];
  targetSlot: number;
} {
  // Generate params matching GaussianRoller component
  const mean = Math.floor(Math.random() * 6) + 4; // 4-9
  const stdDev = 2 + Math.random() * 2; // 2-4

  // For display compatibility, generate "roll" values
  const meanRoll1 = Math.floor(mean / 2);
  const meanRoll2 = Math.ceil(mean / 2);
  const stdDevRoll = Math.round(stdDev);

  // Calculate slot values (10 slots) - matching GaussianRoller
  const slotValues: number[] = [];
  for (let i = 0; i < 10; i++) {
    const zScore = (i - 4.5) / 2;
    const value = Math.round(mean + zScore * stdDev);
    slotValues.push(Math.max(-6, Math.min(12, value)));
  }

  // Use Box-Muller to pick a slot (biased towards center like plinko)
  const random1 = Math.random();
  const random2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(random1)) * Math.cos(2 * Math.PI * random2);
  const targetSlot = Math.max(0, Math.min(9, Math.round(4.5 + z * 1.5)));

  const finalResult = slotValues[targetSlot];

  return { meanRoll1, meanRoll2, stdDevRoll, mean, stdDev, finalResult, slotValues, targetSlot };
}

// Roll two d10 for the "multiple of 10" teleport
export function rollDoubleDigits(): { digit1: number; digit2: number; result: number } {
  const digit1 = Math.floor(Math.random() * 10); // 0-9 for tens place
  const digit2 = Math.floor(Math.random() * 10); // 0-9 for ones place

  // 00 = 100, otherwise combine digits
  const result = digit1 === 0 && digit2 === 0 ? 100 : digit1 * 10 + digit2;

  return { digit1, digit2, result: result === 0 ? 100 : result };
}
