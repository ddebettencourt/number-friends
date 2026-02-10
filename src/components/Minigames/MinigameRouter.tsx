import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { MinigameType } from '../../types/game';
import { useGameStore } from '../../stores/gameStore';
import { soundEngine } from '../../utils/soundEngine';
import { PrimeOff } from './PrimeOff';
import { DoubleDigits } from './DoubleDigits';
import { RootRace } from './RootRace';
import { PrimeBlackjack } from './PrimeBlackjack';
import { SequenceSavant } from './SequenceSavant';
import { FactorFrenzy } from './FactorFrenzy';
import { NumberBuilder } from './NumberBuilder';
import { FinalShowdown } from './FinalShowdown';
import { PassToPlayer } from './PassToPlayer';

interface MinigameRouterProps {
  minigame: MinigameType;
}

// Info about each minigame for the pass screen
const MINIGAME_INFO: Record<MinigameType, { name: string; description: string; stakes: string }> = {
  prime_off: { name: 'Prime-Off!', description: 'Find the prime number on BOTH screens!', stakes: 'Win: advance to next prime | Lose: stay put' },
  double_digits: { name: 'Double Digits!', description: 'Roll two d10s to teleport anywhere!', stakes: 'Teleport to rolled position (risky!)' },
  root_race: { name: 'Root Race!', description: 'Calculate the square root fastest!', stakes: 'Win: advance 3 spaces | Lose: stay put' },
  cube_root: { name: 'Cube Root!', description: 'Calculate the cube root fastest!', stakes: 'Win: advance 3 spaces | Lose: stay put' },
  prime_blackjack: { name: 'Prime Blackjack!', description: 'Build the highest prime sum under 100!', stakes: 'Win: advance to next prime | Bust: back 5 spaces' },
  sequence_savant: { name: 'Sequence Savant!', description: 'Find the missing number in the sequence!', stakes: 'Win: advance 3 spaces | Lose: stay put' },
  factor_frenzy: { name: 'Factor Frenzy!', description: 'List as many factors as you can!', stakes: 'Move forward by factors found' },
  number_builder: { name: 'Number Builder!', description: 'Use all 4 numbers to hit your target!', stakes: 'Move forward based on accuracy' },
  final_showdown: { name: 'Final Showdown!', description: 'The ultimate math challenge!', stakes: 'Win: claim victory! | Lose: back to 95' },
};

// Minigames that handle their own AI (not auto-played by MinigameRouter)
const SELF_HANDLING_MINIGAMES: MinigameType[] = ['prime_off', 'number_builder', 'prime_blackjack', 'root_race', 'cube_root', 'double_digits'];

