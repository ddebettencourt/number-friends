import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useStoryStore } from '../../stores/storyStore';
import { useGameStore } from '../../stores/gameStore';
import { soundEngine } from '../../utils/soundEngine';
import { DialogueScene, type DialogueLine } from './DialogueScene';

// ============================================================
//  Orchestrates the prologue's beats on top of the (fake) game:
//  fake_game → crumbling (the world breaks) → falling (black,
//  wind, Zero's catch) → caught (handoff to Nullhaven).
// ============================================================

const FALL_DIALOGUE: DialogueLine[] = [
  { speaker: 'narrator', text: 'The board does not catch you. The numbers are not there to catch you. Nothing is.' },
  { speaker: 'zero', text: 'Easy. Easy! You’re all right — nothing’s got you.' },
  { speaker: 'zero', text: '…I’m Nothing. Zero, formally. It’s a long story, and you’ve just fallen into the middle of it.' },
  { speaker: 'zero', text: 'The numbers are gone from your board because they’re gone from everywhere. He locked them away — every pattern, every last one.' },
  { speaker: 'zero', text: 'Come on. Dry land first. Then I’ll explain what the Devil did.' },
];

export function PrologueDirector() {
  const phase = useStoryStore((s) => s.prologuePhase);
  const setPhase = useStoryStore((s) => s.setProloguePhase);
  const goToChapter = useStoryStore((s) => s.goToChapter);
  const resetGame = useGameStore((s) => s.resetGame);

  // crumbling → falling after the tiles have visibly dropped
  useEffect(() => {
    if (phase === 'crumbling') {
      soundEngine.stopMusic();
      const t = setTimeout(() => setPhase('falling'), 2300);
      return () => clearTimeout(t);
    }
  }, [phase, setPhase]);

  return (
    <AnimatePresence>
      {phase === 'crumbling' && (
        <motion.div
          key="crumble-vignette"
          className="fixed inset-0 z-40 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.5, 0.3, 0.65, 0.5] }}
          transition={{ duration: 2.2 }}
          style={{
            background: 'radial-gradient(ellipse at center, transparent 35%, rgba(5, 4, 16, 0.9) 100%)',
          }}
        />
      )}

      {phase === 'falling' && (
        <motion.div
          key="fall-screen"
          className="fixed inset-0 z-50 overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7 }}
          style={{ background: '#050410' }}
        >
          {/* wind streaks rushing upward — you are falling */}
          {Array.from({ length: 14 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-px rounded-full"
              style={{
                left: `${(i * 37) % 100}%`,
                height: 90 + (i % 4) * 50,
                background: 'linear-gradient(180deg, transparent, rgba(140, 160, 220, 0.35), transparent)',
              }}
              initial={{ top: '110%' }}
              animate={{ top: '-30%' }}
              transition={{
                duration: 0.8 + (i % 5) * 0.18,
                repeat: Infinity,
                ease: 'linear',
                delay: (i % 7) * 0.13,
              }}
            />
          ))}

          {/* you, tumbling */}
          <motion.div
            className="absolute left-1/2 top-[34%]"
            style={{ width: 30, height: 52, marginLeft: -15 }}
            animate={{ rotate: [0, 360], x: [-14, 14, -14], y: [0, 22, 0] }}
            transition={{
              rotate: { duration: 2.6, repeat: Infinity, ease: 'linear' },
              x: { duration: 3.4, repeat: Infinity, ease: 'easeInOut' },
              y: { duration: 2.2, repeat: Infinity, ease: 'easeInOut' },
            }}
          >
            <div style={{
              width: 30, height: 44, borderRadius: 15,
              background: 'linear-gradient(160deg, #F06B75, #C42B3D)',
              boxShadow: '0 0 22px rgba(232, 72, 85, 0.45)',
            }} />
            <div style={{ position: 'absolute', top: 9, left: 7, width: 5, height: 7, borderRadius: 3, background: '#fff' }} />
            <div style={{ position: 'absolute', top: 9, left: 18, width: 5, height: 7, borderRadius: 3, background: '#fff' }} />
          </motion.div>

          {/* a faint, far-below glow: the marsh, approaching */}
          <motion.div
            className="absolute left-1/2 top-[72%] -translate-x-1/2 rounded-full pointer-events-none"
            style={{
              width: 420,
              height: 180,
              background: 'radial-gradient(ellipse, rgba(78, 205, 196, 0.18) 0%, transparent 70%)',
              filter: 'blur(8px)',
            }}
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 6, ease: 'easeIn' }}
          />

          <DialogueScene
            lines={FALL_DIALOGUE}
            onComplete={() => {
              resetGame();
              goToChapter('nullhaven');
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
