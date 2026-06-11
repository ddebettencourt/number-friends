import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useStoryStore } from '../../stores/storyStore';
import { useGameStore } from '../../stores/gameStore';
import { GameContainer } from '../Game/GameContainer';
import { PrologueDirector } from './PrologueDirector';
import { NullhavenScene } from './NullhavenScene';
import { ClockworkScene } from './ClockworkScene';
import { DeltaScene } from './DeltaScene';
import { HailstoneScene } from './HailstoneScene';
import { STORY_CHARACTERS } from './characters';

// ============================================================
//  Story mode shell — routes the active chapter to its scene.
//  The prologue renders the REAL game (numberless) underneath
//  its director; later chapters are their own dioramas.
// ============================================================

function ComingSoon() {
  const exitStory = useStoryStore((s) => s.exitStory);
  const Devil = STORY_CHARACTERS.devil.Portrait;
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-6 tutorial-backdrop">
      <motion.div
        className="glass-card max-w-md w-full p-6 sm:p-8 text-center"
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <div className="flex justify-center mb-3"><Devil size={84} /></div>
        <div className="label-caps mb-2">The story continues…</div>
        <h2 className="heading-2 text-gradient-cyan mb-3">The Infinite Inn</h2>
        <p className="font-body text-[var(--color-text-secondary)] mb-6">
          The next chapter is still being written. The Devil, for one, is in no hurry
          for you to arrive.
        </p>
        <button className="btn btn-cyan w-full" onClick={exitStory}>
          Back to the board
        </button>
      </motion.div>
    </div>
  );
}

export function StoryMode() {
  const chapter = useStoryStore((s) => s.chapter);
  const initGame = useGameStore((s) => s.initGame);
  const gamePhase = useGameStore((s) => s.phase);

  // The prologue needs a real-looking game running underneath
  useEffect(() => {
    if (chapter === 'prologue' && gamePhase === 'setup') {
      initGame(['You'], [{ name: 'Bot', difficulty: 'easy' }]);
    }
  }, [chapter, gamePhase, initGame]);

  if (chapter === 'prologue') {
    return (
      <>
        {gamePhase !== 'setup' && <GameContainer />}
        <PrologueDirector />
      </>
    );
  }

  if (chapter === 'nullhaven') {
    return <NullhavenScene />;
  }

  if (chapter === 'clockwork') {
    return <ClockworkScene />;
  }

  if (chapter === 'delta') {
    return <DeltaScene />;
  }

  if (chapter === 'hailstone') {
    return <HailstoneScene />;
  }

  return <ComingSoon />;
}
