import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RulesModal, useRulesModal } from '../UI/RulesModal';
import { TestMode } from './TestMode';
import { soundEngine } from '../../utils/soundEngine';
import { TutorialOverlay } from '../Tutorial/TutorialOverlay';

type GameMode = 'solo' | 'local';
type AIDifficulty = 'easy' | 'medium' | 'hard';

interface SetupScreenProps {
  onStartGame: (playerNames: string[], aiPlayers?: { name: string; difficulty: AIDifficulty }[]) => void;
}

// Warm, toybox-inspired player colors
const PLAYER_COLORS = ['#E84855', '#3185FC', '#5FAD56', '#F9A03F'];
const PLAYER_SHADOWS = ['#9B1B30', '#0D4F9E', '#3D7A35', '#C67A1F'];
const PLAYER_AVATARS = ['🎮', '🎪', '🎨', '🎭'];
const AI_NAMES = ['Digit', 'Calc', 'Mathy', 'Primo'];

// Small stroke-based icons (no emoji in chrome)
function RobotIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="6" width="18" height="14" rx="3" />
      <circle cx="9" cy="12" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="15" cy="12" r="1.5" fill="currentColor" stroke="none" />
      <path d="M9 16h6" />
      <path d="M12 6V3" />
      <circle cx="12" cy="2.5" r="0.5" fill="currentColor" />
    </svg>
  );
}

function PlayersIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c0-3.5 3-5.5 6.5-5.5s6.5 2 6.5 5.5" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M16.5 14.5c2.8 0 5 1.7 5 4.5" />
    </svg>
  );
}

function BookIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}

function FlaskIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 2v6L4.5 18a2 2 0 0 0 1.8 3h11.4a2 2 0 0 0 1.8-3L14 8V2" />
      <path d="M8.5 2h7" />
      <path d="M7 15h10" />
    </svg>
  );
}

