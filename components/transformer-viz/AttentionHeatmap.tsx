import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getViridisColor } from './utils/colorScale';

interface AttentionHeatmapProps {
  tokens: string[];
  // [nHeads][nTokens][nTokens]
  attentionWeights: number[][][]; 
}

export const AttentionHeatmap: React.FC<AttentionHeatmapProps> = ({ tokens, attentionWeights }) => {
  const [selectedHead, setSelectedHead] = useState<number | 'avg'>('avg');
  const [hoveredCell, setHoveredCell] = useState<{row: number, col: number, weight: number} | null>(null);

  const numHeads = attentionWeights.length;
  const seqLen = tokens.length;

  // Compute average attention if 'avg' is selected
  const displayWeights = useMemo(() => {
    if (selectedHead !== 'avg') {
      return attentionWeights[selectedHead] || [];
    }
    
    if (numHeads === 0 || seqLen === 0) return [];

    const avg = Array(seqLen).fill(0).map(() => Array(seqLen).fill(0));
    for (let h = 0; h < numHeads; h++) {
      for (let i = 0; i < seqLen; i++) {
        for (let j = 0; j < seqLen; j++) {
          avg[i][j] += (attentionWeights[h][i]?.[j] || 0) / numHeads;
        }
      }
    }
    return avg;
  }, [attentionWeights, selectedHead, numHeads, seqLen]);

  if (seqLen === 0) {
    return <div className="text-zinc-500 p-8 text-center font-body">No token data available.</div>;
  }

  const CELL_SIZE = Math.min(32, 400 / seqLen); // responsive size
  
  return (
    <div className="flex flex-col gap-6 w-full h-full p-6 text-zinc-100">
      
      {/* Head Selector */}
      <div className="flex gap-2 flex-wrap items-center">
        <span className="text-sm text-zinc-400 mr-2 font-display">Attention Heads:</span>
        <button
          onClick={() => setSelectedHead('avg')}
          className={`px-3 py-1 text-sm rounded-full transition-colors ${
            selectedHead === 'avg' 
              ? 'bg-blue-500 text-white' 
              : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
          }`}
        >
          Avg
        </button>
        {Array.from({ length: numHeads }).map((_, h) => (
          <button
            key={h}
            onClick={() => setSelectedHead(h)}
            className={`px-3 py-1 text-sm rounded-full transition-colors ${
              selectedHead === h 
                ? 'bg-blue-500 text-white' 
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            }`}
          >
            H{h + 1}
          </button>
        ))}
      </div>

      {/* Heatmap Grid */}
      <div className="relative flex justify-center items-center overflow-auto p-4 bg-black/20 rounded-xl border border-white/5">
        <motion.div layout className="relative">
          
          {/* Top Labels (Target) */}
          <div className="flex absolute -top-8 left-8">
            {tokens.map((t, j) => (
              <div 
                key={j} 
                className="font-mono text-xs text-zinc-400 text-center origin-bottom-left -rotate-45"
                style={{ width: CELL_SIZE, height: 32 }}
              >
                {t}
              </div>
            ))}
          </div>

          <div className="flex mt-8">
            {/* Left Labels (Source) */}
            <div className="flex flex-col pr-2">
              {tokens.map((t, i) => (
                <div 
                  key={i} 
                  className="font-mono text-xs text-zinc-400 flex items-center justify-end"
                  style={{ height: CELL_SIZE, width: 24 }}
                >
                  {t}
                </div>
              ))}
            </div>

            {/* Matrix */}
            <div 
              className="relative border border-white/10 bg-black/40"
              style={{ width: seqLen * CELL_SIZE, height: seqLen * CELL_SIZE }}
              onMouseLeave={() => setHoveredCell(null)}
            >
              {displayWeights.map((row, i) => (
                row.map((weight, j) => (
                  <motion.div
                    key={`${i}-${j}`}
                    className="absolute"
                    style={{
                      top: i * CELL_SIZE,
                      left: j * CELL_SIZE,
                      width: CELL_SIZE,
                      height: CELL_SIZE,
                      backgroundColor: getViridisColor(weight),
                    }}
                    onMouseEnter={() => setHoveredCell({ row: i, col: j, weight })}
                  />
                ))
              ))}

              {/* Hover Crosshair */}
              {hoveredCell && (
                <>
                  <div 
                    className="absolute bg-white/20 pointer-events-none"
                    style={{
                      top: hoveredCell.row * CELL_SIZE,
                      left: 0,
                      width: seqLen * CELL_SIZE,
                      height: CELL_SIZE,
                    }}
                  />
                  <div 
                    className="absolute bg-white/20 pointer-events-none"
                    style={{
                      top: 0,
                      left: hoveredCell.col * CELL_SIZE,
                      width: CELL_SIZE,
                      height: seqLen * CELL_SIZE,
                    }}
                  />
                </>
              )}
            </div>
          </div>

        </motion.div>
      </div>

      {/* Tooltip detail */}
      <AnimatePresence>
        {hoveredCell && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-zinc-800 p-3 rounded-lg border border-white/10 font-mono text-sm inline-block self-start"
          >
            <span className="text-zinc-400">Token </span>
            <span className="text-blue-400">"{tokens[hoveredCell.row]}"</span>
            <span className="text-zinc-400"> attends to </span>
            <span className="text-cyan-400">"{tokens[hoveredCell.col]}"</span>
            <span className="text-zinc-400"> weight: </span>
            <span className="text-white">{(hoveredCell.weight).toFixed(4)}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
