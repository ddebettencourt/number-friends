import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { STORY_CHARACTERS, type StoryCharacterId } from './characters';

// ============================================================
//  Story dialogue: a bottom bar over any scene (3D or styled bg).
//  Classic adventure-game flow — typewriter text, tap to reveal,
//  tap again to advance. Narrator lines render centered + italic.
// ============================================================

export interface DialogueLine {
  speaker: StoryCharacterId;
  text: string;
}

interface DialogueSceneProps {
  lines: DialogueLine[];
  onComplete: () => void;
  /** Optional label for the skip control (omit to disallow skipping) */
  skipLabel?: string;
}

const CHAR_INTERVAL_MS = 24;

export function DialogueScene({ lines, onComplete, skipLabel }: DialogueSceneProps) {
  const [lineIdx, setLineIdx] = useState(0);
  // Typed progress is stored per line index and derived to zero when the line
  // changes — no state reset inside the effect.
  const [typed, setTyped] = useState<{ idx: number; n: number }>({ idx: 0, n: 0 });
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const line = lines[lineIdx];
  const shown = typed.idx === lineIdx ? typed.n : 0;
  const typing = line ? shown < line.text.length : false;

  // Typewriter for the current line
  useEffect(() => {
    if (!line) return;
    timer.current = setInterval(() => {
      setTyped((t) => {
        const current = t.idx === lineIdx ? t.n : 0;
        if (current >= line.text.length) {
          if (timer.current) clearInterval(timer.current);
          return t;
        }
        return { idx: lineIdx, n: current + 1 };
      });
    }, CHAR_INTERVAL_MS);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [lineIdx, line]);

  const advance = useCallback(() => {
    if (!line) return;
    if (typing) {
      // reveal the whole line instantly
      if (timer.current) clearInterval(timer.current);
      setTyped({ idx: lineIdx, n: line.text.length });
      return;
    }
    if (lineIdx + 1 < lines.length) {
      setLineIdx(lineIdx + 1);
    } else {
      onComplete();
    }
  }, [line, typing, lineIdx, lines.length, onComplete]);

  // Space / Enter advance
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        advance();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [advance]);

  if (!line) return null;

  const char = STORY_CHARACTERS[line.speaker];
  const isNarrator = line.speaker === 'narrator';
  const visibleText = line.text.slice(0, shown);

  return (
    <div
      className="absolute inset-0 z-30 flex flex-col justify-end cursor-pointer select-none"
      onClick={advance}
      role="button"
      aria-label="Advance dialogue"
    >
      {skipLabel && (
        <button
          className="absolute top-4 right-4 pointer-events-auto btn btn-ghost btn-sm hud-safe-top"
          onClick={(e) => {
            e.stopPropagation();
            onComplete();
          }}
        >
          {skipLabel}
        </button>
      )}

      <div className="w-full max-w-2xl mx-auto px-3 pb-4 hud-safe-bottom">
        <AnimatePresence mode="wait">
          {isNarrator ? (
            <motion.div
              key={`n${lineIdx}`}
              className="hud-panel px-6 py-5 text-center"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <p
                className="italic text-base sm:text-lg leading-relaxed"
                style={{ fontFamily: 'var(--font-body)', color: 'var(--color-text-secondary)' }}
              >
                {visibleText}
                {typing && <span className="tutorial-cursor" />}
              </p>
            </motion.div>
          ) : (
            <motion.div
              key={`d${lineIdx}-${line.speaker}`}
              className="flex items-end gap-3"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              {/* portrait */}
              <motion.div
                className="flex-shrink-0 -mb-1"
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
              >
                <char.Portrait size={76} />
              </motion.div>

              {/* dialogue card */}
              <div
                className="hud-panel flex-1 px-5 py-4 min-h-[96px]"
                style={{ borderColor: `${char.color}55` }}
              >
                <div
                  className="label-caps mb-1.5"
                  style={{ color: char.color }}
                >
                  {char.name}
                </div>
                <p
                  className="text-base sm:text-lg leading-relaxed"
                  style={{ fontFamily: 'var(--font-body)', color: 'var(--color-text-primary)' }}
                >
                  {visibleText}
                  {typing && <span className="tutorial-cursor" />}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* advance hint */}
        <div
          className="text-center mt-2 text-[11px]"
          style={{ fontFamily: 'var(--font-body)', color: 'rgba(255,255,255,0.35)' }}
        >
          {typing ? 'tap to reveal' : lineIdx + 1 < lines.length ? 'tap to continue' : 'tap to begin'}
        </div>
      </div>
    </div>
  );
}
