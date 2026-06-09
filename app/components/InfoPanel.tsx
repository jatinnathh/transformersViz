'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, HelpCircle } from 'lucide-react';
import { useState } from 'react';

export default function InfoPanel() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-30 p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-colors"
        aria-label="Help"
      >
        <HelpCircle className="w-6 h-6" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-700 p-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                  How to Use This Visualizer
                </h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-zinc-600 dark:text-zinc-400" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Quick Start */}
                <section>
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-3">
                    🚀 Quick Start
                  </h3>
                  <ol className="space-y-2 text-zinc-700 dark:text-zinc-300">
                    <li>1. Enter some text in the input field above</li>
                    <li>2. Click the "Generate" button</li>
                    <li>3. Watch the 3D pipeline animate</li>
                    <li>4. Explore the results below</li>
                  </ol>
                </section>

                {/* Interactive Features */}
                <section>
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-3">
                    🎯 Interactive Features
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                      <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                        3D Pipeline
                      </p>
                      <p className="text-blue-800 dark:text-blue-200">
                        • <strong>Click</strong> on any stage to see detailed information<br />
                        • <strong>Drag</strong> to rotate the view<br />
                        • <strong>Scroll</strong> to zoom in/out<br />
                        • <strong>Right-click + drag</strong> to pan
                      </p>
                    </div>

                    <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                      <p className="font-medium text-purple-900 dark:text-purple-100 mb-1">
                        Attention Heatmap
                      </p>
                      <p className="text-purple-800 dark:text-purple-200">
                        • <strong>Hover</strong> over cells to see exact attention weights<br />
                        • <strong>Colors</strong> show attention intensity (blue = low, red = high)<br />
                        • Rows show which token is attending<br />
                        • Columns show what it's attending to
                      </p>
                    </div>

                    <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
                      <p className="font-medium text-green-900 dark:text-green-100 mb-1">
                        Prediction Bars
                      </p>
                      <p className="text-green-800 dark:text-green-200">
                        • Shows the <strong>top predicted next tokens</strong><br />
                        • Bar length indicates probability<br />
                        • Top prediction has the strongest color
                      </p>
                    </div>
                  </div>
                </section>

                {/* Pipeline Stages */}
                <section>
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-3">
                    🔄 Pipeline Stages
                  </h3>
                  <div className="space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
                    <div className="flex gap-3">
                      <div className="w-3 h-3 rounded bg-blue-500 mt-1 flex-shrink-0" />
                      <div>
                        <strong>Tokenizer:</strong> Splits text into tokens
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-3 h-3 rounded bg-purple-500 mt-1 flex-shrink-0" />
                      <div>
                        <strong>Embedding:</strong> Converts tokens to vectors
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-3 h-3 rounded bg-pink-500 mt-1 flex-shrink-0" />
                      <div>
                        <strong>Positional Encoding:</strong> Adds position info
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-3 h-3 rounded bg-yellow-500 mt-1 flex-shrink-0" />
                      <div>
                        <strong>Encoder:</strong> Processes with self-attention
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-3 h-3 rounded bg-green-500 mt-1 flex-shrink-0" />
                      <div>
                        <strong>Decoder:</strong> Generates output
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-3 h-3 rounded bg-red-500 mt-1 flex-shrink-0" />
                      <div>
                        <strong>Output Layer:</strong> Predicts next token
                      </div>
                    </div>
                  </div>
                </section>

                {/* Tips */}
                <section>
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-3">
                    💡 Tips
                  </h3>
                  <ul className="space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
                    <li>• Start with short phrases to see clear patterns</li>
                    <li>• Try different inputs to compare attention patterns</li>
                    <li>• Use dark mode for reduced eye strain</li>
                    <li>• Click through all stages to understand the full process</li>
                  </ul>
                </section>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
