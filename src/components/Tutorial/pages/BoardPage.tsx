import { motion } from 'framer-motion';

const SPECIAL_COLORS: { type: string; color: string; examples: string }[] = [
  { type: 'Prime', color: '#61DAFB', examples: '2, 3, 5, 7, 11...' },
  { type: 'Fibonacci', color: '#98EC65', examples: '1, 2, 3, 5, 8, 13...' },
  { type: 'Perfect Square', color: '#c678dd', examples: '4, 9, 16, 25...' },
  { type: 'Multiple of 10', color: '#FFE66D', examples: '10, 20, 30...' },
  { type: 'Perfect Cube', color: '#FF9F43', examples: '8, 27, 64' },
  { type: 'Abundant', color: '#56D4C8', examples: '12, 18, 24...' },
];

export function BoardPage() {
  return (
    <div className="text-center py-4">
      {/* Mini board grid */}
      <motion.div
        className="mx-auto mb-6 grid grid-cols-10 gap-0.5 w-full max-w-xs"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        {Array.from({ length: 100 }, (_, i) => {
          const row = Math.floor(i / 10);
          const col = row % 2 === 0 ? i % 10 : 9 - (i % 10);
          const actualNum = row % 2 === 0 ? (row * 10 + col + 1) : (row * 10 + (9 - col) + 1);
          const displayNum = 101 - actualNum; // invert so 100 is top

          // Determine special color
          let bg = 'rgba(255,255,255,0.06)';
          const n = 101 - displayNum;
          if ([2,3,5,7,11,13,17,19,23,29,31,37,41,43,47].includes(n)) bg = 'rgba(97,218,251,0.25)';
          else if ([10,20,30,40,50,60,70,80,90,100].includes(n)) bg = 'rgba(255,230,109,0.25)';
          else if ([1,4,9,16,25,36,49,64,81].includes(n)) bg = 'rgba(198,120,221,0.2)';
          else if ([8,21,34,55,89].includes(n)) bg = 'rgba(152,236,101,0.2)';

          const isStart = n === 1;
          const isEnd = n === 100;

          return (
            <motion.div
              key={i}
              className="aspect-square rounded-sm flex items-center justify-center"
              style={{
                background: isStart ? 'rgba(34,197,94,0.4)' : isEnd ? 'rgba(255,230,109,0.4)' : bg,
                fontSize: '6px',
                color: 'rgba(255,255,255,0.5)',
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.005 }}
            />
          );
        })}
      </motion.div>

      {/* Special square legend */}
      <motion.div
        className="grid grid-cols-2 gap-2 max-w-xs mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        {SPECIAL_COLORS.map((sq, i) => (
          <motion.div
            key={sq.type}
            className="flex items-center gap-2 px-2 py-1 rounded-lg"
            style={{ background: `${sq.color}15`, border: `1px solid ${sq.color}30` }}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 + i * 0.1 }}
          >
            <div
              className="w-3 h-3 rounded-sm flex-shrink-0"
              style={{ backgroundColor: sq.color }}
            />
            <div className="text-left">
              <div className="text-xs font-bold text-white/90" style={{ fontFamily: 'var(--font-display)' }}>
                {sq.type}
              </div>
              <div className="text-[10px] text-white/40" style={{ fontFamily: 'var(--font-body)' }}>
                {sq.examples}
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
