import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGenerationStream } from './hooks/useGenerationStream';
import { PredictionBars } from './PredictionBars';

interface GenerationViewProps {
  generatedTokens: string[];
  isGenerating: boolean;
  topKPredictions: Array<{token: string; prob: number}[]>;
}

export const GenerationView: React.FC<GenerationViewProps> = ({ 
  generatedTokens, 
  isGenerating, 
  topKPredictions 
}) => {
  const { displayedTokens, isStreaming } = useGenerationStream(generatedTokens, isGenerating);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  return (
    <div className="w-full h-full flex flex-col p-6 text-zinc-100 relative">
      <h3 className="text-xl font-display font-bold mb-6">Generated Stream</h3>
      
      {/* Token Stream Area */}
      <div className="flex-1 bg-black/20 rounded-xl border border-white/5 p-6 overflow-y-auto mb-6">
        <div className="flex flex-wrap gap-2 content-start text-lg font-mono leading-loose">
          <AnimatePresence>
            {displayedTokens.map((token, idx) => (
              <motion.span
                key={`gen-${idx}`}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setSelectedIdx(selectedIdx === idx ? null : idx)}
                className={`cursor-pointer px-1 rounded transition-colors ${
                  selectedIdx === idx 
                    ? 'bg-blue-500 text-white' 
                    : 'hover:bg-white/10 text-blue-300'
                }`}
              >
                {token === ' ' ? '\u00A0' : token}
              </motion.span>
            ))}
          </AnimatePresence>
          
          {isStreaming && (
            <motion.span 
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ repeat: Infinity, duration: 0.8 }}
              className="inline-block w-2 bg-blue-500 ml-1 h-[1.2em] translate-y-1"
            />
          )}
        </div>

        {displayedTokens.length === 0 && !isGenerating && (
          <div className="text-zinc-600 italic h-full flex items-center justify-center">
            Waiting for generation to start...
          </div>
        )}
      </div>

      {/* Selected Token Detail Panel */}
      <AnimatePresence>
        {selectedIdx !== null && topKPredictions[selectedIdx] && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-black/40 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden"
          >
            <div className="p-4 border-b border-white/5 bg-white/5 flex justify-between items-center">
              <h4 className="font-display font-semibold text-zinc-200">
                Predictions at Step {selectedIdx + 1}
              </h4>
              <button 
                onClick={() => setSelectedIdx(null)}
                className="text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              <PredictionBars predictions={topKPredictions[selectedIdx]} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
