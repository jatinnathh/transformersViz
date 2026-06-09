/* eslint-disable */
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PipelineStage, TransformerVizProps } from './types';
import { STAGE_DATA } from './constants/stageData';
import { PredictionBars } from './PredictionBars';

interface DetailPanelProps {
  selectedStage: PipelineStage | null;
  data: Partial<TransformerVizProps>;
  onSwitchToAttention?: () => void;
}

export const DetailPanel: React.FC<DetailPanelProps> = ({ selectedStage, data, onSwitchToAttention }) => {
  if (!selectedStage) {
    return (
      <div className="w-full h-full flex items-center justify-center text-zinc-500 bg-[rgba(12,14,28,0.75)] backdrop-blur-md rounded-xl border border-white/5 p-6">
        <p className="font-body text-center">Select a pipeline stage to view details</p>
      </div>
    );
  }

  const stageInfo = STAGE_DATA[selectedStage];

  // Dynamic stats based on stage
  const renderStats = () => {
    const stats: { label: string, value: string }[] = [];
    
    switch (selectedStage) {
      case 'tokenizer':
        stats.push({ label: 'Input Tokens', value: data.tokens?.length.toString() || '0' });
        stats.push({ label: 'Vocab Size', value: '10,000' });
        break;
      case 'embedding':
      case 'positional':
        stats.push({ label: 'Output Shape', value: `[${data.tokens?.length || 0}, 512]` });
        stats.push({ label: 'Parameters', value: '5.1M' });
        break;
      case 'encoder':
      case 'decoder':
        stats.push({ label: 'Layers', value: '6' });
        stats.push({ label: 'Attention Heads', value: '8' });
        stats.push({ label: 'Parameters', value: '18.8M' });
        break;
      case 'output':
        stats.push({ label: 'Output Shape', value: `[${data.tokens?.length || 0}, 10000]` });
        stats.push({ label: 'Parameters', value: '5.1M' });
        break;
    }

    const timeMs = data.stageTiming?.[selectedStage] || Math.floor(selectedStage.length * 2.5);
    stats.push({ label: 'Processing Time', value: `${timeMs}ms` });

    return stats;
  };

  const renderTokenizerInner = () => {
    if (!data.tokens || data.tokens.length === 0) return null;
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 border-t border-white/5 pt-6">
        <h3 className="text-xs text-zinc-400 uppercase tracking-wider mb-4 font-bold">Token ID Mapping</h3>
        <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-2 custom-scrollbar">
          {data.tokens.map((token, idx) => (
            <div key={idx} className="flex items-center justify-between bg-black/40 p-2.5 rounded-lg border border-white/5 font-mono text-sm hover:bg-white/5 transition-colors">
              <span className="text-blue-300">"{token === ' ' ? ' ' : token}"</span>
              <span className="text-zinc-600">→</span>
              <span className="text-cyan-400 font-bold">{data.tokenIds?.[idx] ?? 1000 + idx}</span>
            </div>
          ))}
        </div>
      </motion.div>
    );
  };

  const renderEmbeddingInner = (isPositional = false) => {
    const vectors = isPositional ? data.positionalEncodings : data.embeddings;
    if (!data.tokens || !vectors || vectors.length === 0) return null;
    
    const colorPos = isPositional ? '139, 92, 246' : '59, 130, 246'; // Violet vs Blue
    const colorNeg = isPositional ? '236, 72, 153' : '6, 182, 212';   // Pink vs Cyan

    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 border-t border-white/5 pt-6">
        <h3 className="text-xs text-zinc-400 uppercase tracking-wider mb-4 font-bold">
          {isPositional ? 'Positional Vector Preview' : 'Dense Vector Preview'}
        </h3>
        <div className="flex flex-col gap-3 max-h-56 overflow-y-auto pr-2 custom-scrollbar">
          {data.tokens.slice(0, 15).map((token, idx) => {
            const vec = vectors[idx] || [];
            return (
              <div key={idx} className="bg-black/40 p-3 rounded-lg border border-white/5 hover:border-white/10 transition-colors">
                <div className="flex justify-between items-center mb-2">
                  <div className="font-mono text-xs text-white">Token: <span className={isPositional ? 'text-pink-400' : 'text-blue-400'}>"{token === ' ' ? ' ' : token}"</span></div>
                  <div className="font-mono text-[10px] text-zinc-500">[{isPositional ? 'pos: ' + idx : 'dim: ' + vec.length}]</div>
                </div>
                <div className="flex gap-1 overflow-hidden rounded-sm">
                  {vec.slice(0, 16).map((val, i) => {
                    const intensity = Math.min(1, Math.abs(val));
                    return (
                      <div 
                        key={i} 
                        className="w-4 h-4 flex-shrink-0"
                        style={{ backgroundColor: val > 0 ? `rgba(${colorPos}, ${intensity})` : `rgba(${colorNeg}, ${intensity})` }}
                        title={`Dim ${i}: ${val.toFixed(4)}`}
                      />
                    );
                  })}
                  <span className="text-zinc-600 text-xs ml-2 font-mono self-center">...</span>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    );
  };

  const renderAttentionSummary = () => {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 border-t border-white/5 pt-6">
        <h3 className="text-xs text-zinc-400 uppercase tracking-wider mb-4 font-bold">Attention Heads Summary</h3>
        <div className="grid grid-cols-4 gap-2 mb-4">
          {Array.from({length: 8}).map((_, i) => (
            <div key={i} className="aspect-square bg-gradient-to-br from-black/60 to-black/20 rounded border border-white/5 flex items-center justify-center relative overflow-hidden group hover:border-blue-500/30 transition-colors">
              <span className="text-[10px] text-zinc-500 font-mono z-10 group-hover:text-blue-400">H{i+1}</span>
              {/* Fake mini heatmap pattern */}
              <div className="absolute inset-0 opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNCIgaGVpZ2h0PSI0IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIyIiBoZWlnaHQ9IjIiIGZpbGw9IiMwcGZmZiIvPjwvc3ZnPg==')]" />
            </div>
          ))}
        </div>
        {onSwitchToAttention && (
          <button 
            onClick={onSwitchToAttention}
            className="w-full py-2.5 px-4 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg border border-blue-500/20 transition-all flex items-center justify-center gap-2 font-medium text-sm shadow-[0_0_15px_rgba(59,130,246,0.1)]"
          >
            Deep Dive into Attention
            <span>→</span>
          </button>
        )}
      </motion.div>
    );
  };

  const renderOutputInner = () => {
    if (!data.topKPredictions || data.topKPredictions.length === 0) return null;
    // Show last token predictions
    const lastPreds = data.topKPredictions[data.topKPredictions.length - 1];
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 border-t border-white/5 pt-6">
        <h3 className="text-xs text-zinc-400 uppercase tracking-wider mb-4 font-bold">Latest Output Logits</h3>
        <div className="bg-black/30 p-4 rounded-xl border border-white/5">
           <PredictionBars predictions={lastPreds} />
        </div>
      </motion.div>
    );
  };

  return (
    <div className="w-full h-full flex flex-col bg-[rgba(12,14,28,0.75)] backdrop-blur-md rounded-xl border border-white/5 overflow-y-auto custom-scrollbar">
      <div className="p-6 flex-1 flex flex-col">
        {/* Header */}
        <div className="mb-4 flex items-center gap-3">
          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: stageInfo.color, boxShadow: `0 0 15px ${stageInfo.color}` }} />
          <h2 className="text-2xl font-bold font-display text-zinc-100">{stageInfo.label}</h2>
        </div>

        {/* Description */}
        <p className="text-zinc-400 font-body text-sm leading-relaxed mb-6">
          {stageInfo.description}
        </p>

        {/* Live Stats */}
        <div className="grid grid-cols-2 gap-3 mb-2">
          {renderStats().map((stat, idx) => (
            <div key={idx} className="bg-white/5 p-3 rounded-lg border border-white/5">
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1 font-bold">{stat.label}</div>
              <div className="text-sm font-mono text-zinc-200">{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Detailed Inner Workings */}
        <div className="flex-1">
          {selectedStage === 'tokenizer' && renderTokenizerInner()}
          {selectedStage === 'embedding' && renderEmbeddingInner(false)}
          {selectedStage === 'positional' && renderEmbeddingInner(true)}
          {(selectedStage === 'encoder' || selectedStage === 'decoder') && renderAttentionSummary()}
          {selectedStage === 'output' && renderOutputInner()}
        </div>
      </div>
    </div>
  );
};
