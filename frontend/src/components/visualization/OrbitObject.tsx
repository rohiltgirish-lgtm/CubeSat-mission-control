import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { SpaceObject } from '../../types';
import { getObjectState } from './spaceMath';

type OrbitObjectProps = {
  object: SpaceObject;
  selectedId: string | null;
  hoveredId: string | null;
  onHover: (id: string | null) => void;
  onSelect: (object: SpaceObject) => void;
  index: number;
};

export function OrbitObject({ object, selectedId, hoveredId, onHover, onSelect, index }: OrbitObjectProps) {
  const groupRef = useRef<THREE.Group>(null);
  const haloRef = useRef<THREE.Mesh>(null);
  const baseColor = useMemo(() => new THREE.Color(object.color), [object.color]);
  const latestGeodetic = useRef({ latitudeDeg: 0, longitudeDeg: 0, altitudeKm: object.altitude });

  useFrame(({ clock }) => {
    const elapsed = clock.getElapsedTime();
    const state = getObjectState(object, elapsed, index);
    const position = state.position;
    latestGeodetic.current = state;
    if (groupRef.current) {
      groupRef.current.position.copy(position);
      if (object.type === 'satellite') {
        groupRef.current.rotation.y = elapsed * 0.22 + index * 0.8;
        groupRef.current.rotation.z = Math.sin(elapsed * 0.22 + index) * 0.05;
      }
    }
    if (haloRef.current) {
      haloRef.current.position.copy(position);
    }
  });

  const isSelected = selectedId === object.id;
  const isHovered = hoveredId === object.id;
  const panelColor = useMemo(() => new THREE.Color('#60a5fa'), []);

  const interactionProps = {
    onPointerOver: (event: { stopPropagation: () => void }) => {
      event.stopPropagation();
      onHover(object.id);
    },
    onPointerOut: () => onHover(null),
    onClick: (event: { stopPropagation: () => void }) => {
      event.stopPropagation();
      onSelect(object);
    },
  };

  return (
    <group>
      <group ref={groupRef}>
        {object.type === 'satellite' ? (
          <group>
            <mesh {...interactionProps}>
              <boxGeometry args={[object.size * 1.35, object.size, object.size * 0.95]} />
              <meshStandardMaterial
                color={isHovered || isSelected ? '#dbeafe' : '#cbd5e1'}
                emissive={isHovered || isSelected ? '#0ea5e9' : '#0f172a'}
                emissiveIntensity={isHovered || isSelected ? 0.22 : 0.08}
                roughness={0.32}
                metalness={0.82}
              />
            </mesh>

            <mesh position={[-object.size * 1.2, 0, 0]} {...interactionProps}>
              <boxGeometry args={[object.size * 1.3, object.size * 0.12, object.size * 0.78]} />
              <meshStandardMaterial color={panelColor} emissive={panelColor} emissiveIntensity={0.18} roughness={0.2} metalness={0.95} />
            </mesh>

            <mesh position={[object.size * 1.2, 0, 0]} {...interactionProps}>
              <boxGeometry args={[object.size * 1.3, object.size * 0.12, object.size * 0.78]} />
              <meshStandardMaterial color={panelColor} emissive={panelColor} emissiveIntensity={0.18} roughness={0.2} metalness={0.95} />
            </mesh>

            <mesh position={[0, object.size * 0.82, 0]} rotation={[Math.PI, 0, 0]} {...interactionProps}>
              <sphereGeometry args={[object.size * 0.34, 18, 18, 0, Math.PI * 2, 0, Math.PI / 2]} />
              <meshStandardMaterial color="#e2e8f0" emissive="#0ea5e9" emissiveIntensity={0.08} roughness={0.42} metalness={0.78} />
            </mesh>

            <mesh position={[0, object.size * 1.12, 0]} {...interactionProps}>
              <cylinderGeometry args={[object.size * 0.04, object.size * 0.04, object.size * 0.62, 10]} />
              <meshStandardMaterial color="#94a3b8" emissive="#0ea5e9" emissiveIntensity={0.05} roughness={0.45} metalness={0.9} />
            </mesh>
          </group>
        ) : (
          <mesh {...interactionProps}>
            <sphereGeometry args={[object.size, 24, 24]} />
            <meshStandardMaterial
              color={isHovered || isSelected ? '#f8fafc' : baseColor}
              emissive={baseColor}
              emissiveIntensity={1.0}
              roughness={0.25}
              metalness={0.45}
            />
          </mesh>
        )}
      </group>

      <mesh ref={haloRef} scale={1.8}>
        <sphereGeometry args={[object.size, 20, 20]} />
        <meshBasicMaterial color={object.color} transparent opacity={0.14} />
      </mesh>
      {(isHovered || isSelected) && (
        <Html distanceFactor={14} position={[0, object.size + 0.12, 0]} center>
          <div className="pointer-events-none w-52 rounded-2xl border border-cyan-300/25 bg-slate-950/90 p-3 text-white shadow-[0_0_24px_rgba(34,211,238,0.2)] backdrop-blur-xl">
            <div className="text-[10px] uppercase tracking-[0.22em] text-cyan-200/80">Track Object</div>
            <div className="mt-1 text-sm font-semibold">{object.name}</div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
              <div className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-slate-200">{object.status}</div>
              <div className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-slate-200">{object.type}</div>
            </div>
            <div className="mt-2 space-y-1 text-[11px] text-slate-300">
              <div>Lat: {latestGeodetic.current.latitudeDeg.toFixed(2)} deg</div>
              <div>Lon: {latestGeodetic.current.longitudeDeg.toFixed(2)} deg</div>
              <div>Alt: {latestGeodetic.current.altitudeKm.toFixed(0)} km</div>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}