import type {
  GameStats,
  GameAward,
  PrimeOffStats,
  PrimeBlackjackStats,
  DoubleDigitsStats,
  RootRaceStats,
  FactorFrenzyStats,
  NumberBuilderStats,
  FinalShowdownStats,
  SequenceSavantStats,
} from '../types/stats';

interface PlayerInfo {
  id: string;
  name: string;
  color: string;
}

export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) return `${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

export function computeAwards(stats: GameStats, players: PlayerInfo[]): GameAward[] {
  const awards: GameAward[] = [];
  const playerMap = new Map(players.map(p => [p.id, p]));

  const makeAward = (
    id: string,
    title: string,
    subtitle: string,
    playerId: string,
    icon: string,
    value: string,
    color: string,
  ): boolean => {
    const player = playerMap.get(playerId);
    if (!player) return false;
    awards.push({ id, title, subtitle, playerId, playerName: player.name, icon, value, color });
    return true;
  };

  // ── Speed Demon: Fastest correct Prime-Off answer ──
  {
    let bestTime = Infinity;
    let bestPlayerId = '';
    for (const event of stats.minigameEvents) {
      if (event.data.type !== 'prime_off') continue;
      const data = event.data as PrimeOffStats;
      for (const pr of data.playerResults) {
        if (pr.correct && pr.time !== null && pr.time < bestTime) {
          bestTime = pr.time;
          bestPlayerId = pr.playerId;
        }
      }
    }
    if (bestPlayerId) {
      makeAward('speed_demon', 'Speed Demon', 'Fastest prime identification', bestPlayerId, '⚡', `${bestTime.toFixed(1)}s`, '#3185FC');
    }
  }

  // ── Card Shark: Highest prime sum in Blackjack without busting ──
  {
    let bestSum = 0;
    let bestPlayerId = '';
    for (const event of stats.minigameEvents) {
      if (event.data.type !== 'prime_blackjack') continue;
      const data = event.data as PrimeBlackjackStats;
      for (const pr of data.playerResults) {
        if (!pr.busted && pr.sumIsPrime && pr.sum > bestSum) {
          bestSum = pr.sum;
          bestPlayerId = pr.playerId;
        }
      }
    }
    if (bestPlayerId) {
      makeAward('card_shark', 'Card Shark', 'Highest prime hand', bestPlayerId, '🃏', `${bestSum}`, '#4ECDC4');
    }
  }

  // ── Lucky Roller: Highest single dice roll ──
  {
    let bestRoll = 0;
    let bestPlayerId = '';
    for (const turn of stats.turns) {
      if (turn.rollValue > bestRoll) {
        bestRoll = turn.rollValue;
        bestPlayerId = turn.playerId;
      }
    }
    if (bestPlayerId && bestRoll > 0) {
      makeAward('lucky_roller', 'Lucky Roller', 'Highest single roll', bestPlayerId, '🎲', `${bestRoll}`, '#FFE66D');
    }
  }

  // ── Sharpshooter: Most accurate Root Race / Cube Root guess ──
  {
    let bestDiff = Infinity;
    let bestPlayerId = '';
    let label = '';
    for (const event of stats.minigameEvents) {
      if (event.data.type !== 'root_race' && event.data.type !== 'cube_root') continue;
      const data = event.data as RootRaceStats;
      for (const pr of data.playerResults) {
        if (pr.difference !== null && pr.difference < bestDiff) {
          bestDiff = pr.difference;
          bestPlayerId = pr.playerId;
          label = bestDiff === 0 ? 'Perfect' : `off by ${bestDiff.toFixed(2)}`;
        }
      }
    }
    if (bestPlayerId) {
      makeAward('sharpshooter', 'Sharpshooter', 'Most accurate root guess', bestPlayerId, '🎯', label, '#9B59B6');
    }
  }

  // ── Factor Machine: Most correct factors in a single Factor Frenzy ──
  {
    let bestCorrect = 0;
    let bestPlayerId = '';
    for (const event of stats.minigameEvents) {
      if (event.data.type !== 'factor_frenzy') continue;
      const data = event.data as FactorFrenzyStats;
      for (const pr of data.playerResults) {
        if (pr.correctTaps > bestCorrect) {
          bestCorrect = pr.correctTaps;
          bestPlayerId = pr.playerId;
        }
      }
    }
    if (bestPlayerId) {
      makeAward('factor_machine', 'Factor Machine', 'Most factors found', bestPlayerId, '⚙️', `${bestCorrect} factors`, '#E84855');
    }
  }

  // ── Math Architect: Closest Number Builder result ──
  {
    let bestDiff = Infinity;
    let bestPlayerId = '';
    for (const event of stats.minigameEvents) {
      if (event.data.type !== 'number_builder') continue;
      const data = event.data as NumberBuilderStats;
      for (const pr of data.playerResults) {
        if (pr.difference < bestDiff) {
          bestDiff = pr.difference;
          bestPlayerId = pr.playerId;
        }
      }
    }
    if (bestPlayerId && bestDiff < Infinity) {
      const label = bestDiff === 0 ? 'Exact hit' : `off by ${bestDiff}`;
      makeAward('math_architect', 'Math Architect', 'Best number builder', bestPlayerId, '📐', label, '#F9A03F');
    }
  }

  // ── Teleporter: Biggest forward leap from Double Digits ──
  {
    let bestDelta = 0;
    let bestPlayerId = '';
    for (const event of stats.minigameEvents) {
      if (event.data.type !== 'double_digits') continue;
      const data = event.data as DoubleDigitsStats;
      if (!data.skipped && data.delta > bestDelta) {
        bestDelta = data.delta;
        bestPlayerId = data.playerId;
      }
    }
    if (bestPlayerId && bestDelta > 0) {
      makeAward('teleporter', 'Teleporter', 'Biggest forward warp', bestPlayerId, '🌀', `+${bestDelta} spaces`, '#FFE66D');
    }
  }

  // ── Road Warrior: Most total squares traveled ──
  {
    const distanceByPlayer = new Map<string, number>();
    for (const turn of stats.turns) {
      const dist = Math.abs(turn.positionAfter - turn.positionBefore);
      distanceByPlayer.set(turn.playerId, (distanceByPlayer.get(turn.playerId) ?? 0) + dist);
    }
    let bestDist = 0;
    let bestPlayerId = '';
    for (const [pid, dist] of distanceByPlayer) {
      if (dist > bestDist) {
        bestDist = dist;
        bestPlayerId = pid;
      }
    }
    if (bestPlayerId) {
      makeAward('road_warrior', 'Road Warrior', 'Most distance covered', bestPlayerId, '🛤️', `${bestDist} squares`, '#F9A03F');
    }
  }

  // ── Dice Collector: Used the most different dice types ──
  {
    const diceByPlayer = new Map<string, Set<string>>();
    for (const turn of stats.turns) {
      if (!diceByPlayer.has(turn.playerId)) diceByPlayer.set(turn.playerId, new Set());
      diceByPlayer.get(turn.playerId)!.add(turn.diceType);
    }
    let bestCount = 0;
    let bestPlayerId = '';
    for (const [pid, dice] of diceByPlayer) {
      if (dice.size > bestCount) {
        bestCount = dice.size;
        bestPlayerId = pid;
      }
    }
    if (bestPlayerId && bestCount > 1) {
      makeAward('dice_collector', 'Dice Collector', 'Most dice types used', bestPlayerId, '🎰', `${bestCount} types`, '#9B59B6');
    }
  }

  // ── Comeback Kid: Biggest single-turn position gain ──
  {
    let bestGain = 0;
    let bestPlayerId = '';
    for (const turn of stats.turns) {
      const gain = turn.positionAfter - turn.positionBefore;
      if (gain > bestGain) {
        bestGain = gain;
        bestPlayerId = turn.playerId;
      }
    }
    if (bestPlayerId && bestGain > 0) {
      makeAward('comeback_kid', 'Comeback Kid', 'Biggest single-turn leap', bestPlayerId, '🔥', `+${bestGain} spaces`, '#E84855');
    }
  }

  // ── Final Boss: Won Final Showdown on first attempt ──
  {
    const showdownAttempts = new Map<string, number>();
    for (const event of stats.minigameEvents) {
      if (event.data.type !== 'final_showdown') continue;
      const data = event.data as FinalShowdownStats;
      const count = (showdownAttempts.get(data.playerId) ?? 0) + 1;
      showdownAttempts.set(data.playerId, count);
      if (data.correct && count === 1) {
        makeAward('final_boss', 'Final Boss', 'Won showdown first try', data.playerId, '👑', `${data.timeRemaining.toFixed(0)}s left`, '#FFE66D');
      }
    }
  }

  // ── Sequence Sage: Fastest correct Sequence Savant answer ──
  {
    let bestTime = Infinity;
    let bestPlayerId = '';
    for (const event of stats.minigameEvents) {
      if (event.data.type !== 'sequence_savant') continue;
      const data = event.data as SequenceSavantStats;
      for (const pr of data.playerResults) {
        if (pr.correct && pr.timeToAnswer !== null && pr.timeToAnswer < bestTime) {
          bestTime = pr.timeToAnswer;
          bestPlayerId = pr.playerId;
        }
      }
    }
    if (bestPlayerId) {
      makeAward('sequence_sage', 'Sequence Sage', 'Fastest pattern solve', bestPlayerId, '🧩', `${bestTime.toFixed(1)}s`, '#5FAD56');
    }
  }

  return awards;
}
