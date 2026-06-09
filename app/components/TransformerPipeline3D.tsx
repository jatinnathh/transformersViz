'use client';

import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text, Box } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Binary, 
  Layers, 
  Activity, 
  Cpu, 
  Shuffle, 
  BarChart3, 
  HelpCircle, 
  ToggleLeft, 
  ToggleRight,
  ChevronRight,
  AlertCircle
} from 'lucide-react';

interface PipelineStage {
  id: string;
  name: string;
  position: [number, number, number];
  color: string;
  description: string;
  icon: React.ComponentType<any>;
}

const stages: PipelineStage[] = [
  {
    id: 'tokenizer',
    name: 'Tokenizer',
    position: [-7.5, 0, 0],
    color: '#3b82f6', // blue
    description: 'Splits text into subword tokens',
    icon: Binary
  },
  {
    id: 'embedding',
    name: 'Embedding',
    position: [-4.5, 0, 0],
    color: '#8b5cf6', // purple
    description: 'Maps tokens to continuous vectors',
    icon: Layers
  },
  {
    id: 'positional',
    name: 'Positional Encoding',
    position: [-1.5, 0, 0],
    color: '#ec4899', // pink
    description: 'Injects word order information',
    icon: Activity
  },
  {
    id: 'encoder',
    name: 'Encoder Stack',
    position: [1.5, 0, 0],
    color: '#f59e0b', // amber
    description: 'Processes self-attention context',
    icon: Cpu
  },
  {
    id: 'decoder',
    name: 'Decoder Stack',
    position: [4.5, 0, 0],
    color: '#10b981', // emerald
    description: 'Generates outputs autoregressively',
    icon: Shuffle
  },
  {
    id: 'output',
    name: 'Output Layer',
    position: [7.5, 0, 0],
    color: '#ef4444', // red
    description: 'Projects logits to vocabulary',
    icon: BarChart3
  }
];

// --- React Canvas Error Boundary ---
class CanvasErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('Canvas Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// --- 3D Components ---
interface StageBoxProps {
  stage: PipelineStage;
  isActive: boolean;
  onClick: () => void;
}

function StageBox({ stage, isActive, onClick }: StageBoxProps) {
  return (
    <group position={stage.position}>
      <Box
        args={[2, 2, 1]}
        onClick={onClick}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'auto';
        }}
      >
        <meshStandardMaterial
          color={stage.color}
          emissive={stage.color}
          emissiveIntensity={isActive ? 0.6 : 0.2}
          roughness={0.2}
          metalness={0.3}
        />
      </Box>
      <Text
        position={[0, 0, 0.6]}
        fontSize={0.22}
        color="white"
        anchorX="center"
        anchorY="middle"
        maxWidth={1.8}
        textAlign="center"
      >
        {stage.name}
      </Text>
    </group>
  );
}

function ConnectionLine({ start, end }: { start: [number, number, number]; end: [number, number, number] }) {
  const midX = (start[0] + end[0]) / 2;
  const length = Math.abs(end[0] - start[0]) - 2;
  
  return (
    <group position={[midX, start[1], start[2]]}>
      <Box args={[length, 0.1, 0.1]}>
        <meshStandardMaterial color="#475569" emissive="#1e293b" emissiveIntensity={0.1} />
      </Box>
    </group>
  );
}

// --- Main Component ---
interface TransformerPipeline3DProps {
  activeStage?: string;
  onStageClick?: (stageId: string) => void;
}

