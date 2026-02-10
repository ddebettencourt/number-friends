import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const FACTORS_OF_28 = [1, 2, 4, 7, 14, 28];

export function SequenceAndFactorsPage() {
  const [foundFactors, setFoundFactors] = useState(0);

  useEffect(() => {
    if (foundFactors < FACTORS_OF_28.length) {
      const timer = setTimeout(() => {
        setFoundFactors(prev => prev + 1);
      }, 1500 + foundFactors * 500);
      return () => clearTimeout(timer);
    }
  }, [foundFactors]);

  return (
    <div className="py-4">
      <motion.h3
        className="text-lg text-[#FF6B9D] font-bold mb-3 text-center"
        style={{ fontFamily: 'var(--font-display)' }}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        Factor Frenzy
      </motion.h3>

      <motion.p
        className="text-center text-sm text-white/60 mb-4 max-w-xs mx-auto"
        style={{ fontFamily: 'var(--font-body)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        Land on a perfect number and you'll race to find all its factors. Each one you find earns a bonus space.
      </motion.p>

      <motion.div
        className="text-center mb-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <span className="text-white/50 text-sm" style={{ fontFamily: 'var(--font-body)' }}>
          Find all factors of{' '}
        </span>
        <span className="text-2xl font-bold text-[#FF6B9D]" style={{ fontFamily: 'var(--font-display)' }}>
          28
        </span>
      </motion.div>

      <div className="flex justify-center gap-2 mb-3 flex-wrap max-w-xs mx-auto">
        {FACTORS_OF_28.map((f, i) => (
          <AnimatePresence key={i}>
            {i < foundFactors && (
              <motion.div
                className="w-12 h-12 rounded-lg flex items-center justify-center text-sm font-bold"
                style={{
                  fontFamily: 'var(--font-display)',
                  background: 'rgba(255, 107, 157, 0.2)',
                  border: '1px solid rgba(255, 107, 157, 0.4)',
                  color: '#FF6B9D',
                }}
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200 }}
              >
                {f}
              </motion.div>
            )}
          </AnimatePresence>
        ))}
      </div>

      {foundFactors > 0 && (
        <motion.p
          className="text-center text-sm text-white/50"
          style={{ fontFamily: 'var(--font-body)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {foundFactors < FACTORS_OF_28.length
            ? `Found ${foundFactors} factor${foundFactors > 1 ? 's' : ''}...`
            : (
              <span className="text-green-400">
                All 6 factors found! +6 spaces
              </span>
            )}
        </motion.p>
      )}
    </div>
  );
}
