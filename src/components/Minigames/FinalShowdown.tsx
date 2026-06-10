import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../../stores/gameStore';
import { useStatsStore } from '../../stores/statsStore';
import { generatePerfectSquare } from '../../utils/mathHelpers';

function StarIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
        fill="var(--color-aurora-yellow)"
        stroke="var(--color-aurora-orange)"
        strokeWidth="1"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FallenStarIcon({ size = 56 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      style={{ transform: 'rotate(-18deg)' }}
    >
      <path
        d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
        fill="rgba(232, 72, 85, 0.15)"
        stroke="var(--color-aurora-pink)"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M12 8v5" stroke="var(--color-aurora-pink)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function FinalShowdown() {
  const { endMinigame } = useGameStore();

  // Challenge: 3-4 digit number (balanced difficulty)
  const [digits] = useState(() => Math.floor(Math.random() * 2) + 3);
  const [challenge] = useState(() => generatePerfectSquare(digits));
  const [guess, setGuess] = useState('');
  const [timeLeft, setTimeLeft] = useState(20);
  const [gameOver, setGameOver] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  useEffect(() => {
    if (gameOver || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          handleSubmit();
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameOver, timeLeft]);

  const handleSubmit = () => {
    if (gameOver) return;
    setGameOver(true);

    const guessNum = parseInt(guess) || 0;
    setIsCorrect(guessNum === challenge.root); // Must be exact
  };

  const handleContinue = () => {
    const { players, currentPlayerIndex } = useGameStore.getState();
    const currentPlayer = players[currentPlayerIndex];

    useStatsStore.getState().recordMinigame({
      turnNumber: useStatsStore.getState().stats.totalTurns,
      triggeringPlayerId: currentPlayer.id,
      minigameType: 'final_showdown',
      data: {
        type: 'final_showdown',
        challengeNumber: challenge.number,
        correctRoot: challenge.root,
        playerId: currentPlayer.id,
        guess: guess,
        correct: isCorrect,
        timeRemaining: timeLeft,
      },
    });

    if (isCorrect) {
      endMinigame(1); // Win!
    } else {
      endMinigame(-1); // Move back
    }
  };

  return (
    <motion.div
      className="glass-card w-full max-w-lg mx-auto p-4 sm:p-6 max-h-[90dvh] overflow-y-auto"
      style={{
        border: '1px solid rgba(255, 230, 109, 0.5)',
        boxShadow: '0 0 40px rgba(255, 230, 109, 0.25), 0 8px 32px rgba(0, 0, 0, 0.4)',
      }}
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
    >
      <div className="text-center mb-4">
        <div className="label-caps mb-1" style={{ color: 'rgba(255, 230, 109, 0.7)' }}>
          Square 100 · Winner Takes All
        </div>
        <div className="flex items-center justify-center gap-2 mb-2">
          <StarIcon />
          <motion.h2
            className="heading-1 text-gradient-gold"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            FINAL SHOWDOWN!
          </motion.h2>
          <StarIcon />
        </div>
        <p className="font-body text-[var(--color-text-secondary)]">Solve this to claim victory!</p>
      </div>

      {/* Timer */}
      <div className="flex justify-center mb-4">
        <motion.div
          className={`font-display text-5xl ${timeLeft <= 5 ? 'text-aurora-pink' : 'text-aurora-yellow text-glow-gold'}`}
          animate={timeLeft <= 5 ? { scale: [1, 1.2, 1] } : {}}
          transition={{ duration: 0.3, repeat: timeLeft <= 5 ? Infinity : 0 }}
        >
          {timeLeft}
        </motion.div>
      </div>

      {/* Challenge */}
      <div className="text-center mb-6">
        <div className="font-body text-[var(--color-text-secondary)] mb-2">What is the square root of...</div>
        <motion.div
          className="big-number text-gradient-gold"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 350, damping: 25 }}
        >
          {challenge.number.toLocaleString()}
        </motion.div>
        <div className="font-body text-[var(--color-text-muted)] text-sm mt-2">
          (Must be exact!)
        </div>
      </div>

      {!gameOver ? (
        <div className="flex flex-col items-center gap-4">
          <input
            type="number"
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
            className="w-40 text-center text-4xl font-display"
            style={{ borderColor: 'rgba(255, 230, 109, 0.5)' }}
            placeholder="?"
            autoFocus
          />
          <button className="btn btn-yellow btn-lg glow-yellow" onClick={handleSubmit}>
            SUBMIT!
          </button>
        </div>
      ) : (
        <motion.div
          className="text-center"
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 350, damping: 25 }}
        >
          {isCorrect ? (
            <>
              <motion.div
                className="mb-4 flex justify-center"
                animate={{ rotate: [0, 10, -10, 10, 0], scale: [1, 1.2, 1] }}
                transition={{ duration: 0.5 }}
              >
                <StarIcon size={64} />
              </motion.div>
              <div className="font-display text-2xl text-aurora-green mb-2">
                VICTORY!
              </div>
              <div className="font-body text-[var(--color-text-secondary)] mb-4">
                The answer was {challenge.root}. You got it!
              </div>
            </>
          ) : (
            <>
              <div className="mb-4 flex justify-center">
                <FallenStarIcon />
              </div>
              <div className="font-display text-xl text-aurora-pink mb-2">
                Not quite...
              </div>
              <div className="font-body text-[var(--color-text-secondary)] mb-4">
                The answer was {challenge.root}. Back you go!
              </div>
            </>
          )}
          <button className="btn btn-yellow" onClick={handleContinue}>
            {isCorrect ? 'Claim Victory!' : 'Try Again...'}
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}
