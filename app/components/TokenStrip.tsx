'use client';

import { motion } from 'framer-motion';

interface TokenStripProps {
  tokens: string[];
  activeIndex?: number;
}

export default function TokenStrip({ tokens, activeIndex }: TokenStripProps) {
  return (
    <div className="flex flex-wrap gap-2 p-4 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700">
      {tokens.map((token, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.05 }}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
            activeIndex === idx
              ? 'bg-blue-500 text-white shadow-lg scale-110'
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
          }`}
        >
          {token}
        </motion.div>
      ))}
    </div>
  );
}
