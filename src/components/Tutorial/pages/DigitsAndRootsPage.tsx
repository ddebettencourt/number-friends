import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export function DigitsAndRootsPage() {
  const [d1, setD1] = useState(0);
  const [d2, setD2] = useState(0);
  const [rolling, setRolling] = useState(true);
  const [rootAnswer, setRootAnswer] = useState(false);

  // Double digits dice roll animation
  useEffect(() => {
    if (!rolling) return;
    const interval = setInterval(() => {
      setD1(Math.floor(Math.random() * 10));
      setD2(Math.floor(Math.random() * 10));
    }, 100);

    const timer = setTimeout(() => {
      clearInterval(interval);
      setD1(7);
      setD2(3);
      setRolling(false);
    }, 2000);

    return () => { clearInterval(interval); clearTimeout(timer); };
  }, []);

  // Show root answer after delay
  useEffect(() => {
    const timer = setTimeout(() => setRootAnswer(true), 4000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="py-2 space-y-5">
      {/* Double Digits */}
      <div>
        <motion.h3
          className="text-lg text-[#FFE66D] font-bold mb-3 text-center"
          style={{ fontFamily: 'var(--font-display)' }}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          🎰 Double Digits
        </motion.h3>

        <div className="flex items-center justify-center gap-3">
          {/* Two D10 dice */}
          <motion.div
            className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-bold"
            style={{
              fontFamily: 'var(--font-display)',
              background: 'linear-gradient(135deg, rgba(234,179,8,0.3), rgba(234,179,8,0.1))',
              border: '2px solid rgba(234,179,8,0.5)',
              color: '#FFE66D',
            }}
            animate={rolling ? { rotate: [0, 10, -10, 0] } : {}}
            transition={{ duration: 0.2, repeat: rolling ? Infinity : 0 }}
          >
            {d1}
          </motion.div>

          <motion.div
            className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-bold"
            style={{
              fontFamily: 'var(--font-display)',
              background: 'linear-gradient(135deg, rgba(234,179,8,0.3), rgba(234,179,8,0.1))',
              border: '2px solid rgba(234,179,8,0.5)',
              color: '#FFE66D',
            }}
            animate={rolling ? { rotate: [0, -10, 10, 0] } : {}}
            transition={{ duration: 0.2, repeat: rolling ? Infinity : 0 }}
          >
            {d2}
          </motion.div>
        </div>

        {!rolling && (
          <motion.div
            className="text-center mt-2"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring' }}
          >
            <span className="text-sm text-white/50" style={{ fontFamily: 'var(--font-body)' }}>
              Teleport to square{' '}
            </span>
            <span className="text-xl font-bold text-[#FFE66D]" style={{ fontFamily: 'var(--font-display)' }}>
              73!
            </span>
            <p className="text-xs text-white/40 mt-1" style={{ fontFamily: 'var(--font-body)' }}>
              Could go forward OR backward -- risky!
            </p>
          </motion.div>
        )}
      </div>

      {/* Divider */}
      <div className="h-px bg-white/10 mx-8" />

      {/* Root Race */}
      <div>
        <motion.h3
          className="text-lg text-[#c678dd] font-bold mb-3 text-center"
          style={{ fontFamily: 'var(--font-display)' }}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          √ Root Race
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
              background: 'linear-gradient(135deg, rgba(198,120,221,0.2), rgba(198,120,221,0.05))',
              border: '1px solid rgba(198,120,221,0.3)',
            }}
          >
            <span className="text-white/50 text-sm" style={{ fontFamily: 'var(--font-body)' }}>
              What is{' '}
            </span>
            <span className="text-2xl font-bold text-[#c678dd]" style={{ fontFamily: 'var(--font-display)' }}>
              √144
            </span>
            <span className="text-white/50 text-sm" style={{ fontFamily: 'var(--font-body)' }}>
              {' '}?
            </span>
          </div>

          {rootAnswer && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring' }}
            >
              <div className="flex items-center justify-center gap-2">
                <span className="text-3xl font-bold text-[#c678dd]" style={{ fontFamily: 'var(--font-display)' }}>
                  12
                </span>
                <span className="text-green-400 text-xl">✓</span>
              </div>
              <p className="text-xs text-green-400/70 mt-1" style={{ fontFamily: 'var(--font-body)' }}>
                +3 spaces!
              </p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
