import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import type { DiceType } from '../../types/game';
import { DICE_CONFIG } from '../../utils/diceLogic';

interface Dice3DProps {
  diceType: DiceType;
  value: number | null;
  isRolling: boolean;
  onRollComplete: () => void;
  onRollStart: () => void;
  disabled?: boolean;
}

// Pip positions for each face value (1-6)
const PIP_LAYOUTS: Record<number, { x: number; y: number }[]> = {
  1: [{ x: 50, y: 50 }],
  2: [{ x: 25, y: 25 }, { x: 75, y: 75 }],
  3: [{ x: 25, y: 25 }, { x: 50, y: 50 }, { x: 75, y: 75 }],
  4: [{ x: 25, y: 25 }, { x: 75, y: 25 }, { x: 25, y: 75 }, { x: 75, y: 75 }],
  5: [{ x: 25, y: 25 }, { x: 75, y: 25 }, { x: 50, y: 50 }, { x: 25, y: 75 }, { x: 75, y: 75 }],
  6: [{ x: 25, y: 25 }, { x: 75, y: 25 }, { x: 25, y: 50 }, { x: 75, y: 50 }, { x: 25, y: 75 }, { x: 75, y: 75 }],
};


// For dice with more than 6 sides, show the number instead of pips
const shouldShowPips = (diceType: DiceType, value: number): boolean => {
  if (diceType === 'd4' || diceType === 'd6') {
    return value <= 6;
  }
  return false;
};

