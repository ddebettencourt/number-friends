import { useState, useEffect, useCallback, useRef, useMemo, forwardRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Text, RoundedBox } from '@react-three/drei';
import { Physics, RigidBody, CuboidCollider, type RapierRigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { motion } from 'framer-motion';
import type { DiceType } from '../../types/game';
import { DICE_CONFIG, rollDice } from '../../utils/diceLogic';
import { soundEngine } from '../../utils/soundEngine';

// Maps d6 face index (1-6) to prime value displayed on that face
// Based on PrimeDice label positions: front→2, right→3, top→5, bottom→7, left→11, back→13
const PRIME_FACE_MAP: Record<number, number> = { 1: 2, 2: 3, 3: 5, 4: 7, 5: 11, 6: 13 };

interface DiceRollerProps {
  diceType: DiceType;
  onRollComplete: (result: number) => void;
  disabled?: boolean;
}

export function DiceRoller({ diceType, onRollComplete, disabled }: DiceRollerProps) {
  const [isRolling, setIsRolling] = useState(false);
  const [rollKey, setRollKey] = useState(0);
  const [displayedResult, setDisplayedResult] = useState<number | null>(null);
  const [dicePosition, setDicePosition] = useState<THREE.Vector3 | null>(null);
  const [isSettled, setIsSettled] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const config = DICE_CONFIG[diceType];

  const handleRollComplete = useCallback((faceValue: number, position: THREE.Vector3) => {
    // Clear the timeout fallback since physics settled naturally
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    setDicePosition(position);
    setIsSettled(true);
    setDisplayedResult(faceValue);
    soundEngine.diceResult();
    // Delay callback slightly for camera zoom effect
    setTimeout(() => {
      setIsRolling(false);
      onRollComplete(faceValue);
    }, 600);
  }, [onRollComplete]);

  const handleClick = useCallback(() => {
    if (disabled || isRolling || displayedResult !== null) return;

    soundEngine.diceRoll();
    setIsRolling(true);
    setIsSettled(false);
    setDicePosition(null);
    setDisplayedResult(null);
    setRollKey(prev => prev + 1);

    // Fallback timeout: if physics doesn't settle in 4 seconds, force resolve
    // Uses rollDice() as emergency value since we can't read the physics face from here
    const fallbackResult = rollDice(diceType);
    timeoutRef.current = setTimeout(() => {
      setIsSettled(true);
      setDisplayedResult(fallbackResult);
      setTimeout(() => {
        setIsRolling(false);
        onRollComplete(fallbackResult);
      }, 300);
    }, 4000);
  }, [disabled, isRolling, displayedResult, diceType, onRollComplete]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div className="flex flex-col items-center gap-4">
      {/* 3D Dice Box */}
      <div
        className="cursor-pointer rounded-2xl overflow-hidden select-none max-w-[300px] w-full aspect-square"
        onClick={handleClick}
        style={{
          width: 300,
          height: 300,
          background: 'linear-gradient(145deg, #2d1b0e 0%, #1a0f06 100%)',
          boxShadow: `inset 0 2px 10px rgba(0,0,0,0.5), 0 4px 20px rgba(0,0,0,0.3), 0 0 40px ${config.color}20`,
        }}
      >
        <Canvas camera={{ position: [0, 5, 5], fov: 45 }} shadows>
          <ambientLight intensity={0.4} />
          <directionalLight position={[5, 10, 5]} intensity={1.5} castShadow />
          <directionalLight position={[-3, 5, -3]} intensity={0.3} />
          {/* Warm fill light */}
          <pointLight position={[0, 3, 3]} intensity={0.3} color="#ffeedd" />
          <pointLight position={[0, 8, 0]} intensity={0.4} color={config.color} />
          {/* Subtle rim light */}
          <directionalLight position={[-5, 3, -5]} intensity={0.2} color="#aaccff" />
          <CameraController dicePosition={dicePosition} isSettled={isSettled} />
          <Physics gravity={[0, -35, 0]} key={rollKey}>
            <DiceBox3D />
            <PhysicsDice
              diceType={diceType}
              color={config.color}
              isRolling={isRolling}
              onSettled={handleRollComplete}
            />
          </Physics>
          {/* Game uses the physical face value directly — what you see is what you get */}
        </Canvas>
      </div>

      {/* Dice type label */}
      <div
        className="px-4 py-1.5 rounded-lg font-bold text-white text-sm"
        style={{
          fontFamily: "'Bangers', sans-serif",
          background: config.color,
          boxShadow: `0 3px 0 ${adjustColor(config.color, -40)}, 0 0 15px ${config.color}40`,
          letterSpacing: '0.05em',
        }}
      >
        {config.name}
      </div>

      {/* Result / Instructions */}
      <div className="text-center h-10">
        {!isRolling && displayedResult === null && !disabled && (
          <motion.p
            className="text-[var(--color-text-secondary)] font-medium"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            Tap to roll!
          </motion.p>
        )}
        {isRolling && !displayedResult && (
          <motion.p
            className="text-[var(--color-text-muted)] font-medium"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 0.5, repeat: Infinity, ease: "easeInOut" }}
          >
            Rolling...
          </motion.p>
        )}
        {displayedResult !== null && (
          <motion.p
            className="font-bold text-xl"
            style={{ fontFamily: "'Bangers', sans-serif", color: config.color }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          >
            You rolled {displayedResult}!
          </motion.p>
        )}
      </div>
    </div>
  );
}

function adjustColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
  const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

// Camera controller for zoom effect
function CameraController({ dicePosition, isSettled }: { dicePosition: THREE.Vector3 | null; isSettled: boolean }) {
  const { camera } = useThree();
  const defaultPos = useRef(new THREE.Vector3(0, 5, 5));
  const targetPos = useRef(new THREE.Vector3(0, 5, 5));
  const targetLookAt = useRef(new THREE.Vector3(0, -1.5, 0));

  useFrame(() => {
    if (isSettled && dicePosition) {
      targetPos.current.set(
        dicePosition.x * 0.3,
        dicePosition.y + 3,
        dicePosition.z * 0.3 + 1.2
      );
      targetLookAt.current.copy(dicePosition);
    } else {
      targetPos.current.copy(defaultPos.current);
      targetLookAt.current.set(0, -1.5, 0);
    }
    camera.position.lerp(targetPos.current, 0.12);
    camera.lookAt(targetLookAt.current);
  });

  return null;
}

// 3D Box / tray for dice - wooden tray aesthetic
function DiceBox3D() {
  const wallThickness = 0.15;
  const boxSize = 6;
  const wallHeight = 4;

  return (
    <group position={[0, -1.5, 0]}>
      {/* Floor - warm wood */}
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[boxSize / 2, wallThickness / 2, boxSize / 2]} position={[0, 0, 0]} />
        <mesh receiveShadow position={[0, 0, 0]}>
          <boxGeometry args={[boxSize, wallThickness, boxSize]} />
          <meshStandardMaterial color="#8B6F47" roughness={0.85} metalness={0.05} />
        </mesh>
      </RigidBody>

      {/* Felt surface - richer green */}
      <mesh position={[0, 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[boxSize - 0.3, boxSize - 0.3]} />
        <meshStandardMaterial color="#2d6a4f" roughness={1.0} />
      </mesh>

      {/* Back wall - darker wood */}
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[boxSize / 2, wallHeight / 2, wallThickness / 2]} position={[0, wallHeight / 2, -boxSize / 2]} />
        <mesh receiveShadow position={[0, wallHeight / 2, -boxSize / 2]}>
          <boxGeometry args={[boxSize, wallHeight, wallThickness]} />
          <meshStandardMaterial color="#6B4226" transparent opacity={0.4} roughness={0.8} />
        </mesh>
      </RigidBody>

      {/* Front wall (invisible) */}
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[boxSize / 2, wallHeight / 2, wallThickness / 2]} position={[0, wallHeight / 2, boxSize / 2]} />
      </RigidBody>

      {/* Left wall - darker wood */}
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[wallThickness / 2, wallHeight / 2, boxSize / 2]} position={[-boxSize / 2, wallHeight / 2, 0]} />
        <mesh receiveShadow position={[-boxSize / 2, wallHeight / 2, 0]}>
          <boxGeometry args={[wallThickness, wallHeight, boxSize]} />
          <meshStandardMaterial color="#6B4226" transparent opacity={0.4} roughness={0.8} />
        </mesh>
      </RigidBody>

      {/* Right wall - darker wood */}
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[wallThickness / 2, wallHeight / 2, boxSize / 2]} position={[boxSize / 2, wallHeight / 2, 0]} />
        <mesh receiveShadow position={[boxSize / 2, wallHeight / 2, 0]}>
          <boxGeometry args={[wallThickness, wallHeight, boxSize]} />
          <meshStandardMaterial color="#6B4226" transparent opacity={0.4} roughness={0.8} />
        </mesh>
      </RigidBody>
    </group>
  );
}

