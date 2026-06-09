import React from 'react';
import { motion } from 'framer-motion';

interface Prediction {
  token: string;
  prob: number;
}

interface PredictionBarsProps {
  predictions: Prediction[];
}

export const PredictionBars: React.FC<PredictionBarsProps> = ({ predictions }) => {
  if (!predictions || predictions.length === 0) return null;

  return (
    <div className="w-full flex flex-col gap-3">
      {predictions.map((pred, i) => {
        const percent = Math.min(100, Math.max(0, pred.prob * 100));
        const isTop = i === 0;

        return (
          <div key={`${pred.token}-${i}`} className="flex items-center gap-3 relative h-8">
            {/* Label */}
            <div className="w-24 text-right flex-shrink-0 font-mono text-sm text-zinc-300">
              {pred.token === ' ' ? '<space>' : pred.token}
            </div>

            {/* Bar Track */}
            <div className="flex-1 h-full bg-white/5 rounded-r-lg relative overflow-hidden flex items-center border border-white/5">
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.5, delay: i * 0.05, ease: "easeOut" }}
                className="absolute left-0 top-0 bottom-0 origin-left"
                style={{ 
                  width: `${percent}%`,
                  background: isTop 
                    ? 'linear-gradient(90deg, #3b82f6, #06b6d4)' 
                    : 'linear-gradient(90deg, #3b82f688, #06b6d488)',
                  minWidth: '2px'
                }}
              />
              
              {isTop && (
                <div className="absolute right-2 z-10 text-[10px] text-white font-bold px-1 bg-black/30 rounded">
                  ✓
                </div>
              )}
            </div>

            {/* Percentage */}
            <div className="w-16 text-left flex-shrink-0 font-mono text-xs text-zinc-400">
              {percent.toFixed(1)}%
            </div>
          </div>
        );
      })}
    </div>
  );
};