export function Dice3D({ diceType, value, isRolling, onRollComplete, onRollStart, disabled }: Dice3DProps) {
  const config = DICE_CONFIG[diceType];
  const [rotation, setRotation] = useState({ x: 0, y: 0, z: 0 });
  const [displayValue, setDisplayValue] = useState<number>(1);
  const animationRef = useRef<number | null>(null);
  const rollStartTime = useRef<number>(0);

  // Dice size
  const size = 80;
  const halfSize = size / 2;

  // Handle rolling animation
  useEffect(() => {
    if (!isRolling) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      return;
    }

    rollStartTime.current = Date.now();
    const rollDuration = 1500; // 1.5 seconds

    const maxValue = diceType === 'd4' ? 4 : diceType === 'd6' ? 6 : diceType === 'd8' ? 8 :
                     diceType === 'd10' ? 10 : diceType === 'prime' ? 6 : 12;

    const animate = () => {
      const elapsed = Date.now() - rollStartTime.current;
      const progress = Math.min(elapsed / rollDuration, 1);

      // Easing: fast at start, slow at end
      const easeOut = 1 - Math.pow(1 - progress, 3);

      // Rotation speed decreases over time
      const speed = (1 - easeOut) * 20 + 0.5;

      setRotation(prev => ({
        x: prev.x + speed * 3,
        y: prev.y + speed * 4,
        z: prev.z + speed * 1.5,
      }));

      // Random display value during roll
      if (progress < 0.9) {
        setDisplayValue(Math.floor(Math.random() * maxValue) + 1);
      }

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        // Settle on final face
        if (value !== null) {
          setDisplayValue(value);
          // Snap to a clean rotation showing the value face
          setRotation({ x: 0, y: 0, z: 0 });
        }
        onRollComplete();
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isRolling, value, diceType, onRollComplete]);

  // Update display when value changes (after roll)
  useEffect(() => {
    if (value !== null && !isRolling) {
      setDisplayValue(value);
    }
  }, [value, isRolling]);

  const handleClick = () => {
    if (disabled || isRolling) return;
    onRollStart();
  };

  const showPips = shouldShowPips(diceType, displayValue);
  const faceColor = config.color;

  return (
    <div className="flex flex-col items-center gap-4">
      {/* 3D Dice Container */}
      <div
        className="relative cursor-pointer"
        style={{
          width: size,
          height: size,
          perspective: '400px',
        }}
        onClick={handleClick}
      >
        {/* The 3D cube */}
        <motion.div
          className="absolute w-full h-full"
          style={{
            transformStyle: 'preserve-3d',
            transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) rotateZ(${rotation.z}deg)`,
          }}
          animate={!isRolling && value !== null ? { scale: [1, 1.1, 1] } : {}}
          transition={{ duration: 0.3 }}
        >
          {/* Front face */}
          <DiceFace
            value={displayValue}
            showPips={showPips}
            color={faceColor}
            size={size}
            transform={`translateZ(${halfSize}px)`}
          />

          {/* Back face */}
          <DiceFace
            value={(displayValue % 6) + 1}
            showPips={showPips}
            color={faceColor}
            size={size}
            transform={`rotateY(180deg) translateZ(${halfSize}px)`}
          />

          {/* Right face */}
          <DiceFace
            value={((displayValue + 1) % 6) + 1}
            showPips={showPips}
            color={faceColor}
            size={size}
            transform={`rotateY(90deg) translateZ(${halfSize}px)`}
          />

          {/* Left face */}
          <DiceFace
            value={((displayValue + 2) % 6) + 1}
            showPips={showPips}
            color={faceColor}
            size={size}
            transform={`rotateY(-90deg) translateZ(${halfSize}px)`}
          />

          {/* Top face */}
          <DiceFace
            value={((displayValue + 3) % 6) + 1}
            showPips={showPips}
            color={faceColor}
            size={size}
            transform={`rotateX(90deg) translateZ(${halfSize}px)`}
          />

          {/* Bottom face */}
          <DiceFace
            value={((displayValue + 4) % 6) + 1}
            showPips={showPips}
            color={faceColor}
            size={size}
            transform={`rotateX(-90deg) translateZ(${halfSize}px)`}
          />
        </motion.div>

        {/* Shadow */}
        <div
          className="absolute rounded-lg bg-black/20 blur-md"
          style={{
            width: size * 0.8,
            height: size * 0.3,
            left: '50%',
            bottom: -size * 0.15,
            transform: 'translateX(-50%)',
            opacity: isRolling ? 0.3 : 0.5,
          }}
        />
      </div>

      {/* Dice info */}
      <div className="text-center">
        <div
          className="px-4 py-2 rounded-full font-bold text-white shadow-lg"
          style={{ backgroundColor: faceColor }}
        >
          {config.name}
        </div>
        {value !== null && !isRolling && (
          <motion.div
            className="mt-2 text-2xl font-black text-gray-800"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
          >
            {value}
          </motion.div>
        )}
      </div>

      {/* Instructions */}
      {!isRolling && value === null && !disabled && (
        <p className="text-gray-600 font-medium">Tap to roll!</p>
      )}
      {isRolling && (
        <p className="text-gray-600 font-medium animate-pulse">Rolling...</p>
      )}
    </div>
  );
}

interface DiceFaceProps {
  value: number;
  showPips: boolean;
  color: string;
  size: number;
  transform: string;
}

function DiceFace({ value, showPips, color, size, transform }: DiceFaceProps) {
  const pips = PIP_LAYOUTS[Math.min(value, 6)] || PIP_LAYOUTS[1];
  const pipSize = size * 0.15;

  return (
    <div
      className="absolute flex items-center justify-center rounded-lg border-2 border-white/20"
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        transform,
        backfaceVisibility: 'hidden',
        boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.3), inset 0 -2px 4px rgba(0,0,0,0.2)',
      }}
    >
      {showPips ? (
        // Show pips
        <div className="relative w-full h-full">
          {pips.map((pip, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white shadow-inner"
              style={{
                width: pipSize,
                height: pipSize,
                left: `${pip.x}%`,
                top: `${pip.y}%`,
                transform: 'translate(-50%, -50%)',
                boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.3)',
              }}
            />
          ))}
        </div>
      ) : (
        // Show number
        <span
          className="font-black text-white"
          style={{
            fontSize: size * 0.5,
            textShadow: '0 2px 4px rgba(0,0,0,0.3)',
          }}
        >
          {value}
        </span>
      )}
    </div>
  );
}
