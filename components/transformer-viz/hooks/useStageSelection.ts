/* eslint-disable */
import { useState, useCallback } from 'react';
import { PipelineStage } from '../types';

export function useStageSelection() {
  const [selectedStage, setSelectedStage] = useState<PipelineStage | null>(null);
  const [hoveredStage, setHoveredStage] = useState<PipelineStage | null>(null);

  const selectStage = useCallback((stage: PipelineStage | null) => {
    setSelectedStage(stage);
  }, []);

  const hoverStage = useCallback((stage: PipelineStage | null) => {
    setHoveredStage(stage);
  }, []);

  return {
    selectedStage,
    selectStage,
    hoveredStage,
    hoverStage
  };
}
