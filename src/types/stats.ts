import type { DiceType, MinigameType } from './game';

// ── Turn-Level Event ──

export interface TurnEvent {
  turnNumber: number;
  playerId: string;
  diceType: DiceType;
  rollValue: number;
  positionBefore: number;
  positionAfter: number;
  landedOnSpecial: boolean;
  specialSquareType: string | null;
  triggeredMinigame: MinigameType | null;
}

// ── Minigame Event ──

export interface MinigameEvent {
  turnNumber: number;
  triggeringPlayerId: string;
  minigameType: MinigameType;
  data: MinigameStatData;
}

// ── Discriminated union for minigame-specific stats ──

export type MinigameStatData =
  | PrimeOffStats
  | PrimeBlackjackStats
  | DoubleDigitsStats
  | RootRaceStats
  | FactorFrenzyStats
  | SequenceSavantStats
  | NumberBuilderStats
  | FinalShowdownStats;

export interface PrimeOffStats {
  type: 'prime_off';
  sharedAnswer: number;
  playerResults: Array<{
    playerId: string;
    time: number | null;
    correct: boolean;
  }>;
}

export interface PrimeBlackjackStats {
  type: 'prime_blackjack';
  playerResults: Array<{
    playerId: string;
    cards: number[];
    sum: number;
    busted: boolean;
    sumIsPrime: boolean;
  }>;
}

export interface DoubleDigitsStats {
  type: 'double_digits';
  playerId: string;
  digit1: number;
  digit2: number;
  resultPosition: number;
  positionBefore: number;
  delta: number;
  skipped: boolean;
}

export interface RootRaceStats {
  type: 'root_race' | 'cube_root';
  challengeNumber: number;
  correctRoot: number;
  playerResults: Array<{
    playerId: string;
    guess: number | null;
    difference: number | null;
  }>;
}

export interface FactorFrenzyStats {
  type: 'factor_frenzy';
  targetNumber: number;
  totalFactors: number;
  playerResults: Array<{
    playerId: string;
    score: number;
    correctTaps: number;
    wrongTaps: number;
  }>;
}

export interface SequenceSavantStats {
  type: 'sequence_savant';
  sequenceType: string;
  correctAnswer: number;
  playerResults: Array<{
    playerId: string;
    guess: number | null;
    correct: boolean;
    timeToAnswer: number | null;
  }>;
}

export interface NumberBuilderStats {
  type: 'number_builder';
  target: number;
  availableNumbers: number[];
  playerResults: Array<{
    playerId: string;
    expression: string;
    result: number;
    difference: number;
  }>;
}

export interface FinalShowdownStats {
  type: 'final_showdown';
  challengeNumber: number;
  correctRoot: number;
  playerId: string;
  guess: string;
  correct: boolean;
  timeRemaining: number;
}

// ── Computed Award ──

export interface GameAward {
  id: string;
  title: string;
  subtitle: string;
  playerId: string;
  playerName: string;
  icon: string;
  value: string;
  color: string;
}

// ── Full Game Stats ──

export interface GameStats {
  turns: TurnEvent[];
  minigameEvents: MinigameEvent[];
  totalTurns: number;
  startTime: number;
  endTime: number | null;
}
