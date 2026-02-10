import { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useGameStore } from '../../stores/gameStore';
import { GameBoard } from '../Board/GameBoard';
import { DiceSelector } from '../Dice/DiceSelector';
import { DiceRoller } from '../Dice/DiceRoller';
import { soundEngine } from '../../utils/soundEngine';
import { GaussianRoller } from '../Dice/GaussianRoller';
import { SetupScreen } from './SetupScreen';
import { PlayerInfo } from '../UI/PlayerInfo';
import { VictoryScreen } from './VictoryScreen';
import { MinigameRouter } from '../Minigames/MinigameRouter';
import { RulesModal, useRulesModal } from '../UI/RulesModal';
import { SquareInfoModal, useSquareInfoModal } from '../UI/SquareInfoModal';
import { rollDice, rollGaussianDetailed, selectRandomDice } from '../../utils/diceLogic';
import type { DiceType } from '../../types/game';
import { getZoneIndex } from '../Board3D/zoneConfig';

type BoardMode = '2d' | '3d' | 'immersive';

// Zone index → music track mapping
const ZONE_MUSIC = ['green_meadow', 'crystal_caves', 'volcanic_ridge', 'sky_islands', 'the_summit'] as const;

// Lazy load 3D board to avoid loading Three.js unless needed
const GameBoard3D = lazy(() => import('../Board3D/GameBoard3D').then(m => ({ default: m.GameBoard3D })));

// Eagerly import ImmersiveBoard — lazy loading + Suspense causes WebGL context loss on first interaction
import { ImmersiveBoard } from '../ImmersiveBoard';

