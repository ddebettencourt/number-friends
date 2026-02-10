import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { DiceType } from '../../types/game';
import { DICE_TYPES, DICE_CONFIG } from '../../utils/diceLogic';

interface SpinnerWheelProps {
  onSpinComplete: (selectedDice: DiceType) => void;
  disabled?: boolean;
}

export function SpinnerWheel({ onSpinComplete, disabled }: SpinnerWheelProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [targetDice, setTargetDice] = useState<DiceType | null>(null);

  const segmentAngle = 360 / DICE_TYPES.length; // 60 degrees per segment

  const handleSpin = () => {
    if (disabled || isSpinning) return;

    setIsSpinning(true);

    // Pre-select the target dice
    const targetIndex = Math.floor(Math.random() * DICE_TYPES.length);
    const selectedDice = DICE_TYPES[targetIndex];
    setTargetDice(selectedDice);

    // Calculate target rotation
    // The conic-gradient starts from -30deg (half segment offset), so:
    //   - Segment 0 (d4) is centered at 0deg (top)
    //   - Segment 1 (d6) is centered at 60deg (clockwise from top)
    //   - Segment 2 (d8) is centered at 120deg, etc.
    //
    // CSS rotation: positive values rotate CLOCKWISE
    // When we rotate the wheel clockwise by R degrees:
    //   - What was at position 0 (top) moves to position R (clockwise)
    //   - What was at position -R (or 360-R) now appears at top
    //
    // So if segment N is centered at angle N*60, and we want it at top (0):
    //   We need the segment at angle N*60 to move to 0
    //   That means we rotate by -N*60 (counterclockwise) OR equivalently 360 - N*60 (clockwise)
    //
    // But since CSS uses clockwise for positive, and we want to spin forward (clockwise):
    //   To land on segment N: rotate by (360 - N*segmentAngle) + full rotations
    //   This brings segment N to the top

    const fullRotations = (4 + Math.random() * 2) * 360;

    // The angle we need the wheel to be at (mod 360) to have segment N at top
    // Since segment N is at N*60 degrees, rotating the wheel by (360 - N*60) brings it to top
    const targetAngle = (360 - targetIndex * segmentAngle) % 360;

    const currentAngle = rotation % 360;
    let extra = targetAngle - currentAngle;

    // Always spin forward (clockwise), so add 360 if extra is negative or very small
    if (extra <= 0) {
      extra += 360;
    }

    const finalRotation = rotation + fullRotations + extra;

    setRotation(finalRotation);
  };

  // Handle spin completion - add buffer time to ensure animation completes
  useEffect(() => {
    if (!isSpinning) return;

    const timer = setTimeout(() => {
      setIsSpinning(false);
      if (targetDice) {
        onSpinComplete(targetDice);
      }
    }, 3700); // Slightly longer than animation duration (3500ms) to ensure it completes

    return () => clearTimeout(timer);
  }, [isSpinning, targetDice, onSpinComplete]);

  // Build the conic gradient for segments
  const gradientStops = DICE_TYPES.map((diceType, index) => {
    const config = DICE_CONFIG[diceType];
    const startAngle = index * segmentAngle;
    const endAngle = (index + 1) * segmentAngle;
    return `${config.color} ${startAngle}deg ${endAngle}deg`;
  }).join(', ');

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Wheel container */}
      <div className="relative">
        {/* Pointer/Arrow at top */}
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-20">
          <svg width="24" height="32" viewBox="0 0 24 32" className="drop-shadow-lg">
            <path
              d="M12 0 L24 28 L12 24 L0 28 Z"
              fill="#1f2937"
              stroke="#374151"
              strokeWidth="1"
            />
          </svg>
        </div>

        {/* Outer ring */}
        <div
          className="absolute -inset-2 rounded-full"
          style={{
            background: 'linear-gradient(135deg, #374151 0%, #1f2937 100%)',
            boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.1), 0 4px 12px rgba(0,0,0,0.3)',
          }}
        />

        {/* The spinning wheel */}
        <motion.div
          className="relative w-52 h-52 sm:w-60 sm:h-60 rounded-full overflow-hidden"
          style={{
            background: `conic-gradient(from -${segmentAngle / 2}deg, ${gradientStops})`,
            boxShadow: 'inset 0 0 20px rgba(0,0,0,0.3)',
          }}
          animate={{ rotate: rotation }}
          transition={{
            duration: 3.5,
            ease: [0.2, 0.8, 0.3, 1],
          }}
        >
          {/* Segment dividers and labels */}
          {DICE_TYPES.map((diceType, index) => {
            const config = DICE_CONFIG[diceType];
            // Divider should be at the start of each segment (accounting for the conic-gradient offset)
            const dividerAngle = index * segmentAngle - segmentAngle / 2;
            // Label should be at the center of the visual segment
            const labelAngle = index * segmentAngle;
            const labelRadius = 38; // percentage from center

            return (
              <div key={diceType}>
                {/* Divider line */}
                <div
                  className="absolute top-1/2 left-1/2 h-0.5 bg-white/30 origin-left"
                  style={{
                    width: '50%',
                    transform: `rotate(${dividerAngle}deg)`,
                  }}
                />
                {/* Label */}
                <div
                  className="absolute font-bold text-white text-xs sm:text-sm"
                  style={{
                    left: `${50 + labelRadius * Math.sin((labelAngle * Math.PI) / 180)}%`,
                    top: `${50 - labelRadius * Math.cos((labelAngle * Math.PI) / 180)}%`,
                    transform: 'translate(-50%, -50%)',
                    textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                  }}
                >
                  {config.name}
                </div>
              </div>
            );
          })}

          {/* Center hub */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #f5f5f4 0%, #d6d3d1 100%)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3), inset 0 1px 2px rgba(255,255,255,0.8)',
            }}
          >
            {/* Dice icon SVG */}
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-gray-700">
              <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="2" />
              <circle cx="8" cy="8" r="1.5" fill="currentColor" />
              <circle cx="16" cy="8" r="1.5" fill="currentColor" />
              <circle cx="8" cy="16" r="1.5" fill="currentColor" />
              <circle cx="16" cy="16" r="1.5" fill="currentColor" />
              <circle cx="12" cy="12" r="1.5" fill="currentColor" />
            </svg>
          </div>
        </motion.div>

        {/* Tick marks around edge */}
        {Array.from({ length: 24 }).map((_, i) => {
          const tickAngle = (i * 15 * Math.PI) / 180;
          const outerRadius = 108;
          const innerRadius = i % 2 === 0 ? 100 : 104;
          return (
            <div
              key={i}
              className="absolute bg-gray-600"
              style={{
                width: '2px',
                height: `${outerRadius - innerRadius}px`,
                left: `calc(50% + ${Math.sin(tickAngle) * ((outerRadius + innerRadius) / 2)}px - 1px)`,
                top: `calc(50% - ${Math.cos(tickAngle) * ((outerRadius + innerRadius) / 2)}px - ${(outerRadius - innerRadius) / 2}px)`,
                transform: `rotate(${i * 15}deg)`,
                transformOrigin: 'center',
              }}
            />
          );
        })}
      </div>

      {/* Spin button */}
      <motion.button
        className={`px-8 py-3 rounded-xl font-bold text-lg transition-colors ${
          isSpinning
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-gray-800 text-white hover:bg-gray-700 cursor-pointer'
        }`}
        style={{
          boxShadow: isSpinning ? 'none' : '0 4px 12px rgba(0,0,0,0.2)',
        }}
        onClick={handleSpin}
        disabled={disabled || isSpinning}
        whileHover={!isSpinning && !disabled ? { scale: 1.02, y: -1 } : {}}
        whileTap={!isSpinning && !disabled ? { scale: 0.98 } : {}}
      >
        {isSpinning ? 'Spinning...' : 'Spin'}
      </motion.button>

      {/* Instructions */}
      {!isSpinning && (
        <p className="text-gray-500 text-sm text-center">
          Spin to get your die
        </p>
      )}
    </div>
  );
}
