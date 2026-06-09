export interface TransformerVizProps {
  inputText: string;
  tokens: string[];
  tokenIds: number[];
  embeddings: number[][];
  positionalEncodings: number[][];
  attentionWeights: number[][][][];
  encoderOutputs: number[][];
  decoderOutputs: number[][];
  logits: number[][];
  topKPredictions: Array<{ token: string; prob: number; logit?: number }[]>;
  generatedTokens: string[];
  generatedText?: string;
  isGenerating: boolean;
  stageTiming?: Record<string, number>;
  stageDecisions?: TokenStageDecision[];
}

export type PipelineStage =
  | 'tokenizer'
  | 'embedding'
  | 'positional'
  | 'encoder'
  | 'decoder'
  | 'output';

export interface StageInfo {
  id: PipelineStage;
  label: string;
  shortLabel: string;
  accent: string;
  accentMuted: string;
  icon: string;
  description: string;
  technicalNote: string;
}

export interface TokenStageDecision {
  stage: PipelineStage;
  tokenIndex: number;
  token: string;
  summary: string;
  metrics: { label: string; value: string }[];
  topK?: { token: string; logit: number; prob: number }[];
  attentionTargets?: { token: string; weight: number }[];
}

export interface PipelineFlowState {
  activeStage: PipelineStage | null;
  activeTokenIndex: number;
  activeToken: string | null;
  stageProgress: number;
  completedStages: PipelineStage[];
  isFlowing: boolean;
  currentDecision: TokenStageDecision | null;
}

export const PIPELINE_STAGES: PipelineStage[] = [
  'tokenizer',
  'embedding',
  'positional',
  'encoder',
  'decoder',
  'output',
];
