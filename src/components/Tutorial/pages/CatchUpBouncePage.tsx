import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export function CatchUpBouncePage() {
  const [bounceStep, setBounceStep] = useState(0);

  useEffect(() => {
    const steps = [
      { delay: 1500, step: 1 }, // arrow reaches 100
      { delay: 2500, step: 2 }, // bounce back
    ];
    const timers = steps.map(({ delay, step }) =>
      setTimeout(() => setBounceStep(step), delay)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="py-4 space-y-4">
      <motion.h3
        className="text-lg text-[#c678dd] font-bold mb-4 text-center"
        style={{ fontFamily: 'var(--font-display)' }}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        Bounce Back
      </motion.h3>

      <motion.p
        className="text-center text-sm text-white/60 max-w-xs mx-auto"
        style={{ fontFamily: 'var(--font-body)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        You can't overshoot square 100. Roll past it and you bounce back the extra amount.
      </motion.p>

      <motion.div
        className="relative mx-auto max-w-xs mt-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <div className="flex items-end justify-center gap-1">
          {[96, 97, 98, 99, 100].map((n) => (
            <motion.div
              key={n}
              className="w-12 h-12 rounded-lg flex items-center justify-center text-sm font-bold"
              style={{
                fontFamily: 'var(--font-display)',
                background: n === 100
                  ? 'rgba(255, 230, 109, 0.3)'
                  : bounceStep === 2 && n === 97
                  ? 'rgba(198, 120, 221, 0.3)'
                  : 'rgba(255,255,255,0.08)',
                border: n === 100
                  ? '2px solid #FFE66D'
                  : bounceStep === 2 && n === 97
                  ? '2px solid #c678dd'
                  : '1px solid rgba(255,255,255,0.15)',
                color: n === 100 ? '#FFE66D' : 'rgba(255,255,255,0.6)',
              }}
              animate={bounceStep === 1 && n === 100 ? {
                scale: [1, 1.2, 1],
                boxShadow: ['0 0 0 transparent', '0 0 20px rgba(255,230,109,0.5)', '0 0 0 transparent'],
              } : {}}
              transition={{ duration: 0.5 }}
            >
              {n}
            </motion.div>
          ))}
        </div>

        {/* Pawn and bounce arrow */}
        <div className="relative h-14 mt-3">
          {bounceStep === 0 && (
            <motion.div
              className="absolute left-[15%] text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="text-sm text-white/60" style={{ fontFamily: 'var(--font-body)' }}>
                At 98, rolls <span className="font-bold text-[#c678dd]" style={{ fontFamily: 'var(--font-display)' }}>5</span>
              </div>
            </motion.div>
          )}

          {bounceStep >= 1 && (
            <motion.div
              className="absolute left-0 right-0 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <svg className="mx-auto" width="220" height="35" viewBox="0 0 220 35">
                {/* Forward arrow */}
                <motion.path
                  d="M30 22 L175 22"
                  stroke="rgba(198,120,221,0.5)"
                  strokeWidth="2"
                  strokeDasharray="4 3"
                  fill="none"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.5 }}
                />
                {bounceStep === 2 && (
                  <motion.path
                    d="M175 22 Q185 5 155 10 L95 17"
                    stroke="#c678dd"
                    strokeWidth="2"
                    fill="none"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.5 }}
                  />
                )}
              </svg>
            </motion.div>
          )}

          {bounceStep === 2 && (
            <motion.p
              className="absolute bottom-0 left-0 right-0 text-center text-sm font-bold"
              style={{ fontFamily: 'var(--font-display)', color: '#c678dd' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              98 + 5 = 103 → bounces to 97
            </motion.p>
          )}
        </div>
      </motion.div>

      <motion.p
        className="text-center text-xs text-white/40 mt-2"
        style={{ fontFamily: 'var(--font-body)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 3 }}
      >
        You need to land exactly on 100 to trigger the Final Showdown.
      </motion.p>
    </div>
  );
}
