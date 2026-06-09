import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useParticleFlow } from './hooks/useParticleFlow';

interface ParticleFlowProps {
  startPos: [number, number, number];
  endPos: [number, number, number];
  isGenerating: boolean;
  confidence?: number;
}

export const ParticleFlow: React.FC<ParticleFlowProps> = ({ 
  startPos, 
  endPos, 
  isGenerating,
  confidence = 0.5 
}) => {
  // Create a curved path between start and end
  const curve = useMemo(() => {
    const start = new THREE.Vector3(...startPos);
    const end = new THREE.Vector3(...endPos);
    
    // Midpoint raised slightly to create an arc
    const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
    mid.y += 0.3; // arc height
    
    return new THREE.CatmullRomCurve3([start, mid, end]);
  }, [startPos, endPos]);

  // Determine flow parameters
  const count = isGenerating ? Math.floor(20 + 30 * confidence) : 4;
  const speed = isGenerating ? 0.3 + 0.5 * confidence : 0.05;

  const pointsRef = useParticleFlow(curve, count, speed);

  return (
    <instancedMesh ref={pointsRef} args={[undefined, undefined, 100]} count={count}>
      <sphereGeometry args={[0.04, 8, 8]} />
      <meshBasicMaterial 
        color="#06B6D4" 
        transparent 
        opacity={isGenerating ? 0.8 : 0.3}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </instancedMesh>
  );
};
