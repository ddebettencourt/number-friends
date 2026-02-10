import { create } from 'zustand';
import type { Player, GamePhase, DiceType, MinigameType } from '../types/game';
import { getPrimarySpecialType } from '../types/game';
import { selectRandomDice, rollDice } from '../utils/diceLogic';
import { calculateFinalPosition } from '../utils/boardHelpers';
import { useStatsStore } from './statsStore';

export type AIDifficulty = 'easy' | 'medium' | 'hard';

interface AIPlayer {
  name: string;
  difficulty: AIDifficulty;
}

interface GameStore {
  // Game state
  players: Player[];
  currentPlayerIndex: number;
  phase: GamePhase;
  selectedDice: DiceType | null;
  lastRoll: number | null;
  winner: Player | null;
  activeMinigame: MinigameType | null;
  pendingPosition: number | null;

  // AI tracking
  aiPlayers: Map<string, AIDifficulty>; // player id -> difficulty

  // Tutorial tracking
  seenTutorials: Set<MinigameType>;

  // Actions
  initGame: (playerNames: string[], aiPlayers?: AIPlayer[]) => void;
  rollForDice: () => void;
  rollSelectedDice: () => void;
  movePlayer: () => void;
  startMinigame: (type: MinigameType) => void;
  endMinigame: (movement: number) => void;
  endTurn: () => void;
  resetGame: () => void;
  setPhase: (phase: GamePhase) => void;
  markTutorialSeen: (type: MinigameType) => void;
  skipToPosition: (position: number) => void;
  isCurrentPlayerAI: () => boolean;
  getCurrentPlayerAIDifficulty: () => AIDifficulty | null;
  setRollResult: (roll: number) => void;
  setSelectedDice: (dice: DiceType) => void;
}

const PLAYER_COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#eab308'];
const PLAYER_AVATARS = ['🦊', '🐸', '🦋', '🐙'];

