/* eslint-disable */
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function useParticleFlow(curve: THREE.CatmullRomCurve3, count: number, speed: number) {
  const pointsRef = useRef<THREE.InstancedMesh>(null);
  
  // Initialize particle offsets along the curve
  const particleOffsets = useMemo(() => {
    const MAX_PARTICLES = 100;
    const offsets = new Float32Array(MAX_PARTICLES);
    for (let i = 0; i < MAX_PARTICLES; i++) {
      offsets[i] = Math.random(); // Start at random position on curve
    }
    return offsets;
  }, []);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state, delta) => {
    if (!pointsRef.current || !curve) return;

    for (let i = 0; i < count; i++) {
      // Update offset
      particleOffsets[i] = (particleOffsets[i] + speed * delta) % 1;
      
      // Get point on curve
      const pos = curve.getPointAt(particleOffsets[i]);
      
      dummy.position.copy(pos);
      // Optional: add slight jitter for more organic look
      dummy.position.x += (Math.random() - 0.5) * 0.05;
      dummy.position.y += (Math.random() - 0.5) * 0.05;
      dummy.position.z += (Math.random() - 0.5) * 0.05;
      
      dummy.updateMatrix();
      pointsRef.current.setMatrixAt(i, dummy.matrix);
    }
    
    pointsRef.current.instanceMatrix.needsUpdate = true;
  });

  return pointsRef;
}
