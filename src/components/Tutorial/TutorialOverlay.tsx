import { useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { PrimoGuide } from './PrimoGuide';
import { TutorialPage } from './TutorialPage';
import { WelcomePage } from './pages/WelcomePage';
import { BoardPage } from './pages/BoardPage';
import { YourTurnPage } from './pages/YourTurnPage';
import { SpecialSquaresPage } from './pages/SpecialSquaresPage';
import { PrimeGamesPage } from './pages/PrimeGamesPage';
import { DigitsAndRootsPage } from './pages/DigitsAndRootsPage';
import { SequenceAndFactorsPage } from './pages/SequenceAndFactorsPage';
import { BuilderAndCubePage } from './pages/BuilderAndCubePage';
import { CatchUpBouncePage } from './pages/CatchUpBouncePage';
import { FinalShowdownPage } from './pages/FinalShowdownPage';
import { soundEngine } from '../../utils/soundEngine';

type PrimoMood = 'happy' | 'excited' | 'thinking' | 'celebrating';

interface PageConfig {
  component: React.ComponentType;
  primoMessage: string;
  primoMood: PrimoMood;
  primoColor: string;
}

const PAGES: PageConfig[] = [
  {
    component: WelcomePage,
    primoMessage: "Welcome to Number Friends. The goal is simple: be the first to reach square 100. Along the way you'll spin dice, solve challenges, and outplay your opponents.",
    primoMood: 'happy',
    primoColor: '#4ECDC4',
  },
  {
    component: BoardPage,
    primoMessage: "Here's the board — 100 squares in a snaking path. Certain squares are color-coded by their number properties. Land on one and you'll trigger a minigame.",
    primoMood: 'happy',
    primoColor: '#5FAD56',
  },
  {
    component: YourTurnPage,
    primoMessage: "Each turn: spin the wheel for a random die type, roll it, and move forward. Simple enough. The real strategy kicks in when you hit a special square...",
    primoMood: 'happy',
    primoColor: '#3185FC',
  },
  {
    component: SpecialSquaresPage,
    primoMessage: "There are 7 types of special squares, each tied to a different minigame. Win to advance, lose and you might slide back. Tap any type below for details.",
    primoMood: 'thinking',
    primoColor: '#a855f7',
  },
  {
    component: PrimeGamesPage,
    primoMessage: "Land on a prime for Prime-Off — spot the shared prime between two grids before your opponent. Twin primes can also trigger Prime Blackjack: draw digit cards to build the highest prime sum under 100.",
    primoMood: 'happy',
    primoColor: '#61DAFB',
  },
  {
    component: DigitsAndRootsPage,
    primoMessage: "Multiples of 10 trigger Double Digits — roll two D10s and teleport to that number. High risk, high reward. Perfect squares start Root Race — solve the root to advance.",
    primoMood: 'thinking',
    primoColor: '#eab308',
  },
  {
    component: SequenceAndFactorsPage,
    primoMessage: "Perfect numbers trigger Factor Frenzy — race to find all the factors before time runs out. Each correct factor earns you a bonus space.",
    primoMood: 'happy',
    primoColor: '#FF6B9D',
  },
  {
    component: BuilderAndCubePage,
    primoMessage: "Abundant numbers start Number Builder — combine four numbers with basic operations to hit a target. Perfect cubes give you Cube Root — same concept, but cubed.",
    primoMood: 'thinking',
    primoColor: '#FF9F43',
  },
  {
    component: CatchUpBouncePage,
    primoMessage: "Roll past 100 and you bounce back the extra amount — you have to land exactly on it. Precision matters near the finish line.",
    primoMood: 'happy',
    primoColor: '#F9A03F',
  },
  {
    component: FinalShowdownPage,
    primoMessage: "Reach square 100 and it's the Final Showdown. Solve one last challenge to claim victory. Fail, and you're knocked back 5 spaces. Good luck.",
    primoMood: 'celebrating',
    primoColor: '#FFE66D',
  },
];

interface TutorialOverlayProps {
  onClose: () => void;
  onOpenRules?: () => void;
}

export function TutorialOverlay({ onClose, onOpenRules }: TutorialOverlayProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [direction, setDirection] = useState(1);

  const goNext = useCallback(() => {
    if (currentPage < PAGES.length - 1) {
      soundEngine.buttonClick();
      setDirection(1);
      setCurrentPage(p => p + 1);
    }
  }, [currentPage]);

  const goBack = useCallback(() => {
    if (currentPage > 0) {
      soundEngine.buttonClick();
      setDirection(-1);
      setCurrentPage(p => p - 1);
    }
  }, [currentPage]);

  const handleFinish = useCallback(() => {
    soundEngine.minigameWin();
    localStorage.setItem('numberFriends_tutorialComplete', 'true');
    onClose();
  }, [onClose]);

  const handleSkip = useCallback(() => {
    soundEngine.buttonClick();
    onClose();
  }, [onClose]);

  const page = PAGES[currentPage];
  const PageComponent = page.component;
  const isLastPage = currentPage === PAGES.length - 1;

  return (
    <motion.div
      className="fixed inset-0 z-50 tutorial-backdrop flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Skip button */}
      <div className="absolute top-4 right-4 z-10">
        <motion.button
          className="text-white/40 hover:text-white/80 text-sm px-3 py-1 rounded-lg transition-colors"
          style={{ fontFamily: 'var(--font-body)' }}
          onClick={handleSkip}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Skip
        </motion.button>
      </div>

      {/* Progress dots */}
      <div className="flex justify-center gap-2 pt-6 pb-4">
        {PAGES.map((_, i) => (
          <motion.div
            key={i}
            className="rounded-full"
            style={{
              width: i === currentPage ? 24 : 8,
              height: 8,
              backgroundColor: i === currentPage ? page.primoColor : 'rgba(255,255,255,0.2)',
            }}
            animate={{
              width: i === currentPage ? 24 : 8,
              backgroundColor: i === currentPage ? page.primoColor : 'rgba(255,255,255,0.2)',
            }}
            transition={{ duration: 0.3 }}
          />
        ))}
      </div>

      {/* Page content area */}
      <div className="flex-1 overflow-hidden flex items-center justify-center px-4">
        <div className="w-full max-w-lg">
          <AnimatePresence mode="wait" custom={direction}>
            <TutorialPage key={currentPage} direction={direction}>
              <PageComponent />
            </TutorialPage>
          </AnimatePresence>
        </div>
      </div>

      {/* Primo + speech bubble */}
      <div className="px-4 pb-3">
        <div className="max-w-lg mx-auto">
          <PrimoGuide
            key={currentPage}
            message={page.primoMessage}
            mood={page.primoMood}
            color={page.primoColor}
          />
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between px-6 pb-6 pt-2">
        <div className="w-24">
          {currentPage > 0 && (
            <motion.button
              className="text-white/60 hover:text-white text-sm flex items-center gap-1 px-4 py-2 rounded-xl"
              style={{ fontFamily: 'var(--font-body)' }}
              onClick={goBack}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              whileHover={{ x: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="text-lg">&larr;</span> Back
            </motion.button>
          )}
        </div>

        <div className="text-white/30 text-xs" style={{ fontFamily: 'var(--font-body)' }}>
          {currentPage + 1} / {PAGES.length}
        </div>

        <div className="w-24 flex justify-end">
          {isLastPage ? (
            <div className="flex flex-col items-end gap-1">
              <motion.button
                className="text-white font-bold px-6 py-2.5 rounded-xl"
                style={{
                  fontFamily: 'var(--font-display)',
                  background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                  boxShadow: '0 4px 0 #15803d, 0 6px 20px rgba(34,197,94,0.3)',
                }}
                onClick={handleFinish}
                whileHover={{ y: -2, boxShadow: '0 6px 0 #15803d, 0 8px 24px rgba(34,197,94,0.4)' }}
                whileTap={{ y: 2, boxShadow: '0 2px 0 #15803d' }}
              >
                Let's Play!
              </motion.button>
              {onOpenRules && (
                <button
                  className="text-white/30 hover:text-white/60 text-xs underline transition-colors"
                  style={{ fontFamily: 'var(--font-body)' }}
                  onClick={onOpenRules}
                >
                  View Full Rules
                </button>
              )}
            </div>
          ) : (
            <motion.button
              className="text-white font-bold px-6 py-2.5 rounded-xl"
              style={{
                fontFamily: 'var(--font-display)',
                background: 'linear-gradient(135deg, #3185FC, #2563eb)',
                boxShadow: '0 4px 0 #1d4ed8, 0 6px 20px rgba(49,133,252,0.3)',
              }}
              onClick={goNext}
              whileHover={{ y: -2, boxShadow: '0 6px 0 #1d4ed8, 0 8px 24px rgba(49,133,252,0.4)' }}
              whileTap={{ y: 2, boxShadow: '0 2px 0 #1d4ed8' }}
            >
              Next &rarr;
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
