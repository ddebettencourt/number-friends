import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useGameStore, type AIDifficulty } from '../../stores/gameStore';
import { useStatsStore } from '../../stores/statsStore';
import { PassToPlayer } from './PassToPlayer';

type Operator = '+' | '-' | '*' | '/';
type Token = { type: 'number'; value: number; originalIndex: number } | { type: 'operator'; value: Operator } | { type: 'paren'; value: '(' | ')' };

interface PlayerResult {
  playerId: string;
  playerName: string;
  expression: string;
  result: number;
  difference: number;
  isAI: boolean;
  aiDifficulty?: AIDifficulty;
  hasFinished: boolean;
}

// Safely evaluate an expression string with parentheses
function safeEvaluate(expr: string): number | null {
  if (!/^[\d+\-*/().\s]+$/.test(expr)) return null;
  try {
    const result = new Function(`return (${expr})`)();
    if (typeof result !== 'number' || !isFinite(result)) return null;
    return result;
  } catch {
    return null;
  }
}

// Build expression string from tokens
function tokensToString(tokens: Token[]): string {
  return tokens.map(t => {
    if (t.type === 'number') return t.value.toString();
    return t.value;
  }).join(' ');
}

// Format for display (replace * and / with symbols)
function formatForDisplay(expr: string): string {
  return expr.replace(/\*/g, '\u00D7').replace(/\//g, '\u00F7');
}

// Check if expression uses all 4 numbers exactly once
function usesAllNumbers(tokens: Token[]): boolean {
  const usedIndices = tokens
    .filter((t): t is Token & { type: 'number' } => t.type === 'number')
    .map(t => t.originalIndex);

  if (usedIndices.length !== 4) return false;
  const sorted = [...usedIndices].sort();
  return sorted.every((v, i) => v === i);
}

// Legacy format expression for AI (4 numbers, 3 operators)
function formatExpression(numbers: (number | null)[], operators: (Operator | null)[]): string {
  let expr = '';
  for (let i = 0; i < 4; i++) {
    expr += numbers[i] !== null ? numbers[i] : '?';
    if (i < 3) {
      expr += ` ${operators[i] || '_'} `;
    }
  }
  return expr;
}

// Legacy evaluate for AI
function evaluateExpression(numbers: number[], operators: Operator[]): number | null {
  if (numbers.length !== 4 || operators.length !== 3) return null;

  try {
    let values = [...numbers];
    let ops = [...operators];

    let i = 0;
    while (i < ops.length) {
      if (ops[i] === '*' || ops[i] === '/') {
        const left = values[i];
        const right = values[i + 1];
        let result: number;

        if (ops[i] === '*') {
          result = left * right;
        } else {
          if (right === 0) return null;
          result = left / right;
        }

        values.splice(i, 2, result);
        ops.splice(i, 1);
      } else {
        i++;
      }
    }

    let result = values[0];
    for (let j = 0; j < ops.length; j++) {
      if (ops[j] === '+') {
        result += values[j + 1];
      } else {
        result -= values[j + 1];
      }
    }

    return result;
  } catch {
    return null;
  }
}

// Generate all permutations of an array
function permutations<T>(arr: T[]): T[][] {
  if (arr.length <= 1) return [arr];
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i++) {
    const rest = [...arr.slice(0, i), ...arr.slice(i + 1)];
    for (const perm of permutations(rest)) {
      result.push([arr[i], ...perm]);
    }
  }
  return result;
}

// Helper to apply a single operator
function applyOp(a: number, op: Operator, b: number): number | null {
  switch (op) {
    case '+': return a + b;
    case '-': return a - b;
    case '*': return a * b;
    case '/': return b === 0 ? null : a / b;
  }
}

