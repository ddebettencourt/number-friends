import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../../stores/gameStore';
import { useStatsStore } from '../../stores/statsStore';
import { rollDoubleDigits } from '../../utils/diceLogic';
import { PassToPlayer } from './PassToPlayer';

export function DoubleDigits() {
  const { players, currentPlayerIndex, endMinigame, isCurrentPlayerAI, getCurrentPlayerAIDifficulty, aiPlayers } = useGameStore();
  const currentPlayer = players[currentPlayerIndex];
  const isAI = isCurrentPlayerAI();
  const aiDifficulty = getCurrentPlayerAIDifficulty();

  // Check if there are any human players (for pass screen)
  const hasHumanPlayers = players.some(p => !aiPlayers.has(p.id));

  const [phase, setPhase] = useState<'pass' | 'intro' | 'rolling' | 'result'>(
    hasHumanPlayers && !isAI ? 'pass' : 'intro'
  );
  const [result, setResult] = useState<{ digit1: number; digit2: number; result: number } | null>(null);
  const [displayDigit1, setDisplayDigit1] = useState(0);
  const [displayDigit2, setDisplayDigit2] = useState(0);

  // AI auto-plays
  useEffect(() => {
    if (!isAI || phase !== 'intro') return;

    // AI decides whether to roll based on difficulty and position
    const timer = setTimeout(() => {
      // Hard AI always takes the risk, medium 70%, easy 50%
      const rollChance = aiDifficulty === 'hard' ? 0.9 : aiDifficulty === 'medium' ? 0.7 : 0.5;

      if (Math.random() < rollChance) {
        handleRoll();
      } else {
        // AI skips
        useStatsStore.getState().recordMinigame({
          turnNumber: useStatsStore.getState().stats.totalTurns,
          triggeringPlayerId: currentPlayer.id,
          minigameType: 'double_digits',
          data: {
            type: 'double_digits',
            playerId: currentPlayer.id,
            digit1: 0,
            digit2: 0,
            resultPosition: currentPlayer.position,
            positionBefore: currentPlayer.position,
            delta: 0,
            skipped: true,
          },
        });
        endMinigame(0);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [isAI, aiDifficulty, phase]);

  // AI auto-continues after result
  useEffect(() => {
    if (!isAI || phase !== 'result') return;

    const timer = setTimeout(() => {
      handleContinue();
    }, 2000);

    return () => clearTimeout(timer);
  }, [isAI, phase]);

  const handleRoll = () => {
    setPhase('rolling');

    // Animate digits
    let count = 0;
    const interval = setInterval(() => {
      setDisplayDigit1(Math.floor(Math.random() * 10));
      setDisplayDigit2(Math.floor(Math.random() * 10));
      count++;
      if (count > 20) {
        clearInterval(interval);
        const rollResult = rollDoubleDigits();
        setResult(rollResult);
        setDisplayDigit1(rollResult.digit1);
        setDisplayDigit2(rollResult.digit2);
        setPhase('result');
      }
    }, 80);
  };

  const handleSkip = () => {
    // Stay on current position
    useStatsStore.getState().recordMinigame({
      turnNumber: useStatsStore.getState().stats.totalTurns,
      triggeringPlayerId: currentPlayer.id,
      minigameType: 'double_digits',
      data: {
        type: 'double_digits',
        playerId: currentPlayer.id,
        digit1: 0,
        digit2: 0,
        resultPosition: currentPlayer.position,
        positionBefore: currentPlayer.position,
        delta: 0,
        skipped: true,
      },
    });
    endMinigame(0);
  };

  const handleContinue = () => {
    if (result) {
      // Use movement delta so endMinigame handles position update AND win check
      // (endMinigame triggers Final Showdown when new position reaches 100)
      const movement = result.result - currentPlayer.position;
      useStatsStore.getState().recordMinigame({
        turnNumber: useStatsStore.getState().stats.totalTurns,
        triggeringPlayerId: currentPlayer.id,
        minigameType: 'double_digits',
        data: {
          type: 'double_digits',
          playerId: currentPlayer.id,
          digit1: result.digit1,
          digit2: result.digit2,
          resultPosition: result.result,
          positionBefore: currentPlayer.position,
          delta: result.result - currentPlayer.position,
          skipped: false,
        },
      });
      endMinigame(movement);
    }
  };

  // Pass screen - show who should play
  if (phase === 'pass') {
    return (
      <PassToPlayer
        player={currentPlayer}
        minigameName="Double Digits!"
        minigameDescription="Roll two d10s to teleport anywhere on the board!"
        onReady={() => setPhase('intro')}
      />
    );
  }

  return (
    <div className="bg-white rounded-3xl p-6 shadow-2xl">
      {/* Header */}
      <div className="text-center mb-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white text-3xl font-bold mb-2">
          10
        </div>
        <h2 className="text-2xl font-black bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
          Double Digits!
        </h2>
        <p className="text-gray-500">
          Roll two d10s to teleport anywhere on the board!
        </p>
      </div>

      {phase === 'intro' && (
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 mb-6">
            <p className="text-gray-700 mb-2">
              You landed on <span className="font-bold text-amber-600">square {currentPlayer.position}</span>!
            </p>
            <p className="text-gray-600 text-sm">
              Roll two 10-sided dice to teleport. Each die is a digit (00 = 100).
            </p>
            <p className="text-gray-500 text-xs mt-2">
              Risky! You might end up further back...
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <motion.button
              className="px-8 py-4 bg-gradient-to-r from-amber-400 to-orange-500 text-white font-bold text-xl rounded-2xl shadow-lg"
              onClick={handleRoll}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Roll the Dice!
            </motion.button>
            <motion.button
              className="px-6 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl"
              onClick={handleSkip}
              whileHover={{ scale: 1.02, backgroundColor: '#e5e7eb' }}
              whileTap={{ scale: 0.98 }}
            >
              No thanks, stay here
            </motion.button>
          </div>
        </motion.div>
      )}

      {(phase === 'rolling' || phase === 'result') && (
        <div className="flex flex-col items-center gap-6">
          {/* Dice display */}
          <div className="flex gap-4">
            <motion.div
              className="w-24 h-24 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center text-white text-5xl font-black shadow-lg"
              animate={phase === 'rolling' ? {
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              } : {}}
              transition={{
                duration: 0.15,
                repeat: phase === 'rolling' ? Infinity : 0
              }}
            >
              {displayDigit1}
            </motion.div>
            <motion.div
              className="w-24 h-24 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center text-white text-5xl font-black shadow-lg"
              animate={phase === 'rolling' ? {
                scale: [1, 1.1, 1],
                rotate: [0, -5, 5, 0]
              } : {}}
              transition={{
                duration: 0.15,
                repeat: phase === 'rolling' ? Infinity : 0,
                delay: 0.05
              }}
            >
              {displayDigit2}
            </motion.div>
          </div>

          {phase === 'rolling' && (
            <motion.p
              className="text-gray-500 font-medium"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 0.8, repeat: Infinity }}
            >
              Rolling...
            </motion.p>
          )}

          {phase === 'result' && result && (
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <motion.div
                className="text-5xl font-black bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent mb-2"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
              >
                {result.result}!
              </motion.div>
              <p className="text-gray-600 mb-4">
                {result.result > currentPlayer.position ? (
                  <span className="text-green-600 font-bold">
                    Jump forward {result.result - currentPlayer.position} spaces!
                  </span>
                ) : result.result < currentPlayer.position ? (
                  <span className="text-red-500 font-bold">
                    Oops! Back {currentPlayer.position - result.result} spaces!
                  </span>
                ) : (
                  <span className="text-amber-600 font-bold">
                    You stay right here!
                  </span>
                )}
              </p>
              <motion.button
                className="px-8 py-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white font-bold text-lg rounded-xl shadow-lg"
                onClick={handleContinue}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Teleport!
              </motion.button>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
