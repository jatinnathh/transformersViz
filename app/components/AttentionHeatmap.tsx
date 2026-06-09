'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';

interface AttentionHeatmapProps {
  tokens: string[];
  attentionWeights: number[][];
  title?: string;
}

export default function AttentionHeatmap({ tokens, attentionWeights, title = 'Attention Weights' }: AttentionHeatmapProps) {
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number } | null>(null);

  const getColor = (value: number) => {
    const intensity = Math.round(value * 255);
    return `rgb(${intensity}, ${Math.round(intensity * 0.5)}, ${255 - intensity})`;
  };

  return (
    <div className="p-6 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700">
      <h3 className="text-lg font-semibold mb-4 text-zinc-800 dark:text-zinc-100">{title}</h3>
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          <div className="flex mb-2">
            <div className="w-20" />
            {tokens.map((token, idx) => (
              <div key={idx} className="w-12 text-center text-xs text-zinc-600 dark:text-zinc-400 truncate">
                {token}
              </div>
            ))}
          </div>
          {tokens.map((rowToken, rowIdx) => (
            <div key={rowIdx} className="flex items-center mb-1">
              <div className="w-20 text-xs text-zinc-600 dark:text-zinc-400 truncate pr-2">
                {rowToken}
              </div>
              {attentionWeights[rowIdx]?.map((weight, colIdx) => (
                <motion.div
                  key={colIdx}
                  className="w-12 h-8 border border-zinc-300 dark:border-zinc-700 cursor-pointer relative"
                  style={{ backgroundColor: getColor(weight) }}
                  onMouseEnter={() => setHoveredCell({ row: rowIdx, col: colIdx })}
                  onMouseLeave={() => setHoveredCell(null)}
                  whileHover={{ scale: 1.2, zIndex: 10 }}
                >
                  {hoveredCell?.row === rowIdx && hoveredCell?.col === colIdx && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-zinc-800 text-white text-xs rounded whitespace-nowrap z-20">
                      {weight.toFixed(3)}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
