import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { MinigameType, DiceType } from '../../types/game';
import { useGameStore } from '../../stores/gameStore';
import { DICE_TYPES, DICE_CONFIG } from '../../utils/diceLogic';
import { SpinnerWheel } from '../Dice/SpinnerWheel';
import { DiceRoller } from '../Dice/DiceRoller';
import { GaussianRoller } from '../Dice/GaussianRoller';

// Import all minigames
import { PrimeOff } from '../Minigames/PrimeOff';
import { DoubleDigits } from '../Minigames/DoubleDigits';
import { RootRace } from '../Minigames/RootRace';
import { PrimeBlackjack } from '../Minigames/PrimeBlackjack';
import { SequenceSavant } from '../Minigames/SequenceSavant';
import { FactorFrenzy } from '../Minigames/FactorFrenzy';
import { NumberBuilder } from '../Minigames/NumberBuilder';
import { FinalShowdown } from '../Minigames/FinalShowdown';

interface TestModeProps {
  onExit: () => void;
}

type TestCategory = 'minigames' | 'dice' | 'spinner';

const MINIGAME_LIST: { type: MinigameType; name: string; description: string }[] = [
  { type: 'prime_off', name: 'Prime-Off', description: 'Find the prime number on both screens' },
  { type: 'double_digits', name: 'Double Digits', description: 'Roll two d10s to teleport' },
  { type: 'root_race', name: 'Root Race (Square)', description: 'Calculate square roots' },
  { type: 'cube_root', name: 'Root Race (Cube)', description: 'Calculate cube roots' },
  { type: 'prime_blackjack', name: 'Prime Blackjack', description: 'Hit primes under 100' },
  { type: 'sequence_savant', name: 'Sequence Savant', description: 'Complete the sequence' },
  { type: 'factor_frenzy', name: 'Factor Frenzy', description: 'Find all factors' },
  { type: 'number_builder', name: 'Number Builder', description: 'Build target number' },
  { type: 'final_showdown', name: 'Final Showdown', description: 'Answer 3 questions to win' },
];