// Helper to get d6 top face
function getD6TopFace(quaternion: THREE.Quaternion): number {
  const faceNormals = [
    { face: 1, normal: new THREE.Vector3(0, 0, 1) },
    { face: 6, normal: new THREE.Vector3(0, 0, -1) },
    { face: 2, normal: new THREE.Vector3(1, 0, 0) },
    { face: 5, normal: new THREE.Vector3(-1, 0, 0) },
    { face: 3, normal: new THREE.Vector3(0, 1, 0) },
    { face: 4, normal: new THREE.Vector3(0, -1, 0) },
  ];

  const upVector = new THREE.Vector3(0, 1, 0);
  let maxDot = -Infinity;
  let topFace = 1;

  for (const { face, normal } of faceNormals) {
    const rotatedNormal = normal.clone().applyQuaternion(quaternion);
    const dot = rotatedNormal.dot(upVector);
    if (dot > maxDot) {
      maxDot = dot;
      topFace = face;
    }
  }

  return topFace;
}

// Helper to get d4 bottom face
function getD4BottomFace(quaternion: THREE.Quaternion): number {
  const h = Math.sqrt(2 / 3);
  const faceNormals = [
    { face: 1, normal: new THREE.Vector3(0, -1, 0).normalize() },
    { face: 2, normal: new THREE.Vector3(0, 0.333, h).normalize() },
    { face: 3, normal: new THREE.Vector3(h * 0.866, 0.333, -h * 0.5).normalize() },
    { face: 4, normal: new THREE.Vector3(-h * 0.866, 0.333, -h * 0.5).normalize() },
  ];

  const downVector = new THREE.Vector3(0, -1, 0);
  let maxDot = -Infinity;
  let bottomFace = 1;

  for (const { face, normal } of faceNormals) {
    const rotatedNormal = normal.clone().applyQuaternion(quaternion);
    const dot = rotatedNormal.dot(downVector);
    if (dot > maxDot) {
      maxDot = dot;
      bottomFace = face;
    }
  }

  return bottomFace;
}

// Helper to get d8 top face
function getD8TopFace(quaternion: THREE.Quaternion): number {
  const s = 1 / Math.sqrt(3);
  const faceNormals = [
    { face: 1, normal: new THREE.Vector3(s, s, s) },
    { face: 2, normal: new THREE.Vector3(-s, s, s) },
    { face: 3, normal: new THREE.Vector3(s, s, -s) },
    { face: 4, normal: new THREE.Vector3(-s, s, -s) },
    { face: 5, normal: new THREE.Vector3(s, -s, s) },
    { face: 6, normal: new THREE.Vector3(-s, -s, s) },
    { face: 7, normal: new THREE.Vector3(s, -s, -s) },
    { face: 8, normal: new THREE.Vector3(-s, -s, -s) },
  ];

  const upVector = new THREE.Vector3(0, 1, 0);
  let maxDot = -Infinity;
  let topFace = 1;

  for (const { face, normal } of faceNormals) {
    const rotatedNormal = normal.clone().applyQuaternion(quaternion);
    const dot = rotatedNormal.dot(upVector);
    if (dot > maxDot) {
      maxDot = dot;
      topFace = face;
    }
  }

  return topFace;
}

