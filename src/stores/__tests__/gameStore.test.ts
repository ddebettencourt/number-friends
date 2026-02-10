import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '../gameStore';

describe('gameStore', () => {
  beforeEach(() => {
    useGameStore.getState().resetGame();
  });

  describe('initGame', () => {
    it('creates human players with correct properties', () => {
      useGameStore.getState().initGame(['Alice', 'Bob']);
      const { players, phase, currentPlayerIndex } = useGameStore.getState();

      expect(players).toHaveLength(2);
      expect(players[0].name).toBe('Alice');
      expect(players[1].name).toBe('Bob');
      expect(players[0].position).toBe(1);
      expect(players[1].position).toBe(1);
      expect(phase).toBe('rolling');
      expect(currentPlayerIndex).toBe(0);
    });

    it('creates AI players alongside human players', () => {
      useGameStore.getState().initGame(['Alice'], [
        { name: 'Bot', difficulty: 'medium' },
      ]);
      const { players, aiPlayers } = useGameStore.getState();

      expect(players).toHaveLength(2);
      expect(players[1].name).toBe('Bot');
      expect(aiPlayers.has(players[1].id)).toBe(true);
      expect(aiPlayers.get(players[1].id)).toBe('medium');
    });

    it('assigns different colors and avatars', () => {
      useGameStore.getState().initGame(['A', 'B', 'C']);
      const { players } = useGameStore.getState();

      const colors = new Set(players.map(p => p.color));
      expect(colors.size).toBe(3);
    });
  });

  describe('rollForDice', () => {
    it('selects a dice type', () => {
      useGameStore.getState().initGame(['Alice']);
      useGameStore.getState().rollForDice();

      const { selectedDice } = useGameStore.getState();
      expect(selectedDice).not.toBeNull();
    });
  });

  describe('rollSelectedDice', () => {
    it('sets lastRoll when dice is selected', () => {
      useGameStore.getState().initGame(['Alice']);
      useGameStore.getState().setSelectedDice('d6');
      useGameStore.getState().rollSelectedDice();

      const { lastRoll } = useGameStore.getState();
      expect(lastRoll).not.toBeNull();
      expect(lastRoll).toBeGreaterThanOrEqual(1);
      expect(lastRoll).toBeLessThanOrEqual(6);
    });

    it('does nothing without selected dice', () => {
      useGameStore.getState().initGame(['Alice']);
      useGameStore.getState().rollSelectedDice();

      expect(useGameStore.getState().lastRoll).toBeNull();
    });
  });

  describe('movePlayer', () => {
    it('transitions from rolling to moving phase on first call', () => {
      useGameStore.getState().initGame(['Alice']);
      useGameStore.getState().setSelectedDice('d6');
      useGameStore.getState().rollSelectedDice();
      useGameStore.getState().movePlayer();

      expect(useGameStore.getState().phase).toBe('moving');
    });

    it('moves player and sets end_turn on second call for non-special square', () => {
      useGameStore.getState().initGame(['Alice']);
      // Force a specific roll to land on a non-special square
      useGameStore.setState({ lastRoll: 3, phase: 'rolling' });
      // Player starts at 1, roll 3 = position 4 (which has a ladder defined, but isn't applied)
      // Use roll of 13 from position 1 = 14 (non-special)
      useGameStore.setState({ lastRoll: 13, phase: 'rolling' });

      useGameStore.getState().movePlayer(); // rolling -> moving
      useGameStore.getState().movePlayer(); // moving -> end_turn

      const { players, phase } = useGameStore.getState();
      expect(players[0].position).toBe(14);
      expect(phase).toBe('end_turn');
    });

    it('triggers minigame when landing on special square', () => {
      useGameStore.getState().initGame(['Alice']);
      // Position 1 + roll 1 = position 2 (prime)
      useGameStore.setState({ lastRoll: 1, phase: 'rolling' });

      useGameStore.getState().movePlayer(); // rolling -> moving
      useGameStore.getState().movePlayer(); // moving -> minigame

      const { phase, activeMinigame } = useGameStore.getState();
      expect(phase).toBe('minigame');
      expect(activeMinigame).not.toBeNull();
    });

    it('triggers final_showdown when reaching 100', () => {
      useGameStore.getState().initGame(['Alice']);
      useGameStore.setState({
        players: [{ ...useGameStore.getState().players[0], position: 95 }],
        lastRoll: 5,
        phase: 'rolling',
      });

      useGameStore.getState().movePlayer(); // rolling -> moving
      useGameStore.getState().movePlayer(); // moving -> minigame (final_showdown)

      const { phase, activeMinigame } = useGameStore.getState();
      expect(phase).toBe('minigame');
      expect(activeMinigame).toBe('final_showdown');
    });
  });

  describe('endMinigame', () => {
    it('applies movement after minigame', () => {
      useGameStore.getState().initGame(['Alice']);
      useGameStore.setState({
        players: [{ ...useGameStore.getState().players[0], position: 10 }],
        phase: 'minigame',
        activeMinigame: 'prime_off',
      });

      useGameStore.getState().endMinigame(3);

      const { players, phase } = useGameStore.getState();
      expect(players[0].position).toBe(13);
      expect(phase).toBe('end_turn');
    });

    it('handles negative movement from minigame', () => {
      useGameStore.getState().initGame(['Alice']);
      useGameStore.setState({
        players: [{ ...useGameStore.getState().players[0], position: 10 }],
        phase: 'minigame',
        activeMinigame: 'prime_blackjack',
      });

      useGameStore.getState().endMinigame(-5);

      const { players } = useGameStore.getState();
      expect(players[0].position).toBe(5);
    });

    it('clamps position to 1 minimum', () => {
      useGameStore.getState().initGame(['Alice']);
      useGameStore.setState({
        players: [{ ...useGameStore.getState().players[0], position: 3 }],
        phase: 'minigame',
        activeMinigame: 'prime_blackjack',
      });

      useGameStore.getState().endMinigame(-10);

      const { players } = useGameStore.getState();
      expect(players[0].position).toBe(1);
    });

    it('triggers final_showdown if minigame movement reaches 100', () => {
      useGameStore.getState().initGame(['Alice']);
      useGameStore.setState({
        players: [{ ...useGameStore.getState().players[0], position: 97 }],
        phase: 'minigame',
        activeMinigame: 'prime_off',
      });

      useGameStore.getState().endMinigame(3);

      const { phase, activeMinigame } = useGameStore.getState();
      expect(phase).toBe('minigame');
      expect(activeMinigame).toBe('final_showdown');
    });

    it('wins game when final_showdown is passed', () => {
      useGameStore.getState().initGame(['Alice']);
      useGameStore.setState({
        players: [{ ...useGameStore.getState().players[0], position: 100 }],
        phase: 'minigame',
        activeMinigame: 'final_showdown',
      });

      useGameStore.getState().endMinigame(1);

      const { phase, winner } = useGameStore.getState();
      expect(phase).toBe('game_over');
      expect(winner).not.toBeNull();
      expect(winner!.name).toBe('Alice');
    });

    it('moves back when final_showdown is failed', () => {
      useGameStore.getState().initGame(['Alice']);
      useGameStore.setState({
        players: [{ ...useGameStore.getState().players[0], position: 100 }],
        phase: 'minigame',
        activeMinigame: 'final_showdown',
      });

      useGameStore.getState().endMinigame(0);

      const { players, phase } = useGameStore.getState();
      expect(players[0].position).toBe(95);
      expect(phase).toBe('end_turn');
    });
  });

  describe('endTurn', () => {
    it('advances to next player', () => {
      useGameStore.getState().initGame(['Alice', 'Bob']);
      useGameStore.setState({ phase: 'end_turn' });

      useGameStore.getState().endTurn();

      const { currentPlayerIndex, phase, selectedDice, lastRoll } = useGameStore.getState();
      expect(currentPlayerIndex).toBe(1);
      expect(phase).toBe('rolling');
      expect(selectedDice).toBeNull();
      expect(lastRoll).toBeNull();
    });

    it('wraps around to first player', () => {
      useGameStore.getState().initGame(['Alice', 'Bob']);
      useGameStore.setState({ currentPlayerIndex: 1, phase: 'end_turn' });

      useGameStore.getState().endTurn();

      expect(useGameStore.getState().currentPlayerIndex).toBe(0);
    });
  });

  describe('resetGame', () => {
    it('resets all state to initial', () => {
      useGameStore.getState().initGame(['Alice', 'Bob']);
      useGameStore.getState().resetGame();

      const state = useGameStore.getState();
      expect(state.players).toHaveLength(0);
      expect(state.phase).toBe('setup');
      expect(state.winner).toBeNull();
    });
  });

  describe('AI helpers', () => {
    it('isCurrentPlayerAI returns true for AI player', () => {
      useGameStore.getState().initGame([], [{ name: 'Bot', difficulty: 'easy' }]);
      expect(useGameStore.getState().isCurrentPlayerAI()).toBe(true);
    });

    it('isCurrentPlayerAI returns false for human player', () => {
      useGameStore.getState().initGame(['Alice']);
      expect(useGameStore.getState().isCurrentPlayerAI()).toBe(false);
    });

    it('getCurrentPlayerAIDifficulty returns correct difficulty', () => {
      useGameStore.getState().initGame([], [{ name: 'Bot', difficulty: 'hard' }]);
      expect(useGameStore.getState().getCurrentPlayerAIDifficulty()).toBe('hard');
    });
  });

  describe('skipToPosition', () => {
    it('directly sets player position', () => {
      useGameStore.getState().initGame(['Alice']);
      useGameStore.getState().skipToPosition(42);

      expect(useGameStore.getState().players[0].position).toBe(42);
    });
  });
});
