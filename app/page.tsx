'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import {
  TransformerVizProps,
  TokenStageDecision,
  PipelineStage,
  PIPELINE_STAGES,
} from '../components/transformer-viz/types';
import {
  extractGeneratedText,
  tokenizeForDisplay,
} from '../components/transformer-viz/utils/tokenFormat';

const TransformerViz = dynamic(
  () =>
    import('../components/transformer-viz/TransformerViz').then((mod) => mod.TransformerViz),
  { ssr: false }
);

function generateStageDecisions(
  tokens: string[],
  tokenIds: number[],
  outputTokens: string[],
  topKPredictions: Array<{ token: string; prob: number; logit?: number }[]>
): TokenStageDecision[] {
  const decisions: TokenStageDecision[] = [];
  const allTokens = tokens;

  allTokens.forEach((token, tokenIndex) => {
    const tokenId = tokenIds[tokenIndex] ?? 1000 + tokenIndex;
    const prevTokens = allTokens.slice(0, tokenIndex);

    PIPELINE_STAGES.forEach((stage) => {
      switch (stage) {
        case 'tokenizer':
          decisions.push({
            stage,
            tokenIndex,
            token,
            summary: `BPE merged "${token}" into vocabulary index ${tokenId}. ${
              tokenIndex > 0
                ? `Continues sequence after "${prevTokens[prevTokens.length - 1]}".`
                : 'First token in sequence.'
            }`,
            metrics: [
              { label: 'Token ID', value: String(tokenId) },
              { label: 'Byte length', value: String(new TextEncoder().encode(token).length) },
              { label: 'Position', value: String(tokenIndex) },
              { label: 'Merge rank', value: String(Math.floor(Math.random() * 500) + 100) },
            ],
          });
          break;

        case 'embedding':
          decisions.push({
            stage,
            tokenIndex,
            token,
            summary: `Looked up row ${tokenId} in embedding matrix E ∈ ℝ^${10000}×512. Vector captures semantic neighborhood of "${token}".`,
            metrics: [
              { label: 'Lookup row', value: String(tokenId) },
              { label: 'd_model', value: '512' },
              { label: 'L2 norm', value: (0.8 + Math.random() * 0.4).toFixed(3) },
              { label: 'Top dim', value: `d${Math.floor(Math.random() * 512)}` },
            ],
          });
          break;

        case 'positional':
          decisions.push({
            stage,
            tokenIndex,
            token,
            summary: `Added sin/cos positional encoding at index ${tokenIndex}. Even dims use sin, odd dims use cos with wavelength progression.`,
            metrics: [
              { label: 'Position', value: String(tokenIndex) },
              { label: 'PE max', value: (0.5 + Math.random() * 0.5).toFixed(3) },
              { label: 'PE min', value: (-0.5 - Math.random() * 0.3).toFixed(3) },
              { label: 'Combined', value: 'x + PE(pos)' },
            ],
          });
          break;

        case 'encoder':
          decisions.push({
            stage,
            tokenIndex,
            token,
            summary: `Self-attention across ${tokenIndex + 1} tokens. "${token}" aggregates context from prior tokens via 8 parallel attention heads.`,
            metrics: [
              { label: 'Seq len', value: String(tokenIndex + 1) },
              { label: 'Heads', value: '8' },
              { label: 'Layers', value: '6' },
              { label: 'Attn entropy', value: (1.5 + Math.random()).toFixed(2) },
            ],
            attentionTargets: prevTokens
              .slice(-4)
              .concat(token)
              .map((t, i, arr) => ({
                token: t,
                weight: (i + 1) / arr.reduce((s, _, j) => s + j + 1, 0),
              }))
              .reverse()
              .slice(0, 4),
          });
          break;

        case 'decoder':
          decisions.push({
            stage,
            tokenIndex,
            token,
            summary: `Causal self-attention with cross-attention to encoder. Position ${tokenIndex} can attend to positions 0..${tokenIndex} only.`,
            metrics: [
              { label: 'Mask', value: 'Causal' },
              { label: 'Cross-attn', value: 'Enabled' },
              { label: 'KV cache', value: tokenIndex > 0 ? 'Hit' : 'Miss' },
              { label: 'Layer norm', value: 'Pre-LN' },
            ],
            attentionTargets: prevTokens
              .slice(-3)
              .map((t, i) => ({
                token: t,
                weight: 0.15 + Math.random() * 0.35 - i * 0.05,
              }))
              .filter((t) => t.weight > 0)
              .slice(0, 3),
          });
          break;

        case 'output':
          if (tokenIndex >= allTokens.length - outputTokens.length) {
            const outIdx = tokenIndex - (allTokens.length - outputTokens.length);
            const preds = topKPredictions[outIdx];
            if (preds) {
              decisions.push({
                stage,
                tokenIndex,
                token,
                summary: `Linear projection → softmax over 10,000 vocab entries. Selected "${token}" with ${(preds[0].prob * 100).toFixed(1)}% confidence via argmax.`,
                metrics: [
                  { label: 'Selected', value: `"${token}"` },
                  { label: 'Confidence', value: `${(preds[0].prob * 100).toFixed(1)}%` },
                  { label: 'Logit gap', value: preds[1] ? (preds[0].logit! - (preds[1].logit ?? 0)).toFixed(2) : '—' },
                  { label: 'Vocab size', value: '10,000' },
                ],
                topK: preds.map((p) => ({
                  token: p.token,
                  prob: p.prob,
                  logit: p.logit ?? Math.log(p.prob / (1 - p.prob)),
                })),
              });
            }
          } else {
            decisions.push({
              stage,
              tokenIndex,
              token,
              summary: `Input token "${token}" passes through output projection during teacher-forced encoding. No sampling applied.`,
              metrics: [
                { label: 'Mode', value: 'Teacher force' },
                { label: 'Sampling', value: 'None' },
                { label: 'Loss contrib', value: (Math.random() * 2).toFixed(3) },
                { label: 'Perplexity', value: (Math.exp(Math.random())).toFixed(2) },
              ],
            });
          }
          break;
      }
    });
  });

  return decisions;
}

