import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore, type AIDifficulty } from '../../stores/gameStore';
import { useStatsStore } from '../../stores/statsStore';
import { isPrime, getNextPrime } from '../../utils/mathHelpers';
import { PassToPlayer } from './PassToPlayer';

interface PlayerHand {
  playerId: string;
  playerName: string;
  cards: number[];
  sum: number;
  stood: boolean;
  busted: boolean;
  isAI: boolean;
  aiDifficulty?: AIDifficulty;
}

type Phase = 'pass' | 'playing' | 'ai_turn' | 'results';

export function PrimeBlackjack() {
  const { players, currentPlayerIndex, endMinigame, aiPlayers } = useGameStore();
  const triggeringPlayer = players[currentPlayerIndex];

  // Initialize hands for all players
  const [hands, setHands] = useState<PlayerHand[]>(() =>
    players.map((player) => ({
      playerId: player.id,
      playerName: player.name,
      cards: [],
      sum: 0,
      stood: false,
      busted: false,
      isAI: aiPlayers.has(player.id),
      aiDifficulty: aiPlayers.get(player.id),
    }))
  );

  const [activePlayerIndex, setActivePlayerIndex] = useState(0);
  const [winner, setWinner] = useState<PlayerHand | null>(null);

  // For pass & play - show pass screen before each human player's turn
  const [phase, setPhase] = useState<Phase>(() => {
    // Find first player
    const firstHand = hands[0];
    if (firstHand?.isAI) {
      return 'ai_turn';
    }
    return 'pass';
  });

  const activeHand = hands[activePlayerIndex];
  const isActiveAI = activeHand?.isAI;

  // Find next player who hasn't finished
  const findNextPlayerIndex = (currentIndex: number, currentHands: PlayerHand[]): number | null => {
    let nextIndex = currentIndex + 1;
    while (nextIndex < currentHands.length) {
      if (!currentHands[nextIndex].stood && !currentHands[nextIndex].busted) {
        return nextIndex;
      }
      nextIndex++;
    }
    return null;
  };

  // Move to next player or finish
  const moveToNextPlayer = (currentHands: PlayerHand[]) => {
    const nextIndex = findNextPlayerIndex(activePlayerIndex, currentHands);

    if (nextIndex === null) {
      // All players done - show results
      determineWinner(currentHands);
      setPhase('results');
    } else {
      setActivePlayerIndex(nextIndex);
      const nextHand = currentHands[nextIndex];
      if (nextHand.isAI) {
        setPhase('ai_turn');
      } else {
        setPhase('pass'); // Show pass screen for next human
      }
    }
  };

  // AI logic
  useEffect(() => {
    if (phase !== 'ai_turn' || !isActiveAI) return;

    const timer = setTimeout(() => {
      const difficulty = activeHand.aiDifficulty || 'medium';
      let shouldHit = true;
      const currentIsPrime = isPrime(activeHand.sum);

      if (difficulty === 'easy') {
        if (currentIsPrime && activeHand.sum > 20) {
          shouldHit = Math.random() < 0.5;
        } else {
          shouldHit = activeHand.sum < 40;
        }
      } else if (difficulty === 'medium') {
        if (currentIsPrime && activeHand.sum > 40) {
          shouldHit = Math.random() < 0.25;
        } else if (currentIsPrime && activeHand.sum > 20) {
          shouldHit = Math.random() < 0.6;
        } else {
          shouldHit = activeHand.sum < 75;
        }
      } else {
        if (currentIsPrime && activeHand.sum > 60) {
          shouldHit = false;
        } else if (currentIsPrime && activeHand.sum > 40) {
          shouldHit = Math.random() < 0.4;
        } else {
          shouldHit = activeHand.sum < 85;
        }
      }

      if (shouldHit && activeHand.sum < 90) {
        handleHit();
      } else {
        handleStand();
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [phase, activePlayerIndex, isActiveAI, activeHand]);

  const handleHit = () => {
    const newCard = Math.floor(Math.random() * 10);
    const newHands = [...hands];
    const hand = { ...newHands[activePlayerIndex] };

    hand.cards = [...hand.cards, newCard];
    hand.sum = hand.cards.reduce((a, b) => a + b, 0);

    if (hand.sum >= 100) {
      hand.busted = true;
    }

    newHands[activePlayerIndex] = hand;
    setHands(newHands);

    // If busted, move to next player
    if (hand.busted) {
      moveToNextPlayer(newHands);
    }
  };

  const handleStand = () => {
    const newHands = [...hands];
    newHands[activePlayerIndex] = { ...newHands[activePlayerIndex], stood: true };
    setHands(newHands);
    moveToNextPlayer(newHands);
  };

  const determineWinner = (finalHands: PlayerHand[]) => {
    // Find highest prime sum under 100
    const validHands = finalHands.filter((h) => !h.busted && isPrime(h.sum) && h.sum < 100);

    if (validHands.length === 0) {
      setWinner(null);
      return;
    }

    const best = validHands.reduce((prev, curr) => (curr.sum > prev.sum ? curr : prev));
    setWinner(best);
  };

  const handleContinue = () => {
    useStatsStore.getState().recordMinigame({
      turnNumber: useStatsStore.getState().stats.totalTurns,
      triggeringPlayerId: triggeringPlayer.id,
      minigameType: 'prime_blackjack',
      data: {
        type: 'prime_blackjack',
        playerResults: hands.map(h => ({
          playerId: h.playerId,
          cards: h.cards,
          sum: h.sum,
          busted: h.busted,
          sumIsPrime: isPrime(h.sum),
        })),
      },
    });

    if (winner && winner.playerId === triggeringPlayer.id) {
      const nextPrime = getNextPrime(triggeringPlayer.position);
      const movement = nextPrime - triggeringPlayer.position;
      endMinigame(movement);
    } else {
      const triggeringHand = hands.find((h) => h.playerId === triggeringPlayer.id);
      if (triggeringHand?.busted) {
        endMinigame(-5);
      } else {
        endMinigame(0);
      }
    }
  };

  const handlePassReady = () => {
    setPhase('playing');
  };

  // Pass screen - show who should play next
  if (phase === 'pass') {
    const activePlayer = players[activePlayerIndex];
    return (
      <PassToPlayer
        player={activePlayer}
        minigameName="Prime Blackjack!"
        minigameDescription="Hit cards (0-9) to build a prime sum under 100. Highest prime wins!"
        onReady={handlePassReady}
      />
    );
  }

  // AI playing indicator
  if (phase === 'ai_turn') {
    return (
      <div className="glass-card w-full max-w-lg mx-auto p-4 sm:p-6">
        <div className="text-center mb-4">
          <div className="label-caps mb-1">Minigame</div>
          <h2 className="heading-2 text-aurora-cyan">Prime Blackjack!</h2>
          <p className="font-body text-[var(--color-text-secondary)] text-sm">AI is playing...</p>
        </div>

        <motion.div
          className="text-center p-8"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          <div className="glass-inset w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-aurora-cyan">
              <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
              <circle cx="9" cy="10" r="2" fill="currentColor" />
              <circle cx="15" cy="10" r="2" fill="currentColor" />
              <path d="M8 15h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <p className="font-body text-[var(--color-text-secondary)] font-medium">
            {activeHand?.playerName} is playing...
          </p>
          <p className="font-body text-[var(--color-text-muted)] text-sm mt-2">
            Current sum: {activeHand?.sum || 0}
          </p>
        </motion.div>
      </div>
    );
  }

  // Results - show everyone's hands
  if (phase === 'results') {
    return (
      <motion.div
        className="glass-card w-full max-w-lg mx-auto p-4 sm:p-6 max-h-[90dvh] overflow-y-auto"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 350, damping: 25 }}
      >
        <div className="text-center mb-4">
          <div className="label-caps mb-1">Prime Blackjack!</div>
          <h2 className="heading-2 text-aurora-cyan">Results</h2>
        </div>

        {/* All player hands revealed */}
        <div className="space-y-3 mb-4">
          {hands.map((hand) => (
            <motion.div
              key={hand.playerId}
              className="p-3 rounded-xl"
              style={
                winner?.playerId === hand.playerId
                  ? {
                      background: 'linear-gradient(135deg, rgba(255, 230, 109, 0.25) 0%, rgba(249, 160, 63, 0.15) 100%)',
                      border: '2px solid rgba(255, 230, 109, 0.6)',
                      boxShadow: '0 0 15px rgba(255, 230, 109, 0.3)',
                    }
                  : hand.busted
                  ? {
                      background: 'rgba(232, 72, 85, 0.15)',
                      border: '1px solid rgba(232, 72, 85, 0.4)',
                    }
                  : {
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                    }
              }
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {winner?.playerId === hand.playerId && (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ color: 'var(--color-aurora-yellow)' }}>
                      <path d="M12 2l3 6 6 1-4.5 4 1.5 6-6-3-6 3 1.5-6L3 9l6-1 3-6z" fill="currentColor" />
                    </svg>
                  )}
                  <span className="font-body font-bold text-sm text-[var(--color-text-primary)]">{hand.playerName}</span>
                  {hand.isAI && <span className="label-caps">AI</span>}
                </div>
                <div className={`font-title text-xl ${
                  hand.busted ? 'text-aurora-pink' :
                  isPrime(hand.sum) ? 'text-aurora-green' : 'text-[var(--color-text-secondary)]'
                }`}>
                  {hand.sum}
                  {hand.busted && <span className="text-sm ml-1">BUST</span>}
                  {!hand.busted && isPrime(hand.sum) && <span className="text-sm ml-1 text-aurora-green">Prime!</span>}
                </div>
              </div>

              {/* Cards */}
              <div className="flex flex-wrap gap-1">
                <AnimatePresence>
                  {hand.cards.map((card, cardIndex) => (
                    <motion.div
                      key={cardIndex}
                      className="w-9 h-13 bg-gradient-to-br from-aurora-cyan to-aurora-cyan-deep rounded flex items-center justify-center text-white font-title text-base shadow"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: cardIndex * 0.05 }}
                    >
                      {card}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="text-center mb-4">
          {winner ? (
            <p className="font-title text-aurora-green text-lg">
              {winner.playerName} wins with {winner.sum}!
            </p>
          ) : (
            <p className="font-title text-aurora-orange">No valid prime - no winner!</p>
          )}
          <p className="font-body text-[var(--color-text-muted)] text-sm mt-1">
            {winner?.playerId === triggeringPlayer.id
              ? 'You advance to the next prime!'
              : hands.find((h) => h.playerId === triggeringPlayer.id)?.busted
              ? 'You busted! Move back 5 spaces.'
              : 'You stay on your current square.'}
          </p>
        </div>

        <motion.button
          className="btn btn-cyan w-full"
          onClick={handleContinue}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Continue
        </motion.button>
      </motion.div>
    );
  }

  // Playing phase - only show current player's hand
  return (
    <div className="glass-card w-full max-w-lg mx-auto p-4 sm:p-6 max-h-[90dvh] overflow-y-auto">
      <div className="text-center mb-4">
        <div className="label-caps mb-1">Minigame</div>
        <h2 className="heading-2 text-aurora-cyan">Prime Blackjack!</h2>
        <p className="font-body text-[var(--color-text-secondary)] text-sm">
          Build a prime sum under 100!
        </p>
      </div>

      {/* Current player's turn indicator */}
      <div className="text-center mb-4">
        <div className="glass-inset inline-flex items-center gap-2 px-4 py-2 rounded-full">
          <span className="font-body font-bold text-[var(--color-text-primary)]">{activeHand?.playerName}'s turn</span>
        </div>
      </div>

      {/* Only show current player's hand */}
      <div
        className="p-4 rounded-xl mb-4"
        style={{
          background: 'rgba(78, 205, 196, 0.10)',
          border: '2px solid rgba(78, 205, 196, 0.4)',
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="font-body font-bold text-[var(--color-text-primary)]">{activeHand?.playerName}</span>
          <div className={`font-title text-2xl ${
            isPrime(activeHand?.sum || 0) ? 'text-aurora-green' : 'text-[var(--color-text-primary)]'
          }`}>
            {activeHand?.sum || 0}
            {isPrime(activeHand?.sum || 0) && <span className="text-sm ml-1 text-aurora-green">Prime!</span>}
          </div>
        </div>

        {/* Cards */}
        <div className="flex flex-wrap gap-2 mb-4 min-h-[48px]">
          <AnimatePresence>
            {activeHand?.cards.map((card, cardIndex) => (
              <motion.div
                key={cardIndex}
                className="w-10 h-14 bg-gradient-to-br from-aurora-cyan to-aurora-cyan-deep rounded-lg flex items-center justify-center text-white font-title text-xl shadow-lg"
                initial={{ scale: 0, rotateY: 180 }}
                animate={{ scale: 1, rotateY: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              >
                {card}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Actions */}
        <div className="flex justify-center gap-4">
          <motion.button
            className="btn btn-cyan px-8"
            onClick={handleHit}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Hit
          </motion.button>
          <motion.button
            className="btn btn-ghost px-8"
            onClick={handleStand}
            disabled={activeHand?.cards.length === 0}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Stand
          </motion.button>
        </div>
      </div>

      {/* Other players status - hidden */}
      <div className="text-center font-body text-[var(--color-text-muted)] text-sm">
        <p>{hands.filter(h => h.stood || h.busted).length} of {hands.length} players have finished</p>
      </div>
    </div>
  );
}
