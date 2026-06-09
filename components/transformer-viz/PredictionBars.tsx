import React from 'react';
import { motion } from 'framer-motion';

interface Prediction {
  token: string;
  prob: number;
  logit?: number;
}

interface PredictionBarsProps {
  predictions: Prediction[];
  showLogits?: boolean;
}

export const PredictionBars: React.FC<PredictionBarsProps> = ({
  predictions,
  showLogits = false,
}) => {
  if (!predictions?.length) return null;

  return (
    <div className="w-full flex flex-col gap-2.5">
      {predictions.map((pred, i) => {
        const percent = Math.min(100, Math.max(0, pred.prob * 100));
        const isTop = i === 0;

        return (
          <div key={`${pred.token}-${i}`} className="group">
            <div className="flex items-center gap-2 mb-1">
              <div
                className={`w-20 text-right flex-shrink-0 font-mono text-[11px] truncate ${
                  isTop ? 'text-zinc-100' : 'text-zinc-500'
                }`}
              >
                {pred.token === ' ' ? '␣' : pred.token}
              </div>
              <div className="flex-1 relative h-5 bg-white/[0.03] rounded overflow-hidden border border-white/[0.04]">
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.5, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute left-0 top-0 bottom-0 origin-left"
                  style={{
                    width: `${percent}%`,
                    background: isTop
                      ? 'linear-gradient(90deg, rgba(250,250,250,0.35), rgba(250,250,250,0.15))'
                      : 'linear-gradient(90deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))',
                    minWidth: '1px',
                  }}
                />
                {isTop && (
                  <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] text-zinc-400 font-mono">
                    selected
                  </span>
                )}
              </div>
              <div className="w-12 text-right flex-shrink-0 font-mono text-[10px] text-zinc-500 tabular-nums">
                {percent.toFixed(1)}%
              </div>
            </div>
            {showLogits && pred.logit !== undefined && (
              <div className="flex justify-end pr-14">
                <span className="text-[9px] font-mono text-zinc-600">
                  logit {pred.logit.toFixed(3)}
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
