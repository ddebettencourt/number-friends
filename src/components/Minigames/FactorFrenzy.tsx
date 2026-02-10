import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore, type AIDifficulty } from '../../stores/gameStore';
import { useStatsStore } from '../../stores/statsStore';
import { getProperDivisors } from '../../utils/mathHelpers';
import { PassToPlayer } from './PassToPlayer';

// Generate a target number with interesting factor count (4-8 factors)
function generateTarget(): { number: number; factors: number[] } {
  const goodNumbers = [12, 18, 20, 24, 28, 30, 36, 40, 42, 48, 54, 56, 60];
  const number = goodNumbers[Math.floor(Math.random() * goodNumbers.length)];
  const factors = getProperDivisors(number);
  return { number, factors };
}

// Generate grid of numbers - mix of factors and non-factors
function generateGrid(target: number, factors: number[]): number[] {
  const grid: Set<number> = new Set(factors);

  // Add some non-factors
  while (grid.size < 12) {
    const num = Math.floor(Math.random() * (target - 1)) + 2;
    if (num !== target) {
      grid.add(num);
    }
  }

  // Shuffle
  return Array.from(grid).sort(() => Math.random() - 0.5);
}

interface PlayerResult {
  playerId: string;
  playerName: string;
  score: number;
  correct: number;
  wrong: number;
  isAI: boolean;
  aiDifficulty?: AIDifficulty;
}

type Phase = 'pass' | 'playing' | 'ai_turn' | 'results';

