'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { PipelineStage, PipelineFlowState, PIPELINE_STAGES } from './types';
import { PipelineStageCard } from './PipelineStageCard';
import { TokenFlowTrack } from './TokenFlowTrack';

interface PipelineCanvasProps {
  selectedStage: PipelineStage | null;
  onSelectStage: (stage: PipelineStage) => void;
  isGenerating: boolean;
  flowState: PipelineFlowState;
}

export const PipelineCanvas: React.FC<PipelineCanvasProps> = ({
  selectedStage,
  onSelectStage,
  isGenerating,
  flowState,
}) => {
  return (
    <div className="w-full h-full flex flex-col p-6 md:p-8 overflow-hidden">
      {/* Header */}
      <div className="flex items-end justify-between mb-6 flex-shrink-0">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500 mb-1.5">
            Inference Pipeline
          </p>
          <h2 className="text-lg font-medium text-zinc-100 tracking-tight">
            {isGenerating || flowState.isFlowing
              ? 'Processing sequence'
              : flowState.activeToken
                ? 'Pipeline complete'
                : 'Awaiting input'}
          </h2>
        </div>
        {(isGenerating || flowState.isFlowing) && flowState.activeToken && (
          <motion.div
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-right"
          >
            <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-0.5">
              Active token
            </p>
            <p className="text-sm font-mono text-zinc-200">
              #{flowState.activeTokenIndex + 1}{' '}
              <span className="text-zinc-400">·</span>{' '}
              &quot;{flowState.activeToken === ' ' ? '␣' : flowState.activeToken}&quot;
            </p>
          </motion.div>
        )}
      </div>

      {/* Token flow track */}
      <TokenFlowTrack flowState={flowState} stageCount={PIPELINE_STAGES.length} />

      {/* Stage cards */}
      <div className="flex-1 flex items-center min-h-0">
        <div className="w-full overflow-x-auto custom-scrollbar pb-2">
          <div className="flex items-stretch gap-3 min-w-max px-1">
            {PIPELINE_STAGES.map((stage, i) => (
              <React.Fragment key={stage}>
                <PipelineStageCard
                  stageId={stage}
                  index={i}
                  isSelected={selectedStage === stage}
                  isActive={flowState.activeStage === stage && (isGenerating || flowState.isFlowing)}
                  isCompleted={flowState.completedStages.includes(stage)}
                  progress={
                    flowState.activeStage === stage ? flowState.stageProgress : 0
                  }
                  onSelect={onSelectStage}
                />

                {i < PIPELINE_STAGES.length - 1 && (
                  <div className="flex items-center self-center px-0.5">
                    <motion.div
                      className="w-8 h-px relative"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.08 + 0.2 }}
                    >
                      <div className="absolute inset-0 bg-white/[0.06]" />
                      {(flowState.completedStages.includes(stage) ||
                        (flowState.activeStage === PIPELINE_STAGES[i + 1])) && (
                        <motion.div
                          className="absolute inset-0 bg-white/25 origin-left"
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: 1 }}
                          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                        />
                      )}
                    </motion.div>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Stage hint */}
      <motion.p
        className="text-[11px] text-zinc-600 mt-4 flex-shrink-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        Press <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-zinc-400 font-mono text-[10px]">1</kbd>
        –<kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-zinc-400 font-mono text-[10px]">6</kbd>
        {' '}to jump to a stage · Click any card for details
      </motion.p>
    </div>
  );
};
