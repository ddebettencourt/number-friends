import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const PRIME_GRID_1 = [2, 11, 29, 31, 43, 53, 67, 71];
const PRIME_GRID_2 = [3, 17, 29, 37, 41, 59, 73, 79];
const SHARED_PRIME = 29;

// Blackjack uses digit cards 0-9, not prime cards
const BLACKJACK_CARDS = [7, 3, 9, 4, 8];

export function PrimeGamesPage() {
  const [highlightShared, setHighlightShared] = useState(false);
  const [bjCards, setBjCards] = useState(0);
  const [bjSum, setBjSum] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setHighlightShared(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (bjCards < 5) {
      const timer = setTimeout(() => {
        setBjCards(prev => prev + 1);
        setBjSum(prev => prev + BLACKJACK_CARDS[bjCards]);
      }, 2500 + bjCards * 800);
      return () => clearTimeout(timer);
    }
  }, [bjCards]);

  return (
    <div className="py-2 space-y-5">
      {/* Prime-Off */}
      <div>
        <motion.h3
          className="text-lg text-aurora-blue font-bold mb-2 text-center"
          style={{ fontFamily: 'var(--font-display)' }}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          ⚡ Prime-Off!
        </motion.h3>

        <div className="flex justify-center gap-3">
          {[PRIME_GRID_1, PRIME_GRID_2].map((grid, gi) => (
            <motion.div
              key={gi}
              className="grid grid-cols-4 gap-1"
              initial={{ opacity: 0, x: gi === 0 ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + gi * 0.2 }}
            >
              {grid.map((n) => (
                <motion.div
                  key={n}
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold"
                  style={{
                    fontFamily: 'var(--font-display)',
                    background: highlightShared && n === SHARED_PRIME
                      ? 'rgba(49, 133, 252, 0.4)'
                      : 'rgba(255,255,255,0.08)',
                    border: highlightShared && n === SHARED_PRIME
                      ? '2px solid var(--color-prime)'
                      : '1px solid rgba(255,255,255,0.15)',
                    color: highlightShared && n === SHARED_PRIME ? 'var(--color-prime)' : 'rgba(255,255,255,0.6)',
                  }}
                  animate={highlightShared && n === SHARED_PRIME ? {
                    scale: [1, 1.15, 1],
                    boxShadow: ['0 0 0 rgba(49,133,252,0)', '0 0 12px rgba(49,133,252,0.5)', '0 0 0 rgba(49,133,252,0)'],
                  } : {}}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  {n}
                </motion.div>
              ))}
            </motion.div>
          ))}
        </div>

        <motion.p
          className="text-center text-sm text-white/60 mt-2"
          style={{ fontFamily: 'var(--font-body)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: highlightShared ? 1 : 0 }}
        >
          The shared prime is <span className="text-aurora-blue font-bold">29</span> — find it before your opponent does.
        </motion.p>
      </div>

      {/* Divider */}
      <div className="h-px bg-white/10 mx-8" />

      {/* Prime Blackjack */}
      <div>
        <motion.h3
          className="text-lg text-aurora-cyan font-bold mb-2 text-center"
          style={{ fontFamily: 'var(--font-display)' }}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          🃏 Prime Blackjack
        </motion.h3>

        <div className="flex justify-center gap-1.5 mb-2">
          {BLACKJACK_CARDS.slice(0, bjCards).map((card, i) => (
            <motion.div
              key={i}
              className="w-10 h-14 rounded-lg flex items-center justify-center text-sm font-bold"
              style={{
                fontFamily: 'var(--font-display)',
                background: 'linear-gradient(135deg, rgba(78,205,196,0.2), rgba(78,205,196,0.05))',
                border: '1px solid rgba(78,205,196,0.4)',
                color: 'var(--color-twin-prime)',
              }}
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200 }}
            >
              {card}
            </motion.div>
          ))}
        </div>

        {bjCards > 0 && (
          <motion.div
            className="text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <span className="text-sm text-white/50" style={{ fontFamily: 'var(--font-body)' }}>
              Sum: <span className="font-bold text-white/80" style={{ fontFamily: 'var(--font-display)' }}>{bjSum}</span>
              <span className="text-white/30"> / 100</span>
            </span>
          </motion.div>
        )}

        <motion.p
          className="text-center text-xs text-white/40 mt-2"
          style={{ fontFamily: 'var(--font-body)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          Draw digit cards (0-9), build the highest prime sum under 100. Go over and you bust.
        </motion.p>
      </div>
    </div>
  );
}
