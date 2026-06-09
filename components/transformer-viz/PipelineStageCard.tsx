'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { PipelineStage } from './types';
import { STAGE_DATA } from './constants/stageData';

interface PipelineStageCardProps {
  stageId: PipelineStage;
  index: number;
  isSelected: boolean;
  isActive: boolean;
  isCompleted: boolean;
  progress: number;
  onSelect: (id: PipelineStage) => void;
}

export const PipelineStageCard: React.FC<PipelineStageCardProps> = ({
  stageId,
  index,
  isSelected,
  isActive,
  isCompleted,
  progress,
  onSelect,
}) => {
  const info = STAGE_DATA[stageId];

  return (
    <motion.button
      type="button"
      onClick={() => onSelect(stageId)}
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.985 }}
      className={`
        relative flex flex-col items-start text-left w-full min-w-[140px] max-w-[168px]
        rounded-xl border backdrop-blur-xl transition-colors duration-300
        ${isSelected
          ? 'border-white/20 bg-white/[0.06] shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_20px_40px_-20px_rgba(0,0,0,0.8)]'
          : 'border-white/[0.06] bg-white/[0.02] hover:border-white/12 hover:bg-white/[0.04]'
        }
        ${isActive ? 'ring-1 ring-white/15' : ''}
      `}
    >
      {/* Active progress fill */}
      {isActive && (
        <motion.div
          className="absolute inset-x-0 bottom-0 h-[2px] origin-left bg-white/60 rounded-b-xl"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: progress }}
          transition={{ duration: 0.1, ease: 'linear' }}
        />
      )}

      {/* Completed indicator */}
      {isCompleted && !isActive && (
        <div className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-white/40" />
      )}

      <div className="p-4 w-full">
        <div className="flex items-center gap-2.5 mb-3">
          <span
            className="text-[10px] font-mono tracking-widest text-zinc-500 tabular-nums"
            style={{ color: isActive ? info.accent : undefined }}
          >
            {info.icon}
          </span>
          {isActive && (
            <motion.span
              layoutId="active-pulse"
              className="w-1.5 h-1.5 rounded-full bg-white"
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ repeat: Infinity, duration: 1.2 }}
            />
          )}
        </div>

        <h3
          className={`text-sm font-medium tracking-tight mb-1 ${
            isSelected || isActive ? 'text-zinc-50' : 'text-zinc-300'
          }`}
        >
          {info.label}
        </h3>

        <p className="text-[11px] leading-relaxed text-zinc-500 line-clamp-2">
          {info.technicalNote}
        </p>
      </div>
    </motion.button>
  );
};