// Helper to get d10 top face (pentagonal trapezohedron)
function getD10TopFace(quaternion: THREE.Quaternion): number {
  const scale = 0.65;

  // Recreate the 10 equator vertices + 2 poles (same as D10Dice geometry)
  const verts: THREE.Vector3[] = [];
  for (let i = 0; i < 10; i++) {
    const angle = (i * Math.PI * 2) / 10;
    verts.push(new THREE.Vector3(
      Math.cos(angle) * scale,
      Math.sin(angle) * scale,
      0.105 * scale * (i % 2 ? 1 : -1)
    ));
  }
  verts.push(new THREE.Vector3(0, 0, -1 * scale));  // vertex 10 (bottom pole)
  verts.push(new THREE.Vector3(0, 0, 1 * scale));   // vertex 11 (top pole)

  // Only the first 10 triangular faces (connected to poles) carry labels 1-10
  const faceIndices = [
    [5, 7, 11], [7, 9, 11], [9, 1, 11], [1, 3, 11], [3, 5, 11],
    [4, 2, 10], [2, 0, 10], [0, 8, 10], [8, 6, 10], [6, 4, 10],
  ];

  // The D10 group has rotation={[Math.PI / 2, 0, 0]} baked in
  const baseRotation = new THREE.Quaternion().setFromEuler(
    new THREE.Euler(Math.PI / 2, 0, 0)
  );
  const combinedQuat = quaternion.clone().multiply(baseRotation);

  const upVector = new THREE.Vector3(0, 1, 0);
  let maxDot = -Infinity;
  let topFace = 1;

  for (let f = 0; f < 10; f++) {
    const [i1, i2, i3] = faceIndices[f];
    const v1 = verts[i1];
    const v2 = verts[i2];
    const v3 = verts[i3];

    const edge1 = new THREE.Vector3().subVectors(v2, v1);
    const edge2 = new THREE.Vector3().subVectors(v3, v1);
    const normal = new THREE.Vector3().crossVectors(edge1, edge2).normalize();

    const center = new THREE.Vector3().add(v1).add(v2).add(v3).divideScalar(3);
    if (normal.dot(center) < 0) normal.negate();

    const rotatedNormal = normal.clone().applyQuaternion(combinedQuat);
    const dot = rotatedNormal.dot(upVector);
    if (dot > maxDot) {
      maxDot = dot;
      topFace = f + 1;
    }
  }

  return topFace;
}

// Physics dice component
interface PhysicsDiceProps {
  diceType: DiceType;
  color: string;
  isRolling: boolean;
  onSettled: (faceValue: number, position: THREE.Vector3) => void;
}

