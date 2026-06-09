import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGenerationStream } from './hooks/useGenerationStream';
import { PredictionBars } from './PredictionBars';
import { joinTokens } from './utils/tokenFormat';

interface GenerationViewProps {
  generatedTokens: string[];
  generatedText?: string;
  isGenerating: boolean;
  topKPredictions: Array<{ token: string; prob: number; logit?: number }[]>;
}

export const GenerationView: React.FC<GenerationViewProps> = ({
  generatedTokens,
  generatedText,
  isGenerating,
  topKPredictions,
}) => {
  const { displayedTokens, isStreaming } = useGenerationStream(generatedTokens, isGenerating);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const previewText = generatedText ?? joinTokens(displayedTokens);

  return (
    <div className="w-full h-full flex flex-col p-6 text-zinc-100 relative">
      <div className="mb-5">
        <p className="text-[10px] uppercase tracking-[0.15em] text-zinc-600 mb-1">
          Autoregressive decoding
        </p>
        <h3 className="text-base font-medium tracking-tight">Token generation stream</h3>
      </div>

      <div className="flex-1 bg-white/[0.02] rounded-xl border border-white/[0.05] p-5 overflow-y-auto mb-4 custom-scrollbar min-h-0">
        {/* Readable preview — matches output strip */}
        {previewText && (
          <p className="font-mono text-[13px] text-zinc-400 leading-relaxed mb-4 pb-4 border-b border-white/[0.05]">
            {previewText}
          </p>
        )}

        <p className="text-[10px] uppercase tracking-wider text-zinc-600 mb-2">
          Click a token for logits
        </p>
        <div className="flex flex-wrap gap-x-1 gap-y-1 content-start font-mono text-[14px] leading-relaxed">
          <AnimatePresence>
            {displayedTokens.map((token, idx) => (
              <motion.button
                key={`gen-${idx}`}
                type="button"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                onClick={() => setSelectedIdx(selectedIdx === idx ? null : idx)}
                className={`cursor-pointer px-1.5 py-0.5 rounded transition-colors ${
                  selectedIdx === idx
                    ? 'bg-white text-zinc-900'
                    : 'text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-200'
                }`}
              >
                {token}
              </motion.button>
            ))}
          </AnimatePresence>

          {isStreaming && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ repeat: Infinity, duration: 0.8 }}
              className="inline-block w-[2px] bg-zinc-400 ml-0.5 h-[1.2em] translate-y-1"
            />
          )}
        </div>

        {displayedTokens.length === 0 && !isGenerating && (
          <div className="text-zinc-600 text-sm h-full flex items-center justify-center">
            Run inference to see token-by-token generation
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedIdx !== null && topKPredictions[selectedIdx] && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="flex-shrink-0 bg-white/[0.02] rounded-xl border border-white/[0.06] overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-white/[0.05] flex justify-between items-center">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-zinc-600">
                  Step {selectedIdx + 1}
                </p>
                <h4 className="text-sm font-medium text-zinc-200">
                  How &quot;{topKPredictions[selectedIdx][0]?.token}&quot; was chosen
                </h4>
              </div>
              <button
                onClick={() => setSelectedIdx(null)}
                className="text-zinc-500 hover:text-zinc-300 text-sm px-2"
              >
                ✕
              </button>
            </div>
            <div className="p-5">
              <PredictionBars predictions={topKPredictions[selectedIdx]} showLogits />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
