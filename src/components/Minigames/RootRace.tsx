import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useGameStore, type AIDifficulty } from '../../stores/gameStore';
import { useStatsStore } from '../../stores/statsStore';
import { generateSquareRootChallenge, generateCubeRootChallenge } from '../../utils/mathHelpers';
import { PassToPlayer } from './PassToPlayer';

interface RootRaceProps {
  type: 'square' | 'cube';
}

interface PlayerResult {
  playerId: string;
  playerName: string;
  playerColor: string;
  playerAvatar: string;
  guess: number | null;
  difference: number | null;
  isAI: boolean;
  aiDifficulty?: AIDifficulty;
  submitted: boolean;
}

type Phase = 'pass' | 'playing' | 'ai_turn' | 'results';

export function RootRace({ type }: RootRaceProps) {
  const { players, currentPlayerIndex, endMinigame, aiPlayers } = useGameStore();
  const triggeringPlayer = players[currentPlayerIndex];
  const inputRef = useRef<HTMLInputElement>(null);

  const [challenge] = useState(() =>
    type === 'square' ? generateSquareRootChallenge() : generateCubeRootChallenge()
  );

  const [playerResults, setPlayerResults] = useState<PlayerResult[]>(() =>
    players.map((p) => ({
      playerId: p.id,
      playerName: p.name,
      playerColor: p.color,
      playerAvatar: p.avatar,
      guess: null,
      difference: null,
      isAI: aiPlayers.has(p.id),
      aiDifficulty: aiPlayers.get(p.id),
      submitted: false,
    }))
  );

  const [activePlayerIndex, setActivePlayerIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(20);
  const [turnStartTime, setTurnStartTime] = useState<number | null>(null);
  const [inputValue, setInputValue] = useState('');

  // Determine initial phase based on first player
  const [phase, setPhase] = useState<Phase>(() => {
    const firstResult = playerResults[0];
    return firstResult?.isAI ? 'ai_turn' : 'pass';
  });

  const activePlayer = players[activePlayerIndex];
  const activeResult = playerResults[activePlayerIndex];

  const title = type === 'square' ? 'Root Race!' : 'Cube Root Challenge!';
  const question = type === 'square' ? 'What is the square root?' : 'What is the cube root?';
  const emoji = type === 'square' ? '√' : '∛';
  const gradientFrom = type === 'square' ? 'from-purple-500' : 'from-orange-500';
  const gradientTo = type === 'square' ? 'to-indigo-600' : 'to-red-500';

  // Move to next player
  const moveToNextPlayer = useCallback((updatedResults: PlayerResult[]) => {
    const nextIndex = activePlayerIndex + 1;
    if (nextIndex >= players.length) {
      setPlayerResults(updatedResults);
      setPhase('results');
    } else {
      setActivePlayerIndex(nextIndex);
      setTimeLeft(20);
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

  // Handle pass screen ready
  const handlePassReady = () => {
    setPhase('playing');
    setTurnStartTime(Date.now());
  };

  // Focus input when playing phase starts for human players
  useEffect(() => {
    if (phase === 'playing' && !activeResult?.isAI) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [phase, activeResult?.isAI]);

  // Start timer when playing phase begins
  useEffect(() => {
    if (phase === 'playing' && turnStartTime === null) {
      setTurnStartTime(Date.now());
    }
  }, [phase, turnStartTime]);

  // Timer countdown
  useEffect(() => {
    if (phase !== 'playing' || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          // Time's up - submit with 0
          submitGuess(0);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase, timeLeft]);

  // AI plays automatically
  useEffect(() => {
    if (phase !== 'ai_turn' || !activeResult?.isAI) return;

    const difficulty = activeResult.aiDifficulty || 'medium';
    let delay: number;
    let accuracy: number;

    if (difficulty === 'easy') {
      delay = 2000 + Math.random() * 2000;
      accuracy = 0.3 + Math.random() * 0.4; // 30-70% accurate
    } else if (difficulty === 'medium') {
      delay = 1500 + Math.random() * 1500;
      accuracy = 0.6 + Math.random() * 0.3; // 60-90% accurate
    } else {
      delay = 1000 + Math.random() * 1000;
      accuracy = 0.70 + Math.random() * 0.20; // 70-90% accurate
    }

    const timer = setTimeout(() => {
      // AI calculates an estimate based on difficulty
      const actualRoot = challenge.root;
      const error = (1 - accuracy) * actualRoot * (Math.random() > 0.5 ? 1 : -1);
      const aiGuess = Math.max(1, Math.round((actualRoot + error) * 100) / 100);

      submitGuess(aiGuess);
    }, delay);

    return () => clearTimeout(timer);
  }, [phase, activeResult]);

  const submitGuess = (guessValue: number) => {
    const difference = Math.abs(guessValue - challenge.root);

    const newResults = [...playerResults];
    newResults[activePlayerIndex] = {
      ...newResults[activePlayerIndex],
      guess: guessValue,
      difference,
      submitted: true,
    };

    moveToNextPlayer(newResults);
  };

  const handleSubmit = () => {
    if (phase !== 'playing' || activeResult?.isAI) return;

    const guessNum = parseFloat(inputValue) || 0;
    submitGuess(guessNum);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  const handleSkip = () => {
    submitGuess(0); // Submit 0 as a skip
  };

  const handleContinue = () => {
    // Find winner - closest guess
    const validGuesses = playerResults.filter(g => g.submitted && g.guess !== null);
    const winner = validGuesses.length > 0
      ? validGuesses.reduce((a, b) => (a.difference! < b.difference! ? a : b))
      : null;

    // Calculate reward based on challenge difficulty (size of the number)
    const baseReward = challenge.number >= 100 ? 4 : challenge.number >= 50 ? 3 : 2;

    const minigameType = type === 'square' ? 'root_race' as const : 'cube_root' as const;
    useStatsStore.getState().recordMinigame({
      turnNumber: useStatsStore.getState().stats.totalTurns,
      triggeringPlayerId: triggeringPlayer.id,
      minigameType,
      data: {
        type: minigameType,
        challengeNumber: challenge.number,
        correctRoot: challenge.root,
        playerResults: playerResults.map(pr => ({
          playerId: pr.playerId,
          guess: pr.guess,
          difference: pr.difference,
        })),
      },
    });

    if (winner && winner.playerId === triggeringPlayer.id && winner.difference === 0) {
      endMinigame(baseReward); // Perfect answer - full reward
    } else if (winner && winner.playerId === triggeringPlayer.id) {
      endMinigame(Math.max(1, Math.floor(baseReward / 2))); // Close answer - advance less
    } else {
      endMinigame(0);
    }
  };

  // Pass screen - show before each human player's turn
  if (phase === 'pass') {
    return (
      <PassToPlayer
        player={activePlayer}
        minigameName={title}
        minigameDescription={`${question} Decimals allowed! Be quick and accurate!`}
        onReady={handlePassReady}
      />
    );
  }

  // AI playing screen
  if (phase === 'ai_turn') {
    return (
      <div className="game-card rounded-3xl p-6 shadow-2xl">
        <div className="text-center mb-4">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${gradientFrom} ${gradientTo} text-white text-3xl font-bold mb-2`}>
            {emoji}
          </div>
          <h2 className={`text-2xl font-black bg-gradient-to-r ${gradientFrom} ${gradientTo} bg-clip-text text-transparent`}>
            {title}
          </h2>
        </div>

        {/* Number to solve */}
        <div className="text-center mb-6">
          <div className={`text-4xl font-black bg-gradient-to-r ${gradientFrom} ${gradientTo} bg-clip-text text-transparent mb-2`}>
            {emoji}{challenge.number.toLocaleString()}
          </div>
        </div>

        <div className="flex items-center justify-center gap-3 p-4 wood-inset rounded-xl">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-inner"
            style={{ backgroundColor: activePlayer?.color }}
          >
            {activePlayer?.avatar}
          </div>
          <div>
            <p className="font-bold text-[var(--color-text-primary)]">{activePlayer?.name}</p>
            <motion.p
              className="text-sm text-[var(--color-text-secondary)]"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              🤖 Calculating...
            </motion.p>
          </div>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-2 mt-6">
          {players.map((_, idx) => (
            <div
              key={idx}
              className={`w-3 h-3 rounded-full ${
                idx < activePlayerIndex
                  ? 'bg-green-500'
                  : idx === activePlayerIndex
                  ? type === 'square' ? 'bg-purple-500' : 'bg-orange-500'
                  : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      </div>
    );
  }

  // Results phase
  if (phase === 'results') {
    const sortedResults = [...playerResults]
      .filter(g => g.submitted)
      .sort((a, b) => (a.difference ?? Infinity) - (b.difference ?? Infinity));

    const winner = sortedResults[0];

    return (
      <motion.div
        className="game-card rounded-3xl p-6 shadow-2xl"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <div className="text-center mb-4">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${gradientFrom} ${gradientTo} text-white text-3xl font-bold mb-2`}>
            {emoji}
          </div>
          <h2 className={`text-2xl font-black bg-gradient-to-r ${gradientFrom} ${gradientTo} bg-clip-text text-transparent`}>
            Results!
          </h2>
          <p className="text-[var(--color-text-secondary)]">
            {emoji}{challenge.number.toLocaleString()} = <span className="font-bold text-[var(--color-text-primary)]">{challenge.root}</span>
          </p>
        </div>

        <div className="space-y-2 mb-6">
          {sortedResults.map((result, idx) => {
            const isWinner = idx === 0;
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
                    : result.difference === 0
                    ? {
                        background: 'rgba(152, 236, 101, 0.15)',
                        border: '1px solid rgba(152, 236, 101, 0.3)',
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
                <div className="flex items-center gap-3">
                  {isWinner && <span className="text-xl">🏆</span>}
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                    style={{ backgroundColor: result.playerColor }}
                  >
                    {result.playerAvatar}
                  </div>
                  <span className="font-bold text-[var(--color-text-primary)]">{result.playerName}</span>
                  {result.isAI && <span className="text-xs text-[var(--color-text-muted)]">🤖</span>}
                </div>
                <div className="text-right">
                  <div className="font-bold text-[var(--color-text-primary)]">{result.guess}</div>
                  <div className={`text-xs ${result.difference === 0 ? 'text-[#98ec65]' : 'text-[var(--color-text-secondary)]'}`}>
                    {result.difference === 0 ? 'Perfect!' : `off by ${result.difference?.toFixed(2)}`}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="text-center text-[var(--color-text-secondary)] mb-4">
          {winner?.playerId === triggeringPlayer.id
            ? winner.difference === 0
              ? `Perfect! You advance ${challenge.number >= 100 ? 4 : challenge.number >= 50 ? 3 : 2} spaces!`
              : `Nice! You advance ${Math.max(1, Math.floor((challenge.number >= 100 ? 4 : challenge.number >= 50 ? 3 : 2) / 2))} spaces!`
            : `${winner?.playerName} wins! You stay put.`}
        </div>

        <motion.button
          className={`w-full py-3 bg-gradient-to-r ${gradientFrom} ${gradientTo} text-white font-bold text-lg rounded-xl`}
          onClick={handleContinue}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Continue
        </motion.button>
      </motion.div>
    );
  }

  // Playing phase - human player's turn
  return (
    <div className="game-card rounded-3xl p-6 shadow-2xl">
      {/* Header */}
      <div className="text-center mb-4">
        <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${gradientFrom} ${gradientTo} text-white text-3xl font-bold mb-2`}>
          {emoji}
        </div>
        <h2 className={`text-2xl font-black bg-gradient-to-r ${gradientFrom} ${gradientTo} bg-clip-text text-transparent`}>
          {title}
        </h2>
        <p className="text-[var(--color-text-secondary)]">{question} <span className="text-xs">(decimals allowed!)</span></p>
      </div>

      {/* Current player indicator */}
      <div className="text-center mb-4">
        <div className="inline-flex items-center gap-2 wood-inset px-4 py-2 rounded-full">
          <div
            className="w-6 h-6 rounded-lg flex items-center justify-center text-xs"
            style={{ backgroundColor: activePlayer?.color }}
          >
            {activePlayer?.avatar}
          </div>
          <span className="font-bold text-[var(--color-text-primary)]">{activePlayer?.name}'s turn</span>
        </div>
      </div>

      {/* Timer */}
      <div className="flex justify-center mb-4">
        <motion.div
          className={`text-4xl font-black ${timeLeft <= 5 ? 'text-red-500' : 'text-[var(--color-text-primary)]'}`}
          animate={timeLeft <= 5 ? { scale: [1, 1.15, 1] } : {}}
          transition={{ duration: 0.5, repeat: timeLeft <= 5 ? Infinity : 0 }}
        >
          {timeLeft}
        </motion.div>
      </div>

      {/* Number to solve */}
      <div className="text-center mb-6">
        <div className={`text-4xl font-black bg-gradient-to-r ${gradientFrom} ${gradientTo} bg-clip-text text-transparent mb-2`}>
          {emoji}{challenge.number.toLocaleString()}
        </div>
      </div>

      {/* Input */}
      <div className="flex flex-col items-center gap-4">
        <input
          ref={inputRef}
          type="number"
          step="0.01"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className={`w-40 text-center text-3xl font-black p-4 border-4 rounded-2xl focus:outline-none transition-colors bg-white text-gray-800 ${
            type === 'square'
              ? 'border-purple-200 focus:border-purple-500'
              : 'border-orange-200 focus:border-orange-500'
          }`}
          placeholder="?"
        />
        <div className="flex gap-3">
          <motion.button
            className={`px-8 py-3 bg-gradient-to-r ${gradientFrom} ${gradientTo} text-white font-bold text-lg rounded-xl shadow-lg`}
            onClick={handleSubmit}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Submit
          </motion.button>
          <motion.button
            className="px-6 py-3 bg-gray-200 text-gray-600 font-bold rounded-xl"
            onClick={handleSkip}
            whileHover={{ scale: 1.05, backgroundColor: '#e5e7eb' }}
            whileTap={{ scale: 0.95 }}
          >
            Skip
          </motion.button>
        </div>
      </div>

      {/* Progress dots */}
      <div className="flex justify-center gap-2 mt-6">
        {players.map((_, idx) => (
          <div
            key={idx}
            className={`w-3 h-3 rounded-full ${
              idx < activePlayerIndex
                ? 'bg-green-500'
                : idx === activePlayerIndex
                ? type === 'square' ? 'bg-purple-500' : 'bg-orange-500'
                : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
