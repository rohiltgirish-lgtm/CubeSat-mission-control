import { AlertItem, CollisionSummary, SatelliteSummary, SpaceObject, TelemetryPoint } from '../types';
import testDataCsv from './test_data.csv?raw';

type ConjunctionEvent = {
  eventId: string;
  missionId: string;
  risk: number;
  missDistanceMeters: number;
  relativeSpeed: number;
  timeToTcaHours: number;
};

function toNumber(value: string | undefined): number | null {
  if (value === undefined || value === '') {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function severityFromRisk(risk: number): AlertItem['severity'] {
  if (risk <= -10) {
    return 'Critical';
  }
  if (risk <= -8) {
    return 'High';
  }
  if (risk <= -6) {
    return 'Medium';
  }
  return 'Low';
}

function collisionLevelFromEvent(event: ConjunctionEvent): CollisionSummary['riskLevel'] {
  const missDistanceKm = event.missDistanceMeters / 1000;
  if (missDistanceKm < 1 || event.risk <= -8) {
    return 'High';
  }
  if (missDistanceKm < 5 || event.risk <= -6) {
    return 'Medium';
  }
  return 'Low';
}

function formatHoursToWindow(hours: number): string {
  const totalMinutes = Math.max(0, Math.round(hours * 60));
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}h ${m}m`;
}

function parseConjunctionEvents(csv: string): ConjunctionEvent[] {
  const lines = csv.trim().split(/\r?\n/);
  if (lines.length < 2) {
    return [];
  }

  const headers = lines[0].split(',');
  const indexOf = (name: string) => headers.indexOf(name);

  const eventIdIndex = indexOf('event_id');
  const missionIdIndex = indexOf('mission_id');
  const riskIndex = indexOf('risk');
  const missDistanceIndex = indexOf('miss_distance');
  const relativeSpeedIndex = indexOf('relative_speed');
  const timeToTcaIndex = indexOf('time_to_tca');

  if (
    eventIdIndex < 0 ||
    missionIdIndex < 0 ||
    riskIndex < 0 ||
    missDistanceIndex < 0 ||
    relativeSpeedIndex < 0 ||
    timeToTcaIndex < 0
  ) {
    return [];
  }

  const byEvent = new Map<string, ConjunctionEvent>();

  for (let i = 1; i < lines.length; i += 1) {
    const cells = lines[i].split(',');
    const eventId = cells[eventIdIndex];
    const missionId = cells[missionIdIndex];
    const risk = toNumber(cells[riskIndex]);
    const missDistanceMeters = toNumber(cells[missDistanceIndex]);
    const relativeSpeed = toNumber(cells[relativeSpeedIndex]);
    const timeToTcaHours = toNumber(cells[timeToTcaIndex]);

    if (
      !eventId ||
      !missionId ||
      risk === null ||
      missDistanceMeters === null ||
      relativeSpeed === null ||
      timeToTcaHours === null
    ) {
      continue;
    }

    const current: ConjunctionEvent = {
      eventId,
      missionId,
      risk,
      missDistanceMeters,
      relativeSpeed,
      timeToTcaHours,
    };

    const previous = byEvent.get(eventId);
    if (!previous || current.risk < previous.risk) {
      byEvent.set(eventId, current);
    }
  }

  return [...byEvent.values()];
}

const csvEvents = parseConjunctionEvents(testDataCsv);
const topRiskEvents = [...csvEvents].sort((a, b) => a.risk - b.risk);
const nearestEvent = [...csvEvents].sort((a, b) => a.timeToTcaHours - b.timeToTcaHours)[0];

export const sidebarItems = [
  'Dashboard',
  'Telemetry',
  'Collision Alerts',
  '3D Visualization',
  'Satellites',
  'Settings',
] as const;

export const satelliteStatus: SatelliteSummary = {
  name: 'FOX-1A (AO-85)',
  health: 'Nominal',
  lastUpdated: 'T+ 00:01:24',
};

export const initialTelemetry: TelemetryPoint[] = [
  { time: '00:00', temperature: 18.2, voltage: 4.1, signal: 91 },
  { time: '00:01', temperature: 18.6, voltage: 4.08, signal: 92 },
  { time: '00:02', temperature: 19.1, voltage: 4.06, signal: 90 },
  { time: '00:03', temperature: 19.7, voltage: 4.03, signal: 89 },
  { time: '00:04', temperature: 20.3, voltage: 4.01, signal: 88 },
  { time: '00:05', temperature: 21.0, voltage: 3.98, signal: 87 },
  { time: '00:06', temperature: 21.4, voltage: 3.97, signal: 86 },
  { time: '00:07', temperature: 22.1, voltage: 3.95, signal: 85 },
];

export const collisionSummary: CollisionSummary = {
  closestObject: nearestEvent ? `Mission ${nearestEvent.missionId} / Event ${nearestEvent.eventId}` : 'Debris Cluster D-41',
  timeToClosestApproach: nearestEvent ? formatHoursToWindow(nearestEvent.timeToTcaHours) : '14m 38s',
  distanceKm: nearestEvent ? nearestEvent.missDistanceMeters / 1000 : 0.82,
  riskLevel: nearestEvent ? collisionLevelFromEvent(nearestEvent) : 'High',
};

export const initialAlerts: AlertItem[] = [];

export const spaceObjects: SpaceObject[] = [
  {
    id: 'cube-01',
    name: 'FOX-1A (AO-85)',
    type: 'satellite',
    noradId: 25544,
    altitude: 540,
    orbit: {
      kind: 'tle',
      line1: '1 25544U 98067A   26098.52920139  .00015764  00000+0  28407-3 0  9994',
      line2: '2 25544  51.6418 169.2234 0003945  77.5534 282.5799 15.50083714509540',
    },
    size: 0.12,
    color: '#22d3ee',
    status: 'Nominal',
    telemetry: { battery: 86, temperature: 21.4, velocity: 7.62, signal: 94 },
  },


];