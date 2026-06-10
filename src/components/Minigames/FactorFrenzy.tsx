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

function TrophyIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M7 3h10v5a5 5 0 01-10 0V3z"
        fill="var(--color-aurora-yellow)"
        stroke="var(--color-aurora-yellow-deep)"
        strokeWidth="1"
      />
      <path
        d="M7 4H4a3 3 0 003 4M17 4h3a3 3 0 01-3 4"
        stroke="var(--color-aurora-yellow)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path d="M12 13v4" stroke="var(--color-aurora-orange)" strokeWidth="2" strokeLinecap="round" />
      <path d="M8.5 20a1 1 0 011-1h5a1 1 0 011 1v1h-7v-1z" fill="var(--color-aurora-orange)" />
    </svg>
  );
}

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
      <div className="glass-card w-full max-w-lg mx-auto p-4 sm:p-6">
        <div className="text-center mb-4">
          <div className="label-caps mb-1">Minigame</div>
          <h2 className="heading-2 text-aurora-purple">Factor Frenzy!</h2>
          <p className="font-body text-[var(--color-text-secondary)]">AI is playing...</p>
        </div>

        <div className="text-center p-4 mb-4">
          <div className="big-number text-aurora-purple mb-2">
            {target.number}
          </div>
          <p className="font-body text-[var(--color-text-muted)]">Find its factors!</p>
        </div>

        <motion.div
          className="text-center p-8"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          <div className="w-16 h-16 mx-auto mb-4 glass-inset flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-[var(--color-text-muted)]">
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
        className="glass-card w-full max-w-lg mx-auto p-4 sm:p-6 max-h-[90dvh] overflow-y-auto"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 350, damping: 25 }}
      >
        <div className="text-center mb-4">
          <div className="label-caps mb-1">Factor Frenzy</div>
          <h2 className="heading-2 text-aurora-purple">Results!</h2>
          <p className="font-body text-[var(--color-text-muted)]">
            Factors of {target.number}: {target.factors.join(', ')}
          </p>
        </div>

        <div className="space-y-2 mb-4">
          {sortedResults.map((result, idx) => {
            const isWinner = idx === 0 && result.score > 0;
            const playerColor = players.find(p => p.id === result.playerId)?.color;
            return (
              <motion.div
                key={result.playerId}
                className="p-3 rounded-xl"
                style={{
                  ...(isWinner
                    ? {
                        background: 'linear-gradient(135deg, rgba(255, 230, 109, 0.18) 0%, rgba(249, 160, 63, 0.12) 100%)',
                        border: '1px solid rgba(255, 230, 109, 0.5)',
                        boxShadow: '0 0 15px rgba(255, 230, 109, 0.2)',
                      }
                    : {
                        background: 'rgba(0, 0, 0, 0.25)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                      }),
                  borderLeft: `3px solid ${playerColor ?? 'rgba(255, 255, 255, 0.2)'}`,
                }}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: idx * 0.1, type: 'spring', stiffness: 350, damping: 25 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isWinner && <TrophyIcon />}
                    <span className="font-body font-bold text-[var(--color-text-primary)]">{result.playerName}</span>
                    {result.isAI && <span className="label-caps">AI</span>}
                  </div>
                  <div className="text-right">
                    <div className="font-display text-xl text-aurora-purple">
                      {result.score}
                    </div>
                    <div className="text-xs font-body text-[var(--color-text-muted)]">
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
            <p className="text-aurora-green font-body font-bold">
              You win! Advance {Math.max(1, Math.floor(winner.score / 15))} spaces!
            </p>
          ) : playerResults.find(r => r.playerId === triggeringPlayer.id)?.correct! >
             playerResults.find(r => r.playerId === triggeringPlayer.id)?.wrong! ? (
            <p className="text-aurora-blue font-body font-bold">Nice try! Advance 1 space.</p>
          ) : (
            <p className="font-body text-[var(--color-text-muted)]">You stay on your current square.</p>
          )}
        </div>

        <button className="btn btn-purple w-full" onClick={handleContinue}>
          Continue
        </button>
      </motion.div>
    );
  }

  // Playing phase
  return (
    <div className="glass-card w-full max-w-lg mx-auto p-4 sm:p-6">
      <div className="text-center mb-4">
        <div className="label-caps mb-1">Minigame</div>
        <h2 className="heading-2 text-aurora-purple">Factor Frenzy!</h2>
        <p className="font-body text-[var(--color-text-secondary)]">Tap all divisors of the number!</p>
      </div>

      {/* Current player indicator */}
      <div className="text-center mb-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 glass-inset rounded-full">
          <span className="font-body font-bold text-[var(--color-text-primary)]">{activePlayer?.name}'s turn</span>
        </div>
      </div>

      {/* Timer and target */}
      <div className="flex justify-between items-center mb-4">
        <motion.div
          className={`font-display text-3xl ${timeLeft <= 5 ? 'text-aurora-pink' : 'text-[var(--color-text-primary)]'}`}
          animate={timeLeft <= 5 ? { scale: [1, 1.1, 1] } : {}}
          transition={{ duration: 0.5, repeat: timeLeft <= 5 ? Infinity : 0 }}
        >
          {timeLeft}s
        </motion.div>
        <div className="font-display text-5xl text-aurora-purple">{target.number}</div>
        <div className="font-display text-xl text-aurora-green">+{activeResult?.score || 0}</div>
      </div>

      {/* Feedback */}
      <AnimatePresence>
        {lastTap && (
          <motion.div
            className={`text-center text-lg font-body font-bold mb-2 ${lastTap.correct ? 'text-aurora-green' : 'text-aurora-pink'}`}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            {lastTap.correct ? '+10 Correct!' : '-5 Not a factor!'}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Number grid */}
      <div className="grid grid-cols-4 gap-1.5 sm:gap-2 mb-4">
        {grid.map((num) => {
          const tapped = tappedNumbers.has(num);
          const isCorrect = target.factors.includes(num);

          return (
            <motion.button
              key={num}
              className={`min-h-[48px] py-3 sm:py-4 rounded-xl text-xl font-display transition-all ${
                tapped
                  ? isCorrect
                    ? 'bg-aurora-green text-white'
                    : 'bg-aurora-pink text-white'
                  : 'glass-inset text-[var(--color-text-primary)]'
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
      <div className="text-center text-sm font-body text-[var(--color-text-muted)]">
        Found {activeResult?.correct || 0} of {target.factors.length} factors
      </div>

      {/* Players progress */}
      <div className="flex justify-center gap-2 mt-4">
        {players.map((_, idx) => (
          <div
            key={idx}
            className={`w-3 h-3 rounded-full ${
              idx < activePlayerIndex
                ? 'bg-aurora-green'
                : idx === activePlayerIndex
                ? 'bg-aurora-purple'
                : 'bg-white/20'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
