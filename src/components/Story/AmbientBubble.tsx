import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { STORY_CHARACTERS, type StoryCharacterId } from './characters';

// Non-blocking speech: short lines that float in during play and dismiss
// themselves. Use for reactions and teaching beats; reserve the blocking
// DialogueScene for scene openings and endings only.

interface AmbientLine {
  id: number;
  speaker: StoryCharacterId;
  text: string;
}

const SHOW_MS = 4400;

export function useAmbient() {
  const [line, setLine] = useState<AmbientLine | null>(null);
  const queue = useRef<AmbientLine[]>([]);
  const nextId = useRef(1);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pump = useCallback(() => {
    timer.current = null;
    const next = queue.current.shift() ?? null;
    setLine(next);
    if (next) timer.current = setTimeout(pump, SHOW_MS);
  }, []);

  const say = useCallback(
    (speaker: StoryCharacterId, text: string) => {
      queue.current.push({ id: nextId.current++, speaker, text });
      if (!timer.current) pump(); // idle — show immediately
    },
    [pump]
  );

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const char = line ? STORY_CHARACTERS[line.speaker] : null;
  const Portrait = char?.Portrait;

  const node = (
    <div className="absolute top-0 left-0 right-0 flex justify-center pt-4 hud-safe-top pointer-events-none" style={{ zIndex: 44 }}>
      <AnimatePresence mode="wait">
        {line && char && Portrait && (
          <motion.div
            key={line.id}
            className="hud-panel flex items-center gap-2.5 pl-2 pr-4 py-2 max-w-md"
            style={{ borderColor: `${char.color}55` }}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
          >
            <div className="flex-shrink-0">
              <Portrait size={40} />
            </div>
            <div
              className="text-sm leading-snug"
              style={{ fontFamily: 'var(--font-body)', color: 'var(--color-text-primary)' }}
            >
              {line.text}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return { say, node };
}
