'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PipelineFlowState } from './types';

interface TokenFlowTrackProps {
  flowState: PipelineFlowState;
  stageCount: number;
}

export const TokenFlowTrack: React.FC<TokenFlowTrackProps> = ({
  flowState,
  stageCount,
}) => {
  const { activeStage, activeToken, stageProgress, isFlowing } = flowState;

  if (!isFlowing && !activeToken) return null;

  const stageIndex = activeStage
    ? ['tokenizer', 'embedding', 'positional', 'encoder', 'decoder', 'output'].indexOf(
        activeStage
      )
    : 0;

  const segmentWidth = 100 / (stageCount - 1);
  const xPercent = stageIndex * segmentWidth + stageProgress * segmentWidth;

  return (
    <div className="relative w-full h-10 mt-2 mb-1">
      {/* Track line */}
      <div className="absolute top-1/2 left-[8%] right-[8%] h-px -translate-y-1/2 bg-white/[0.06]" />

      {/* Flow pulse on track */}
      {isFlowing && (
        <motion.div
          className="absolute top-1/2 left-[8%] right-[8%] h-px -translate-y-1/2 overflow-hidden"
        >
          <motion.div
            className="h-full w-24 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            animate={{ x: ['-100%', '400%'] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
          />
        </motion.div>
      )}

      {/* Moving token pill */}
      <AnimatePresence mode="popLayout">
        {activeToken && (
          <motion.div
            key={`${activeToken}-${stageIndex}`}
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10"
            style={{ left: `${8 + (xPercent * 0.84)}%` }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          >
            <div className="px-2.5 py-1 rounded-full bg-white text-zinc-900 text-[11px] font-mono font-medium shadow-[0_4px_20px_rgba(255,255,255,0.15)] whitespace-nowrap max-w-[120px] truncate">
              {activeToken === ' ' ? '␣' : activeToken}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
