import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../../stores/gameStore';
import { useStatsStore } from '../../stores/statsStore';
import { generatePerfectSquare } from '../../utils/mathHelpers';

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
    <div
      className="rounded-2xl p-6"
      style={{
        background: 'linear-gradient(135deg, rgba(255, 217, 61, 0.2) 0%, rgba(255, 159, 67, 0.15) 100%)',
        border: '2px solid rgba(255, 217, 61, 0.5)',
        boxShadow: '0 0 40px rgba(255, 217, 61, 0.4), 0 8px 32px rgba(0, 0, 0, 0.3)',
      }}
    >
      <div className="text-center mb-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" style={{ color: '#ffd93d' }}>
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor" />
          </svg>
          <motion.h2
            className="font-display text-3xl font-bold"
            style={{ color: '#ffd93d' }}
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            FINAL SHOWDOWN!
          </motion.h2>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" style={{ color: '#ffd93d' }}>
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor" />
          </svg>
        </div>
        <p className="text-[var(--color-text-secondary)]">Solve this to claim victory!</p>
      </div>

      {/* Timer */}
      <div className="flex justify-center mb-4">
        <motion.div
          className="text-5xl font-display font-bold"
          style={{ color: timeLeft <= 5 ? '#ff6b9d' : '#ffd93d' }}
          animate={timeLeft <= 5 ? { scale: [1, 1.2, 1] } : {}}
          transition={{ duration: 0.3, repeat: timeLeft <= 5 ? Infinity : 0 }}
        >
          {timeLeft}
        </motion.div>
      </div>

      {/* Challenge */}
      <div className="text-center mb-6">
        <div className="text-[var(--color-text-secondary)] mb-2">What is the square root of...</div>
        <motion.div
          className="text-5xl font-display font-bold"
          style={{ color: '#ffd93d' }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring' }}
        >
          {challenge.number.toLocaleString()}
        </motion.div>
        <div className="text-[var(--color-text-muted)] text-sm mt-2">
          (Must be exact!)
        </div>
      </div>

      {!gameOver ? (
        <div className="flex flex-col items-center gap-4">
          <input
            type="number"
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
            className="w-40 text-center text-4xl font-display font-bold p-4 rounded-xl focus:outline-none"
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '2px solid rgba(255, 217, 61, 0.5)',
              color: 'var(--color-text-primary)',
            }}
            placeholder="?"
            autoFocus
          />
          <motion.button
            className="px-10 py-4 font-display font-bold text-2xl rounded-xl text-[#0f0a1f]"
            style={{
              background: 'linear-gradient(135deg, #ffd93d 0%, #ff9f43 100%)',
              boxShadow: '0 0 25px rgba(255, 217, 61, 0.5)',
            }}
            onClick={handleSubmit}
            whileHover={{ scale: 1.05, boxShadow: '0 0 35px rgba(255, 217, 61, 0.7)' }}
            whileTap={{ scale: 0.95 }}
          >
            SUBMIT!
          </motion.button>
        </div>
      ) : (
        <motion.div
          className="text-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          {isCorrect ? (
            <>
              <motion.div
                className="text-6xl mb-4"
                animate={{ rotate: [0, 10, -10, 10, 0], scale: [1, 1.2, 1] }}
                transition={{ duration: 0.5 }}
              >
                🎉
              </motion.div>
              <div className="font-display font-bold text-2xl mb-2" style={{ color: '#98ec65' }}>
                VICTORY!
              </div>
              <div className="text-[var(--color-text-secondary)] mb-4">
                The answer was {challenge.root}. You got it!
              </div>
            </>
          ) : (
            <>
              <div className="text-4xl mb-4">😢</div>
              <div className="font-display font-bold text-xl mb-2" style={{ color: '#ff6b9d' }}>
                Not quite...
              </div>
              <div className="text-[var(--color-text-secondary)] mb-4">
                The answer was {challenge.root}. Back you go!
              </div>
            </>
          )}
          <motion.button
            className="px-8 py-3 font-display font-bold rounded-xl text-[#0f0a1f]"
            style={{
              background: 'linear-gradient(135deg, #ffd93d 0%, #ff9f43 100%)',
              boxShadow: '0 0 20px rgba(255, 217, 61, 0.4)',
            }}
            onClick={handleContinue}
            whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(255, 217, 61, 0.6)' }}
            whileTap={{ scale: 0.95 }}
          >
            {isCorrect ? 'Claim Victory!' : 'Try Again...'}
          </motion.button>
        </motion.div>
      )}
    </div>
  );
}
