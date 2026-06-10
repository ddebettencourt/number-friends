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
      <div className="modal-backdrop flex items-center justify-center z-50 p-4">
        <motion.div
          className="w-full max-w-lg"
          initial={{ scale: 0.8, y: 50 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.8, y: 50 }}
        >
          {/* Exit button */}
          <button
            className="btn btn-pink btn-sm absolute top-4 right-4 z-50"
            onClick={() => setActiveMinigame(null)}
          >
            Exit Minigame
          </button>

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
            <h1 className="heading-1 text-[var(--color-text-primary)]">Test Mode</h1>
            <p className="text-[var(--color-text-secondary)]">Test minigames, dice, and spinner</p>
          </div>
          <button
            className="btn btn-purple btn-sm"
            onClick={onExit}
          >
            Exit Test Mode
          </button>
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {[
            {
              id: 'minigames' as TestCategory,
              label: 'Minigames',
              icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M17.32 5H6.68a4 4 0 0 0-3.98 3.59L2 14a3 3 0 0 0 5.12 2.3L9 14.5h6l1.88 1.8A3 3 0 0 0 22 14l-.7-5.41A4 4 0 0 0 17.32 5z" />
                  <path d="M6 11h4M8 9v4" />
                  <circle cx="15.5" cy="10.5" r="0.5" fill="currentColor" />
                  <circle cx="18" cy="12.5" r="0.5" fill="currentColor" />
                </svg>
              ),
            },
            {
              id: 'dice' as TestCategory,
              label: 'Dice Roller',
              icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="3" width="18" height="18" rx="4" />
                  <circle cx="8.5" cy="8.5" r="1" fill="currentColor" stroke="none" />
                  <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
                  <circle cx="15.5" cy="15.5" r="1" fill="currentColor" stroke="none" />
                </svg>
              ),
            },
            {
              id: 'spinner' as TestCategory,
              label: 'Spinner Wheel',
              icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="9" />
                  <circle cx="12" cy="12" r="5" />
                  <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
                </svg>
              ),
            },
          ].map((tab) => (
            <motion.button
              key={tab.id}
              className={`flex-1 min-h-[44px] py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 whitespace-nowrap ${
                category === tab.id
                  ? 'piece-sapphire text-white'
                  : 'glass-inset text-[var(--color-text-secondary)]'
              }`}
              onClick={() => setCategory(tab.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="flex items-center justify-center">{tab.icon}</span>
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
                  className="glass-card p-4 text-left hover:shadow-lg transition-shadow"
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
              className="glass-card p-6"
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
                  <button
                    className="btn btn-ghost btn-sm mt-4"
                    onClick={resetDice}
                  >
                    Back to Dice Selection
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <DiceRoller
                    diceType={selectedDice}
                    onRollComplete={(result: number) => setLastRoll(result)}
                  />
                  {lastRoll !== null && (
                    <button
                      className="btn btn-green btn-sm mt-4"
                      onClick={handleRollAgain}
                    >
                      Roll Again
                    </button>
                  )}
                  <button
                    className="btn btn-ghost btn-sm mt-4"
                    onClick={resetDice}
                  >
                    Back to Dice Selection
                  </button>
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
              className="glass-card p-6 flex flex-col items-center"
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