export default function Home() {
  const [vizData, setVizData] = useState<TransformerVizProps>({
    inputText: '',
    tokens: [],
    tokenIds: [],
    embeddings: [],
    positionalEncodings: [],
    attentionWeights: [],
    encoderOutputs: [],
    decoderOutputs: [],
    logits: [],
    topKPredictions: [],
    generatedTokens: [],
    generatedText: '',
    isGenerating: false,
    stageTiming: {
      tokenizer: 12,
      embedding: 4,
      positional: 1,
      encoder: 45,
      decoder: 52,
      output: 8,
    },
    stageDecisions: [],
  });

  const generateMockDetails = (text: string, generatedOutput: string) => {
    const inputTokens = text.split(/\s+/).filter(Boolean);
    const outputTokens = tokenizeForDisplay(generatedOutput);
    const allTokens = [...inputTokens, ...outputTokens];
    const nTokens = allTokens.length;
    const nHeads = 8;
    const dModel = 512;

    const mockEmbeddings = Array(nTokens)
      .fill(0)
      .map(() => Array(dModel).fill(0).map(() => (Math.random() - 0.5) * 2));

    const mockAttentionLayer = Array(nHeads)
      .fill(0)
      .map(() =>
        Array(nTokens)
          .fill(0)
          .map((_, i) => {
            let sum = 0;
            const row = Array(nTokens).fill(0).map((_, j) => {
              const val = j <= i ? Math.random() * (i === j ? 1 : 0.5) : 0.01;
              sum += val;
              return val;
            });
            return row.map((v) => v / sum);
          })
      );

    const tokenIds = allTokens.map((_, i) => 1000 + i);

    const topKPredictions = outputTokens.map((t) => {
      const logitBase = 2 + Math.random() * 3;
      const preds = [
        { token: t, prob: 0.75 + Math.random() * 0.2, logit: logitBase },
        { token: 'the', prob: Math.random() * 0.08, logit: logitBase - 1.2 - Math.random() },
        { token: 'a', prob: Math.random() * 0.06, logit: logitBase - 1.5 - Math.random() },
        { token: '.', prob: Math.random() * 0.04, logit: logitBase - 2 - Math.random() },
        { token: 'is', prob: Math.random() * 0.03, logit: logitBase - 2.5 - Math.random() },
      ];
      const total = preds.reduce((s, p) => s + p.prob, 0);
      return preds
        .map((p) => ({ ...p, prob: p.prob / total }))
        .sort((a, b) => b.prob - a.prob);
    });

    const stageDecisions = generateStageDecisions(
      allTokens,
      tokenIds,
      outputTokens,
      topKPredictions
    );

    return {
      tokens: allTokens,
      tokenIds,
      embeddings: mockEmbeddings,
      positionalEncodings: mockEmbeddings,
      attentionWeights: [mockAttentionLayer],
      encoderOutputs: [],
      decoderOutputs: [],
      logits: [],
      topKPredictions,
      generatedTokens: outputTokens,
      generatedText: generatedOutput,
      stageDecisions,
    };
  };

  const processText = async (text: string) => {
    setVizData((prev) => ({
      ...prev,
      inputText: text,
      isGenerating: true,
      tokens: text.split(/\s+/).filter(Boolean),
      generatedTokens: [],
      generatedText: '',
      stageDecisions: [],
    }));

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) throw new Error('API request failed');

      const data = await response.json();
      const generatedText = extractGeneratedText(data.output ?? '', text);
      const mockRichData = generateMockDetails(text, generatedText);

      setVizData((prev) => ({
        ...prev,
        ...mockRichData,
        isGenerating: false,
      }));
    } catch (error) {
      console.error('API failed, using mocked data', error);
      const mockRichData = generateMockDetails(text, 'the stars above whisper softly tonight');
      setVizData((prev) => ({
        ...prev,
        ...mockRichData,
        isGenerating: false,
      }));
    }
  };

  return <TransformerViz {...vizData} onGenerate={processText} />;
}
