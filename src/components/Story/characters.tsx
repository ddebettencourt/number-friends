/* eslint-disable react-refresh/only-export-components --
   This is a character registry: portrait components live alongside the
   STORY_CHARACTERS lookup that story scenes key into. Fast-refresh falling
   back to a full reload for this rarely-edited file is an acceptable trade. */

// Story-mode character registry: portraits share Primo's visual language —
// simple geometric "number-beings" with expressive eyes, drawn as inline SVG.

export type StoryCharacterId = 'zero' | 'primo' | 'devil' | 'hours' | 'two' | 'twentyseven' | 'narrator';

interface StoryCharacter {
  name: string;
  /** Accent used for the name chip + dialogue border */
  color: string;
  Portrait: (props: { size?: number }) => React.ReactNode | null;
}

function ZeroPortrait({ size = 72 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      <defs>
        <radialGradient id="zero-glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="60%" stopColor="rgba(78,205,196,0)" />
          <stop offset="92%" stopColor="rgba(78,205,196,0.35)" />
          <stop offset="100%" stopColor="rgba(78,205,196,0)" />
        </radialGradient>
      </defs>
      {/* aura */}
      <circle cx="40" cy="40" r="38" fill="url(#zero-glow)" />
      {/* the ring that is Zero: nothing, outlined */}
      <circle cx="40" cy="40" r="26" stroke="#2d2d5a" strokeWidth="13" fill="none" />
      <circle cx="40" cy="40" r="32.5" stroke="#4ECDC4" strokeWidth="1.5" fill="none" opacity="0.8" />
      <circle cx="40" cy="40" r="19.5" stroke="#4ECDC4" strokeWidth="1.5" fill="none" opacity="0.5" />
      {/* highlight on the ring body */}
      <path d="M20 26 A26 26 0 0 1 40 14" stroke="rgba(255,255,255,0.35)" strokeWidth="5" strokeLinecap="round" fill="none" />
      {/* eyes float inside the hole — there is nothing else in there */}
      <ellipse cx="34" cy="38" rx="3" ry="4" fill="#eafffd" />
      <ellipse cx="46" cy="38" rx="3" ry="4" fill="#eafffd" />
      <circle cx="34.6" cy="37" r="1.4" fill="#16213e" />
      <circle cx="46.6" cy="37" r="1.4" fill="#16213e" />
      {/* small calm mouth */}
      <path d="M36 47 Q40 50 44 47" stroke="#eafffd" strokeWidth="1.8" strokeLinecap="round" fill="none" />
    </svg>
  );
}

function PrimoPortrait({ size = 72 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 80" fill="none">
      <defs>
        <radialGradient id="primo-portrait-shine" cx="0.35" cy="0.35" r="0.65">
          <stop offset="0%" stopColor="rgba(255,255,255,0.3)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
      </defs>
      {/* graduation cap */}
      <polygon points="32,4 52,16 32,20 12,16" fill="var(--color-nebula-light)" />
      <rect x="28" y="16" width="8" height="6" fill="var(--color-nebula-light)" />
      <line x1="48" y1="14" x2="52" y2="8" stroke="#FFE66D" strokeWidth="2" />
      <circle cx="52" cy="7" r="3" fill="#FFE66D" />
      {/* body */}
      <circle cx="32" cy="48" r="24" fill="#4ECDC4" />
      <circle cx="32" cy="48" r="24" fill="url(#primo-portrait-shine)" />
      <circle cx="32" cy="48" r="22" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
      {/* eyes */}
      <ellipse cx="24" cy="44" rx="4" ry="4.5" fill="white" />
      <ellipse cx="40" cy="44" rx="4" ry="4.5" fill="white" />
      <circle cx="25" cy="43" r="2.5" fill="var(--color-nebula-mid)" />
      <circle cx="41" cy="43" r="2.5" fill="var(--color-nebula-mid)" />
      <circle cx="26" cy="42" r="1" fill="white" />
      <circle cx="42" cy="42" r="1" fill="white" />
      {/* smile + blush */}
      <path d="M24 54 Q32 62 40 54" stroke="var(--color-nebula-mid)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <circle cx="18" cy="52" r="4" fill="#4ECDC4" opacity="0.5" />
      <circle cx="46" cy="52" r="4" fill="#4ECDC4" opacity="0.5" />
    </svg>
  );
}

