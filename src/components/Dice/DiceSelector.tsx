import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { DiceType } from '../../types/game';
import { DICE_CONFIG } from '../../utils/diceLogic';

interface DiceSelectorProps {
  onSelect: (dice: DiceType) => void;
  disabled?: boolean;
  autoSpin?: boolean;
}

const DICE_ORDER: DiceType[] = ['d4', 'd6', 'd8', 'd10', 'prime', 'gaussian'];

export function DiceSelector({ onSelect, disabled, autoSpin }: DiceSelectorProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [finalDice, setFinalDice] = useState<DiceType | null>(null);

  const startSpin = useCallback(() => {
    if (isSpinning || finalDice) return;

    setIsSpinning(true);
    setFinalDice(null);

    // Pick the final result upfront
    const result = DICE_ORDER[Math.floor(Math.random() * DICE_ORDER.length)];
    const resultIndex = DICE_ORDER.indexOf(result);

    // Animate through dice rapidly, then slow down
    let tick = 0;
    const totalTicks = 20 + Math.floor(Math.random() * 10); // 20-30 ticks

    const interval = setInterval(() => {
      tick++;

      if (tick < totalTicks) {
        setCurrentIndex(prev => (prev + 1) % DICE_ORDER.length);
      } else {
        // Land on the result
        setCurrentIndex(resultIndex);
        setFinalDice(result);
        setIsSpinning(false);
        clearInterval(interval);

        // Notify parent after a brief pause
        setTimeout(() => {
          onSelect(result);
        }, 600);
      }
    }, 80);

    return () => clearInterval(interval);
  }, [isSpinning, finalDice, onSelect]);

  const spin = useCallback(() => {
    if (disabled) return;
    startSpin();
  }, [disabled, startSpin]);

  // Auto-spin for AI players
  useEffect(() => {
    if (autoSpin && !isSpinning && !finalDice) {
      const timer = setTimeout(() => startSpin(), 800);
      return () => clearTimeout(timer);
    }
  }, [autoSpin, isSpinning, finalDice, startSpin]);

  const currentDice = DICE_ORDER[currentIndex];
  const config = DICE_CONFIG[currentDice];

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Slot machine frame */}
      <div
        className="relative rounded-2xl p-1"
        style={{
          background: 'linear-gradient(180deg, var(--color-nebula-light) 0%, var(--color-nebula-mid) 100%)',
          border: '1px solid rgba(255,255,255,0.15)',
          boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.5), 0 4px 20px rgba(0,0,0,0.3)',
        }}
      >
        {/* Inner window */}
        <div
          className="relative overflow-hidden rounded-xl"
          style={{
            width: 200,
            height: 120,
            background: 'linear-gradient(180deg, var(--color-void) 0%, var(--color-nebula-mid) 100%)',
          }}
        >
          {/* Highlight bar */}
          <div
            className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-16 pointer-events-none z-10"
            style={{
              background: 'linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.05) 50%, transparent 100%)',
              borderTop: '1px solid rgba(255,255,255,0.1)',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
            }}
          />

          {/* Dice display */}
          <AnimatePresence mode="popLayout">
            <motion.div
              key={currentDice}
              className="absolute inset-0 flex flex-col items-center justify-center"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -50, opacity: 0 }}
              transition={{ duration: isSpinning ? 0.08 : 0.3, ease: "easeOut" }}
            >
              {/* Dice icon */}
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-lg mb-1"
                style={{
                  background: `linear-gradient(135deg, ${config.color} 0%, ${adjustColor(config.color, -30)} 100%)`,
                  boxShadow: `0 4px 0 ${adjustColor(config.color, -50)}, 0 6px 15px ${config.color}40`,
                }}
              >
                {getDiceIcon(currentDice)}
              </div>

              {/* Dice name */}
              <div
                className="text-sm font-display tracking-wide"
                style={{
                  color: config.color,
                  letterSpacing: '0.05em',
                  textShadow: `0 0 12px ${config.color}60`,
                }}
              >
                {config.name}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Spinning blur effect */}
          {isSpinning && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'linear-gradient(180deg, rgba(15,15,35,0.85) 0%, transparent 30%, transparent 70%, rgba(15,15,35,0.85) 100%)',
              }}
            />
          )}
        </div>

        {/* Side decorations */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-16 rounded-full bg-gradient-to-b from-aurora-yellow/50 to-aurora-orange/50" />
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-16 rounded-full bg-gradient-to-b from-aurora-yellow/50 to-aurora-orange/50" />
      </div>

      {/* Spin button */}
      {!finalDice && (
        <motion.button
          className="btn btn-pink"
          onClick={spin}
          disabled={disabled || isSpinning}
          whileHover={!isSpinning ? { y: -2 } : {}}
          whileTap={!isSpinning ? { y: 4 } : {}}
        >
          {isSpinning ? 'Spinning...' : 'Spin for Dice!'}
        </motion.button>
      )}

      {/* Selected dice confirmation */}
      {finalDice && !isSpinning && (
        <motion.div
          className="text-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <p className="text-[var(--color-text-secondary)] text-sm font-body">
            You got the{' '}
            <span
              className="font-display text-base tracking-wide"
              style={{
                color: DICE_CONFIG[finalDice].color,
                textShadow: `0 0 14px ${DICE_CONFIG[finalDice].color}70`,
              }}
            >
              {DICE_CONFIG[finalDice].name}
            </span>
            !
          </p>
        </motion.div>
      )}
    </div>
  );
}

function getDiceIcon(dice: DiceType): string {
  switch (dice) {
    case 'd4': return '▲';
    case 'd6': return '⬡';
    case 'd8': return '◆';
    case 'd10': return '⬠';
    case 'prime': return 'P';
    case 'gaussian': return '∿';
    default: return '?';
  }
}

function adjustColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
  const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}
