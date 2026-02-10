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
const PLAYER_AVATARS = ['🎮', '🎪', '🎨', '🎭'];
const AI_NAMES = ['Digit', 'Calc', 'Mathy', 'Primo'];

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

  // Mode selection screen - Vintage Board Game Box aesthetic
  if (gameMode === null) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)',
        }}
      >
        {/* Subtle paper texture overlay */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />

        {/* The Main Title - Bold, Dimensional, Memorable */}
        <motion.div
          className="text-center mb-10 relative"
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Main Title with dimensional shadow effect */}
          <h1
            className="relative"
            style={{ fontFamily: "'Lilita One', 'Bangers', sans-serif" }}
          >
            {/* Title text with CSS text-shadow for 3D effect */}
            <span
              className="relative block text-7xl sm:text-8xl md:text-9xl tracking-wide"
              style={{
                color: '#FFE66D',
                textShadow: '2px 2px 0 #2a2a5a, 4px 4px 0 #1a1a3a, 6px 6px 0 #0a0a0f, 0 0 60px rgba(255, 230, 109, 0.4)',
              }}
            >
              Number
            </span>
            <span
              className="relative block text-7xl sm:text-8xl md:text-9xl tracking-wide"
              style={{
                color: '#4ECDC4',
                textShadow: '2px 2px 0 #1a3a3a, 4px 4px 0 #0a2a2a, 6px 6px 0 #0a0a0f, 0 0 60px rgba(78, 205, 196, 0.4)',
              }}
            >
              Friends
            </span>
          </h1>

          {/* Tagline - clean and understated */}
          <motion.p
            className="mt-6 text-lg sm:text-xl tracking-widest uppercase font-semibold"
            style={{
              fontFamily: "'Quicksand', sans-serif",
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

        {/* Game Mode Selection - clean, tactile buttons */}
        <motion.div
          className="w-full max-w-sm space-y-4"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          {/* Solo Play Button */}
          <motion.button
            className="w-full py-5 rounded-2xl text-xl tracking-wide flex items-center justify-center gap-4 relative overflow-hidden"
            style={{
              fontFamily: "'Bangers', sans-serif",
              background: 'linear-gradient(135deg, #E84855 0%, #D62839 100%)',
              boxShadow: '0 6px 0 #9B1B30, 0 8px 20px rgba(232, 72, 85, 0.3)',
              color: '#fff',
              letterSpacing: '0.05em',
            }}
            onClick={() => setGameMode('solo')}
            whileHover={{ y: -2, boxShadow: '0 8px 0 #9B1B30, 0 12px 30px rgba(232, 72, 85, 0.4)' }}
            whileTap={{ y: 4, boxShadow: '0 2px 0 #9B1B30, 0 4px 10px rgba(232, 72, 85, 0.3)' }}
          >
            <span className="text-2xl">🤖</span>
            Play vs Computer
          </motion.button>

          {/* Multiplayer Button */}
          <motion.button
            className="w-full py-5 rounded-2xl text-xl tracking-wide flex items-center justify-center gap-4 relative overflow-hidden"
            style={{
              fontFamily: "'Bangers', sans-serif",
              background: 'linear-gradient(135deg, #3185FC 0%, #1A6FE8 100%)',
              boxShadow: '0 6px 0 #0D4F9E, 0 8px 20px rgba(49, 133, 252, 0.3)',
              color: '#fff',
              letterSpacing: '0.05em',
            }}
            onClick={() => setGameMode('local')}
            whileHover={{ y: -2, boxShadow: '0 8px 0 #0D4F9E, 0 12px 30px rgba(49, 133, 252, 0.4)' }}
            whileTap={{ y: 4, boxShadow: '0 2px 0 #0D4F9E, 0 4px 10px rgba(49, 133, 252, 0.3)' }}
          >
            <span className="text-2xl">👥</span>
            2-4 Players
          </motion.button>

          {/* How to Play - opens interactive tutorial */}
          <motion.button
            className={`w-full py-4 rounded-xl text-lg tracking-wide flex items-center justify-center gap-3 ${!tutorialComplete ? 'tutorial-pulse-glow' : ''}`}
            style={{
              fontFamily: "'Quicksand', sans-serif",
              fontWeight: 600,
              background: 'rgba(255, 255, 255, 0.08)',
              border: '2px solid rgba(255, 255, 255, 0.15)',
              color: 'rgba(255, 255, 255, 0.7)',
            }}
            onClick={() => setShowTutorial(true)}
            whileHover={{
              background: 'rgba(255, 255, 255, 0.12)',
              borderColor: 'rgba(255, 255, 255, 0.25)',
              color: 'rgba(255, 255, 255, 0.9)',
            }}
            whileTap={{ scale: 0.98 }}
          >
            <span>📖</span>
            How to Play
          </motion.button>

          {/* Test Mode - minimal */}
          <motion.button
            className="w-full py-2 text-sm tracking-wide flex items-center justify-center gap-2"
            style={{
              fontFamily: "'Quicksand', sans-serif",
              color: 'rgba(255, 255, 255, 0.35)',
            }}
            onClick={() => setShowTestMode(true)}
            whileHover={{ color: 'rgba(255, 255, 255, 0.6)' }}
          >
            <span>🧪</span>
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
          <span style={{ fontFamily: "'Quicksand', sans-serif", fontSize: '0.75rem', letterSpacing: '0.2em' }}>
            FOR 1-4 PLAYERS
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
      <div
        className="min-h-screen flex flex-col items-center justify-center p-6"
        style={{
          background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)',
        }}
      >
        <motion.div
          className="w-full max-w-md p-8 rounded-3xl"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '2px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)',
          }}
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.4, type: "spring" }}
        >
          <motion.button
            onClick={() => setGameMode(null)}
            className="flex items-center gap-2 mb-6"
            style={{
              fontFamily: "'Quicksand', sans-serif",
              fontWeight: 600,
              color: 'rgba(255, 255, 255, 0.5)',
            }}
            whileHover={{ x: -4, color: 'rgba(255, 255, 255, 0.8)' }}
          >
            <span>←</span> Back
          </motion.button>

          <div className="text-center mb-8">
            <motion.div
              className="inline-flex items-center justify-center w-20 h-20 rounded-2xl text-4xl mb-3"
              style={{
                background: 'linear-gradient(135deg, #E84855 0%, #D62839 100%)',
                boxShadow: '0 6px 0 #9B1B30',
              }}
            >
              🤖
            </motion.div>
            <h2
              className="text-3xl"
              style={{
                fontFamily: "'Bangers', sans-serif",
                color: '#E84855',
                letterSpacing: '0.02em',
              }}
            >
              Play vs Computer
            </h2>
          </div>

          {/* Your name */}
          <div className="mb-6">
            <label
              className="block mb-2 text-sm uppercase tracking-widest"
              style={{
                fontFamily: "'Quicksand', sans-serif",
                fontWeight: 600,
                color: 'rgba(255, 255, 255, 0.5)',
              }}
            >
              Your Name
            </label>
            <div className="flex items-center gap-3">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl"
                style={{
                  backgroundColor: PLAYER_COLORS[0],
                  boxShadow: '0 4px 0 #9B1B30',
                }}
              >
                {PLAYER_AVATARS[0]}
              </div>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="flex-1 px-4 py-3 rounded-xl text-lg"
                style={{
                  fontFamily: "'Quicksand', sans-serif",
                  fontWeight: 600,
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '2px solid rgba(255, 255, 255, 0.15)',
                  color: '#fff',
                }}
                placeholder="Your name"
              />
            </div>
          </div>

          {/* AI opponents count */}
          <div className="mb-6">
            <label
              className="block mb-2 text-sm uppercase tracking-widest"
              style={{
                fontFamily: "'Quicksand', sans-serif",
                fontWeight: 600,
                color: 'rgba(255, 255, 255, 0.5)',
              }}
            >
              AI Opponents
            </label>
            <div className="flex gap-2">
              {[1, 2, 3].map((count) => (
                <motion.button
                  key={count}
                  className="flex-1 py-3 rounded-xl text-lg"
                  style={{
                    fontFamily: "'Bangers', sans-serif",
                    background: aiCount === count
                      ? 'linear-gradient(135deg, #E84855 0%, #D62839 100%)'
                      : 'rgba(255, 255, 255, 0.08)',
                    boxShadow: aiCount === count ? '0 4px 0 #9B1B30' : 'none',
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
            <label
              className="block mb-2 text-sm uppercase tracking-widest"
              style={{
                fontFamily: "'Quicksand', sans-serif",
                fontWeight: 600,
                color: 'rgba(255, 255, 255, 0.5)',
              }}
            >
              Difficulty
            </label>
            <div className="flex gap-2">
              {([
                { value: 'easy', color: '#5FAD56', shadow: '#3D7A35' },
                { value: 'medium', color: '#F9A03F', shadow: '#C67A1F' },
                { value: 'hard', color: '#E84855', shadow: '#9B1B30' },
              ] as const).map(({ value, color, shadow }) => (
                <motion.button
                  key={value}
                  className="flex-1 py-3 rounded-xl capitalize text-lg"
                  style={{
                    fontFamily: "'Bangers', sans-serif",
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
          <div
            className="mb-8 p-4 rounded-xl"
            style={{
              background: 'rgba(0, 0, 0, 0.2)',
              border: '2px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <div
              className="text-xs mb-3 uppercase tracking-widest"
              style={{
                fontFamily: "'Quicksand', sans-serif",
                fontWeight: 600,
                color: 'rgba(255, 255, 255, 0.4)',
              }}
            >
              Your Opponents
            </div>
            <div className="flex gap-2 flex-wrap">
              {Array.from({ length: aiCount }).map((_, i) => (
                <motion.div
                  key={i}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                  initial={{ scale: 0, rotate: -10 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: PLAYER_COLORS[i + 1] }}
                  >
                    🤖
                  </div>
                  <span
                    style={{
                      fontFamily: "'Bangers', sans-serif",
                      color: '#fff',
                    }}
                  >
                    {AI_NAMES[i]}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>

          <motion.button
            className="w-full py-5 rounded-2xl text-xl"
            style={{
              fontFamily: "'Bangers', sans-serif",
              background: 'linear-gradient(135deg, #5FAD56 0%, #4A9A44 100%)',
              boxShadow: '0 6px 0 #3D7A35, 0 8px 20px rgba(95, 173, 86, 0.3)',
              color: '#fff',
              letterSpacing: '0.05em',
            }}
            onClick={handleStartSolo}
            whileHover={{ y: -2, boxShadow: '0 8px 0 #3D7A35, 0 12px 30px rgba(95, 173, 86, 0.4)' }}
            whileTap={{ y: 4, boxShadow: '0 2px 0 #3D7A35' }}
          >
            Start Game!
          </motion.button>
        </motion.div>
      </div>
    );
  }

  // Local multiplayer setup
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{
        background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)',
      }}
    >
      <motion.div
        className="w-full max-w-md p-8 rounded-3xl"
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          border: '2px solid rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
        }}
        initial={{ x: 50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.4, type: "spring" }}
      >
        <motion.button
          onClick={() => setGameMode(null)}
          className="flex items-center gap-2 mb-6"
          style={{
            fontFamily: "'Quicksand', sans-serif",
            fontWeight: 600,
            color: 'rgba(255, 255, 255, 0.5)',
          }}
          whileHover={{ x: -4, color: 'rgba(255, 255, 255, 0.8)' }}
        >
          <span>←</span> Back
        </motion.button>

        <div className="text-center mb-8">
          <motion.div
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl text-4xl mb-3"
            style={{
              background: 'linear-gradient(135deg, #3185FC 0%, #1A6FE8 100%)',
              boxShadow: '0 6px 0 #0D4F9E',
            }}
          >
            👥
          </motion.div>
          <h2
            className="text-3xl"
            style={{
              fontFamily: "'Bangers', sans-serif",
              color: '#3185FC',
              letterSpacing: '0.02em',
            }}
          >
            Local Multiplayer
          </h2>
        </div>

        {/* Player count */}
        <div className="mb-6">
          <label
            className="block mb-2 text-sm uppercase tracking-widest"
            style={{
              fontFamily: "'Quicksand', sans-serif",
              fontWeight: 600,
              color: 'rgba(255, 255, 255, 0.5)',
            }}
          >
            Number of Players
          </label>
          <div className="flex gap-2">
            {[2, 3, 4].map((count) => (
              <motion.button
                key={count}
                className="flex-1 py-3 rounded-xl text-lg"
                style={{
                  fontFamily: "'Bangers', sans-serif",
                  background: playerCount === count
                    ? 'linear-gradient(135deg, #3185FC 0%, #1A6FE8 100%)'
                    : 'rgba(255, 255, 255, 0.08)',
                  boxShadow: playerCount === count ? '0 4px 0 #0D4F9E' : 'none',
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
          {Array.from({ length: playerCount }).map((_, index) => {
            const shadows = ['#9B1B30', '#0D4F9E', '#3D7A35', '#C67A1F'];
            return (
              <motion.div
                key={index}
                className="flex items-center gap-3"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl"
                  style={{
                    backgroundColor: PLAYER_COLORS[index],
                    boxShadow: `0 4px 0 ${shadows[index]}`,
                  }}
                >
                  {PLAYER_AVATARS[index]}
                </div>
                <input
                  type="text"
                  value={playerNames[index]}
                  onChange={(e) => handleNameChange(index, e.target.value)}
                  className="flex-1 px-4 py-3 rounded-xl text-lg"
                  style={{
                    fontFamily: "'Quicksand', sans-serif",
                    fontWeight: 600,
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '2px solid rgba(255, 255, 255, 0.15)',
                    color: '#fff',
                  }}
                  placeholder={`Player ${index + 1}`}
                />
              </motion.div>
            );
          })}
        </div>

        <motion.button
          className="w-full py-5 rounded-2xl text-xl"
          style={{
            fontFamily: "'Bangers', sans-serif",
            background: 'linear-gradient(135deg, #5FAD56 0%, #4A9A44 100%)',
            boxShadow: '0 6px 0 #3D7A35, 0 8px 20px rgba(95, 173, 86, 0.3)',
            color: '#fff',
            letterSpacing: '0.05em',
          }}
          onClick={handleStartLocal}
          whileHover={{ y: -2, boxShadow: '0 8px 0 #3D7A35, 0 12px 30px rgba(95, 173, 86, 0.4)' }}
          whileTap={{ y: 4, boxShadow: '0 2px 0 #3D7A35' }}
        >
          Start Game!
        </motion.button>
      </motion.div>
    </div>
  );
}
