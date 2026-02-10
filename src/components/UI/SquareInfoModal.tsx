import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSpecialTypes, type SpecialSquareType, type MinigameType } from '../../types/game';
import { useGameStore } from '../../stores/gameStore';

interface SquareInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  squareNumber: number;
}

// Map special types to display names and descriptions
const SPECIAL_TYPE_INFO: Record<SpecialSquareType, {
  name: string;
  color: string;
  glow: string;
  icon: string;
  description: string;
  minigame: MinigameType | null;
  minigameDesc: string;
}> = {
  prime: {
    name: 'Prime Number',
    color: '#61dafb',
    glow: 'rgba(97, 218, 251, 0.4)',
    icon: '◆',
    description: 'A number divisible only by 1 and itself.',
    minigame: 'prime_off',
    minigameDesc: 'Find the prime number in both grids!',
  },
  twin_prime: {
    name: 'Twin Prime',
    color: '#56d4c8',
    glow: 'rgba(86, 212, 200, 0.4)',
    icon: '◆◆',
    description: 'One of a pair of primes that differ by 2 (e.g., 11 & 13).',
    minigame: 'prime_blackjack',
    minigameDesc: 'Hit cards (0-9) to build a prime sum under 100!',
  },
  multiple_of_10: {
    name: 'Multiple of 10',
    color: '#ffd93d',
    glow: 'rgba(255, 217, 61, 0.4)',
    icon: '★',
    description: 'A number that ends in zero.',
    minigame: 'double_digits',
    minigameDesc: 'Roll two d10s to teleport anywhere!',
  },
  fibonacci: {
    name: 'Fibonacci Number',
    color: '#98ec65',
    glow: 'rgba(152, 236, 101, 0.4)',
    icon: '🌀',
    description: 'Part of the sequence where each number is the sum of the two before it.',
    minigame: 'sequence_savant',
    minigameDesc: 'Find the missing number in the sequence!',
  },
  perfect_square: {
    name: 'Perfect Square',
    color: '#c678dd',
    glow: 'rgba(198, 120, 221, 0.4)',
    icon: '□',
    description: 'A number that is the product of an integer with itself.',
    minigame: 'root_race',
    minigameDesc: 'Calculate the square root fastest!',
  },
  perfect_cube: {
    name: 'Perfect Cube',
    color: '#ff9f43',
    glow: 'rgba(255, 159, 67, 0.4)',
    icon: '∛',
    description: 'A number that is the product of an integer multiplied by itself twice.',
    minigame: 'cube_root',
    minigameDesc: 'Calculate the cube root fastest!',
  },
  perfect_number: {
    name: 'Perfect Number',
    color: '#ff6b9d',
    glow: 'rgba(255, 107, 157, 0.4)',
    icon: '∞',
    description: 'A number that equals the sum of its proper divisors (6 = 1+2+3).',
    minigame: 'factor_frenzy',
    minigameDesc: 'Tap all the divisors of a number!',
  },
  abundant: {
    name: 'Abundant Number',
    color: '#56d4c8',
    glow: 'rgba(86, 212, 200, 0.4)',
    icon: '+',
    description: 'A number where the sum of proper divisors exceeds the number.',
    minigame: 'number_builder',
    minigameDesc: 'Use 4 numbers to hit the target!',
  },
};

