import { BoardSquare } from './BoardSquare';
import { PlayerToken } from './PlayerToken';
import type { Player } from '../../types/game';

interface GameBoardProps {
  players: Player[];
  onSquareClick?: (position: number) => void;
  highlightedSquare?: number;
  movePath?: number[]; // Array of positions showing the movement path
}

export function GameBoard({ players, onSquareClick, highlightedSquare, movePath = [] }: GameBoardProps) {
  // Generate board squares
  const squares: number[][] = [];
  for (let row = 0; row < 10; row++) {
    const rowSquares: number[] = [];
    for (let col = 0; col < 10; col++) {
      // Calculate position based on snake pattern
      const actualRow = 9 - row; // Flip so 100 is at top
      const colInRow = actualRow % 2 === 0 ? col : 9 - col;
      const position = actualRow * 10 + colInRow + 1;
      rowSquares.push(position);
    }
    squares.push(rowSquares);
  }

  return (
    <div className="relative w-full max-w-xl mx-auto">
      {/* Outer glow effect */}
      <div
        className="absolute -inset-4 rounded-[2.5rem] opacity-60 blur-xl"
        style={{
          background: 'linear-gradient(135deg, rgba(198, 120, 221, 0.3) 0%, rgba(97, 218, 251, 0.3) 50%, rgba(152, 236, 101, 0.2) 100%)',
        }}
      />

      {/* Main board container - glass effect */}
      <div
        className="relative aspect-square rounded-3xl p-3 sm:p-4"
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        }}
      >
        {/* Corner accents - glowing orbs */}
        <div className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-gradient-to-br from-[#ff6b9d] to-[#c678dd]" style={{ boxShadow: '0 0 15px rgba(255, 107, 157, 0.6)' }} />
        <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gradient-to-br from-[#61dafb] to-[#56d4c8]" style={{ boxShadow: '0 0 15px rgba(97, 218, 251, 0.6)' }} />
        <div className="absolute -bottom-2 -left-2 w-6 h-6 rounded-full bg-gradient-to-br from-[#98ec65] to-[#56d4c8]" style={{ boxShadow: '0 0 15px rgba(152, 236, 101, 0.6)' }} />
        <div className="absolute -bottom-2 -right-2 w-6 h-6 rounded-full bg-gradient-to-br from-[#c678dd] to-[#ff6b9d]" style={{ boxShadow: '0 0 15px rgba(198, 120, 221, 0.6)' }} />

        {/* Inner decorative border */}
        <div
          className="absolute inset-2 sm:inset-3 rounded-2xl pointer-events-none"
          style={{
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: 'inset 0 0 30px rgba(0, 0, 0, 0.2)',
          }}
        />

        {/* Grid of squares */}
        <div className="relative grid grid-cols-10 h-full" style={{ gap: 'clamp(1px, 0.4vw, 4px)' }}>
          {squares.flat().map((position) => {
            const pathIndex = movePath.indexOf(position);
            const isInPath = pathIndex !== -1;
            const isPathStart = pathIndex === 0;
            const isPathEnd = pathIndex === movePath.length - 1 && movePath.length > 0;

            return (
              <BoardSquare
                key={position}
                number={position}
                isHighlighted={highlightedSquare === position}
                isInPath={isInPath}
                isPathStart={isPathStart}
                isPathEnd={isPathEnd}
                pathIndex={pathIndex}
                pathLength={movePath.length}
                onClick={() => onSquareClick?.(position)}
              />
            );
          })}
        </div>

        {/* Player tokens */}
        {players.map((player, index) => (
          <PlayerToken
            key={player.id}
            player={player}
            index={index}
            totalPlayers={players.length}
          />
        ))}
      </div>
    </div>
  );
}
