'use client';

import { motion } from 'framer-motion';

interface ProcessingAnimationProps {
  stage: string;
}

const stageNames: Record<string, string> = {
  tokenizer: 'Tokenizing input...',
  embedding: 'Creating embeddings...',
  positional: 'Adding positional encoding...',
  encoder: 'Processing through encoder...',
  decoder: 'Generating with decoder...',
  output: 'Computing output probabilities...'
};

export default function ProcessingAnimation({ stage }: ProcessingAnimationProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 flex items-center justify-center"
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl p-8 max-w-md"
      >
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-16 h-16">
            <motion.div
              className="absolute inset-0 border-4 border-blue-500 rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              style={{ borderTopColor: 'transparent' }}
            />
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Processing
            </h3>
            <motion.p
              key={stage}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-zinc-600 dark:text-zinc-400 mt-1"
            >
              {stageNames[stage] || 'Processing...'}
            </motion.p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
