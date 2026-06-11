import { useEffect } from 'react';
import { motion } from 'framer-motion';

// Cinematic chapter title card — fades in over the scene, holds, dissolves.
// Scenes start in a 'title' phase and advance when this calls onDone.

export function ChapterTitle({ eyebrow, title, accent, onDone }: {
  eyebrow: string;
  title: string;
  accent: string;
  onDone: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onDone, 3100);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <motion.div
      className="absolute inset-0 z-40 flex flex-col items-center justify-center pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      style={{ background: 'radial-gradient(ellipse at center, rgba(5,4,16,0.25) 0%, rgba(5,4,16,0.78) 100%)' }}
    >
      <motion.div
        className="label-caps mb-3"
        style={{ color: accent, letterSpacing: '0.3em' }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.7 }}
      >
        {eyebrow}
      </motion.div>
      <motion.h1
        className="heading-1 text-center px-6"
        style={{ color: '#fff', textShadow: `0 0 32px ${accent}66, 0 2px 12px rgba(0,0,0,0.7)` }}
        initial={{ opacity: 0, y: 14, letterSpacing: '0.2em' }}
        animate={{ opacity: 1, y: 0, letterSpacing: '0.06em' }}
        transition={{ delay: 0.55, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      >
        {title}
      </motion.h1>
      <motion.div
        className="mt-4 h-[3px] rounded-full"
        style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }}
        initial={{ width: 0, opacity: 0 }}
        animate={{ width: 180, opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.8 }}
      />
    </motion.div>
  );
}
