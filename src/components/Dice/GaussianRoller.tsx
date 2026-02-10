import { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';

interface GaussianRollerProps {
  onComplete: (result: number) => void;
  disabled?: boolean;
}

interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface GaussianParams {
  mean: number;  // 1-12, the center value
  stdDev: number; // How spread out (1-3)
}

// Plinko board configuration
const ROWS = 8;
const BOARD_WIDTH = 280;
const BOARD_HEIGHT = 320;
const PEG_RADIUS = 4;
const BALL_RADIUS = 8;
const SLOT_COUNT = 10; // 10 slots

// Generate random Gaussian parameters for this roll
function generateGaussianParams(): GaussianParams {
  // Mean can be anywhere from 4-9
  const mean = Math.floor(Math.random() * 6) + 4; // 4-9
  // StdDev from 2 to 4 (wider spread to allow negatives on edges)
  const stdDev = 2 + Math.random() * 2;
  return { mean, stdDev };
}

// Calculate slot values based on Gaussian distribution centered around mean
function calculateSlotValues(params: GaussianParams): number[] {
  const { mean, stdDev } = params;
  const values: number[] = [];

  // The middle slot (index 4 or 5) should be the mean
  // Slots spread out based on stdDev - edges can go negative!
  for (let i = 0; i < SLOT_COUNT; i++) {
    // Map slot index to standard deviations from mean
    // Slot 0 = -2.5σ, Slot 5 = 0, Slot 9 = +2.5σ (approximately)
    const zScore = (i - 4.5) / 2; // -2.25 to +2.25
    const value = Math.round(mean + zScore * stdDev);
    // Allow negatives! Clamp to -6 to 12
    values.push(Math.max(-6, Math.min(12, value)));
  }

  return values;
}

// Calculate visual height for each slot based on probability
function calculateSlotHeights(_params: GaussianParams): number[] {
  const heights: number[] = [];

  // Height represents probability - bell curve shape
  for (let i = 0; i < SLOT_COUNT; i++) {
    const zScore = (i - 4.5) / 2;
    // Gaussian probability density function (normalized for visual purposes)
    const probability = Math.exp(-(zScore * zScore) / 2);
    // Scale to 10-40 pixel height
    heights.push(10 + probability * 30);
  }

  return heights;
}

export function GaussianRoller({ onComplete, disabled }: GaussianRollerProps) {
  const [phase, setPhase] = useState<'ready' | 'dropping' | 'result'>('ready');
  const [ball, setBall] = useState<Ball | null>(null);
  const [result, setResult] = useState<number | null>(null);
  const [finalSlotIndex, setFinalSlotIndex] = useState<number | null>(null);
  const [targetSlot, setTargetSlot] = useState<number>(5);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  // Generate new Gaussian parameters for each roll
  const [gaussianParams] = useState<GaussianParams>(() => generateGaussianParams());

  // Calculate slot values and heights based on the Gaussian params
  const slotValues = useMemo(() => calculateSlotValues(gaussianParams), [gaussianParams]);
  const slotHeights = useMemo(() => calculateSlotHeights(gaussianParams), [gaussianParams]);

  // Calculate peg positions
  const getPegPositions = () => {
    const pegs: { x: number; y: number; row: number }[] = [];
    const startY = 50;
    const rowHeight = (BOARD_HEIGHT - 100) / ROWS;

    for (let row = 0; row < ROWS; row++) {
      const pegsInRow = row + 3;
      const rowWidth = (pegsInRow - 1) * 28;
      const startX = (BOARD_WIDTH - rowWidth) / 2;

      for (let i = 0; i < pegsInRow; i++) {
        pegs.push({
          x: startX + i * 28,
          y: startY + row * rowHeight,
          row,
        });
      }
    }
    return pegs;
  };

  const pegs = getPegPositions();

  const handleStart = () => {
    if (disabled) return;

    // Pre-calculate which slot the ball will land in (biased towards center)
    // This creates a natural bell curve distribution
    const random1 = Math.random();
    const random2 = Math.random();
    // Box-Muller to get normal distribution centered at slot 5
    const z = Math.sqrt(-2 * Math.log(random1)) * Math.cos(2 * Math.PI * random2);
    const targetSlotValue = Math.max(0, Math.min(SLOT_COUNT - 1, Math.round(4.5 + z * 1.5)));
    setTargetSlot(targetSlotValue);

    // Start ball at top center with slight random offset
    setBall({
      x: BOARD_WIDTH / 2 + (Math.random() - 0.5) * 10,
      y: 20,
      vx: (Math.random() - 0.5) * 2,
      vy: 0,
    });
    setPhase('dropping');
    startTimeRef.current = Date.now();
  };

  // Physics simulation
  useEffect(() => {
    if (phase !== 'dropping' || !ball) return;

    const gravity = 0.15;
    const friction = 0.98;
    const bounceEnergy = 0.6;
    const slotWidth = BOARD_WIDTH / SLOT_COUNT;
    const targetX = targetSlot * slotWidth + slotWidth / 2;

    const simulate = () => {
      setBall((prevBall) => {
        if (!prevBall) return null;

        let { x, y, vx, vy } = prevBall;

        // Apply gravity
        vy += gravity;

        // Apply horizontal bias towards target slot
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        if (elapsed > 0.5) {
          const biasStrength = 0.02;
          if (x < targetX - 5) vx += biasStrength;
          if (x > targetX + 5) vx -= biasStrength;
        }

        // Update position
        x += vx;
        y += vy;

        // Bounce off pegs
        for (const peg of pegs) {
          const dx = x - peg.x;
          const dy = y - peg.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const minDist = PEG_RADIUS + BALL_RADIUS;

          if (dist < minDist && dist > 0) {
            // Collision! Bounce away from peg
            const nx = dx / dist;
            const ny = dy / dist;
            const overlap = minDist - dist;

            // Move ball out of peg
            x += nx * overlap;
            y += ny * overlap;

            // Reflect velocity
            const dot = vx * nx + vy * ny;
            vx = (vx - 2 * dot * nx) * bounceEnergy;
            vy = (vy - 2 * dot * ny) * bounceEnergy;

            // Add some randomness
            vx += (Math.random() - 0.5) * 1;
          }
        }

        // Bounce off walls
        if (x < BALL_RADIUS) {
          x = BALL_RADIUS;
          vx = -vx * bounceEnergy;
        }
        if (x > BOARD_WIDTH - BALL_RADIUS) {
          x = BOARD_WIDTH - BALL_RADIUS;
          vx = -vx * bounceEnergy;
        }

        // Apply friction
        vx *= friction;

        // Check if ball reached bottom
        if (y > BOARD_HEIGHT - 35) {
          // Determine which slot
          const slotIndex = Math.floor(x / slotWidth);
          const finalSlot = Math.max(0, Math.min(SLOT_COUNT - 1, slotIndex));

          // Get the value from our pre-calculated slot values
          const finalValue = slotValues[finalSlot];
          setResult(finalValue);
          setFinalSlotIndex(finalSlot);
          setPhase('result');
          return { ...prevBall, x, y: BOARD_HEIGHT - 35, vx: 0, vy: 0 };
        }

        return { x, y, vx, vy };
      });

      if (phase === 'dropping') {
        animationRef.current = requestAnimationFrame(simulate);
      }
    };

    animationRef.current = requestAnimationFrame(simulate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [phase, ball, pegs, targetSlot, slotValues]);

  if (phase === 'ready') {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-pink-400 to-rose-500 mb-3 shadow-lg">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="text-white">
              <circle cx="12" cy="4" r="2" fill="currentColor" />
              <circle cx="8" cy="8" r="1.5" fill="currentColor" opacity="0.7" />
              <circle cx="16" cy="8" r="1.5" fill="currentColor" opacity="0.7" />
              <circle cx="6" cy="12" r="1.5" fill="currentColor" opacity="0.5" />
              <circle cx="12" cy="12" r="1.5" fill="currentColor" opacity="0.5" />
              <circle cx="18" cy="12" r="1.5" fill="currentColor" opacity="0.5" />
              <path d="M4 20h16v2H4z" fill="currentColor" opacity="0.3" />
            </svg>
          </div>
          <h3 className="text-xl font-black bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">
            Gaussian Plinko
          </h3>
          <p className="text-gray-500 text-sm mt-1">
            Drop the ball and watch it bounce!
          </p>
        </div>

        {/* Preview of distribution */}
        <div className="bg-slate-100 rounded-xl p-3 text-center">
          <div className="text-xs text-gray-500 mb-1">This roll's distribution</div>
          <div className="flex items-end justify-center gap-0.5 h-12">
            {slotHeights.map((height, idx) => (
              <div
                key={idx}
                className="w-5 bg-gradient-to-t from-pink-400 to-pink-300 rounded-t"
                style={{ height: `${height}px` }}
              />
            ))}
          </div>
          <div className="flex justify-center gap-0.5 mt-0.5">
            {slotValues.map((value, idx) => (
              <div
                key={idx}
                className="w-5 text-xs text-gray-600 font-bold"
              >
                {value}
              </div>
            ))}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            Center: {gaussianParams.mean} | Spread: {gaussianParams.stdDev.toFixed(1)}
          </div>
        </div>

        <motion.button
          className="px-8 py-4 bg-gradient-to-r from-pink-400 to-rose-500 text-white font-bold text-xl rounded-2xl shadow-lg"
          onClick={handleStart}
          disabled={disabled}
          whileHover={{ scale: disabled ? 1 : 1.05 }}
          whileTap={{ scale: disabled ? 1 : 0.95 }}
        >
          Drop Ball
        </motion.button>
      </div>
    );
  }

  const slotWidth = BOARD_WIDTH / SLOT_COUNT;

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Plinko board */}
      <div
        className="relative bg-gradient-to-b from-slate-800 to-slate-900 rounded-2xl overflow-hidden shadow-2xl"
        style={{ width: BOARD_WIDTH, height: BOARD_HEIGHT }}
      >
        {/* Top funnel */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-8 bg-gradient-to-b from-slate-700 to-transparent"
          style={{
            clipPath: 'polygon(20% 0, 80% 0, 100% 100%, 0% 100%)',
          }}
        />

        {/* Pegs */}
        {pegs.map((peg, idx) => (
          <div
            key={idx}
            className="absolute rounded-full bg-gradient-to-br from-pink-400 to-pink-600 shadow-lg"
            style={{
              left: peg.x - PEG_RADIUS,
              top: peg.y - PEG_RADIUS,
              width: PEG_RADIUS * 2,
              height: PEG_RADIUS * 2,
            }}
          />
        ))}

        {/* Slot backgrounds with probability-based heights */}
        {slotHeights.map((height, idx) => (
          <div
            key={idx}
            className="absolute bg-gradient-to-t from-pink-500/30 to-transparent"
            style={{
              left: idx * slotWidth,
              bottom: 0,
              width: slotWidth - 2,
              marginLeft: 1,
              height: height + 15,
              borderRadius: '4px 4px 0 0',
            }}
          />
        ))}

        {/* Slot dividers */}
        {Array.from({ length: SLOT_COUNT - 1 }).map((_, idx) => (
          <div
            key={idx}
            className="absolute bg-slate-600"
            style={{
              left: ((idx + 1) * BOARD_WIDTH) / SLOT_COUNT - 1,
              bottom: 0,
              width: 2,
              height: 50,
            }}
          />
        ))}

        {/* Slot labels with values */}
        <div className="absolute bottom-1 left-0 right-0 flex">
          {slotValues.map((value, idx) => (
            <div
              key={idx}
              className={`text-sm font-black text-center ${
                finalSlotIndex === idx ? 'text-amber-300' : 'text-slate-300'
              }`}
              style={{ width: slotWidth }}
            >
              {value}
            </div>
          ))}
        </div>

        {/* Ball */}
        {ball && (
          <motion.div
            className="absolute rounded-full bg-gradient-to-br from-amber-300 to-orange-500 shadow-lg border-2 border-white/50"
            style={{
              left: ball.x - BALL_RADIUS,
              top: ball.y - BALL_RADIUS,
              width: BALL_RADIUS * 2,
              height: BALL_RADIUS * 2,
            }}
            animate={phase === 'result' ? { scale: [1, 1.2, 1] } : {}}
            transition={{ duration: 0.3 }}
          />
        )}

        {/* Glow effect at bottom for result slot */}
        {phase === 'result' && finalSlotIndex !== null && (
          <motion.div
            className="absolute bottom-0 bg-gradient-to-t from-amber-400/50 to-transparent"
            style={{
              left: finalSlotIndex * slotWidth,
              width: slotWidth,
              height: 60,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          />
        )}
      </div>

      {/* Result display */}
      {phase === 'result' && result !== null && (
        <motion.div
          className="flex flex-col items-center gap-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-gray-600 font-medium">You rolled:</p>
          <motion.div
            className="w-20 h-20 bg-gradient-to-br from-pink-400 via-rose-500 to-pink-600 rounded-2xl flex items-center justify-center text-white text-4xl font-black shadow-xl"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', bounce: 0.5 }}
          >
            {result}
          </motion.div>
          <motion.button
            className="mt-2 px-8 py-3 bg-gradient-to-r from-pink-400 to-rose-500 text-white font-bold text-lg rounded-xl shadow-lg"
            onClick={() => onComplete(result)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Continue
          </motion.button>
        </motion.div>
      )}

      {phase === 'dropping' && (
        <p className="text-gray-500 font-medium animate-pulse">Bouncing...</p>
      )}
    </div>
  );
}
