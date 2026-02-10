import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { DiceType } from '../../types/game';
import { DICE_CONFIG, rollDice } from '../../utils/diceLogic';

interface DiceRoller2DProps {
  diceType: DiceType;
  onRollComplete: (result: number) => void;
  disabled?: boolean;
}

export function DiceRoller2D({ diceType, onRollComplete, disabled }: DiceRoller2DProps) {
  const [isRolling, setIsRolling] = useState(false);
  const [currentDisplay, setCurrentDisplay] = useState<number | string>('?');
  const [finalResult, setFinalResult] = useState<number | null>(null);
  const [rollCount, setRollCount] = useState(0);

  const config = DICE_CONFIG[diceType];

  // Get all possible values for this dice type for animation
  const possibleValues = getPossibleValues(diceType);

  const roll = useCallback(() => {
    if (disabled || isRolling) return;

    setIsRolling(true);
    setFinalResult(null);
    setRollCount(prev => prev + 1);

    // Calculate the actual result upfront
    const result = rollDice(diceType);

    // Animate through random values
    let tick = 0;
    const totalTicks = 15 + Math.floor(Math.random() * 8); // 15-22 ticks

    const animate = () => {
      tick++;

      if (tick < totalTicks) {
        // Show random values while "rolling"
        const randomValue = possibleValues[Math.floor(Math.random() * possibleValues.length)];
        setCurrentDisplay(randomValue);

        // Slow down as we approach the end
        const progress = tick / totalTicks;
        const delay = 50 + progress * progress * 150; // 50ms -> 200ms
        setTimeout(animate, delay);
      } else {
        // Land on the result
        setCurrentDisplay(result);
        setFinalResult(result);
        setIsRolling(false);

        // Notify parent after animation settles
        setTimeout(() => {
          onRollComplete(result);
        }, 400);
      }
    };

    animate();
  }, [disabled, isRolling, diceType, possibleValues, onRollComplete]);

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Dice container */}
      <motion.div
        className="relative cursor-pointer select-none"
        onClick={roll}
        whileHover={!isRolling && !finalResult ? { scale: 1.05 } : {}}
        whileTap={!isRolling && !finalResult ? { scale: 0.95 } : {}}
      >
        {/* Dice face */}
        <motion.div
          key={rollCount}
          className="relative flex items-center justify-center"
          style={{
            width: 140,
            height: 140,
            borderRadius: getDiceShape(diceType) === 'square' ? 20 : getDiceShape(diceType) === 'diamond' ? 20 : 16,
            background: `linear-gradient(135deg, ${config.color} 0%, ${adjustColor(config.color, -40)} 100%)`,
            boxShadow: `
              0 8px 0 ${adjustColor(config.color, -60)},
              0 12px 30px ${config.color}50,
              inset 0 2px 0 ${adjustColor(config.color, 40)}
            `,
            transform: getDiceShape(diceType) === 'diamond' ? 'rotate(45deg)' : 'none',
          }}
          animate={isRolling ? {
            rotate: getDiceShape(diceType) === 'diamond' ? [45, 55, 35, 50, 40, 45] : [0, 10, -10, 5, -5, 0],
            scale: [1, 1.05, 0.95, 1.02, 0.98, 1],
          } : {}}
          transition={isRolling ? {
            duration: 0.15,
            repeat: Infinity,
            ease: "easeInOut",
          } : {}}
        >
          {/* Inner face with value */}
          <div
            className="absolute inset-3 rounded-xl flex items-center justify-center"
            style={{
              background: 'rgba(0, 0, 0, 0.15)',
              transform: getDiceShape(diceType) === 'diamond' ? 'rotate(-45deg)' : 'none',
            }}
          >
            <AnimatePresence mode="popLayout">
              <motion.span
                key={`${currentDisplay}-${rollCount}`}
                className="font-bold text-white"
                style={{
                  fontFamily: "'Bangers', sans-serif",
                  fontSize: getFontSize(currentDisplay),
                  textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                  letterSpacing: '0.02em',
                }}
                initial={{ opacity: 0, scale: 0.5, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.5, y: -20 }}
                transition={{ duration: isRolling ? 0.05 : 0.2 }}
              >
                {currentDisplay}
              </motion.span>
            </AnimatePresence>
          </div>

          {/* Dice pips decoration for d6 */}
          {diceType === 'd6' && !isRolling && finalResult && (
            <DicePips value={finalResult as number} />
          )}

          {/* Shine effect */}
          <div
            className="absolute inset-0 rounded-xl pointer-events-none"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.25) 0%, transparent 50%)',
              borderRadius: getDiceShape(diceType) === 'square' ? 20 : 16,
            }}
          />
        </motion.div>

        {/* Bounce shadow */}
        <motion.div
          className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full"
          style={{
            width: 100,
            height: 20,
            background: `radial-gradient(ellipse, ${config.color}30 0%, transparent 70%)`,
            filter: 'blur(4px)',
          }}
          animate={isRolling ? {
            scale: [1, 0.8, 1.2, 0.9, 1.1, 1],
            opacity: [0.5, 0.3, 0.6, 0.4, 0.5, 0.5],
          } : {}}
          transition={isRolling ? {
            duration: 0.15,
            repeat: Infinity,
          } : {}}
        />
      </motion.div>

      {/* Dice type label */}
      <div
        className="px-4 py-1.5 rounded-lg text-white font-bold"
        style={{
          fontFamily: "'Bangers', sans-serif",
          background: config.color,
          boxShadow: `0 3px 0 ${adjustColor(config.color, -40)}`,
          letterSpacing: '0.05em',
        }}
      >
        {config.name}
      </div>

      {/* Instructions / Result */}
      <div className="text-center h-8">
        {!isRolling && !finalResult && (
          <motion.p
            className="text-[var(--color-text-secondary)]"
            style={{ fontFamily: "'Quicksand', sans-serif" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            Tap to roll!
          </motion.p>
        )}
        {isRolling && (
          <motion.p
            className="text-[var(--color-text-muted)]"
            style={{ fontFamily: "'Quicksand', sans-serif" }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 0.5, repeat: Infinity }}
          >
            Rolling...
          </motion.p>
        )}
        {!isRolling && finalResult && (
          <motion.p
            className="font-bold"
            style={{
              fontFamily: "'Bangers', sans-serif",
              color: config.color,
              fontSize: '1.25rem',
            }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            You rolled {finalResult}!
          </motion.p>
        )}
      </div>
    </div>
  );
}

function getPossibleValues(diceType: DiceType): number[] {
  switch (diceType) {
    case 'd4': return [1, 2, 3, 4];
    case 'd6': return [1, 2, 3, 4, 5, 6];
    case 'd8': return [1, 2, 3, 4, 5, 6, 7, 8];
    case 'd10': return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    case 'prime': return [2, 3, 5, 7, 11, 13];
    case 'gaussian': return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    default: return [1, 2, 3, 4, 5, 6];
  }
}

function getDiceShape(diceType: DiceType): 'square' | 'diamond' | 'rounded' {
  switch (diceType) {
    case 'd6':
    case 'prime':
    case 'gaussian':
      return 'square';
    case 'd4':
    case 'd8':
      return 'diamond';
    case 'd10':
      return 'rounded';
    default:
      return 'square';
  }
}

function getFontSize(value: number | string): string {
  const len = String(value).length;
  if (len === 1) return '4rem';
  if (len === 2) return '3rem';
  return '2.5rem';
}

function adjustColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
  const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

// Simple pips overlay for d6 (optional visual enhancement)
function DicePips({ value: _value }: { value: number }) {
  // This is a simplified decorative element - the number is the main display
  return null; // Keeping it simple for now - the number display is clear enough
}
