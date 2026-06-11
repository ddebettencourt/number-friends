import { motion } from 'framer-motion';
import { useStoryStore, nextChapter, type StoryChapterId } from '../../stores/storyStore';
import { STORY_CHARACTERS, type StoryCharacterId } from './characters';

// Chapter select: testing door today, replay menu forever.

interface Entry {
  id: StoryChapterId;
  eyebrow: string;
  title: string;
  accent: string;
  companion?: StoryCharacterId;
  built: boolean;
}

const ENTRIES: Entry[] = [
  { id: 'prologue', eyebrow: 'Prologue', title: 'The Hollow Board', accent: '#9B59B6', built: true },
  { id: 'nullhaven', eyebrow: 'Chapter 1', title: 'Nullhaven, the Mirror Marsh', accent: '#4ECDC4', companion: 'zero', built: true },
  { id: 'clockwork', eyebrow: 'Chapter 2', title: 'The Clockwork Commons', accent: '#F9A03F', companion: 'hours', built: true },
  { id: 'delta', eyebrow: 'Chapter 3', title: 'The Doubling Delta', accent: '#3185FC', companion: 'two', built: true },
  { id: 'hailstone', eyebrow: 'Chapter 4', title: 'The Hailstone Caverns', accent: '#F9A03F', companion: 'twentyseven', built: true },
  { id: 'inn', eyebrow: 'Chapter 5', title: 'The Infinite Inn', accent: '#9B59B6', built: false },
  { id: 'sands', eyebrow: 'Chapter 6', title: 'The Long Sands', accent: '#FFE66D', built: false },
  { id: 'gameshow', eyebrow: 'Chapter 7', title: 'The Devil’s Game Show', accent: '#E84855', built: false },
];

export function ChapterSelect({ onClose }: { onClose: () => void }) {
  const progress = useStoryStore((s) => s.progress);
  const resume = nextChapter(progress);

  const launch = (id: StoryChapterId) => {
    const store = useStoryStore.getState();
    store.startStory();
    store.goToChapter(id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 tutorial-backdrop">
      <motion.div
        className="glass-card w-full max-w-lg p-5 sm:p-7 max-h-[90dvh] overflow-y-auto"
        initial={{ opacity: 0, scale: 0.95, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 26 }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="label-caps">The Hollow Board</div>
            <h2 className="heading-2" style={{ color: 'var(--color-text-primary)' }}>Chapters</h2>
          </div>
          <button className="btn-icon" onClick={onClose} aria-label="Close chapter select">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="5" y1="5" x2="19" y2="19" />
              <line x1="19" y1="5" x2="5" y2="19" />
            </svg>
          </button>
        </div>

        <div className="space-y-2">
          {ENTRIES.map((e) => {
            const done = progress.completedChapters.includes(e.id);
            const isNext = e.id === resume;
            const Portrait = e.companion ? STORY_CHARACTERS[e.companion].Portrait : null;
            return (
              <button
                key={e.id}
                disabled={!e.built}
                onClick={() => launch(e.id)}
                className="w-full text-left rounded-xl px-4 py-3 flex items-center gap-3 transition-transform"
                style={{
                  background: isNext ? `${e.accent}1f` : 'rgba(255,255,255,0.05)',
                  border: `1.5px solid ${isNext ? `${e.accent}88` : 'rgba(255,255,255,0.12)'}`,
                  opacity: e.built ? 1 : 0.45,
                  cursor: e.built ? 'pointer' : 'not-allowed',
                }}
              >
                <div className="flex-1 min-w-0">
                  <div className="label-caps" style={{ color: e.accent }}>
                    {e.eyebrow}
                    {isNext && e.built && <span className="ml-2" style={{ color: 'var(--color-text-secondary)' }}>· continue</span>}
                    {!e.built && <span className="ml-2" style={{ color: 'var(--color-text-muted)' }}>· coming soon</span>}
                  </div>
                  <div className="font-title text-lg truncate" style={{ color: 'var(--color-text-primary)' }}>
                    {e.title}
                  </div>
                </div>
                {done && Portrait && (
                  <div className="flex-shrink-0 rounded-lg p-0.5" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <Portrait size={38} />
                  </div>
                )}
                {done && (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5FAD56" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