function PhysicsDice({ diceType, color, isRolling, onSettled }: PhysicsDiceProps) {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const hasSettled = useRef(false);
  const settleCheckCount = useRef(0);

  useEffect(() => {
    if (isRolling && rigidBodyRef.current) {
      hasSettled.current = false;
      settleCheckCount.current = 0;

      const startX = (Math.random() - 0.5) * 1.5;
      const startZ = (Math.random() - 0.5) * 1.5;

      // D4 drops from higher for more bounce
      const startY = diceType === 'd4' ? 7 : 5;

      rigidBodyRef.current.setTranslation({ x: startX, y: startY, z: startZ }, true);
      rigidBodyRef.current.setRotation(
        new THREE.Quaternion().setFromEuler(
          new THREE.Euler(
            Math.random() * Math.PI * 2,
            Math.random() * Math.PI * 2,
            Math.random() * Math.PI * 2
          )
        ),
        true
      );

      // Moderate velocity for satisfying but fast settling
      rigidBodyRef.current.setLinvel({
        x: (Math.random() - 0.5) * 8,
        y: -3,
        z: (Math.random() - 0.5) * 8
      }, true);

      // D4 gets more spin for better tumbling
      const angVelMax = diceType === 'd4' ? 40 : 25;
      rigidBodyRef.current.setAngvel({
        x: (Math.random() - 0.5) * angVelMax,
        y: (Math.random() - 0.5) * angVelMax,
        z: (Math.random() - 0.5) * angVelMax
      }, true);
    }
  }, [isRolling, diceType]);

  useFrame(() => {
    if (!isRolling || hasSettled.current || !rigidBodyRef.current) return;

    const linvel = rigidBodyRef.current.linvel();
    const angvel = rigidBodyRef.current.angvel();

    const linearSpeed = Math.sqrt(linvel.x ** 2 + linvel.y ** 2 + linvel.z ** 2);
    const angularSpeed = Math.sqrt(angvel.x ** 2 + angvel.y ** 2 + angvel.z ** 2);

    if (linearSpeed < 0.15 && angularSpeed < 0.15) {
      settleCheckCount.current++;
      if (settleCheckCount.current > 20) {
        hasSettled.current = true;
        const rotation = rigidBodyRef.current.rotation();
        const quaternion = new THREE.Quaternion(rotation.x, rotation.y, rotation.z, rotation.w);
        const pos = rigidBodyRef.current.translation();
        const position = new THREE.Vector3(pos.x, pos.y, pos.z);

        // Read the actual face showing on top (or bottom for d4)
        let faceValue: number;
        switch (diceType) {
          case 'd4':
            faceValue = getD4BottomFace(quaternion);
            break;
          case 'd6':
          case 'gaussian':
            faceValue = getD6TopFace(quaternion);
            break;
          case 'prime':
            // Map d6 face index (1-6) to the prime number on that face
            faceValue = PRIME_FACE_MAP[getD6TopFace(quaternion)] || 2;
            break;
          case 'd8':
            faceValue = getD8TopFace(quaternion);
            break;
          case 'd10':
            faceValue = getD10TopFace(quaternion);
            break;
          default:
            faceValue = getD6TopFace(quaternion);
        }

        onSettled(faceValue, position);
      }
    } else {
      settleCheckCount.current = 0;
    }
  });

  const threeColor = new THREE.Color(color);

  // D4 gets more bounce and less friction for better tumbling
  const physicsProps = diceType === 'd4'
    ? { restitution: 0.5, friction: 0.5 }
    : { restitution: 0.3, friction: 0.8 };

  switch (diceType) {
    case 'd4':
      return (
        <RigidBody ref={rigidBodyRef} colliders="hull" {...physicsProps}>
          <TetrahedronDice color={threeColor} />
        </RigidBody>
      );
    case 'd6':
      return (
        <RigidBody ref={rigidBodyRef} colliders="cuboid" {...physicsProps}>
          <CubeDice color={threeColor} />
        </RigidBody>
      );
    case 'd8':
      return (
        <RigidBody ref={rigidBodyRef} colliders="hull" {...physicsProps}>
          <OctahedronDice color={threeColor} />
        </RigidBody>
      );
    case 'd10':
      return (
        <RigidBody ref={rigidBodyRef} colliders="hull" {...physicsProps}>
          <D10Dice color={threeColor} />
        </RigidBody>
      );
    case 'prime':
      return (
        <RigidBody ref={rigidBodyRef} colliders="cuboid" {...physicsProps}>
          <PrimeDice color={threeColor} />
        </RigidBody>
      );
    case 'gaussian':
      return (
        <RigidBody ref={rigidBodyRef} colliders="cuboid" {...physicsProps}>
          <GaussianDice color={threeColor} />
        </RigidBody>
      );
    default:
      return (
        <RigidBody ref={rigidBodyRef} colliders="cuboid" {...physicsProps}>
          <CubeDice color={threeColor} />
        </RigidBody>
      );
  }
}