export function SetupScreen({ onStartGame }: SetupScreenProps) {
  const [gameMode, setGameMode] = useState<GameMode | null>(null);
  const [playerCount, setPlayerCount] = useState(2);
  const rulesModal = useRulesModal();
  const [playerNames, setPlayerNames] = useState(['Player 1', 'Player 2', 'Player 3', 'Player 4']);
  const [aiCount, setAiCount] = useState(1);
  const [aiDifficulty, setAiDifficulty] = useState<AIDifficulty>('medium');
  const [playerName, setPlayerName] = useState('Explorer');
  const [showTestMode, setShowTestMode] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const tutorialComplete = localStorage.getItem('numberFriends_tutorialComplete') === 'true';

  // Play main theme on the title screen
  useEffect(() => {
    soundEngine.playMusic('main_theme');
    return () => {
      soundEngine.stopMusic();
    };
  }, []);

  const handleNameChange = (index: number, name: string) => {
    const newNames = [...playerNames];
    newNames[index] = name;
    setPlayerNames(newNames);
  };

  const handleStartLocal = () => {
    const names = playerNames.slice(0, playerCount).map((name, i) => name.trim() || `Player ${i + 1}`);
    onStartGame(names);
  };

  const handleStartSolo = () => {
    const aiPlayers = Array.from({ length: aiCount }, (_, i) => ({
      name: AI_NAMES[i],
      difficulty: aiDifficulty,
    }));
    onStartGame([playerName.trim() || 'Explorer'], aiPlayers);
  };

  if (showTestMode) {
    return <TestMode onExit={() => setShowTestMode(false)} />;
  }

  // Mode selection screen — title page of the game box
  if (gameMode === null) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center p-6 relative overflow-hidden">
        {/* The Main Title - Bold, Dimensional, Memorable */}
        <motion.div
          className="text-center mb-10 relative"
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <h1 className="relative" style={{ fontFamily: 'var(--font-title)' }}>
            <span
              className="relative block tracking-wide"
              style={{
                fontSize: 'clamp(3.5rem, 14vw, 7rem)',
                lineHeight: 1.05,
                color: 'var(--color-aurora-yellow)',
                textShadow: '2px 2px 0 #2a2a5a, 4px 4px 0 #1a1a3a, 6px 6px 0 #0a0a0f, 0 0 60px rgba(255, 230, 109, 0.4)',
              }}
            >
              Number
            </span>
            <span
              className="relative block tracking-wide"
              style={{
                fontSize: 'clamp(3.5rem, 14vw, 7rem)',
                lineHeight: 1.05,
                color: 'var(--color-aurora-cyan)',
                textShadow: '2px 2px 0 #1a3a3a, 4px 4px 0 #0a2a2a, 6px 6px 0 #0a0a0f, 0 0 60px rgba(78, 205, 196, 0.4)',
              }}
            >
              Friends
            </span>
          </h1>

          <motion.p
            className="mt-6 text-base sm:text-xl font-semibold uppercase"
            style={{
              fontFamily: 'var(--font-body)',
              color: 'rgba(255, 255, 255, 0.6)',
              letterSpacing: '0.25em',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            The Math Board Game
          </motion.p>
        </motion.div>

        {/* Game Mode Selection */}
        <motion.div
          className="w-full max-w-sm space-y-4"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <motion.button
            className="btn btn-pink btn-lg w-full"
            onClick={() => setGameMode('solo')}
            whileTap={{ scale: 0.98 }}
          >
            <RobotIcon />
            Play vs Computer
          </motion.button>

          <motion.button
            className="btn btn-blue btn-lg w-full"
            onClick={() => setGameMode('local')}
            whileTap={{ scale: 0.98 }}
          >
            <PlayersIcon />
            2-4 Players
          </motion.button>

          <motion.button
            className={`btn btn-ghost w-full ${!tutorialComplete ? 'tutorial-pulse-glow' : ''}`}
            style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}
            onClick={() => setShowTutorial(true)}
            whileTap={{ scale: 0.98 }}
          >
            <BookIcon />
            How to Play
          </motion.button>

          <motion.button
            className="w-full py-2 min-h-[44px] text-sm tracking-wide flex items-center justify-center gap-2 cursor-pointer bg-transparent border-none"
            style={{
              fontFamily: 'var(--font-body)',
              fontWeight: 600,
              color: 'rgba(255, 255, 255, 0.35)',
            }}
            onClick={() => setShowTestMode(true)}
            whileHover={{ color: 'rgba(255, 255, 255, 0.6)' }}
          >
            <FlaskIcon />
            Test Mode
          </motion.button>
        </motion.div>

        {/* Decorative footer element */}
        <motion.div
          className="absolute bottom-6 flex items-center gap-2"
          style={{ color: 'rgba(255, 255, 255, 0.2)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <div className="w-12 h-px bg-current" />
          <span className="label-caps" style={{ color: 'inherit' }}>
            For 1-4 Players
          </span>
          <div className="w-12 h-px bg-current" />
        </motion.div>

        <AnimatePresence>
          {showTutorial && (
            <TutorialOverlay
              onClose={() => setShowTutorial(false)}
              onOpenRules={() => { setShowTutorial(false); rulesModal.open(); }}
            />
          )}
        </AnimatePresence>
        <RulesModal isOpen={rulesModal.isOpen} onClose={rulesModal.close} />
      </div>
    );
  }

  // Solo mode setup
  if (gameMode === 'solo') {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center p-4 sm:p-6">
        <motion.div
          className="glass-card w-full max-w-md p-6 sm:p-8 max-h-[92dvh] overflow-y-auto"
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.4, type: 'spring', stiffness: 300, damping: 28 }}
        >
          <motion.button
            onClick={() => setGameMode(null)}
            className="flex items-center gap-2 mb-6 min-h-[44px] cursor-pointer bg-transparent border-none"
            style={{
              fontFamily: 'var(--font-body)',
              fontWeight: 600,
              color: 'rgba(255, 255, 255, 0.5)',
            }}
            whileHover={{ x: -4, color: 'rgba(255, 255, 255, 0.8)' }}
          >
            <span>←</span> Back
          </motion.button>

          <div className="text-center mb-8">
            <motion.div
              className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-3 text-white"
              style={{
                background: 'linear-gradient(135deg, var(--color-aurora-pink) 0%, #D62839 100%)',
                boxShadow: '0 6px 0 var(--color-aurora-pink-deep)',
              }}
            >
              <RobotIcon size={36} />
            </motion.div>
            <h2 className="heading-1 text-aurora-pink">
              Play vs Computer
            </h2>
          </div>

          {/* Your name */}
          <div className="mb-6">
            <label className="label-caps block mb-2">Your Name</label>
            <div className="flex items-center gap-3">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                style={{
                  backgroundColor: PLAYER_COLORS[0],
                  boxShadow: `0 4px 0 ${PLAYER_SHADOWS[0]}`,
                }}
              >
                {PLAYER_AVATARS[0]}
              </div>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="flex-1 text-lg min-w-0"
                placeholder="Your name"
              />
            </div>
          </div>

          {/* AI opponents count */}
          <div className="mb-6">
            <label className="label-caps block mb-2">AI Opponents</label>
            <div className="flex gap-2">
              {[1, 2, 3].map((count) => (
                <motion.button
                  key={count}
                  className="flex-1 py-3 min-h-[48px] rounded-xl text-lg cursor-pointer"
                  style={{
                    fontFamily: 'var(--font-display)',
                    letterSpacing: '0.04em',
                    background: aiCount === count
                      ? 'linear-gradient(135deg, var(--color-aurora-pink) 0%, #D62839 100%)'
                      : 'rgba(255, 255, 255, 0.08)',
                    boxShadow: aiCount === count ? '0 4px 0 var(--color-aurora-pink-deep)' : 'none',
                    border: aiCount === count ? 'none' : '2px solid rgba(255, 255, 255, 0.1)',
                    color: '#fff',
                  }}
                  onClick={() => setAiCount(count)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {count}
                </motion.button>
              ))}
            </div>
          </div>

          {/* AI Difficulty */}
          <div className="mb-6">
            <label className="label-caps block mb-2">Difficulty</label>
            <div className="flex gap-2">
              {([
                { value: 'easy', color: 'var(--color-aurora-green)', shadow: 'var(--color-aurora-green-deep)' },
                { value: 'medium', color: 'var(--color-aurora-orange)', shadow: 'var(--color-aurora-orange-deep)' },
                { value: 'hard', color: 'var(--color-aurora-pink)', shadow: 'var(--color-aurora-pink-deep)' },
              ] as const).map(({ value, color, shadow }) => (
                <motion.button
                  key={value}
                  className="flex-1 py-3 min-h-[48px] rounded-xl capitalize text-lg cursor-pointer"
                  style={{
                    fontFamily: 'var(--font-display)',
                    letterSpacing: '0.04em',
                    background: aiDifficulty === value ? color : 'rgba(255, 255, 255, 0.08)',
                    boxShadow: aiDifficulty === value ? `0 4px 0 ${shadow}` : 'none',
                    border: aiDifficulty === value ? 'none' : '2px solid rgba(255, 255, 255, 0.1)',
                    color: aiDifficulty === value ? '#fff' : 'rgba(255, 255, 255, 0.6)',
                  }}
                  onClick={() => setAiDifficulty(value)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {value}
                </motion.button>
              ))}
            </div>
          </div>

          {/* AI preview */}
          <div className="glass-inset mb-8 p-4">
            <div className="label-caps mb-3">Your Opponents</div>
            <div className="flex gap-2 flex-wrap">
              {Array.from({ length: aiCount }).map((_, i) => (
                <motion.div
                  key={i}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: i * 0.1, type: 'spring', stiffness: 350, damping: 22 }}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                    style={{ backgroundColor: PLAYER_COLORS[i + 1] }}
                  >
                    <RobotIcon size={16} />
                  </div>
                  <span style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.04em', color: '#fff' }}>
                    {AI_NAMES[i]}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>

          <motion.button
            className="btn btn-green btn-lg w-full"
            onClick={handleStartSolo}
            whileTap={{ scale: 0.98 }}
          >
            Start Game!
          </motion.button>
        </motion.div>
      </div>
    );
  }

  // Local multiplayer setup
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center p-4 sm:p-6">
      <motion.div
        className="glass-card w-full max-w-md p-6 sm:p-8 max-h-[92dvh] overflow-y-auto"
        initial={{ x: 50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.4, type: 'spring', stiffness: 300, damping: 28 }}
      >
        <motion.button
          onClick={() => setGameMode(null)}
          className="flex items-center gap-2 mb-6 min-h-[44px] cursor-pointer bg-transparent border-none"
          style={{
            fontFamily: 'var(--font-body)',
            fontWeight: 600,
            color: 'rgba(255, 255, 255, 0.5)',
          }}
          whileHover={{ x: -4, color: 'rgba(255, 255, 255, 0.8)' }}
        >
          <span>←</span> Back
        </motion.button>

        <div className="text-center mb-8">
          <motion.div
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-3 text-white"
            style={{
              background: 'linear-gradient(135deg, var(--color-aurora-blue) 0%, #1A6FE8 100%)',
              boxShadow: '0 6px 0 var(--color-aurora-blue-deep)',
            }}
          >
            <PlayersIcon size={36} />
          </motion.div>
          <h2 className="heading-1 text-aurora-blue">
            Local Multiplayer
          </h2>
        </div>

        {/* Player count */}
        <div className="mb-6">
          <label className="label-caps block mb-2">Number of Players</label>
          <div className="flex gap-2">
            {[2, 3, 4].map((count) => (
              <motion.button
                key={count}
                className="flex-1 py-3 min-h-[48px] rounded-xl text-lg cursor-pointer"
                style={{
                  fontFamily: 'var(--font-display)',
                  letterSpacing: '0.04em',
                  background: playerCount === count
                    ? 'linear-gradient(135deg, var(--color-aurora-blue) 0%, #1A6FE8 100%)'
                    : 'rgba(255, 255, 255, 0.08)',
                  boxShadow: playerCount === count ? '0 4px 0 var(--color-aurora-blue-deep)' : 'none',
                  border: playerCount === count ? 'none' : '2px solid rgba(255, 255, 255, 0.1)',
                  color: '#fff',
                }}
                onClick={() => setPlayerCount(count)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {count}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Player name inputs */}
        <div className="space-y-3 mb-8">
          {Array.from({ length: playerCount }).map((_, index) => (
            <motion.div
              key={index}
              className="flex items-center gap-3"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                style={{
                  backgroundColor: PLAYER_COLORS[index],
                  boxShadow: `0 4px 0 ${PLAYER_SHADOWS[index]}`,
                }}
              >
                {PLAYER_AVATARS[index]}
              </div>
              <input
                type="text"
                value={playerNames[index]}
                onChange={(e) => handleNameChange(index, e.target.value)}
                className="flex-1 text-lg min-w-0"
                placeholder={`Player ${index + 1}`}
              />
            </motion.div>
          ))}
        </div>

        <motion.button
          className="btn btn-green btn-lg w-full"
          onClick={handleStartLocal}
          whileTap={{ scale: 0.98 }}
        >
          Start Game!
        </motion.button>
      </motion.div>
    </div>
  );
}