export function SquareInfoModal({ isOpen, onClose, squareNumber }: SquareInfoModalProps) {
  const { players } = useGameStore();
  const specialTypes = getSpecialTypes(squareNumber);
  const primaryType = specialTypes[0];
  const playersOnSquare = players.filter(p => p.position === squareNumber);

  const isStart = squareNumber === 1;
  const isEnd = squareNumber === 100;

  // Get primary color for the modal glow
  const primaryColor = primaryType
    ? SPECIAL_TYPE_INFO[primaryType].color
    : isStart
    ? '#98ec65'
    : isEnd
    ? '#ffd93d'
    : '#c678dd';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/60 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="rounded-3xl p-6 max-w-sm w-full pointer-events-auto"
              style={{
                background: 'rgba(15, 10, 31, 0.95)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: `0 0 40px ${primaryColor}40, 0 8px 32px rgba(0, 0, 0, 0.5)`,
              }}
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header with square number */}
              <div className="flex items-center gap-4 mb-4">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-display font-black"
                  style={{
                    background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}cc 100%)`,
                    boxShadow: `0 0 25px ${primaryColor}60`,
                    color: isEnd ? '#0f0a1f' : 'white',
                  }}
                >
                  {squareNumber}
                </div>
                <div>
                  <h2 className="font-display text-2xl font-black text-[var(--color-text-primary)]">
                    Square {squareNumber}
                  </h2>
                  {isStart && (
                    <p className="font-display font-bold" style={{ color: '#98ec65' }}>Start!</p>
                  )}
                  {isEnd && (
                    <p className="font-display font-bold" style={{ color: '#ffd93d' }}>Finish Line!</p>
                  )}
                </div>
              </div>

              {/* Players on this square */}
              {playersOnSquare.length > 0 && (
                <div
                  className="mb-4 p-3 rounded-xl"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <p className="text-xs text-[var(--color-text-muted)] mb-2 uppercase tracking-wide">Players here</p>
                  <div className="flex flex-wrap gap-2">
                    {playersOnSquare.map(p => (
                      <div
                        key={p.id}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full"
                        style={{
                          backgroundColor: `${p.color}20`,
                          color: p.color,
                          border: `1px solid ${p.color}40`,
                        }}
                      >
                        <span>{p.avatar}</span>
                        <span className="font-display font-bold text-sm">{p.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Special types */}
              {specialTypes.length > 0 ? (
                <div className="space-y-3">
                  {specialTypes.map((type) => {
                    const info = SPECIAL_TYPE_INFO[type];
                    return (
                      <div
                        key={type}
                        className="p-4 rounded-xl"
                        style={{
                          background: `${info.color}15`,
                          border: `1px solid ${info.color}40`,
                        }}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xl">{info.icon}</span>
                          <span className="font-display font-bold" style={{ color: info.color }}>{info.name}</span>
                        </div>
                        <p className="text-sm text-[var(--color-text-secondary)] mb-3">
                          {info.description}
                        </p>
                        {info.minigame && (
                          <div
                            className="rounded-lg p-3"
                            style={{
                              background: 'rgba(255, 255, 255, 0.05)',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                            }}
                          >
                            <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wide mb-1">
                              Minigame
                            </p>
                            <p className="text-sm font-medium text-[var(--color-text-primary)]">
                              {info.minigameDesc}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : isEnd ? (
                <div
                  className="p-4 rounded-xl"
                  style={{
                    background: 'rgba(255, 217, 61, 0.1)',
                    border: '1px solid rgba(255, 217, 61, 0.3)',
                  }}
                >
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    Land here to trigger the <strong style={{ color: '#ffd93d' }}>Final Showdown!</strong> Answer 3 random math questions to win.
                    Fail and you'll be sent back!
                  </p>
                </div>
              ) : isStart ? (
                <div
                  className="p-4 rounded-xl"
                  style={{
                    background: 'rgba(152, 236, 101, 0.1)',
                    border: '1px solid rgba(152, 236, 101, 0.3)',
                  }}
                >
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    The beginning of your mathematical journey! Roll your dice to start moving.
                  </p>
                </div>
              ) : (
                <div
                  className="p-4 rounded-xl"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <p className="text-sm text-[var(--color-text-muted)]">
                    A regular square with no special properties. Land here and end your turn normally.
                  </p>
                </div>
              )}

              {/* Close button */}
              <motion.button
                className="mt-4 w-full py-3 font-display font-bold rounded-xl"
                style={{
                  background: 'linear-gradient(135deg, #c678dd 0%, #ff6b9d 100%)',
                  boxShadow: '0 0 20px rgba(198, 120, 221, 0.4)',
                  color: 'white',
                }}
                onClick={onClose}
                whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(198, 120, 221, 0.6)' }}
                whileTap={{ scale: 0.98 }}
              >
                Close
              </motion.button>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Hook for managing square info modal state
export function useSquareInfoModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [squareNumber, setSquareNumber] = useState(1);

  const open = (square: number) => {
    setSquareNumber(square);
    setIsOpen(true);
  };

  const close = () => setIsOpen(false);

  return { isOpen, squareNumber, open, close };
}

