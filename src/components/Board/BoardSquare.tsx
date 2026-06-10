import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { getSpecialTypes, type SpecialSquareType } from '../../types/game';
import { getSquareIcon } from './SquareIcons';

const TYPE_LABELS: Record<SpecialSquareType, string> = {
  prime: 'Prime - triggers Prime-Off!',
  twin_prime: 'Twin Prime - triggers Prime-Off or Blackjack!',
  multiple_of_10: 'Multiple of 10 - triggers Double Digits!',
  fibonacci: 'Fibonacci - triggers Sequence Savant!',
  perfect_square: 'Perfect Square - triggers Root Race!',
  perfect_cube: 'Perfect Cube - triggers Cube Root!',
  perfect_number: 'Perfect Number - triggers Factor Frenzy!',
  abundant: 'Abundant Number - triggers Number Builder!',
};

interface BoardSquareProps {
  number: number;
  isHighlighted?: boolean;
  isInPath?: boolean;
  isPathStart?: boolean;
  isPathEnd?: boolean;
  pathIndex?: number;
  pathLength?: number;
  onClick?: () => void;
}

// Cosmic neon colors for special squares
const SPECIAL_STYLES: Record<SpecialSquareType, { bg: string; glow: string }> = {
  prime: {
    bg: 'linear-gradient(135deg, rgba(49, 133, 252, 0.25) 0%, rgba(49, 133, 252, 0.1) 100%)',
    glow: 'rgba(49, 133, 252, 0.4)',
  },
  twin_prime: {
    bg: 'linear-gradient(135deg, rgba(78, 205, 196, 0.25) 0%, rgba(78, 205, 196, 0.1) 100%)',
    glow: 'rgba(78, 205, 196, 0.4)',
  },
  multiple_of_10: {
    bg: 'linear-gradient(135deg, rgba(255, 230, 109, 0.3) 0%, rgba(255, 230, 109, 0.1) 100%)',
    glow: 'rgba(255, 230, 109, 0.5)',
  },
  fibonacci: {
    bg: 'linear-gradient(135deg, rgba(95, 173, 86, 0.25) 0%, rgba(95, 173, 86, 0.1) 100%)',
    glow: 'rgba(95, 173, 86, 0.4)',
  },
  perfect_square: {
    bg: 'linear-gradient(135deg, rgba(155, 89, 182, 0.25) 0%, rgba(155, 89, 182, 0.1) 100%)',
    glow: 'rgba(155, 89, 182, 0.4)',
  },
  perfect_cube: {
    bg: 'linear-gradient(135deg, rgba(249, 160, 63, 0.25) 0%, rgba(249, 160, 63, 0.1) 100%)',
    glow: 'rgba(249, 160, 63, 0.4)',
  },
  perfect_number: {
    bg: 'linear-gradient(135deg, rgba(232, 72, 85, 0.25) 0%, rgba(155, 89, 182, 0.1) 100%)',
    glow: 'rgba(232, 72, 85, 0.4)',
  },
  abundant: {
    bg: 'linear-gradient(135deg, rgba(78, 205, 196, 0.25) 0%, rgba(49, 133, 252, 0.1) 100%)',
    glow: 'rgba(78, 205, 196, 0.4)',
  },
};

