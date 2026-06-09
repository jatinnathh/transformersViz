import { StageInfo } from '../types';

export const STAGE_DATA: Record<string, StageInfo> = {
  tokenizer: {
    id: 'tokenizer',
    label: 'Tokenizer',
    shortLabel: 'Tokenize',
    accent: '#e4e4e7',
    accentMuted: 'rgba(228, 228, 231, 0.12)',
    icon: '01',
    description:
      'Segments raw text into subword tokens and maps each unit to a vocabulary index via byte-pair encoding.',
    technicalNote: 'BPE merges · vocab lookup · special token handling',
  },
  embedding: {
    id: 'embedding',
    label: 'Token Embedding',
    shortLabel: 'Embed',
    accent: '#d4d4d8',
    accentMuted: 'rgba(212, 212, 216, 0.12)',
    icon: '02',
    description:
      'Projects discrete token IDs into a continuous d_model-dimensional space where semantic similarity is encoded geometrically.',
    technicalNote: 'Embedding matrix · d_model=512 · learned lookup',
  },
  positional: {
    id: 'positional',
    label: 'Positional Encoding',
    shortLabel: 'Position',
    accent: '#a1a1aa',
    accentMuted: 'rgba(161, 161, 170, 0.12)',
    icon: '03',
    description:
      'Adds sinusoidal position signals so the model can distinguish token order without recurrence.',
    technicalNote: 'sin/cos waves · position i · added to embeddings',
  },
  encoder: {
    id: 'encoder',
    label: 'Encoder Stack',
    shortLabel: 'Encode',
    accent: '#71717a',
    accentMuted: 'rgba(113, 113, 122, 0.15)',
    icon: '04',
    description:
      'Six layers of multi-head self-attention and feed-forward blocks build contextual representations of the input.',
    technicalNote: 'Self-attention · 8 heads · 6 layers · residual + LayerNorm',
  },
  decoder: {
    id: 'decoder',
    label: 'Decoder Stack',
    shortLabel: 'Decode',
    accent: '#52525b',
    accentMuted: 'rgba(82, 82, 91, 0.15)',
    icon: '05',
    description:
      'Masked self-attention and cross-attention over encoder states drive autoregressive next-token prediction.',
    technicalNote: 'Causal mask · cross-attention · 6 layers',
  },
  output: {
    id: 'output',
    label: 'Output Projection',
    shortLabel: 'Predict',
    accent: '#fafafa',
    accentMuted: 'rgba(250, 250, 250, 0.08)',
    icon: '06',
    description:
      'Linear projection to vocabulary size, followed by softmax to produce a probability distribution over next tokens.',
    technicalNote: 'Linear(d_model → vocab) · softmax · argmax / sampling',
  },
};