function DevilPortrait({ size = 72 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      <defs>
        <radialGradient id="devil-shine" cx="0.35" cy="0.3" r="0.7">
          <stop offset="0%" stopColor="rgba(255,255,255,0.25)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
      </defs>
      {/* horns */}
      <path d="M22 22 Q16 10 24 6 Q24 16 30 18 Z" fill="#9B1B30" />
      <path d="M58 22 Q64 10 56 6 Q56 16 50 18 Z" fill="#9B1B30" />
      {/* head */}
      <circle cx="40" cy="44" r="26" fill="#E84855" />
      <circle cx="40" cy="44" r="26" fill="url(#devil-shine)" />
      {/* theatrical brows */}
      <path d="M26 36 L36 40" stroke="#5a0f1c" strokeWidth="3" strokeLinecap="round" />
      <path d="M54 36 L44 40" stroke="#5a0f1c" strokeWidth="3" strokeLinecap="round" />
      {/* sharp eyes */}
      <ellipse cx="32" cy="44" rx="3.4" ry="4" fill="#ffe9d6" />
      <ellipse cx="48" cy="44" rx="3.4" ry="4" fill="#ffe9d6" />
      <circle cx="32.8" cy="43.5" r="1.6" fill="#2a0810" />
      <circle cx="48.8" cy="43.5" r="1.6" fill="#2a0810" />
      {/* the famous curled mustache */}
      <path d="M30 54 Q40 50 50 54 M30 54 Q24 56 22 51 M50 54 Q56 56 58 51"
        stroke="#5a0f1c" strokeWidth="3" strokeLinecap="round" fill="none" />
      {/* smirk */}
      <path d="M34 60 Q42 64 48 58" stroke="#5a0f1c" strokeWidth="2.2" strokeLinecap="round" fill="none" />
    </svg>
  );
}

function HoursPortrait({ size = 72 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      <defs>
        <radialGradient id="hours-shine" cx="0.35" cy="0.3" r="0.7">
          <stop offset="0%" stopColor="rgba(255,255,255,0.3)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
      </defs>
      {/* clock body */}
      <circle cx="40" cy="42" r="28" fill="#F9A03F" />
      <circle cx="40" cy="42" r="28" fill="url(#hours-shine)" />
      <circle cx="40" cy="42" r="24" fill="#fdf3e3" />
      {/* twelve ticks */}
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i / 12) * Math.PI * 2;
        const x1 = 40 + Math.sin(a) * 21;
        const y1 = 42 - Math.cos(a) * 21;
        const x2 = 40 + Math.sin(a) * 17.5;
        const y2 = 42 - Math.cos(a) * 17.5;
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#C67A1F" strokeWidth={i % 3 === 0 ? 2.4 : 1.4} strokeLinecap="round" />;
      })}
      {/* eyes */}
      <circle cx="33" cy="38" r="3" fill="#2a1c10" />
      <circle cx="47" cy="38" r="3" fill="#2a1c10" />
      <circle cx="34" cy="37" r="1" fill="#fff" />
      <circle cx="48" cy="37" r="1" fill="#fff" />
      {/* smile made of clock hands */}
      <path d="M40 44 L40 50 M40 50 L46 48" stroke="#2a1c10" strokeWidth="2.4" strokeLinecap="round" fill="none" />
      <path d="M33 52 Q40 57 47 52" stroke="#C67A1F" strokeWidth="2" strokeLinecap="round" fill="none" />
      {/* bell hat */}
      <circle cx="40" cy="12" r="4" fill="#FFE66D" stroke="#C67A1F" strokeWidth="1.5" />
    </svg>
  );
}

