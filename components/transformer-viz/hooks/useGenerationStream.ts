/* eslint-disable */
import { useState, useEffect } from 'react';

export function useGenerationStream(
  generatedTokens: string[], 
  isGenerating: boolean, 
  typingSpeedMs: number = 80
) {
  const [displayedTokens, setDisplayedTokens] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    // If generation starts fresh or resets
    if (!isGenerating && generatedTokens.length === 0) {
      setDisplayedTokens([]);
      setCurrentIndex(0);
      return;
    }
    
    // If we have more tokens to display than currently displayed
    if (generatedTokens.length > currentIndex) {
      const timer = setTimeout(() => {
        setDisplayedTokens(prev => [...prev, generatedTokens[currentIndex]]);
        setCurrentIndex(prev => prev + 1);
      }, typingSpeedMs);
      
      return () => clearTimeout(timer);
    }
    
    // If backend generation finishes and we've caught up, we just stay in sync.
  }, [generatedTokens, currentIndex, isGenerating, typingSpeedMs]);

  return { displayedTokens, isStreaming: currentIndex < generatedTokens.length || isGenerating };
}