// D4 - Tetrahedron
const TetrahedronDice = forwardRef<THREE.Group, { color: THREE.Color }>(
  ({ color }, ref) => {
    const size = 0.9;
    const faces = [
      { num: 1, pos: [0, -size * 0.33, 0] as [number, number, number], rot: [Math.PI / 2, 0, 0] as [number, number, number] },
      { num: 2, pos: [0, size * 0.11, size * 0.47] as [number, number, number], rot: [-0.34, 0, 0] as [number, number, number] },
      { num: 3, pos: [size * 0.41, size * 0.11, -size * 0.24] as [number, number, number], rot: [-0.34, (2 * Math.PI) / 3, 0] as [number, number, number] },
      { num: 4, pos: [-size * 0.41, size * 0.11, -size * 0.24] as [number, number, number], rot: [-0.34, -(2 * Math.PI) / 3, 0] as [number, number, number] },
    ];

    return (
      <group ref={ref}>
        <mesh castShadow>
          <tetrahedronGeometry args={[size]} />
          <meshStandardMaterial color={color} flatShading roughness={0.15} metalness={0.35} />
        </mesh>
        {faces.map(({ num, pos, rot }) => (
          <Text key={num} position={pos} rotation={rot} fontSize={0.28} color="white" anchorX="center" anchorY="middle" outlineWidth={0.025} outlineColor="black">
            {num}
          </Text>
        ))}
      </group>
    );
  }
);

// D6 - Rounded Cube with pips
const CubeDice = forwardRef<THREE.Group, { color: THREE.Color }>(
  ({ color }, ref) => {
    return (
      <group ref={ref}>
        <RoundedBox args={[1, 1, 1]} radius={0.08} smoothness={4} castShadow>
          <meshStandardMaterial color={color} roughness={0.15} metalness={0.35} />
        </RoundedBox>
        <DicePipsFace face="front" value={1} />
        <DicePipsFace face="back" value={6} />
        <DicePipsFace face="right" value={2} />
        <DicePipsFace face="left" value={5} />
        <DicePipsFace face="top" value={3} />
        <DicePipsFace face="bottom" value={4} />
      </group>
    );
  }
);

// Prime dice - Rounded cube with prime numbers
const PrimeDice = forwardRef<THREE.Group, { color: THREE.Color }>(
  ({ color }, ref) => {
    return (
      <group ref={ref}>
        <RoundedBox args={[1, 1, 1]} radius={0.08} smoothness={4} castShadow>
          <meshStandardMaterial color={color} roughness={0.15} metalness={0.35} />
        </RoundedBox>
        <Text position={[0, 0, 0.501]} fontSize={0.45} color="white" anchorX="center" anchorY="middle" outlineWidth={0.02} outlineColor="black">2</Text>
        <Text position={[0.501, 0, 0]} rotation={[0, Math.PI / 2, 0]} fontSize={0.45} color="white" anchorX="center" anchorY="middle" outlineWidth={0.02} outlineColor="black">3</Text>
        <Text position={[0, 0.501, 0]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.45} color="white" anchorX="center" anchorY="middle" outlineWidth={0.02} outlineColor="black">5</Text>
        <Text position={[0, -0.501, 0]} rotation={[Math.PI / 2, 0, 0]} fontSize={0.45} color="white" anchorX="center" anchorY="middle" outlineWidth={0.02} outlineColor="black">7</Text>
        <Text position={[-0.501, 0, 0]} rotation={[0, -Math.PI / 2, 0]} fontSize={0.4} color="white" anchorX="center" anchorY="middle" outlineWidth={0.02} outlineColor="black">11</Text>
        <Text position={[0, 0, -0.501]} rotation={[0, Math.PI, 0]} fontSize={0.4} color="white" anchorX="center" anchorY="middle" outlineWidth={0.02} outlineColor="black">13</Text>
      </group>
    );
  }
);

