import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface TutorialPageProps {
  children: ReactNode;
  direction: number;
}

const pageVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 250 : -250,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -250 : 250,
    opacity: 0,
  }),
};

export function TutorialPage({ children, direction }: TutorialPageProps) {
  return (
    <motion.div
      custom={direction}
      variants={pageVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="w-full"
    >
      {children}
    </motion.div>
  );
}
