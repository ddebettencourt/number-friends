import { motion } from 'framer-motion';

const FLOATING_NUMBERS = ['1', '2', '3', '5', '7', '8', '13', '42', '97', '100'];

export function WelcomePage() {
  return (
    <div className="relative text-center py-8">
      {/* Floating background numbers */}
      {FLOATING_NUMBERS.map((num, i) => (
        <motion.span
          key={i}
          className="absolute text-2xl font-bold pointer-events-none select-none"
          style={{
            fontFamily: 'var(--font-display)',
            color: `hsla(${i * 36}, 70%, 70%, 0.15)`,
            left: `${10 + (i % 5) * 20}%`,
            top: `${5 + Math.floor(i / 5) * 50}%`,
          }}
          animate={{
            y: [0, -20, 0],
            rotate: [0, i % 2 === 0 ? 10 : -10, 0],
          }}
          transition={{
            duration: 3 + i * 0.3,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.2,
          }}
        >
          {num}
        </motion.span>
      ))}

      {/* Title */}
      <motion.h1
        className="text-4xl sm:text-5xl text-white mb-4"
        style={{
          fontFamily: 'var(--font-title)',
          textShadow: '2px 2px 0 #2a2a5a, 4px 4px 0 #1a1a3a',
        }}
        initial={{ scale: 0, rotate: -10 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.1 }}
      >
        Number Friends!
      </motion.h1>

      {/* Subtitle */}
      <motion.p
        className="text-lg text-white/70 mb-8"
        style={{ fontFamily: 'var(--font-body)' }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        The strategic number racing game
      </motion.p>

      {/* Miniature board path */}
      <motion.div
        className="relative mx-auto w-64 h-16"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <svg viewBox="0 0 280 60" className="w-full h-full">
          {/* Path line */}
          <motion.path
            d="M10 30 Q70 10 140 30 Q210 50 270 30"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="3"
            strokeDasharray="6 4"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2, delay: 0.8, ease: 'easeInOut' }}
          />
          {/* Start */}
          <motion.g
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 1.2, type: 'spring' }}
          >
            <circle cx="10" cy="30" r="10" fill="#22c55e" />
            <text x="10" y="34" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">1</text>
          </motion.g>
          {/* End */}
          <motion.g
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 2.6, type: 'spring' }}
          >
            <circle cx="270" cy="30" r="12" fill="#FFE66D" />
            <text x="270" y="35" textAnchor="middle" fill="#1a1a2e" fontSize="11" fontWeight="bold">100</text>
          </motion.g>
          {/* Pawn */}
          <motion.g
            initial={{ x: 0 }}
            animate={{ x: [0, 40, 80, 120] }}
            transition={{ duration: 3, delay: 1.5, ease: 'easeInOut' }}
          >
            <circle cx="10" cy="20" r="6" fill="#E84855" />
            <text x="10" y="23" textAnchor="middle" fill="white" fontSize="8">&#x1F3AE;</text>
          </motion.g>
        </svg>
      </motion.div>

      {/* Goal badge */}
      <motion.div
        className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-full"
        style={{
          background: 'rgba(255, 230, 109, 0.15)',
          border: '1px solid rgba(255, 230, 109, 0.3)',
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0, type: 'spring' }}
      >
        <span className="text-xl">🏆</span>
        <span className="text-white font-bold" style={{ fontFamily: 'var(--font-display)' }}>
          Race to Square 100!
        </span>
      </motion.div>
    </div>
  );
}
