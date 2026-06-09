import { useState, useEffect, useCallback, useRef } from 'react';
import {
  PipelineStage,
  PipelineFlowState,
  TokenStageDecision,
  PIPELINE_STAGES,
} from '../types';

const DEFAULT_TIMING: Record<PipelineStage, number> = {
  tokenizer: 12,
  embedding: 4,
  positional: 1,
  encoder: 45,
  decoder: 52,
  output: 8,
};

interface UsePipelineFlowOptions {
  tokens: string[];
  isGenerating: boolean;
  stageTiming?: Record<string, number>;
  stageDecisions?: TokenStageDecision[];
}

export function usePipelineFlow({
  tokens,
  isGenerating,
  stageTiming,
  stageDecisions = [],
}: UsePipelineFlowOptions) {
  const [flowState, setFlowState] = useState<PipelineFlowState>({
    activeStage: null,
    activeTokenIndex: 0,
    activeToken: null,
    stageProgress: 0,
    completedStages: [],
    isFlowing: false,
    currentDecision: null,
  });

  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  const getStageDuration = useCallback(
    (stage: PipelineStage) => stageTiming?.[stage] ?? DEFAULT_TIMING[stage],
    [stageTiming]
  );

  const getDecision = useCallback(
    (stage: PipelineStage, tokenIndex: number): TokenStageDecision | null => {
      return (
        stageDecisions.find(
          (d) => d.stage === stage && d.tokenIndex === tokenIndex
        ) ?? null
      );
    },
    [stageDecisions]
  );

  const resetFlow = useCallback(() => {
    setFlowState({
      activeStage: null,
      activeTokenIndex: 0,
      activeToken: null,
      stageProgress: 0,
      completedStages: [],
      isFlowing: false,
      currentDecision: null,
    });
  }, []);

  useEffect(() => {
    if (!isGenerating || tokens.length === 0) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (!isGenerating && tokens.length > 0) {
        setFlowState((prev) => ({
          ...prev,
          isFlowing: false,
          activeStage: 'output',
          completedStages: [...PIPELINE_STAGES],
          activeTokenIndex: tokens.length - 1,
          activeToken: tokens[tokens.length - 1] ?? null,
          stageProgress: 1,
          currentDecision: getDecision('output', tokens.length - 1),
        }));
      } else if (!isGenerating && tokens.length === 0) {
        resetFlow();
      }
      return;
    }

    startTimeRef.current = performance.now();

    const totalPerToken = PIPELINE_STAGES.reduce(
      (sum, s) => sum + getStageDuration(s),
      0
    );

    const tick = (now: number) => {
      const elapsed = now - startTimeRef.current;
      const tokenCount = Math.max(tokens.length, 1);
      const totalDuration = totalPerToken * tokenCount;
      const clampedElapsed = Math.min(elapsed, totalDuration);

      const globalProgress = clampedElapsed / totalDuration;
      const tokenIndex = Math.min(
        Math.floor(globalProgress * tokenCount),
        tokenCount - 1
      );
      const tokenLocalMs = (globalProgress * tokenCount - tokenIndex) * totalPerToken;

      let accumulated = 0;
      let currentStage: PipelineStage = 'tokenizer';
      let stageProgress = 0;
      const completed: PipelineStage[] = [];

      for (const stage of PIPELINE_STAGES) {
        const dur = getStageDuration(stage);
        if (tokenLocalMs >= accumulated + dur) {
          completed.push(stage);
          accumulated += dur;
        } else {
          currentStage = stage;
          stageProgress = (tokenLocalMs - accumulated) / dur;
          break;
        }
      }

      if (tokenLocalMs >= totalPerToken) {
        completed.push(...PIPELINE_STAGES);
        currentStage = 'output';
        stageProgress = 1;
      }

      setFlowState({
        activeStage: currentStage,
        activeTokenIndex: tokenIndex,
        activeToken: tokens[tokenIndex] ?? null,
        stageProgress,
        completedStages: completed,
        isFlowing: true,
        currentDecision: getDecision(currentStage, tokenIndex),
      });

      if (elapsed < totalDuration) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isGenerating, tokens, getStageDuration, getDecision, resetFlow]);

  return { flowState, resetFlow };
}
