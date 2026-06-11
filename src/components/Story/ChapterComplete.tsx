import { motion } from 'framer-motion';
import { useStoryStore, type CompanionId } from '../../stores/storyStore';
import { STORY_CHARACTERS, type StoryCharacterId } from './characters';

// Celebration card between chapters: the new companion takes a bow,
// the party so far lines up, and the journey continues.

const COMPANION_CHar: Record<string, StoryCharacterId> = {
  zero: 'zero',
  hours: 'hours',
  two: 'two',
  twentyseven: 'twentyseven',
};

const COMPANION_TITLES: Record<string, string> = {
  zero: 'Zero — who knows the value of nothing',
  hours: 'The Hours — keepers of the circle',
  two: 'Two — the only even prime',
  twentyseven: 'Twenty-Seven — rider of the long way home',
};

export function ChapterComplete({ chapterTitle, companion, onContinue }: {
  chapterTitle: string;
  companion: CompanionId;
  onContinue: () => void;
}) {
  const companions = useStoryStore((s) => s.progress.companions);
  const charId = COMPANION_CHar[companion] ?? 'zero';
  const char = STORY_CHARACTERS[charId];
  const Portrait = char.Portrait;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 tutorial-backdrop">
      <motion.div
        className="glass-card max-w-md w-full p-6 sm:p-8 text-center"
        initial={{ opacity: 0, scale: 0.92, y: 18 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 26 }}
      >
        <div className="label-caps mb-1" style={{ color: char.color }}>Chapter complete</div>
        <h2 className="heading-2 mb-5" style={{ color: 'var(--color-text-primary)' }}>{chapterTitle}</h2>

        <motion.div
          className="flex justify-center mb-2"
          initial={{ scale: 0.6, rotate: -8 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.25, type: 'spring', stiffness: 300, damping: 16 }}
        >
          <Portrait size={104} />
        </motion.div>
        <div className="font-body font-semibold mb-6" style={{ color: 'var(--color-text-secondary)' }}>
          {COMPANION_TITLES[companion] ?? `${char.name} joined your party`}
          <span className="block mt-1 text-sm" style={{ color: char.color }}>joined your party!</span>
        </div>

        {companions.length > 1 && (
          <div className="mb-6">
            <div className="label-caps mb-2">Your party</div>
            <div className="flex justify-center gap-2">
              {companions.map((c) => {
                const cChar = STORY_CHARACTERS[COMPANION_CHar[c] ?? 'zero'];
                const P = cChar.Portrait;
                return (
                  <div key={c} className="rounded-xl p-1" style={{ background: 'rgba(255,255,255,0.06)', border: `1px solid ${cChar.color}44` }}>
                    <P size={44} />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <button className="btn btn-cyan w-full" onClick={onContinue}>
          Onward
        </button>
      </motion.div>
    </div>
  );
}