export function FactorFrenzy() {
  const { players, currentPlayerIndex, endMinigame, aiPlayers } = useGameStore();
  const triggeringPlayer = players[currentPlayerIndex];

  const [target] = useState(() => generateTarget());
  const [grid] = useState(() => generateGrid(target.number, target.factors));

  const [playerResults, setPlayerResults] = useState<PlayerResult[]>(() =>
    players.map((p) => ({
      playerId: p.id,
      playerName: p.name,
      score: 0,
      correct: 0,
      wrong: 0,
      isAI: aiPlayers.has(p.id),
      aiDifficulty: aiPlayers.get(p.id),
    }))
  );

  const [activePlayerIndex, setActivePlayerIndex] = useState(0);
  const [tappedNumbers, setTappedNumbers] = useState<Set<number>>(new Set());
  const [timeLeft, setTimeLeft] = useState(15);
  const [lastTap, setLastTap] = useState<{ num: number; correct: boolean } | null>(null);

  const [phase, setPhase] = useState<Phase>(() => {
    const firstResult = playerResults[0];
    return firstResult?.isAI ? 'ai_turn' : 'pass';
  });

  const activeResult = playerResults[activePlayerIndex];
  const activePlayer = players[activePlayerIndex];
  const isActiveAI = activeResult?.isAI;

  // Find next player
  const findNextPlayerIndex = (currentIndex: number): number | null => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < players.length) {
      return nextIndex;
    }
    return null;
  };

  // Move to next player or results
  const moveToNextPlayer = useCallback((updatedResults: PlayerResult[]) => {
    const nextIndex = findNextPlayerIndex(activePlayerIndex);

    if (nextIndex === null) {
      setPlayerResults(updatedResults);
      setPhase('results');
    } else {
      setActivePlayerIndex(nextIndex);
      setTappedNumbers(new Set());
      setTimeLeft(15);
      setLastTap(null);
      setPlayerResults(updatedResults);

      const nextResult = updatedResults[nextIndex];
      if (nextResult.isAI) {
        setPhase('ai_turn');
      } else {
        setPhase('pass');
      }
    }
  }, [activePlayerIndex, players.length]);

  // Timer
  useEffect(() => {
    if (phase !== 'playing' || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          // Time's up - save current score and move on
          moveToNextPlayer(playerResults);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase, timeLeft, moveToNextPlayer, playerResults]);

  // AI logic
  useEffect(() => {
    if (phase !== 'ai_turn' || !isActiveAI) return;

    const difficulty = activeResult.aiDifficulty || 'medium';
    let correctChance: number;
    let tapDelay: number;

    if (difficulty === 'easy') {
      correctChance = 0.6;
      tapDelay = 800;
    } else if (difficulty === 'medium') {
      correctChance = 0.75;
      tapDelay = 500;
    } else {
      correctChance = 0.9;
      tapDelay = 300;
    }

    let currentScore = 0;
    let currentCorrect = 0;
    let currentWrong = 0;
    const aiTapped = new Set<number>();
    let tapCount = 0;
    const maxTaps = Math.floor(Math.random() * 4) + 6; // 6-9 taps

    const aiTapInterval = setInterval(() => {
      tapCount++;

      // Pick a number to tap
      const untapped = grid.filter(n => !aiTapped.has(n));
      if (untapped.length === 0 || tapCount > maxTaps) {
        clearInterval(aiTapInterval);

        // Save results and move on
        const newResults = [...playerResults];
        newResults[activePlayerIndex] = {
          ...newResults[activePlayerIndex],
          score: currentScore,
          correct: currentCorrect,
          wrong: currentWrong,
        };
        moveToNextPlayer(newResults);
        return;
      }

      // AI picks: sometimes correct, sometimes not
      const shouldPickCorrect = Math.random() < correctChance;
      const factors = untapped.filter(n => target.factors.includes(n));
      const nonFactors = untapped.filter(n => !target.factors.includes(n));

      let pick: number;
      if (shouldPickCorrect && factors.length > 0) {
        pick = factors[Math.floor(Math.random() * factors.length)];
      } else if (!shouldPickCorrect && nonFactors.length > 0) {
        pick = nonFactors[Math.floor(Math.random() * nonFactors.length)];
      } else {
        pick = untapped[Math.floor(Math.random() * untapped.length)];
      }

      aiTapped.add(pick);
      const isCorrect = target.factors.includes(pick);

      if (isCorrect) {
        currentScore += 10;
        currentCorrect++;
      } else {
        currentScore = Math.max(0, currentScore - 5);
        currentWrong++;
      }
    }, tapDelay);

    return () => clearInterval(aiTapInterval);
  }, [phase, activePlayerIndex, isActiveAI, activeResult, grid, target.factors, playerResults, moveToNextPlayer]);

  const handleTap = (num: number) => {
    if (phase !== 'playing' || tappedNumbers.has(num)) return;

    const newTapped = new Set(tappedNumbers);
    newTapped.add(num);
    setTappedNumbers(newTapped);

    const isCorrect = target.factors.includes(num);
    setLastTap({ num, correct: isCorrect });

    const newResults = [...playerResults];
    const current = newResults[activePlayerIndex];

    if (isCorrect) {
      newResults[activePlayerIndex] = {
        ...current,
        score: current.score + 10,
        correct: current.correct + 1,
      };
    } else {
      newResults[activePlayerIndex] = {
        ...current,
        score: Math.max(0, current.score - 5),
        wrong: current.wrong + 1,
      };
    }

    setPlayerResults(newResults);

    // Check if all factors found
    const allFactorsFound = target.factors.every(f => newTapped.has(f));
    if (allFactorsFound) {
      // Bonus for completion
      newResults[activePlayerIndex].score += 20;
      setPlayerResults(newResults);
      setTimeout(() => moveToNextPlayer(newResults), 500);
    }

    // Clear feedback after a moment
    setTimeout(() => setLastTap(null), 300);
  };

  const handlePassReady = () => {
    setPhase('playing');
  };

  const handleContinue = () => {
    // Winner gets movement bonus
    const sortedResults = [...playerResults].sort((a, b) => b.score - a.score);
    const winner = sortedResults[0];
    const triggeringResult = playerResults.find(r => r.playerId === triggeringPlayer.id);

    useStatsStore.getState().recordMinigame({
      turnNumber: useStatsStore.getState().stats.totalTurns,
      triggeringPlayerId: triggeringPlayer.id,
      minigameType: 'factor_frenzy',
      data: {
        type: 'factor_frenzy',
        targetNumber: target.number,
        totalFactors: target.factors.length,
        playerResults: playerResults.map(pr => ({
          playerId: pr.playerId,
          score: pr.score,
          correctTaps: pr.correct,
          wrongTaps: pr.wrong,
        })),
      },
    });

    if (winner && winner.playerId === triggeringPlayer.id && winner.score > 0) {
      // Won! Move forward based on score
      const movement = Math.max(1, Math.floor(winner.score / 15));
      endMinigame(movement);
    } else if (triggeringResult && triggeringResult.correct > triggeringResult.wrong) {
      // Did okay - small bonus
      endMinigame(1);
    } else {
      endMinigame(0);
    }
  };

  // Pass screen
  if (phase === 'pass') {
    return (
      <PassToPlayer
        player={activePlayer}
        minigameName="Factor Frenzy!"
        minigameDescription={`Tap all divisors of ${target.number}! Avoid non-factors.`}
        onReady={handlePassReady}
      />
    );
  }

  // AI playing
  if (phase === 'ai_turn') {
    return (
      <div className="game-card rounded-2xl p-6 shadow-2xl">
        <div className="text-center mb-4">
          <h2 className="text-2xl font-bold text-[var(--color-amethyst)]">Factor Frenzy!</h2>
          <p className="text-[var(--color-text-secondary)]">AI is playing...</p>
        </div>

        <div className="text-center p-4 mb-4">
          <div className="text-6xl font-black text-[var(--color-amethyst)] mb-2">
            {target.number}
          </div>
          <p className="text-[var(--color-text-muted)]">Find its factors!</p>
        </div>

        <motion.div
          className="text-center p-8"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-xl wood-inset flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-[var(--color-wood-medium)]">
              <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
              <circle cx="9" cy="10" r="2" fill="currentColor" />
              <circle cx="15" cy="10" r="2" fill="currentColor" />
              <path d="M8 15h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <p className="text-[var(--color-text-secondary)] font-medium">
            {activePlayer?.name} is tapping factors...
          </p>
        </motion.div>
      </div>
    );
  }

  // Results
  if (phase === 'results') {
    const sortedResults = [...playerResults].sort((a, b) => b.score - a.score);
    const winner = sortedResults[0]?.score > 0 ? sortedResults[0] : null;

    return (
      <motion.div
        className="game-card rounded-2xl p-4 sm:p-6 shadow-2xl"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <div className="text-center mb-4">
          <h2 className="text-2xl font-bold text-[var(--color-amethyst)]">Results!</h2>
          <p className="text-[var(--color-text-muted)]">
            Factors of {target.number}: {target.factors.join(', ')}
          </p>
        </div>

        <div className="space-y-2 mb-4">
          {sortedResults.map((result, idx) => {
            const isWinner = idx === 0 && result.score > 0;
            return (
              <motion.div
                key={result.playerId}
                className="p-3 rounded-xl"
                style={
                  isWinner
                    ? {
                        background: 'linear-gradient(135deg, rgba(255, 217, 61, 0.25) 0%, rgba(255, 159, 67, 0.15) 100%)',
                        border: '2px solid rgba(255, 217, 61, 0.6)',
                        boxShadow: '0 0 15px rgba(255, 217, 61, 0.3)',
                      }
                    : {
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                      }
                }
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: idx * 0.1 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isWinner && <span className="text-xl">🏆</span>}
                    <span className="font-bold text-[var(--color-text-primary)]">{result.playerName}</span>
                    {result.isAI && <span className="text-xs text-[var(--color-text-muted)]">AI</span>}
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-black text-[#c678dd]">
                      {result.score}
                    </div>
                    <div className="text-xs text-[var(--color-text-muted)]">
                      {result.correct} correct, {result.wrong} wrong
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="text-center mb-4">
          {winner?.playerId === triggeringPlayer.id ? (
            <p className="text-green-600 font-bold">
              You win! Advance {Math.max(1, Math.floor(winner.score / 15))} spaces!
            </p>
          ) : playerResults.find(r => r.playerId === triggeringPlayer.id)?.correct! >
             playerResults.find(r => r.playerId === triggeringPlayer.id)?.wrong! ? (
            <p className="text-blue-600 font-bold">Nice try! Advance 1 space.</p>
          ) : (
            <p className="text-[var(--color-text-muted)]">You stay on your current square.</p>
          )}
        </div>

        <motion.button
          className="w-full py-3 piece-amethyst text-white font-bold rounded-xl"
          onClick={handleContinue}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Continue
        </motion.button>
      </motion.div>
    );
  }

  // Playing phase
  return (
    <div className="game-card rounded-2xl p-4 sm:p-6 shadow-2xl">
      <div className="text-center mb-4">
        <h2 className="text-2xl font-bold text-[var(--color-amethyst)]">Factor Frenzy!</h2>
        <p className="text-[var(--color-text-secondary)]">Tap all divisors of the number!</p>
      </div>

      {/* Current player indicator */}
      <div className="text-center mb-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full wood-inset">
          <span className="font-bold text-[var(--color-text-primary)]">{activePlayer?.name}'s turn</span>
        </div>
      </div>

      {/* Timer and target */}
      <div className="flex justify-between items-center mb-4">
        <motion.div
          className={`text-3xl font-bold ${timeLeft <= 5 ? 'text-red-600' : 'text-[var(--color-text-primary)]'}`}
          animate={timeLeft <= 5 ? { scale: [1, 1.1, 1] } : {}}
          transition={{ duration: 0.5, repeat: timeLeft <= 5 ? Infinity : 0 }}
        >
          {timeLeft}s
        </motion.div>
        <div className="text-5xl font-black text-[var(--color-amethyst)]">{target.number}</div>
        <div className="text-xl font-bold text-green-600">+{activeResult?.score || 0}</div>
      </div>

      {/* Feedback */}
      <AnimatePresence>
        {lastTap && (
          <motion.div
            className={`text-center text-lg font-bold mb-2 ${lastTap.correct ? 'text-green-500' : 'text-red-500'}`}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            {lastTap.correct ? '+10 Correct!' : '-5 Not a factor!'}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Number grid */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {grid.map((num) => {
          const tapped = tappedNumbers.has(num);
          const isCorrect = target.factors.includes(num);

          return (
            <motion.button
              key={num}
              className={`aspect-square rounded-xl text-xl font-bold transition-all ${
                tapped
                  ? isCorrect
                    ? 'bg-green-500 text-white'
                    : 'bg-red-400 text-white'
                  : 'wood-inset text-[var(--color-text-primary)] hover:bg-[var(--color-wood-light)]'
              }`}
              onClick={() => handleTap(num)}
              disabled={tapped}
              whileHover={!tapped ? { scale: 1.05 } : {}}
              whileTap={!tapped ? { scale: 0.95 } : {}}
            >
              {num}
            </motion.button>
          );
        })}
      </div>

      {/* Progress */}
      <div className="text-center text-sm text-[var(--color-text-muted)]">
        Found {activeResult?.correct || 0} of {target.factors.length} factors
      </div>

      {/* Players progress */}
      <div className="flex justify-center gap-2 mt-4">
        {players.map((_, idx) => (
          <div
            key={idx}
            className={`w-3 h-3 rounded-full ${
              idx < activePlayerIndex
                ? 'bg-green-500'
                : idx === activePlayerIndex
                ? 'bg-[var(--color-amethyst)]'
                : 'bg-gray-300'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
