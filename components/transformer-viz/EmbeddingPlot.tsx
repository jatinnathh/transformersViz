import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { reduceTo2D } from './utils/reduceDimensions';

interface EmbeddingPlotProps {
  tokens: string[];
  embeddings: number[][]; // [nTokens][dModel]
}

export const EmbeddingPlot: React.FC<EmbeddingPlotProps> = ({ tokens, embeddings }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const points2D = useMemo(() => reduceTo2D(embeddings), [embeddings]);

  if (tokens.length === 0 || embeddings.length === 0 || points2D.length === 0) {
    return <div className="text-zinc-500 p-8 text-center font-body">No embedding data available.</div>;
  }

  // Plot dimensions
  const width = 800;
  const height = 500;
  const centerX = width / 2;
  const centerY = height / 2;

  // We map coordinates from [-100, 100] (output of reduceTo2D) to SVG canvas
  const mapCoord = (val: number, maxPx: number) => {
    return (val + 100) / 200 * maxPx;
  };

  return (
    <div className="w-full h-full flex items-center justify-center p-6 bg-black/20 rounded-xl border border-white/5 relative overflow-hidden">
      
      {/* Background Grid */}
      <div 
        className="absolute inset-0 opacity-10 pointer-events-none" 
        style={{
          backgroundImage: 'linear-gradient(rgba(59,130,246,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.5) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}
      />

      <svg width={width} height={height} className="relative z-10 overflow-visible">
        {/* Axes */}
        <line x1={0} y1={centerY} x2={width} y2={centerY} stroke="rgba(255,255,255,0.1)" strokeWidth={1} />
        <line x1={centerX} y1={0} x2={centerX} y2={height} stroke="rgba(255,255,255,0.1)" strokeWidth={1} />

        {points2D.map((p, i) => {
          const x = mapCoord(p.x, width);
          const y = mapCoord(p.y, height);
          const isHovered = hoveredIdx === i;
          
          // Color gradient from blue -> violet -> pink based on token position
          const progress = i / Math.max(1, tokens.length - 1);
          // Interpolate a simple color or just assign class
          const r = Math.round(59 + progress * (236 - 59)); // #3b to #ec
          const g = Math.round(130 + progress * (72 - 130)); // #82 to #48
          const b = Math.round(246 + progress * (153 - 246)); // #f6 to #99

          return (
            <g 
              key={`point-${i}`}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
              className="cursor-pointer transition-all duration-300"
              transform={`translate(${x}, ${y}) scale(${isHovered ? 1.5 : 1})`}
            >
              <circle 
                r={6} 
                fill={`rgb(${r},${g},${b})`} 
                stroke={isHovered ? 'white' : 'transparent'}
                strokeWidth={2}
                className="drop-shadow-md"
              />
              <text
                x={12}
                y={4}
                fill={isHovered ? 'white' : 'rgba(255,255,255,0.5)'}
                fontSize={14}
                fontFamily="JetBrains Mono, monospace"
                className="pointer-events-none drop-shadow-md"
              >
                {tokens[i]}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Hover Panel (Sparkline) */}
      {hoveredIdx !== null && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-6 left-6 right-6 bg-zinc-900/90 backdrop-blur-md p-4 rounded-lg border border-white/10 z-20"
        >
          <div className="flex items-center gap-4 mb-2">
            <span className="text-zinc-400 font-mono text-sm">Token [{hoveredIdx}]:</span>
            <span className="text-white font-mono font-bold text-lg">{tokens[hoveredIdx]}</span>
            <span className="text-zinc-500 font-mono text-xs ml-auto">Vector Dim: {embeddings[hoveredIdx].length}</span>
          </div>
          
          {/* Miniature Sparkline */}
          <div className="w-full h-8 flex items-end gap-[1px]">
            {embeddings[hoveredIdx].slice(0, 200).map((val, idx) => {
              // Normalize val roughly assuming standard normal-ish distribution for viz
              const h = Math.max(1, Math.min(32, Math.abs(val) * 10 + 16));
              return (
                <div 
                  key={idx} 
                  className="w-1 rounded-t-sm"
                  style={{ 
                    height: `${(h / 32) * 100}%`,
                    backgroundColor: val > 0 ? '#3b82f6' : '#ec4899',
                    opacity: 0.6
                  }}
                />
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
};
