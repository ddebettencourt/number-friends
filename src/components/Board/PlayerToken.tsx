import { motion } from 'framer-motion';
import type { Player } from '../../types/game';
import { positionToCoords } from '../../utils/boardHelpers';

interface PlayerTokenProps {
  player: Player;
  index: number;
  totalPlayers: number;
}

export function PlayerToken({ player, index, totalPlayers }: PlayerTokenProps) {
  const { row, col } = positionToCoords(player.position);

  // Offset tokens slightly so multiple players on same square don't overlap
  const offsetX = totalPlayers > 1 ? (index % 2 === 0 ? -15 : 15) : 0;
  const offsetY = totalPlayers > 1 ? (index < 2 ? -15 : 15) : 0;

  // Calculate position as percentage
  const x = col * 10 + 5; // Center of cell (each cell is 10%)
  const y = row * 10 + 5;

  return (
    <motion.div
      className="absolute pointer-events-none z-10"
      initial={false}
      animate={{
        left: `calc(${x}% + ${offsetX}px)`,
        top: `calc(${y}% + ${offsetY}px)`,
      }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 30,
      }}
      style={{
        transform: 'translate(-50%, -50%)',
      }}
    >
      {/* Outer glow ring */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle, ${player.color}60 0%, transparent 70%)`,
          filter: 'blur(6px)',
        }}
        animate={{
          scale: [1.2, 1.5, 1.2],
          opacity: [0.6, 0.3, 0.6],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Main token */}
      <motion.div
        className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-lg sm:text-xl relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${player.color} 0%, ${player.color}cc 100%)`,
          border: '2px solid rgba(255, 255, 255, 0.5)',
          boxShadow: `0 0 20px ${player.color}80, 0 4px 15px ${player.color}60, inset 0 2px 0 rgba(255,255,255,0.3)`,
        }}
        animate={{
          scale: [1, 1.08, 1],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        {/* Inner shine */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 50%)',
          }}
        />
        <span className="relative z-10">{player.avatar}</span>
      </motion.div>
    </motion.div>
  );
}
