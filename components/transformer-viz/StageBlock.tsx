/* eslint-disable */
import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, RoundedBox, Float } from '@react-three/drei';
import { useSpring, a } from '@react-spring/three';
import * as THREE from 'three';
import { PipelineStage, StageInfo } from './types';
import { STAGE_DATA } from './constants/stageData';

interface StageBlockProps {
  stageId: PipelineStage;
  position: [number, number, number];
  isSelected: boolean;
  onClick: (id: PipelineStage) => void;
}

export const StageBlock: React.FC<StageBlockProps> = ({ 
  stageId, 
  position, 
  isSelected, 
  onClick 
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const stageInfo: StageInfo = STAGE_DATA[stageId];
  
  // Spring animations for scale and emissive intensity
  const { scale, emissiveIntensity } = useSpring({
    scale: isSelected ? 1.12 : hovered ? 1.07 : 1,
    emissiveIntensity: isSelected ? 0.8 : hovered ? 0.5 : 0.15,
    config: { mass: 1, tension: 280, friction: 60 }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.05} floatIntensity={0.3} position={position}>
      <group>
        {/* The Block itself */}
        <a.mesh
          ref={meshRef}
          onClick={(e: any) => {
            e.stopPropagation();
            onClick(stageId);
          }}
          onPointerOver={(e: any) => {
            e.stopPropagation();
            setHovered(true);
            document.body.style.cursor = 'pointer';
          }}
          onPointerOut={(e: any) => {
            e.stopPropagation();
            setHovered(false);
            document.body.style.cursor = 'auto';
          }}
          scale={scale as any}
        >
          <RoundedBox args={[1.8, 2.4, 0.5]} radius={0.12} smoothness={4}>
            <a.meshStandardMaterial
              color={stageInfo.color}
              emissive={stageInfo.color}
              emissiveIntensity={emissiveIntensity}
              metalness={0.6}
              roughness={0.2}
            />
          </RoundedBox>
        </a.mesh>

        {/* Text Label */}
        <Text
          position={[0, -1.6, 0.3]}
          fontSize={0.18}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          {stageInfo.label}
        </Text>

        {/* Selection Ring */}
        {isSelected && (
          <mesh position={[0, -1.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[1.1, 1.15, 32]} />
            <meshBasicMaterial color={stageInfo.color} transparent opacity={0.6} side={THREE.DoubleSide} />
          </mesh>
        )}
      </group>
    </Float>
  );
};
