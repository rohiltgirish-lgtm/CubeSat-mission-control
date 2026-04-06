import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { SpaceObject } from '../../types';
import { getObjectPosition } from './spaceMath';

type OrbitTrailProps = {
  source: SpaceObject;
  target: SpaceObject;
  sourceIndex: number;
  targetIndex: number;
};

export function OrbitTrail({ source, target, sourceIndex, targetIndex }: OrbitTrailProps) {
  const geometry = useMemo(() => new THREE.BufferGeometry(), []);
  const material = useMemo(() => new THREE.LineBasicMaterial({ transparent: true, opacity: 0.45, color: '#38bdf8' }), []);
  const line = useMemo(() => new THREE.Line(geometry, material), [geometry, material]);

  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    const a = getObjectPosition(source, time, sourceIndex);
    const b = getObjectPosition(target, time, targetIndex);
    geometry.setFromPoints([a, b]);
    geometry.computeBoundingSphere();

    const distance = a.distanceTo(b);
    material.color.set(distance < 0.65 ? '#fb7185' : '#38bdf8');
    material.opacity = distance < 3.2 ? (distance < 0.65 ? 0.9 : 0.45) : 0;
  });

  return <primitive object={line} />;
}