export default function TransformerPipeline3D({ activeStage, onStageClick }: TransformerPipeline3DProps) {
  const [viewMode, setViewMode] = useState<'3d' | '2d'>('3d');
  const [webglSupported, setWebglSupported] = useState(true);

  // WebGL Support Detection
  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const support = !!(
        window.WebGLRenderingContext &&
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
      );
      if (!support) {
        setWebglSupported(false);
        setViewMode('2d');
      }
    } catch (e) {
      setWebglSupported(false);
      setViewMode('2d');
    }
  }, []);

  const handleStageClick = (stageId: string) => {
    onStageClick?.(stageId);
  };

  // 2D Pipeline Interactive View
  const render2DPipeline = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 p-4">
        {stages.map((stage, index) => {
          const isActive = activeStage === stage.id;
          const IconComponent = stage.icon;

          return (
            <div key={stage.id} className="relative flex flex-col items-center">
              {/* Connector for large screens */}
              {index < stages.length - 1 && (
                <div className="hidden xl:block absolute top-1/2 left-[calc(100%-8px)] -translate-y-1/2 z-10 text-zinc-400 dark:text-zinc-600">
                  <ChevronRight className="w-5 h-5 animate-pulse" />
                </div>
              )}

              <motion.div
                whileHover={{ scale: 1.03, y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleStageClick(stage.id)}
                className={`w-full h-full flex flex-col justify-between p-5 rounded-xl border transition-all duration-300 cursor-pointer bg-white dark:bg-zinc-900 select-none shadow-md ${
                  isActive
                    ? 'border-2 shadow-lg ring-2 ring-offset-2 ring-offset-zinc-50 dark:ring-offset-zinc-950'
                    : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                }`}
                style={{
                  borderColor: isActive ? stage.color : undefined,
                  boxShadow: isActive ? `0 10px 25px -5px ${stage.color}25, 0 8px 10px -6px ${stage.color}25` : undefined,
                  // @ts-ignore
                  '--tw-ring-color': stage.color
                }}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span 
                      className="p-2.5 rounded-lg text-white" 
                      style={{ backgroundColor: stage.color }}
                    >
                      <IconComponent className="w-5 h-5" />
                    </span>
                    {isActive && (
                      <span className="flex h-3 w-3 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: stage.color }}></span>
                        <span className="relative inline-flex rounded-full h-3 w-3" style={{ backgroundColor: stage.color }}></span>
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-zinc-900 dark:text-zinc-50 text-base leading-snug">
                      {stage.name}
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 line-clamp-2">
                      {stage.description}
                    </p>
                  </div>
                </div>

                {/* Custom mini interactive visualization inside the card */}
                <div className="mt-5 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                  {stage.id === 'tokenizer' && (
                    <div className="flex flex-wrap gap-1 text-[10px] font-mono">
                      <span className="px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30">The</span>
                      <span className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">mod</span>
                      <span className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">el</span>
                    </div>
                  )}
                  {stage.id === 'embedding' && (
                    <div className="grid grid-cols-6 gap-0.5 h-6 rounded overflow-hidden">
                      <div className="bg-purple-900"></div>
                      <div className="bg-purple-700"></div>
                      <div className="bg-purple-500"></div>
                      <div className="bg-purple-400"></div>
                      <div className="bg-purple-300"></div>
                      <div className="bg-purple-200"></div>
                    </div>
                  )}
                  {stage.id === 'positional' && (
                    <div className="h-6 flex items-center justify-center">
                      <svg className="w-full h-4 overflow-visible" stroke={stage.color} strokeWidth="1.5" fill="none">
                        <path d="M 0 8 Q 15 -4, 30 8 T 60 8 T 90 8" />
                      </svg>
                    </div>
                  )}
                  {stage.id === 'encoder' && (
                    <div className="grid grid-cols-4 gap-0.5 h-6">
                      <div className="bg-amber-500/20 border border-amber-500/40 rounded"></div>
                      <div className="bg-amber-500/80 rounded"></div>
                      <div className="bg-amber-500/40 rounded"></div>
                      <div className="bg-amber-500/60 rounded"></div>
                    </div>
                  )}
                  {stage.id === 'decoder' && (
                    <div className="grid grid-cols-4 gap-0.5 h-6">
                      <div className="bg-emerald-500/80 rounded"></div>
                      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded"></div>
                      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded"></div>
                      <div className="bg-emerald-500/50 rounded"></div>
                    </div>
                  )}
                  {stage.id === 'output' && (
                    <div className="flex items-end gap-1 h-6">
                      <div className="w-full bg-red-500 h-3 rounded-t"></div>
                      <div className="w-full bg-red-400 h-5 rounded-t"></div>
                      <div className="w-full bg-red-300 h-2 rounded-t"></div>
                      <div className="w-full bg-red-200 h-1 rounded-t"></div>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Visualizer Controls */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          {!webglSupported && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/30 rounded-full text-xs text-amber-700 dark:text-amber-400">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>WebGL context not available. Showing 2D visualization.</span>
            </div>
          )}
        </div>
        
        {webglSupported && (
          <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800/80 p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700">
            <button
              onClick={() => setViewMode('2d')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                viewMode === '2d'
                  ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-50 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
              }`}
            >
              2D Diagram
            </button>
            <button
              onClick={() => setViewMode('3d')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                viewMode === '3d'
                  ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-50 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
              }`}
            >
              3D Interactive
            </button>
          </div>
        )}
      </div>

      {/* Main Viewport Container */}
      <div className="w-full min-h-[360px] bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-inner flex flex-col justify-center">
        <AnimatePresence mode="wait">
          {viewMode === '3d' && webglSupported ? (
            <motion.div
              key="3d-canvas"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-[500px]"
            >
              <CanvasErrorBoundary 
                fallback={
                  <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center space-y-4">
                    <AlertCircle className="w-12 h-12 text-amber-500" />
                    <div className="max-w-md">
                      <h4 className="font-bold text-zinc-900 dark:text-zinc-50">WebGL Crash Detected</h4>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
                        Your browser or graphics driver encountered an error rendering the 3D Canvas.
                        Automatically falling back to 2D view.
                      </p>
                    </div>
                    <button
                      onClick={() => setViewMode('2d')}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      Switch to 2D Diagram
                    </button>
                  </div>
                }
              >
                <Canvas camera={{ position: [0, 6, 16], fov: 45 }}>
                  <ambientLight intensity={0.6} />
                  <pointLight position={[10, 15, 10]} intensity={1.2} />
                  <pointLight position={[-10, -10, -10]} intensity={0.4} />
                  
                  {/* Render connection lines */}
                  {stages.slice(0, -1).map((stage, idx) => (
                    <ConnectionLine
                      key={`line-${idx}`}
                      start={stage.position}
                      end={stages[idx + 1].position}
                    />
                  ))}
                  
                  {/* Render stage boxes */}
                  {stages.map((stage) => (
                    <StageBox
                      key={stage.id}
                      stage={stage}
                      isActive={activeStage === stage.id}
                      onClick={() => handleStageClick(stage.id)}
                    />
                  ))}
                  
                  <OrbitControls
                    enableZoom={true}
                    enablePan={true}
                    enableRotate={true}
                    minDistance={8}
                    maxDistance={25}
                  />
                </Canvas>
              </CanvasErrorBoundary>
            </motion.div>
          ) : (
            <motion.div
              key="2d-diagram"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full py-6"
            >
              {render2DPipeline()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