// Gaussian dice - Rounded cube with bell curve symbol
const GaussianDice = forwardRef<THREE.Group, { color: THREE.Color }>(
  ({ color }, ref) => {
    return (
      <group ref={ref}>
        <RoundedBox args={[1, 1, 1]} radius={0.08} smoothness={4} castShadow>
          <meshStandardMaterial color={color} roughness={0.15} metalness={0.35} />
        </RoundedBox>
        {/* Show bell curve symbol on faces since values are dynamic */}
        <Text position={[0, 0, 0.501]} fontSize={0.35} color="white" anchorX="center" anchorY="middle" outlineWidth={0.02} outlineColor="black">~</Text>
        <Text position={[0.501, 0, 0]} rotation={[0, Math.PI / 2, 0]} fontSize={0.35} color="white" anchorX="center" anchorY="middle" outlineWidth={0.02} outlineColor="black">~</Text>
        <Text position={[0, 0.501, 0]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.35} color="white" anchorX="center" anchorY="middle" outlineWidth={0.02} outlineColor="black">~</Text>
        <Text position={[0, -0.501, 0]} rotation={[Math.PI / 2, 0, 0]} fontSize={0.35} color="white" anchorX="center" anchorY="middle" outlineWidth={0.02} outlineColor="black">~</Text>
        <Text position={[-0.501, 0, 0]} rotation={[0, -Math.PI / 2, 0]} fontSize={0.35} color="white" anchorX="center" anchorY="middle" outlineWidth={0.02} outlineColor="black">~</Text>
        <Text position={[0, 0, -0.501]} rotation={[0, Math.PI, 0]} fontSize={0.35} color="white" anchorX="center" anchorY="middle" outlineWidth={0.02} outlineColor="black">~</Text>
      </group>
    );
  }
);

// Pips for d6 faces - dark recessed pips
function DicePipsFace({ face, value }: { face: 'front' | 'back' | 'left' | 'right' | 'top' | 'bottom'; value: number }) {
  const pipPositions: Record<number, [number, number][]> = {
    1: [[0, 0]],
    2: [[-0.25, 0.25], [0.25, -0.25]],
    3: [[-0.25, 0.25], [0, 0], [0.25, -0.25]],
    4: [[-0.25, 0.25], [0.25, 0.25], [-0.25, -0.25], [0.25, -0.25]],
    5: [[-0.25, 0.25], [0.25, 0.25], [0, 0], [-0.25, -0.25], [0.25, -0.25]],
    6: [[-0.25, 0.25], [0.25, 0.25], [-0.25, 0], [0.25, 0], [-0.25, -0.25], [0.25, -0.25]],
  };

  const positions = pipPositions[value] || pipPositions[1];

  const getPosition = (x: number, y: number): [number, number, number] => {
    switch (face) {
      case 'front': return [x, y, 0.501];
      case 'back': return [-x, y, -0.501];
      case 'right': return [0.501, y, -x];
      case 'left': return [-0.501, y, x];
      case 'top': return [x, 0.501, -y];
      case 'bottom': return [x, -0.501, y];
    }
  };

  return (
    <>
      {positions.map(([x, y], i) => (
        <mesh key={i} position={getPosition(x, y)}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.8} />
        </mesh>
      ))}
    </>
  );
}

// D8 - Octahedron
const OctahedronDice = forwardRef<THREE.Group, { color: THREE.Color }>(
  ({ color }, ref) => {
    const r = 0.7;
    const d = r / Math.sqrt(3) * 0.7;

    const faces = [
      { num: 1, pos: [d, d, d], rot: [-0.615, 0.785, 0] },
      { num: 2, pos: [-d, d, d], rot: [-0.615, -0.785, 0] },
      { num: 3, pos: [d, d, -d], rot: [-0.615, 2.356, 0] },
      { num: 4, pos: [-d, d, -d], rot: [-0.615, -2.356, 0] },
      { num: 5, pos: [d, -d, d], rot: [0.615, 0.785, 0] },
      { num: 6, pos: [-d, -d, d], rot: [0.615, -0.785, 0] },
      { num: 7, pos: [d, -d, -d], rot: [0.615, 2.356, 0] },
      { num: 8, pos: [-d, -d, -d], rot: [0.615, -2.356, 0] },
    ];

    return (
      <group ref={ref}>
        <mesh castShadow>
          <octahedronGeometry args={[r]} />
          <meshStandardMaterial color={color} flatShading roughness={0.15} metalness={0.35} />
        </mesh>
        {faces.map(({ num, pos, rot }) => (
          <Text key={num} position={pos as [number, number, number]} rotation={rot as [number, number, number]} fontSize={0.22} color="white" anchorX="center" anchorY="middle" outlineWidth={0.02} outlineColor="black">
            {num}
          </Text>
        ))}
      </group>
    );
  }
);