export function BoardSquare({
  number,
  isHighlighted,
  isInPath,
  isPathStart,
  isPathEnd,
  pathIndex: _pathIndex = 0,
  pathLength: _pathLength = 0,
  onClick
}: BoardSquareProps) {
  const specialTypes = getSpecialTypes(number);
  const primaryType = specialTypes[0];

  const isStart = number === 1;
  const isEnd = number === 100;

  const tooltip = useMemo(() => {
    if (isStart) return `Square ${number} - Start`;
    if (isEnd) return `Square ${number} - Finish (Final Showdown!)`;
    if (primaryType) return `Square ${number} - ${TYPE_LABELS[primaryType]}`;
    return `Square ${number}`;
  }, [number, primaryType, isStart, isEnd]);

  // Build styles based on square type
  let bgStyle = 'rgba(255, 255, 255, 0.04)';
  let borderColor = 'rgba(255, 255, 255, 0.08)';
  let glowColor = 'transparent';
  let textColor = 'rgba(255, 255, 255, 0.6)';

  if (primaryType) {
    const style = SPECIAL_STYLES[primaryType];
    bgStyle = style.bg;
    borderColor = style.glow;
    glowColor = style.glow;
    textColor = 'rgba(255, 255, 255, 0.95)';
  } else if (isStart) {
    bgStyle = 'linear-gradient(135deg, rgba(95, 173, 86, 0.35) 0%, rgba(95, 173, 86, 0.15) 100%)';
    borderColor = 'rgba(95, 173, 86, 0.6)';
    glowColor = 'rgba(95, 173, 86, 0.5)';
    textColor = 'rgba(255, 255, 255, 0.95)';
  } else if (isEnd) {
    bgStyle = 'linear-gradient(135deg, rgba(255, 230, 109, 0.4) 0%, rgba(249, 160, 63, 0.2) 100%)';
    borderColor = 'rgba(255, 230, 109, 0.7)';
    glowColor = 'rgba(255, 230, 109, 0.6)';
    textColor = 'var(--color-text-on-light)';
  }

  return (
    <motion.div
      className="relative aspect-square rounded-md sm:rounded-lg flex flex-col items-center justify-center cursor-pointer overflow-hidden"
      style={{
        background: bgStyle,
        border: `1px solid ${borderColor}`,
        boxShadow: primaryType || isStart || isEnd
          ? `inset 0 0 10px ${glowColor}, 0 0 8px ${glowColor}`
          : 'none',
        color: textColor,
      }}
      title={tooltip}
      onClick={onClick}
      whileHover={{
        scale: 1.12,
        zIndex: 20,
        boxShadow: `inset 0 0 15px ${glowColor || 'rgba(255,255,255,0.1)'}, 0 0 20px ${glowColor || 'rgba(255,255,255,0.2)'}`,
      }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      {/* Inner shine */}
      <div
        className="absolute inset-0 rounded-md sm:rounded-lg pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 50%)',
        }}
      />

      {/* Number */}
      <span className="font-body relative z-10 font-bold" style={{ fontSize: 'clamp(8px, 1.2vw, 14px)' }}>
        {number}
      </span>

      {/* Special type icon */}
      {primaryType && (
        <span className="opacity-90 relative z-10 mt-[-1px] flex items-center justify-center">
          {getSquareIcon(primaryType)}
        </span>
      )}

      {/* Start label */}
      {isStart && (
        <span className="font-display text-[7px] sm:text-[8px] absolute bottom-0.5 font-bold uppercase tracking-wider opacity-90">
          Start
        </span>
      )}

      {/* End star animation */}
      {isEnd && (
        <motion.div
          className="absolute bottom-0.5"
          animate={{ scale: [1, 1.3, 1], rotate: [0, 10, -10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" style={{ color: 'var(--color-text-on-light)' }}>
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor" />
          </svg>
        </motion.div>
      )}

      {/* Highlight effect */}
      {isHighlighted && (
        <motion.div
          className="absolute inset-0 rounded-md sm:rounded-lg pointer-events-none"
          style={{
            border: '2px solid rgba(255, 230, 109, 0.8)',
            boxShadow: '0 0 15px rgba(255, 230, 109, 0.6), inset 0 0 10px rgba(255, 230, 109, 0.3)',
          }}
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      {/* Path highlight effect - all squares light up together */}
      {isInPath && (
        <motion.div
          className="absolute inset-0 rounded-md sm:rounded-lg pointer-events-none z-10"
          style={{
            border: isPathEnd
              ? '3px solid rgba(95, 173, 86, 0.95)'
              : isPathStart
                ? '2px solid rgba(255, 255, 255, 0.7)'
                : '2px solid rgba(95, 173, 86, 0.7)',
            background: isPathEnd
              ? 'rgba(95, 173, 86, 0.3)'
              : isPathStart
                ? 'rgba(255, 255, 255, 0.15)'
                : 'rgba(95, 173, 86, 0.2)',
            boxShadow: isPathEnd
              ? '0 0 20px rgba(95, 173, 86, 0.8), inset 0 0 15px rgba(95, 173, 86, 0.4)'
              : isPathStart
                ? '0 0 12px rgba(255, 255, 255, 0.4)'
                : '0 0 12px rgba(95, 173, 86, 0.5)',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
      )}

      {/* Path destination pulse */}
      {isPathEnd && (
        <motion.div
          className="absolute inset-0 rounded-md sm:rounded-lg pointer-events-none z-10"
          style={{
            border: '3px solid rgba(95, 173, 86, 0.95)',
          }}
          animate={{
            boxShadow: [
              '0 0 10px rgba(95, 173, 86, 0.4)',
              '0 0 30px rgba(95, 173, 86, 0.9)',
              '0 0 10px rgba(95, 173, 86, 0.4)',
            ],
          }}
          transition={{ duration: 0.8, repeat: Infinity }}
        />
      )}
    </motion.div>
  );
}