export function TestMode({ onExit }: TestModeProps) {
  const [category, setCategory] = useState<TestCategory>('minigames');
  const [activeMinigame, setActiveMinigame] = useState<MinigameType | null>(null);
  const [selectedDice, setSelectedDice] = useState<DiceType | null>(null);
  const [lastRoll, setLastRoll] = useState<number | null>(null);
  const [spinResult, setSpinResult] = useState<DiceType | null>(null);

  // Initialize test players in the store
  const { initGame } = useGameStore();

  // Setup test environment when mounting
  const setupTestPlayers = () => {
    initGame(['Tester', 'Bot'], [{ name: 'Bot', difficulty: 'medium' }]);
  };

  const handleMinigameSelect = (type: MinigameType) => {
    setupTestPlayers();
    setActiveMinigame(type);
  };

  const handleDiceSelect = (type: DiceType) => {
    setSelectedDice(type);
    setLastRoll(null);
  };

  const handleSpinComplete = (dice: DiceType) => {
    setSpinResult(dice);
  };

  const resetDice = () => {
    setSelectedDice(null);
    setLastRoll(null);
  };

  const handleRollAgain = () => {
    setLastRoll(null);
  };

  // Render active minigame
  if (activeMinigame) {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
        <motion.div
          className="w-full max-w-lg"
          initial={{ scale: 0.8, y: 50 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.8, y: 50 }}
        >
          {/* Exit button */}
          <motion.button
            className="absolute top-4 right-4 z-50 px-4 py-2 bg-red-500 text-white rounded-lg font-bold"
            onClick={() => setActiveMinigame(null)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Exit Minigame
          </motion.button>

          {/* Render the minigame */}
          {activeMinigame === 'prime_off' && <PrimeOff />}
          {activeMinigame === 'double_digits' && <DoubleDigits />}
          {activeMinigame === 'root_race' && <RootRace type="square" />}
          {activeMinigame === 'cube_root' && <RootRace type="cube" />}
          {activeMinigame === 'prime_blackjack' && <PrimeBlackjack />}
          {activeMinigame === 'sequence_savant' && <SequenceSavant />}
          {activeMinigame === 'factor_frenzy' && <FactorFrenzy />}
          {activeMinigame === 'number_builder' && <NumberBuilder />}
          {activeMinigame === 'final_showdown' && <FinalShowdown />}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      {/* Header */}
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-black text-[var(--color-text-primary)]">Test Mode</h1>
            <p className="text-[var(--color-text-secondary)]">Test minigames, dice, and spinner</p>
          </div>
          <motion.button
            className="px-6 py-3 wood-raised text-white font-bold rounded-xl"
            onClick={onExit}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Exit Test Mode
          </motion.button>
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { id: 'minigames' as TestCategory, label: 'Minigames', icon: '🎮' },
            { id: 'dice' as TestCategory, label: 'Dice Roller', icon: '🎲' },
            { id: 'spinner' as TestCategory, label: 'Spinner Wheel', icon: '🎯' },
          ].map((tab) => (
            <motion.button
              key={tab.id}
              className={`flex-1 py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 ${
                category === tab.id
                  ? 'piece-sapphire text-white'
                  : 'wood-inset text-[var(--color-text-secondary)]'
              }`}
              onClick={() => setCategory(tab.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </motion.button>
          ))}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {category === 'minigames' && (
            <motion.div
              key="minigames"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {MINIGAME_LIST.map((minigame) => (
                <motion.button
                  key={minigame.type}
                  className="game-card p-4 rounded-xl text-left hover:shadow-lg transition-shadow"
                  onClick={() => handleMinigameSelect(minigame.type)}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <h3 className="font-bold text-[var(--color-text-primary)] text-lg mb-1">
                    {minigame.name}
                  </h3>
                  <p className="text-[var(--color-text-secondary)] text-sm">
                    {minigame.description}
                  </p>
                </motion.button>
              ))}
            </motion.div>
          )}

          {category === 'dice' && (
            <motion.div
              key="dice"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="game-card p-6 rounded-xl"
            >
              {!selectedDice ? (
                <div>
                  <h3 className="font-bold text-[var(--color-text-primary)] text-lg mb-4">
                    Select a die to test:
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {DICE_TYPES.map((type) => {
                      const config = DICE_CONFIG[type];
                      return (
                        <motion.button
                          key={type}
                          className="p-4 rounded-xl text-white font-bold"
                          style={{ backgroundColor: config.color }}
                          onClick={() => handleDiceSelect(type)}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <div className="text-2xl mb-1">{config.name}</div>
                          <div className="text-sm opacity-80">
                            {config.description}
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              ) : selectedDice === 'gaussian' ? (
                <div className="flex flex-col items-center">
                  <GaussianRoller
                    onComplete={(result) => {
                      setLastRoll(result);
                    }}
                  />
                  {lastRoll !== null && (
                    <div className="mt-4 text-center">
                      <p className="text-xl font-bold text-[var(--color-text-primary)]">
                        Result: {lastRoll}
                      </p>
                    </div>
                  )}
                  <motion.button
                    className="mt-4 px-6 py-2 wood-inset rounded-lg font-bold text-[var(--color-text-secondary)]"
                    onClick={resetDice}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Back to Dice Selection
                  </motion.button>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <DiceRoller
                    diceType={selectedDice}
                    onRollComplete={(result: number) => setLastRoll(result)}
                  />
                  {lastRoll !== null && (
                    <motion.button
                      className="mt-4 px-6 py-2 piece-emerald text-white rounded-lg font-bold"
                      onClick={handleRollAgain}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Roll Again
                    </motion.button>
                  )}
                  <motion.button
                    className="mt-4 px-6 py-2 wood-inset rounded-lg font-bold text-[var(--color-text-secondary)]"
                    onClick={resetDice}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Back to Dice Selection
                  </motion.button>
                </div>
              )}
            </motion.div>
          )}

          {category === 'spinner' && (
            <motion.div
              key="spinner"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="game-card p-6 rounded-xl flex flex-col items-center"
            >
              <SpinnerWheel onSpinComplete={handleSpinComplete} />

              {spinResult && (
                <motion.div
                  className="mt-6 p-4 rounded-xl text-center"
                  style={{ backgroundColor: DICE_CONFIG[spinResult].color }}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                >
                  <p className="text-white font-bold text-xl">
                    Last Result: {DICE_CONFIG[spinResult].name}
                  </p>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
