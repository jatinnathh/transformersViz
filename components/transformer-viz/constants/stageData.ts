import { StageInfo } from '../types';

export const STAGE_DATA: Record<string, StageInfo> = {
  tokenizer: {
    id: 'tokenizer',
    label: 'Tokenizer',
    color: '#3B82F6',
    description: 'Breaks down the input text into smaller units called tokens and maps them to numerical IDs based on the model\'s vocabulary.'
  },
  embedding: {
    id: 'embedding',
    label: 'Embedding',
    color: '#8B5CF6',
    description: 'Converts token IDs into dense, high-dimensional vectors, capturing the semantic meaning of each token.'
  },
  positional: {
    id: 'positional',
    label: 'Positional Encoding',
    color: '#EC4899',
    description: 'Injects information about the order of tokens, as transformers do not process data sequentially by default.'
  },
  encoder: {
    id: 'encoder',
    label: 'Encoder Stack',
    color: '#F59E0B',
    description: 'A series of layers that apply self-attention and feed-forward networks to build complex representations of the input sequence.'
  },
  decoder: {
    id: 'decoder',
    label: 'Decoder Stack',
    color: '#10B981',
    description: 'Applies self-attention and cross-attention over the encoder output to auto-regressively generate the output sequence.'
  },
  output: {
    id: 'output',
    label: 'Output Layer',
    color: '#EF4444',
    description: 'Projects the final decoder representations into vocabulary logits, applying softmax to produce probabilities for the next token.'
  }
};
