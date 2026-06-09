/* eslint-disable */
import React, { useState, useEffect } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { motion, useReducedMotion } from 'framer-motion';
import { Send, Loader2, Info } from 'lucide-react';
import { TransformerVizProps, PipelineStage } from './types';
import { PipelineCanvas } from './PipelineCanvas';
import { DetailPanel } from './DetailPanel';
import { AttentionHeatmap } from './AttentionHeatmap';
import { AttentionArcView } from './AttentionArcView';
import { EmbeddingPlot } from './EmbeddingPlot';
import { GenerationView } from './GenerationView';

export const TransformerViz: React.FC<TransformerVizProps & { onGenerate: (text: string) => void }> = ({
  inputText: initialInput,
  tokens,
  tokenIds,
  embeddings,
  positionalEncodings,
  attentionWeights,
  topKPredictions,
  generatedTokens,
  isGenerating,
  stageTiming,
  onGenerate
}) => {
  const [inputText, setInputText] = useState(initialInput || '');
  const [activeTab, setActiveTab] = useState('pipeline');
  const [selectedStage, setSelectedStage] = useState<PipelineStage | null>(null);
  const [attentionViewType, setAttentionViewType] = useState<'2d' | '3d'>('2d');
  
  const shouldReduceMotion = useReducedMotion();

  // Keyboard navigation for stages
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
      
      const keyMap: Record<string, PipelineStage> = {
        '1': 'tokenizer', '2': 'embedding', '3': 'positional',
        '4': 'encoder', '5': 'decoder', '6': 'output'
      };
      
      if (keyMap[e.key]) {
        setSelectedStage(keyMap[e.key]);
        setActiveTab('pipeline');
      } else if (e.code === 'Space' && !isGenerating && inputText.trim()) {
        e.preventDefault();
        onGenerate(inputText);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [inputText, isGenerating, onGenerate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim() && !isGenerating) {
      onGenerate(inputText);
    }
  };

  const currentData = {
    tokens, 
    tokenIds,
    embeddings, 
    positionalEncodings,
    attentionWeights, 
    topKPredictions,
    generatedTokens,
    stageTiming
  };

  return (
    <div className="min-h-screen w-full bg-[#050508] text-white overflow-hidden relative font-body selection:bg-blue-500/30 selection:text-blue-200">
      
      {/* Background blueprint grid */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-50"
        style={{
          backgroundImage: 'linear-gradient(rgba(59,130,246,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.08) 1px, transparent 1px)',
          backgroundSize: '100px 100px',
          backgroundPosition: 'center center'
        }}
      />

      <div className="relative z-10 flex flex-col h-screen max-h-screen">
        
        {/* HEADER */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.5 }}
          className="flex-none p-6 pb-2"
        >
          <div className="max-w-7xl mx-auto">
            <div className="bg-[rgba(12,14,28,0.75)] backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl flex flex-col md:flex-row items-center gap-4">
              <div className="flex-1 w-full relative">
                <form onSubmit={handleSubmit} className="relative flex items-center">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Enter sequence to process..."
                    className="w-full bg-black/40 border border-white/5 focus:border-blue-500/50 rounded-xl px-4 py-3 text-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all"
                    disabled={isGenerating}
                  />
                  {tokens.length > 0 && (
                    <div className="absolute right-4 px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-md font-mono border border-blue-500/30">
                      {tokens.length} tokens
                    </div>
                  )}
                </form>
              </div>
              <button
                onClick={handleSubmit}
                disabled={isGenerating || !inputText.trim()}
                className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 disabled:from-zinc-800 disabled:to-zinc-800 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:text-zinc-500 shadow-[0_0_20px_rgba(59,130,246,0.3)] disabled:shadow-none whitespace-nowrap"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Generate
                  </>
                )}
              </button>
            </div>

            {/* Generated Output Strip */}
            {(generatedTokens.length > 0 || isGenerating) && (
              <motion.div 
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                className="p-4 bg-blue-900/20 backdrop-blur-md border border-blue-500/20 rounded-xl text-blue-50 font-mono text-sm leading-relaxed"
              >
                 <span className="text-blue-400 font-bold mr-3 font-display tracking-wider uppercase text-xs">Output</span>
                 <span className="opacity-90">
                   {generatedTokens.map(t => t === ' ' ? '\u00A0' : t).join('')}
                 </span>
                 {isGenerating && (
                   <span className="inline-block w-2 bg-blue-400 ml-1 h-[1.2em] translate-y-1 animate-pulse" />
                 )}
              </motion.div>
            )}
          </div>
        </motion.header>

        {/* MAIN CONTENT AREA */}
        <div className="flex-1 max-w-7xl mx-auto w-full px-6 pb-6 flex flex-col overflow-hidden">
          
          <Tabs.Root value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
            
            {/* TABS */}
            <Tabs.List className="flex gap-2 mb-4 bg-transparent">
              {['pipeline', 'attention', 'embeddings', 'generation'].map(tab => (
                <Tabs.Trigger
                  key={tab}
                  value={tab}
                  className="px-6 py-2 rounded-full font-medium text-sm transition-all capitalize data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-300 data-[state=active]:border-blue-500/30 border border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
                >
                  {tab}
                </Tabs.Trigger>
              ))}
            </Tabs.List>

            {/* TAB CONTENTS */}
            <div className="flex-1 relative min-h-0 bg-[rgba(12,14,28,0.75)] backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
              
              <Tabs.Content value="pipeline" className="absolute inset-0 flex flex-col md:flex-row outline-none">
                <div className="flex-1 relative">
                  <PipelineCanvas 
                    selectedStage={selectedStage} 
                    onSelectStage={setSelectedStage} 
                    isGenerating={isGenerating}
                    confidence={0.8} // Mock confidence
                  />
                </div>
                <div className="w-full md:w-[400px] h-full border-t md:border-t-0 md:border-l border-white/5">
                  <DetailPanel 
                    selectedStage={selectedStage} 
                    data={currentData} 
                    onSwitchToAttention={() => setActiveTab('attention')}
                  />
                </div>
              </Tabs.Content>

              <Tabs.Content value="attention" className="absolute inset-0 flex flex-col outline-none">
                <div className="flex justify-end p-4 border-b border-white/5">
                  <button 
                    onClick={() => setAttentionViewType(prev => prev === '2d' ? '3d' : '2d')}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-zinc-300 transition-colors border border-white/10"
                  >
                    Switch to {attentionViewType === '2d' ? '3D Arcs' : '2D Heatmap'}
                  </button>
                </div>
                <div className="flex-1 relative">
                  {attentionViewType === '2d' ? (
                    <AttentionHeatmap tokens={tokens} attentionWeights={attentionWeights[0] || []} />
                  ) : (
                    // We just pass the first head for the 3D view simplification
                    <AttentionArcView tokens={tokens} attentionMatrix={attentionWeights[0]?.[0] || []} />
                  )}
                </div>
              </Tabs.Content>

              <Tabs.Content value="embeddings" className="absolute inset-0 outline-none">
                <EmbeddingPlot tokens={tokens} embeddings={embeddings} />
              </Tabs.Content>

              <Tabs.Content value="generation" className="absolute inset-0 outline-none">
                <GenerationView 
                  generatedTokens={generatedTokens} 
                  isGenerating={isGenerating} 
                  topKPredictions={topKPredictions} 
                />
              </Tabs.Content>

            </div>
          </Tabs.Root>

        </div>

      </div>
    </div>
  );
};
