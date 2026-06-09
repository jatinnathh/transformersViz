'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PipelineStage,
  TransformerVizProps,
  PipelineFlowState,
  TokenStageDecision,
} from './types';
import { STAGE_DATA } from './constants/stageData';
import { PredictionBars } from './PredictionBars';

interface DetailPanelProps {
  selectedStage: PipelineStage | null;
  data: Partial<TransformerVizProps>;
  flowState: PipelineFlowState;
  onClose?: () => void;
  onSwitchToAttention?: () => void;
}

function getStageDecisionsForStage(
  decisions: TokenStageDecision[] | undefined,
  stage: PipelineStage,
  tokenIndex?: number
) {
  if (!decisions) return [];
  return decisions.filter(
    (d) => d.stage === stage && (tokenIndex === undefined || d.tokenIndex === tokenIndex)
  );
}

function LiveDecisionCard({
  decision,
  isLive,
}: {
  decision: TokenStageDecision;
  isLive: boolean;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-lg border p-4 ${
        isLive
          ? 'border-white/15 bg-white/[0.04]'
          : 'border-white/[0.06] bg-white/[0.02]'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {isLive && (
            <motion.span
              className="w-1.5 h-1.5 rounded-full bg-white"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
            />
          )}
          <span className="text-[10px] uppercase tracking-wider text-zinc-500">
            {isLive ? 'Live' : 'Step'} · Token #{decision.tokenIndex + 1}
          </span>
        </div>
        <span className="font-mono text-xs text-zinc-300 bg-white/5 px-2 py-0.5 rounded">
          &quot;{decision.token === ' ' ? '␣' : decision.token}&quot;
        </span>
      </div>

      <p className="text-sm text-zinc-300 leading-relaxed mb-4">{decision.summary}</p>

      <div className="grid grid-cols-2 gap-2 mb-4">
        {decision.metrics.map((m) => (
          <div key={m.label} className="bg-black/20 rounded-md px-2.5 py-2 border border-white/[0.04]">
            <p className="text-[9px] uppercase tracking-wider text-zinc-600 mb-0.5">{m.label}</p>
            <p className="text-xs font-mono text-zinc-300">{m.value}</p>
          </div>
        ))}
      </div>

      {decision.attentionTargets && decision.attentionTargets.length > 0 && (
        <div className="mb-4">
          <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2">
            Top attention targets
          </p>
          <div className="flex flex-col gap-1.5">
            {decision.attentionTargets.map((t) => (
              <div key={t.token} className="flex items-center gap-2">
                <span className="w-16 text-right font-mono text-[11px] text-zinc-400 truncate">
                  {t.token}
                </span>
                <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-white/40 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${t.weight * 100}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                <span className="w-10 text-[10px] font-mono text-zinc-500">
                  {(t.weight * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {decision.topK && decision.topK.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-3">
            Softmax distribution
          </p>
          <PredictionBars
            predictions={decision.topK.map((k) => ({
              token: k.token,
              prob: k.prob,
              logit: k.logit,
            }))}
            showLogits
          />
        </div>
      )}
    </motion.div>
  );
}

export const DetailPanel: React.FC<DetailPanelProps> = ({
  selectedStage,
  data,
  flowState,
  onClose,
  onSwitchToAttention,
}) => {
  if (!selectedStage) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-zinc-500 bg-[rgba(9,9,11,0.6)] backdrop-blur-md p-8">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-[240px]"
        >
          <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-zinc-600 text-sm">→</span>
          </div>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Select a pipeline stage to inspect token processing and decision logic
          </p>
        </motion.div>
      </div>
    );
  }

  const stageInfo = STAGE_DATA[selectedStage];
  const isLiveStage =
    flowState.isFlowing && flowState.activeStage === selectedStage;

  const liveDecision =
    isLiveStage && flowState.currentDecision?.stage === selectedStage
      ? flowState.currentDecision
      : null;

  const stageDecisions = getStageDecisionsForStage(
    data.stageDecisions,
    selectedStage
  );

  const renderStats = () => {
    const stats: { label: string; value: string }[] = [];

    switch (selectedStage) {
      case 'tokenizer':
        stats.push({ label: 'Input tokens', value: String(data.tokens?.length ?? 0) });
        stats.push({ label: 'Vocab size', value: '10,000' });
        break;
      case 'embedding':
      case 'positional':
        stats.push({ label: 'Output shape', value: `[${data.tokens?.length ?? 0}, 512]` });
        stats.push({ label: 'Parameters', value: '5.1M' });
        break;
      case 'encoder':
      case 'decoder':
        stats.push({ label: 'Layers', value: '6' });
        stats.push({ label: 'Heads', value: '8' });
        stats.push({ label: 'Parameters', value: '18.8M' });
        break;
      case 'output':
        stats.push({ label: 'Logits shape', value: `[1, 10000]` });
        stats.push({ label: 'Parameters', value: '5.1M' });
        break;
    }

    const timeMs = data.stageTiming?.[selectedStage] ?? 0;
    stats.push({ label: 'Latency', value: `${timeMs}ms` });

    return stats;
  };

  const renderTokenizerInner = () => {
    if (!data.tokens?.length) return null;
    return (
      <div className="mt-5 border-t border-white/[0.06] pt-5">
        <h3 className="text-[10px] text-zinc-500 uppercase tracking-[0.15em] mb-3">
          Token → ID mapping
        </h3>
        <div className="flex flex-col gap-1 max-h-48 overflow-y-auto custom-scrollbar pr-1">
          {data.tokens.map((token, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: idx * 0.02 }}
              className={`flex items-center justify-between px-2.5 py-2 rounded-md border text-xs font-mono transition-colors ${
                flowState.activeTokenIndex === idx && isLiveStage
                  ? 'border-white/15 bg-white/[0.04] text-zinc-100'
                  : 'border-white/[0.04] bg-black/20 text-zinc-400 hover:bg-white/[0.02]'
              }`}
            >
              <span>&quot;{token === ' ' ? '␣' : token}&quot;</span>
              <span className="text-zinc-600">→</span>
              <span className="text-zinc-300">{data.tokenIds?.[idx] ?? 1000 + idx}</span>
            </motion.div>
          ))}
        </div>
      </div>
    );
  };

  const renderEmbeddingInner = (isPositional = false) => {
    const vectors = isPositional ? data.positionalEncodings : data.embeddings;
    if (!data.tokens?.length || !vectors?.length) return null;

    return (
      <div className="mt-5 border-t border-white/[0.06] pt-5">
        <h3 className="text-[10px] text-zinc-500 uppercase tracking-[0.15em] mb-3">
          {isPositional ? 'Positional vectors' : 'Embedding vectors'}
        </h3>
        <div className="flex flex-col gap-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
          {data.tokens.slice(0, 12).map((token, idx) => {
            const vec = vectors[idx] || [];
            const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0));
            return (
              <div
                key={idx}
                className={`px-2.5 py-2 rounded-md border ${
                  flowState.activeTokenIndex === idx && isLiveStage
                    ? 'border-white/15 bg-white/[0.04]'
                    : 'border-white/[0.04] bg-black/20'
                }`}
              >
                <div className="flex justify-between items-center mb-1.5">
                  <span className="font-mono text-[11px] text-zinc-300">
                    &quot;{token === ' ' ? '␣' : token}&quot;
                  </span>
                  <span className="font-mono text-[10px] text-zinc-600">
                    L2={norm.toFixed(2)}
                  </span>
                </div>
                <div className="flex gap-px overflow-hidden rounded-sm h-3">
                  {vec.slice(0, 24).map((val, i) => {
                    const intensity = Math.min(1, Math.abs(val));
                    return (
                      <div
                        key={i}
                        className="flex-1 min-w-[3px]"
                        style={{
                          backgroundColor:
                            val > 0
                              ? `rgba(250,250,250,${intensity * 0.6})`
                              : `rgba(113,113,122,${intensity * 0.5})`,
                        }}
                        title={`dim ${i}: ${val.toFixed(4)}`}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-full flex flex-col bg-[rgba(9,9,11,0.6)] backdrop-blur-md border-l border-white/[0.06] overflow-y-auto custom-scrollbar">
      <div className="p-5 flex-1 flex flex-col">
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedStage}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Header */}
            <div className="mb-1 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-[10px] font-mono tracking-widest text-zinc-500 flex-shrink-0">
                  {stageInfo.icon}
                </span>
                <h2 className="text-base font-medium text-zinc-100 tracking-tight truncate">
                  {stageInfo.label}
                </h2>
              </div>
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-shrink-0 p-1.5 rounded-md text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.06] transition-colors md:hidden"
                  aria-label="Close panel"
                >
                  ✕
                </button>
              )}
            </div>

            <p className="text-[12px] text-zinc-500 leading-relaxed mb-5">
              {stageInfo.description}
            </p>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-2 mb-5">
              {renderStats().map((stat) => (
                <div
                  key={stat.label}
                  className="bg-white/[0.02] px-3 py-2.5 rounded-lg border border-white/[0.05]"
                >
                  <div className="text-[9px] text-zinc-600 uppercase tracking-wider mb-0.5">
                    {stat.label}
                  </div>
                  <div className="text-xs font-mono text-zinc-300">{stat.value}</div>
                </div>
              ))}
            </div>

            {/* Live decision */}
            {liveDecision && (
              <div className="mb-5">
                <LiveDecisionCard decision={liveDecision} isLive />
              </div>
            )}

            {/* Historical decisions for this stage */}
            {!liveDecision && stageDecisions.length > 0 && (
              <div className="mb-5 flex flex-col gap-3">
                <h3 className="text-[10px] text-zinc-500 uppercase tracking-[0.15em]">
                  Processing log
                </h3>
                {stageDecisions.slice(-3).reverse().map((d, i) => (
                  <LiveDecisionCard key={`${d.tokenIndex}-${i}`} decision={d} isLive={false} />
                ))}
              </div>
            )}

            {/* Stage-specific panels */}
            {selectedStage === 'tokenizer' && renderTokenizerInner()}
            {selectedStage === 'embedding' && renderEmbeddingInner(false)}
            {selectedStage === 'positional' && renderEmbeddingInner(true)}

            {(selectedStage === 'encoder' || selectedStage === 'decoder') &&
              onSwitchToAttention && (
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={onSwitchToAttention}
                  className="mt-5 w-full py-2.5 px-4 bg-white/[0.04] hover:bg-white/[0.07] text-zinc-300 rounded-lg border border-white/[0.08] transition-colors text-sm font-medium"
                >
                  Open attention visualization →
                </motion.button>
              )}

            {selectedStage === 'output' &&
              !liveDecision &&
              data.topKPredictions &&
              data.topKPredictions.length > 0 && (
                <div className="mt-5 border-t border-white/[0.06] pt-5">
                  <h3 className="text-[10px] text-zinc-500 uppercase tracking-[0.15em] mb-3">
                    Latest prediction
                  </h3>
                  <PredictionBars
                    predictions={data.topKPredictions[data.topKPredictions.length - 1]}
                    showLogits
                  />
                </div>
              )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
