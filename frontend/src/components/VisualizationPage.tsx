import { useEffect, useMemo, useState } from 'react';
import { SpaceObject } from '../types';
import { SpaceScene } from './visualization/SpaceScene';
import { useDebrisData } from '../hooks/useDebrisData';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

function parseTle(value: unknown) {
  if (typeof value === 'string') {
    const lines = value
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length >= 2) {
      const line1 = lines.find((line) => line.startsWith('1 '));
      const line2 = lines.find((line) => line.startsWith('2 '));
      if (line1 && line2) {
        return { line1, line2 };
      }

      return { line1: lines[0], line2: lines[1] };
    }
  }

  if (Array.isArray(value) && value.length >= 2) {
    return { line1: String(value[0]), line2: String(value[1]) };
  }

  return null;
}

type VisualizationPageProps = {
  objects: SpaceObject[];
};

export function VisualizationPage({ objects }: VisualizationPageProps) {
  const { debris: backendDebris } = useDebrisData();

  const visualizerBaseSatellites = useMemo(() => {
    const allSatellites = objects.filter((object) => object.type === 'satellite');
    const foxBase = allSatellites.find((object) => object.name.toLowerCase().includes('fox')) ?? allSatellites[0];

    if (!foxBase) {
      return [] as SpaceObject[];
    }

    const foxSatellite: SpaceObject = {
      ...foxBase,
      id: 'fox-1a-vis',
      name: 'FOX-1A (AO-85)',
      // Use a different NORAD ID from ISS so FOX and SPACE STATION don't overlap.
      noradId: 40967,
      orbit: {
        kind: 'elements',
        elements: {
          inclinationDeg: 97.4,
          raanDeg: 161.9,
          phaseDeg: 193.3,
          angularVelocityDeg: 3.74,
        },
      },
      color: '#22d3ee',
    };

    const spaceStation: SpaceObject = {
      ...foxBase,
      id: 'space-station-vis',
      name: 'SPACE STATION',
      noradId: 25544,
      color: '#60a5fa',
      status: 'Nominal',
      telemetry: {
        ...foxBase.telemetry,
        velocity: 7.66,
      },
    };

    return [foxSatellite, spaceStation];
  }, [objects]);

  // Convert backend debris to SpaceObject format with color coding by risk level
  const backendDebrisObjects = useMemo(() => {
    return backendDebris.map((d) => {
      const riskColor = 
        d.risk_level === 'Critical' ? '#ef4444' :
        d.risk_level === 'High' ? '#f97316' :
        d.risk_level === 'Medium' ? '#eab308' :
        '#22c55e';

      const debrisStatus: 'Nominal' | 'Watch' | 'Avoidance' = 
        d.risk_level === 'Critical' ? 'Avoidance' :
        d.risk_level === 'High' ? 'Watch' :
        'Nominal';

      return {
        id: d.id,
        name: d.name,
        type: 'debris' as const,
        altitude: d.altitude,
        orbit: {
          kind: 'elements' as const,
          elements: {
            inclinationDeg: d.inclination,
            raanDeg: d.raan,
            phaseDeg: d.phase,
            angularVelocityDeg: d.angular_velocity,
          },
        },
        size: 0.024,
        color: riskColor,
        status: debrisStatus,
        telemetry: {
          battery: 0,
          temperature: 0,
          velocity: d.velocity,
          signal: 0,
        },
      } as SpaceObject;
    });
  }, [backendDebris]);

  const [liveSatellites, setLiveSatellites] = useState<SpaceObject[]>(visualizerBaseSatellites);
  const [selectedSatelliteId, setSelectedSatelliteId] = useState<string>('all');

  useEffect(() => {
    setLiveSatellites(visualizerBaseSatellites);
  }, [visualizerBaseSatellites]);

  useEffect(() => {
    let cancelled = false;

    const refreshLiveSatellites = async () => {
      const baseSatellites = visualizerBaseSatellites;

      const updatedSatellites = await Promise.all(
        baseSatellites.map(async (object) => {
          if (!object.noradId) {
            return object;
          }

          try {
            const response = await fetch(`${API_BASE_URL}/api/satellites/${object.noradId}/tle`);
            if (!response.ok) {
              return object;
            }

            const data = await response.json();
            const tle = parseTle(data.tle);
            if (!tle) {
              return object;
            }

            return {
              ...object,
              name: object.name,
              orbit: {
                kind: 'tle' as const,
                line1: tle.line1,
                line2: tle.line2,
              },
            };
          } catch {
            return object;
          }
        }),
      );

      if (!cancelled) {
        setLiveSatellites(updatedSatellites);
      }
    };

    void refreshLiveSatellites();
    const interval = window.setInterval(() => {
      void refreshLiveSatellites();
    }, 60000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [visualizerBaseSatellites]);

  const liveObjects = useMemo(() => [...liveSatellites, ...backendDebrisObjects], [liveSatellites, backendDebrisObjects]);

  const satellites = useMemo(() => liveSatellites.filter((object) => object.type === 'satellite'), [liveSatellites]);

  const visibleObjects = useMemo(() => {
    if (selectedSatelliteId === 'all') {
      return liveObjects;
    }

    return liveObjects.filter((object) => object.id === selectedSatelliteId || object.type === 'debris');
  }, [liveObjects, selectedSatelliteId]);

  return (
    <div className="relative">
      <div className="pointer-events-none absolute right-5 top-5 z-20 w-[280px] rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2.5 shadow-[0_0_28px_rgba(2,6,23,0.35)] backdrop-blur-xl">
        <label htmlFor="satellite-selector" className="block text-[10px] uppercase tracking-[0.2em] text-cyan-200/80">
          Satellite
        </label>
        <select
          id="satellite-selector"
          value={selectedSatelliteId}
          onChange={(event) => setSelectedSatelliteId(event.target.value)}
          className="pointer-events-auto mt-1.5 w-full rounded-lg border border-cyan-300/20 bg-slate-950/85 px-2.5 py-1.5 text-sm text-slate-100 outline-none ring-cyan-300/40 transition focus:ring-2"
        >
          <option value="all">All satellites</option>
          {satellites.map((satellite) => (
            <option key={satellite.id} value={satellite.id}>
              {satellite.name}
            </option>
          ))}
        </select>
      </div>

      <SpaceScene objects={visibleObjects} focusObjectId={selectedSatelliteId === 'all' ? null : selectedSatelliteId} />
    </div>
  );
}