'use client';

import { motion } from 'framer-motion';

interface PredictionBarsProps {
  predictions: { token: string; probability: number }[];
  topK?: number;
}

export default function PredictionBars({ predictions, topK = 10 }: PredictionBarsProps) {
  const topPredictions = predictions.slice(0, topK);
  const maxProb = Math.max(...topPredictions.map(p => p.probability));

  return (
    <div className="p-6 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700">
      <h3 className="text-lg font-semibold mb-4 text-zinc-800 dark:text-zinc-100">
        Top {topK} Predictions
      </h3>
      <div className="space-y-3">
        {topPredictions.map((pred, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="relative"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {pred.token}
              </span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                {(pred.probability * 100).toFixed(2)}%
              </span>
            </div>
            <div className="h-8 bg-zinc-100 dark:bg-zinc-800 rounded-md overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(pred.probability / maxProb) * 100}%` }}
                transition={{ duration: 0.5, delay: idx * 0.05 }}
                className={`h-full flex items-center px-2 ${
                  idx === 0
                    ? 'bg-blue-500'
                    : idx === 1
                    ? 'bg-blue-400'
                    : idx === 2
                    ? 'bg-blue-300'
                    : 'bg-blue-200'
                }`}
              >
                <span className="text-xs font-semibold text-white">
                  {pred.token}
                </span>
              </motion.div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
