import { useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import type { Player } from '../../types/game';
import type { GameAward, GameStats } from '../../types/stats';
import { soundEngine } from '../../utils/soundEngine';
import { useStatsStore } from '../../stores/statsStore';
import { useGameStore } from '../../stores/gameStore';
import { formatDuration } from '../../utils/statsHelpers';

interface VictoryScreenProps {
  winner: Player;
  onPlayAgain: () => void;
}

function AwardCard({ award, index }: { award: GameAward; index: number }) {
  return (
    <motion.div
      className="p-3 rounded-xl text-center"
      style={{
        background: `linear-gradient(135deg, ${award.color}25, ${award.color}08)`,
        border: `1px solid ${award.color}35`,
        boxShadow: `0 0 16px ${award.color}15`,
      }}
      initial={{ scale: 0, rotate: -5 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ delay: 1.0 + index * 0.12, type: 'spring', stiffness: 300, damping: 18 }}
    >
      <div className="text-2xl mb-1">{award.icon}</div>
      <div
        className="font-bold text-xs leading-tight"
        style={{ fontFamily: 'var(--font-display)', color: award.color }}
      >
        {award.title}
      </div>
      <div className="text-[10px] text-white/40 leading-tight mt-0.5" style={{ fontFamily: 'var(--font-body)' }}>
        {award.subtitle}
      </div>
      <div className="mt-1.5 font-bold text-sm text-white/90" style={{ fontFamily: 'var(--font-display)' }}>
        {award.playerName}
      </div>
      <div className="text-[10px] text-white/50" style={{ fontFamily: 'var(--font-body)' }}>
        {award.value}
      </div>
    </motion.div>
  );
}

function PlayerSummary({ players, stats, index }: { players: Player[]; stats: GameStats; index: number }) {
  const player = players[index];
  const playerTurns = stats.turns.filter(t => t.playerId === player.id);
  const totalDistance = playerTurns.reduce((sum, t) => sum + Math.abs(t.positionAfter - t.positionBefore), 0);
  const minigamesTriggered = stats.minigameEvents.filter(e => e.triggeringPlayerId === player.id).length;
  const highestRoll = playerTurns.length > 0 ? Math.max(...playerTurns.map(t => t.rollValue)) : 0;

  return (
    <motion.div
      className="flex items-center gap-3 p-3 rounded-xl"
      style={{
        background: `${player.color}12`,
        border: `1px solid ${player.color}25`,
      }}
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: 1.8 + index * 0.1 }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
        style={{ background: `${player.color}40` }}
      >
        {player.avatar}
      </div>
      <div className="flex-1 text-left min-w-0">
        <div className="font-bold text-sm text-white/90 truncate" style={{ fontFamily: 'var(--font-display)' }}>
          {player.name}
        </div>
        <div className="text-[11px] text-white/40" style={{ fontFamily: 'var(--font-body)' }}>
          {totalDistance} sq &middot; {minigamesTriggered} minigames &middot; best roll: {highestRoll}
        </div>
      </div>
      <div
        className="text-right font-bold text-sm flex-shrink-0"
        style={{ fontFamily: 'var(--font-display)', color: player.color }}
      >
        Sq {player.position}
      </div>
    </motion.div>
  );
}

