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
    color: '#3185FC',
    glow: 'rgba(49, 133, 252, 0.4)',
    icon: '◆',
    description: 'A number divisible only by 1 and itself.',
    minigame: 'prime_off',
    minigameDesc: 'Find the prime number in both grids!',
  },
  twin_prime: {
    name: 'Twin Prime',
    color: '#4ECDC4',
    glow: 'rgba(78, 205, 196, 0.4)',
    icon: '◆◆',
    description: 'One of a pair of primes that differ by 2 (e.g., 11 & 13).',
    minigame: 'prime_blackjack',
    minigameDesc: 'Hit cards (0-9) to build a prime sum under 100!',
  },
  multiple_of_10: {
    name: 'Multiple of 10',
    color: '#FFE66D',
    glow: 'rgba(255, 230, 109, 0.4)',
    icon: '★',
    description: 'A number that ends in zero.',
    minigame: 'double_digits',
    minigameDesc: 'Roll two d10s to teleport anywhere!',
  },
  fibonacci: {
    name: 'Fibonacci Number',
    color: '#5FAD56',
    glow: 'rgba(95, 173, 86, 0.4)',
    icon: '🌀',
    description: 'Part of the sequence where each number is the sum of the two before it.',
    minigame: 'sequence_savant',
    minigameDesc: 'Find the missing number in the sequence!',
  },
  perfect_square: {
    name: 'Perfect Square',
    color: '#9B59B6',
    glow: 'rgba(155, 89, 182, 0.4)',
    icon: '□',
    description: 'A number that is the product of an integer with itself.',
    minigame: 'root_race',
    minigameDesc: 'Calculate the square root fastest!',
  },
  perfect_cube: {
    name: 'Perfect Cube',
    color: '#F9A03F',
    glow: 'rgba(249, 160, 63, 0.4)',
    icon: '∛',
    description: 'A number that is the product of an integer multiplied by itself twice.',
    minigame: 'cube_root',
    minigameDesc: 'Calculate the cube root fastest!',
  },
  perfect_number: {
    name: 'Perfect Number',
    color: '#E84855',
    glow: 'rgba(232, 72, 85, 0.4)',
    icon: '∞',
    description: 'A number that equals the sum of its proper divisors (6 = 1+2+3).',
    minigame: 'factor_frenzy',
    minigameDesc: 'Tap all the divisors of a number!',
  },
  abundant: {
    name: 'Abundant Number',
    color: '#4ECDC4',
    glow: 'rgba(78, 205, 196, 0.4)',
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
    ? '#5FAD56'
    : isEnd
    ? '#FFE66D'
    : '#9B59B6';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="modal-backdrop z-40"
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
              className="modal-card p-5 sm:p-6 max-w-sm w-full max-h-[85dvh] overflow-y-auto pointer-events-auto"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header with square number */}
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-display font-black flex-shrink-0"
                    style={{
                      background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}cc 100%)`,
                      boxShadow: `0 0 25px ${primaryColor}60`,
                      color: isEnd ? 'var(--color-text-on-light)' : 'white',
                    }}
                  >
                    {squareNumber}
                  </div>
                  <div className="min-w-0">
                    <h2 className="heading-2 text-[var(--color-text-primary)]">
                      Square {squareNumber}
                    </h2>
                    {isStart && (
                      <p className="font-display font-bold" style={{ color: 'var(--color-aurora-green)' }}>Start!</p>
                    )}
                    {isEnd && (
                      <p className="font-display font-bold" style={{ color: 'var(--color-aurora-yellow)' }}>Finish Line!</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="btn-icon flex-shrink-0"
                  aria-label="Close square info"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Players on this square */}
              {playersOnSquare.length > 0 && (
                <div className="glass-inset mb-4 p-3">
                  <p className="label-caps mb-2">Players here</p>
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
                          <div className="glass-inset p-3">
                            <p className="label-caps mb-1">
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
                    background: 'rgba(255, 230, 109, 0.1)',
                    border: '1px solid rgba(255, 230, 109, 0.3)',
                  }}
                >
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    Land here to trigger the <strong style={{ color: 'var(--color-aurora-yellow)' }}>Final Showdown!</strong> Answer 3 random math questions to win.
                    Fail and you'll be sent back!
                  </p>
                </div>
              ) : isStart ? (
                <div
                  className="p-4 rounded-xl"
                  style={{
                    background: 'rgba(95, 173, 86, 0.1)',
                    border: '1px solid rgba(95, 173, 86, 0.3)',
                  }}
                >
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    The beginning of your mathematical journey! Roll your dice to start moving.
                  </p>
                </div>
              ) : (
                <div className="glass-inset p-4">
                  <p className="text-sm text-[var(--color-text-muted)]">
                    A regular square with no special properties. Land here and end your turn normally.
                  </p>
                </div>
              )}

              {/* Close button */}
              <button
                className="btn btn-purple mt-4 w-full"
                onClick={onClose}
              >
                Close
              </button>
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