export function GameContainer() {
  const {
    players,
    currentPlayerIndex,
    phase,
    selectedDice,
    lastRoll,
    winner,
    activeMinigame,
    initGame,
    movePlayer,
    endTurn,
    resetGame,
    isCurrentPlayerAI,
    setRollResult,
    setSelectedDice,
  } = useGameStore();

  const [showingRoll, setShowingRoll] = useState(false);
  const [showGaussianRoller, setShowGaussianRoller] = useState(false);
  const [movePath, setMovePath] = useState<number[]>([]);
  const [boardMode, setBoardMode] = useState<BoardMode>('2d');
  const [hopAnimationDone, setHopAnimationDone] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('numberFriends_soundEnabled');
    return saved !== null ? saved === 'true' : true;
  });
  const rulesModal = useRulesModal();
  const squareInfoModal = useSquareInfoModal();
  const currentPlayer = players[currentPlayerIndex];
  const isAI = isCurrentPlayerAI();

  // Sync sound engine with toggle state
  useEffect(() => {
    soundEngine.setEnabled(soundEnabled);
    localStorage.setItem('numberFriends_soundEnabled', String(soundEnabled));
  }, [soundEnabled]);

  // Switch music based on the current player's zone
  useEffect(() => {
    if (!currentPlayer || phase === 'setup' || phase === 'game_over') return;
    const zoneIdx = getZoneIndex(currentPlayer.position);
    const track = ZONE_MUSIC[zoneIdx];
    if (track && soundEngine.getCurrentMusicTrack() !== track) {
      soundEngine.playMusic(track);
    }
  }, [currentPlayer?.position, phase]);

  // Reset states when turn changes
  useEffect(() => {
    setShowingRoll(false);
    setShowGaussianRoller(false);
    setMovePath([]);
    setWaitingForMinigameAnim(false);
    soundEngine.turnStart();
  }, [currentPlayerIndex]);

  // Show roll result for a moment before allowing move, and compute path
  // Note: setRollResult sets phase directly to 'moving', so we must also handle that phase
  useEffect(() => {
    if ((phase === 'rolling' || phase === 'moving') && lastRoll !== null && currentPlayer) {
      setShowingRoll(true);
      // Compute the path from current position to destination
      const startPos = currentPlayer.position;
      const endPos = Math.min(startPos + lastRoll, 100); // Cap at 100
      const path: number[] = [];
      for (let i = startPos; i <= endPos; i++) {
        path.push(i);
      }
      setMovePath(path);
      // If path is only 1 step (no movement), skip hop animation wait
      setHopAnimationDone(path.length <= 1);
    }
  }, [phase, lastRoll, currentPlayer]);

  // Callback when hop animation finishes (from ImmersiveBoard → PlayerPawn)
  const handleMoveAnimationComplete = useCallback(() => {
    setHopAnimationDone(true);
    setWaitingForMinigameAnim(false);
  }, []);

  // Show Gaussian roller when Gaussian die is selected
  useEffect(() => {
    if (selectedDice === 'gaussian' && lastRoll === null && !showGaussianRoller) {
      setShowGaussianRoller(true);
    }
  }, [selectedDice, lastRoll, showGaussianRoller]);

  const handleGaussianComplete = (result: number) => {
    setShowGaussianRoller(false);
    setRollResult(result);
  };

  // AI auto-play for rolling phase
  useEffect(() => {
    if (phase === 'rolling' && isAI) {
      // AI selects dice (uses random selection like before)
      if (!selectedDice) {
        const timer = setTimeout(() => {
          const randomDice = selectRandomDice();
          setSelectedDice(randomDice);
        }, 1200);
        return () => clearTimeout(timer);
      }
      // AI rolls dice (skip if gaussian - handled separately)
      if (selectedDice && selectedDice !== 'gaussian' && lastRoll === null) {
        const timer = setTimeout(() => {
          const result = rollDice(selectedDice);
          setRollResult(result);
        }, 1500);
        return () => clearTimeout(timer);
      }
      // AI handles Gaussian die
      if (selectedDice === 'gaussian' && showGaussianRoller && lastRoll === null) {
        const timer = setTimeout(() => {
          // AI just gets a random gaussian result
          const result = rollGaussianDetailed();
          handleGaussianComplete(result.finalResult);
        }, 2000);
        return () => clearTimeout(timer);
      }
      // AI continues after seeing roll
      if (lastRoll !== null) {
        const timer = setTimeout(() => {
          setShowingRoll(false);
          movePlayer();
        }, 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [phase, isAI, selectedDice, lastRoll, showGaussianRoller, setSelectedDice, movePlayer]);

  // Auto-move after moving phase starts - execute the actual move after hop animation finishes
  useEffect(() => {
    if (phase === 'moving') {
      if (boardMode === 'immersive') {
        // In immersive mode, wait for hop animation to complete
        if (hopAnimationDone) {
          // Small delay after landing before proceeding
          const timer = setTimeout(() => {
            movePlayer();
          }, 400);
          return () => clearTimeout(timer);
        }
        // If animation hasn't finished yet, do nothing - this effect will re-run when hopAnimationDone changes
      } else {
        // For 2D/3D boards, use fixed timer
        const timer = setTimeout(() => {
          movePlayer();
        }, 1200);
        return () => clearTimeout(timer);
      }
    }
  }, [phase, movePlayer, boardMode, hopAnimationDone]);

  // Track position before minigame so we can animate bonus movement after
  const posBeforeMinigame = useRef<number | null>(null);
  const [waitingForMinigameAnim, setWaitingForMinigameAnim] = useState(false);

  useEffect(() => {
    if (phase === 'minigame' && currentPlayer) {
      posBeforeMinigame.current = currentPlayer.position;
    }
  }, [phase]);

  // After minigame ends, if the player moved, animate the bonus movement
  useEffect(() => {
    if (phase === 'end_turn' && posBeforeMinigame.current !== null && currentPlayer) {
      const oldPos = posBeforeMinigame.current;
      const newPos = currentPlayer.position;
      posBeforeMinigame.current = null;

      if (newPos !== oldPos && Math.abs(newPos - oldPos) > 0) {
        // Compute movePath for the minigame bonus movement
        const path: number[] = [];
        const start = Math.min(oldPos, newPos);
        const end = Math.max(oldPos, newPos);
        for (let i = start; i <= end; i++) {
          path.push(i);
        }
        setMovePath(path);
        if (boardMode === 'immersive') {
          setHopAnimationDone(false);
          setWaitingForMinigameAnim(true);
        }
      }
    }
  }, [phase, currentPlayer?.position]);

  // AI auto-end turn (wait for minigame animation in immersive mode)
  useEffect(() => {
    if (phase === 'end_turn' && isAI) {
      if (waitingForMinigameAnim && !hopAnimationDone) return; // wait for animation
      const timer = setTimeout(() => {
        endTurn();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [phase, isAI, endTurn, waitingForMinigameAnim, hopAnimationDone]);

  const handleContinueAfterRoll = () => {
    setShowingRoll(false);
    movePlayer();
  };

  if (phase === 'setup') {
    return <SetupScreen onStartGame={initGame} />;
  }

  if (phase === 'game_over' && winner) {
    return <VictoryScreen winner={winner} onPlayAgain={resetGame} />;
  }

  // Helper: build the dice/controls JSX block (shared between normal and immersive layouts)
  const diceControlsJSX = (
    <>
      {phase === 'rolling' && (
        <>
          {!selectedDice && !isAI && (
            <DiceSelector
              onSelect={(dice: DiceType) => setSelectedDice(dice)}
              disabled={isAI}
            />
          )}

          {selectedDice === 'gaussian' && showGaussianRoller && (
            <div
              className="rounded-3xl p-6"
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
              }}
            >
              <GaussianRoller
                onComplete={handleGaussianComplete}
                disabled={isAI}
              />
            </div>
          )}

          {selectedDice && selectedDice !== 'gaussian' && lastRoll === null && (
            <DiceRoller
              diceType={selectedDice}
              onRollComplete={setRollResult}
              disabled={isAI}
            />
          )}

          {selectedDice && selectedDice !== 'gaussian' && lastRoll !== null && (
            <motion.div
              className="text-center p-6 rounded-3xl"
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <p
                className="text-4xl font-bold mb-2"
                style={{ fontFamily: "'Bangers', sans-serif", color: '#FFE66D' }}
              >
                {lastRoll}
              </p>
              <p className="text-[var(--color-text-secondary)]" style={{ fontFamily: "'Quicksand', sans-serif" }}>
                You rolled a {lastRoll}!
              </p>
            </motion.div>
          )}

          {!selectedDice && isAI && (
            <motion.div
              className="text-center p-8 rounded-3xl"
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <motion.div
                className="w-16 h-16 mx-auto mb-4 rounded-xl flex items-center justify-center"
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                }}
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 0.5, repeat: Infinity }}
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" style={{ color: '#c678dd' }}>
                  <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
                  <circle cx="9" cy="10" r="2" fill="currentColor" />
                  <circle cx="15" cy="10" r="2" fill="currentColor" />
                  <path d="M8 15h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </motion.div>
              <p className="text-[var(--color-text-secondary)] font-display font-medium">{currentPlayer?.name} is selecting a die...</p>
            </motion.div>
          )}

          {showingRoll && lastRoll !== null && !isAI && !showGaussianRoller && (
            <motion.button
              className="mt-4 px-8 py-3 font-display font-bold text-lg rounded-2xl text-white"
              style={{
                background: 'linear-gradient(135deg, #98ec65 0%, #56d4c8 100%)',
                boxShadow: '0 0 25px rgba(152, 236, 101, 0.5)',
              }}
              onClick={handleContinueAfterRoll}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.05, boxShadow: '0 0 35px rgba(152, 236, 101, 0.7)' }}
              whileTap={{ scale: 0.95 }}
            >
              Move →
            </motion.button>
          )}
        </>
      )}

      {phase === 'moving' && (
        <motion.div
          className="text-[var(--color-text-primary)] text-xl font-display font-bold text-center px-8 py-4 rounded-2xl"
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div
            className="w-10 h-10 mx-auto mb-2 rounded-lg flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #ffd93d 0%, #ff9f43 100%)',
              boxShadow: '0 0 20px rgba(255, 217, 61, 0.5)',
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-[#0f0a1f]">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
              <circle cx="12" cy="12" r="4" fill="currentColor" />
            </svg>
          </div>
          Moving to square {currentPlayer ? currentPlayer.position + (lastRoll || 0) : ''}...
        </motion.div>
      )}

      {phase === 'end_turn' && !isAI && (
        <motion.button
          className="px-10 py-4 font-display font-bold text-xl rounded-2xl text-white"
          style={{
            background: 'linear-gradient(135deg, #c678dd 0%, #ff6b9d 100%)',
            boxShadow: '0 0 25px rgba(198, 120, 221, 0.5)',
          }}
          onClick={endTurn}
          initial={{ scale: 0, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          whileHover={{ scale: 1.05, y: -2, boxShadow: '0 0 35px rgba(198, 120, 221, 0.7)' }}
          whileTap={{ scale: 0.95 }}
        >
          End Turn
        </motion.button>
      )}

      {phase === 'end_turn' && isAI && (
        <motion.div
          className="text-[var(--color-text-secondary)] text-lg font-display font-semibold text-center px-6 py-4 rounded-2xl flex items-center gap-3"
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
            }}
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 0.5, repeat: Infinity }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ color: '#c678dd' }}>
              <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
              <circle cx="9" cy="10" r="2" fill="currentColor" />
              <circle cx="15" cy="10" r="2" fill="currentColor" />
              <path d="M8 15h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </motion.div>
          {currentPlayer?.name} finished...
        </motion.div>
      )}
    </>
  );

  // --- IMMERSIVE MODE: Full-screen 3D with overlay UI ---
  if (boardMode === 'immersive') {
    return (
      <>
        <ImmersiveBoard
          players={players}
          currentPlayerIndex={currentPlayerIndex}
          highlightedSquare={currentPlayer?.position}
          onSquareClick={squareInfoModal.open}
          movePath={movePath}
          boardMode={boardMode}
          onBoardModeChange={(mode: string) => setBoardMode(mode as BoardMode)}
          soundEnabled={soundEnabled}
          onSoundToggle={() => setSoundEnabled(!soundEnabled)}
          onRulesOpen={rulesModal.open}
          onMoveAnimationComplete={handleMoveAnimationComplete}
        >
          {diceControlsJSX}
        </ImmersiveBoard>

        {/* Modals render on top of everything */}
        <AnimatePresence>
          {phase === 'minigame' && activeMinigame && (
            <div className="fixed inset-0 z-50">
              <MinigameRouter minigame={activeMinigame} />
            </div>
          )}
        </AnimatePresence>

        <div className="fixed z-50">
          <RulesModal isOpen={rulesModal.isOpen} onClose={rulesModal.close} />
          <SquareInfoModal
            isOpen={squareInfoModal.isOpen}
            onClose={squareInfoModal.close}
            squareNumber={squareInfoModal.squareNumber}
          />
        </div>
      </>
    );
  }

  // --- NORMAL MODE (2D or 3D) ---
  return (
    <div className="min-h-screen flex flex-col p-2 sm:p-4">
      {/* Header with player info and rules button */}
      <div className="mb-4 flex items-start justify-between">
        <div className="flex-1">
          <PlayerInfo players={players} currentPlayerIndex={currentPlayerIndex} />
        </div>
        <div className="flex gap-2 ml-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-xl transition-all hover:scale-110"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
            title={soundEnabled ? 'Mute sounds' : 'Unmute sounds'}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--color-text-secondary)]">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              {soundEnabled ? (
                <>
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                </>
              ) : (
                <line x1="23" y1="9" x2="17" y2="15" />
              )}
            </svg>
          </button>
          <button
            onClick={rulesModal.open}
            className="p-2 rounded-xl transition-all hover:scale-110"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
            title="How to Play"
          >
            <span className="text-xl">📖</span>
          </button>
        </div>
      </div>

      {/* Main game area */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 items-center justify-center">
        {/* Game board */}
        <div className={`w-full ${boardMode === '3d' ? 'lg:w-3/4' : 'lg:w-2/3'} max-w-2xl`}>
          {/* Board mode toggle */}
          <div className="flex justify-center mb-3">
            <button
              onClick={() => {
                const modes: BoardMode[] = ['2d', '3d', 'immersive'];
                const currentIdx = modes.indexOf(boardMode);
                setBoardMode(modes[(currentIdx + 1) % modes.length]);
              }}
              className="px-4 py-2 rounded-full text-sm font-body font-bold transition-all"
              style={{
                background: boardMode !== '2d'
                  ? 'linear-gradient(135deg, #c678dd 0%, #ff6b9d 100%)'
                  : 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#fff',
                boxShadow: boardMode !== '2d'
                  ? '0 4px 15px rgba(198, 120, 221, 0.4)'
                  : 'none',
              }}
            >
              {boardMode === '3d' ? '🎮 3D Board' : '📋 2D Board'} — Click to switch
            </button>
          </div>

          {boardMode === '3d' ? (
            <Suspense fallback={
              <div className="aspect-square max-w-2xl mx-auto rounded-3xl flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.05)' }}>
                <div className="text-center">
                  <div className="text-4xl mb-2">🎮</div>
                  <div className="font-body text-[var(--color-text-secondary)]">Loading 3D world...</div>
                </div>
              </div>
            }>
              <GameBoard3D
                players={players}
                currentPlayerIndex={currentPlayerIndex}
                highlightedSquare={currentPlayer?.position}
                onSquareClick={squareInfoModal.open}
                movePath={movePath}
              />
            </Suspense>
          ) : (
            <GameBoard
              players={players}
              highlightedSquare={currentPlayer?.position}
              onSquareClick={squareInfoModal.open}
              movePath={movePath}
            />
          )}
        </div>

        {/* Dice and controls */}
        <div className="w-full lg:w-1/3 flex flex-col items-center justify-center gap-4 min-h-[250px]">
          {diceControlsJSX}
        </div>
      </div>

      {/* Current player indicator */}
      <div className="mt-4 text-center">
        <motion.div
          className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl"
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(20px)',
            border: `2px solid ${currentPlayer?.color || '#c678dd'}40`,
            boxShadow: `0 0 25px ${currentPlayer?.color || '#c678dd'}30`,
          }}
          animate={isAI ? { scale: [1, 1.02, 1] } : {}}
          transition={{ duration: 1, repeat: isAI ? Infinity : 0 }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${currentPlayer?.color} 0%, ${currentPlayer?.color}cc 100%)`,
              boxShadow: `0 0 20px ${currentPlayer?.color}60`,
            }}
          >
            <div
              className="absolute inset-0 rounded-xl pointer-events-none"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, transparent 50%)',
              }}
            />
            <span className="relative z-10">{currentPlayer?.avatar}</span>
          </div>
          <div className="text-left">
            <span className="font-display font-bold text-[var(--color-text-primary)] text-lg">
              {currentPlayer?.name}
            </span>
            {isAI && <span className="text-[var(--color-text-muted)] text-sm ml-2">(AI)</span>}
            <div className="text-[var(--color-text-secondary)] text-sm">
              Square {currentPlayer?.position}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Minigame overlay */}
      <AnimatePresence>
        {phase === 'minigame' && activeMinigame && (
          <MinigameRouter minigame={activeMinigame} />
        )}
      </AnimatePresence>

      {/* Rules modal */}
      <RulesModal isOpen={rulesModal.isOpen} onClose={rulesModal.close} />

      {/* Square info modal */}
      <SquareInfoModal
        isOpen={squareInfoModal.isOpen}
        onClose={squareInfoModal.close}
        squareNumber={squareInfoModal.squareNumber}
      />
    </div>
  );
}
