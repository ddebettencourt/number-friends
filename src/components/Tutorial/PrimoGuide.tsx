import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

type PrimoMood = 'happy' | 'excited' | 'thinking' | 'celebrating';

interface PrimoGuideProps {
  message: string;
  mood?: PrimoMood;
  color?: string;
}

function useTypewriter(text: string, speed: number = 30) {
  const [displayText, setDisplayText] = useState('');
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    setDisplayText('');
    setIsTyping(true);
    let i = 0;

    const interval = setInterval(() => {
      if (i < text.length) {
        setDisplayText(text.slice(0, i + 1));
        i++;
      } else {
        setIsTyping(false);
        clearInterval(interval);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  return { displayText, isTyping };
}

const moodAnimations: Record<PrimoMood, Record<string, number[]>> = {
  happy: {
    y: [0, -6, 0],
    rotate: [0, 0, 0],
  },
  excited: {
    y: [0, -10, 0],
    rotate: [-3, 3, -3],
  },
  thinking: {
    y: [0, -4, 0],
    rotate: [0, 8, 0],
  },
  celebrating: {
    y: [0, -14, 0],
    rotate: [-5, 5, -5],
    scale: [1, 1.1, 1],
  },
};

export function PrimoGuide({ message, mood = 'happy', color = '#4ECDC4' }: PrimoGuideProps) {
  const { displayText, isTyping } = useTypewriter(message, 25);

  return (
    <div className="flex items-end gap-3">
      {/* Primo character */}
      <motion.div
        className="relative flex-shrink-0"
        animate={moodAnimations[mood]}
        transition={{
          duration: mood === 'excited' ? 1.2 : 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <svg width="64" height="80" viewBox="0 0 64 80" fill="none">
          {/* Graduation cap */}
          <motion.g
            animate={{ rotate: mood === 'celebrating' ? [0, -10, 10, 0] : 0 }}
            transition={{ duration: 0.6, repeat: mood === 'celebrating' ? Infinity : 0 }}
            style={{ transformOrigin: '32px 16px' }}
          >
            <polygon points="32,4 52,16 32,20 12,16" fill="#2a2a5a" />
            <rect x="28" y="16" width="8" height="6" fill="#2a2a5a" />
            <line x1="48" y1="14" x2="52" y2="8" stroke="#FFE66D" strokeWidth="2" />
            <circle cx="52" cy="7" r="3" fill="#FFE66D" />
          </motion.g>

          {/* Body - glowing circle */}
          <circle cx="32" cy="48" r="24" fill={color} />
          <circle cx="32" cy="48" r="24" fill="url(#primo-shine)" />
          <circle cx="32" cy="48" r="22" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />

          {/* Eyes */}
          <motion.g
            animate={mood === 'thinking' ? { scaleY: [1, 0.3, 1] } : {}}
            transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
          >
            <ellipse cx="24" cy="44" rx="4" ry="4.5" fill="white" />
            <ellipse cx="40" cy="44" rx="4" ry="4.5" fill="white" />
            <circle cx="25" cy="43" r="2.5" fill="#1a1a3e" />
            <circle cx="41" cy="43" r="2.5" fill="#1a1a3e" />
            {/* Eye shine */}
            <circle cx="26" cy="42" r="1" fill="white" />
            <circle cx="42" cy="42" r="1" fill="white" />
          </motion.g>

          {/* Smile */}
          <path
            d={mood === 'excited' || mood === 'celebrating'
              ? 'M22 54 Q32 66 42 54'
              : 'M24 54 Q32 62 40 54'}
            stroke="#1a1a3e"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />

          {/* Blush */}
          <circle cx="18" cy="52" r="4" fill={color} opacity="0.5" />
          <circle cx="46" cy="52" r="4" fill={color} opacity="0.5" />

          {/* Glow */}
          <defs>
            <radialGradient id="primo-shine" cx="0.35" cy="0.35" r="0.65">
              <stop offset="0%" stopColor="rgba(255,255,255,0.3)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </radialGradient>
          </defs>
        </svg>

        {/* Glow effect under Primo */}
        <div
          className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-12 h-3 rounded-full blur-md opacity-50"
          style={{ backgroundColor: color }}
        />
      </motion.div>

      {/* Speech bubble */}
      <motion.div
        className="tutorial-speech-bubble flex-1 max-w-md"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <p className="text-white/90 text-sm sm:text-base leading-relaxed" style={{ fontFamily: 'var(--font-body)' }}>
          {displayText}
          {isTyping && <span className="tutorial-cursor" />}
        </p>
      </motion.div>
    </div>
  );
}
