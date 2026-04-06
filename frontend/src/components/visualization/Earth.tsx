import { useEffect, useMemo } from 'react';
import { useLoader } from '@react-three/fiber';
import * as THREE from 'three';

export function Earth() {
  const normalScale = useMemo(() => new THREE.Vector2(0.45, 0.45), []);
  const [colorMap, normalMap, specularMap] = useLoader(THREE.TextureLoader, [
    '/textures/planets/earth_atmos_2048.jpg',
    '/textures/planets/earth_normal_2048.jpg',
    '/textures/planets/earth_specular_2048.jpg',
  ]);

  useEffect(() => {
    colorMap.colorSpace = THREE.SRGBColorSpace;
    colorMap.anisotropy = 8;
    normalMap.anisotropy = 8;
    specularMap.anisotropy = 8;

    return () => {
      colorMap.dispose();
      normalMap.dispose();
      specularMap.dispose();
    };
  }, [colorMap, normalMap, specularMap]);

  return (
    <group rotation={[0, 0, THREE.MathUtils.degToRad(23.4)]}>
      <mesh>
        <sphereGeometry args={[1.7, 64, 64]} />
        <meshPhongMaterial
          map={colorMap}
          normalMap={normalMap}
          normalScale={normalScale}
          specularMap={specularMap}
          specular={new THREE.Color('#475569')}
          shininess={18}
        />
      </mesh>
      <mesh scale={1.04}>
        <sphereGeometry args={[1.7, 64, 64]} />
        <meshBasicMaterial color="#93c5fd" transparent opacity={0.08} side={THREE.BackSide} />
      </mesh>
      <mesh scale={1.12}>
        <sphereGeometry args={[1.7, 64, 64]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.04} side={THREE.BackSide} />
      </mesh>
    </group>
  );
}