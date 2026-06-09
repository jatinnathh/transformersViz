/* eslint-disable */
import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import { StageBlock } from './StageBlock';
import { ParticleFlow } from './ParticleFlow';
import { PipelineStage } from './types';

interface PipelineCanvasProps {
  selectedStage: PipelineStage | null;
  onSelectStage: (stage: PipelineStage) => void;
  isGenerating: boolean;
  confidence?: number;
}

const STAGES: PipelineStage[] = [
  'tokenizer',
  'embedding',
  'positional',
  'encoder',
  'decoder',
  'output'
];

export const PipelineCanvas: React.FC<PipelineCanvasProps> = ({
  selectedStage,
  onSelectStage,
  isGenerating,
  confidence
}) => {
  // Calculate slightly curved positions
  const stagePositions = STAGES.map((_, i) => {
    // Arc logic: Math.sin(i * 0.3) * slight_offset
    // We want them spread across X, from roughly -6 to 6
    const x = -7.5 + i * 3.0;
    const z = Math.sin(i * 0.6) * 1.5 - 1.5; // slight curve inward
    return [x, 0, z] as [number, number, number];
  });

  return (
    <div className="w-full h-full relative" style={{ minHeight: '500px' }}>
      <Canvas camera={{ position: [0, 2, 10], fov: 55 }}>
        <OrbitControls enablePan={false} minDistance={6} maxDistance={18} />
        
        {/* Environment */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <Stars radius={80} depth={30} count={800} factor={2} fade speed={1} />
        
        {/* Blueprint Grid Ground Plane */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.5, 0]}>
          <planeGeometry args={[100, 100]} />
          <meshBasicMaterial color="#1e3a5f" transparent opacity={0.3} wireframe />
        </mesh>

        {/* Postprocessing removed due to @react-three/postprocessing compatibility issue with current Three.js version */}

        {/* Stages and Data Flow */}
        <group position={[0, 0, 0]}>
          {STAGES.map((stage, i) => (
            <React.Fragment key={stage}>
              <StageBlock
                stageId={stage}
                position={stagePositions[i]}
                isSelected={selectedStage === stage}
                onClick={onSelectStage}
              />
              
              {/* Connect to next stage with particles */}
              {i < STAGES.length - 1 && (
                <ParticleFlow
                  startPos={stagePositions[i]}
                  endPos={stagePositions[i + 1]}
                  isGenerating={isGenerating}
                  confidence={confidence}
                />
              )}
            </React.Fragment>
          ))}
        </group>
      </Canvas>
    </div>
  );
};
