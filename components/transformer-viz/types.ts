export interface TransformerVizProps {
  inputText: string;
  tokens: string[];                          // ["F","i","r","s","t"]
  tokenIds: number[];
  embeddings: number[][];                    // [nTokens][dModel]
  positionalEncodings: number[][];
  attentionWeights: number[][][][];          // [nLayers][nHeads][nTokens][nTokens]
  encoderOutputs: number[][];
  decoderOutputs: number[][];
  logits: number[][];                        // [seqLen][vocabSize]
  topKPredictions: Array<{token: string; prob: number}[]>;
  generatedTokens: string[];
  isGenerating: boolean;
  stageTiming?: Record<string, number>;      // ms per stage (optional)
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
  color: string; // hex
  description: string;
}
