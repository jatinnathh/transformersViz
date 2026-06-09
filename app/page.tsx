'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Loader2, Info } from 'lucide-react';
import dynamic from 'next/dynamic';
import TokenStrip from './components/TokenStrip';
import AttentionHeatmap from './components/AttentionHeatmap';
import PredictionBars from './components/PredictionBars';
import StageDetail from './components/StageDetail';
import ProcessingAnimation from './components/ProcessingAnimation';
import InfoPanel from './components/InfoPanel';

// Dynamically import 3D component to avoid SSR issues
const TransformerPipeline3D = dynamic(
  () => import('./components/TransformerPipeline3D'),
  { ssr: false }
);

export default function Home() {
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeStage, setActiveStage] = useState<string | null>(null);
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [results, setResults] = useState<any>(null);

  const processText = async (text: string) => {
    setIsProcessing(true);
    
    // Animate through stages
    const stages = ['tokenizer', 'embedding', 'positional', 'encoder', 'decoder', 'output'];
    const stageAnimation = async () => {
      for (const stage of stages) {
        setActiveStage(stage);
        await new Promise(resolve => setTimeout(resolve, 400));
      }
    };

    try {
      // Start stage animation
      const animationPromise = stageAnimation();
      
      // Call the API
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API error:', errorData);
        throw new Error(errorData.error || 'Failed to generate text');
      }

      const data = await response.json();
      console.log('Received data from API:', data);
      
      // Wait for animation to complete
      await animationPromise;

      setResults({
        tokens: data.tokens,
        attention: data.attention,
        predictions: data.predictions,
        output: data.output
      });
    } catch (error) {
      console.error('Error processing text, falling back to mock data:', error);
      
      // Fallback to mock data if API fails
      const tokens = text.split(' ');
      const mockAttention = tokens.map(() => 
        tokens.map(() => Math.random())
      );
      
      const mockPredictions = [
        { token: 'the', probability: 0.35 },
        { token: 'a', probability: 0.25 },
        { token: 'and', probability: 0.15 },
        { token: 'of', probability: 0.10 },
        { token: 'in', probability: 0.08 },
        { token: 'to', probability: 0.04 },
        { token: 'is', probability: 0.02 },
        { token: 'that', probability: 0.01 },
      ];

      setResults({
        tokens,
        attention: mockAttention,
        predictions: mockPredictions,
        output: text + ' [generated]'
      });
    }

    setIsProcessing(false);
    setActiveStage(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      processText(inputText);
    }
  };

  const getStageData = (stageId: string) => {
    if (!results) return {};
    
    switch (stageId) {
      case 'tokenizer':
        return { 
          tokens: results.tokens,
          vocabSize: 10000 
        };
      case 'embedding':
        return { 
          embeddings: { shape: [results.tokens?.length || 0, 512] },
          embeddingDim: 512,
          vocabSize: 10000
        };
      case 'positional':
        return { 
          tokens: results.tokens,
          maxSeqLen: 512 
        };
      case 'encoder':
        return { 
          tokens: results.tokens,
          attention: results.attention,
          numLayers: 6,
          numHeads: 8,
          ffDim: 2048
        };
      case 'decoder':
        return { 
          tokens: results.tokens,
          attention: results.attention,
          numLayers: 6,
          numHeads: 8
        };
      case 'output':
        return { 
          predictions: results.predictions,
          vocabSize: 10000,
          temperature: 1.0,
          sampling: 'Greedy'
        };
      default:
        return {};
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-zinc-900">
      {/* Header */}
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                Transformer Visualizer
              </h1>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                Interactive 3D visualization of transformer architecture
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-3 py-2 rounded-lg">
              <Info className="w-4 h-4" />
              Click stages to explore
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Input Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-800 p-6"
        >
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-4">
            Input Text
          </h2>
          <form onSubmit={handleSubmit} className="flex gap-3">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Enter text to visualize the transformer pipeline..."
              className="flex-1 px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-50 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isProcessing}
            />
            <button
              type="submit"
              disabled={isProcessing || !inputText.trim()}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-300 dark:disabled:bg-zinc-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Generate
                </>
              )}
            </button>
          </form>
        </motion.div>

        {/* 3D Pipeline Visualization */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-800 p-6"
        >
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-4">
            Transformer Pipeline
          </h2>
          <TransformerPipeline3D
            activeStage={activeStage || undefined}
            onStageClick={setSelectedStage}
          />
        </motion.div>

        {/* Results Section */}
        {results && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tokens */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-3">
                Tokenization
              </h3>
              <TokenStrip tokens={results.tokens} />
            </motion.div>

            {/* Predictions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <PredictionBars predictions={results.predictions} topK={8} />
            </motion.div>

            {/* Attention Heatmap */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="lg:col-span-2"
            >
              <AttentionHeatmap
                tokens={results.tokens}
                attentionWeights={results.attention}
                title="Attention Weights Visualization"
              />
            </motion.div>

            {/* Generated Output */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="lg:col-span-2 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-lg border border-blue-200 dark:border-blue-800 p-6"
            >
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-3">
                Generated Output
              </h3>
              <p className="text-xl text-zinc-800 dark:text-zinc-200 font-medium">
                {results.output}
              </p>
            </motion.div>
          </div>
        )}
      </main>

      {/* Stage Detail Modal */}
      {selectedStage && (
        <StageDetail
          stageId={selectedStage}
          onClose={() => setSelectedStage(null)}
          data={getStageData(selectedStage)}
        />
      )}

      {/* Processing Animation */}
      {isProcessing && activeStage && (
        <ProcessingAnimation stage={activeStage} />
      )}

      {/* Help Panel */}
      <InfoPanel />
    </div>
  );
}
