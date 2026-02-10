import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type RulesTab = 'basics' | 'dice' | 'squares' | 'minigames';

const TABS: { id: RulesTab; label: string }[] = [
  { id: 'basics', label: 'How to Play' },
  { id: 'dice', label: 'Dice Types' },
  { id: 'squares', label: 'Special Squares' },
  { id: 'minigames', label: 'Minigames' },
];

export function RulesModal({ isOpen, onClose }: RulesModalProps) {
  const [activeTab, setActiveTab] = useState<RulesTab>('basics');

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/50 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="fixed inset-4 sm:inset-8 md:inset-16 lg:inset-24 rounded-3xl z-50 flex flex-col overflow-hidden"
            style={{
              background: 'rgba(15, 10, 31, 0.95)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 0 60px rgba(198, 120, 221, 0.3), 0 8px 32px rgba(0, 0, 0, 0.5)',
            }}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, #c678dd 0%, #ff6b9d 100%)',
                    boxShadow: '0 0 20px rgba(198, 120, 221, 0.5)',
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-white">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <h2 className="font-display text-2xl font-black text-gradient-rainbow">
                  Number Friends Rules
                </h2>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110"
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: 'rgba(255, 255, 255, 0.6)',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Tabs */}
            <div
              className="flex gap-1 px-4 py-3 overflow-x-auto"
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="px-4 py-2 rounded-lg font-display font-semibold text-sm whitespace-nowrap transition-all"
                  style={{
                    background: activeTab === tab.id
                      ? 'rgba(97, 218, 251, 0.2)'
                      : 'transparent',
                    color: activeTab === tab.id
                      ? '#61dafb'
                      : 'rgba(255, 255, 255, 0.5)',
                    boxShadow: activeTab === tab.id
                      ? '0 0 15px rgba(97, 218, 251, 0.3)'
                      : 'none',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {activeTab === 'basics' && <BasicsContent />}
                  {activeTab === 'dice' && <DiceContent />}
                  {activeTab === 'squares' && <SquaresContent />}
                  {activeTab === 'minigames' && <MinigamesContent />}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function BasicsContent() {
  return (
    <div className="space-y-8 max-w-2xl">
      <Section title="Objective">
        <p className="text-[var(--color-text-secondary)] leading-relaxed">
          Number Friends is a mathematical board game where players race from square 1 to square 100.
          The game combines chance (dice rolling) with mathematical knowledge through various minigames
          triggered by landing on special number squares.
        </p>
        <p className="text-[var(--color-text-secondary)] leading-relaxed mt-3">
          The first player to reach square 100 and successfully complete the <strong className="text-[#ff6b9d]">Final Showdown</strong> challenge wins the game.
        </p>
      </Section>

      <Section title="Turn Structure">
        <div className="space-y-4">
          <StepItem number={1} title="Spin the Dice Wheel">
            At the start of your turn, spin the wheel to randomly select which type of die you'll roll.
            You cannot choose your die—fate decides!
          </StepItem>
          <StepItem number={2} title="Roll Your Die">
            Tap the die to roll it. Each die type has different possible outcomes, affecting your movement range.
          </StepItem>
          <StepItem number={3} title="Move Forward">
            After rolling, move your token forward by the number shown on the die.
            If your roll would take you past square 100, you stay in place instead.
          </StepItem>
          <StepItem number={4} title="Resolve Special Squares">
            If you land on a mathematically special number (prime, perfect square, Fibonacci, etc.),
            a minigame automatically triggers. All players participate in competitive minigames.
          </StepItem>
          <StepItem number={5} title="End Your Turn">
            After resolving any minigame, tap "End Turn" to pass play to the next player.
          </StepItem>
        </div>
      </Section>

      <Section title="Winning the Game">
        <p className="text-[var(--color-text-secondary)] leading-relaxed">
          When a player lands exactly on square 100, they face the <strong className="text-[#ffd93d]">Final Showdown</strong>—a challenging
          mathematical test. If they succeed, they win the game immediately. If they fail, they're moved back
          5 squares and must try again on a future turn.
        </p>
        <div
          className="mt-4 p-4 rounded-xl"
          style={{
            background: 'rgba(255, 217, 61, 0.1)',
            border: '1px solid rgba(255, 217, 61, 0.3)',
          }}
        >
          <p className="text-[#ffd93d] font-medium">
            Important: You must land exactly on 100. If your roll would take you past 100, you stay where you are.
          </p>
        </div>
      </Section>

      <Section title="Multiplayer">
        <p className="text-[var(--color-text-secondary)] leading-relaxed">
          Number Friends supports 2-4 players, including AI opponents at varying difficulty levels.
          Human players and AI players take turns in order. Most minigames are competitive,
          meaning all players participate simultaneously and the fastest or most accurate player wins.
        </p>
      </Section>
    </div>
  );
}

function DiceContent() {
  const dice = [
    {
      name: 'D4',
      range: '1, 2, 3, or 4',
      gradient: 'linear-gradient(135deg, #ff6b9d 0%, #c678dd 100%)',
      glow: 'rgba(255, 107, 157, 0.4)',
      desc: 'The safest option with lowest variance. Good for precise positioning when you need to land on specific squares.',
      strategy: 'Best when you need to move exactly 1-4 spaces to reach a target square.'
    },
    {
      name: 'D6',
      range: '1 through 6',
      gradient: 'linear-gradient(135deg, #61dafb 0%, #56d4c8 100%)',
      glow: 'rgba(97, 218, 251, 0.4)',
      desc: 'The classic six-sided die. Balanced between risk and reward, providing moderate movement.',
      strategy: 'A reliable all-around die with no major downsides.'
    },
    {
      name: 'D8',
      range: '1 through 8',
      gradient: 'linear-gradient(135deg, #98ec65 0%, #56d4c8 100%)',
      glow: 'rgba(152, 236, 101, 0.4)',
      desc: 'Eight-sided die offering greater range. Higher potential movement but more unpredictable outcomes.',
      strategy: 'Good for mid-game when you want to make progress without extreme variance.'
    },
    {
      name: 'D10',
      range: '1 through 10',
      gradient: 'linear-gradient(135deg, #ffd93d 0%, #ff9f43 100%)',
      glow: 'rgba(255, 217, 61, 0.4)',
      desc: 'Ten-sided die for those seeking high movement potential. Can dramatically change your position.',
      strategy: 'High risk, high reward. Great when behind, risky when you need precision.'
    },
    {
      name: 'Prime Die',
      range: '2, 3, 5, 7, 11, or 13',
      gradient: 'linear-gradient(135deg, #c678dd 0%, #61dafb 100%)',
      glow: 'rgba(198, 120, 221, 0.4)',
      desc: 'A special die showing only prime numbers. Minimum roll is 2, with potential for large leaps (11 or 13).',
      strategy: 'Guaranteed to move at least 2 spaces. Good odds for decent movement.'
    },
    {
      name: 'Gaussian Plinko',
      range: '1 through 12',
      gradient: 'linear-gradient(135deg, #ff6b9d 0%, #ffd93d 100%)',
      glow: 'rgba(255, 107, 157, 0.4)',
      desc: 'A unique Plinko-style die! Drop a ball through pegs and watch it bounce to determine your roll. Results follow a bell curve distribution, usually landing near the center.',
      strategy: 'Most likely to roll middle values (5-8), but extreme results are possible.'
    },
  ];

  return (
    <div className="space-y-6 max-w-2xl">
      <Section title="Understanding the Dice">
        <p className="text-[var(--color-text-secondary)] leading-relaxed mb-4">
          Unlike traditional board games, you don't choose which die to roll. The spinner wheel randomly
          selects your die each turn. This adds an element of chance that can create exciting moments
          and strategic opportunities.
        </p>
        <p className="text-[var(--color-text-secondary)] leading-relaxed">
          Each die has distinct characteristics that affect your movement. Learning how each die works
          will help you make the best decisions after you roll.
        </p>
      </Section>

      <Section title="Die Reference">
        <div className="space-y-4">
          {dice.map((die) => (
            <div
              key={die.name}
              className="p-4 rounded-xl"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-display font-bold flex-shrink-0"
                  style={{
                    background: die.gradient,
                    boxShadow: `0 0 20px ${die.glow}`,
                  }}
                >
                  {die.name}
                </div>
                <div className="flex-1">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="font-display font-bold text-[var(--color-text-primary)]">{die.name}</span>
                    <span className="text-sm text-[var(--color-text-muted)]">Range: {die.range}</span>
                  </div>
                  <p className="text-sm text-[var(--color-text-secondary)] mb-2">{die.desc}</p>
                  <p className="text-xs text-[var(--color-text-muted)] italic">{die.strategy}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

function SquaresContent() {
  const squares = [
    {
      type: 'Prime Numbers',
      examples: '2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97',
      color: '#61dafb',
      game: 'Prime-Off',
      description: 'Numbers divisible only by 1 and themselves. The building blocks of all integers.'
    },
    {
      type: 'Twin Primes',
      examples: '3, 5, 7, 11, 13, 17, 19, 29, 31, 41, 43, 59, 61, 71, 73',
      color: '#56d4c8',
      game: 'Prime-Off or Prime Blackjack (50/50)',
      description: 'Primes that are part of a pair differing by 2 (like 11 & 13). Extra special!'
    },
    {
      type: 'Perfect Squares',
      examples: '4, 9, 16, 25, 36, 49, 64, 81, 100',
      color: '#c678dd',
      game: 'Root Race',
      description: 'Numbers that are the square of an integer (n × n).'
    },
    {
      type: 'Perfect Cubes',
      examples: '8, 27, 64',
      color: '#ff9f43',
      game: 'Cube Root Challenge',
      description: 'Numbers that are the cube of an integer (n × n × n).'
    },
    {
      type: 'Multiples of 10',
      examples: '10, 20, 30, 40, 50, 60, 70, 80, 90, 100',
      color: '#ffd93d',
      game: 'Double Digits',
      description: 'Every tenth square. Landing here means a chance to teleport!'
    },
    {
      type: 'Fibonacci Numbers',
      examples: '1, 2, 3, 5, 8, 13, 21, 34, 55, 89',
      color: '#98ec65',
      game: 'Sequence Savant',
      description: 'Each number is the sum of the two before it. Found throughout nature!'
    },
    {
      type: 'Perfect Numbers',
      examples: '6, 28',
      color: '#ff6b9d',
      game: 'Factor Frenzy',
      description: 'Extremely rare! Numbers equal to the sum of their proper divisors.'
    },
    {
      type: 'Abundant Numbers',
      examples: '12, 18, 20, 24, 30, 36, 40, 42, 48, 54, 56, 60...',
      color: '#56d4c8',
      game: 'Number Builder',
      description: 'Numbers where the sum of proper divisors exceeds the number itself.'
    },
    {
      type: 'Square 100',
      examples: '100',
      color: '#ffd93d',
      game: 'Final Showdown',
      description: 'The finish line! Complete the ultimate challenge to win.'
    },
  ];

  return (
    <div className="space-y-6 max-w-2xl">
      <Section title="Mathematical Special Squares">
        <p className="text-[var(--color-text-secondary)] leading-relaxed mb-4">
          The board is filled with mathematically significant numbers. Landing on these special squares
          triggers minigames that test your mathematical skills. Some numbers belong to multiple categories—
          for example, 64 is both a perfect square (8²) and a perfect cube (4³).
        </p>
        <p className="text-[var(--color-text-secondary)] leading-relaxed">
          When a number belongs to multiple categories, the game uses a priority system to determine
          which minigame triggers. Perfect numbers have highest priority, followed by cubes, squares, etc.
        </p>
      </Section>

      <Section title="Square Types">
        <div className="space-y-3">
          {squares.map((sq) => (
            <div
              key={sq.type}
              className="p-4 rounded-xl"
              style={{
                background: `${sq.color}15`,
                border: `1px solid ${sq.color}40`,
              }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="font-display font-bold w-40 flex-shrink-0"
                  style={{ color: sq.color }}
                >
                  {sq.type}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-[var(--color-text-secondary)] mb-1">{sq.description}</p>
                  <p className="text-xs text-[var(--color-text-muted)] mb-2">{sq.examples}</p>
                  <p className="text-sm font-semibold text-[var(--color-text-primary)]">Triggers: {sq.game}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

function MinigamesContent() {
  const minigames = [
    {
      name: 'Prime-Off',
      trigger: 'Prime numbers, Twin primes',
      desc: 'A speed competition to find the matching prime! Two screens display different prime numbers, but one prime appears on both screens. All players race to tap the matching prime as fast as possible.',
      howTo: 'Carefully scan both screens and tap the prime number that appears on BOTH. Speed matters—fastest correct answer wins!',
      reward: 'Winner advances to the next prime number on the board.',
    },
    {
      name: 'Prime Blackjack',
      trigger: 'Twin primes (50% chance)',
      desc: 'A card game with a mathematical twist! Draw cards numbered 0-9 and try to build the highest sum that is also a prime number. But be careful—if your sum exceeds 100 or isn\'t prime, you bust!',
      howTo: 'Draw cards to build your sum. You can "Stand" when satisfied. Best prime sum under 100 wins.',
      reward: 'Winner advances to next prime. Busting sends you back to the previous twin prime!',
    },
    {
      name: 'Root Race',
      trigger: 'Perfect squares',
      desc: 'Test your mental math with square roots! A number appears and all players must estimate its square root. Answers can include decimals for non-perfect squares.',
      howTo: 'Enter your best guess for the square root. Closest answer wins, even if not exact.',
      reward: 'Winner advances 2-4 spaces based on number difficulty. Perfect answer = maximum reward.',
    },
    {
      name: 'Cube Root Challenge',
      trigger: 'Perfect cubes',
      desc: 'Similar to Root Race but for cube roots. Numbers with nice cube roots may appear, as well as challenging non-perfect cubes.',
      howTo: 'Estimate the cube root of the displayed number. Decimals allowed!',
      reward: 'Winner advances based on difficulty. Exact answers earn bonus movement.',
    },
    {
      name: 'Double Digits',
      trigger: 'Multiples of 10',
      desc: 'A risky teleportation game! Roll two 10-sided dice (0-9 each) to generate a new board position. Rolling 00 counts as 100!',
      howTo: 'Simply tap to roll. The two digits combine to form your new position.',
      reward: 'You teleport to the rolled position. Could be amazing (99!) or terrible (03).',
    },
    {
      name: 'Sequence Savant',
      trigger: 'Fibonacci numbers',
      desc: 'Identify the missing number in a mathematical sequence. Sequences include Fibonacci, arithmetic progressions, and other patterns.',
      howTo: 'Study the sequence, find the pattern, and enter the missing number quickly.',
      reward: 'Correct answer advances you based on speed. Fastest wins!',
    },
    {
      name: 'Factor Frenzy',
      trigger: 'Perfect numbers (6, 28)',
      desc: 'Race to identify all proper factors of a number! The game displays a number and players must find every factor that divides it evenly (excluding the number itself).',
      howTo: 'Tap on all the proper divisors of the target number before time runs out.',
      reward: 'Points based on factors found. Winner advances significantly.',
    },
    {
      name: 'Number Builder',
      trigger: 'Abundant numbers',
      desc: 'A puzzle game where you select numbers that add up to a target! Eight random numbers (1-12) are available, and your goal is to select the combination that exactly equals your current board position.',
      howTo: 'Tap numbers to select/deselect them. Try to hit the target exactly, or get as close as possible.',
      reward: 'Perfect match = 5 spaces. Close = 3 spaces. Winner = 1 space.',
    },
    {
      name: 'Final Showdown',
      trigger: 'Reaching square 100',
      desc: 'The ultimate test! A series of rapid-fire math challenges. You must prove your mathematical prowess to claim victory.',
      howTo: 'Answer math questions quickly and accurately. Get enough right to win!',
      reward: 'Success = You win the game! Failure = Move back 5 squares.',
    },
  ];

  return (
    <div className="space-y-6 max-w-2xl">
      <Section title="Competitive Minigames">
        <p className="text-[var(--color-text-secondary)] leading-relaxed mb-4">
          When a special square triggers a minigame, <strong className="text-[#ff6b9d]">all players participate simultaneously</strong>.
          This keeps everyone engaged regardless of whose turn it is. The player who triggered the minigame
          benefits from winning, but other players can spoil their advantage by outperforming them.
        </p>
        <p className="text-[var(--color-text-secondary)] leading-relaxed">
          Each minigame tests different mathematical skills—from quick recognition to careful calculation.
          Practice makes perfect!
        </p>
      </Section>

      <Section title="Minigame Reference">
        <div className="space-y-4">
          {minigames.map((game) => (
            <div
              key={game.name}
              className="p-5 rounded-xl"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <div className="flex items-start gap-3 mb-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{
                    background: 'linear-gradient(135deg, #c678dd 0%, #ff6b9d 100%)',
                    boxShadow: '0 0 15px rgba(198, 120, 221, 0.4)',
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-white">
                    <path d="M14.752 11.168l-6.586-3.763A1 1 0 007 8.236v7.528a1 1 0 001.166.831l6.586-3.764a1 1 0 000-1.663z" fill="currentColor" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-display font-bold text-[var(--color-text-primary)] text-lg">{game.name}</h3>
                  <p className="text-xs text-[var(--color-text-muted)]">Triggered by: {game.trigger}</p>
                </div>
              </div>
              <p className="text-sm text-[var(--color-text-secondary)] mb-3">{game.desc}</p>
              <div
                className="p-3 rounded-lg mb-3"
                style={{
                  background: 'rgba(97, 218, 251, 0.1)',
                  border: '1px solid rgba(97, 218, 251, 0.3)',
                }}
              >
                <p className="text-sm" style={{ color: '#61dafb' }}><strong>How to Play:</strong> {game.howTo}</p>
              </div>
              <div
                className="p-3 rounded-lg"
                style={{
                  background: 'rgba(255, 217, 61, 0.1)',
                  border: '1px solid rgba(255, 217, 61, 0.3)',
                }}
              >
                <p className="text-sm" style={{ color: '#ffd93d' }}><strong>Reward:</strong> {game.reward}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3
        className="font-display text-xl font-bold mb-4 pb-2"
        style={{
          color: '#61dafb',
          borderBottom: '1px solid rgba(97, 218, 251, 0.3)',
        }}
      >
        {title}
      </h3>
      <div>{children}</div>
    </div>
  );
}

function StepItem({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <div
        className="w-8 h-8 rounded-full font-display font-bold flex items-center justify-center flex-shrink-0"
        style={{
          background: 'linear-gradient(135deg, #c678dd 0%, #ff6b9d 100%)',
          boxShadow: '0 0 15px rgba(198, 120, 221, 0.4)',
          color: 'white',
        }}
      >
        {number}
      </div>
      <div>
        <h4 className="font-display font-bold text-[var(--color-text-primary)] mb-1">{title}</h4>
        <p className="text-sm text-[var(--color-text-secondary)]">{children}</p>
      </div>
    </div>
  );
}

// Hook to manage rules modal state
export function useRulesModal() {
  const [isOpen, setIsOpen] = useState(false);
  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
  };
}
