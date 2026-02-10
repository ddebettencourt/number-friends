import { create } from 'zustand';
import type { GameStats, TurnEvent, MinigameEvent, GameAward } from '../types/stats';
import { computeAwards } from '../utils/statsHelpers';

interface PlayerInfo {
  id: string;
  name: string;
  color: string;
}

interface StatsStore {
  stats: GameStats;
  initStats: () => void;
  recordTurn: (turn: TurnEvent) => void;
  recordMinigame: (event: MinigameEvent) => void;
  finishGame: () => void;
  getAwards: (players: PlayerInfo[]) => GameAward[];
}

const createEmptyStats = (): GameStats => ({
  turns: [],
  minigameEvents: [],
  totalTurns: 0,
  startTime: Date.now(),
  endTime: null,
});

export const useStatsStore = create<StatsStore>((set, get) => ({
  stats: createEmptyStats(),

  initStats: () => {
    set({ stats: createEmptyStats() });
  },

  recordTurn: (turn: TurnEvent) => {
    set((state) => ({
      stats: {
        ...state.stats,
        turns: [...state.stats.turns, turn],
        totalTurns: state.stats.totalTurns + 1,
      },
    }));
  },

  recordMinigame: (event: MinigameEvent) => {
    set((state) => ({
      stats: {
        ...state.stats,
        minigameEvents: [...state.stats.minigameEvents, event],
      },
    }));
  },

  finishGame: () => {
    set((state) => ({
      stats: {
        ...state.stats,
        endTime: Date.now(),
      },
    }));
  },

  getAwards: (players) => {
    return computeAwards(get().stats, players);
  },
}));
