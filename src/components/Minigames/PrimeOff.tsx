import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useGameStore, type AIDifficulty } from '../../stores/gameStore';
import { useStatsStore } from '../../stores/statsStore';
import { generatePrimeOffScreens, getNextPrime } from '../../utils/mathHelpers';
import { PassToPlayer } from './PassToPlayer';

interface PlayerResult {
  playerId: string;
  playerName: string;
  time: number | null;
  correct: boolean;
  isAI: boolean;
  aiDifficulty?: AIDifficulty;
  hasAnswered: boolean;
}

type Phase = 'pass' | 'countdown' | 'playing' | 'ai_turn' | 'results';

export function PrimeOff() {
  const { players, currentPlayerIndex, endMinigame, aiPlayers } = useGameStore();
  const triggeringPlayer = players[currentPlayerIndex];

  const [screens] = useState(() => generatePrimeOffScreens());
  const [playerAnswers, setPlayerAnswers] = useState<PlayerResult[]>(() =>
    players.map((p) => ({
      playerId: p.id,
      playerName: p.name,
      time: null,
      correct: false,
      isAI: aiPlayers.has(p.id),
      aiDifficulty: aiPlayers.get(p.id),
      hasAnswered: false,
    }))
  );

  const [activePlayerIndex, setActivePlayerIndex] = useState(0);
  const [countdown, setCountdown] = useState(3);
  const [startTime, setStartTime] = useState<number | null>(null);
  const aiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Determine initial phase
  const [phase, setPhase] = useState<Phase>(() => {
    const firstPlayer = players[0];
    if (aiPlayers.has(firstPlayer.id)) {
      return 'ai_turn';
    }
    return 'pass';
  });

  const activePlayer = players[activePlayerIndex];
  const activeAnswer = playerAnswers[activePlayerIndex];
  const isActiveAI = activeAnswer?.isAI;

  // Find next player
  const findNextPlayerIndex = (): number | null => {
    let nextIndex = activePlayerIndex + 1;
    while (nextIndex < players.length) {
      if (!playerAnswers[nextIndex].hasAnswered) {
        return nextIndex;
      }
      nextIndex++;
    }
    return null;
  };

  // Move to next player or finish
  const moveToNextPlayer = () => {
    const nextIndex = findNextPlayerIndex();

    if (nextIndex === null) {
      setPhase('results');
    } else {
      setActivePlayerIndex(nextIndex);
      setCountdown(3);
      setStartTime(null);

      const nextAnswer = playerAnswers[nextIndex];
      if (nextAnswer.isAI) {
        setPhase('ai_turn');
      } else {
        setPhase('pass');
      }
    }
  };

  // Handle countdown
  useEffect(() => {
    if (phase !== 'countdown') return;

    if (countdown <= 0) {
      setPhase('playing');
      setStartTime(Date.now());
      return;
    }

    const timer = setTimeout(() => {
      setCountdown(c => c - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [phase, countdown]);

  // AI plays
  useEffect(() => {
    if (phase !== 'ai_turn' || !isActiveAI) return;

    const difficulty = activeAnswer.aiDifficulty || 'medium';
    let delay: number;
    let willBeCorrect: boolean;

    if (difficulty === 'easy') {
      delay = 2000 + Math.random() * 2000;
      willBeCorrect = Math.random() < 0.4;
    } else if (difficulty === 'medium') {
      delay = 1500 + Math.random() * 1500;
      willBeCorrect = Math.random() < 0.65;
    } else {
      delay = 800 + Math.random() * 1000;
      willBeCorrect = Math.random() < 0.85;
    }

    aiTimerRef.current = setTimeout(() => {
      const answer = willBeCorrect ? screens.answer : screens.screen1[0].number;
      submitAnswer(answer, delay / 1000);
    }, delay);

    return () => {
      if (aiTimerRef.current) {
        clearTimeout(aiTimerRef.current);
      }
    };
  }, [phase, activePlayerIndex, isActiveAI]);

  const submitAnswer = (num: number, timeOverride?: number) => {
    const elapsed = timeOverride ?? (startTime ? (Date.now() - startTime) / 1000 : 0);
    const isCorrect = num === screens.answer;

    setPlayerAnswers(prev => {
      const updated = [...prev];
      updated[activePlayerIndex] = {
        ...updated[activePlayerIndex],
        time: elapsed,
        correct: isCorrect,
        hasAnswered: true,
      };
      return updated;
    });

    // Move to next player after a brief delay
    setTimeout(() => {
      moveToNextPlayer();
    }, 500);
  };

  const handleSelect = (num: number) => {
    if (phase !== 'playing' || !startTime) return;
    submitAnswer(num);
  };

  const handlePassReady = () => {
    setPhase('countdown');
  };

  const handleContinue = () => {
    const correctResults = playerAnswers.filter((r) => r.correct);
    const winner = correctResults.length > 0
      ? correctResults.reduce((a, b) => (a.time! < b.time! ? a : b))
      : null;

    useStatsStore.getState().recordMinigame({
      turnNumber: useStatsStore.getState().stats.totalTurns,
      triggeringPlayerId: triggeringPlayer.id,
      minigameType: 'prime_off',
      data: {
        type: 'prime_off',
        sharedAnswer: screens.answer,
        playerResults: playerAnswers.map(pa => ({
          playerId: pa.playerId,
          time: pa.time,
          correct: pa.correct,
        })),
      },
    });

    if (winner?.playerId === triggeringPlayer.id) {
      const nextPrime = getNextPrime(triggeringPlayer.position);
      endMinigame(nextPrime - triggeringPlayer.position);
    } else {
      endMinigame(0);
    }
  };

  // Pass screen
  if (phase === 'pass') {
    return (
      <PassToPlayer
        player={activePlayer}
        minigameName="Prime-Off!"
        minigameDescription="Find the prime number that appears on BOTH screens!"
        onReady={handlePassReady}
      />
    );
  }

  // Countdown
  if (phase === 'countdown') {
    return (
      <motion.div
        className="game-card rounded-3xl p-8 shadow-2xl text-center"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        <div className="mb-4">
          <span className="text-[var(--color-text-muted)] text-sm">{activePlayer?.name}</span>
        </div>
        <h2 className="text-2xl font-bold text-[var(--color-text-secondary)] mb-4">Get Ready!</h2>
        <motion.div
          key={countdown}
          className="text-8xl font-black text-[var(--color-amethyst)]"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          {countdown || 'GO!'}
        </motion.div>
      </motion.div>
    );
  }

  // AI playing
  if (phase === 'ai_turn') {
    return (
      <div className="game-card rounded-3xl p-6 shadow-2xl">
        <div className="text-center mb-4">
          <h2 className="text-2xl font-black text-[var(--color-amethyst)]">Prime-Off!</h2>
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
            {activePlayer?.name} is playing...
          </p>
        </motion.div>

        <div className="text-center text-[var(--color-text-muted)] text-sm">
          {playerAnswers.filter(p => p.hasAnswered).length} of {players.length} players done
        </div>
      </div>
    );
  }

  // Playing
  if (phase === 'playing') {
    return (
      <div className="game-card rounded-3xl p-6 shadow-2xl">
        <div className="text-center mb-2">
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full wood-inset mb-2">
            <span className="font-bold text-[var(--color-text-primary)]">{activePlayer?.name}</span>
          </div>
          <h3 className="text-[var(--color-text-secondary)] font-bold">
            Find the prime on <span className="text-[var(--color-amethyst)]">BOTH</span> screens!
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Screen 1 */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-4">
            <div className="text-slate-400 text-xs font-bold mb-3 text-center tracking-wider">SCREEN 1</div>
            <div className="grid grid-cols-2 gap-2">
              {screens.screen1.map((item, idx) => (
                <motion.button
                  key={idx}
                  className="py-4 rounded-xl text-white font-black text-xl shadow-lg"
                  style={{ backgroundColor: item.color }}
                  onClick={() => handleSelect(item.number)}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {item.number}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Screen 2 */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-4">
            <div className="text-slate-400 text-xs font-bold mb-3 text-center tracking-wider">SCREEN 2</div>
            <div className="grid grid-cols-2 gap-2">
              {screens.screen2.map((item, idx) => (
                <motion.button
                  key={idx}
                  className="py-4 rounded-xl text-white font-black text-xl shadow-lg"
                  style={{ backgroundColor: item.color }}
                  onClick={() => handleSelect(item.number)}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {item.number}
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        <div className="text-center text-[var(--color-text-muted)] text-sm">
          {playerAnswers.filter(p => p.hasAnswered).length} of {players.length} players done
        </div>
      </div>
    );
  }

  // Results
  const correctResults = playerAnswers.filter((r) => r.correct);
  const winner = correctResults.length > 0
    ? correctResults.reduce((a, b) => (a.time! < b.time! ? a : b))
    : null;

  return (
    <motion.div
      className="game-card rounded-3xl p-6 shadow-2xl"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <div className="text-center mb-4">
        <div className="w-12 h-12 mx-auto mb-2 rounded-xl piece-amethyst flex items-center justify-center">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-white">
            <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
          </svg>
        </div>
        <h2 className="text-2xl font-black text-[var(--color-amethyst)]">Results</h2>
        <p className="text-[var(--color-text-secondary)]">
          The answer was <span className="font-bold text-[var(--color-amethyst)]">{screens.answer}</span>
        </p>
      </div>

      <div className="space-y-2 mb-6">
        {playerAnswers
          .slice()
          .sort((a, b) => {
            if (!a.correct && !b.correct) return 0;
            if (!a.correct) return 1;
            if (!b.correct) return -1;
            return a.time! - b.time!;
          })
          .map((result, idx) => {
            const isWinner = winner?.playerId === result.playerId;
            return (
              <motion.div
                key={result.playerId}
                className="flex items-center justify-between p-3 rounded-xl"
                style={
                  isWinner
                    ? {
                        background: 'linear-gradient(135deg, rgba(255, 217, 61, 0.25) 0%, rgba(255, 159, 67, 0.15) 100%)',
                        border: '2px solid rgba(255, 217, 61, 0.6)',
                        boxShadow: '0 0 15px rgba(255, 217, 61, 0.3)',
                      }
                    : result.correct
                    ? {
                        background: 'rgba(152, 236, 101, 0.15)',
                        border: '1px solid rgba(152, 236, 101, 0.3)',
                      }
                    : {
                        background: 'rgba(255, 107, 157, 0.15)',
                        border: '1px solid rgba(255, 107, 157, 0.3)',
                      }
                }
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: idx * 0.1 }}
              >
                <div className="flex items-center gap-3">
                  {isWinner && (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ color: '#ffd93d' }}>
                      <path d="M12 2l3 6 6 1-4.5 4 1.5 6-6-3-6 3 1.5-6L3 9l6-1 3-6z" fill="currentColor" />
                    </svg>
                  )}
                  <span className="font-bold text-[var(--color-text-primary)]">{result.playerName}</span>
                  {result.isAI && <span className="text-xs text-[var(--color-text-muted)]">AI</span>}
                </div>
                <div className="text-right">
                  {result.correct ? (
                    <span className="text-[#98ec65] font-bold">{result.time?.toFixed(2)}s</span>
                  ) : (
                    <span className="text-[#ff6b9d] font-medium">Wrong</span>
                  )}
                </div>
              </motion.div>
            );
          })}
      </div>

      <div className="text-center text-[var(--color-text-secondary)] mb-4">
        {winner?.playerId === triggeringPlayer.id
          ? 'You win! Advance to the next prime!'
          : winner
          ? `${winner.playerName} wins! You stay put.`
          : 'Nobody got it right!'}
      </div>

      <motion.button
        className="w-full py-3 piece-amethyst text-white font-bold text-lg rounded-xl"
        onClick={handleContinue}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        Continue
      </motion.button>
    </motion.div>
  );
}