export function VictoryScreen({ winner, onPlayAgain }: VictoryScreenProps) {
  const { stats } = useStatsStore();
  const { players } = useGameStore();

  const awards = useMemo(() => {
    return useStatsStore.getState().getAwards(
      players.map(p => ({ id: p.id, name: p.name, color: p.color }))
    );
  }, [players]);

  useEffect(() => {
    soundEngine.victory();
    soundEngine.playMusic('victory');
    return () => {
      soundEngine.stopMusic();
    };
  }, []);

  const confettiColors = ['#ff6b9d', '#61dafb', '#98ec65', '#c678dd', '#ffd93d'];

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Cosmic background glow */}
      <div
        className="absolute inset-0 opacity-60"
        style={{
          background: `radial-gradient(circle at 30% 20%, ${winner.color}40 0%, transparent 50%),
                       radial-gradient(circle at 70% 80%, #c678dd30 0%, transparent 50%)`,
        }}
      />

      {/* Confetti */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 50 }).map((_, i) => {
          const shapeType = i % 3;
          const swayAmount = (Math.random() - 0.5) * 200;
          const initialRotation = Math.random() * 360;
          const spinAmount = initialRotation + (Math.random() > 0.5 ? 720 : -720);
          const duration = 2 + Math.random() * 2;
          const delay = Math.random() * 0.5;
          const repeatDelay = Math.random() * 2;

          return (
            <motion.div
              key={i}
              className={`absolute ${
                shapeType === 0
                  ? 'w-2 h-4 rounded-sm'
                  : shapeType === 1
                    ? 'w-3 h-3 rounded-full'
                    : 'w-3 h-3'
              }`}
              style={{
                backgroundColor: confettiColors[i % 5],
                left: `${Math.random() * 100}%`,
                boxShadow: `0 0 10px ${confettiColors[i % 5]}`,
                ...(shapeType === 2
                  ? { clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' }
                  : {}),
              }}
              initial={{ y: -20, opacity: 1, x: 0, rotate: initialRotation }}
              animate={{
                y: '100vh',
                opacity: 0,
                x: [0, swayAmount, -swayAmount * 0.5, swayAmount * 0.3],
                rotate: spinAmount,
              }}
              transition={{
                duration,
                delay,
                repeat: Infinity,
                repeatDelay,
                ease: "easeInOut",
              }}
            />
          );
        })}
      </div>

      {/* Main card - scrollable */}
      <motion.div
        className="relative rounded-3xl p-6 sm:p-10 text-center max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        style={{
          background: 'rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          boxShadow: `0 0 60px ${winner.color}40, 0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)`,
        }}
        initial={{ scale: 0, rotate: -10 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
      >
        {/* Star icon */}
        <motion.div
          className="w-16 h-16 mx-auto mb-3 rounded-2xl flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, #ffd93d 0%, #ff9f43 100%)',
            boxShadow: '0 0 40px rgba(255, 217, 61, 0.6), 0 4px 20px rgba(255, 159, 67, 0.4)',
          }}
          animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" className="text-[#0f0a1f]">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor" />
          </svg>
        </motion.div>

        <h1
          className="text-3xl sm:text-4xl font-black mb-2"
          style={{
            fontFamily: 'var(--font-display)',
            background: 'linear-gradient(135deg, #ffd93d, #ff9f43, #ff6b9d, #c678dd)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Victory!
        </h1>

        {/* Winner info */}
        <div className="flex items-center justify-center gap-3 my-4">
          <motion.div
            className="w-14 h-14 rounded-full flex items-center justify-center text-2xl relative overflow-hidden flex-shrink-0"
            style={{
              background: `linear-gradient(135deg, ${winner.color}, ${winner.color}cc)`,
              boxShadow: `0 0 30px ${winner.color}80`,
              border: '2px solid rgba(255, 255, 255, 0.3)',
            }}
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
          >
            <div
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 50%)' }}
            />
            <span className="relative z-10">{winner.avatar}</span>
          </motion.div>
          <div className="text-left">
            <div className="font-bold text-xl text-white/90" style={{ fontFamily: 'var(--font-display)' }}>
              {winner.name}
            </div>
            <div className="text-sm text-white/50" style={{ fontFamily: 'var(--font-body)' }}>
              reached square 100
            </div>
          </div>
        </div>

        {/* Awards section */}
        {awards.length > 0 && (
          <>
            <div className="my-5 border-t border-white/10" />
            <motion.h2
              className="text-lg font-bold text-white/60 mb-3"
              style={{ fontFamily: 'var(--font-display)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              Game Awards
            </motion.h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-2">
              {awards.map((award, i) => (
                <AwardCard key={award.id} award={award} index={i} />
              ))}
            </div>
          </>
        )}

        {/* Player summary */}
        {players.length > 1 && (
          <>
            <div className="my-5 border-t border-white/10" />
            <motion.h2
              className="text-lg font-bold text-white/60 mb-3"
              style={{ fontFamily: 'var(--font-display)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.6 }}
            >
              Players
            </motion.h2>
            <div className="space-y-2 mb-2">
              {players.map((_, i) => (
                <PlayerSummary key={players[i].id} players={players} stats={stats} index={i} />
              ))}
            </div>
          </>
        )}

        {/* Game duration */}
        {stats.endTime && (
          <motion.div
            className="text-xs text-white/30 mt-4 mb-4"
            style={{ fontFamily: 'var(--font-body)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.2 }}
          >
            {formatDuration(stats.endTime - stats.startTime)} &middot; {stats.totalTurns} turns
          </motion.div>
        )}

        {/* Play Again */}
        <motion.button
          className="w-full py-3.5 font-bold text-lg rounded-xl relative overflow-hidden mt-2"
          style={{
            fontFamily: 'var(--font-display)',
            background: 'linear-gradient(135deg, #c678dd 0%, #ff6b9d 100%)',
            boxShadow: '0 0 20px rgba(198, 120, 221, 0.5), 0 4px 15px rgba(255, 107, 157, 0.3)',
          }}
          onClick={onPlayAgain}
          whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(198, 120, 221, 0.7), 0 6px 20px rgba(255, 107, 157, 0.5)' }}
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.5 }}
        >
          <span className="relative z-10 text-white">Play Again</span>
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 1, ease: "easeInOut" }}
          />
        </motion.button>
      </motion.div>
    </div>
  );
}
