import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '../gameStore';

/**
 * Integration tests for game flow mechanics:
 * - Bounce-back from 100
 * - Catch-up mechanic
 * - Full game cycle (multi-player)
 * - Final Showdown triggers and outcomes
 */

describe('Game Flow Integration', () => {
  beforeEach(() => {
    useGameStore.getState().resetGame();
  });

  describe('bounce-back overshoot', () => {
    it('bounces back when roll overshoots 100', () => {
      useGameStore.getState().initGame(['Alice']);
      useGameStore.setState({
        players: [{ ...useGameStore.getState().players[0], position: 98 }],
        lastRoll: 5, // 98 + 5 = 103, bounces to 97
        phase: 'rolling',
      });

      useGameStore.getState().movePlayer(); // rolling -> moving
      useGameStore.getState().movePlayer(); // moving -> end_turn (97 is prime, triggers minigame)

      const { players } = useGameStore.getState();
      expect(players[0].position).toBe(97);
    });

    it('allows landing exactly on 100', () => {
      useGameStore.getState().initGame(['Alice']);
      useGameStore.setState({
        players: [{ ...useGameStore.getState().players[0], position: 95 }],
        lastRoll: 5,
        phase: 'rolling',
      });

      useGameStore.getState().movePlayer(); // rolling -> moving
      useGameStore.getState().movePlayer(); // moving -> final_showdown

      const { phase, activeMinigame } = useGameStore.getState();
      expect(phase).toBe('minigame');
      expect(activeMinigame).toBe('final_showdown');
    });
  });

  describe('catch-up mechanic', () => {
    it('grants bonus squares when 30+ behind leader', () => {
      useGameStore.getState().initGame(['Alice', 'Bob']);
      const players = useGameStore.getState().players;

      // Put Bob far ahead, Alice behind
      useGameStore.setState({
        players: [
          { ...players[0], position: 10 }, // Alice at 10
          { ...players[1], position: 50 }, // Bob at 50 (40 ahead)
        ],
        currentPlayerIndex: 0,
        lastRoll: 3, // Normal move to 13
        phase: 'rolling',
      });

      useGameStore.getState().movePlayer(); // rolling -> moving
      useGameStore.getState().movePlayer(); // moving -> result

      const { players: updatedPlayers } = useGameStore.getState();
      // Gap is 40, bonus = min(3, floor((40-30)/10) + 1) = min(3, 2) = 2
      // So Alice should be at 13 + 2 = 15
      expect(updatedPlayers[0].position).toBe(15);
    });

    it('does not grant bonus when less than 30 behind', () => {
      useGameStore.getState().initGame(['Alice', 'Bob']);
      const players = useGameStore.getState().players;

      useGameStore.setState({
        players: [
          { ...players[0], position: 30 }, // Alice
          { ...players[1], position: 50 }, // Bob (20 ahead - no bonus)
        ],
        currentPlayerIndex: 0,
        lastRoll: 3,
        phase: 'rolling',
      });

      useGameStore.getState().movePlayer();
      useGameStore.getState().movePlayer();

      const { players: updatedPlayers } = useGameStore.getState();
      expect(updatedPlayers[0].position).toBe(33); // No bonus
    });

    it('does not grant bonus on negative rolls', () => {
      useGameStore.getState().initGame(['Alice', 'Bob']);
      const players = useGameStore.getState().players;

      useGameStore.setState({
        players: [
          { ...players[0], position: 10 },
          { ...players[1], position: 50 },
        ],
        currentPlayerIndex: 0,
        lastRoll: -2, // Gaussian negative roll
        phase: 'rolling',
      });

      useGameStore.getState().movePlayer();
      useGameStore.getState().movePlayer();

      const { players: updatedPlayers } = useGameStore.getState();
      expect(updatedPlayers[0].position).toBe(8); // No catch-up bonus on negative
    });

    it('caps catch-up bonus at 3', () => {
      useGameStore.getState().initGame(['Alice', 'Bob']);
      const players = useGameStore.getState().players;

      useGameStore.setState({
        players: [
          { ...players[0], position: 5 }, // Alice far behind
          { ...players[1], position: 90 }, // Bob way ahead (85 gap)
        ],
        currentPlayerIndex: 0,
        lastRoll: 2,
        phase: 'rolling',
      });

      useGameStore.getState().movePlayer();
      useGameStore.getState().movePlayer();

      const { players: updatedPlayers } = useGameStore.getState();
      // Gap 85, bonus = min(3, floor((85-30)/10) + 1) = min(3, 6) = 3
      // Position should be 5 + 2 + 3 = 10
      expect(updatedPlayers[0].position).toBe(10);
    });
  });

  describe('multi-player turn cycle', () => {
    it('cycles through all players', () => {
      useGameStore.getState().initGame(['Alice', 'Bob', 'Charlie']);
      expect(useGameStore.getState().currentPlayerIndex).toBe(0);

      useGameStore.setState({ phase: 'end_turn' });
      useGameStore.getState().endTurn();
      expect(useGameStore.getState().currentPlayerIndex).toBe(1);

      useGameStore.setState({ phase: 'end_turn' });
      useGameStore.getState().endTurn();
      expect(useGameStore.getState().currentPlayerIndex).toBe(2);

      useGameStore.setState({ phase: 'end_turn' });
      useGameStore.getState().endTurn();
      expect(useGameStore.getState().currentPlayerIndex).toBe(0); // Wraps
    });
  });

  describe('final showdown', () => {
    it('winning final showdown sets game_over', () => {
      useGameStore.getState().initGame(['Alice']);
      useGameStore.setState({
        players: [{ ...useGameStore.getState().players[0], position: 100 }],
        phase: 'minigame',
        activeMinigame: 'final_showdown',
      });

      useGameStore.getState().endMinigame(1); // Win

      const { phase, winner } = useGameStore.getState();
      expect(phase).toBe('game_over');
      expect(winner!.name).toBe('Alice');
    });

    it('losing final showdown moves player back to 95', () => {
      useGameStore.getState().initGame(['Alice']);
      useGameStore.setState({
        players: [{ ...useGameStore.getState().players[0], position: 100 }],
        phase: 'minigame',
        activeMinigame: 'final_showdown',
      });

      useGameStore.getState().endMinigame(-1); // Lose

      const { players, phase } = useGameStore.getState();
      expect(players[0].position).toBe(95);
      expect(phase).toBe('end_turn');
    });

    it('minigame movement reaching 100 triggers final showdown', () => {
      useGameStore.getState().initGame(['Alice']);
      useGameStore.setState({
        players: [{ ...useGameStore.getState().players[0], position: 97 }],
        phase: 'minigame',
        activeMinigame: 'prime_off',
      });

      useGameStore.getState().endMinigame(3); // 97 + 3 = 100

      const { phase, activeMinigame } = useGameStore.getState();
      expect(phase).toBe('minigame');
      expect(activeMinigame).toBe('final_showdown');
    });
  });

  describe('minigame end with negative movement', () => {
    it('clamps position to minimum 1', () => {
      useGameStore.getState().initGame(['Alice']);
      useGameStore.setState({
        players: [{ ...useGameStore.getState().players[0], position: 3 }],
        phase: 'minigame',
        activeMinigame: 'prime_blackjack',
      });

      useGameStore.getState().endMinigame(-5); // 3 - 5 = -2, clamped to 1

      expect(useGameStore.getState().players[0].position).toBe(1);
    });
  });

  describe('full game simulation', () => {
    it('can complete a full game cycle: setup -> roll -> move -> end turn', () => {
      // Setup
      useGameStore.getState().initGame(['Alice', 'Bob']);
      expect(useGameStore.getState().phase).toBe('rolling');

      // Alice's turn: set dice and roll
      useGameStore.getState().setSelectedDice('d6');
      useGameStore.getState().setRollResult(4);

      // setRollResult changes phase to 'moving'
      expect(useGameStore.getState().phase).toBe('moving');

      // Execute the move
      useGameStore.getState().movePlayer();

      // Check Alice moved (position 1 + 4 = 5 is prime, so minigame triggers)
      const alicePos = useGameStore.getState().players[0].position;
      expect(alicePos).toBe(5);
      expect(useGameStore.getState().phase).toBe('minigame');

      // Complete minigame (no movement)
      useGameStore.getState().endMinigame(0);
      expect(useGameStore.getState().phase).toBe('end_turn');

      // End turn - switch to Bob
      useGameStore.getState().endTurn();
      expect(useGameStore.getState().currentPlayerIndex).toBe(1);
      expect(useGameStore.getState().phase).toBe('rolling');
      expect(useGameStore.getState().selectedDice).toBeNull();
      expect(useGameStore.getState().lastRoll).toBeNull();
    });
  });
});