// Find the best solution using all 4 numbers
function findOptimalSolution(numbers: number[], target: number): { expression: string; result: number; difference: number } | null {
  const operators: Operator[] = ['+', '-', '*', '/'];
  let bestSolution: { expression: string; result: number; difference: number } | null = null;
  let bestDiff = Infinity;

  for (const nums of permutations(numbers)) {
    for (const op1 of operators) {
      for (const op2 of operators) {
        for (const op3 of operators) {
          const ops: Operator[] = [op1, op2, op3];

          const result1 = evaluateExpression(nums, ops);
          if (result1 !== null) {
            const diff = Math.abs(target - result1);
            if (diff < bestDiff) {
              bestDiff = diff;
              bestSolution = {
                expression: `${nums[0]} ${op1} ${nums[1]} ${op2} ${nums[2]} ${op3} ${nums[3]}`,
                result: result1,
                difference: diff
              };
              if (diff === 0) return bestSolution;
            }
          }

          // Pattern: (a op1 b) op2 (c op3 d)
          const left1 = applyOp(nums[0], op1, nums[1]);
          const right1 = applyOp(nums[2], op3, nums[3]);
          if (left1 !== null && right1 !== null) {
            const result2 = applyOp(left1, op2, right1);
            if (result2 !== null) {
              const diff = Math.abs(target - result2);
              if (diff < bestDiff) {
                bestDiff = diff;
                bestSolution = {
                  expression: `(${nums[0]} ${op1} ${nums[1]}) ${op2} (${nums[2]} ${op3} ${nums[3]})`,
                  result: result2,
                  difference: diff
                };
                if (diff === 0) return bestSolution;
              }
            }
          }

          // Pattern: ((a op1 b) op2 c) op3 d
          const ab = applyOp(nums[0], op1, nums[1]);
          if (ab !== null) {
            const abc = applyOp(ab, op2, nums[2]);
            if (abc !== null) {
              const result3 = applyOp(abc, op3, nums[3]);
              if (result3 !== null) {
                const diff = Math.abs(target - result3);
                if (diff < bestDiff) {
                  bestDiff = diff;
                  bestSolution = {
                    expression: `((${nums[0]} ${op1} ${nums[1]}) ${op2} ${nums[2]}) ${op3} ${nums[3]}`,
                    result: result3,
                    difference: diff
                  };
                  if (diff === 0) return bestSolution;
                }
              }
            }
          }

          // Pattern: (a op1 (b op2 c)) op3 d
          const bc = applyOp(nums[1], op2, nums[2]);
          if (bc !== null) {
            const abc2 = applyOp(nums[0], op1, bc);
            if (abc2 !== null) {
              const result4 = applyOp(abc2, op3, nums[3]);
              if (result4 !== null) {
                const diff = Math.abs(target - result4);
                if (diff < bestDiff) {
                  bestDiff = diff;
                  bestSolution = {
                    expression: `(${nums[0]} ${op1} (${nums[1]} ${op2} ${nums[2]})) ${op3} ${nums[3]}`,
                    result: result4,
                    difference: diff
                  };
                  if (diff === 0) return bestSolution;
                }
              }
            }
          }

          // Pattern: a op1 ((b op2 c) op3 d)
          if (bc !== null) {
            const bcd = applyOp(bc, op3, nums[3]);
            if (bcd !== null) {
              const result5 = applyOp(nums[0], op1, bcd);
              if (result5 !== null) {
                const diff = Math.abs(target - result5);
                if (diff < bestDiff) {
                  bestDiff = diff;
                  bestSolution = {
                    expression: `${nums[0]} ${op1} ((${nums[1]} ${op2} ${nums[2]}) ${op3} ${nums[3]})`,
                    result: result5,
                    difference: diff
                  };
                  if (diff === 0) return bestSolution;
                }
              }
            }
          }

          // Pattern: a op1 (b op2 (c op3 d))
          const cd = applyOp(nums[2], op3, nums[3]);
          if (cd !== null) {
            const bcd2 = applyOp(nums[1], op2, cd);
            if (bcd2 !== null) {
              const result6 = applyOp(nums[0], op1, bcd2);
              if (result6 !== null) {
                const diff = Math.abs(target - result6);
                if (diff < bestDiff) {
                  bestDiff = diff;
                  bestSolution = {
                    expression: `${nums[0]} ${op1} (${nums[1]} ${op2} (${nums[2]} ${op3} ${nums[3]}))`,
                    result: result6,
                    difference: diff
                  };
                  if (diff === 0) return bestSolution;
                }
              }
            }
          }
        }
      }
    }
  }

  return bestSolution;
}

