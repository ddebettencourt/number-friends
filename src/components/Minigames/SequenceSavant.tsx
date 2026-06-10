import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore, type AIDifficulty } from '../../stores/gameStore';
import { useStatsStore } from '../../stores/statsStore';
import { PassToPlayer } from './PassToPlayer';

type SequenceType = 'arithmetic' | 'geometric' | 'power' | 'triangular' | 'fibonacci' | 'prime';

interface SequenceChallenge {
  type: SequenceType;
  sequence: (number | null)[];
  answer: number;
  hint: string;
}

interface PlayerResult {
  playerId: string;
  playerName: string;
  guess: number | null;
  isCorrect: boolean | null;
  timeToAnswer: number | null;
  isAI: boolean;
  aiDifficulty?: AIDifficulty;
}

type Phase = 'pass' | 'playing' | 'ai_turn' | 'results';

function generateSequence(): SequenceChallenge {
  const types: SequenceType[] = ['arithmetic', 'geometric', 'power', 'triangular', 'fibonacci', 'prime'];
  const type = types[Math.floor(Math.random() * types.length)];

  let sequence: number[] = [];
  let hint = '';

  switch (type) {
    case 'arithmetic': {
      const start = Math.floor(Math.random() * 10) + 1;
      const diff = Math.floor(Math.random() * 5) + 2;
      for (let i = 0; i < 5; i++) {
        sequence.push(start + i * diff);
      }
      hint = `+${diff} each time`;
      break;
    }
    case 'geometric': {
      const start = Math.floor(Math.random() * 3) + 2;
      const ratio = Math.floor(Math.random() * 2) + 2;
      for (let i = 0; i < 5; i++) {
        sequence.push(start * Math.pow(ratio, i));
      }
      hint = `×${ratio} each time`;
      break;
    }
    case 'power': {
      const isCube = Math.random() < 0.3;
      for (let i = 1; i <= 5; i++) {
        sequence.push(isCube ? Math.pow(i, 3) : Math.pow(i, 2));
      }
      hint = isCube ? 'cubes: n³' : 'squares: n²';
      break;
    }
    case 'triangular': {
      for (let i = 1; i <= 5; i++) {
        sequence.push((i * (i + 1)) / 2);
      }
      hint = '1+2+3+...';
      break;
    }
    case 'fibonacci': {
      const fibs = [1, 1, 2, 3, 5, 8, 13, 21, 34];
      const startIdx = Math.floor(Math.random() * 4);
      sequence = fibs.slice(startIdx, startIdx + 5);
      hint = 'add prev two';
      break;
    }
    case 'prime': {
      const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29];
      const startIdx = Math.floor(Math.random() * 5);
      sequence = primes.slice(startIdx, startIdx + 5);
      hint = 'prime numbers';
      break;
    }
  }

  const hideIndex = Math.floor(Math.random() * 3) + 1;
  const answer = sequence[hideIndex];
  const displaySequence: (number | null)[] = sequence.map((n, i) => i === hideIndex ? null : n);

  return { type, sequence: displaySequence, answer, hint };
}

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