export const useGameStore = create<GameStore>((set, get) => ({
  players: [],
  currentPlayerIndex: 0,
  phase: 'setup',
  selectedDice: null,
  lastRoll: null,
  winner: null,
  activeMinigame: null,
  pendingPosition: null,
  aiPlayers: new Map(),
  seenTutorials: new Set(),

  initGame: (playerNames: string[], aiPlayerConfigs?: AIPlayer[]) => {
    const aiMap = new Map<string, AIDifficulty>();

    // Create human players
    const players: Player[] = playerNames.map((name, index) => ({
      id: `player-${index}`,
      name,
      color: PLAYER_COLORS[index],
      position: 1,
      avatar: PLAYER_AVATARS[index],
    }));

    // Add AI players
    if (aiPlayerConfigs) {
      aiPlayerConfigs.forEach((ai, index) => {
        const playerIndex = players.length;
        const playerId = `ai-${index}`;
        players.push({
          id: playerId,
          name: ai.name,
          color: PLAYER_COLORS[playerIndex],
          position: 1,
          avatar: '🤖',
        });
        aiMap.set(playerId, ai.difficulty);
      });
    }

    set({
      players,
      currentPlayerIndex: 0,
      phase: 'rolling',
      selectedDice: null,
      lastRoll: null,
      winner: null,
      activeMinigame: null,
      pendingPosition: null,
      aiPlayers: aiMap,
    });

    useStatsStore.getState().initStats();
  },

  rollForDice: () => {
    const dice = selectRandomDice();
    set({ selectedDice: dice });
  },

  rollSelectedDice: () => {
    const { selectedDice } = get();
    if (!selectedDice) return;

    const roll = rollDice(selectedDice);
    // Keep phase as 'rolling' - will change to 'moving' when user clicks Move
    set({ lastRoll: roll });
  },

  movePlayer: () => {
    const { players, currentPlayerIndex, lastRoll, phase } = get();
    if (lastRoll === null) return;

    // First call: transition to 'moving' phase to show animation
    if (phase === 'rolling') {
      set({ phase: 'moving' });
      return;
    }

    // Second call (from useEffect): actually move the player
    const currentPlayer = players[currentPlayerIndex];
    const { selectedDice } = get();
    let newPosition = calculateFinalPosition(currentPlayer.position, lastRoll);

    // Catch-up mechanic: bonus squares when 30+ behind the leader
    const leaderPosition = Math.max(...players.map(p => p.position));
    const gap = leaderPosition - currentPlayer.position;
    if (gap >= 30 && lastRoll > 0) {
      const bonus = Math.min(3, Math.floor((gap - 30) / 10) + 1);
      newPosition = calculateFinalPosition(newPosition, bonus);
    }

    // Update player position
    const updatedPlayers = [...players];
    updatedPlayers[currentPlayerIndex] = {
      ...currentPlayer,
      position: newPosition,
    };

    // Check for special square
    const specialType = getPrimarySpecialType(newPosition);
    let minigame: MinigameType | null = null;

    // Check for win
    if (newPosition === 100) {
      minigame = 'final_showdown';
    } else if (specialType) {
      // Twin prime has 50% chance of either Prime-Off or Prime Blackjack
      const twinPrimeGame = Math.random() < 0.5 ? 'prime_off' : 'prime_blackjack';

      const minigameMap: Record<string, MinigameType> = {
        prime: 'prime_off',
        twin_prime: twinPrimeGame,
        multiple_of_10: 'double_digits',
        fibonacci: 'sequence_savant',
        perfect_square: 'root_race',
        perfect_cube: 'cube_root',
        perfect_number: 'factor_frenzy',
        abundant: 'number_builder',
      };

      minigame = minigameMap[specialType] ?? null;
    }

    // Record turn stats
    useStatsStore.getState().recordTurn({
      turnNumber: useStatsStore.getState().stats.totalTurns,
      playerId: currentPlayer.id,
      diceType: selectedDice!,
      rollValue: lastRoll,
      positionBefore: currentPlayer.position,
      positionAfter: newPosition,
      landedOnSpecial: !!specialType || newPosition === 100,
      specialSquareType: specialType || (newPosition === 100 ? 'final' : null),
      triggeredMinigame: minigame,
    });

    if (newPosition === 100) {
      set({
        players: updatedPlayers,
        phase: 'minigame',
        activeMinigame: 'final_showdown',
        pendingPosition: newPosition,
      });
      return;
    }

    if (minigame) {
      set({
        players: updatedPlayers,
        phase: 'minigame',
        activeMinigame: minigame,
        pendingPosition: newPosition,
      });
      return;
    }

    set({
      players: updatedPlayers,
      phase: 'end_turn',
      pendingPosition: null,
    });
  },

  startMinigame: (type: MinigameType) => {
    set({ activeMinigame: type, phase: 'minigame' });
  },

  endMinigame: (movement: number) => {
    const { players, currentPlayerIndex, activeMinigame } = get();

    // Handle final showdown
    if (activeMinigame === 'final_showdown') {
      if (movement > 0) {
        // Won the final showdown!
        useStatsStore.getState().finishGame();
        set({
          phase: 'game_over',
          winner: players[currentPlayerIndex],
          activeMinigame: null,
        });
      } else {
        // Lost, move back
        const updatedPlayers = [...players];
        updatedPlayers[currentPlayerIndex] = {
          ...players[currentPlayerIndex],
          position: Math.max(1, 100 - 5),
        };
        set({
          players: updatedPlayers,
          phase: 'end_turn',
          activeMinigame: null,
          pendingPosition: null,
        });
      }
      return;
    }

    // Normal minigame end
    const currentPlayer = players[currentPlayerIndex];
    const newPosition = Math.min(100, Math.max(1, currentPlayer.position + movement));

    // Check for win after minigame movement
    if (newPosition === 100) {
      set({
        phase: 'minigame',
        activeMinigame: 'final_showdown',
        pendingPosition: newPosition,
      });
      return;
    }

    const updatedPlayers = [...players];
    updatedPlayers[currentPlayerIndex] = {
      ...currentPlayer,
      position: newPosition,
    };

    set({
      players: updatedPlayers,
      phase: 'end_turn',
      activeMinigame: null,
      pendingPosition: null,
    });
  },

  endTurn: () => {
    const { players, currentPlayerIndex } = get();
    const nextPlayerIndex = (currentPlayerIndex + 1) % players.length;

    set({
      currentPlayerIndex: nextPlayerIndex,
      phase: 'rolling',
      selectedDice: null,
      lastRoll: null,
      activeMinigame: null,
    });
  },

  resetGame: () => {
    set({
      players: [],
      currentPlayerIndex: 0,
      phase: 'setup',
      selectedDice: null,
      lastRoll: null,
      winner: null,
      activeMinigame: null,
      pendingPosition: null,
      aiPlayers: new Map(),
    });
  },

  setPhase: (phase: GamePhase) => {
    set({ phase });
  },

  markTutorialSeen: (type: MinigameType) => {
    const { seenTutorials } = get();
    const updated = new Set(seenTutorials);
    updated.add(type);
    set({ seenTutorials: updated });
  },

  skipToPosition: (position: number) => {
    const { players, currentPlayerIndex } = get();
    const updatedPlayers = [...players];
    updatedPlayers[currentPlayerIndex] = {
      ...players[currentPlayerIndex],
      position,
    };
    set({ players: updatedPlayers });
  },

  isCurrentPlayerAI: () => {
    const { players, currentPlayerIndex, aiPlayers } = get();
    const currentPlayer = players[currentPlayerIndex];
    return currentPlayer ? aiPlayers.has(currentPlayer.id) : false;
  },

  getCurrentPlayerAIDifficulty: () => {
    const { players, currentPlayerIndex, aiPlayers } = get();
    const currentPlayer = players[currentPlayerIndex];
    return currentPlayer ? aiPlayers.get(currentPlayer.id) || null : null;
  },

  setRollResult: (roll: number) => {
    set({ lastRoll: roll, phase: 'moving' });
  },

  setSelectedDice: (dice: DiceType) => {
    set({ selectedDice: dice });
  },
}));
