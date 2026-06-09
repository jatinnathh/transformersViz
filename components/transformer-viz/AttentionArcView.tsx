import React, { useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';

interface AttentionArcViewProps {
  tokens: string[];
  attentionMatrix: number[][]; // [nTokens][nTokens]
}

export const AttentionArcView: React.FC<AttentionArcViewProps> = ({ tokens, attentionMatrix }) => {
  const [selectedTokenIdx, setSelectedTokenIdx] = useState<number | null>(null);

  const seqLen = tokens.length;
  const radius = 5;

  // Compute node positions in a circle for a cooler 3D layout, or flat rows
  // Let's do a circular layout for "arc view"
  const nodePositions = useMemo(() => {
    return tokens.map((_, i) => {
      const angle = (i / seqLen) * Math.PI * 2;
      return new THREE.Vector3(
        Math.cos(angle) * radius,
        0,
        Math.sin(angle) * radius
      );
    });
  }, [tokens, seqLen]);

  const arcs = useMemo(() => {
    const lines = [];
    for (let i = 0; i < seqLen; i++) {
      for (let j = 0; j < seqLen; j++) {
        const weight = attentionMatrix[i]?.[j] || 0;
        if (weight > 0.05) { // Threshold to reduce clutter
          // Arc curve
          const start = nodePositions[i];
          const end = nodePositions[j];
          const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
          // Raise arc based on distance
          const dist = start.distanceTo(end);
          mid.y += dist * 0.5;

          const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
          lines.push({ i, j, curve, weight });
        }
      }
    }
    return lines;
  }, [attentionMatrix, nodePositions, seqLen]);

  return (
    <div className="w-full h-full relative" style={{ minHeight: '500px' }}>
      <Canvas camera={{ position: [0, 8, 12], fov: 45 }}>
        <OrbitControls enablePan={true} enableZoom={true} />
        <ambientLight intensity={0.5} />
        
        {/* Nodes */}
        {nodePositions.map((pos, i) => (
          <group key={`node-${i}`} position={pos}>
            <mesh 
              onClick={(e) => {
                e.stopPropagation();
                setSelectedTokenIdx(selectedTokenIdx === i ? null : i);
              }}
              onPointerOver={() => document.body.style.cursor = 'pointer'}
              onPointerOut={() => document.body.style.cursor = 'auto'}
            >
              <sphereGeometry args={[0.3, 16, 16]} />
              <meshBasicMaterial color={selectedTokenIdx === i ? '#3b82f6' : '#8B5CF6'} />
            </mesh>
            <Text
              position={[0, -0.6, 0]}
              fontSize={0.4}
              color="white"
              anchorX="center"
              anchorY="middle"
            >
              {tokens[i]}
            </Text>
          </group>
        ))}

        {/* Arcs */}
        {arcs.map((arc, idx) => {
          // If a token is selected, fade out unrelated arcs
          const isFaded = selectedTokenIdx !== null && arc.i !== selectedTokenIdx;
          if (isFaded && selectedTokenIdx !== null) return null; // Or render highly transparent

          const opacity = isFaded ? 0.05 : arc.weight * 0.8 + 0.2;
          const thickness = arc.weight * 0.15;

          return (
            <mesh key={`arc-${idx}`}>
              <tubeGeometry args={[arc.curve, 20, Math.max(0.02, thickness), 8, false]} />
              <meshBasicMaterial 
                color="#06B6D4" 
                transparent 
                opacity={opacity} 
                blending={THREE.AdditiveBlending}
                depthWrite={false}
              />
            </mesh>
          );
        })}

        {/* Center Grid */}
        <gridHelper args={[20, 20, '#1e3a5f', '#1e3a5f']} position={[0, -1, 0]} />
      </Canvas>
      <div className="absolute top-4 left-4 text-zinc-400 text-sm font-body bg-black/50 p-2 rounded pointer-events-none">
        Click a node to isolate its outgoing attention.
      </div>
    </div>
  );
};