export function SequenceSavant() {
  const { players, currentPlayerIndex, endMinigame, aiPlayers } = useGameStore();
  const triggeringPlayer = players[currentPlayerIndex];
  const inputRef = useRef<HTMLInputElement>(null);

  const [challenge] = useState(() => generateSequence());
  const [playerResults, setPlayerResults] = useState<PlayerResult[]>(() =>
    players.map((p) => ({
      playerId: p.id,
      playerName: p.name,
      guess: null,
      isCorrect: null,
      timeToAnswer: null,
      isAI: aiPlayers.has(p.id),
      aiDifficulty: aiPlayers.get(p.id),
    }))
  );

  const [activePlayerIndex, setActivePlayerIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [turnStartTime, setTurnStartTime] = useState<number | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [showHint, setShowHint] = useState(false);

  const [phase, setPhase] = useState<Phase>(() => {
    const firstResult = playerResults[0];
    return firstResult?.isAI ? 'ai_turn' : 'pass';
  });

  const activeResult = playerResults[activePlayerIndex];
  const activePlayer = players[activePlayerIndex];
  const isActiveAI = activeResult?.isAI;

  // Move to next player or results
  const moveToNextPlayer = useCallback((updatedResults: PlayerResult[]) => {
    const nextIndex = activePlayerIndex + 1;

    if (nextIndex >= players.length) {
      setPlayerResults(updatedResults);
      setPhase('results');
    } else {
      setActivePlayerIndex(nextIndex);
      setTimeLeft(15);
      setInputValue('');
      setTurnStartTime(null);
      setPlayerResults(updatedResults);

      const nextResult = updatedResults[nextIndex];
      if (nextResult.isAI) {
        setPhase('ai_turn');
      } else {
        setPhase('pass');
      }
    }
  }, [activePlayerIndex, players.length]);

  // Focus input when playing
  useEffect(() => {
    if (phase === 'playing' && !isActiveAI) {
      inputRef.current?.focus();
    }
  }, [phase, isActiveAI]);

  // Start the timer when playing phase begins
  useEffect(() => {
    if (phase === 'playing' && turnStartTime === null) {
      setTurnStartTime(Date.now());
    }
  }, [phase, turnStartTime]);

  // Timer
  useEffect(() => {
    if (phase !== 'playing' || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          // Time's up - submit with current value
          const guessNum = parseInt(inputValue) || 0;
          const isCorrect = guessNum === challenge.answer;
          const timeToAnswer = turnStartTime ? (Date.now() - turnStartTime) / 1000 : 15;

          const newResults = [...playerResults];
          newResults[activePlayerIndex] = {
            ...newResults[activePlayerIndex],
            guess: guessNum,
            isCorrect,
            timeToAnswer,
          };
          moveToNextPlayer(newResults);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase, timeLeft, inputValue, challenge.answer, turnStartTime, activePlayerIndex, playerResults, moveToNextPlayer]);

  // AI plays automatically
  useEffect(() => {
    if (phase !== 'ai_turn' || !isActiveAI) return;

    const difficulty = activeResult.aiDifficulty || 'medium';
    let delay: number;
    let correctChance: number;

    if (difficulty === 'easy') {
      delay = 3000 + Math.random() * 3000;
      correctChance = 0.4;
    } else if (difficulty === 'medium') {
      delay = 2000 + Math.random() * 2000;
      correctChance = 0.65;
    } else {
      delay = 1000 + Math.random() * 1500;
      correctChance = 0.85;
    }

    const timer = setTimeout(() => {
      const isCorrect = Math.random() < correctChance;
      let aiGuess: number;

      if (isCorrect) {
        aiGuess = challenge.answer;
      } else {
        const offset = (Math.floor(Math.random() * 5) + 1) * (Math.random() < 0.5 ? 1 : -1);
        aiGuess = Math.max(1, challenge.answer + offset);
      }

      const newResults = [...playerResults];
      newResults[activePlayerIndex] = {
        ...newResults[activePlayerIndex],
        guess: aiGuess,
        isCorrect: aiGuess === challenge.answer,
        timeToAnswer: delay / 1000,
      };
      moveToNextPlayer(newResults);
    }, delay);

    return () => clearTimeout(timer);
  }, [phase, isActiveAI, activeResult, challenge.answer, activePlayerIndex, playerResults, moveToNextPlayer]);

  const handleSubmit = () => {
    if (phase !== 'playing' || isActiveAI) return;

    const guessNum = parseInt(inputValue) || 0;
    const isCorrect = guessNum === challenge.answer;
    const timeToAnswer = turnStartTime ? (Date.now() - turnStartTime) / 1000 : 15;

    const newResults = [...playerResults];
    newResults[activePlayerIndex] = {
      ...newResults[activePlayerIndex],
      guess: guessNum,
      isCorrect,
      timeToAnswer,
    };
    moveToNextPlayer(newResults);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  const handlePassReady = () => {
    setPhase('playing');
  };

  const handleContinue = () => {
    const correctResults = playerResults.filter(r => r.isCorrect);
    const winner = correctResults.length > 0
      ? correctResults.reduce((a, b) => (a.timeToAnswer! < b.timeToAnswer! ? a : b))
      : null;

    const triggeringResult = playerResults.find(r => r.playerId === triggeringPlayer.id);

    useStatsStore.getState().recordMinigame({
      turnNumber: useStatsStore.getState().stats.totalTurns,
      triggeringPlayerId: triggeringPlayer.id,
      minigameType: 'sequence_savant',
      data: {
        type: 'sequence_savant',
        sequenceType: challenge.type,
        correctAnswer: challenge.answer,
        playerResults: playerResults.map(pr => ({
          playerId: pr.playerId,
          guess: pr.guess,
          correct: pr.isCorrect ?? false,
          timeToAnswer: pr.timeToAnswer ?? null,
        })),
      },
    });

    if (winner && winner.playerId === triggeringPlayer.id) {
      const bonus = Math.max(1, Math.ceil((15 - (winner.timeToAnswer || 15)) / 3));
      endMinigame(bonus);
    } else if (triggeringResult?.isCorrect) {
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
        minigameName="Sequence Savant!"
        minigameDescription="Find the missing number in the sequence!"
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
          <h2 className="heading-2 text-aurora-green">Sequence Savant!</h2>
          <p className="font-body text-[var(--color-text-secondary)]">AI is playing...</p>
        </div>

        {/* Show the sequence */}
        <div className="flex justify-center items-center gap-2 mb-6">
          {challenge.sequence.map((num, index) => (
            <div
              key={index}
              className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-display ${
                num === null ? 'text-aurora-green' : 'piece-emerald text-white'
              }`}
              style={
                num === null
                  ? { background: 'rgba(95, 173, 86, 0.12)', border: '2px dashed rgba(95, 173, 86, 0.5)' }
                  : undefined
              }
            >
              {num ?? '?'}
            </div>
          ))}
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
            {activePlayer?.name} is thinking...
          </p>
        </motion.div>
      </div>
    );
  }

  // Results
  if (phase === 'results') {
    const sortedResults = [...playerResults]
      .filter(r => r.guess !== null)
      .sort((a, b) => {
        if (a.isCorrect && !b.isCorrect) return -1;
        if (!a.isCorrect && b.isCorrect) return 1;
        return (a.timeToAnswer || 99) - (b.timeToAnswer || 99);
      });

    const winner = sortedResults.find(r => r.isCorrect);

    return (
      <motion.div
        className="glass-card w-full max-w-lg mx-auto p-4 sm:p-6 max-h-[90dvh] overflow-y-auto"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 350, damping: 25 }}
      >
        <div className="text-center mb-4">
          <div className="label-caps mb-1">Sequence Savant</div>
          <h2 className="heading-2 text-aurora-green">Results!</h2>
          <p className="font-body text-[var(--color-text-muted)]">
            Answer: <span className="font-bold text-[var(--color-text-primary)]">{challenge.answer}</span>
            <span className="text-xs ml-2">({challenge.hint})</span>
          </p>
        </div>

        <div className="space-y-2 mb-4">
          {sortedResults.map((result, idx) => {
            const isWinner = idx === 0 && result.isCorrect;
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
                    : result.isCorrect
                    ? {
                        background: 'rgba(95, 173, 86, 0.15)',
                        border: '1px solid rgba(95, 173, 86, 0.4)',
                      }
                    : {
                        background: 'rgba(232, 72, 85, 0.15)',
                        border: '1px solid rgba(232, 72, 85, 0.4)',
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
                    <div className={`font-display ${result.isCorrect ? 'text-aurora-green' : 'text-aurora-pink'}`}>
                      {result.guess} {result.isCorrect ? '✓' : '✗'}
                    </div>
                    <div className="text-xs font-body text-[var(--color-text-muted)]">
                      {result.timeToAnswer?.toFixed(1)}s
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
              Fastest correct! Advance {Math.max(1, Math.ceil((15 - (winner.timeToAnswer || 15)) / 3))} spaces!
            </p>
          ) : playerResults.find(r => r.playerId === triggeringPlayer.id)?.isCorrect ? (
            <p className="text-aurora-blue font-body font-bold">Nice! Advance 1 space.</p>
          ) : (
            <p className="font-body text-[var(--color-text-muted)]">
              {winner?.playerName || 'No one'} {winner ? 'wins!' : 'got it.'} You stay put.
            </p>
          )}
        </div>

        <button className="btn btn-green w-full" onClick={handleContinue}>
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
        <h2 className="heading-2 text-aurora-green">Sequence Savant!</h2>
        <p className="font-body text-[var(--color-text-secondary)]">Find the missing number!</p>
      </div>

      {/* Current player indicator */}
      <div className="text-center mb-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 glass-inset rounded-full">
          <span className="font-body font-bold text-[var(--color-text-primary)]">{activePlayer?.name}'s turn</span>
        </div>
      </div>

      {/* Timer */}
      <div className="flex justify-center mb-4">
        <motion.div
          className={`font-display text-4xl ${timeLeft <= 5 ? 'text-aurora-pink' : 'text-[var(--color-text-primary)]'}`}
          animate={timeLeft <= 5 ? { scale: [1, 1.15, 1] } : {}}
          transition={{ duration: 0.5, repeat: timeLeft <= 5 ? Infinity : 0 }}
        >
          {timeLeft}
        </motion.div>
      </div>

      {/* Sequence display */}
      <div className="flex justify-center items-center gap-2 mb-4">
        <AnimatePresence>
          {challenge.sequence.map((num, index) => (
            <motion.div
              key={index}
              className={`w-14 h-14 rounded-xl flex items-center justify-center text-xl font-display ${
                num === null ? 'text-aurora-green' : 'piece-emerald text-white'
              }`}
              style={
                num === null
                  ? { background: 'rgba(95, 173, 86, 0.12)', border: '2px dashed rgba(95, 173, 86, 0.5)' }
                  : undefined
              }
              initial={{ scale: 0, rotateY: 180 }}
              animate={{ scale: 1, rotateY: 0 }}
              transition={{ delay: index * 0.1, type: 'spring', stiffness: 350, damping: 25 }}
            >
              {num ?? '?'}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Hint toggle */}
      <div className="text-center mb-4">
        <button
          onClick={() => setShowHint(!showHint)}
          className="text-sm font-body text-aurora-green underline hover:opacity-80"
        >
          {showHint ? 'Hide hint' : 'Show hint'}
        </button>
        {showHint && (
          <motion.p
            className="text-sm font-body text-[var(--color-text-muted)] mt-1"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Pattern: {challenge.hint}
          </motion.p>
        )}
      </div>

      {/* Input */}
      <div className="flex flex-col items-center gap-4">
        <input
          ref={inputRef}
          type="number"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-32 text-center text-3xl font-display"
          placeholder="?"
        />
        <button className="btn btn-green" onClick={handleSubmit}>
          Submit
        </button>
      </div>

      {/* Progress dots */}
      <div className="flex justify-center gap-2 mt-6">
        {players.map((_, idx) => (
          <div
            key={idx}
            className={`w-3 h-3 rounded-full ${
              idx < activePlayerIndex
                ? 'bg-aurora-green/50'
                : idx === activePlayerIndex
                ? 'bg-aurora-green'
                : 'bg-white/20'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
