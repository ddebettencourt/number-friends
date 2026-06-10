import { motion } from 'framer-motion';
import type { Player } from '../../types/game';

interface PassToPlayerProps {
  player: Player;
  minigameName: string;
  minigameDescription: string;
  stakes?: string;
  onReady: () => void;
  isMultiplayer?: boolean;
  allPlayers?: Player[];
}

export function PassToPlayer({
  player,
  minigameName,
  minigameDescription,
  stakes,
  onReady,
  isMultiplayer = false,
  allPlayers = [],
}: PassToPlayerProps) {
  return (
    <motion.div
      className="glass-card w-full max-w-lg mx-auto p-4 sm:p-6 max-h-[90dvh] overflow-y-auto text-center"
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
    >
      {/* Pass device indicator */}
      <motion.div
        className="mb-6"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className="label-caps mb-2">
          Pass device to
        </div>
        <div className="flex items-center justify-center gap-3">
          <motion.div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-lg"
            style={{ backgroundColor: player.color }}
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {player.avatar}
          </motion.div>
          <div className="text-left">
            <div className="heading-2 text-[var(--color-text-primary)]">
              {player.name}
            </div>
            <div className="font-body text-[var(--color-text-muted)] text-sm">
              Square {player.position}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Divider */}
      <div className="w-16 h-1 mx-auto bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.25)] to-transparent mb-6" />

      {/* Minigame info */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="heading-1 text-gradient-cyan mb-2">
          {minigameName}
        </h2>
        <p className="font-body text-[var(--color-text-secondary)] mb-2">
          {minigameDescription}
        </p>
        {stakes && (
          <p className="font-body text-xs font-medium px-3 py-1.5 rounded-lg inline-block"
            style={{
              background: 'rgba(255, 230, 109, 0.12)',
              color: 'var(--color-text-secondary)',
              border: '1px solid rgba(255, 230, 109, 0.35)',
            }}
          >
            {stakes}
          </p>
        )}
      </motion.div>

      {/* Multiplayer indicator */}
      {isMultiplayer && allPlayers.length > 1 && (
        <motion.div
          className="glass-inset p-4 mb-6"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="label-caps mb-2">
            All Players Compete
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {allPlayers.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                style={{
                  backgroundColor: `${p.color}20`,
                  borderColor: p.color,
                  borderWidth: 2,
                }}
              >
                <span className="text-lg">{p.avatar}</span>
                <span
                  className="font-bold text-sm"
                  style={{ color: p.color }}
                >
                  {p.name}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Ready button */}
      <motion.button
        className="btn btn-green btn-lg w-full"
        onClick={onReady}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
      >
        <span className="flex items-center justify-center gap-2">
          <span>I'm Ready!</span>
          <motion.span
            className="inline-flex"
            animate={{ x: [0, 4, 0] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14" />
              <path d="M13 6l6 6-6 6" />
            </svg>
          </motion.span>
        </span>
      </motion.button>

      {/* Tap hint */}
      <motion.p
        className="font-body text-[var(--color-text-muted)] text-xs mt-4"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        Tap when you're ready to start
      </motion.p>
    </motion.div>
  );
}