// D10 - Custom pentagonal trapezohedron geometry
const D10Dice = forwardRef<THREE.Group, { color: THREE.Color }>(
  ({ color }, ref) => {
    const scale = 0.65;

    const vertices = useMemo(() => {
      const verts: THREE.Vector3[] = [];
      for (let i = 0; i < 10; i++) {
        const angle = (i * Math.PI * 2) / 10;
        verts.push(new THREE.Vector3(
          Math.cos(angle) * scale,
          Math.sin(angle) * scale,
          0.105 * scale * (i % 2 ? 1 : -1)
        ));
      }
      verts.push(new THREE.Vector3(0, 0, -1 * scale));
      verts.push(new THREE.Vector3(0, 0, 1 * scale));
      return verts;
    }, []);

    const faceIndices = [
      [5, 7, 11], [7, 9, 11], [9, 1, 11], [1, 3, 11], [3, 5, 11],
      [4, 2, 10], [2, 0, 10], [0, 8, 10], [8, 6, 10], [6, 4, 10],
      [1, 0, 2], [1, 2, 3], [3, 2, 4], [3, 4, 5], [5, 4, 6],
      [5, 6, 7], [7, 6, 8], [7, 8, 9], [9, 8, 0], [9, 0, 1],
    ];

    const geometry = useMemo(() => {
      const positions: number[] = [];
      const normals: number[] = [];

      for (const [i1, i2, i3] of faceIndices) {
        const v1 = vertices[i1];
        const v2 = vertices[i2];
        const v3 = vertices[i3];

        const edge1 = new THREE.Vector3().subVectors(v2, v1);
        const edge2 = new THREE.Vector3().subVectors(v3, v1);
        const normal = new THREE.Vector3().crossVectors(edge1, edge2).normalize();

        const center = new THREE.Vector3().add(v1).add(v2).add(v3).divideScalar(3);
        if (normal.dot(center) < 0) {
          normal.negate();
          positions.push(v1.x, v1.y, v1.z, v3.x, v3.y, v3.z, v2.x, v2.y, v2.z);
        } else {
          positions.push(v1.x, v1.y, v1.z, v2.x, v2.y, v2.z, v3.x, v3.y, v3.z);
        }
        normals.push(normal.x, normal.y, normal.z, normal.x, normal.y, normal.z, normal.x, normal.y, normal.z);
      }

      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
      return geo;
    }, [vertices]);

    const faceData = useMemo(() => {
      const faces: { num: number; center: THREE.Vector3; normal: THREE.Vector3 }[] = [];

      for (let f = 0; f < 10; f++) {
        const [i1, i2, i3] = faceIndices[f];
        const v1 = vertices[i1];
        const v2 = vertices[i2];
        const v3 = vertices[i3];

        const center = new THREE.Vector3().add(v1).add(v2).add(v3).divideScalar(3);
        const edge1 = new THREE.Vector3().subVectors(v2, v1);
        const edge2 = new THREE.Vector3().subVectors(v3, v1);
        const normal = new THREE.Vector3().crossVectors(edge1, edge2).normalize();
        if (normal.dot(center) < 0) normal.negate();

        faces.push({ num: f + 1, center, normal });
      }

      return faces;
    }, [vertices]);

    return (
      <group ref={ref} rotation={[Math.PI / 2, 0, 0]}>
        <mesh castShadow geometry={geometry}>
          <meshStandardMaterial color={color} flatShading roughness={0.15} metalness={0.35} />
        </mesh>
        {faceData.map(({ num, center, normal }) => {
          const labelPos = center.clone().add(normal.clone().multiplyScalar(0.02));
          const quaternion = new THREE.Quaternion();
          quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
          const euler = new THREE.Euler().setFromQuaternion(quaternion);

          return (
            <Text
              key={num}
              position={[labelPos.x, labelPos.y, labelPos.z]}
              rotation={[euler.x, euler.y, euler.z]}
              fontSize={0.28}
              color="white"
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.03}
              outlineColor="black"
            >
              {num}
            </Text>
          );
        })}
      </group>
    );
  }
);
