export type DiceType = 'd4' | 'd6' | 'd8' | 'd10' | 'prime' | 'gaussian';

export interface Player {
  id: string;
  name: string;
  color: string;
  position: number;
  avatar: string;
}

export type SpecialSquareType =
  | 'prime'
  | 'twin_prime'
  | 'multiple_of_10'
  | 'fibonacci'
  | 'perfect_square'
  | 'perfect_cube'
  | 'perfect_number'
  | 'abundant';

export interface GameState {
  players: Player[];
  currentPlayerIndex: number;
  phase: GamePhase;
  selectedDice: DiceType | null;
  lastRoll: number | null;
  winner: Player | null;
  activeMinigame: MinigameType | null;
}

export type GamePhase =
  | 'setup'
  | 'rolling'
  | 'moving'
  | 'minigame'
  | 'end_turn'
  | 'game_over';

export type MinigameType =
  | 'prime_off'
  | 'double_digits'
  | 'root_race'
  | 'cube_root'
  | 'prime_blackjack'
  | 'sequence_savant'
  | 'factor_frenzy'
  | 'number_builder'
  | 'final_showdown';

export interface MinigameResult {
  winner: Player | null;
  movement: number;
  description: string;
}

// Chutes and Ladders
export interface BoardConnection {
  from: number;
  to: number;
  type: 'ladder' | 'chute';
}

// Special numbers data
export const PRIMES = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97];
export const TWIN_PRIMES = [3, 5, 7, 11, 13, 17, 19, 29, 31, 41, 43, 59, 61, 71, 73];
export const FIBONACCI = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89];
export const PERFECT_SQUARES = [1, 4, 9, 16, 25, 36, 49, 64, 81, 100];
export const PERFECT_CUBES = [1, 8, 27, 64];
export const MULTIPLES_OF_10 = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
export const PERFECT_NUMBERS = [6, 28];
// Abundant numbers between 1-100 (sum of proper divisors > the number)
export const ABUNDANT_NUMBERS = [12, 18, 20, 24, 30, 36, 40, 42, 48, 54, 56, 60, 66, 70, 72, 78, 80, 84, 88, 90, 96];

export function getSpecialTypes(num: number): SpecialSquareType[] {
  const types: SpecialSquareType[] = [];

  if (PERFECT_NUMBERS.includes(num)) types.push('perfect_number');
  if (PERFECT_CUBES.includes(num)) types.push('perfect_cube');
  if (PERFECT_SQUARES.includes(num)) types.push('perfect_square');
  if (TWIN_PRIMES.includes(num)) types.push('twin_prime');
  if (PRIMES.includes(num)) types.push('prime');
  if (FIBONACCI.includes(num)) types.push('fibonacci');
  if (MULTIPLES_OF_10.includes(num)) types.push('multiple_of_10');
  if (ABUNDANT_NUMBERS.includes(num)) types.push('abundant');

  return types;
}

export function getPrimarySpecialType(num: number): SpecialSquareType | null {
  const types = getSpecialTypes(num);
  return types.length > 0 ? types[0] : null;
}
