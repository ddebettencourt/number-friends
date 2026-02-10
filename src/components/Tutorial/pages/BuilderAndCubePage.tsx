import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export function BuilderAndCubePage() {
  const [showSolution, setShowSolution] = useState(false);
  const [cubeAnswer, setCubeAnswer] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowSolution(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setCubeAnswer(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="py-2 space-y-5">
      {/* Number Builder */}
      <div>
        <motion.h3
          className="text-lg text-[#FF9F43] font-bold mb-3 text-center"
          style={{ fontFamily: 'var(--font-display)' }}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          🔧 Number Builder
        </motion.h3>

        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {/* Target */}
          <div className="mb-3">
            <span className="text-white/50 text-sm" style={{ fontFamily: 'var(--font-body)' }}>Target: </span>
            <span className="text-2xl font-bold text-[#FF9F43]" style={{ fontFamily: 'var(--font-display)' }}>24</span>
          </div>

          {/* Available numbers */}
          <div className="flex justify-center gap-2 mb-3">
            {[3, 2, 4, 6].map((n, i) => (
              <motion.div
                key={i}
                className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold"
                style={{
                  fontFamily: 'var(--font-display)',
                  background: 'rgba(255, 159, 67, 0.15)',
                  border: '1px solid rgba(255, 159, 67, 0.3)',
                  color: '#FF9F43',
                }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + i * 0.1, type: 'spring' }}
              >
                {n}
              </motion.div>
            ))}
          </div>

          <motion.p
            className="text-xs text-white/40 mb-2"
            style={{ fontFamily: 'var(--font-body)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            Use +, -, ×, ÷ to make 24 from all four numbers!
          </motion.p>

          {showSolution && (
            <motion.div
              className="inline-block px-4 py-2 rounded-xl"
              style={{
                background: 'rgba(255, 159, 67, 0.15)',
                border: '1px solid rgba(255, 159, 67, 0.3)',
              }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring' }}
            >
              <span className="text-white/80 text-sm" style={{ fontFamily: 'var(--font-display)' }}>
                (6 ÷ 2) × (3 + 4 + 1){' '}
              </span>
              <span className="text-white/40">→ wait... </span>
              <span className="text-[#FF9F43] font-bold" style={{ fontFamily: 'var(--font-display)' }}>
                3 × 2 × 4 = 24
              </span>
              <span className="text-green-400 ml-1">✓</span>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Divider */}
      <div className="h-px bg-white/10 mx-8" />

      {/* Cube Root */}
      <div>
        <motion.h3
          className="text-lg text-[#FF9F43] font-bold mb-3 text-center"
          style={{ fontFamily: 'var(--font-display)' }}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          ∛ Cube Root
        </motion.h3>

        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div
            className="inline-block px-6 py-3 rounded-xl mb-2"
            style={{
              background: 'rgba(255, 159, 67, 0.1)',
              border: '1px solid rgba(255, 159, 67, 0.25)',
            }}
          >
            <span className="text-white/50 text-sm" style={{ fontFamily: 'var(--font-body)' }}>
              What is{' '}
            </span>
            <span className="text-2xl font-bold text-[#FF9F43]" style={{ fontFamily: 'var(--font-display)' }}>
              ∛27
            </span>
            <span className="text-white/50 text-sm" style={{ fontFamily: 'var(--font-body)' }}>
              {' '}?
            </span>
          </div>

          {cubeAnswer && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring' }}
            >
              <div className="flex items-center justify-center gap-2">
                <span className="text-3xl font-bold text-[#FF9F43]" style={{ fontFamily: 'var(--font-display)' }}>
                  3
                </span>
                <span className="text-green-400 text-xl">✓</span>
              </div>
              <p className="text-xs text-white/40 mt-1" style={{ fontFamily: 'var(--font-body)' }}>
                3 × 3 × 3 = 27 → <span className="text-green-400">+3 spaces!</span>
              </p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
