import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const CONFETTI_COLORS = ['#E84855', '#4ECDC4', '#FFE66D', '#9B59B6', '#3185FC', '#5FAD56'];

const SYMBOL_COLORS = [
  'var(--color-aurora-pink)',
  'var(--color-aurora-purple)',
  'var(--color-aurora-blue)',
  'var(--color-aurora-cyan)',
  'var(--color-aurora-green)',
  'var(--color-aurora-yellow)',
  'var(--color-aurora-orange)',
];
const MATH_SYMBOLS = ['+', '−', '×', '÷', '√', 'π', '∑', '∞', '%', '='];

export function FinalShowdownPage() {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(true), 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="py-2 text-center relative overflow-hidden">
      {/* Floating math symbols */}
      {MATH_SYMBOLS.map((sym, i) => (
        <motion.span
          key={i}
          className="absolute text-xl pointer-events-none select-none"
          style={{
            color: SYMBOL_COLORS[i % SYMBOL_COLORS.length],
            left: `${5 + (i % 5) * 20}%`,
            top: `${10 + Math.floor(i / 5) * 60}%`,
          }}
          animate={{
            y: [0, -15, 0],
            rotate: [0, i % 2 === 0 ? 20 : -20, 0],
            opacity: [0.1, 0.25, 0.1],
          }}
          transition={{
            duration: 3 + i * 0.2,
            repeat: Infinity,
            delay: i * 0.3,
          }}
        >
          {sym}
        </motion.span>
      ))}

      {/* Square 100 */}
      <motion.div
        className="relative inline-block mb-4"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.2 }}
      >
        <motion.div
          className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto"
          style={{
            fontFamily: 'var(--font-display)',
            background: 'linear-gradient(135deg, rgba(255,230,109,0.3), rgba(255,230,109,0.1))',
            border: '3px solid var(--color-aurora-yellow)',
            color: 'var(--color-aurora-yellow)',
          }}
          animate={{
            boxShadow: [
              '0 0 10px rgba(255,230,109,0.3)',
              '0 0 30px rgba(255,230,109,0.6)',
              '0 0 10px rgba(255,230,109,0.3)',
            ],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          100
        </motion.div>

        {/* Star */}
        <motion.div
          className="absolute -top-4 -right-4 text-2xl"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.8, type: 'spring' }}
        >
          ⭐
        </motion.div>
      </motion.div>

      {/* FINAL SHOWDOWN text */}
      <motion.h2
        className="text-2xl sm:text-3xl font-bold mb-2"
        style={{
          fontFamily: 'var(--font-display)',
          background: 'linear-gradient(135deg, var(--color-aurora-yellow), var(--color-aurora-pink), var(--color-aurora-purple), var(--color-aurora-cyan))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0 }}
      >
        FINAL SHOWDOWN!
      </motion.h2>

      <motion.p
        className="text-sm text-white/60 mb-4 max-w-xs mx-auto"
        style={{ fontFamily: 'var(--font-body)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.3 }}
      >
        Reach 100 and face one final challenge.
        Win it and the game is yours.
      </motion.p>

      {/* Win/Fail scenarios */}
      <motion.div
        className="flex justify-center gap-3 mb-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.6 }}
      >
        <div
          className="px-4 py-2 rounded-xl text-center"
          style={{
            background: 'rgba(95, 173, 86, 0.1)',
            border: '1px solid rgba(95, 173, 86, 0.3)',
          }}
        >
          <div className="text-lg mb-0.5">🏆</div>
          <div className="text-xs text-aurora-green font-bold" style={{ fontFamily: 'var(--font-display)' }}>
            WIN!
          </div>
          <div className="text-[10px] text-white/40" style={{ fontFamily: 'var(--font-body)' }}>
            Victory!
          </div>
        </div>

        <div className="text-white/20 self-center" style={{ fontFamily: 'var(--font-display)' }}>or</div>

        <div
          className="px-4 py-2 rounded-xl text-center"
          style={{
            background: 'rgba(232, 72, 85, 0.1)',
            border: '1px solid rgba(232, 72, 85, 0.3)',
          }}
        >
          <div className="text-lg mb-0.5">😬</div>
          <div className="text-xs text-aurora-pink font-bold" style={{ fontFamily: 'var(--font-display)' }}>
            FAIL
          </div>
          <div className="text-[10px] text-white/40" style={{ fontFamily: 'var(--font-body)' }}>
            Back to 95
          </div>
        </div>
      </motion.div>

      {/* Mini confetti */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 20 }, (_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                width: 4 + Math.random() * 4,
                height: 4 + Math.random() * 4,
                backgroundColor: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
                left: `${10 + Math.random() * 80}%`,
                top: '-5%',
              }}
              animate={{
                y: [0, 400],
                x: [0, (Math.random() - 0.5) * 100],
                rotate: [0, 360 + Math.random() * 360],
                opacity: [1, 0],
              }}
              transition={{
                duration: 2 + Math.random() * 2,
                delay: Math.random() * 0.5,
                ease: 'easeIn',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
