import { useState } from 'react';
import { motion } from 'framer-motion';

// The prologue's die. Looks like the normal 2D roller — but every face
// is blank, and it lands on nothing. The first crack in the fiction.

interface HollowDiceProps {
  onLanded: () => void;
}

export function HollowDice({ onLanded }: HollowDiceProps) {
  const [state, setState] = useState<'ready' | 'rolling' | 'landed'>('ready');

  const roll = () => {
    if (state !== 'ready') return;
    setState('rolling');
    setTimeout(() => {
      setState('landed');
      setTimeout(onLanded, 1700);
    }, 1400);
  };

  return (
    <div className="flex flex-col items-center gap-3 cursor-pointer" onClick={roll}>
      <motion.div
        whileHover={state === 'ready' ? { scale: 1.04 } : {}}
        whileTap={state === 'ready' ? { scale: 0.96 } : {}}
      >
        <motion.div
          className="rounded-2xl flex items-center justify-center"
          style={{
            width: 'clamp(110px, 30vw, 140px)',
            height: 'clamp(110px, 30vw, 140px)',
            background: 'linear-gradient(145deg, #6d6d80 0%, #4a4a5c 100%)',
            boxShadow: '0 6px 0 #32323e, 0 10px 24px rgba(0, 0, 0, 0.4)',
          }}
          animate={
            state === 'rolling'
              ? { rotate: [0, 200, 420, 700, 1080], y: [0, -36, 0, -16, 0] }
              : { rotate: 0, y: 0 }
          }
          transition={state === 'rolling' ? { duration: 1.4, ease: 'easeOut' } : {}}
        >
          <div
            className="rounded-xl flex items-center justify-center"
            style={{
              width: '74%',
              height: '74%',
              background: 'rgba(0, 0, 0, 0.25)',
              boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.4)',
            }}
          >
            {/* the face: nothing. */}
            <motion.span
              className="font-display"
              style={{ fontSize: '2.6rem', color: 'rgba(255,255,255,0.25)' }}
              animate={state === 'landed' ? { opacity: [0, 1] } : { opacity: 0 }}
              transition={{ duration: 0.8 }}
            >
              ?
            </motion.span>
          </div>
        </motion.div>
      </motion.div>

      <div
        className="px-4 py-1.5 rounded-lg font-display text-sm"
        style={{
          background: 'rgba(15, 12, 35, 0.6)',
          border: '1px solid rgba(255,255,255,0.15)',
          color: 'rgba(255,255,255,0.7)',
          letterSpacing: '0.05em',
        }}
      >
        {state === 'ready' && 'Tap to roll!'}
        {state === 'rolling' && 'Rolling…'}
        {state === 'landed' && 'You rolled a… nothing?'}
      </div>
    </div>
  );
}
