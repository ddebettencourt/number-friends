import { create } from 'zustand';

// ============================================================
//  Story mode: "The Hollow Board"
//  Campaign state machine + persistence. See STORY_MODE_DESIGN.md.
// ============================================================

export type StoryChapterId =
  | 'prologue'    // The Hollow Board — the false-normal game and the fall
  | 'nullhaven'   // Ch.1 — Zero, negatives, the zero-sum marsh crossing
  | 'clockwork'   // Ch.2 — modular arithmetic
  | 'delta'       // Ch.3 — binary / doubling
  | 'pascal'      // Ch.4 — Pascal's stair
  | 'hailstone'   // Ch.5 — Collatz caverns
  | 'inn'         // Ch.6 — Hilbert's infinite inn
  | 'sands'       // Ch.7 — perfect numbers
  | 'gameshow'    // Ch.8 — probability / Monty Hall
  | 'wilds'       // Ch.9 — irrationals
  | 'gallery'     // Ch.10 (optional) — golden ratio
  | 'climb'       // Ch.11 — the ascent
  | 'showdown';   // Ch.12 — the Number Devil

export type CompanionId =
  | 'zero' | 'two' | 'hours' | 'twentyseven' | 'twins'
  | 'goldie' | 'root' | 'aleph' | 'twentyeight' | 'chance';

// Phase within the prologue's false-normal game
export type ProloguePhase =
  | 'fake_game'   // looks like a normal game, but numberless
  | 'crumbling'   // the roll landed; the world is breaking
  | 'falling'     // black, wind, dialogue
  | 'caught';     // Zero has you — handoff to nullhaven

interface StoryProgress {
  completedChapters: StoryChapterId[];
  companions: CompanionId[];
  // Trial mastery for the boss's Gauntlet phase (chapter -> flawless?)
  flawless: Partial<Record<StoryChapterId, boolean>>;
}

interface StoryStore {
  // Session state
  active: boolean;
  chapter: StoryChapterId;
  /** Chapter-local scene key, e.g. 'intro' | 'puzzle' | 'outro' */
  scene: string;
  prologuePhase: ProloguePhase;
  progress: StoryProgress;

  // Actions
  startStory: () => void;
  exitStory: () => void;
  setScene: (scene: string) => void;
  setProloguePhase: (phase: ProloguePhase) => void;
  goToChapter: (chapter: StoryChapterId, scene?: string) => void;
  completeChapter: (chapter: StoryChapterId, opts?: { flawless?: boolean; companion?: CompanionId }) => void;
  resetStory: () => void;
}

const STORAGE_KEY = 'numberFriends_story';

function loadProgress(): StoryProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as StoryProgress;
      if (Array.isArray(parsed.completedChapters)) return parsed;
    }
  } catch {
    // corrupted save — start fresh
  }
  return { completedChapters: [], companions: [], flawless: {} };
}

function saveProgress(progress: StoryProgress) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // storage unavailable (private mode) — story still playable, just not saved
  }
}

/** The chapter a returning player should resume at. */
export function nextChapter(progress: StoryProgress): StoryChapterId {
  // Built-chapter order first; optional/unbuilt lands later so resume
  // always points at real content.
  const order: StoryChapterId[] = [
    'prologue', 'nullhaven', 'clockwork', 'delta', 'hailstone',
    'inn', 'sands', 'gameshow', 'wilds', 'pascal', 'climb', 'showdown',
  ];
  for (const ch of order) {
    if (!progress.completedChapters.includes(ch)) return ch;
  }
  return 'showdown';
}

export const useStoryStore = create<StoryStore>((set, get) => ({
  active: false,
  chapter: 'prologue',
  scene: 'intro',
  prologuePhase: 'fake_game',
  progress: loadProgress(),

  startStory: () => {
    const progress = loadProgress();
    const chapter = nextChapter(progress);
    set({
      active: true,
      chapter,
      scene: 'intro',
      prologuePhase: 'fake_game',
      progress,
    });
  },

  exitStory: () => {
    set({ active: false });
  },

  setScene: (scene: string) => set({ scene }),

  setProloguePhase: (prologuePhase: ProloguePhase) => set({ prologuePhase }),

  goToChapter: (chapter: StoryChapterId, scene = 'intro') => {
    set({ chapter, scene, prologuePhase: 'fake_game' });
  },

  completeChapter: (chapter, opts = {}) => {
    const { progress } = get();
    const completedChapters = progress.completedChapters.includes(chapter)
      ? progress.completedChapters
      : [...progress.completedChapters, chapter];
    const companions = opts.companion && !progress.companions.includes(opts.companion)
      ? [...progress.companions, opts.companion]
      : progress.companions;
    const flawless = { ...progress.flawless };
    if (opts.flawless !== undefined) flawless[chapter] = opts.flawless;

    const updated: StoryProgress = { completedChapters, companions, flawless };
    saveProgress(updated);
    set({ progress: updated });
  },

  resetStory: () => {
    const fresh: StoryProgress = { completedChapters: [], companions: [], flawless: {} };
    saveProgress(fresh);
    set({ progress: fresh, chapter: 'prologue', scene: 'intro', prologuePhase: 'fake_game' });
  },
}));
