import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { soundEngine } from '../../../utils/soundEngine';

interface SpecialType {
  name: string;
  icon: string;
  color: string;
  glow: string;
  minigame: string;
  examples: number[];
  reward: string;
}

const SPECIAL_TYPES: SpecialType[] = [
  {
    name: 'Prime',
    icon: 'P',
    color: '#61DAFB',
    glow: 'rgba(97, 218, 251, 0.4)',
    minigame: 'Prime-Off!',
    examples: [2, 3, 5, 7, 11, 13, 17],
    reward: 'Jump to next prime',
  },
  {
    name: 'Twin Prime',
    icon: 'TP',
    color: '#56D4C8',
    glow: 'rgba(86, 212, 200, 0.4)',
    minigame: 'Prime-Off or Blackjack',
    examples: [3, 5, 11, 13, 29, 31],
    reward: 'Jump to next prime',
  },
  {
    name: 'Multiple of 10',
    icon: '10x',
    color: '#FFE66D',
    glow: 'rgba(255, 230, 109, 0.5)',
    minigame: 'Double Digits!',
    examples: [10, 20, 30, 40, 50],
    reward: 'Teleport anywhere!',
  },
  {
    name: 'Perfect Square',
    icon: 'x\u00B2',
    color: '#c678dd',
    glow: 'rgba(198, 120, 221, 0.4)',
    minigame: 'Root Race!',
    examples: [4, 9, 16, 25, 36],
    reward: '+3 spaces',
  },
  {
    name: 'Perfect Cube',
    icon: 'x\u00B3',
    color: '#FF9F43',
    glow: 'rgba(255, 159, 67, 0.4)',
    minigame: 'Cube Root!',
    examples: [8, 27, 64],
    reward: '+3 spaces',
  },
  {
    name: 'Perfect Number',
    icon: '\u2605',
    color: '#FF6B9D',
    glow: 'rgba(255, 107, 157, 0.4)',
    minigame: 'Factor Frenzy!',
    examples: [6, 28],
    reward: '+1 per factor found',
  },
  {
    name: 'Abundant',
    icon: '+',
    color: '#56D4C8',
    glow: 'rgba(86, 212, 200, 0.4)',
    minigame: 'Number Builder!',
    examples: [12, 18, 20, 24, 30],
    reward: 'Based on accuracy',
  },
];

export function SpecialSquaresPage() {
  const [selected, setSelected] = useState<number | null>(null);

  const handleTap = (i: number) => {
    soundEngine.landOnSpecial();
    setSelected(selected === i ? null : i);
  };

  return (
    <div className="py-2">
      <div className="grid grid-cols-4 gap-2 max-w-sm mx-auto">
        {SPECIAL_TYPES.map((sq, i) => (
          <motion.button
            key={sq.name}
            className="relative rounded-xl p-2 text-center cursor-pointer"
            style={{
              background: `linear-gradient(135deg, ${sq.color}20, ${sq.color}08)`,
              border: `1px solid ${sq.color}40`,
              boxShadow: selected === i ? `0 0 16px ${sq.glow}` : 'none',
            }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 + i * 0.08, type: 'spring', stiffness: 200, damping: 15 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleTap(i)}
          >
            <div
              className="text-lg font-bold mb-0.5"
              style={{ color: sq.color, fontFamily: 'var(--font-display)' }}
            >
              {sq.icon}
            </div>
            <div className="text-[10px] text-white/70 leading-tight" style={{ fontFamily: 'var(--font-body)' }}>
              {sq.name}
            </div>
          </motion.button>
        ))}
      </div>

      {/* Detail panel */}
      <AnimatePresence mode="wait">
        {selected !== null && (
          <motion.div
            key={selected}
            className="mt-3 mx-auto max-w-sm rounded-xl p-3"
            style={{
              background: `${SPECIAL_TYPES[selected].color}10`,
              border: `1px solid ${SPECIAL_TYPES[selected].color}30`,
            }}
            initial={{ opacity: 0, y: 10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="font-bold" style={{ color: SPECIAL_TYPES[selected].color, fontFamily: 'var(--font-display)' }}>
                {SPECIAL_TYPES[selected].name}
              </span>
              <span className="text-white/40">→</span>
              <span className="text-white/80 text-sm" style={{ fontFamily: 'var(--font-display)' }}>
                {SPECIAL_TYPES[selected].minigame}
              </span>
            </div>
            <div className="text-xs text-white/50" style={{ fontFamily: 'var(--font-body)' }}>
              Examples: {SPECIAL_TYPES[selected].examples.join(', ')}
            </div>
            <div className="text-xs mt-1" style={{ fontFamily: 'var(--font-body)' }}>
              <span className="text-green-400">Win: </span>
              <span className="text-white/70">{SPECIAL_TYPES[selected].reward}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.p
        className="text-center text-white/40 text-xs mt-3"
        style={{ fontFamily: 'var(--font-body)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
      >
        Tap any square type to learn more!
      </motion.p>
    </div>
  );
}