type Phase = 'pass' | 'playing' | 'ai_turn' | 'results';

export function NumberBuilder() {
  const { players, currentPlayerIndex, endMinigame, aiPlayers } = useGameStore();
  const triggeringPlayer = players[currentPlayerIndex];
  const target = triggeringPlayer.position;

  const [availableNumbers] = useState(() => {
    return Array.from({ length: 4 }, () => Math.floor(Math.random() * 12) + 1);
  });

  const [playerResults, setPlayerResults] = useState<PlayerResult[]>(() =>
    players.map((p) => ({
      playerId: p.id,
      playerName: p.name,
      expression: '',
      result: 0,
      difference: target,
      isAI: aiPlayers.has(p.id),
      aiDifficulty: aiPlayers.get(p.id),
      hasFinished: false,
    }))
  );

  const [activePlayerIndex, setActivePlayerIndex] = useState(0);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [timeLeft, setTimeLeft] = useState(45);
  const aiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [optimalSolution] = useState(() => findOptimalSolution(availableNumbers, target));

  // Determine initial phase
  const [phase, setPhase] = useState<Phase>(() => {
    const firstPlayer = players[0];
    if (aiPlayers.has(firstPlayer.id)) {
      return 'ai_turn';
    }
    return 'pass';
  });

  const activePlayer = players[activePlayerIndex];
  const activeResult = playerResults[activePlayerIndex];
  const isActiveAI = activeResult?.isAI;

  // Get used number indices from tokens
  const usedIndices = tokens
    .filter((t): t is Token & { type: 'number' } => t.type === 'number')
    .map(t => t.originalIndex);

  // Find next player
  const findNextPlayerIndex = (): number | null => {
    let nextIndex = activePlayerIndex + 1;
    while (nextIndex < players.length) {
      if (!playerResults[nextIndex].hasFinished) {
        return nextIndex;
      }
      nextIndex++;
    }
    return null;
  };

  // Move to next player or finish
  const moveToNextPlayer = () => {
    const nextIndex = findNextPlayerIndex();

    if (nextIndex === null) {
      setPhase('results');
    } else {
      setActivePlayerIndex(nextIndex);
      setTokens([]);
      setTimeLeft(45);

      const nextResult = playerResults[nextIndex];
      if (nextResult.isAI) {
        setPhase('ai_turn');
      } else {
        setPhase('pass');
      }
    }
  };

  // Timer countdown - only during playing phase
  useEffect(() => {
    if (phase !== 'playing' || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          submitCurrentAnswer();
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase, timeLeft]);

  // AI plays
  useEffect(() => {
    if (phase !== 'ai_turn' || !isActiveAI) return;

    const difficulty = activeResult.aiDifficulty || 'medium';
    let delay: number;

    if (difficulty === 'easy') {
      delay = 3000 + Math.random() * 3000;
    } else if (difficulty === 'medium') {
      delay = 2000 + Math.random() * 2000;
    } else {
      delay = 1000 + Math.random() * 1500;
    }

    aiTimerRef.current = setTimeout(() => {
      // AI builds an expression
      const ops: Operator[] = ['+', '-', '*', '/'];
      let bestExpr = { nums: [...availableNumbers], ops: [ops[0], ops[0], ops[0]] as Operator[], result: 0 };
      let bestDiff = Infinity;

      const attempts = difficulty === 'hard' ? 100 : difficulty === 'medium' ? 30 : 10;

      for (let i = 0; i < attempts; i++) {
        const tryNums = [...availableNumbers].sort(() => Math.random() - 0.5);
        const tryOps: Operator[] = [
          ops[Math.floor(Math.random() * ops.length)],
          ops[Math.floor(Math.random() * ops.length)],
          ops[Math.floor(Math.random() * ops.length)],
        ];

        const result = evaluateExpression(tryNums, tryOps);
        if (result !== null) {
          const diff = Math.abs(target - result);
          if (diff < bestDiff) {
            bestDiff = diff;
            bestExpr = { nums: tryNums, ops: tryOps, result };
          }
          if (diff === 0) break;
        }
      }

      const expression = formatExpression(bestExpr.nums, bestExpr.ops);

      setPlayerResults(prev => {
        const updated = [...prev];
        updated[activePlayerIndex] = {
          ...updated[activePlayerIndex],
          expression,
          result: bestExpr.result,
          difference: Math.abs(target - bestExpr.result),
          hasFinished: true,
        };
        return updated;
      });

      setTimeout(() => {
        moveToNextPlayer();
      }, 500);
    }, delay);

    return () => {
      if (aiTimerRef.current) {
        clearTimeout(aiTimerRef.current);
      }
    };
  }, [phase, activePlayerIndex, isActiveAI]);

  const submitCurrentAnswer = () => {
    const exprString = tokensToString(tokens);
    const evalResult = safeEvaluate(exprString);
    const result = evalResult !== null ? evalResult : 0;
    const expression = formatForDisplay(exprString);

    setPlayerResults(prev => {
      const updated = [...prev];
      updated[activePlayerIndex] = {
        ...updated[activePlayerIndex],
        expression,
        result,
        difference: Math.abs(target - result),
        hasFinished: true,
      };
      return updated;
    });

    setTimeout(() => {
      moveToNextPlayer();
    }, 500);
  };

  const handleNumberClick = (index: number) => {
    if (phase !== 'playing' || usedIndices.includes(index)) return;
    setTokens([...tokens, { type: 'number', value: availableNumbers[index], originalIndex: index }]);
  };

  const handleOperatorClick = (op: Operator) => {
    if (phase !== 'playing') return;
    setTokens([...tokens, { type: 'operator', value: op }]);
  };

  const handleParenClick = (paren: '(' | ')') => {
    if (phase !== 'playing') return;
    setTokens([...tokens, { type: 'paren', value: paren }]);
  };

  const handleBackspace = () => {
    if (phase !== 'playing' || tokens.length === 0) return;
    setTokens(tokens.slice(0, -1));
  };

  const handleClear = () => {
    setTokens([]);
  };

  const handleLockIn = () => {
    submitCurrentAnswer();
  };

  const handlePassReady = () => {
    setPhase('playing');
  };

  const handleContinue = () => {
    const finishedPlayers = playerResults.filter(p => p.hasFinished);
    const winner = finishedPlayers.length > 0
      ? finishedPlayers.reduce((a, b) => a.difference < b.difference ? a : b)
      : null;

    useStatsStore.getState().recordMinigame({
      turnNumber: useStatsStore.getState().stats.totalTurns,
      triggeringPlayerId: triggeringPlayer.id,
      minigameType: 'number_builder',
      data: {
        type: 'number_builder',
        target,
        availableNumbers,
        playerResults: playerResults.map(pr => ({
          playerId: pr.playerId,
          expression: pr.expression ?? '',
          result: pr.result ?? 0,
          difference: pr.difference ?? Infinity,
        })),
      },
    });

    if (winner?.playerId === triggeringPlayer.id) {
      if (winner.difference === 0) {
        endMinigame(5);
      } else if (winner.difference <= 3) {
        endMinigame(3);
      } else {
        endMinigame(1);
      }
    } else {
      endMinigame(0);
    }
  };

  const exprString = tokensToString(tokens);
  const currentResult = tokens.length > 0 ? safeEvaluate(exprString) : null;
  const allNumbersUsed = usesAllNumbers(tokens);

  // Pass screen
  if (phase === 'pass') {
    return (
      <PassToPlayer
        player={activePlayer}
        minigameName="Number Builder!"
        minigameDescription={`Use all 4 numbers to get as close to ${target} as possible!`}
        onReady={handlePassReady}
      />
    );
  }

  // AI playing
  if (phase === 'ai_turn') {
    return (
      <div className="game-card rounded-3xl p-6">
        <div className="text-center mb-4">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl piece-emerald flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-white">
              <path d="M12 4v16m-8-8h16" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
          </div>
          <h2 className="text-2xl font-black text-[var(--color-emerald)]">Number Builder!</h2>
          <p className="text-[var(--color-text-muted)]">Target: {target}</p>
        </div>

        <motion.div
          className="text-center p-8"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-xl wood-inset flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-[var(--color-wood-medium)]">
              <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
              <circle cx="9" cy="10" r="2" fill="currentColor" />
              <circle cx="15" cy="10" r="2" fill="currentColor" />
              <path d="M8 15h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <p className="text-[var(--color-text-secondary)] font-medium">
            {activePlayer?.name} is building...
          </p>
        </motion.div>

        <div className="text-center text-[var(--color-text-muted)] text-sm">
          {playerResults.filter(p => p.hasFinished).length} of {players.length} players done
        </div>
      </div>
    );
  }

  // Results
  if (phase === 'results') {
    const sortedResults = [...playerResults]
      .filter(p => p.hasFinished)
      .sort((a, b) => a.difference - b.difference);
    const winner = sortedResults[0];

    return (
      <motion.div
        className="game-card rounded-3xl p-6"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <div className="text-center mb-4">
          <div className="w-12 h-12 mx-auto mb-2 rounded-xl piece-emerald flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-white">
              <path d="M12 4v16m-8-8h16" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
          </div>
          <h2 className="text-2xl font-black text-[var(--color-emerald)]">Results</h2>
          <p className="text-[var(--color-text-secondary)]">
            Target was <span className="font-bold text-[var(--color-emerald)]">{target}</span>
          </p>
        </div>

        <div className="space-y-2 mb-6">
          {sortedResults.map((result, idx) => {
            const isWinner = idx === 0;
            return (
              <motion.div
                key={result.playerId}
                className="p-3 rounded-xl"
                style={
                  isWinner
                    ? {
                        background: 'linear-gradient(135deg, rgba(255, 217, 61, 0.25) 0%, rgba(255, 159, 67, 0.15) 100%)',
                        border: '2px solid rgba(255, 217, 61, 0.6)',
                        boxShadow: '0 0 15px rgba(255, 217, 61, 0.3)',
                      }
                    : result.difference === 0
                    ? {
                        background: 'rgba(152, 236, 101, 0.15)',
                        border: '1px solid rgba(152, 236, 101, 0.3)',
                      }
                    : {
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                      }
                }
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: idx * 0.1 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {isWinner && (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ color: '#ffd93d' }}>
                        <path d="M12 2l3 6 6 1-4.5 4 1.5 6-6-3-6 3 1.5-6L3 9l6-1 3-6z" fill="currentColor" />
                      </svg>
                    )}
                    <span className="font-bold text-[var(--color-text-primary)]">{result.playerName}</span>
                    {result.isAI && <span className="text-xs text-[var(--color-text-muted)]">AI</span>}
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-[var(--color-text-primary)]">
                      {Number.isInteger(result.result) ? result.result : result.result.toFixed(2)}
                    </div>
                    <div className={`text-xs ${result.difference === 0 ? 'text-[#98ec65]' : 'text-[var(--color-text-muted)]'}`}>
                      {result.difference === 0 ? 'Perfect!' : `off by ${result.difference.toFixed(Number.isInteger(result.difference) ? 0 : 2)}`}
                    </div>
                  </div>
                </div>
                <div className="mt-1 text-sm text-[var(--color-text-muted)] font-mono">{result.expression}</div>
              </motion.div>
            );
          })}
        </div>

        <div className="text-center text-[var(--color-text-secondary)] mb-4">
          {winner?.playerId === triggeringPlayer.id
            ? winner.difference === 0
              ? 'Perfect! You advance 5 spaces!'
              : winner.difference <= 3
              ? 'Close! You advance 3 spaces!'
              : 'You win! Advance 1 space.'
            : `${winner?.playerName} wins! You stay put.`}
        </div>

        {optimalSolution && (
          <motion.div
            className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4 mb-4 border border-[var(--color-amethyst)]/30"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="text-center">
              <div className="text-xs text-[var(--color-amethyst)] font-medium mb-1">
                {optimalSolution.difference === 0 ? 'Optimal Solution' : 'Best Possible'}
              </div>
              <div className="font-mono text-lg font-bold text-purple-800">
                {optimalSolution.expression.replace(/\*/g, '\u00D7').replace(/\//g, '\u00F7')} = {Number.isInteger(optimalSolution.result) ? optimalSolution.result : optimalSolution.result.toFixed(2)}
              </div>
            </div>
          </motion.div>
        )}

        <motion.button
          className="game-button w-full py-3 piece-emerald text-white font-bold text-lg rounded-xl"
          onClick={handleContinue}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Continue
        </motion.button>
      </motion.div>
    );
  }

  // Playing phase
  return (
    <div className="game-card rounded-3xl p-6">
      {/* Header with target and timer */}
      <div className="flex justify-between items-center mb-4">
        <div className="text-center">
          <div className="text-[var(--color-text-muted)] text-xs font-medium">TARGET</div>
          <div className="text-3xl font-black text-[var(--color-emerald)]">{target}</div>
        </div>

        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full wood-inset">
            <span className="font-bold text-sm text-[var(--color-text-primary)]">{activePlayer?.name}</span>
          </div>
        </div>

        <motion.div
          className={`text-4xl font-black ${timeLeft <= 10 ? 'text-[var(--color-ruby)]' : 'text-[var(--color-text-muted)]'}`}
          animate={timeLeft <= 10 ? { scale: [1, 1.1, 1] } : {}}
          transition={{ duration: 0.5, repeat: timeLeft <= 10 ? Infinity : 0 }}
        >
          {timeLeft}
        </motion.div>
      </div>

      {/* Expression builder */}
      <div className="wood-inset rounded-2xl p-4 mb-4">
        <div className="min-h-[52px] flex items-center justify-center gap-1 flex-wrap">
          {tokens.length === 0 ? (
            <span className="text-[var(--color-text-muted)] text-lg">Tap to build your expression...</span>
          ) : (
            <>
              {tokens.map((token, idx) => (
                <motion.span
                  key={idx}
                  className={`px-2 py-1 rounded-lg text-xl font-bold ${
                    token.type === 'number'
                      ? 'piece-emerald text-white'
                      : token.type === 'operator'
                      ? 'piece-sapphire text-white'
                      : 'piece-amethyst text-white'
                  }`}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                >
                  {token.type === 'number'
                    ? token.value
                    : token.type === 'operator'
                    ? (token.value === '*' ? '\u00D7' : token.value === '/' ? '\u00F7' : token.value)
                    : token.value}
                </motion.span>
              ))}
              <span className="mx-2 text-[var(--color-text-muted)]">=</span>
              <span className={`px-3 py-1 rounded-lg font-black text-xl ${
                currentResult === target ? 'bg-green-100 text-green-700' : 'wood-inset text-[var(--color-text-primary)]'
              }`}>
                {currentResult !== null ? (Number.isInteger(currentResult) ? currentResult : currentResult.toFixed(2)) : '?'}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Status */}
      <div className="text-center mb-4 flex justify-center gap-2 flex-wrap">
        {currentResult !== null && currentResult === target && (
          <span className="inline-block px-4 py-1 piece-emerald text-white rounded-full font-bold">
            Perfect!
          </span>
        )}
        {currentResult !== null && currentResult !== target && (
          <span className="inline-block px-4 py-1 wood-inset text-[var(--color-text-secondary)] rounded-full font-medium">
            Off by {Math.abs(target - currentResult).toFixed(Number.isInteger(target - currentResult) ? 0 : 2)}
          </span>
        )}
        {!allNumbersUsed && tokens.length > 0 && (
          <span
            className="inline-block px-4 py-1 rounded-full font-medium text-sm"
            style={{
              background: 'rgba(255, 217, 61, 0.2)',
              color: '#ffd93d',
              border: '1px solid rgba(255, 217, 61, 0.4)',
            }}
          >
            Use all 4 numbers
          </span>
        )}
      </div>

      {/* Numbers */}
      <div className="mb-4">
        <div className="text-[var(--color-text-muted)] text-xs font-medium mb-2 text-center">NUMBERS</div>
        <div className="flex justify-center gap-2">
          {availableNumbers.map((num, idx) => (
            <motion.button
              key={idx}
              className={`w-12 h-12 rounded-xl font-black text-xl shadow-lg transition-colors ${
                usedIndices.includes(idx)
                  ? 'wood-inset text-[var(--color-text-muted)] cursor-not-allowed opacity-50'
                  : 'piece-emerald text-white'
              }`}
              onClick={() => handleNumberClick(idx)}
              disabled={usedIndices.includes(idx)}
              whileHover={!usedIndices.includes(idx) ? { scale: 1.05 } : {}}
              whileTap={!usedIndices.includes(idx) ? { scale: 0.95 } : {}}
            >
              {num}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Operators and Parentheses */}
      <div className="mb-4">
        <div className="text-[var(--color-text-muted)] text-xs font-medium mb-2 text-center">OPERATORS</div>
        <div className="flex justify-center gap-2 flex-wrap">
          {(['+', '-', '*', '/'] as Operator[]).map((op) => (
            <motion.button
              key={op}
              className="w-11 h-11 rounded-xl piece-sapphire text-white font-black text-xl shadow-lg"
              onClick={() => handleOperatorClick(op)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {op === '*' ? '\u00D7' : op === '/' ? '\u00F7' : op}
            </motion.button>
          ))}
          <div className="w-2" />
          {(['(', ')'] as const).map((paren) => (
            <motion.button
              key={paren}
              className="w-11 h-11 rounded-xl piece-amethyst text-white font-black text-xl shadow-lg"
              onClick={() => handleParenClick(paren)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {paren}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mb-4">
        <motion.button
          className="flex-1 py-3 wood-inset text-[var(--color-text-secondary)] font-bold rounded-xl"
          onClick={handleBackspace}
          disabled={tokens.length === 0}
          whileHover={tokens.length > 0 ? { scale: 1.02 } : {}}
          whileTap={tokens.length > 0 ? { scale: 0.98 } : {}}
        >
          ← Undo
        </motion.button>
        <motion.button
          className="flex-1 py-3 wood-inset text-[var(--color-text-secondary)] font-bold rounded-xl"
          onClick={handleClear}
          disabled={tokens.length === 0}
          whileHover={tokens.length > 0 ? { scale: 1.02 } : {}}
          whileTap={tokens.length > 0 ? { scale: 0.98 } : {}}
        >
          Clear
        </motion.button>
        <motion.button
          className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-xl"
          onClick={handleLockIn}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Lock In
        </motion.button>
      </div>

      {/* Progress */}
      <div className="text-center text-[var(--color-text-muted)] text-sm">
        {playerResults.filter(p => p.hasFinished).length} of {players.length} players done
      </div>
    </div>
  );
}
