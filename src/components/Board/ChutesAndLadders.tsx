import { DEFAULT_CONNECTIONS } from '../../utils/boardHelpers';
import { positionToCoords } from '../../utils/boardHelpers';

export function ChutesAndLadders() {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none z-0"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      {DEFAULT_CONNECTIONS.map((connection, index) => {
        const fromCoords = positionToCoords(connection.from);
        const toCoords = positionToCoords(connection.to);

        // Convert to percentage coordinates
        const x1 = fromCoords.col * 10 + 5;
        const y1 = fromCoords.row * 10 + 5;
        const x2 = toCoords.col * 10 + 5;
        const y2 = toCoords.row * 10 + 5;

        const isLadder = connection.type === 'ladder';

        return (
          <g key={index}>
            {isLadder ? (
              // Ladder - two parallel lines with rungs
              <>
                <line
                  x1={x1 - 1.5}
                  y1={y1}
                  x2={x2 - 1.5}
                  y2={y2}
                  stroke="#22c55e"
                  strokeWidth="0.8"
                  strokeLinecap="round"
                />
                <line
                  x1={x1 + 1.5}
                  y1={y1}
                  x2={x2 + 1.5}
                  y2={y2}
                  stroke="#22c55e"
                  strokeWidth="0.8"
                  strokeLinecap="round"
                />
                {/* Rungs */}
                {[0.2, 0.4, 0.6, 0.8].map((t, i) => {
                  const rx = x1 + (x2 - x1) * t;
                  const ry = y1 + (y2 - y1) * t;
                  return (
                    <line
                      key={i}
                      x1={rx - 1.5}
                      y1={ry}
                      x2={rx + 1.5}
                      y2={ry}
                      stroke="#22c55e"
                      strokeWidth="0.6"
                    />
                  );
                })}
              </>
            ) : (
              // Chute - wavy line
              <path
                d={`M ${x1} ${y1} Q ${(x1 + x2) / 2 + 5} ${(y1 + y2) / 2} ${x2} ${y2}`}
                fill="none"
                stroke="#ef4444"
                strokeWidth="2"
                strokeLinecap="round"
                opacity="0.7"
              />
            )}
          </g>
        );
      })}
    </svg>
  );
}
