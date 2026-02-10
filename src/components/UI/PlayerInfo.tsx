import { motion } from 'framer-motion';
import type { Player } from '../../types/game';

interface PlayerInfoProps {
  players: Player[];
  currentPlayerIndex: number;
}

export function PlayerInfo({ players, currentPlayerIndex }: PlayerInfoProps) {
  return (
    <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
      {players.map((player, index) => {
        const isActive = index === currentPlayerIndex;
        return (
          <div key={player.id} className="relative flex flex-col items-center">
            {/* YOUR TURN badge */}
            {isActive && (
              <motion.div
                className="absolute -top-5 left-1/2 z-20 px-2 py-0.5 rounded-md whitespace-nowrap"
                style={{
                  transform: 'translateX(-50%)',
                  background: player.color,
                  color: '#fff',
                  fontSize: '9px',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  boxShadow: `0 0 10px ${player.color}80`,
                }}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                YOUR TURN
              </motion.div>
            )}
          <motion.div
            className="flex items-center gap-2 px-3 py-2 rounded-2xl relative overflow-hidden"
            style={{
              background: isActive
                ? 'rgba(255, 255, 255, 0.12)'
                : 'rgba(255, 255, 255, 0.06)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: isActive
                ? `2px solid ${player.color}`
                : '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: isActive
                ? `0 0 20px ${player.color}40, inset 0 1px 0 rgba(255,255,255,0.1)`
                : 'inset 0 1px 0 rgba(255,255,255,0.05)',
            }}
            animate={isActive ? {
              scale: [1, 1.05, 1],
            } : {}}
            transition={{ duration: 1.5, repeat: isActive ? Infinity : 0, ease: "easeInOut" }}
          >
            {/* Glow effect for active player */}
            {isActive && (
              <motion.div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: `radial-gradient(circle at center, ${player.color}20 0%, transparent 70%)`,
                }}
                animate={{ opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            )}

            <motion.div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl relative z-10"
              style={{
                backgroundColor: player.color,
                boxShadow: `0 4px 15px ${player.color}60`,
              }}
              whileHover={{ scale: 1.1, rotate: 10 }}
            >
              {player.avatar}
            </motion.div>

            <div className="text-sm relative z-10">
              <div className="font-body font-bold text-[var(--color-text-primary)]">
                {player.name}
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-[var(--color-text-muted)]">Square</span>
                <span
                  className="text-xs font-body font-bold px-2 py-0.5 rounded-md"
                  style={{
                    backgroundColor: `${player.color}30`,
                    color: player.color,
                    boxShadow: `0 0 8px ${player.color}30`,
                  }}
                >
                  {player.position}
                </span>
              </div>
            </div>

            {isActive && (
              <motion.div
                className="w-2.5 h-2.5 rounded-full relative z-10"
                style={{
                  backgroundColor: player.color,
                  boxShadow: `0 0 10px ${player.color}`,
                }}
                animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
            )}
          </motion.div>
          </div>
        );
      })}
    </div>
  );
}