export function MinigameRouter({ minigame }: MinigameRouterProps) {
  const { players, currentPlayerIndex, isCurrentPlayerAI, getCurrentPlayerAIDifficulty, endMinigame } = useGameStore();
  const currentPlayer = players[currentPlayerIndex];
  const isAI = isCurrentPlayerAI();
  const aiDifficulty = getCurrentPlayerAIDifficulty();

  // Play minigame start sound
  useEffect(() => {
    soundEngine.minigameStart();
  }, []);

  // Show pass screen for human players on router-handled minigames
  const [showPassScreen, setShowPassScreen] = useState(!isAI);

  // Check if this minigame handles its own AI
  const selfHandlesAI = SELF_HANDLING_MINIGAMES.includes(minigame);

  // AI skips pass screen
  useEffect(() => {
    if (isAI) {
      setShowPassScreen(false);
    }
  }, [isAI]);

  // AI auto-plays SOLO minigames only (self-handling ones manage AI internally)
  useEffect(() => {
    if (!isAI || selfHandlesAI || showPassScreen) return;

    const timer = setTimeout(() => {
      // AI plays the minigame based on difficulty
      let movement = 0;

      switch (minigame) {
        case 'double_digits':
          // Just a random teleport - handled by the minigame component itself
          movement = 0;
          break;

        case 'root_race':
        case 'cube_root':
          // AI guesses based on difficulty
          if (aiDifficulty === 'hard') movement = Math.random() < 0.7 ? 3 : 0;
          else if (aiDifficulty === 'medium') movement = Math.random() < 0.4 ? 3 : 0;
          else movement = Math.random() < 0.2 ? 2 : 0;
          break;

        case 'sequence_savant':
          // Fibonacci challenge
          if (aiDifficulty === 'hard') movement = Math.random() < 0.9 ? 3 : 0;
          else if (aiDifficulty === 'medium') movement = Math.random() < 0.6 ? 2 : 0;
          else movement = Math.random() < 0.3 ? 1 : 0;
          break;

        case 'factor_frenzy':
          // Factor listing
          if (aiDifficulty === 'hard') movement = Math.floor(Math.random() * 4) + 2;
          else if (aiDifficulty === 'medium') movement = Math.floor(Math.random() * 3) + 1;
          else movement = Math.floor(Math.random() * 2);
          break;

        case 'final_showdown':
          // Final challenge - AI has chance to win
          if (aiDifficulty === 'hard') movement = Math.random() < 0.6 ? 1 : -1;
          else if (aiDifficulty === 'medium') movement = Math.random() < 0.4 ? 1 : -1;
          else movement = Math.random() < 0.2 ? 1 : -1;
          break;

        default:
          movement = 0;
      }

      endMinigame(movement);
    }, 2000); // AI takes 2 seconds to "play"

    return () => clearTimeout(timer);
  }, [isAI, selfHandlesAI, showPassScreen, minigame, aiDifficulty, endMinigame]);

  // Show pass screen for human players on non-self-handling minigames
  if (showPassScreen && !selfHandlesAI) {
    const info = MINIGAME_INFO[minigame];
    return (
      <motion.div
        className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="w-full max-w-lg"
          initial={{ scale: 0.8, y: 50 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.8, y: 50 }}
        >
          <PassToPlayer
            player={currentPlayer}
            minigameName={info.name}
            minigameDescription={info.description}
            stakes={info.stakes}
            onReady={() => setShowPassScreen(false)}
          />
        </motion.div>
      </motion.div>
    );
  }

  // Show AI playing message for SOLO minigames only
  if (isAI && !selfHandlesAI) {
    return (
      <motion.div
        className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-white rounded-2xl p-8 shadow-2xl text-center"
          initial={{ scale: 0.8, y: 50 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.8, y: 50 }}
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-gray-600">
              <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
              <circle cx="9" cy="10" r="2" fill="currentColor" />
              <circle cx="15" cy="10" r="2" fill="currentColor" />
              <path d="M8 15h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">AI is playing...</h2>
          <p className="text-gray-500">
            {minigame === 'double_digits' && 'Rolling the dice...'}
            {minigame === 'root_race' && 'Calculating the square root...'}
            {minigame === 'cube_root' && 'Calculating the cube root...'}
            {minigame === 'sequence_savant' && 'Solving the sequence...'}
            {minigame === 'factor_frenzy' && 'Finding factors...'}
            {minigame === 'final_showdown' && 'Attempting the final challenge...'}
          </p>
        </motion.div>
      </motion.div>
    );
  }

  const renderMinigame = () => {
    switch (minigame) {
      case 'prime_off':
        return <PrimeOff />;
      case 'double_digits':
        return <DoubleDigits />;
      case 'root_race':
        return <RootRace type="square" />;
      case 'cube_root':
        return <RootRace type="cube" />;
      case 'prime_blackjack':
        return <PrimeBlackjack />;
      case 'sequence_savant':
        return <SequenceSavant />;
      case 'factor_frenzy':
        return <FactorFrenzy />;
      case 'number_builder':
        return <NumberBuilder />;
      case 'final_showdown':
        return <FinalShowdown />;
      default:
        return null;
    }
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="w-full max-w-lg"
        initial={{ scale: 0.8, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.8, y: 50 }}
      >
        {renderMinigame()}
      </motion.div>
    </motion.div>
  );
}
