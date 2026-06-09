'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { TransformerVizProps } from '../components/transformer-viz/types';

// Dynamically import the main visualizer to avoid SSR issues with Three.js
const TransformerViz = dynamic(
  () => import('../components/transformer-viz/TransformerViz').then(mod => mod.TransformerViz),
  { ssr: false }
);

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
    isGenerating: false,
    stageTiming: {
      tokenizer: 12,
      embedding: 4,
      positional: 1,
      encoder: 45,
      decoder: 52,
      output: 8
    }
  });

  const generateMockDetails = (text: string, generatedOutput: string) => {
    const inputTokens = text.split(' ').filter(Boolean);
    const outputTokens = generatedOutput.split(' ').filter(Boolean);
    const allTokens = [...inputTokens, ...outputTokens];
    const nTokens = allTokens.length;
    const nHeads = 8;
    const dModel = 512;

    // Mock Embeddings
    const mockEmbeddings = Array(nTokens).fill(0).map(() => 
      Array(dModel).fill(0).map(() => (Math.random() - 0.5) * 2)
    );

    // Mock Attention (1 layer for simplicity here, shape: [nHeads][nTokens][nTokens])
    const mockAttentionLayer = Array(nHeads).fill(0).map(() => {
      return Array(nTokens).fill(0).map((_, i) => {
        // Softmax-like distribution
        let sum = 0;
        const row = Array(nTokens).fill(0).map((_, j) => {
          // Tokens attend more to previous tokens or themselves
          const val = j <= i ? Math.random() * (i === j ? 1 : 0.5) : 0.01;
          sum += val;
          return val;
        });
        return row.map(v => v / sum);
      });
    });

    const mockAttention = [mockAttentionLayer]; // Wrap in an array for nLayers

    // Mock Top K for generated tokens
    const topKPredictions = outputTokens.map(t => {
      const preds = [
        { token: t, prob: 0.8 + Math.random() * 0.15 },
        { token: 'a', prob: Math.random() * 0.05 },
        { token: 'the', prob: Math.random() * 0.05 },
        { token: '.', prob: Math.random() * 0.02 },
        { token: 'is', prob: Math.random() * 0.02 },
      ];
      return preds.sort((a, b) => b.prob - a.prob);
    });

    return {
      tokens: allTokens,
      tokenIds: allTokens.map((_, i) => 1000 + i),
      embeddings: mockEmbeddings,
      positionalEncodings: mockEmbeddings, // mock
      attentionWeights: mockAttention,
      encoderOutputs: [],
      decoderOutputs: [],
      logits: [],
      topKPredictions,
      generatedTokens: outputTokens
    };
  };

  const processText = async (text: string) => {
    setVizData(prev => ({ ...prev, inputText: text, isGenerating: true, tokens: [], generatedTokens: [] }));

    try {
      // Use existing API
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error('API request failed');
      }

      const data = await response.json();
      const mockRichData = generateMockDetails(text, data.output.replace(text, '').trim());

      setVizData(prev => ({
        ...prev,
        ...mockRichData,
        isGenerating: false
      }));

    } catch (error) {
      console.error('API failed, using fully mocked data', error);
      // Fallback
      const mockRichData = generateMockDetails(text, 'generated mock response');
      setVizData(prev => ({
        ...prev,
        ...mockRichData,
        isGenerating: false
      }));
    }
  };

  return (
    <TransformerViz 
      {...vizData}
      onGenerate={processText}
    />
  );
}
