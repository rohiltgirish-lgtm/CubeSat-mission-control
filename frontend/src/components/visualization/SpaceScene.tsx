import { Html, OrbitControls, Stars } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { Suspense, useEffect, useMemo, useState } from 'react';
import * as THREE from 'three';
import { SpaceObject } from '../../types';
import { Earth } from './Earth';
import { OrbitObject } from './OrbitObject';
import { getObjectGeodeticPosition } from './spaceMath';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

type LiveSatellitePosition = {
  latitudeDeg: number;
  longitudeDeg: number;
  altitudeKm: number;
  velocityKms: number;
  fetchedAt: number;
};

type SpaceSceneProps = {
  objects: SpaceObject[];
  focusObjectId?: string | null;
};

export function SpaceScene({ objects, focusObjectId = null }: SpaceSceneProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selected, setSelected] = useState<SpaceObject | null>(null);
  const [livePosition, setLivePosition] = useState<LiveSatellitePosition | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      setElapsedSeconds((Date.now() - startedAt) / 1000);
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;

    if (!selected) {
      setLivePosition(null);
      return () => {
        cancelled = true;
      };
    }

    if (!selected.noradId) {
      return () => {
        cancelled = true;
      };
    }

    const fetchLivePosition = async () => {
      if (!selected?.noradId) {
        return;
      }
      
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/satellites/${selected.noradId}/positions?lat=0&lng=0&alt=0&seconds=2`,
        );

        if (!response.ok) {
          console.warn(`Failed to fetch satellite position: ${response.statusText}`);
          return;
        }

        const data = await response.json();
        const positions = Array.isArray(data.positions) ? data.positions : [];
        const latest = positions[positions.length - 1];

        if (!latest) {
          return;
        }

        const latitude = Number(latest.satlatitude);
        const longitude = Number(latest.satlongitude);
        const altitude = Number(latest.sataltitude);
        const velocity = Number(latest.satvelocity);

        if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || !Number.isFinite(altitude) || !Number.isFinite(velocity)) {
          console.warn('Invalid satellite position data received from API');
          return;
        }

        if (!cancelled) {
          setLivePosition({
            latitudeDeg: latitude,
            longitudeDeg: longitude,
            altitudeKm: altitude,
            velocityKms: velocity,
            fetchedAt: Date.now(),
          });
        }
      } catch (err) {
        console.warn('Error fetching live satellite position:', err instanceof Error ? err.message : String(err));
      }
    };

    void fetchLivePosition();
    const timer = window.setInterval(fetchLivePosition, 12000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [selected?.id, selected?.noradId]);

  const selectedIndex = useMemo(() => {
    if (!selected) {
      return -1;
    }
    return objects.findIndex((object) => object.id === selected.id);
  }, [objects, selected]);

  const computedPosition = useMemo(() => {
    if (!selected || selectedIndex < 0) {
      return null;
    }

    return getObjectGeodeticPosition(selected, elapsedSeconds, selectedIndex);
  }, [selected, selectedIndex, elapsedSeconds]);

  useEffect(() => {
    setSelected((current) => {
      if (focusObjectId) {
        const focusedObject = objects.find((object) => object.id === focusObjectId) ?? null;
        return focusedObject;
      }

      if (current && !objects.some((object) => object.id === current.id)) {
        return null;
      }

      return current;
    });
  }, [focusObjectId, objects]);

  return (
    <div className="relative h-[calc(100vh-4.5rem)] min-h-[760px] w-full overflow-hidden rounded-none lg:rounded-[2rem]">
      <Canvas
        camera={{ position: [0, 2.6, 7.2], fov: 46 }}
        dpr={[1, 1.8]}
        gl={{ antialias: true }}
        onCreated={({ gl }) => {
          const renderer = gl as THREE.WebGLRenderer & { physicallyCorrectLights?: boolean };
          renderer.physicallyCorrectLights = true;
          renderer.toneMapping = THREE.ACESFilmicToneMapping;
          renderer.toneMappingExposure = 1.12;
        }}
      >
        <color attach="background" args={['#020617']} />
        <fog attach="fog" args={['#020617', 9, 24]} />
        <ambientLight intensity={0.5} />
        <hemisphereLight args={['#bfdbfe', '#020617', 0.46]} />
        <directionalLight position={[10, 4, 8]} intensity={2.7} color="#fff7ed" />
        <directionalLight position={[-6, 2, -7]} intensity={0.95} color="#dbeafe" />
        <pointLight position={[-7, -2, -3]} intensity={0.45} color="#1d4ed8" />
        <Stars radius={140} depth={70} count={4200} factor={4} saturation={0} fade speed={0.4} />
        <Suspense
          fallback={
            <Html center>
              <div className="rounded-2xl border border-cyan-400/20 bg-slate-950/85 px-4 py-3 text-sm text-cyan-200 shadow-glow">
                Loading orbital scene...
              </div>
            </Html>
          }
        >
          <Earth />
          {objects.map((object, index) => (
            <OrbitObject
              key={object.id}
              object={object}
              index={index}
              hoveredId={hoveredId}
              selectedId={selected?.id ?? null}
              onHover={setHoveredId}
              onSelect={setSelected}
            />
          ))}
        </Suspense>
        <OrbitControls
          makeDefault
          enablePan={false}
          enableZoom
          enableRotate
          enableDamping
          dampingFactor={0.08}
          rotateSpeed={0.65}
          zoomSpeed={0.8}
          target={[0, 0.35, 0]}
          minDistance={3.4}
          maxDistance={12.2}
          minPolarAngle={Math.PI * 0.16}
          maxPolarAngle={Math.PI * 0.84}
        />
      </Canvas>

      {selected && (
        <div className="absolute right-5 top-24 w-[360px] rounded-2xl border border-cyan-300/20 bg-slate-950/78 p-5 shadow-[0_0_30px_rgba(34,211,238,0.14)] backdrop-blur-xl">
          <div className="text-[11px] uppercase tracking-[0.32em] text-cyan-200/80">Object Telemetry</div>
          <h3 className="mt-2 text-3xl font-semibold leading-tight text-white">{selected.name}</h3>
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="text-slate-400">Status</div>
              <div className="mt-1 text-base text-white">{selected.status}</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="text-slate-400">Type</div>
              <div className="mt-1 text-base text-white">{selected.type}</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="text-slate-400">Latitude</div>
              <div className="mt-1 text-base text-white">
                {livePosition
                  ? `${livePosition.latitudeDeg.toFixed(2)} deg`
                  : computedPosition
                    ? `${computedPosition.latitudeDeg.toFixed(2)} deg`
                    : 'N/A'}
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="text-slate-400">Longitude</div>
              <div className="mt-1 text-base text-white">
                {livePosition
                  ? `${livePosition.longitudeDeg.toFixed(2)} deg`
                  : computedPosition
                    ? `${computedPosition.longitudeDeg.toFixed(2)} deg`
                    : 'N/A'}
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="text-slate-400">Altitude</div>
              <div className="mt-1 text-base text-white">
                {livePosition
                  ? `${livePosition.altitudeKm.toFixed(0)} km`
                  : computedPosition
                    ? `${computedPosition.altitudeKm.toFixed(0)} km`
                    : `${selected.altitude} km`}
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="text-slate-400">Velocity</div>
              <div className="mt-1 text-base text-white">{livePosition ? `${livePosition.velocityKms.toFixed(2)} km/s` : `${selected.telemetry.velocity.toFixed(2)} km/s`}</div>
            </div>
            <div className="col-span-2 rounded-xl border border-cyan-300/20 bg-cyan-400/5 p-3">
              <div className="text-slate-400">Data source</div>
              <div className="mt-1 text-sm text-cyan-100">{livePosition ? 'Live N2YO positions API' : 'Live CelesTrak TLE (computed position)'}</div>
            </div>
          </div>
          <button onClick={() => setSelected(null)} className="mt-4 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 transition hover:bg-white/10">
            Close panel
          </button>
        </div>
      )}
    </div>
  );
}