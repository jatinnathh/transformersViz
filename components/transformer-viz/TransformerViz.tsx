'use client';

import React, { useState, useEffect, useRef } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ArrowRight, Loader2 } from 'lucide-react';
import { TransformerVizProps, PipelineStage } from './types';
import { PipelineCanvas } from './PipelineCanvas';
import { DetailPanel } from './DetailPanel';
import { AttentionHeatmap } from './AttentionHeatmap';
import { AttentionArcView } from './AttentionArcView';
import { EmbeddingPlot } from './EmbeddingPlot';
import { GenerationView } from './GenerationView';
import { usePipelineFlow } from './hooks/usePipelineFlow';
import { joinTokens } from './utils/tokenFormat';

const TAB_ITEMS = [
  { id: 'pipeline', label: 'Pipeline' },
  { id: 'attention', label: 'Attention' },
  { id: 'embeddings', label: 'Embeddings' },
  { id: 'generation', label: 'Generation' },
] as const;

export const TransformerViz: React.FC<
  TransformerVizProps & { onGenerate: (text: string) => void }
> = ({
  inputText: initialInput,
  tokens,
  tokenIds,
  embeddings,
  positionalEncodings,
  attentionWeights,
  topKPredictions,
  generatedTokens,
  generatedText,
  isGenerating,
  stageTiming,
  stageDecisions,
  onGenerate,
}) => {
  const [inputText, setInputText] = useState(initialInput || '');
  const [activeTab, setActiveTab] = useState('pipeline');
  const [selectedStage, setSelectedStage] = useState<PipelineStage | null>(null);
  const [attentionViewType, setAttentionViewType] = useState<'2d' | '3d'>('2d');

  const shouldReduceMotion = useReducedMotion();
  const hasAutoOpenedPanel = useRef(false);

  const { flowState } = usePipelineFlow({
    tokens,
    isGenerating,
    stageTiming,
    stageDecisions,
  });

  // Auto-follow active stage during inference
  useEffect(() => {
    if (flowState.isFlowing && flowState.activeStage) {
      setSelectedStage(flowState.activeStage);
    }
  }, [flowState.isFlowing, flowState.activeStage]);

  // Open tokenizer panel once when first results arrive
  useEffect(() => {
    if (!isGenerating && tokens.length > 0 && !hasAutoOpenedPanel.current) {
      setSelectedStage('tokenizer');
      hasAutoOpenedPanel.current = true;
    }
    if (tokens.length === 0) {
      hasAutoOpenedPanel.current = false;
    }
  }, [isGenerating, tokens.length]);

  const displayOutput =
    generatedText ?? joinTokens(generatedTokens);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      )
        return;

      const keyMap: Record<string, PipelineStage> = {
        '1': 'tokenizer',
        '2': 'embedding',
        '3': 'positional',
        '4': 'encoder',
        '5': 'decoder',
        '6': 'output',
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
    stageTiming,
    stageDecisions,
  };

  return (
    <div className="min-h-screen w-full bg-[#09090b] text-zinc-100 overflow-hidden relative selection:bg-white/10">
      {/* Subtle radial gradient */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(255,255,255,0.04), transparent)',
        }}
      />

      <div className="relative z-10 flex flex-col h-screen max-h-screen">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="flex-none px-6 pt-6 pb-3"
        >
          <div className="max-w-[1400px] mx-auto">
            <div className="flex flex-col gap-3">
              {/* Title row */}
              <div className="flex items-center justify-between mb-1">
                <div>
                  <h1 className="text-sm font-medium text-zinc-100 tracking-tight">
                    Transformer Inspector
                  </h1>
                  <p className="text-[11px] text-zinc-600 mt-0.5">
                    Real-time inference visualization
                  </p>
                </div>
                {tokens.length > 0 && (
                  <span className="text-[10px] font-mono text-zinc-500 tabular-nums">
                    {tokens.length} tokens processed
                  </span>
                )}
              </div>

              {/* Input */}
              <form
                onSubmit={handleSubmit}
                className="flex items-center gap-3 bg-white/[0.02] border border-white/[0.06] rounded-xl p-1.5 pl-4 backdrop-blur-xl"
              >
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Enter text to analyze..."
                  className="flex-1 bg-transparent text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none py-2"
                  disabled={isGenerating}
                />
                <motion.button
                  type="submit"
                  disabled={isGenerating || !inputText.trim()}
                  whileHover={{ scale: isGenerating ? 1 : 1.02 }}
                  whileTap={{ scale: isGenerating ? 1 : 0.98 }}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white text-zinc-900 rounded-lg text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed transition-opacity"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Running
                    </>
                  ) : (
                    <>
                      Generate
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </motion.button>
              </form>

              {/* Output strip */}
              <AnimatePresence>
                {(generatedTokens.length > 0 || isGenerating) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 py-3 bg-white/[0.02] border border-white/[0.05] rounded-xl">
                      <span className="text-[10px] uppercase tracking-[0.15em] text-zinc-600 mr-3">
                        Output
                      </span>
                      <span className="font-mono text-[13px] text-zinc-300 leading-relaxed">
                        {displayOutput}
                      </span>
                      {isGenerating && (
                        <motion.span
                          className="inline-block w-[2px] h-[1em] bg-zinc-400 ml-0.5 align-middle"
                          animate={{ opacity: [1, 0, 1] }}
                          transition={{ repeat: Infinity, duration: 0.8 }}
                        />
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.header>

        {/* Main */}
        <div className="flex-1 max-w-[1400px] mx-auto w-full px-6 pb-6 flex flex-col overflow-hidden">
          <Tabs.Root value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
            {/* Tab bar */}
            <Tabs.List className="flex gap-1 mb-3 p-1 bg-white/[0.02] border border-white/[0.05] rounded-xl w-fit">
              {TAB_ITEMS.map((tab) => (
                <Tabs.Trigger
                  key={tab.id}
                  value={tab.id}
                  className="relative px-4 py-2 rounded-lg text-[13px] font-medium text-zinc-500 transition-colors data-[state=active]:text-zinc-100 hover:text-zinc-300"
                >
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="tab-indicator"
                      className="absolute inset-0 bg-white/[0.08] rounded-lg border border-white/[0.06]"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{tab.label}</span>
                </Tabs.Trigger>
              ))}
            </Tabs.List>

            {/* Content */}
            <div className="flex-1 relative min-h-0 bg-white/[0.015] border border-white/[0.06] rounded-2xl overflow-hidden">
              <Tabs.Content
                value="pipeline"
                className="absolute inset-0 outline-none overflow-hidden flex flex-col md:flex-row"
              >
                <div
                  className={`relative min-h-0 transition-all duration-300 ${
                    selectedStage ? 'flex-1 md:w-[58%] md:flex-none' : 'flex-1 w-full'
                  }`}
                >
                  <PipelineCanvas
                    selectedStage={selectedStage}
                    onSelectStage={setSelectedStage}
                    isGenerating={isGenerating}
                    flowState={flowState}
                  />
                </div>

                <AnimatePresence mode="wait">
                  {selectedStage ? (
                    <motion.div
                      key="detail-panel"
                      initial={{ opacity: 0, x: 24 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 24 }}
                      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                      className="w-full md:w-[42%] md:max-w-[440px] h-[42%] md:h-full flex-shrink-0 border-t md:border-t-0 md:border-l border-white/[0.08] bg-[#09090b]/95 md:bg-transparent"
                    >
                      <DetailPanel
                        selectedStage={selectedStage}
                        data={currentData}
                        flowState={flowState}
                        onClose={() => setSelectedStage(null)}
                        onSwitchToAttention={() => setActiveTab('attention')}
                      />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="detail-placeholder"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hidden md:flex w-[42%] max-w-[440px] flex-shrink-0 border-l border-white/[0.06] items-center justify-center p-8"
                    >
                      <p className="text-sm text-zinc-600 text-center leading-relaxed">
                        Click a stage card to inspect token processing
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Tabs.Content>

              <Tabs.Content value="attention" className="absolute inset-0 flex flex-col outline-none">
                <div className="flex justify-end p-4 border-b border-white/[0.05]">
                  <button
                    onClick={() => setAttentionViewType((p) => (p === '2d' ? '3d' : '2d'))}
                    className="px-3 py-1.5 bg-white/[0.04] hover:bg-white/[0.07] rounded-lg text-[12px] text-zinc-400 transition-colors border border-white/[0.06]"
                  >
                    {attentionViewType === '2d' ? '3D arc view' : '2D heatmap'}
                  </button>
                </div>
                <div className="flex-1 relative">
                  {attentionViewType === '2d' ? (
                    <AttentionHeatmap
                      tokens={tokens}
                      attentionWeights={attentionWeights[0] || []}
                    />
                  ) : (
                    <AttentionArcView
                      tokens={tokens}
                      attentionMatrix={attentionWeights[0]?.[0] || []}
                    />
                  )}
                </div>
              </Tabs.Content>

              <Tabs.Content value="embeddings" className="absolute inset-0 outline-none">
                <EmbeddingPlot tokens={tokens} embeddings={embeddings} />
              </Tabs.Content>

              <Tabs.Content value="generation" className="absolute inset-0 outline-none">
                <GenerationView
                  generatedTokens={generatedTokens}
                  generatedText={generatedText}
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