function TwoPortrait({ size = 72 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      <defs>
        <radialGradient id="two-shine" cx="0.35" cy="0.3" r="0.7">
          <stop offset="0%" stopColor="rgba(255,255,255,0.35)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
      </defs>
      {/* a binary pair — two orbs sharing one orbit */}
      <ellipse cx="40" cy="44" rx="30" ry="12" stroke="#5BA3FC" strokeWidth="1.5" fill="none" opacity="0.5" />
      <circle cx="28" cy="40" r="15" fill="#3185FC" />
      <circle cx="28" cy="40" r="15" fill="url(#two-shine)" />
      <circle cx="54" cy="50" r="9" fill="#5BA3FC" />
      <circle cx="54" cy="50" r="9" fill="url(#two-shine)" />
      {/* eyes on the lead orb */}
      <ellipse cx="23" cy="37" rx="2.8" ry="3.4" fill="#fff" />
      <ellipse cx="33" cy="37" rx="2.8" ry="3.4" fill="#fff" />
      <circle cx="23.6" cy="36.4" r="1.3" fill="#0D2F5E" />
      <circle cx="33.6" cy="36.4" r="1.3" fill="#0D2F5E" />
      {/* determined little mouth */}
      <path d="M24 45 Q28 47.5 32 45" stroke="#0D2F5E" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      {/* the little one winks */}
      <path d="M51 48 Q53 49.5 56 48" stroke="#0D2F5E" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <circle cx="52" cy="46" r="1" fill="#0D2F5E" />
    </svg>
  );
}

function TwentySevenPortrait({ size = 72 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      <defs>
        <radialGradient id="ts-shine" cx="0.35" cy="0.3" r="0.7">
          <stop offset="0%" stopColor="rgba(255,255,255,0.35)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
      </defs>
      {/* speed trail */}
      <path d="M10 50 Q20 46 28 48 M6 40 Q18 38 26 40 M12 30 Q21 30 28 33"
        stroke="#F9A03F" strokeWidth="3" strokeLinecap="round" opacity="0.5" fill="none" />
      {/* comet head */}
      <circle cx="46" cy="40" r="20" fill="#F9A03F" />
      <circle cx="46" cy="40" r="20" fill="url(#ts-shine)" />
      {/* aviator goggles */}
      <rect x="32" y="31" width="28" height="3.4" rx="1.7" fill="#5b4632" />
      <circle cx="40" cy="37" r="6.4" fill="#2d2d5a" stroke="#5b4632" strokeWidth="2.4" />
      <circle cx="54" cy="37" r="6.4" fill="#2d2d5a" stroke="#5b4632" strokeWidth="2.4" />
      {/* gleaming eyes behind the lenses */}
      <circle cx="41.5" cy="36" r="2" fill="#FFE66D" />
      <circle cx="55.5" cy="36" r="2" fill="#FFE66D" />
      {/* grin */}
      <path d="M38 50 Q47 56 56 49" stroke="#5b2a10" strokeWidth="2.6" strokeLinecap="round" fill="none" />
      <path d="M50 52.5 L52.5 49.8" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export const STORY_CHARACTERS: Record<StoryCharacterId, StoryCharacter> = {
  twentyseven: { name: 'Twenty-Seven', color: '#F9A03F', Portrait: TwentySevenPortrait },
  two: { name: 'Two', color: '#3185FC', Portrait: TwoPortrait },
  hours: { name: 'The Hours', color: '#F9A03F', Portrait: HoursPortrait },
  zero: { name: 'Zero', color: '#4ECDC4', Portrait: ZeroPortrait },
  primo: { name: 'Primo', color: '#4ECDC4', Portrait: PrimoPortrait },
  devil: { name: 'The Number Devil', color: '#E84855', Portrait: DevilPortrait },
  narrator: { name: '', color: '#9B59B6', Portrait: () => null },
};
