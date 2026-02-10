import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

const DICE_NAMES = ['D4', 'D6', 'D8', 'D10', 'Prime', 'Gaussian'];
const DICE_COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#eab308', '#a855f7', '#ec4899'];

export function YourTurnPage() {
  const [phase, setPhase] = useState<'spin' | 'rolled' | 'hopping' | 'done'>('spin');
  const [spinLabel, setSpinLabel] = useState('D4');
  const [spinColor, setSpinColor] = useState(DICE_COLORS[0]);
  const [pawnPos, setPawnPos] = useState(0);
  const spinRef = useRef(0);

  // Phase 1: Spin through dice names for 2s, land on D6
  useEffect(() => {
    if (phase !== 'spin') return;

    const interval = setInterval(() => {
      spinRef.current = (spinRef.current + 1) % DICE_NAMES.length;
      setSpinLabel(DICE_NAMES[spinRef.current]);
      setSpinColor(DICE_COLORS[spinRef.current]);
    }, 120);

    const stop = setTimeout(() => {
      clearInterval(interval);
      setSpinLabel('D6');
      setSpinColor('#3b82f6');
      setPhase('rolled');
    }, 1800);

    return () => { clearInterval(interval); clearTimeout(stop); };
  }, [phase]);

  // Phase 2: Show roll result, then start hopping
  useEffect(() => {
    if (phase !== 'rolled') return;
    const t = setTimeout(() => setPhase('hopping'), 1500);
    return () => clearTimeout(t);
  }, [phase]);

  // Phase 3: Hop 4 squares
  useEffect(() => {
    if (phase !== 'hopping') return;
    let pos = 0;
    const interval = setInterval(() => {
      pos++;
      setPawnPos(pos);
      if (pos >= 4) {
        clearInterval(interval);
        setPhase('done');
      }
    }, 450);
    return () => clearInterval(interval);
  }, [phase]);

  const stepIndex = phase === 'spin' ? 0 : phase === 'rolled' ? 1 : 2;

  return (
    <div className="text-center py-4">
      {/* Step indicators */}
      <div className="flex justify-center gap-5 mb-6">
        {['Spin', 'Roll', 'Move!'].map((label, i) => (
          <motion.div
            key={label}
            className="flex items-center gap-1.5"
            animate={{ opacity: stepIndex >= i ? 1 : 0.3 }}
          >
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
              style={{
                fontFamily: 'var(--font-display)',
                background: stepIndex >= i ? 'rgba(49,133,252,0.3)' : 'rgba(255,255,255,0.1)',
                border: stepIndex === i ? '2px solid #3185FC' : '1px solid rgba(255,255,255,0.2)',
                color: stepIndex >= i ? 'white' : 'rgba(255,255,255,0.4)',
              }}
            >
              {i + 1}
            </div>
            <span className="text-sm text-white/70" style={{ fontFamily: 'var(--font-body)' }}>{label}</span>
          </motion.div>
        ))}
      </div>

      {/* Demo area */}
      <div className="min-h-[120px] flex flex-col items-center justify-center gap-3">

        {/* Spinner / Roll result */}
        {(phase === 'spin' || phase === 'rolled') && (
          <div className="flex flex-col items-center">
            <motion.div
              className="w-20 h-20 rounded-2xl flex flex-col items-center justify-center mb-2"
              style={{
                background: `${spinColor}25`,
                border: `2px solid ${spinColor}`,
              }}
              animate={phase === 'spin' ? { rotate: [0, 3, -3, 0] } : { scale: [1, 1.1, 1] }}
              transition={phase === 'spin' ? { duration: 0.2, repeat: Infinity } : { duration: 0.5 }}
            >
              <span className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)', color: spinColor }}>
                {spinLabel}
              </span>
            </motion.div>

            {phase === 'rolled' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
                className="flex items-center gap-2"
              >
                <span className="text-white/50 text-sm" style={{ fontFamily: 'var(--font-body)' }}>You rolled</span>
                <span className="text-3xl font-bold text-[#FFE66D]" style={{ fontFamily: 'var(--font-display)' }}>4!</span>
              </motion.div>
            )}
          </div>
        )}

        {/* Hopping pawn */}
        {(phase === 'hopping' || phase === 'done') && (
          <motion.div
            className="flex items-end gap-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {Array.from({ length: 7 }, (_, i) => (
              <div key={i} className="relative">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold"
                  style={{
                    fontFamily: 'var(--font-display)',
                    background: i === pawnPos
                      ? 'rgba(34,197,94,0.3)'
                      : i > 0 && i < pawnPos
                      ? 'rgba(49,133,252,0.12)'
                      : 'rgba(255,255,255,0.08)',
                    border: i === pawnPos
                      ? '2px solid #22c55e'
                      : '1px solid rgba(255,255,255,0.15)',
                    color: 'rgba(255,255,255,0.6)',
                  }}
                >
                  {i + 1}
                </div>

                {/* Pawn */}
                {i === pawnPos && (
                  <motion.div
                    className="absolute -top-7 left-1/2 -translate-x-1/2"
                    key={pawnPos}
                    initial={{ y: 5, scale: 0.8 }}
                    animate={{ y: [-15, 0], scale: [1.2, 1] }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                  >
                    <div className="w-6 h-6 rounded-full bg-[#E84855] flex items-center justify-center text-[10px]">
                      🎮
                    </div>
                  </motion.div>
                )}
              </div>
            ))}
          </motion.div>
        )}

        {phase === 'done' && (
          <motion.p
            className="text-sm text-green-400 mt-1"
            style={{ fontFamily: 'var(--font-body)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            Landed on square 5!
          </motion.p>
        )}
      </div>
    </div>
  );
}
