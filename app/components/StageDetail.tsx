'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import AttentionHeatmap from './AttentionHeatmap';
import PredictionBars from './PredictionBars';
import TokenStrip from './TokenStrip';

interface StageDetailProps {
  stageId: string;
  onClose: () => void;
  data: any;
}

export default function StageDetail({ stageId, onClose, data }: StageDetailProps) {
  const stageInfo: Record<string, { title: string; description: string }> = {
    tokenizer: {
      title: 'Tokenizer',
      description: 'Breaks input text into individual tokens (words or subwords) that the model can process.'
    },
    embedding: {
      title: 'Token Embedding',
      description: 'Converts each token into a high-dimensional vector representation capturing semantic meaning.'
    },
    positional: {
      title: 'Positional Encoding',
      description: 'Adds positional information to embeddings so the model knows the order of tokens.'
    },
    encoder: {
      title: 'Encoder',
      description: 'Processes input through self-attention and feed-forward layers to build contextual representations.'
    },
    decoder: {
      title: 'Decoder',
      description: 'Generates output using masked self-attention and cross-attention with encoder outputs.'
    },
    output: {
      title: 'Output Layer',
      description: 'Produces probability distribution over vocabulary to predict the next token.'
    }
  };

  const info = stageInfo[stageId];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="sticky top-0 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-700 p-6 flex items-center justify-between z-10">
            <div>
              <h2 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">
                {info?.title}
              </h2>
              <p className="text-zinc-600 dark:text-zinc-400 mt-1">
                {info?.description}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-zinc-600 dark:text-zinc-400" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {stageId === 'tokenizer' && data?.tokens && (
              <div>
                <h3 className="text-lg font-semibold mb-3 text-zinc-800 dark:text-zinc-100">Tokens</h3>
                <TokenStrip tokens={data.tokens} />
              </div>
            )}

            {stageId === 'embedding' && data?.embeddings && (
              <div>
                <h3 className="text-lg font-semibold mb-3 text-zinc-800 dark:text-zinc-100">
                  Embedding Dimensions
                </h3>
                <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Shape: {data.embeddings.shape.join(' × ')}
                  </p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">
                    Each token is represented as a {data.embeddings.shape[1]}-dimensional vector
                  </p>
                </div>
              </div>
            )}

            {(stageId === 'encoder' || stageId === 'decoder') && data?.attention && (
              <div>
                <AttentionHeatmap
                  tokens={data.tokens || []}
                  attentionWeights={data.attention}
                  title={stageId === 'encoder' ? 'Self-Attention Weights' : 'Cross-Attention Weights'}
                />
              </div>
            )}

            {stageId === 'output' && data?.predictions && (
              <div>
                <PredictionBars predictions={data.predictions} topK={15} />
              </div>
            )}

            {/* Technical Details */}
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                Technical Details
              </h4>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                {stageId === 'tokenizer' && (
                  <>
                    <li>• Vocabulary size: {data?.vocabSize || 'N/A'}</li>
                    <li>• Token count: {data?.tokens?.length || 0}</li>
                  </>
                )}
                {stageId === 'embedding' && (
                  <>
                    <li>• Embedding dimension: {data?.embeddingDim || 512}</li>
                    <li>• Total parameters: {((data?.vocabSize || 10000) * (data?.embeddingDim || 512)).toLocaleString()}</li>
                  </>
                )}
                {stageId === 'encoder' && (
                  <>
                    <li>• Number of layers: {data?.numLayers || 6}</li>
                    <li>• Attention heads: {data?.numHeads || 8}</li>
                    <li>• Feed-forward dimension: {data?.ffDim || 2048}</li>
                  </>
                )}
                {stageId === 'decoder' && (
                  <>
                    <li>• Number of layers: {data?.numLayers || 6}</li>
                    <li>• Attention heads: {data?.numHeads || 8}</li>
                    <li>• Uses masked self-attention</li>
                  </>
                )}
                {stageId === 'output' && (
                  <>
                    <li>• Output vocabulary size: {data?.vocabSize || 10000}</li>
                    <li>• Temperature: {data?.temperature || 1.0}</li>
                    <li>• Sampling strategy: {data?.sampling || 'Greedy'}</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
